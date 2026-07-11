#!/usr/bin/env node
// Robô de publicação automática no Instagram (Graph API).
// Lê a fila em queue.json e publica os posts cujo horário já chegou.
// Roda sem dependências externas (Node 18+, usa fetch nativo).
//
// Variáveis de ambiente necessárias:
//   IG_USER_ID       -> ID da conta profissional do Instagram (IG Business)
//   IG_ACCESS_TOKEN  -> token de acesso de longa duração com permissões de publicação
// Opcionais:
//   DRY_RUN=1        -> não publica de verdade, só simula e mostra o que faria
//   PAUSE=1          -> pausa total: não publica nada (interruptor de emergência)
//   GRAPH_VERSION    -> versão da Graph API (padrão v21.0)

import { readFile, writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = join(__dirname, "queue.json");

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || "v21.0"}`;
const IG_USER_ID = process.env.IG_USER_ID;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const DRY_RUN = process.env.DRY_RUN === "1";
const PAUSE = process.env.PAUSE === "1";

// Não publica posts atrasados há mais de MAX_LATE_HOURS (evita "ressuscitar"
// posts antigos se o robô ficar parado uns dias).
const MAX_LATE_HOURS = 48;

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

// Expõe o resultado da execução para o GitHub Actions (passo de notificação).
async function writeOutputs({ published = 0, errors = 0, results = [] }) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = results.length
    ? results.map((r) => `- ${r.id}: ${r.outcome}${r.detail ? ` (${r.detail})` : ""}`).join("\n")
    : "Nenhuma publicação nesta execução.";
  const out = [
    `published=${published}`,
    `errors=${errors}`,
    `summary<<__SUMMARY__\n${lines}\n__SUMMARY__`,
  ].join("\n");
  await appendFile(process.env.GITHUB_OUTPUT, out + "\n");
}

async function graph(path, params, method = "POST") {
  const url = new URL(`${GRAPH}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const opts =
    method === "GET"
      ? { method }
      : { method, body, headers: { "Content-Type": "application/x-www-form-urlencoded" } };
  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("access_token", TOKEN);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Aguarda o container de vídeo/Reels terminar o processamento antes de publicar.
async function waitContainerReady(containerId, { tries = 20, delayMs = 6000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const data = await graph(containerId, { fields: "status_code,status" }, "GET");
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") throw new Error(`Processamento falhou: ${data.status}`);
    log(`  ...container ${containerId} em processamento (${data.status_code}), aguardando`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Timeout esperando o processamento do vídeo");
}

async function publishImage(post) {
  const url = post.image_urls?.[0];
  if (!url) throw new Error("image_urls[0] vazio");
  const container = await graph(`${IG_USER_ID}/media`, { image_url: url, caption: post.caption });
  await waitContainerReady(container.id).catch(() => {}); // imagem normalmente já vem pronta
  const pub = await graph(`${IG_USER_ID}/media_publish`, { creation_id: container.id });
  return pub.id;
}

async function publishCarousel(post) {
  const urls = post.image_urls || [];
  if (urls.length < 2) throw new Error("carrossel precisa de pelo menos 2 imagens");
  const childIds = [];
  for (const image_url of urls) {
    const child = await graph(`${IG_USER_ID}/media`, { image_url, is_carousel_item: "true" });
    childIds.push(child.id);
  }
  const container = await graph(`${IG_USER_ID}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption: post.caption,
  });
  const pub = await graph(`${IG_USER_ID}/media_publish`, { creation_id: container.id });
  return pub.id;
}

async function publishReels(post) {
  if (!post.video_url) throw new Error("video_url vazio para reels");
  const container = await graph(`${IG_USER_ID}/media`, {
    media_type: "REELS",
    video_url: post.video_url,
    caption: post.caption,
    ...(post.cover_url ? { cover_url: post.cover_url } : {}),
  });
  await waitContainerReady(container.id);
  const pub = await graph(`${IG_USER_ID}/media_publish`, { creation_id: container.id });
  return pub.id;
}

const PUBLISHERS = { image: publishImage, carousel: publishCarousel, reels: publishReels };

// Resolve uma mídia: se já for URL http(s), usa direto; senão, prefixa com a
// base pública da fila (ex.: raw.githubusercontent.com/.../midia/).
function resolveMedia(value, base) {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (!base) throw new Error(`"${value}" não é URL e media_base_url não está definido`);
  return base.replace(/\/$/, "") + "/" + value.replace(/^\//, "");
}

// Devolve uma cópia do post com todas as mídias resolvidas para URL pública.
function withResolvedMedia(post, base) {
  return {
    ...post,
    image_urls: (post.image_urls || []).map((u) => resolveMedia(u, base)),
    video_url: resolveMedia(post.video_url, base),
    cover_url: resolveMedia(post.cover_url, base),
  };
}

async function main() {
  const raw = await readFile(QUEUE_PATH, "utf8");
  const queue = JSON.parse(raw);
  const now = Date.now();
  let changed = false;
  let publishedCount = 0;
  const results = []; // { id, outcome, detail } para o resumo/notificação

  if (PAUSE) {
    log("PAUSE=1 ativo — robô pausado, nada será publicado.");
    await writeOutputs({});
    return;
  }
  if (!DRY_RUN && (!IG_USER_ID || !TOKEN)) {
    throw new Error("Faltam IG_USER_ID e/ou IG_ACCESS_TOKEN no ambiente.");
  }

  const due = (queue.posts || []).filter((p) => {
    if (p.status !== "pending") return false;
    const t = new Date(p.scheduled_at).getTime();
    if (Number.isNaN(t)) {
      log(`Post ${p.id}: scheduled_at inválido, ignorando.`);
      return false;
    }
    return t <= now;
  });

  if (due.length === 0) {
    log("Nenhum post para publicar agora.");
    await writeOutputs({});
    return;
  }

  for (const post of due) {
    const lateHours = (now - new Date(post.scheduled_at).getTime()) / 3.6e6;
    if (lateHours > MAX_LATE_HOURS) {
      log(`Post ${post.id}: atrasado ${lateHours.toFixed(0)}h (>${MAX_LATE_HOURS}h), marcando como skipped.`);
      post.status = "skipped";
      post.note = `pulado por atraso de ${lateHours.toFixed(0)}h`;
      results.push({ id: post.id, outcome: "skipped", detail: post.note });
      changed = true;
      continue;
    }
    const publisher = PUBLISHERS[post.type];
    if (!publisher) {
      log(`Post ${post.id}: tipo desconhecido "${post.type}", marcando erro.`);
      post.status = "error";
      post.error = `tipo desconhecido: ${post.type}`;
      results.push({ id: post.id, outcome: "error", detail: post.error });
      changed = true;
      continue;
    }
    try {
      log(`Publicando ${post.id} (${post.type})...`);
      const resolved = withResolvedMedia(post, queue.media_base_url);
      if (DRY_RUN) {
        log(`  [DRY_RUN] publicaria: ${JSON.stringify({ type: resolved.type, image_urls: resolved.image_urls, video_url: resolved.video_url })}`);
        post.status = "dry_run_ok";
      } else {
        const mediaId = await publisher(resolved);
        post.status = "published";
        post.published_at = new Date().toISOString();
        post.instagram_media_id = mediaId;
        publishedCount++;
        results.push({ id: post.id, outcome: "published", detail: `media_id=${mediaId}` });
        log(`  ✓ publicado: media_id=${mediaId}`);
      }
      changed = true;
    } catch (err) {
      log(`  ✗ erro ao publicar ${post.id}: ${err.message}`);
      post.status = "error";
      post.error = err.message;
      post.last_attempt = new Date().toISOString();
      results.push({ id: post.id, outcome: "error", detail: err.message });
      changed = true;
    }
  }

  if (changed) {
    await writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2) + "\n");
    log(`Fila atualizada. Publicados nesta execução: ${publishedCount}.`);
  }

  const errorCount = results.filter((r) => r.outcome === "error").length;
  await writeOutputs({ published: publishedCount, errors: errorCount, results });
}

main().catch((err) => {
  console.error("Falha geral:", err.message);
  process.exit(1);
});

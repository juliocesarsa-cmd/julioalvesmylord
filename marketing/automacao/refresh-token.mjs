#!/usr/bin/env node
// Renova o token de acesso de longa duração do Instagram/Facebook.
// Troca o token atual por um novo (válido ~60 dias) via fb_exchange_token.
// O novo token é exposto como output do GitHub Actions para ser gravado de
// volta no secret IG_ACCESS_TOKEN (ver workflow instagram-token-refresh.yml).
//
// Variáveis de ambiente necessárias:
//   IG_APP_ID        -> ID do app no Meta for Developers
//   IG_APP_SECRET    -> segredo do app
//   IG_ACCESS_TOKEN  -> token de longa duração atual
// Opcional:
//   GRAPH_VERSION    -> versão da Graph API (padrão v21.0)

import { appendFile } from "node:fs/promises";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || "v21.0"}`;
const { IG_APP_ID, IG_APP_SECRET, IG_ACCESS_TOKEN } = process.env;

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

async function main() {
  if (!IG_APP_ID || !IG_APP_SECRET || !IG_ACCESS_TOKEN) {
    throw new Error("Faltam IG_APP_ID, IG_APP_SECRET e/ou IG_ACCESS_TOKEN.");
  }

  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", IG_APP_ID);
  url.searchParams.set("client_secret", IG_APP_SECRET);
  url.searchParams.set("fb_exchange_token", IG_ACCESS_TOKEN);

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data?.error?.message || `Falha ao renovar token (HTTP ${res.status})`);
  }

  const days = data.expires_in ? Math.round(data.expires_in / 86400) : "desconhecido";
  log(`Token renovado com sucesso. Validade: ~${days} dias.`);

  if (process.env.GITHUB_OUTPUT) {
    // Mascara o token nos logs e o expõe como output para o passo seguinte.
    console.log(`::add-mask::${data.access_token}`);
    await appendFile(process.env.GITHUB_OUTPUT, `new_token=${data.access_token}\n`);
    await appendFile(process.env.GITHUB_OUTPUT, `expires_days=${days}\n`);
  } else {
    log("GITHUB_OUTPUT não definido — rodando fora do Actions, token não gravado.");
  }
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});

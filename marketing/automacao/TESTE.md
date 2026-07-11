# 🧪 Rodar o post de teste de ponta a ponta

Pré-requisito: ter feito o `SETUP-TOKEN.md` (secrets `IG_USER_ID` e
`IG_ACCESS_TOKEN` configurados).

## Passo 1 — Merge do PR

O cron e o disparo manual do GitHub Actions rodam a partir do **branch padrão**.
Faça o **merge do PR #1** para `claude/remote-control-ux38B` antes de testar.

## Passo 2 — Hospedar a imagem de teste

Suba uma imagem (qualquer JPG no formato de feed, ex.: 1080x1350) para um link
público. Opções rápidas:
- **Cloudinary** (grátis): upload → copie o link `https://res.cloudinary.com/...`
- **Imgur**, **Supabase Storage**, ou um bucket S3 público.

> Requisitos da imagem: JPG, proporção entre 4:5 e 1.91:1, acessível sem login.

## Passo 3 — Ativar o post de teste

No `marketing/automacao/queue.json`, encontre o post `teste-publicacao` e:
1. Cole a URL pública em `image_urls`, por exemplo:
   ```json
   "image_urls": ["https://res.cloudinary.com/seu-link/teste.jpg"],
   ```
2. Mude `"status": "draft"` para `"status": "pending"`.
3. Commit + push para o branch padrão.

## Passo 4 — Disparar

- **Pelo GitHub:** aba **Actions → Instagram Autopost → Run workflow**
  (deixe `dry_run = 0` para publicar de verdade).
- **Ou me peça** que eu disparo o workflow pra você e acompanho o resultado.

## Passo 5 — Conferir

- O post deve aparecer no seu Instagram em segundos.
- No `queue.json`, o status do `teste-publicacao` vira `published` com o
  `instagram_media_id` (o robô commita isso de volta).
- Se algo falhar, o status vira `error` com a mensagem — me mande que eu ajusto.

## Primeiro teste sem publicar (opcional, recomendado)

Antes de publicar de verdade, rode com `dry_run = 1` no "Run workflow": ele
simula e mostra a chamada sem postar nada. Se aparecer o post de teste sendo
"publicado" na simulação, está tudo certo para o disparo real.

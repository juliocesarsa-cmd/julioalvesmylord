# 🤖 Robô de Publicação Automática no Instagram

Fluxo autônomo que publica no seu Instagram **sozinho**, no horário agendado,
sem você precisar fazer nada. O **GitHub Actions** roda o robô de hora em hora
(não é o Claude que fica ligado) e publica os posts da fila via **Instagram
Graph API**.

```
queue.json (fila de posts)  ──►  publish.mjs (robô)  ──►  Instagram Graph API
        ▲                                  ▲
        └── você abastece                  └── GitHub Actions roda de hora em hora
```

## ⚠️ Antes de tudo: o que "100% automático" significa

- O robô publica **sem revisão humana**. Garanta que a fila está sempre correta.
- Há **dois freios de emergência**:
  - Variável de repositório `PAUSE=1` (Settings → Secrets and variables →
    Actions → Variables) → pausa tudo na hora.
  - Status `draft` no post → o robô ignora até você mudar para `pending`.

## Pré-requisitos (configuração única)

### 1. Conta e app
1. Instagram em conta **Profissional** (Comercial ou Criador).
2. Uma **Página do Facebook** vinculada ao Instagram.
3. Crie um app em **developers.facebook.com** (tipo "Business") e adicione o
   produto **Instagram Graph API**.

### 2. Pegar as credenciais
Você precisa de dois valores:
- **`IG_USER_ID`** — o ID da sua conta profissional do Instagram.
- **`IG_ACCESS_TOKEN`** — um **token de longa duração** com as permissões
  `instagram_basic`, `instagram_content_publish`, `pages_show_list` e
  `business_management`.

> Use o **Graph API Explorer** para gerar o token de usuário, troque-o por um
> token de longa duração (~60 dias) e descubra o IG_USER_ID com:
> `GET /me/accounts` → pegue o `id` da página → `GET /{page-id}?fields=instagram_business_account`.

### 3. Guardar como segredos no GitHub
No repositório: **Settings → Secrets and variables → Actions → New repository secret**:
- `IG_USER_ID`
- `IG_ACCESS_TOKEN`

> 🔒 Nunca coloque o token no código nem no queue.json. Só nos Secrets.
> O token expira em ~60 dias — renove e atualize o secret quando isso acontecer.

## Como abastecer a fila (`queue.json`)

Cada post tem:

| Campo | O quê |
|-------|-------|
| `id` | identificador único |
| `scheduled_at` | data/hora ISO com fuso (ex.: `2026-06-22T12:30:00-03:00`) |
| `type` | `image`, `carousel` ou `reels` |
| `image_urls` | lista de **URLs públicas** das imagens (1 para image, 2+ para carousel) |
| `video_url` | **URL pública** do vídeo (só para `reels`) |
| `cover_url` | (opcional) URL pública da capa do Reels |
| `caption` | legenda completa com hashtags |
| `status` | `draft` → `pending` (para publicar) |

**Para ativar um post:**
1. Suba a imagem/vídeo para uma **URL pública** (veja abaixo).
2. Preencha `image_urls` (ou `video_url`).
3. Mude `status` de `"draft"` para `"pending"`.
4. Commit/push. Na próxima hora cheia o robô publica no horário marcado.

### Onde hospedar as imagens (precisam ser públicas)

A Graph API exige um **link público** da mídia (não aceita arquivo direto).
Opções:
- **Imagens no próprio repositório** (se ele for público): commit em
  `marketing/automacao/midia/` e use o link `https://raw.githubusercontent.com/<user>/<repo>/<branch>/caminho.jpg`.
- Um bucket público (Cloudinary, S3, Imgur, Supabase Storage).

> Exporte as artes no Canva (Compartilhar → Baixar → JPG) e hospede num desses.

## Testar antes de valer

- **Simulação local:** `DRY_RUN=1 node marketing/automacao/publish.mjs`
  (não publica nada, só mostra o que faria).
- **Simulação no GitHub:** aba **Actions → Instagram Autopost → Run workflow**,
  com `dry_run = 1`.

## Como funciona no dia a dia

1. Você mantém a fila abastecida (eu posso gerar os próximos posts).
2. O GitHub Actions roda **de hora em hora**.
3. Posts `pending` com horário vencido são publicados; o status vira
   `published` e volta commitado na fila.
4. Erros viram status `error` com a mensagem — é só olhar a fila.

## Reels (vídeo)

Reels precisam de **vídeo** (`video_url` público). Sem vídeo, deixe o post como
`draft` ou troque o `type` para `image` usando a arte estática. O robô espera o
processamento do vídeo terminar antes de publicar.

## Limitações honestas

- A Graph API publica imagem, carrossel e Reels — **não** publica Stories
  (isso depende de outras ferramentas).
- Há limite de ~50 publicações por 24h por conta (mais que suficiente aqui).
- Token expira em ~60 dias: configure um lembrete para renovar.

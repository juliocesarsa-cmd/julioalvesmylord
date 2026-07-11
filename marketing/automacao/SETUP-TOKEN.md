# 🔑 Como gerar IG_USER_ID e IG_ACCESS_TOKEN

Guia passo a passo para conseguir as duas credenciais que o robô precisa.
Tempo estimado: ~15 minutos.

## Pré-requisitos (faça antes)

1. **Instagram em conta Profissional** (Comercial ou Criador):
   Instagram → Configurações → Conta → Mudar para conta profissional.
2. **Página do Facebook vinculada** ao seu Instagram:
   no app do Instagram → Configurações → Central de Contas, ou pela Página do FB.
3. **App no Meta for Developers:**
   - Acesse https://developers.facebook.com/apps → **Criar app** → tipo **Empresa (Business)**.
   - Dentro do app, adicione o produto **Instagram** (Instagram Graph API).
   - Anote o **App ID** e o **App Secret** (em Configurações → Básico).

## Passo 1 — Abrir o Graph API Explorer

1. Vá em https://developers.facebook.com/tools/explorer
2. No topo direito, selecione o **seu app**.
3. Clique em **Generate Access Token / Get User Access Token**.
4. Marque estas permissões:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
5. Autorize. Você terá um **token de curta duração** (vale ~1–2h; vamos trocar).

## Passo 2 — Descobrir o IG_USER_ID

No próprio Explorer, rode estas chamadas (botão **Submit**):

1. `GET /me/accounts`
   → copie o **`id`** da sua Página do Facebook.
2. `GET /{PAGE_ID}?fields=instagram_business_account`
   (troque `{PAGE_ID}` pelo id acima)
   → o campo **`instagram_business_account.id`** é o seu **`IG_USER_ID`**. ✅

## Passo 3 — Trocar por um token de longa duração

Cole no navegador (troque `{APP_ID}`, `{APP_SECRET}`, `{TOKEN_CURTO}`):

```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={TOKEN_CURTO}
```

A resposta traz `access_token` — esse é o seu **`IG_ACCESS_TOKEN`** de longa
duração (~60 dias). ✅

> O workflow `instagram-token-refresh.yml` renova esse token sozinho todo mês,
> desde que você configure os secrets `IG_APP_ID`, `IG_APP_SECRET` e `GH_PAT`.

## Passo 4 — Salvar os Secrets no GitHub

No repositório → **Settings → Secrets and variables → Actions → New repository secret**:

| Nome | Valor |
|------|-------|
| `IG_USER_ID` | o id do Passo 2 |
| `IG_ACCESS_TOKEN` | o token do Passo 3 |

(Opcionais, para renovação automática e e-mail: `IG_APP_ID`, `IG_APP_SECRET`,
`GH_PAT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_TO`.)

## Passo 5 — Teste

Veja `TESTE.md` para rodar o post de teste de ponta a ponta.

## Dicas de problema comum

- **"Application does not have permission for this action":** faltou alguma
  permissão no Passo 1, ou o app não está com o produto Instagram adicionado.
- **Token expira rápido:** você usou o de curta duração; refaça o Passo 3.
- **A conta precisa estar como Profissional** e a Página realmente vinculada.

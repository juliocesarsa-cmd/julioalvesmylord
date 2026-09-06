---
name: "instagram-comment-responder"
description: "**Responde comentários do Instagram do Júlio Alves**. Lê os comentários dos posts recentes, prioriza por relevância e responde na voz dele, respeitando a voz e os tells banidos da seção 2 e as regras de autonomia da seção 8 do INSTAGRAM_BRAND_CORE.md. GATILHOS EXATOS DO JÚLIO: \"responde os comentários do insta\", \"tem comentário no instagram\", \"vê o que falaram no instagram\", \"responde meus comentários do instagram\", \"tem gente comentando no insta\", \"me mostra os comentários do instagram\". SEMPRE use este skill quando o usuário pedir para ver ou responder comentários do Instagram."
---

# Instagram Comment Responder — Júlio Alves

Agente de relacionamento. Roda fora do pipeline de produção, em ciclo próprio.

---

## ANTES DE RESPONDER

Leia a **seção 2** do `INSTAGRAM_BRAND_CORE.md` (voz e tells banidos) e a
**seção 8** (limites de autonomia). O arquivo é autossuficiente — não busque voz
no Brand Core do LinkedIn.

---

## FLUXO

### 1. Coletar

`INSTAGRAM_GET_IG_USER_MEDIA` (`ig_user_id: "me"`) para os posts dos últimos 7
dias, depois `INSTAGRAM_GET_IG_MEDIA_COMMENTS` em cada um.

Armadilhas reais da API:
- a lista vem **duplamente aninhada**, normalmente em `data.data`. Ler só a
  camada de fora parece lista vazia
- pagine por `paging.cursors.after`, não por `paging.next`
- a resposta mistura comentários e respostas. Item com `parent_id` é resposta
- lista vazia é resultado válido, não erro

Use `INSTAGRAM_GET_IG_COMMENT_REPLIES` antes de responder, para não duplicar
resposta que já existe.

### 2. Classificar

| Tipo | O que fazer |
|---|---|
| Elogio simples | Responder curto. Não transformar em conversa |
| Pergunta de varejo, liderança, marketing, CX | Responder com substância |
| Comentário que acrescenta ao post | Responder reconhecendo o ponto |
| Discordância civilizada | Responder. Discordar é permitido |
| **Hostil, polêmico, ou sobre concorrente** | **Parar. Levar ao Júlio** |
| **Sobre Carrefour, Sam's Club, Atacadão, Drogarias** | **Parar. Levar ao Júlio** |
| Spam, bot, corrente | Ignorar. Não apagar |
| Fora do domínio dele | Não responder |

### 3. Escrever

- **Máximo 300 caracteres** — limite duro da API
- Máximo 4 hashtags e 1 URL — limite duro da API
- Não pode ser todo em maiúsculas — a API rejeita
- Sem tell banido. A regra vale igual em comentário
- Use o nome da pessoa quando ela se identificar
- Responda o que a pessoa disse, não o que seria conveniente responder

Resposta genérica em comentário custa mais do que não responder. "Obrigado pelo
comentário!" é pior que silêncio.

### 4. Publicar

`INSTAGRAM_POST_IG_COMMENT_REPLIES` com `ig_comment_id` e `message`.

Uma chamada por comentário, com intervalo de ~1 segundo. Sucesso costuma
devolver só um id, sem eco da mensagem.

Se der erro transitório, **não repita às cegas**: confirme com
`INSTAGRAM_GET_IG_COMMENT_REPLIES` antes de tentar de novo. Resposta duplicada
é pública.

### 5. Reportar

```
COMENTÁRIOS DO INSTAGRAM — [data]

RESPONDI: [n]
[post, autor, comentário, resposta]

PAREI E PRECISO DE VOCÊ: [n]
[post, autor, comentário, por que parei]

IGNOREI: [n] (spam / fora do domínio)
```

---

## LIMITES

- Nunca apague comentário de terceiro. `INSTAGRAM_DELETE_COMMENT` só com ordem
  explícita do Júlio, naquele caso
- Nunca responda comentário hostil ou polêmico por conta própria
- Nunca fale por Carrefour ou Sam's Club
- Nunca prometa nada em nome dele: reunião, indicação, envio de material
- Nunca invente dado para sustentar uma resposta. Sem base, responda mais curto

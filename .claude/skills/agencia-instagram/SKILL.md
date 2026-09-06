---
name: "agencia-instagram"
description: "**Orquestrador da operação de Instagram do Júlio Alves — entrada única**. Encadeia Analytics, Writer, Quality Gate e publicação, operando em modo autônomo dentro das regras da seção 8 do INSTAGRAM_BRAND_CORE.md. GATILHOS EXATOS DO JÚLIO: \"roda o instagram\", \"cuida do meu instagram\", \"toca o insta\", \"como tá o instagram\", \"bora postar no instagram\", \"roda a agência do instagram\", \"o que posto no insta essa semana\", \"monta minha semana no instagram\". SEMPRE use este skill quando o usuário quiser rodar o ciclo completo do Instagram em vez de chamar um agente isolado, ou perguntar como está a operação do Instagram."
---

# Agência de Instagram — Orquestrador

Ponto de entrada da operação de Instagram do Júlio Alves. Você não faz o
trabalho das camadas: chama cada uma na ordem, passa o contexto, e respeita os
limites de autonomia.

Esta operação é **irmã, não filha**, da agência do LinkedIn. Voz separada,
estratégia separada, arquivo separado. Lá ele é analista; aqui ele é pessoa.
Ver seção 2 do `INSTAGRAM_BRAND_CORE.md`.

---

## ANTES DE QUALQUER COISA

Leia, nesta ordem:

**`INSTAGRAM_BRAND_CORE.md`, o arquivo inteiro.** Ele é autossuficiente: voz,
tells banidos, achados, meta e regras de autonomia estão todos lá.

Não vá buscar voz no `BRAND_CORE.md` do LinkedIn. São registros diferentes de
propósito — lá ele é analista, aqui ele é pessoa — e misturar os dois produziu
os piores posts da conta.

Se o arquivo não estiver acessível, **pare e avise o Júlio**. Não improvise a
voz dele.

---

## AS CAMADAS

| # | Camada | Skill | O que faz |
|---|---|---|---|
| 0 | Brand Core | `INSTAGRAM_BRAND_CORE.md` | estado, achados, meta, regras de autonomia |
| 1 | Analytics | `instagram-analytics-agent` | mede e escreve na seção 9 |
| 2 | Reels | `instagram-reels-agent` | roteiro do vídeo. **Motor de crescimento** |
| 3 | Writer | `instagram-post-writer` | escreve a legenda |
| 4 | Quality Gate | `instagram-quality-gate` | pontua antes de ir ao ar |
| 5 | Publicação | Composio (Instagram) ou Metricool | publica ou agenda |

Fora do pipeline: `instagram-comment-responder`, em ciclo próprio.

---

## A META GOVERNA A CADÊNCIA

Meta do Júlio, definida em 06/09/2026: **5.000 seguidores em 12 meses.** Ele
pediu 100.000; a aritmética foi apresentada e ele escolheu validar o modelo
primeiro. Seção 6 do Brand Core tem a conta inteira.

Isso exige ~340 seguidores por mês contra 30 hoje. Cerca de 11x.

Consequência prática, e ela reordena tudo:

| Formato | Papel | Frequência |
|---|---|---|
| **Reel** | crescimento. Único formato que alcança não seguidores | 1 a 2 por semana |
| **Foto** | manutenção da base | 1 por semana |
| **Carrossel** | só se for genuinamente guardável | raro, sob justificativa |

**Reel é a prioridade da semana.** Se só der para produzir uma coisa, é o Reel.
Semana sem Reel é semana sem crescimento — a foto segura a base e não traz gente
nova.

A métrica que manda é **retenção**, não curtida. Linha de base: 5,3 segundos.

Capacidade declarada pelo Júlio: 1 a 2 vídeos por semana, gravando sozinho. Não
monte plano que dependa de mais do que isso.

---

## MODO AUTÔNOMO — O QUE ISSO SIGNIFICA NA PRÁTICA

O Júlio autorizou publicação sem aprovação prévia em 06/09/2026, **dentro das
regras da seção 8** do Brand Core. Autonomia não é ausência de limite: é um
limite escrito que substitui a pergunta caso a caso.

Antes de publicar qualquer coisa, releia a seção 8. Ela tem três listas:
publico sozinho, sempre paro, e nunca.

**O gargalo real é imagem.** A API do Instagram exige URL pública ou arquivo.
Você não gera foto do Júlio. Sem imagem entregue por ele, não há post. Se a fila
de imagens estiver vazia, o ciclo para aí e você avisa — não é falha, é
dependência.

---

## CICLO SEMANAL

### Passo 1 — Analytics

Chame `instagram-analytics-agent`. Ele mede os posts da semana, escreve na seção
9 do Brand Core e propõe aprendizados para a seção 10.

Rodar isto primeiro é deliberado: a semana nova começa sabendo como foi a
anterior.

### Passo 2 — Checar a fila de imagens

Leia a seção 11 (Pautas do Júlio) do Brand Core. Cruze com o material que ele
já mandou.

- Tem imagem e pauta → siga para o passo 3
- Tem pauta e não tem imagem → liste para o Júlio o que falta e pare
- Não tem nem um nem outro → proponha ângulos a partir dos pilares (seção 5) e
  peça o material

### Passo 3 — Produzir

**Reel primeiro.** Chame `instagram-reels-agent` para o roteiro da semana. Ele
gera 3 ganchos, o Júlio escolhe, e o roteiro sai com beats marcados e a hipótese
que está sendo testada.

Depois chame `instagram-post-writer` para a legenda do Reel e para os demais
posts da fila. A legenda do Reel não repete o vídeo.

### Passo 4 — Quality Gate

Chame `instagram-quality-gate`. Nota mínima 85. Máximo 2 voltas. Na terceira,
escale para o Júlio com o diagnóstico.

**Bloqueador do gate é bloqueador de publicação, inclusive no modo autônomo.**
O gate é a única coisa entre você e um post público. Não o contorne.

### Passo 5 — Publicar

Confira a cota antes: `INSTAGRAM_GET_IG_USER_CONTENT_PUBLISHING_LIMIT`.

- **Post único:** `INSTAGRAM_POST_IG_USER_MEDIA` cria o container, depois
  `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH` com o `creation_id`
- **Carrossel:** `INSTAGRAM_CREATE_CAROUSEL_CONTAINER` (2 a 10 itens), depois
  publish
- **Agendamento:** Metricool, brand `6544085`, fuso `America/Sao_Paulo`

Armadilhas reais:
- `creation_id` expira em menos de 24h
- publicar o mesmo `creation_id` duas vezes retorna 409. Crie container novo
- vídeo leva 30 a 120 segundos processando. Use `max_wait_seconds` de 60+

### Passo 6 — Registrar

Depois de publicado, registre na seção 9 do Brand Core e remova o item
consumido da seção 11.

---

## RELATÓRIO AO JÚLIO

Depois de cada ciclo, mande isto — curto:

```
INSTAGRAM — semana de [data]

PUBLIQUEI
[o que foi ao ar, com link]

PERFORMANCE DA SEMANA ANTERIOR
[3 linhas, com salvamentos e compartilhamentos em destaque]

PAREI E PRECISO DE VOCÊ EM
[o que bateu na lista "sempre paro" da seção 8]

FALTA IMAGEM PARA
[pautas travadas por falta de material]
```

Ele não precisa aprovar antes. Precisa saber depois.

---

## LIMITES

- Nunca publique sem passar pelo Quality Gate
- Nunca publique foto de familiar, de terceiro identificável, ou conteúdo sobre
  Carrefour e Sam's Club sem o Júlio dizer sim naquele caso específico
- Nunca ultrapasse 4 posts na semana ou 1 no dia
- Nunca apague post ou comentário de terceiro por conta própria

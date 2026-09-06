---
name: "instagram-analytics-agent"
description: "**Instagram Analytics para Júlio Alves**. Mede a performance da conta e de cada post, com foco em salvamentos e compartilhamentos, e escreve de volta na seção 9 do INSTAGRAM_BRAND_CORE.md, fechando o ciclo. Propõe aprendizados para a seção 10. GATILHOS EXATOS DO JÚLIO: \"como tá meu instagram\", \"quantas curtidas tive no insta\", \"como foi o post do instagram\", \"meus números do instagram\", \"relatório do instagram\", \"como tô indo no insta\", \"o instagram tá crescendo?\". SEMPRE use este skill quando o usuário pedir métricas, analytics, relatório ou performance do Instagram."
---

# Instagram Analytics — Júlio Alves

Você mede, interpreta e **escreve de volta no Brand Core**. Sem o passo de
escrita, o ciclo não fecha e a semana seguinte planeja sem retrovisor.

---

## A MÉTRICA QUE IMPORTA NESTA CONTA

Curtida não é o indicador. Da seção 4 do `INSTAGRAM_BRAND_CORE.md`: os seis
posts medidos em 06/09/2026 tiveram **0 salvamentos** (um teve 1) e **0
compartilhamentos** (um Reel teve 2). Isso é o teto de crescimento da conta.

Portanto, ao reportar: **salvamentos e compartilhamentos primeiro.** Alcance
depois. Curtida por último.

Um post com 20 curtidas e 8 salvamentos é uma vitória. Um com 77 curtidas e 0
salvamentos é o padrão que já não está funcionando.

---

## FLUXO

### 1. Conta

`INSTAGRAM_GET_USER_INSIGHTS`, `period: "day"`, `metric_type: "total_value"`,
com `since` e `until` em epoch.

Métricas: `reach`, `views`, `accounts_engaged`, `total_interactions`,
`profile_views`.

Cuidados:
- `metric` precisa ser **array**, não string com vírgulas
- `impressions` foi descontinuada pela Meta e é rejeitada
- resultado vazio é válido, não é falha
- métricas de demografia exigem `timeframe` e `period: "lifetime"`

### 2. Posts

`INSTAGRAM_GET_IG_USER_MEDIA` para listar (lembre: vem aninhado em `data.data`,
pagine por `paging.cursors.after`), depois
`INSTAGRAM_GET_IG_MEDIA_INSIGHTS` em cada um.

Métricas: `views`, `reach`, `saved`, `shares`, `likes`, `comments`,
`total_interactions`. Para Reel, some `ig_reels_avg_watch_time`.

Cuidados:
- valores vêm em `data[*].values[0].value`
- métrica indisponível para aquele tipo de mídia retorna 400. Pule e siga
- `ig_media_id` é numérico. O código de `instagram.com/p/XXXX` **não** serve

Confirmado em 06/09/2026: insights funcionam nesta conta com 914 seguidores,
apesar de a documentação citar 1.000 como piso.

### 3. Interpretar

Compare cada post contra a linha de base da seção 3 do Brand Core, e responda:

- Que posts passaram de 500 de alcance? O que tinham em comum?
- Algum post teve salvamento acima de zero? **Esse é o achado da semana**
- Os achados 1, 2 e 3 da seção 4 continuam se sustentando, ou algum caiu?

**Distinga alcance baixo de engajamento baixo.** Alcance 130 é distribuição que
não aconteceu. Alcance 600 com 4 interações é conteúdo que não conectou. São
problemas diferentes, com correções diferentes.

Não afirme causa a partir de uma amostra pequena. Alcance e engajamento se
retroalimentam. Diga "consistente com" e não "porque", até haver 20+ posts.

### 4. Escrever no Brand Core

Adicione uma linha por post na tabela da **seção 9**:

`| Data | Post | Formato | Alcance | Interações | Salvos | Compart. | Leitura |`

A coluna Leitura é uma frase sua, não um número repetido.

Se um achado da seção 4 for contrariado pelos dados novos, **registre isso.**
Achado que não sobrevive ao dado tem que cair.

### 5. Propor aprendizados

Proponha linhas para a **seção 10**, marcadas como "aguardando". Só o Júlio
valida. Cada uma precisa de evidência numérica ao lado.

### 6. Reportar

```
INSTAGRAM — [período]

SALVAMENTOS: [n]    COMPARTILHAMENTOS: [n]
[a leitura, em 1 linha]

ALCANCE: [n]    VISITAS AO PERFIL: [n]    SEGUIDORES: [n]

MELHOR POST
[qual, por quê, com números]

PIOR POST
[qual, e se foi distribuição ou conexão]

OS ACHADOS SE SUSTENTAM?
[1, 2 e 3 da seção 4: sim, não, ou sem dado]

GRAVEI NO BRAND CORE
[o que foi para a seção 9]

APRENDIZADOS PROPOSTOS
[para a seção 10, aguardando você validar]
```

---

## LIMITES

- Nunca reporte número que você não puxou da API nesta rodada
- Nunca compare com período que você não mediu
- Sempre sinalize que alcance e contas engajadas são estimados pela própria Meta
- Nunca esconda queda. Número ruim reportado tarde custa mais que reportado hoje

---
name: linkedin-performance-report
description: Gerar o relatório de performance dos posts do LinkedIn. Use quando o usuário pedir um relatório semanal de performance, análise de métricas dos posts (impressões, reações, comentários, engajamento), ou um resumo de como os posts estão indo. Lê a planilha de performance no Drive e produz um relatório com insights e recomendações.
---

# LinkedIn Performance Report

Skill para gerar o relatório de performance dos posts do LinkedIn do Júlio, no
modelo dos `relatorio_linkedin_semana_AAAA-MM-DD`.

## Contexto

- Os dados estão na planilha de performance no Google Drive, normalmente chamada
  `linkedin_performance_AAAA-MM-DD`, com as colunas:
  `data, titulo, pilar, formato, impressoes, reacoes, comentarios, reposts,
  er_pct` (er_pct = taxa de engajamento em %).

## Passo a passo

1. **Carregar os dados.** Procure a planilha de performance mais recente no Drive
   (`search_files` por `linkedin_performance`) e leia o conteúdo. Se houver mais
   de uma semana, use o período pedido pelo usuário (padrão: última semana).

2. **Analisar.** Calcule e destaque:
   - Total e média de impressões, reações, comentários e reposts no período.
   - Taxa de engajamento média (`er_pct`) e qual post teve a melhor/pior.
   - Desempenho por **pilar** (ex.: Liderança, Varejo, Marketing-CX) e por
     **formato** (imagem, vídeo, texto), apontando o que rende mais.
   - Tendências (crescendo/caindo) comparando com período anterior, se disponível.

3. **Recomendar.** Liste 3–5 recomendações práticas e acionáveis (que pilar/
   formato priorizar, horários, temas que engajaram mais, etc.).

4. **Entregar o relatório.** Produza um documento em Markdown bem estruturado
   (título, resumo executivo, tabela de métricas, análise por pilar/formato,
   recomendações). Nomeie como `relatorio_linkedin_semana_AAAA-MM-DD.md`.
   Pergunte se o usuário quer que seja salvo no Google Drive como Google Doc.

## Observações

- Seja objetivo e orientado a dados; sempre baseie as conclusões nos números da
  planilha, sem inventar métricas.
- Tom em português do Brasil, claro e executivo.

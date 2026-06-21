---
name: linkedin-comment-responder
description: Responder os comentários dos posts recentes do LinkedIn. Use quando o usuário pedir para responder comentários de posts, sugerir respostas a quem comentou, ou montar uma planilha de respostas a comentários. Gera um Excel com resposta sugerida, coluna de ajuste e decisão Sim/Não por comentário.
---

# LinkedIn Comment Responder

Skill para ajudar o Júlio a responder os comentários dos seus posts recentes do
LinkedIn. O resultado é um arquivo Excel (.xlsx) com uma resposta sugerida para
cada comentário, uma coluna para o usuário ajustar o texto, e uma coluna de
decisão "Responder? (Sim/Não)".

## Contexto

- Não há integração direta com o LinkedIn neste ambiente. Os dados dos posts e a
  contagem de comentários costumam estar no Google Drive (ex.: planilha
  `linkedin_performance_AAAA-MM-DD`, colunas: `data, titulo, pilar, formato,
  impressoes, reacoes, comentarios, reposts, er_pct`).
- A planilha de performance traz a **quantidade** de comentários, mas geralmente
  **não** traz o texto de cada comentário. O texto precisa ser fornecido pelo
  usuário (colado no chat ou apontado num arquivo do Drive).

## Passo a passo

1. **Identificar os posts com comentários.**
   - Procure no Google Drive a planilha de performance mais recente
     (`search_files` por `linkedin_performance` ou título contendo `linkedin`).
   - Leia o conteúdo e liste os posts cujo valor de `comentarios` > 0, do mais
     recente para o mais antigo. Informe ao usuário **quantos** comentários há no
     total (soma da coluna `comentarios` dos posts recentes).

2. **Obter o texto dos comentários.**
   - Se a fonte só tiver a contagem, peça ao usuário o texto dos comentários
     (de preferência indicando de qual post é cada um) ou um arquivo do Drive
     com esse conteúdo.
   - Não invente comentários. Sem o texto, não há como sugerir resposta
     específica — nesse caso, entregue só a estrutura vazia para preenchimento.

3. **Gerar respostas sugeridas.**
   - Para cada comentário, escreva uma resposta curta, no tom de voz do Júlio:
     profissional, cordial e próximo, em português do Brasil. Agradeça quando
     fizer sentido, agregue um ponto de valor e, quando couber, faça uma
     pergunta de continuidade para gerar engajamento.
   - Evite respostas genéricas repetidas; personalize por comentário.

4. **Montar o Excel.** Use `openpyxl` (instale se necessário) com as colunas:
   `Data do post | Post | Comentarios (qtd) | Autor do comentario | Comentario |
   Resposta sugerida | Ajuste seu (edite aqui) | Responder? (Sim/Nao)`.
   - Cabeçalho em negrito com fundo escuro e texto branco; `freeze_panes` na
     primeira linha; quebra de texto (wrap) nas colunas de texto.
   - A coluna `Responder? (Sim/Nao)` deve ter validação de dados (lista suspensa
     com `Sim,Nao`).
   - Larguras de coluna generosas para leitura confortável.
   - Salve como `Respostas_Comentarios_LinkedIn.xlsx`.

5. **Entregar.** Envie o arquivo ao usuário (SendUserFile) e pergunte se ele quer
   que a planilha seja salva também no Google Drive, junto dos outros arquivos do
   LinkedIn.

## Observações

- Sempre confirme a contagem total de comentários antes de gerar respostas.
- Não publique respostas no LinkedIn automaticamente (não há integração). O
  fluxo termina na planilha para revisão e publicação manual pelo usuário.

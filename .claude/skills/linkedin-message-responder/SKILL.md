---
name: linkedin-message-responder
description: Analisar e responder as mensagens (DMs) do LinkedIn. Use quando o usuário pedir para responder mensagens, analisar a caixa de entrada do LinkedIn, triar conversas ou montar uma planilha de respostas a mensagens. Gera um Excel com resposta sugerida, prioridade e decisão Sim/Não por conversa.
---

# LinkedIn Message Responder

Skill para ajudar o Júlio a triar e responder as mensagens (DMs) do LinkedIn.
O resultado é um Excel (.xlsx) com uma resposta sugerida por conversa, uma coluna
para ajuste e uma decisão "Responder? (Sim/Não)", no mesmo espírito da skill de
comentários.

## Contexto

- Não há integração direta com o LinkedIn. As mensagens precisam ser fornecidas
  pelo usuário (coladas no chat) ou estar num arquivo do Drive, como
  `LinkedIn_Analise_Mensagens.xlsx` ou `LinkedIn_Mensagens_Guia.xlsx`.

## Passo a passo

1. **Reunir as mensagens.**
   - Procure no Google Drive arquivos com `Mensagens` no título
     (`search_files`). Leia o conteúdo se existir.
   - Caso contrário, peça ao usuário que cole as mensagens (com o nome do
     remetente e, se possível, o contexto/histórico da conversa).

2. **Triar.** Classifique cada conversa por tipo e prioridade, por exemplo:
   - Oportunidade de negócio / parceria
   - Networking / relacionamento
   - Recrutamento / vaga
   - Spam / venda fria (geralmente "Não responder")
   Indique a prioridade (Alta / Média / Baixa).

3. **Gerar respostas sugeridas.** Tom profissional, cordial e próximo, em
   português do Brasil. Personalize por mensagem; seja direto e gere próximos
   passos claros (ex.: sugerir call, pedir mais detalhes) quando fizer sentido.

4. **Montar o Excel** com `openpyxl`, colunas sugeridas:
   `Remetente | Tipo | Prioridade | Mensagem recebida | Resposta sugerida |
   Ajuste seu (edite aqui) | Responder? (Sim/Nao)`.
   - Cabeçalho destacado, `freeze_panes`, wrap de texto, validação de lista
     `Sim,Nao` na última coluna.
   - Salve como `Respostas_Mensagens_LinkedIn.xlsx`.

5. **Entregar.** Envie o arquivo (SendUserFile) e ofereça salvar no Google Drive.

## Observações

- Não envie mensagens no LinkedIn automaticamente; o fluxo termina na planilha
  para revisão e envio manual.

---
name: whatsapp-archive-groups
description: >
  Arquiva grupos do WhatsApp Desktop (Mac) por palavra-chave no nome (oferta, promo, desconto,
  achadinho, etc.), com confirmação do Júlio antes de arquivar. Abre o WhatsApp, ativa filtro
  de Grupos, busca por keyword, lista candidatos, valida e arquiva via right-click → Arquivar.
  GATILHOS DO JÚLIO: "arquiva os grupos de X no whatsapp", "limpa meu whatsapp", "tira esses
  grupos da inbox", "arquiva tudo que é de ofertas", "arquivar promos no whatsapp", "bora limpar
  o whatsapp", "arquiva os grupos de promoção", "muito grupo de oferta aqui", "preciso arquivar
  uns grupos", "arquiva grupo no whatsapp", "organiza meu whatsapp", "tira os grupos que não uso",
  "arquiva os grupos antigos", "arquivar conversas do whatsapp". Também: "archive WhatsApp
  groups", "clean up my WhatsApp".
---

# WhatsApp Archive Groups

Esta skill ajuda o Júlio a fazer limpeza da inbox do WhatsApp arquivando grupos por padrão (ofertas, promos, grupos antigos de trabalho, etc.) com confirmação antes de cada lote. O WhatsApp Desktop fica organizado e os grupos arquivados continuam acessíveis na pasta "Arquivadas".

## Pré-requisitos

- **WhatsApp Desktop instalado** no Mac (não funciona com WhatsApp Web por causa das restrições de tier do Safari/Chrome). Bundle ID: `net.whatsapp.WhatsApp`.
- **Usuário logado** no WhatsApp Desktop (QR Code pareado com o celular).
- Se o app não estiver instalado, peça pro Júlio instalar pela App Store ou em `whatsapp.com/download` e aguarde antes de prosseguir.

## Como funciona

A skill opera em quatro fases: **mapear → validar → arquivar → verificar**. A validação humana entre o mapeamento e o arquivamento é crítica — nunca arquive sem confirmação, mesmo que o pedido pareça óbvio.

---

## Passo 1: Pedir acesso ao WhatsApp

Use `request_access` com o bundle ID do WhatsApp:

```
apps: ["net.whatsapp.WhatsApp"]
reason: "Localizar grupos de [tema] no WhatsApp e arquivá-los após sua confirmação."
```

Se o `request_access` retornar `notInstalled`, informe o Júlio e pause. Sem o app, a skill não roda.

Após aprovação, chame `open_application` com `net.whatsapp.WhatsApp` e dê ~1.5s pra janela carregar antes do primeiro screenshot.

## Passo 2: Identificar o critério de busca

Antes de mapear, esclareça **qual palavra-chave** define os grupos a arquivar. Pergunte com `AskUserQuestion` se não estiver explícito no pedido. Exemplos comuns:

| Pedido do Júlio                       | Keywords sugeridas                                |
|---------------------------------------|---------------------------------------------------|
| "arquiva os grupos de ofertas"        | `oferta`, `ofertas`                               |
| "arquiva os grupos de promoção"       | `promo`, `promoção`, `promocional`                |
| "tira os grupos de desconto"          | `desconto`, `cupom`                               |
| "limpa os grupos antigos de loja"     | `loja`, nomes específicos de lojas                |
| "arquiva os achadinhos"               | `achadinho`, `achados`                            |
| "arquiva grupos de [tema específico]" | use o tema exato + sinônimos                      |

Também sempre pergunte:
1. **Confirmar antes de arquivar cada lote?** (recomende "Sim" — é o padrão seguro)
2. Se há grupos ambíguos que ele quer **ver antes de decidir** (ex: "Promocional Report" pode ser trabalho).

## Passo 3: Mapear candidatos

### 3a. Aplicar o filtro "Grupos"

1. Tire um screenshot do estado inicial pra ver o layout.
2. Clique no botão **"Grupos"** na barra de filtros superior da lista de Conversas. Isso reduz drasticamente o ruído (esconde conversas 1:1, listas de transmissão, etc).
3. Confirme que o placeholder do campo de busca mudou para "Pesquisar grupos".

### 3b. Buscar por palavra-chave

Pra cada keyword definida no Passo 2:

1. Clique no campo de busca (no topo, abaixo do header "Conversas").
2. Digite a palavra-chave (ex: `oferta`).
3. Tire screenshot e leia os resultados.

A busca do WhatsApp retorna **dois blocos**:
- **"Conversas"** — grupos/chats cujo **nome** contém a palavra (estes são os candidatos a arquivar).
- **"Mensagens"** — chats que tiveram alguma **mensagem** contendo a palavra (ignorar — apenas message hits, não significa que o grupo é do tema).

Anote só o que aparecer sob "Conversas". Role para baixo se a lista exceder a viewport.

### 3c. Repetir pra cada keyword

Se o pedido envolve várias keywords (ex: `oferta` + `promo` + `desconto`), repita 3b pra cada uma. Limpe a busca clicando no X do campo entre uma busca e outra (geralmente em `x=562, y=172`).

### 3d. Consolidar a lista

Junte os achados em **uma lista única** (sem duplicatas). Categorize em:
- **Bloco A** — grupos claramente do tema (alto sinal: "Ofertas Carrefour X", "Promo de Y").
- **Bloco B** — possíveis falsos positivos (ex: "SD Promocional Report" parece trabalho, não consumer offers). Não decida sozinha: marque como ambíguo.

## Passo 4: Validar com o Júlio

Apresente a lista com **número total** e **separação por bloco**. Use `AskUserQuestion` pra que o Júlio escolha o escopo:

- Só Bloco A
- Bloco A + Bloco B
- Personalizado (ele indica os números a arquivar)

Mostre o nome de cada grupo, status (silenciado, não lido), e contagem de mensagens não lidas pra ele ter contexto. Exemplo de apresentação:

```
Encontrei 12 candidatos.

Bloco A — Ofertas (9):
1. 2 Ofertas Carrefour Giovanni... (silenciado, 30 não lidas)
2. 1 Ofertas Carrefour Giovanni... (silenciado, 30)
...

Bloco B — Promoções/ambíguos (3):
10. SD PROMOCIONAL REPORT (parece trabalho — 21 não lidas)
...

Quais arquivar?
```

**Não prossiga sem aprovação explícita.** Se ele pedir "só alguns", peça a lista de números.

## Passo 5: Arquivar cada grupo aprovado

Pra cada grupo da lista final:

### 5a. Localizar o grupo

Use uma das duas estratégias:

**Estratégia A: Search-and-archive (preferida pra nomes únicos)**
- Digite parte distintiva do nome no campo de busca (ex: "Tamboré 5").
- O grupo aparece sob "Conversas" — geralmente em `y≈289` quando é o primeiro resultado.

**Estratégia B: Lista filtrada (quando vários grupos similares aparecem juntos)**
- Mantenha o filtro "Grupos" ativo.
- Role pela lista — após cada archive, a lista se reorganiza (chat arquivado some, próximos sobem).

### 5b. Right-click → Arquivar

1. Faça `right_click` na linha do grupo (no x da coluna de conversas, ~`x=390`).
2. Um menu de contexto abre. Tire screenshot pra confirmar a posição.
3. O menu lista: Abrir em nova janela, Marcar como lida/não lida, **Arquivar**, Fixar, Silenciar/Reativar notificações, Dados do grupo, Exportar, Limpar, Sair do grupo.
4. Clique em **"Arquivar"** — geralmente uns ~60-65px abaixo do ponto onde você clicou com o botão direito. Tipicamente em `x≈460`.

### 5c. Verificar e seguir

Após o clique:
- O grupo deve sumir da lista ativa.
- O contador da pasta "Arquivadas" (no sidebar esquerdo, ícone de caixa) pode subir — mas atenção: esse contador às vezes mostra só arquivados com **não lidas**, não o total.
- Tire screenshot e siga pro próximo grupo.

**Importante: a lista se reorganiza após cada archive.** Não bata em coordenadas memorizadas — sempre confirme a posição do próximo alvo no screenshot mais recente.

### 5d. Tratamento de erros comuns

| Sintoma                                                  | Causa provável                          | Ação                                              |
|----------------------------------------------------------|-----------------------------------------|---------------------------------------------------|
| `Click would land on "Central de Notificações"`          | Coordenada saiu da janela do WhatsApp   | Screenshot fresco e ajuste y                      |
| Menu de contexto não apareceu                            | Right-click errou o alvo                | Tente x=390 com y do meio da linha (~+5px)        |
| Menu apareceu mas "Arquivar" sumiu (chat já arquivado)   | Chat já estava arquivado                | Feche o menu (Esc) e siga                         |
| Chat reaparece na inbox depois de arquivado              | "Manter conversas arquivadas" desligado | Avise o Júlio (ver Passo 7)                       |

## Passo 6: Verificação final

Depois de arquivar todos os aprovados:

1. Limpe a busca (clique no X em `~562, 172`).
2. **Re-busque** cada keyword original. Se a primeira resposta agora é o cabeçalho "Mensagens" (sem bloco "Conversas"), significa que nenhum grupo ativo tem mais aquela palavra no nome — sucesso.
3. Se sobrou algum, é provável que tenha sido criado/reativado durante a sessão (mensagem nova fez voltar do arquivo, ou grupo novo entrou). Pergunte ao Júlio se quer arquivar também.

## Passo 7: Resumo + alerta sobre auto-unarchive

Apresente o fechamento:

```
Pronto! Arquivados N grupos:

Bloco A — Ofertas (X):
- ...

Bloco B — Promoções (Y):
- ...

Inbox: de A → B conversas ativas.
Grupos arquivados ficam acessíveis na pasta "Arquivadas" do WhatsApp.
```

**Heads up importante:** Se "Manter conversas arquivadas" estiver **desligado** nas configurações (Ajustes → Conversas → Manter conversas arquivadas), grupos podem voltar pra inbox automaticamente quando uma mensagem nova chegar. Mencione isso no resumo e sugira ativar essa opção se ele quer que fiquem permanentemente arquivados.

---

## Padrões úteis

### Right-click + Arquivar em batch
Quando a lista está estável (sem novos chats chegando), você pode usar `computer_batch` pra encadear `right_click` + `screenshot`. Mas **sempre tire um screenshot após cada arquive** antes do próximo right-click, porque a lista reorganiza e coordenadas mudam.

### Busca por nome único é mais segura que scroll
Se o Júlio aprovou 10+ grupos, prefira buscar cada um pelo nome distintivo e arquivar via search-result. Scroll-and-archive tende a perder a posição quando há muita atividade.

### Diferenciar grupos com nomes parecidos
Cuidado com grupos que têm o mesmo prefixo mas locais diferentes (ex: "Ofertas Drogaria Carrefour Butantã" vs "Ofertas Drogaria Carrefour Osasco"). Sempre cite a parte distintiva do nome quando confirmar com o Júlio.

### Quando o contador de Arquivadas não bate
O número verde ao lado do ícone "Arquivadas" no sidebar mostra **arquivados com não lidas pendentes**, não o total. Se você arquivou 12 mas o contador subiu só 9, provavelmente 3 dos arquivados não tinham unread badges. Use a verificação por re-busca (Passo 6) como fonte da verdade, não o contador.

## O que NÃO fazer

- **Nunca arquive sem confirmação explícita do Júlio**, mesmo que o pedido pareça óbvio. A regra dele é "Confirmar antes de arquivar cada um".
- **Não saia de grupos** (opção "Sair do grupo" no menu) — arquivar é reversível, sair não é.
- **Não limpe conversas** (opção "Limpar conversa") — apaga histórico de mensagens.
- **Não use Cmd+E ou outros atalhos** sem testar antes — variam por versão do WhatsApp.
- **Não use WhatsApp Web** pra essa tarefa — browsers ficam em tier "read" no controle do computador e não conseguem clicar.

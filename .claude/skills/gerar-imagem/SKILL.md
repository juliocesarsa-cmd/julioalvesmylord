---
name: gerar-imagem
description: "Gera imagens do zero a partir de texto, usando um modelo generativo real (API Gemini). Também edita ou deriva imagem a partir de uma foto de referência. GATILHOS: \"gera uma imagem de\", \"cria uma ilustração\", \"faz um fundo\", \"desenha\", \"preciso de uma imagem de X\", \"gera uma textura\", \"cria uma abertura visual\", \"faz uma imagem conceitual\". Use quando o pedido for criar pixel novo que não existe em foto nenhuma. NÃO use para arte de post do LinkedIn com foto do Júlio — isso é da linkedin-designer, que tem doutrina foto-primeiro."
---

# Gerar imagem

Ferramenta de texto→imagem. Cria pixel novo, que não existe em foto nenhuma.

## QUANDO NÃO USAR

Esta skill não substitui a `linkedin-designer`. A doutrina da casa é foto-primeiro:
post do Júlio usa foto real do Júlio, com tipografia mínima. Um card bonito gerado
por IA é exatamente o que aquela skill classifica como erro.

**Regra herdada da `linkedin-designer`, e ela vale aqui sem exceção:**

> Não gere rosto por IA, nem "melhore" o rosto do Júlio de forma que mude a
> aparência dele.

Então:

| Pedido | Ferramenta |
|---|---|
| Arte de post, carrossel, capa com foto do Júlio | `linkedin-designer` |
| Rosto do Júlio, ou qualquer pessoa real | Nenhuma. Use foto real. |
| Fundo abstrato, textura, ilustração conceitual, objeto, cenário | esta skill |
| Imagem para rascunho, moodboard, teste de composição | esta skill |

Se o pedido for de post do LinkedIn, chame a `linkedin-designer` primeiro e use
esta skill só se ela pedir um elemento gráfico que não existe no acervo de fotos.

## ONDE GUARDAR A CHAVE

Chave da API Gemini, obtida em <https://aistudio.google.com/apikey>.
Escolha a rota pelo lugar onde a skill vai rodar.

### Rota A — API credential do ambiente (mais segura, sessão na web)

A chave fica guardada no ambiente e o agent proxy da Anthropic carimba o header
depois que a requisição sai da VM. **A chave nunca entra na sessão**: não aparece
em variável de ambiente, não aparece em arquivo, e o agente não a vê.

Disponível nos planos Pro e Max. Em claude.ai/code, abra o ambiente para edição →
**API credentials** → **Add credential**:

| Campo | Valor |
|---|---|
| Name | `Gemini` |
| Allowed websites | `generativelanguage.googleapis.com` |
| Custom headers → Name | `x-goog-api-key` |
| Custom headers → Prefix | **vazio** (apague o `Bearer`) |
| Custom headers → Value | a chave |

O prefixo tem de ficar vazio: foi testado contra a API e `Authorization: Bearer`
é lido como OAuth, não como API key. O header que funciona é `x-goog-api-key`
com o valor puro.

Depois, rode com `--via-proxy`, que manda a requisição sem chave:

```bash
python3 scripts/gerar_imagem.py --via-proxy --prompt "..." --saida out.png
```

### Rota B — variável de ambiente

Mais simples, e a única opção fora de sessão na web. A chave fica legível para
qualquer comando da sessão, inclusive para o agente.

**Máquina local (Mac):** ponha no shell profile para persistir.

```bash
echo 'export GEMINI_API_KEY="sua-chave"' >> ~/.zshrc && source ~/.zshrc
```

**Sessão na web:** em claude.ai/code, abra o ambiente → **Environment variables**,
formato `.env`, uma linha:

```
GEMINI_API_KEY=sua-chave
```

Vale para sessões **novas**: a sessão em andamento não relê a configuração.

### Onde NÃO guardar

- **Não cole a chave no chat.** Ela fica gravada no transcript da conversa.
- **Não comite** em repositório. Se usar arquivo `.env`, confirme que ele está
  no `.gitignore` antes.

O script usa só a biblioteca padrão do Python 3. Não precisa de `pip install`.

## USO

```bash
python3 scripts/gerar_imagem.py \
  --prompt "Descrição da imagem, específica e concreta." \
  --saida saida.png \
  --proporcao 4:5 \
  --tamanho 2K
```

### Descobrir os modelos disponíveis

Nenhum ID de modelo está chumbado no código, de propósito: o catálogo da Google
muda e um ID escrito à mão envelhece em silêncio. O script pergunta à API.

```bash
python3 scripts/gerar_imagem.py --listar-modelos
python3 scripts/gerar_imagem.py --listar-modelos --todos   # catálogo inteiro
```

Se `--modelo` for omitido, o script escolhe sozinho um modelo de imagem da conta,
preferindo versão estável a `preview`, e imprime qual usou. Sempre confira essa
linha antes de aceitar o resultado.

### Editar ou derivar de uma foto

```bash
python3 scripts/gerar_imagem.py \
  --prompt "Troque o fundo por uma parede de concreto claro." \
  --referencia foto.jpg --saida resultado.png
```

`--referencia` é repetível. Lembre da regra de rosto acima antes de passar foto
de pessoa.

### Parâmetros

| Flag | Valores | Nota |
|---|---|---|
| `--proporcao` | `1:1` `2:3` `3:2` `3:4` `4:3` `4:5` `5:4` `9:16` `16:9` `21:9` `1:4` `4:1` `1:8` `8:1` | LinkedIn retrato = `4:5`. Omitido, o modelo decide. |
| `--tamanho` | `512` `1K` `2K` `4K` | Padrão da API é `1K`. |
| `--referencia` | caminho de imagem | Repetível. |
| `--via-proxy` | — | Não envia chave; usa a API credential do ambiente (Rota A). |

Os valores acima vieram do documento de discovery da API, não de memória.

## COMO ESCREVER O PROMPT

O modelo responde a substantivo concreto, não a adjetivo de catálogo.

- **Ruim:** "uma imagem bonita e moderna sobre varejo"
- **Bom:** "corredor de supermercado vazio ao amanhecer, luz fria de LED,
  prateleiras metálicas, ponto de fuga central, sem pessoas, sem texto"

Diga o que **não** quer. Modelo de imagem erra em texto: se a peça não precisa de
letra dentro da imagem, escreva "sem texto" e ponha a tipografia depois, com
controle real.

## VERIFICAÇÃO OBRIGATÓRIA

**Olhe a imagem antes de entregar.** Modelo generativo erra mão, erra letra, erra
reflexo, e erra de um jeito que só aparece olhando. Leia também a linha
`nota do modelo` na saída: às vezes o modelo avisa que desviou do pedido.

Se a imagem sair errada, mude o prompt e gere de novo. Não entregue "quase certo"
dizendo que está certo.

## LIMITE DE AMBIENTE

Funciona onde `generativelanguage.googleapis.com` é alcançável. Em sessão do
Claude Code na web esse host está liberado — foi testado. Já `api.openai.com` e
`api.replicate.com` estão **bloqueados** pelo proxy de egress dessas sessões, e
por isso esta skill foi construída sobre a API do Gemini, não sobre elas.

Se aparecer `CONNECT tunnel failed` ou 403 do proxy, o host não está liberado
naquele ambiente. Isso não é bug do script.

## ERROS COMUNS

| Sintoma | Causa provável |
|---|---|
| `API key not valid` | Chave errada ou não exportada. |
| `Nenhum modelo de imagem encontrado` | A conta não tem acesso a modelo de imagem. Rode `--listar-modelos --todos`. |
| `respondeu, mas sem imagem` | Prompt bloqueado por política, ou o modelo devolveu só texto. Leia `finishReason`. |
| HTTP 429 | Cota estourada. |

O script repassa o erro da API na íntegra, porque a mensagem da Google é mais
confiável que qualquer tradução minha. A chave é redigida antes de imprimir.

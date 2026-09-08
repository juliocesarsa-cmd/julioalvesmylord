#!/usr/bin/env python3
"""Gera imagens pela API Gemini (generativelanguage.googleapis.com).

Somente biblioteca padrao: nao precisa de pip install.

O schema usado aqui foi extraido do documento de discovery oficial da API
(https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta),
que e fonte primaria e versionada pela propria Google:

  POST v1beta/models/{modelo}:generateContent
  body: contents[].parts[].text
        generationConfig.responseModalities = ["TEXT","IMAGE"]
        generationConfig.imageConfig.{aspectRatio,imageSize}
  resp: candidates[].content.parts[].inlineData.{mimeType,data(base64)}

Nenhum ID de modelo esta chumbado no codigo. Os modelos vem da API em tempo
de execucao (--listar-modelos), para que este script nao envelheca junto com
o catalogo da Google.
"""

import argparse
import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://generativelanguage.googleapis.com/v1beta"

# Valores aceitos por generationConfig.imageConfig, conforme o discovery doc.
PROPORCOES = ("1:1", "1:4", "4:1", "1:8", "8:1", "2:3", "3:2", "3:4",
              "4:3", "4:5", "5:4", "9:16", "16:9", "21:9")
TAMANHOS = ("512", "1K", "2K", "4K")


class ErroAPI(Exception):
    pass


def _chave(via_proxy=False):
    """Devolve a chave, ou None quando ela e injetada por um proxy.

    No modo --via-proxy o script nao envia chave nenhuma: quem carimba o
    header `x-goog-api-key` e o agent proxy do ambiente, e a chave nunca
    passa pela sessao."""
    if via_proxy:
        return None
    for nome in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        valor = os.environ.get(nome)
        if valor:
            return valor
    raise ErroAPI(
        "Nenhuma chave encontrada. Ou defina GEMINI_API_KEY no ambiente:\n"
        "  export GEMINI_API_KEY='sua-chave'\n"
        "ou, se a chave estiver cadastrada como API credential do ambiente,\n"
        "rode com --via-proxy.\n"
        "A chave se obtem em https://aistudio.google.com/apikey"
    )


def _redigir(texto, chave):
    """Nunca deixa a chave vazar em mensagem de erro ou log."""
    return texto.replace(chave, "***") if chave else texto


def _pedir(caminho, chave, corpo=None, timeout=180):
    """Chama a API. A chave vai como query param `key`, forma documentada
    no discovery doc. Retorna o JSON decodificado."""
    url = f"{BASE}/{caminho}"
    if chave:
        # Forma documentada no discovery doc. Sem chave, a requisicao sai
        # "pelada" e o agent proxy do ambiente injeta o header de auth.
        url += "?" + urllib.parse.urlencode({"key": chave})
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(
        url,
        data=dados,
        method="POST" if corpo is not None else "GET",
        headers={"Content-Type": "application/json"} if corpo is not None else {},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode(errors="replace")
        # Repassa o erro da API na integra: e a fonte de verdade sobre o que
        # deu errado (modelo inexistente, cota, prompt bloqueado).
        raise ErroAPI(f"HTTP {e.code}\n{_redigir(detalhe, chave)}") from None
    except urllib.error.URLError as e:
        raise ErroAPI(
            f"Falha de rede: {e.reason}\n"
            "Se aparecer 'CONNECT tunnel failed' ou 403 do proxy, este host "
            "nao esta liberado no ambiente atual."
        ) from None


def listar_modelos(chave, so_imagem=True):
    resp = _pedir("models", chave)
    modelos = []
    for m in resp.get("models", []):
        if "generateContent" not in (m.get("supportedGenerationMethods") or []):
            continue
        nome = m.get("name", "")
        if so_imagem and "image" not in nome.lower():
            continue
        modelos.append(m)
    return modelos


def escolher_modelo(chave):
    """Descobre um modelo de imagem consultando a API, em vez de chutar um ID."""
    modelos = listar_modelos(chave, so_imagem=True)
    if not modelos:
        raise ErroAPI(
            "Nenhum modelo de imagem encontrado nesta conta.\n"
            "Rode --listar-modelos --todos para ver o catalogo completo e "
            "passe o escolhido em --modelo."
        )
    # Prefere versao estavel a preview quando as duas existem.
    estaveis = [m for m in modelos if "preview" not in m["name"].lower()]
    return (estaveis or modelos)[0]["name"]


def _parte_imagem(prompt, referencias):
    partes = [{"text": prompt}]
    for caminho in referencias:
        tipo = mimetypes.guess_type(caminho)[0]
        if not tipo or not tipo.startswith("image/"):
            raise ErroAPI(f"Nao parece uma imagem: {caminho}")
        with open(caminho, "rb") as f:
            partes.append({
                "inlineData": {
                    "mimeType": tipo,
                    "data": base64.b64encode(f.read()).decode(),
                }
            })
    return partes


def gerar(prompt, saida, chave, modelo=None, proporcao=None, tamanho=None,
          referencias=()):
    modelo = modelo or escolher_modelo(chave)
    if not modelo.startswith("models/"):
        modelo = "models/" + modelo

    config = {"responseModalities": ["TEXT", "IMAGE"]}
    image_config = {}
    if proporcao:
        image_config["aspectRatio"] = proporcao
    if tamanho:
        image_config["imageSize"] = tamanho
    if image_config:
        config["imageConfig"] = image_config

    corpo = {
        "contents": [{"role": "user", "parts": _parte_imagem(prompt, referencias)}],
        "generationConfig": config,
    }

    resp = _pedir(f"{modelo}:generateContent", chave, corpo)

    candidatos = resp.get("candidates") or []
    if not candidatos:
        fb = resp.get("promptFeedback") or {}
        raise ErroAPI(f"A API nao retornou candidatos. promptFeedback={fb}")

    cand = candidatos[0]
    partes = (cand.get("content") or {}).get("parts") or []
    texto = []
    escritos = []

    for parte in partes:
        blob = parte.get("inlineData")
        if blob and blob.get("data"):
            ext = mimetypes.guess_extension(blob.get("mimeType", "image/png")) or ".png"
            destino = saida
            if escritos:  # mais de uma imagem na resposta
                raiz, _ = os.path.splitext(saida)
                destino = f"{raiz}_{len(escritos) + 1}{ext}"
            os.makedirs(os.path.dirname(os.path.abspath(destino)), exist_ok=True)
            with open(destino, "wb") as f:
                f.write(base64.b64decode(blob["data"]))
            escritos.append((destino, blob.get("mimeType")))
        elif parte.get("text"):
            texto.append(parte["text"])

    if not escritos:
        raise ErroAPI(
            "O modelo respondeu, mas sem imagem.\n"
            f"finishReason={cand.get('finishReason')}\n"
            f"texto={' '.join(texto)[:600]}"
        )

    return modelo, escritos, " ".join(texto).strip()


def main():
    p = argparse.ArgumentParser(
        description="Gera imagem via API Gemini.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--prompt", help="Descricao da imagem.")
    p.add_argument("--saida", default="imagem.png", help="Arquivo de saida.")
    p.add_argument("--modelo", help="ID do modelo. Omitido = descoberto via API.")
    p.add_argument("--proporcao", choices=PROPORCOES,
                   help="aspectRatio. LinkedIn retrato = 4:5.")
    p.add_argument("--tamanho", choices=TAMANHOS, help="imageSize. Padrao da API = 1K.")
    p.add_argument("--referencia", action="append", default=[],
                   help="Imagem de entrada para editar/derivar. Repetivel.")
    p.add_argument("--listar-modelos", action="store_true",
                   help="Lista os modelos reais da conta e sai.")
    p.add_argument("--todos", action="store_true",
                   help="Com --listar-modelos, mostra todos, nao so os de imagem.")
    p.add_argument("--via-proxy", action="store_true",
                   help="Nao envia chave: ela e injetada pelo agent proxy do "
                        "ambiente (API credential). Ver SKILL.md.")
    args = p.parse_args()

    try:
        chave = _chave(via_proxy=args.via_proxy)

        if args.listar_modelos:
            modelos = listar_modelos(chave, so_imagem=not args.todos)
            if not modelos:
                print("Nenhum modelo encontrado com esse filtro.", file=sys.stderr)
                return 1
            for m in modelos:
                print(f"{m['name']}\n    {m.get('description', '')[:150]}")
            return 0

        if not args.prompt:
            p.error("--prompt e obrigatorio (ou use --listar-modelos)")

        modelo, escritos, texto = gerar(
            args.prompt, args.saida, chave,
            modelo=args.modelo, proporcao=args.proporcao,
            tamanho=args.tamanho, referencias=args.referencia,
        )

        print(f"modelo: {modelo}")
        for caminho, tipo in escritos:
            tam = os.path.getsize(caminho)
            print(f"gerado: {caminho} ({tipo}, {tam / 1024:.0f} KB)")
        if texto:
            print(f"nota do modelo: {texto[:300]}")
        return 0

    except ErroAPI as e:
        print(f"ERRO: {e}", file=sys.stderr)
        return 1
    except FileNotFoundError as e:
        print(f"ERRO: arquivo nao encontrado: {e.filename}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

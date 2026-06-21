# 📁 Mídia dos posts (imagens e vídeos)

Esta pasta guarda os arquivos que o robô publica. Como a Instagram Graph API
exige uma **URL pública**, o robô monta o link assim:

```
media_base_url (no queue.json) + nome do arquivo
= https://raw.githubusercontent.com/juliocesarsa-cmd/julioalvesmylord/claude/remote-control-ux38B/marketing/automacao/midia/<arquivo>
```

> ✅ O repositório é **público**, então o GitHub raw é acessível pela Meta.
> Se um dia torná-lo privado, use um host externo (Cloudinary, S3, Supabase) e
> coloque a URL completa direto no `image_urls`/`video_url`.
>
> ⚠️ A base aponta para o branch padrão **claude/remote-control-ux38B** (é de lá
> que o cron do GitHub Actions roda). Se mudar o branch, ajuste
> `media_base_url` no `queue.json`.

## Como exportar do Canva e nomear

1. Abra o design (link `canva_url` de cada post no `queue.json`).
2. **Compartilhar → Baixar → JPG** (para carrossel, baixe **todas as páginas**).
3. Renomeie os arquivos exatamente como abaixo e coloque nesta pasta.
4. Commit + push. Mude o `status` do post de `draft` para `pending`.

## Nomes esperados (Semanas 1 e 2)

| Post | Tipo | Arquivos |
|------|------|----------|
| s1-seg-5erros | carrossel | `s1-seg-5erros-1.jpg` … `-5.jpg` |
| s1-ter-lojafisica | reels | `s1-ter-lojafisica.mp4` + `s1-ter-lojafisica-cover.jpg` |
| s1-qua-preco | reels | `s1-qua-preco.mp4` + `s1-qua-preco-cover.jpg` |
| s1-qui-bastidor | imagem | `s1-qui-bastidor.jpg` |
| s1-sex-checklist | carrossel | `s1-sex-checklist-1.jpg` … (quantos slides você fizer) |
| s2-seg-upsell | reels | `s2-seg-upsell.mp4` + `s2-seg-upsell-cover.jpg` |
| s2-ter-promocao | carrossel | `s2-ter-promocao-1.jpg` … |
| s2-qua-descontobrinde | imagem | `s2-qua-descontobrinde.jpg` |
| s2-qui-case | reels | `s2-qui-case.mp4` + `s2-qui-case-cover.jpg` |
| s2-sex-atendimento | carrossel | `s2-sex-atendimento-1.jpg` … `-5.jpg` |

## Observações

- **Carrossel** precisa de **no mínimo 2 imagens**. As capas geradas no Canva
  são só a 1ª página — monte os demais slides no Canva e exporte todas.
- **Reels** precisa de um **vídeo** (`.mp4`). As artes 9:16 servem como *capa*
  (`cover_url`); o vídeo em si você grava (pode usar o roteiro da legenda).
- **Semanas 3 e 4** ainda não têm arte (cota do Canva) — quando forem geradas,
  adicione os arquivos aqui e os nomes no `queue.json`.
- Requisitos da Graph API: imagem JPG, proporção entre 4:5 e 1.91:1 para feed;
  arquivos acessíveis publicamente.

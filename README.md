# Air 15 min — landing page

- `es/` e `pt/`: páginas estáticas prontas (um projeto Vercel por idioma).
- `src/`: fonte do gerador (`build.mjs`, `copy.mjs`, `estilo.css`, `rastreio.js`, `prints.mjs`). Depende de `conteudo/`, `design/`, `app/` e Pillow, que não estão neste repositório.

## Conversions API
`api/capi.js` (função serverless da Vercel), usada pelas duas versões (`/pt/api/capi` é reescrito para `/api/capi`). Variáveis de ambiente do projeto:
- `META_CAPI_TOKEN` (obrigatória): token da Conversions API. Sem ele a função responde 204 e não envia nada.
- `META_PIXEL_ID` (opcional): padrão `3203993276469305`.
- `META_TEST_EVENT_CODE` (opcional): código de "Testar eventos".

## Deploy (Vercel)
Um único projeto, Root Directory vazio (raiz do repo). O `vercel.json` monta `public/`: ES na raiz e PT em `/pt/`.

## Pendências
- `pt/img/` ainda não tem as imagens da versão PT.

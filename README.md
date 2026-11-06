# Air 15 min — landing page

- `es/` e `pt/`: páginas estáticas prontas (um projeto Vercel por idioma).
- `src/`: fonte do gerador (`build.mjs`, `copy.mjs`, `estilo.css`, `rastreio.js`, `prints.mjs`). Depende de `conteudo/`, `design/`, `app/` e Pillow, que não estão neste repositório.

## Conversions API
`es/api/capi.js` e `pt/api/capi.js` (função serverless da Vercel). Variáveis de ambiente em cada projeto:
- `META_CAPI_TOKEN` (obrigatória): token da Conversions API. Sem ele a função responde 204 e não envia nada.
- `META_PIXEL_ID` (opcional): padrão `2054128218991406`.
- `META_TEST_EVENT_CODE` (opcional): código de "Testar eventos".

## Deploy (Vercel)
Um projeto por idioma, ligado a este repositório: Root Directory `es` (air15min-es) e `pt` (air15min-pt), sem build.

## Pendências
- `pt/img/` ainda não tem as imagens da versão PT.

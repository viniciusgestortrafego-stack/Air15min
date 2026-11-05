# Air 15 min — landing page

- `es/` e `pt/`: páginas estáticas prontas (um projeto Vercel por idioma).
- `src/`: fonte do gerador (`build.mjs`, `copy.mjs`, `estilo.css`, `rastreio.js`, `prints.mjs`). Depende de `conteudo/`, `design/`, `app/` e Pillow, que não estão neste repositório.

## Pendências
- `api/capi.js` (Meta Conversions API) não está no repo; o token fica só nas variáveis de ambiente da Vercel.
- `pt/img/` ainda não tem as imagens da versão PT.

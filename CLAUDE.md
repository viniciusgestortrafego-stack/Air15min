# Air 15 min — landing page

Landing page de venda do "Air 15 min" (200 receitas low carb na air fryer, PDF + app). Estática, publicada na Vercel.

## Foco atual
**Só a versão em espanhol (ES).** A versão PT existe no repo mas está parada e incompleta.

## ⚠️ LEMBRETE: ao mexer na página PT
Quando o usuário voltar a trabalhar na `pt/`, **lembrar proativamente** de:
1. **Criar um checkout em português na Hotmart e trocá-lo na PT.** Hoje as duas versões usam o checkout do espanhol (`D108355411J`), com preços diferentes (ES em USD 7.99, PT em R$ 29,84 / 4x R$ 9,09). Trocar em `pt/index.html` (2 botões) e em `src/copy.mjs` (`CONFIG.pt.checkout`).
2. **Adicionar as imagens do PT** em `pt/img/` (hoje vazia, a página PT abre sem imagens). A lista de arquivos está na seção Estrutura abaixo.
3. Trocar `canonical` e `og:url` do PT (hoje `air15min-pt.vercel.app`) por `https://air15min.vercel.app/pt/`.

## Estrutura
```
es/   index.html termos.html privacidade.html img/   (versão ES, na raiz do site)
pt/   index.html termos.html privacidade.html        (versão PT, em /pt; sem img/)
api/  capi.js                                        (Meta Conversions API, única, serve ES e PT)
src/  build.mjs copy.mjs estilo.css rastreio.js prints.mjs   (gerador, só referência)
vercel.json  package.json  README.md
```
- `vercel.json` monta `public/`: `es/` na raiz e `pt/` em `/pt/`; reescreve `/pt/api/capi` → `/api/capi`. Root Directory do projeto na Vercel fica **vazio**.
- Imagens necessárias em `img/` (ES já tem as 20): `hero-arte-760/1254.webp`, `kit-760/1254.webp`, `final`, `cardapio`, `molhos`, `tabela`, `app-home`, `app-receita`, `app-cozinhar` (`.webp`), `icon-192.png`, receitas `r023 r026 r041 r055 r130 r143 r147 r152` (`.webp`). Fonte das imagens ES: `https://aires.voiz.site/img/`.
- `src/` não roda aqui: `build.mjs` depende de `conteudo/`, `design/`, `app/` e Pillow, que não estão neste repo. As páginas em `es/` e `pt/` são a saída pronta; edições pequenas se fazem direto nos HTML **e** em `src/copy.mjs` (para um novo build não desfazê-las).

## Deploy e Git
- Repo: `viniciusgestortrafego-stack/Air15min`. Branch de trabalho e de produção na Vercel: `claude/exciting-knuth-dfr6zo` (não há outra). Sem PR, a menos que o usuário peça.
- Vercel: time "Vinicius' projects" (`team_HWAEZmnCQ4XytR5KjJXbv8gT`), projeto `air15min`, domínio `https://air15min.vercel.app` (ES na raiz, PT em `/pt/`). O conector Vercel desta sessão **não enxerga** esse projeto (404) e não consegue criar projetos (403); o usuário configura e faz redeploy no painel. Cada push na branch redeploya sozinho.
- Rede da sessão: liberados `aires.voiz.site` e `air15min.vercel.app`.

## Checkout e preços
- Checkout Hotmart (ES e PT): `https://pay.hotmart.com/D108355411J?checkoutMode=10`.
- ES: USD 7.99 pagamento único (valor "de" USD 47). PT: R$ 29,84 / 4x R$ 9,09 (valor "de" R$ 220).
- O `rastreio.js` anexa `utm_*`, `src`, `sck`, `fbclid` aos links com `data-checkout`.

## Rastreio (Meta)
- Pixel `3203993276469305`. Eventos: PageView, ViewContent (ao chegar na oferta), InitiateCheckout (clique no checkout), com o mesmo `event_id` no Pixel e na CAPI para deduplicar. Aviso de cookies: "Recusar" desliga o rastreio.
- `api/capi.js`: só POST; valida `event_name` e `event_id`; envia para `graph.facebook.com/v21.0/<pixel>/events`. Responde 204 mesmo quando falta token ou a Meta rejeita (o erro vai para os logs da Vercel); 400/405 para uso inválido.
- Variáveis de ambiente (Vercel): `META_CAPI_TOKEN` (obrigatória, segredo do usuário), `META_PIXEL_ID` (opcional), `META_TEST_EVENT_CODE` (opcional, para o Testar eventos). **Ainda não validamos a entrega real à Meta.** Falta o usuário cadastrar `META_TEST_EVENT_CODE` e eu mandar um evento de teste.

## Convenções
- Responder ao usuário em português. Textos das páginas: ES em espanhol, PT em português do Brasil.
- Mudanças em links, preços ou textos: aplicar em `es/index.html`, `pt/index.html` e `src/copy.mjs`.
- Bug conhecido e já corrigido: `alt="${esc(c.altFinal)}"` literal no `index.html` (aspas simples no `build.mjs` linhas 168 e 316 → crases).
- Commits terminam com as linhas de atribuição pedidas pela sessão.

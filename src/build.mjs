// Gera pagina/pt/index.html e pagina/es/index.html (estáticas) a partir de copy.mjs + conteudo/ + design/.
// Uso: node pagina/src/build.mjs   (com o app rodando em preview, tira prints novos do app: APP_PT/APP_ES)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { COPY, CONFIG } from './copy.mjs'

const RAIZ = path.resolve(import.meta.dirname, '../..')
const CRIATIVOS = path.join(RAIZ, 'design/fotos/criativos')
const FOTOS = path.join(RAIZ, 'design/fotos')
const PRINTS = path.join(import.meta.dirname, 'prints') // prints do app (gerados por prints.mjs)

// Vitrine: as 8 do Tempero; enquanto não há foto da receita, usa as alternativas com foto do Pincel.
const VITRINE = ['r026', 'r041', 'r143', 'r055', 'r023', 'r152', 'r130', 'r147']
const ALTERNATIVAS = ['r009', 'r098']
const FOTO_CRIATIVO = { r055: 'coxinha', r023: 'pao-queijo', r143: 'doce-proibido', r147: 'cheesecake', r009: 'ingredientes-prato-b', r098: 'cesto-aberto' }
const IMAGENS = { hero: 'capa-principal', final: 'jantar-pronto', cardapio: 'cardapio30', molhos: 'molhos30', tabela: 'tabela150', dor: 'frango-brocolis', semaforo: 'semaforo' }

function fotoReceita(id) {
  if (fs.existsSync(FOTOS)) {
    const f = fs.readdirSync(FOTOS).find((x) => x.replace(/\.[a-z]+$/i, '') === id && /\.(webp|jpe?g|png)$/i.test(x))
    if (f) return path.join(FOTOS, f)
  }
  const c = FOTO_CRIATIVO[id]
  return c && fs.existsSync(path.join(CRIATIVOS, `${c}.png`)) ? path.join(CRIATIVOS, `${c}.png`) : null
}

// converte para webp com Pillow (largura máx., recorte 4:5 opcional)
function webp(origem, destino, largura, proporcao) {
  const py = `
import sys
from PIL import Image
o,d,w,r=sys.argv[1],sys.argv[2],int(sys.argv[3]),sys.argv[4]
im=Image.open(o).convert('RGB')
if r!='-':
  a,b=map(float,r.split(':')); alvo=a/b; W,H=im.size
  if W/H>alvo: nw=int(H*alvo); im=im.crop(((W-nw)//2,0,(W-nw)//2+nw,H))
  else: nh=int(W/alvo); im=im.crop((0,(H-nh)//2,W,(H-nh)//2+nh))
if im.width>w: im=im.resize((w,int(im.height*w/im.width)),Image.LANCZOS)
im.save(d,'WEBP',quality=78,method=6)
`
  execFileSync('python3', ['-c', py, origem, destino, String(largura), proporcao ?? '-'])
}

// Pixel ID (público, vai no HTML) lido do ../.env.tracking; o token da CAPI fica só na Vercel
const PIXEL = (() => {
  try {
    return fs.readFileSync(path.join(RAIZ, '..', '.env.tracking'), 'utf8').match(/^META_PIXEL_ID=(\d+)/m)?.[1] ?? ''
  } catch {
    return ''
  }
})()

// arte do George mais recente: nome.png, nome-v2.png, nome-v3.png... (pega a versão mais alta)
function arteRecente(base) {
  const pasta = path.join(RAIZ, 'design/hero')
  if (!fs.existsSync(pasta)) return null
  const versoes = fs.readdirSync(pasta)
    .map((f) => ({ f, m: f.match(new RegExp(`^${base}(?:-v(\\d+))?\\.png$`)) }))
    .filter((x) => x.m)
    .sort((a, b) => Number(b.m[1] ?? 1) - Number(a.m[1] ?? 1))
  return versoes.length ? path.join(pasta, versoes[0].f) : null
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const corFaixa = (g) => (g <= 5 ? '#3E9E62' : g <= 10 ? '#DFA02C' : '#D2703A')

for (const lang of ['pt', 'es']) {
  const c = COPY[lang]
  const cfg = CONFIG[lang]
  const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, 'conteudo', lang, lang === 'pt' ? 'receitas.json' : 'recetas.json'), 'utf8'))
  const porId = new Map(dados.receitas.map((r) => [r.id, r]))
  const cats = new Map(dados.categorias.map((k) => [k.id, k]))
  // a página vende as 200 receitas do livro; categorias extras do app (ex.: sobremesas, 29/10) não entram nas contas
  dados.receitas = dados.receitas.filter((r) => r.categoria !== 'sobremesas')
  const total = dados.receitas.length
  const contagem = { verde: 0, amarelo: 0, laranja: 0 }
  for (const r of dados.receitas) contagem[r.carbo_liquido_g <= 5 ? 'verde' : r.carbo_liquido_g <= 10 ? 'amarelo' : 'laranja']++

  const saida = path.join(RAIZ, 'pagina', lang)
  const img = path.join(saida, 'img')
  fs.rmSync(saida, { recursive: true, force: true })
  fs.mkdirSync(img, { recursive: true })

  for (const [k, nome] of Object.entries(IMAGENS)) {
    const o = path.join(CRIATIVOS, `${nome}.png`)
    if (fs.existsSync(o)) webp(o, path.join(img, `${k}.webp`), k === 'hero' || k === 'final' ? 1000 : 720, k === 'hero' ? '4:5' : '4:5')
  }
  // hero com arte do George (já traz título e subtítulo na imagem): design/hero/hero-<lang>-george.png
  const arteHero = arteRecente(`hero-${lang}-george`)
  const heroArte = !!arteHero
  if (heroArte) {
    webp(arteHero, path.join(img, 'hero-arte-760.webp'), 760)
    webp(arteHero, path.join(img, 'hero-arte-1254.webp'), 1254)
  }
  // mockup do kit completo do George na oferta
  const arteKit = arteRecente(`kit-${lang}-george`)
  const kitArte = !!arteKit
  if (kitArte) console.log(`[pagina] ${lang}: kit = ${path.basename(arteKit)}`)
  if (kitArte) {
    webp(arteKit, path.join(img, 'kit-760.webp'), 760)
    webp(arteKit, path.join(img, 'kit-1254.webp'), 1254)
  }
  const vitrine = [...VITRINE, ...ALTERNATIVAS]
    .map((id) => ({ r: porId.get(id), foto: fotoReceita(id) }))
    .filter((x) => x.r && x.foto)
  vitrine.length = Math.min(8, vitrine.length - (vitrine.length % 2)) // grade sempre par
  for (const v of vitrine) webp(v.foto, path.join(img, `${v.r.id}.webp`), 560, '4:5')
  for (const p of ['home', 'receita', 'cozinhar']) {
    const o = path.join(PRINTS, `${lang}-${p}.png`)
    if (fs.existsSync(o)) webp(o, path.join(img, `app-${p}.webp`), 520)
  }
  for (const f of ['icon-192.png']) fs.copyFileSync(path.join(RAIZ, 'app/public/icons', f), path.join(img, f))

  const tem = (f) => fs.existsSync(path.join(img, f))
  const cta = (texto, href = cfg.checkout, extra = '') =>
    `<a class="btn ${extra}" href="${href}"${href === cfg.checkout ? ' data-checkout' : ''}>${texto}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>`
  const telefone = (print, classe = '') =>
    tem(`app-${print}.webp`) ? `<div class="phone ${classe}"><img src="img/app-${print}.webp" alt="${esc(c.altApp)}" loading="lazy"></div>` : ''

  const html = `<!doctype html>
<html lang="${c.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.description)}">
<meta name="theme-color" content="#16352A">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${cfg.site}/">
${heroArte ? `<meta property="og:image" content="${cfg.site}/img/hero-arte-1254.webp">` : tem('hero.webp') ? `<meta property="og:image" content="${cfg.site}/img/hero.webp">` : ''}
<link rel="canonical" href="${cfg.site}/">
<link rel="icon" href="img/icon-192.png">
<script>window.AIR15=${JSON.stringify({ pixel: PIXEL, moeda: cfg.preco.moeda, valor: cfg.preco.valor, cookies: c.cookies })}</script>
<script>${fs.readFileSync(path.join(import.meta.dirname, 'rastreio.js'), 'utf8')}</script>
<link rel="preconnect" href="https://connect.facebook.net">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800&family=Poppins:wght@500;600;700;800&family=Roboto:wght@400;500;700&display=swap" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800&family=Poppins:wght@500;600;700;800&family=Roboto:wght@400;500;700&display=swap"></noscript>
${heroArte ? '<link rel="preload" as="image" href="img/hero-arte-760.webp" media="(max-width: 979px)" fetchpriority="high"><link rel="preload" as="image" href="img/hero-arte-1254.webp" media="(min-width: 980px)">' : tem('hero.webp') ? '<link rel="preload" as="image" href="img/hero.webp">' : ''}
<style>${fs.readFileSync(path.join(import.meta.dirname, 'estilo.css'), 'utf8')}</style>
</head>
<body>

<div class="barra"><span class="relogio-ico"></span>${c.barra}</div>

${heroArte ? `<header class="hero hero-arte">
  <div class="wrap hero-grid">
    <div class="hero-vis">
      <picture>
        <source media="(min-width: 980px)" srcset="img/hero-arte-1254.webp">
        <img class="hero-img" src="img/hero-arte-760.webp" width="1254" height="1254" alt="${esc(c.altHeroArte)}" fetchpriority="high">
      </picture>
    </div>
    <div class="hero-txt">
      <h1>${c.h1Arte}</h1>
      <p class="sub">${c.subArte}</p>
      ${cta(c.cta1, '#oferta')}${selos(c.selos)}
    </div>
  </div>
</header>` : `<header class="hero">
  <div class="wrap hero-grid">
    <div class="hero-txt">
      <span class="pill">${c.kicker}</span>
      <h1>${c.h1[0]} <br class="br-d">${c.h1[1]} <em>${c.h1[2]}</em> ${c.h1[3]}</h1>
      <p class="sub">${c.sub}</p>
      <div class="so-desk">${cta(c.cta1, '#oferta')}${selos(c.selos)}</div>
    </div>
    <div class="hero-vis">
      ${tem('hero.webp') ? `<img class="hero-foto" src="img/hero.webp" alt="${esc(c.altHero)}" fetchpriority="high">` : ''}
      ${telefone('home', 'hero-phone')}
      <span class="chip chip-a"><i style="background:#3E9E62"></i>${c.chipCarbo}</span>
      <span class="chip chip-b">⏱ ${c.chipTempo}</span>
    </div>
    <div class="so-mob">${cta(c.cta1, '#oferta')}${selos(c.selos)}</div>
  </div>
</header>`}

<section class="sec dor">
  <div class="wrap estreito">
    <p class="kicker">${c.dorKicker}</p>
    <h2>${c.dorTitulo}</h2>
    <ul class="dores">${c.dores.map((d) => `<li><span class="x">✕</span>${d}</li>`).join('')}</ul>
    <p class="fecho">${c.dorFecho}</p>
  </div>
</section>

<section class="sec vitrine">
  <div class="wrap">
    <p class="kicker">${c.solKicker}</p>
    <h2>${c.solTitulo}</h2>
    <p class="lead">${c.solTexto}</p>
    <div class="grade-receitas n${vitrine.length}">
      ${vitrine
        .map(
          ({ r }) => `<article class="card-r">
        <div class="card-foto"><img src="img/${r.id}.webp" alt="${esc(r.titulo)}" loading="lazy"><span class="carbo" style="background:${corFaixa(r.carbo_liquido_g)}">${r.carbo_liquido_g}${c.carbo}</span></div>
        <h3>${esc(r.titulo)}</h3>
        <p>${esc(cats.get(r.categoria)?.nome ?? '')} · ${r.tempo_min} ${c.minutos}</p>
      </article>`,
        )
        .join('')}
    </div>
    <p class="rodape-vitrine">${c.vitrineRodape}</p>
    <div class="centro">${cta(c.cta2, '#oferta')}</div>
  </div>
</section>

<section class="sec como">
  <div class="wrap dois">
    <div class="como-vis">${telefone('receita')}</div>
    <div>
      <p class="kicker">${c.comoKicker}</p>
      <h2 class="esq">${c.comoTitulo}</h2>
      <ul class="lista-como">${c.como.map(([e, t]) => `<li><span>${e}</span>${t}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="sec semaforo">
  <div class="wrap">
    <p class="kicker">${c.semKicker}</p>
    <h2>${c.semTitulo}</h2>
    <p class="lead">${c.semSub}</p>
    <div class="grade-sem">
      ${[['verde', '#3E9E62'], ['amarelo', '#DFA02C'], ['laranja', '#D2703A']]
        .map(
          ([k, cor], i) => `<div class="sem" style="--cor:${cor}">
        <div class="sem-num">${contagem[k]}</div>
        <div><h3>${c.sem[i][0]}</h3><p class="sem-faixa">${c.sem[i][1]}</p><p>${c.sem[i][2]}</p></div>
      </div>`,
        )
        .join('')}
    </div>
    <p class="fecho">${c.semFecho}</p>
  </div>
</section>

<section class="sec beneficios">
  <div class="wrap">
    <h2>${c.benTitulo}</h2>
    <div class="grade-ben">
      ${c.ben.map(([t, d], i) => `<div class="ben"><span class="ben-ico">${['⏱️', '🧮', '🛒'][i]}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec app escuro">
  <div class="wrap dois">
    <div>
      <p class="kicker claro">${c.appKicker}</p>
      <h2 class="esq">${c.appTitulo}</h2>
      <ul class="lista-app">${c.app.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ul>
    </div>
    <div class="app-vis">${telefone('home', 'tras')}${telefone('cozinhar', 'frente')}</div>
  </div>
</section>

<section class="sec bonus">
  <div class="wrap">
    <p class="kicker">🎁 ${c.bonusKicker}</p>
    <h2>${c.bonusTitulo}</h2>
    <p class="lead">${c.bonusSub}</p>
    <div class="grade-bonus">
      ${c.bonus
        .map(
          ([t, d, k], i) => `<article class="card-b">
        ${tem(`${k}.webp`) ? `<img src="img/${k}.webp" alt="${esc(t)}" loading="lazy">` : ''}
        <div class="card-b-txt">
          <span class="tag">${c.bonusN} ${i + 1}</span>
          <h3>${t}</h3>
          <p>${d}</p>
          <p class="preco-b"><s>${c.de} ${cfg.ancoras[k]}</s> ${c.por} <b>${c.gratis}</b></p>
        </div>
      </article>`,
        )
        .join('')}
    </div>
    <div class="centro">${cta(c.cta3, '#oferta', 'btn-ambar')}</div>
  </div>
</section>

<section class="sec oferta" id="oferta">
  <div class="wrap">
    <div class="oferta-card">
      ${kitArte ? `<figure class="kit">
        <img src="img/kit-760.webp" srcset="img/kit-760.webp 760w, img/kit-1254.webp 1254w" sizes="(min-width: 560px) 520px, 100vw" width="1254" height="1254" loading="lazy" alt="${esc(c.altKit)}">
        <figcaption>${c.notaKit}</figcaption>
      </figure>` : ''}
      <p class="kicker">${c.ofertaKicker}</p>
      <h2>${c.ofertaTitulo}</h2>
      <ul class="oferta-lista">${c.ofertaItens.map(([t, k]) => `<li><span class="ok">✓</span><span class="t">${t}</span><s>${cfg.ancoras[k]}</s></li>`).join('')}</ul>
      <div class="total"><span>${c.valorTotal}</span><s>${cfg.preco.total}</s></div>
      <p class="so-hoje">${c.soHoje}</p>
      <p class="preco">${cfg.preco.parcelas}</p>
      <p class="avista">${cfg.preco.avista}</p>
      ${cta(c.cta4, cfg.checkout, 'btn-grande pulso')}
      <p class="oferta-selos">${c.ofertaSelos.map((s, i) => `<span>${['📧', '🔒'][i]} ${s}</span>`).join('')}</p>
    </div>
  </div>
</section>

<section class="sec garantia">
  <div class="wrap estreito garantia-in">
    <div class="selo-g"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56"/><circle cx="60" cy="60" r="46"/></svg><b>${c.garSelo[0]}</b><span>${c.garSelo[1]}</span></div>
    <div><h2 class="esq">${c.garTitulo}</h2><p>${c.garTexto}</p></div>
  </div>
</section>

<section class="sec faq">
  <div class="wrap estreito">
    <h2>${c.faqTitulo}</h2>
    ${c.faq.map(([p, r]) => `<details><summary>${p}<span class="mais"></span></summary><p>${r}</p></details>`).join('')}
  </div>
</section>

<section class="final">
  ${tem('final.webp') ? `<img src="img/final.webp" alt="${esc(c.altFinal)}" loading="lazy">` : ''}
  <div class="final-in wrap estreito">
    <h2>${c.finalTitulo}</h2>
    ${cta(c.cta5, cfg.checkout, 'btn-grande')}
  </div>
</section>

<footer class="rodape">
  <div class="wrap">
    <p><img src="img/icon-192.png" alt="Air 15 min" width="36" height="36"> <b>Air 15 min</b></p>
    <p>${c.rodapeSuporte}: <a href="mailto:${cfg.suporte}">${cfg.suporte}</a> · <a href="termos.html">${c.termos}</a> · <a href="privacidade.html">${c.privacidade}</a></p>
    <p class="aviso">${c.aviso}</p>
    <p class="aviso">${c.copyright}</p>
  </div>
</footer>

</body>
</html>`

  fs.writeFileSync(path.join(saida, 'index.html'), html)
  fs.mkdirSync(path.join(saida, 'api'), { recursive: true })
  fs.copyFileSync(path.join(import.meta.dirname, 'api/capi.js'), path.join(saida, 'api/capi.js'))
  for (const [arquivo, titulo, secoes] of [['termos.html', c.termos, c.termosTexto], ['privacidade.html', c.privacidade, c.privTexto]]) {
    fs.writeFileSync(path.join(saida, arquivo), `<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(titulo)} · Air 15 min</title><meta name="robots" content="noindex"><link rel="icon" href="img/icon-192.png"><style>body{margin:0;background:#FBF8F2;color:#2A2622;font:16px/1.65 system-ui,-apple-system,sans-serif}main{max-width:720px;margin:0 auto;padding:32px 20px 64px}a{color:#2F6B4F}h1{font:800 32px/1.15 Georgia,serif;color:#16352A}h2{font-size:18px;color:#16352A;margin-top:28px}.voltar{display:inline-block;margin-bottom:20px;font-weight:600;text-decoration:none}</style></head><body><main><a class="voltar" href="./">← Air 15 min</a><h1>${esc(titulo)}</h1>${secoes.map(([h, p]) => `<h2>${h}</h2><p>${p.replaceAll('{suporte}', `<a href="mailto:${cfg.suporte}">${cfg.suporte}</a>`)}</p>`).join('')}<p style="margin-top:32px;color:#6F6659;font-size:14px">${c.atualizado}</p></main></body></html>`)
  }
  console.log(`[pagina] ${lang}: ${vitrine.length} receitas na vitrine, ${total} no total (${contagem.verde}/${contagem.amarelo}/${contagem.laranja})`)
}

function selos(lista) {
  const ico = ['✓', '🔒', '🛡️']
  return `<ul class="selos">${lista.map((s, i) => `<li><span>${ico[i]}</span>${s}</li>`).join('')}</ul>`
}

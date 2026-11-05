// Tira prints do app (preview local) para a página: node pagina/src/prints.mjs
// Requer: cd app && npm run preview:pt (4391) e preview:es (4392)
import { chromium } from '../../app/node_modules/playwright-core/index.mjs'
import path from 'node:path'
import fs from 'node:fs'

const out = path.join(import.meta.dirname, 'prints')
fs.mkdirSync(out, { recursive: true })
// receita do print: a primeira da vitrine que já tem foto (senão qualquer r### com foto)
const fotos = fs.readdirSync(path.join(import.meta.dirname, '../../design/fotos')).map((f) => f.replace(/\.[a-z]+$/i, ''))
const RECEITA = ['r055', 'r026', 'r041', 'r143', 'r023', 'r152', 'r130', 'r147'].find((id) => fotos.includes(id)) ?? fotos.filter((f) => /^r\d{3}$/.test(f)).sort()[0] ?? 'r055'
const b = await chromium.launch({ channel: 'chrome' })
for (const [lang, porta] of [['pt', 4391], ['es', 4392]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const p = await ctx.newPage()
  // simula a área segura do iPhone (o notch do mockup não cobre o conteúdo)
  await p.addInitScript(() => addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style')
    s.textContent = '.pt-safe{padding-top:34px!important}'
    document.head.appendChild(s)
  }))
  const base = `http://localhost:${porta}/`
  await p.goto(base)
  await p.evaluate((l) => {
    localStorage.setItem(`air15:${l}:iniciado`, 'true')
    localStorage.setItem(`air15:${l}:instalar-dispensado`, String(Date.now()))
  }, lang)
  await p.goto(base + '#/'); await p.reload(); await p.waitForTimeout(1200)
  await p.screenshot({ path: path.join(out, `${lang}-home.png`) })
  await p.goto(base + `#/receita/${RECEITA}`); await p.waitForTimeout(900)
  await p.screenshot({ path: path.join(out, `${lang}-receita.png`) })
  const n = await p.evaluate(() => document.querySelectorAll('ol li').length)
  // passo com timer, timer rodando
  await p.goto(base + `#/cozinhar/${RECEITA}?passo=${Math.max(0, n - 1)}`); await p.waitForTimeout(600)
  const botao = p.locator('button:has(svg path[d^="M7 4.5"])').first()
  if (await botao.count()) { await botao.click(); await p.waitForTimeout(2300) }
  await p.screenshot({ path: path.join(out, `${lang}-cozinhar.png`) })
  await ctx.close()
}
await b.close()
console.log('prints ok')

// Meta Conversions API (servidor). Recebe os eventos do rastreio.js e reenvia para a Meta
// com o mesmo event_id do Pixel (a Meta deduplica). Variáveis de ambiente na Vercel:
//   META_CAPI_TOKEN        (obrigatória) token de acesso da Conversions API
//   META_PIXEL_ID          (opcional)    padrão: 2054128218991406
//   META_TEST_EVENT_CODE   (opcional)    código de "Testar eventos" do Gerenciador de Eventos
const PIXEL_PADRAO = '2054128218991406'
const EVENTOS = new Set(['PageView', 'ViewContent', 'InitiateCheckout'])

function lerCorpo(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  try {
    return JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || ''))
  } catch {
    return null
  }
}

const texto = (v, max = 2000) => (typeof v === 'string' && v ? v.slice(0, max) : undefined)

export function montarPayload(b, req) {
  const cd = b.custom_data && typeof b.custom_data === 'object' ? b.custom_data : {}
  const custom = {}
  if (texto(cd.content_name, 200)) custom.content_name = cd.content_name
  if (Array.isArray(cd.content_ids)) custom.content_ids = cd.content_ids.filter((x) => typeof x === 'string').slice(0, 10)
  if (texto(cd.content_type, 50)) custom.content_type = cd.content_type
  if (typeof cd.value === 'number' && isFinite(cd.value) && /^[A-Z]{3}$/.test(cd.currency || '')) {
    custom.value = cd.value
    custom.currency = cd.currency
  }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim()
  const user_data = {
    client_user_agent: texto(req.headers['user-agent'], 500),
    client_ip_address: ip || undefined,
    fbp: texto(b.fbp, 200),
    fbc: texto(b.fbc, 400),
  }
  const evento = {
    event_name: b.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: b.event_id,
    action_source: 'website',
    event_source_url: texto(b.event_source_url),
    user_data,
  }
  if (Object.keys(custom).length) evento.custom_data = custom
  return evento
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }
  const b = lerCorpo(req)
  if (!b || !EVENTOS.has(b.event_name) || !texto(b.event_id, 200)) return res.status(400).end()

  const token = process.env.META_CAPI_TOKEN
  if (!token) return res.status(204).end() // sem token: não quebra a página

  const pixel = process.env.META_PIXEL_ID || PIXEL_PADRAO
  const corpo = { data: [montarPayload(b, req)] }
  if (process.env.META_TEST_EVENT_CODE) corpo.test_event_code = process.env.META_TEST_EVENT_CODE

  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    if (!r.ok) console.error('capi', r.status, await r.text())
  } catch (e) {
    console.error('capi', e)
  }
  return res.status(204).end()
}

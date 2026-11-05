// Rastreamento Meta da página (Pixel + /api/capi com o mesmo event_id) e parâmetros do checkout.
// O build injeta window.AIR15 = { pixel, moeda, valor, cookies: { texto, ok, recusar, saiba } }.
(function () {
  var C = window.AIR15 || {}
  var CHAVE = 'air15:cookies'
  var qs = new URLSearchParams(location.search)

  function lerConsent() { try { return localStorage.getItem(CHAVE) } catch (e) { return null } }
  function gravarConsent(v) { try { localStorage.setItem(CHAVE, v) } catch (e) {} }
  var recusou = lerConsent() === 'recusado'

  // ---------- parâmetros para o checkout Hotmart (src, sck, utm_*, fbclid) ----------
  var CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid']
  var params = {}
  CAMPOS.forEach(function (k) { var v = qs.get(k); if (v) params[k] = v })
  if (!params.sck) {
    var utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map(function (k) { return params[k] || '' })
    if (utms.join('')) params.sck = utms.join('|').replace(/\|+$/, '')
  }
  document.querySelectorAll('a[data-checkout]').forEach(function (a) {
    var h = a.getAttribute('href')
    if (!h || h.indexOf('http') !== 0) return
    var u = new URL(h)
    Object.keys(params).forEach(function (k) { if (!u.searchParams.has(k)) u.searchParams.set(k, params[k]) })
    a.href = u.toString()
  })

  // ---------- cookies _fbp / _fbc (o Pixel reaproveita os que já existem) ----------
  function cookie(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : '' }
  function setCookie(n, v, dias) {
    document.cookie = n + '=' + v + '; path=/; max-age=' + dias * 86400 + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '')
  }
  function identificadores() {
    var fbp = cookie('_fbp')
    if (!fbp) { fbp = 'fb.1.' + Date.now() + '.' + Math.floor(Math.random() * 1e10); setCookie('_fbp', fbp, 90) }
    var fbc = cookie('_fbc'), clid = qs.get('fbclid')
    if (clid && (!fbc || fbc.split('.').slice(3).join('.') !== clid)) { fbc = 'fb.1.' + Date.now() + '.' + clid; setCookie('_fbc', fbc, 90) }
    return { fbp: fbp, fbc: fbc || undefined }
  }

  // ---------- Pixel ----------
  function carregarPixel() {
    if (!C.pixel || window.fbq) return
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    window.fbq('init', C.pixel)
  }

  var produto = { content_name: 'Air 15 min', content_ids: ['air15min'], content_type: 'product' }
  function evento(nome, comValor) {
    if (recusou || !C.pixel) return
    var id = nome + '.' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2, 10)
    var cd = nome === 'PageView' ? {} : Object.assign({}, produto, comValor && C.valor ? { value: C.valor, currency: C.moeda } : {})
    var ids = identificadores()
    if (window.fbq) window.fbq('track', nome, cd, { eventID: id })
    var corpo = JSON.stringify({ event_name: nome, event_id: id, event_source_url: location.href, fbp: ids.fbp, fbc: ids.fbc, custom_data: cd })
    try {
      // sendBeacon sobrevive à troca de página (clique no checkout)
      if (navigator.sendBeacon && navigator.sendBeacon('api/capi', new Blob([corpo], { type: 'application/json' }))) return
      fetch('api/capi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true }).catch(function () {})
    } catch (e) {}
  }

  function iniciar() {
    identificadores()
    carregarPixel()
    evento('PageView')
    // ViewContent: chegou na oferta
    var oferta = document.getElementById('oferta')
    if (oferta && 'IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { evento('ViewContent', true); obs.disconnect() }
      }, { threshold: 0.25 })
      obs.observe(oferta)
    }
  }
  // InitiateCheckout: clique em qualquer botão de compra
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-checkout]')
    if (a) evento('InitiateCheckout', true)
  }, true)

  // ---------- aviso de cookies (LGPD): mede por padrão, "Recusar" desliga e apaga os cookies ----------
  function aviso() {
    if (lerConsent() || !C.cookies) return
    var d = document.createElement('div')
    d.className = 'cookies'
    d.setAttribute('role', 'dialog')
    d.innerHTML = '<p>' + C.cookies.texto + ' <a href="privacidade.html">' + C.cookies.saiba + '</a></p>' +
      '<div><button type="button" data-v="recusado">' + C.cookies.recusar + '</button><button type="button" data-v="aceito" class="ok">' + C.cookies.ok + '</button></div>'
    d.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-v')
      if (!v) return
      gravarConsent(v)
      if (v === 'recusado') {
        recusou = true
        if (window.fbq) window.fbq('consent', 'revoke')
        setCookie('_fbp', '', 0); setCookie('_fbc', '', 0)
      }
      d.remove()
    })
    document.body.appendChild(d)
  }

  if (!recusou) iniciar()
  aviso()
})()

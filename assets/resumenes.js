/* Transformación hacia la IA · resúmenes (one-pagers) de cada etapa, por sector. Sin cookies ni peticiones externas. */
(function () {
  'use strict';
  const D = window.SERIE;
  const $ = (s, r = document) => r.querySelector(s);
  const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } } };
  function el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'on') for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  }
  const OP = D.onepagers || {};
  const conOP = D.sectores.filter(s => (OP[s.id] || []).length);
  const Q = new URLSearchParams(location.search);
  let sector = [Q.get('s'), LS.get('ia-sector', null)].find(id => conOP.some(s => s.id === id)) || (conOP[0] || {}).id;

  function pintar() {
    const s = D.sectores.find(x => x.id === sector);
    document.querySelectorAll('[data-org]').forEach(n => n.textContent = s ? s.org : 'tu organización');
    $('.barra-res .sec').replaceChildren(...conOP.map(x => el('button', { class: x.id === sector ? 'on' : '', 'aria-pressed': x.id === sector, on: { click: () => poner(x.id) } }, x.n)));
    const lista = OP[sector] || [];
    const todos = $('.todos');
    todos.hidden = !lista.length;
    todos.href = 'onepagers/' + sector + '/todos.pdf';
    todos.setAttribute('download', 'transformacion-ia-' + sector + '-resumenes.pdf');
    $('.ops').replaceChildren(...(lista.length ? lista.map(o => {
      const base = 'onepagers/' + sector + '/' + o.id;
      return el('article', {},
        el('a', { href: base + '.pdf', target: '_blank', rel: 'noopener', 'aria-label': 'Abrir: ' + o.k + ' · ' + o.t }, el('img', { src: base + '.jpg', alt: '', loading: 'lazy', width: 1600, height: 1131 })),
        el('div', {}, el('span', { class: 'k' }, o.k), el('h2', {}, o.t),
          el('p', { class: 'acc' }, el('a', { href: base + '.pdf', download: 'transformacion-ia-' + sector + '-' + o.id + '.pdf' }, 'Descargar PDF'),
            el('a', { href: './?s=' + sector + '&rol=todo#cap-' + o.cap }, 'Ver los vídeos de la etapa'))));
    }) : [el('p', { class: 'vacio' }, 'Todavía no hay resúmenes publicados.')]));
  }
  function poner(id) {
    sector = id; LS.set('ia-sector', id);
    history.replaceState(null, '', location.pathname + '?s=' + id);
    pintar();
  }
  document.querySelectorAll('[data-anio]').forEach(n => n.textContent = new Date().getFullYear());
  pintar();
})();

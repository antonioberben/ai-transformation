/* Transformación hacia la IA · demostraciones prácticas (página aparte).
   Sin cookies ni peticiones externas hasta que la persona pulsa reproducir un vídeo. */
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
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  const etapa = id => D.tronco.find(n => n.id === id);
  const nEtapa = id => { const n = etapa(id); return n ? n.k + ' · ' + n.t : id; };
  const nRol = id => (D.roles.find(r => r.id === id) || { n: id }).n;

  const Q = new URLSearchParams(location.search);
  const f = { etapa: Q.get('etapa'), rol: Q.get('rol') };
  const toca = d => (!f.etapa || d.etapa === f.etapa || (d.tambien || []).includes(f.etapa)) && (!f.rol || d.roles.includes(f.rol));

  function filtros() {
    const etapas = D.tronco.filter(n => D.demos.some(d => d.etapa === n.id || (d.tambien || []).includes(n.id))).map(n => n.id);
    const roles = D.roles.filter(r => D.demos.some(d => d.roles.includes(r.id))).map(r => r.id);
    const fila = (k, ids, nombre) => {
      const box = $('[data-f="' + k + '"]');
      box.replaceChildren(box.firstElementChild,
        el('button', { class: f[k] ? '' : 'on', on: { click: () => poner(k, null) } }, 'Todas'),
        ...ids.map(id => el('button', { class: f[k] === id ? 'on' : '', on: { click: () => poner(k, id) } }, nombre(id))));
    };
    fila('etapa', etapas, nEtapa); fila('rol', roles, nRol);
  }
  function poner(k, v) {
    f[k] = v;
    const p = new URLSearchParams(location.search);
    v ? p.set(k, v) : p.delete(k);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    pintar();
  }

  function tarjeta(d) {
    return el('article', { class: 'demo' },
      el('button', { class: 'portada', 'aria-label': 'Reproducir: ' + d.t, on: { click: () => abrir(d) } },
        el('span', { class: 'k' }, 'Demostración'), el('span', { class: 'pt' }, d.t),
        el('span', { class: 'play' }), el('span', { class: 'dur' }, mmss(d.d))),
      el('div', { class: 'txt' },
        el('div', { class: 'tags' }, el('span', { class: 'e' }, nEtapa(d.etapa)), ...(d.tambien || []).map(id => el('span', {}, 'también ' + etapa(id).k))),
        el('h2', {}, d.t),
        el('p', { class: 'preg' }, d.preg),
        el('p', {}, d.ve),
        el('ul', {}, d.dem.map(x => el('li', {}, x))),
        el('p', { class: 'roles' }, 'Interesa sobre todo a ' + d.roles.map(nRol).join(', ') + '.')));
  }
  function pintar() {
    filtros();
    const lista = D.demos.filter(toca);
    $('.demos').replaceChildren(...(lista.length ? lista.map(tarjeta) : [el('p', { class: 'vacio' }, 'No hay demostraciones con ese filtro.')]));
  }

  /* Ventana de vídeo: mismo aviso de Vimeo que en la serie */
  const modal = $('#modal');
  let ultimoFoco = null;
  function abrir(d) {
    ultimoFoco = document.activeElement;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    const player = $('.player', modal);
    const cargar = () => {
      const src = 'https://player.vimeo.com/video/' + encodeURIComponent(d.vimeo) + '?autoplay=1&title=0&byline=0&portrait=0' + (d.h ? '&h=' + encodeURIComponent(d.h) : '');
      player.replaceChildren(el('iframe', { src, allow: 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media', title: d.t }));
    };
    if (!d.vimeo) {
      player.replaceChildren(el('div', { class: 'velo' }, el('p', {}, 'Este vídeo estará disponible en breve.')));
    } else if (LS.get('ia-vimeo-ok', false)) {
      cargar();
    } else {
      player.replaceChildren(el('div', { class: 'velo' },
        el('p', {}, 'Los vídeos se reproducen con Vimeo. Al pulsar reproducir, se carga su reproductor, que usa cookies propias, también de medición de audiencia.'),
        el('div', { class: 'bt' }, el('button', { on: { click: () => { LS.set('ia-vimeo-ok', true); cargar(); } } }, '▶ Reproducir'), el('a', { href: 'privacidad.html', target: '_blank', rel: 'noopener' }, 'Más información'))));
    }
    $('.info', modal).replaceChildren(
      el('div', {}, el('div', { class: 'k' }, 'DEMOSTRACIÓN PRÁCTICA · ' + nEtapa(d.etapa).toUpperCase()), el('h3', {}, d.t)),
      el('div', { class: 'nav' }, el('button', { on: { click: cerrar } }, 'Volver a las demostraciones')));
    $('.cerrar', modal).focus();
  }
  function cerrar() {
    if (modal.hidden) return;
    $('.player', modal).replaceChildren();
    modal.hidden = true; document.body.style.overflow = '';
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
  }
  $('.cerrar', modal).addEventListener('click', cerrar);
  modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });

  document.querySelectorAll('[data-anio]').forEach(n => n.textContent = new Date().getFullYear());
  pintar();
})();

/* Transformación hacia la IA · camino por rol.
   Sin cookies ni peticiones externas hasta que la persona pulsa reproducir un vídeo. */
(function () {
  'use strict';
  const D = window.SERIE;
  const $ = (s, r = document) => r.querySelector(s);
  const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } } };
  const sinMov = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const movil = () => matchMedia('(max-width: 900px)').matches;

  function el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'on') for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  }
  const autor = () => $('#autor-tpl').content.cloneNode(true);
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  const minutos = s => Math.round(s / 60) + ' min';

  /* Estado: sector y rol vienen del enlace (?s=…&rol=…) o de la última visita */
  const Q = new URLSearchParams(location.search);
  let sector = D.sectores.some(s => s.id === Q.get('s')) ? Q.get('s') : LS.get('ia-sector', null);
  if (!D.sectores.some(s => s.id === sector)) sector = null;
  let rol = D.roles.find(r => r.id === Q.get('rol')) || null;
  const vistos = new Set(LS.get('ia-vistos', []));
  const sec = () => D.sectores.find(s => s.id === sector);
  const vid = slug => ({ slug, ...D.videos[slug], ...((D.porSector[sector] || {})[slug] || {}) });
  const area = id => D.areas.find(a => a.id === id);

  function actualizarURL() {
    const p = new URLSearchParams();
    if (sector) p.set('s', sector);
    if (rol) p.set('rol', rol.id);
    const q = p.toString();
    history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
  }

  /* Cabecera: sectores */
  function pintarSectores() {
    const nav = $('.sectores');
    nav.replaceChildren(...D.sectores.map(s => el('button', { class: s.id === sector ? 'on' : '', 'aria-pressed': s.id === sector, on: { click: () => ponerSector(s.id) } }, s.n)));
    nav.hidden = !sector;
    document.querySelectorAll('[data-org]').forEach(n => n.textContent = sec() ? sec().org : 'tu organización');
  }
  function ponerSector(id) {
    sector = id; LS.set('ia-sector', id); actualizarURL(); pintarSectores(); pintarEntrada();
    if (rol) pintarRuta();
  }

  /* Entrada */
  function pintarEntrada() {
    $('.premisas').replaceChildren(...D.premisas.map((p, i) => el('li', {}, el('span', { class: 'n' }, String(i + 1).padStart(2, '0')), el('div', {}, el('b', {}, p.t), el('small', {}, p.d)))));
    $('.autor-hueco').replaceChildren(autor());
    $('.sector-grid').replaceChildren(...D.sectores.map(s => el('button', { class: s.id === sector ? 'on' : '', on: { click: () => ponerSector(s.id) } }, s.n)));
    $('[data-paso="rol"]').classList.toggle('apagado', !sector);
    $('.rol-grid').replaceChildren(
      ...D.roles.map(r => { const a = area(r.area); return el('button', { on: { click: () => elegirRol(r) } }, el('i', { style: 'background:' + (a ? a.color : '#fff') }), el('div', {}, el('b', {}, r.n), el('span', {}, r.d))); }),
      el('button', { class: 'todo', on: { click: () => elegirRol(D.todo) } }, el('i', { style: 'background:#9DA1BD' }), el('div', {}, el('b', {}, D.todo.n), el('span', {}, D.todo.d))));
  }
  function elegirRol(r) {
    rol = r; actualizarURL(); pintarRuta(); scrollTo({ top: 0, behavior: 'auto' });
  }
  function volverEntrada() {
    rol = null; actualizarURL();
    $('#ruta').hidden = true; $('#entrada').hidden = false; pintarEntrada(); scrollTo({ top: 0 });
  }

  /* Camino: tronco + rama del rol */
  function camino() {
    const a = rol && area(rol.area), out = [];
    D.tronco.forEach(n => {
      n.videos.forEach(s => out.push(s));
      if (n.rama) {
        if (a) out.push(n.rama === 3 ? a.v3 : a.v6);
        else if (rol && rol.id === 'todo') D.areas.forEach(x => out.push(n.rama === 3 ? x.v3 : x.v6));
      }
    });
    return out;
  }

  let io;
  function pintarRuta() {
    if (!sector) return;
    $('#entrada').hidden = true; $('#ruta').hidden = false;
    const a = area(rol.area), lista = camino();
    document.documentElement.style.setProperty('--lane', a ? a.color : 'var(--purple)');
    const total = lista.reduce((t, s) => t + (vid(s).d || 0), 0);
    const hechos = lista.filter(s => vistos.has(sector + '/' + s)).length;

    $('.rail').replaceChildren(
      el('div', { class: 'quien' },
        el('div', { class: 'k' }, 'TU CAMINO · ' + sec().n.toUpperCase()),
        el('b', {}, rol.id === 'todo' ? 'Todo el recorrido' : rol.n),
        el('div', { class: 'meta' }, lista.length + ' vídeos · ' + minutos(total)),
        el('div', { class: 'barra' }, el('i', { style: 'width:' + (lista.length ? hechos / lista.length * 100 : 0) + '%' })),
        el('div', { class: 'acciones' }, el('span', {}, hechos + ' de ' + lista.length + ' vistos'), el('button', { on: { click: volverEntrada } }, 'Cambiar de rol'))),
      el('ol', { class: 'indice' }, D.tronco.flatMap(n => {
        const hecho = n.videos.length && n.videos.every(s => vistos.has(sector + '/' + s));
        const li = [el('li', { 'data-cap': n.id, class: (hecho ? 'hecho ' : '') + (n.videos.length ? '' : 'sin'), on: { click: () => irA(n.id) } }, n.k + ' · ' + n.t)];
        if (n.rama && a) {
          const s = n.rama === 3 ? a.v3 : a.v6;
          li.push(el('li', { class: 'rama' + (vistos.has(sector + '/' + s) ? ' hecho' : ''), 'data-cap': n.id, on: { click: () => irA(n.id) } }, n.rama === 3 ? 'Primer caso en tu área' : 'Agentes en tu área'));
        }
        return li;
      })));
    $('.rail').append(autor());

    const caps = D.tronco.map(n => {
      const cap = el('section', { class: 'cap', id: 'cap-' + n.id }, el('div', { class: 'k' }, n.k), el('h2', {}, n.t));
      if (n.rama === 3) cap.append(divide(a));
      cap.append(el('p', { class: 'por' }, n.por));
      cap.append(el('div', { class: 'grid' }, n.videos.map(s => miniatura(s, lista)), n.videos.length ? null : el('div', { class: 'sinvideo' }, n.sin)));
      if ((D.demos || []).some(d => d.etapa === n.id || (d.tambien || []).includes(n.id)))
        cap.append(el('a', { class: 'practica-link', href: 'practica.html?etapa=' + n.id }, 'Ver una implementación práctica de esta etapa →'));
      if (n.rama) {
        if (a) {
          const s = n.rama === 3 ? a.v3 : a.v6;
          cap.append(el('div', { class: 'tuya' }, el('div', { class: 'k2' }, 'Tu área · ' + a.n), miniatura(s, lista, { lado: true, sinRol: true })));
        } else if (rol.clave && n.rama === 3) {
          cap.append(el('div', { class: 'tuya' }, el('div', { class: 'k2' }, rol.clave)));
        }
        const otras = D.areas.filter(x => x !== a);
        const det = el('details', { class: 'otras' }, el('summary', {}, rol.id === 'todo' ? 'Las seis áreas' : 'Ver las otras ' + otras.length + ' áreas'),
          el('div', { class: 'grid' }, otras.map(x => miniatura(n.rama === 3 ? x.v3 : x.v6, rol.id === 'todo' ? lista : [n.rama === 3 ? x.v3 : x.v6]))));
        if (rol.id === 'todo') det.open = true;
        cap.append(det);
      }
      return cap;
    });
    caps.push(el('section', { class: 'cap', id: 'cap-cierre' }, el('div', { class: 'k' }, 'Cierre'), el('h2', {}, 'Lo que te llevas'),
      el('p', { class: 'cierre-txt' }, D.cierre.replace('{org}', sec().org))));
    $('.cont').replaceChildren(...caps);

    if (io) io.disconnect();
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting && e.target.classList.contains('cap')) {
          const id = e.target.id.replace('cap-', '');
          document.querySelectorAll('.indice li').forEach(li => li.classList.toggle('on', li.dataset.cap === id));
        }
        if (e.target.classList.contains('thumb')) e.target.classList.toggle('foco', e.isIntersecting);
      }), { rootMargin: '-45% 0px -50% 0px' });
      document.querySelectorAll('.cap[id]').forEach(c => io.observe(c));
      if (movil()) document.querySelectorAll('.cont .thumb').forEach(t => io.observe(t));
    }
    const m = location.hash.match(/^#v=([\w-]+)$/);
    if (m && D.videos[m[1]]) abrir(m[1], lista);
  }

  function divide(a) {
    const ico = el('span', { 'aria-hidden': 'true' });
    ico.innerHTML = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke-width="3" stroke-linecap="round"><path d="M4 12h32" stroke="#fff"/><path d="M12 12c8 0 6 16 14 16h10" stroke="#CC85FF"/><path d="M12 12c8 0 6 8 14 8h10" stroke="#8023C3"/></svg>';
    return el('div', { class: 'divide' }, ico,
      el('div', {}, el('b', {}, 'Aquí el camino se divide por rol'),
        el('span', {}, a ? 'El tronco común sigue y, además, tu área tiene su propio vídeo en esta etapa y en la 6.' : 'El tronco común sigue y cada área tiene su propio vídeo en esta etapa y en la 6.')));
  }
  function irA(id) { const c = document.getElementById('cap-' + id); if (c) c.scrollIntoView({ behavior: sinMov ? 'auto' : 'smooth' }); }

  function miniatura(slug, lista, o = {}) {
    const v = vid(slug), hecho = vistos.has(sector + '/' + slug);
    return el('button', { class: 'thumb' + (o.lado ? ' lado' : '') + (hecho ? ' hecho' : ''), 'aria-label': 'Reproducir: ' + v.t, on: { click: () => abrir(slug, lista) } },
      el('span', { class: 'img' }, el('img', { src: 'img/' + sector + '/' + slug + '.jpg', alt: '', loading: 'lazy', width: 640, height: 360 }),
        v.rol && !o.sinRol ? el('span', { class: 'rol' }, 'para ' + v.rol) : null,
        el('span', { class: 'play' }), v.d ? el('span', { class: 'dur' }, mmss(v.d)) : null, el('span', { class: 'visto' }, '✓ Visto')),
      el('span', {}, el('span', { class: 't' }, v.t), v.sub ? el('span', { class: 's' }, v.sub) : null));
  }

  /* Ventana de vídeo. El reproductor de Vimeo solo se carga tras aceptar el aviso la primera vez. */
  const modal = $('#modal');
  let lista = [], idx = 0, ultimoFoco = null;
  function abrir(slug, l) {
    lista = l && l.includes(slug) ? l : [slug]; idx = lista.indexOf(slug);
    ultimoFoco = document.activeElement;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    pintarVideo();
    $('.cerrar', modal).focus();
  }
  function pintarVideo() {
    const slug = lista[idx], v = vid(slug);
    history.replaceState(null, '', location.pathname + location.search + '#v=' + slug);
    const player = $('.player', modal);
    const cargar = () => {
      vistos.add(sector + '/' + slug); LS.set('ia-vistos', [...vistos]);
      const src = 'https://player.vimeo.com/video/' + encodeURIComponent(v.vimeo) + '?autoplay=1&title=0&byline=0&portrait=0' + (v.h ? '&h=' + encodeURIComponent(v.h) : '');
      player.replaceChildren(el('iframe', { src, allow: 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media', title: v.t }));
    };
    const fondo = el('img', { src: 'img/' + sector + '/' + slug + '.jpg', alt: '' });
    if (!v.vimeo) {
      player.replaceChildren(fondo, el('div', { class: 'velo' }, el('p', {}, 'Este vídeo estará disponible en breve.')));
    } else if (LS.get('ia-vimeo-ok', false)) {
      cargar();
    } else {
      player.replaceChildren(fondo, el('div', { class: 'velo' },
        el('p', {}, 'Los vídeos se reproducen con Vimeo. Al pulsar reproducir, se carga su reproductor, que usa cookies propias, también de medición de audiencia.'),
        el('div', { class: 'bt' }, el('button', { on: { click: () => { LS.set('ia-vimeo-ok', true); cargar(); } } }, '▶ Reproducir'), el('a', { href: 'privacidad.html', target: '_blank', rel: 'noopener' }, 'Más información'))));
    }
    const sig = lista[idx + 1];
    $('.info', modal).replaceChildren(
      el('div', {}, el('div', { class: 'k' }, (v.etapa + ' · ' + sec().n).toUpperCase()), el('h3', {}, v.t)),
      el('div', { class: 'nav' },
        idx > 0 ? el('button', { on: { click: () => { idx--; pintarVideo(); } } }, '← Anterior') : null,
        sig ? el('button', { class: 'pri', title: vid(sig).t, on: { click: () => { idx++; pintarVideo(); } } }, 'Siguiente en tu camino →') : el('button', { on: { click: cerrar } }, 'Volver al camino')));
  }
  function cerrar() {
    if (modal.hidden) return;
    $('.player', modal).replaceChildren();
    modal.hidden = true; document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
    if (rol) { const y = scrollY; pintarRuta(); scrollTo(0, y); }
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
  }
  $('.cerrar', modal).addEventListener('click', cerrar);
  modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  // Al acabar un vídeo, se destaca «Siguiente en tu camino» (eventos del reproductor por postMessage)
  addEventListener('message', e => {
    if (e.origin !== 'https://player.vimeo.com') return;
    let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    const f = $('.player iframe', modal);
    if (d && d.event === 'ready' && f) f.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'ended' }), 'https://player.vimeo.com');
    if (d && d.event === 'ended') { const b = $('.nav .pri', modal); if (b) b.classList.add('listo'); }
  });

  document.querySelectorAll('[data-anio]').forEach(n => n.textContent = new Date().getFullYear());
  pintarSectores(); pintarEntrada();
  if (rol && sector) pintarRuta();
})();

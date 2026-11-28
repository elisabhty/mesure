/* Attractions de Wonderland : chaque mini-jeu se joue dans une attraction du parc.
   Montagnes russes : deux voies. Grande roue : trois nacelles ou plus (et les paires). Petit train : des étapes à poser dans l'ordre.
   Avec une solution (spec.key), chaque choix est jugé tout de suite : le bon est accepté, le mauvais revient avec l'explication de la mission.
   Sans solution, on range tout puis on vérifie. Les événements émis restent ceux des anciennes planches. */
(() => {
const P = window.PBQ;
const { h, esc, fr, $, $$ } = P;
/* fast : tests automatiques (tout est instantané) ; calm : mouvement réduit (rien ne se déplace, mais les délais de lecture restent) */
const fast = () => !!window.PBQ_FAST;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const quick = () => fast() || calm();
const later = (ms, f) => setTimeout(f, fast() ? 0 : ms);
const pause = ms => new Promise(r => later(ms, r));
const act = (type, payload) => P.act(type, payload);
/* Essai à blanc : la mission juge un choix (et l'explique) sans clore l'exercice */
const probe = (type, payload) => P.probe ? P.probe(type, payload) : undefined;
const announce = m => { if (P.announce) P.announce(m); };
const shake = el => P.shake(el);
const EASE = 'cubic-bezier(.22,.8,.24,1)';

/* Geste de glisser : il démarre après quelques pixels, un simple toucher reste un clic.
   end(ev, annulé, vitesse) reçoit la vitesse du doigt sur ses 100 dernières ms (px écran par ms). */
function draggable(el, o) {
  el.addEventListener('pointerdown', e => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || el.closest('.j-locked') || (o.can && !o.can(e))) return;
    const x0 = e.clientX, y0 = e.clientY, id = e.pointerId; let on = false;
    const pts = [[x0, y0, e.timeStamp]];
    const mv = ev => {
      if (ev.pointerId !== id) return;
      pts.push([ev.clientX, ev.clientY, ev.timeStamp]); if (pts.length > 8) pts.shift();
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!on && Math.hypot(dx, dy) > 7) { on = true; o.start && o.start(ev); }
      if (on) { ev.preventDefault(); o.move && o.move(dx, dy, ev); }
    };
    const up = ev => {
      if (ev.pointerId !== id) return;
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (!on) return;
      el._dragged = performance.now();
      /* Souris : le clic de fin de glisser vise l'ancêtre commun (plateau, dock) et relançait le dialogue ; on l'ignore */
      const kill = c => { if (c.target.contains(el)) { c.stopPropagation(); c.preventDefault(); } };
      addEventListener('click', kill, true); setTimeout(() => removeEventListener('click', kill, true), 450);
      const r = pts.filter(p => ev.timeStamp - p[2] < 100), a = r[0], b = r[r.length - 1];
      const v = r.length > 1 && b[2] > a[2] ? { x: (b[0] - a[0]) / (b[2] - a[2]), y: (b[1] - a[1]) / (b[2] - a[2]) } : { x: 0, y: 0 };
      o.end && o.end(ev, ev.type === 'pointercancel', v);
    };
    addEventListener('pointermove', mv, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
  /* Le clic qui suit un glisser ne compte pas comme un toucher */
  el.addEventListener('click', e => { if (el._dragged && performance.now() - el._dragged < 450) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
const inside = (x, y, el, pad = 8) => { const r = el.getBoundingClientRect(); return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad; };
/* Échelle d'affichage (le téléphone est réduit sur ordinateur) */
const scaleOf = el => { const r = el.getBoundingClientRect(); return el.offsetWidth ? r.width / el.offsetWidth : 1; };
/* Animation FLIP : les éléments glissent de leur ancienne place vers la nouvelle */
function flip(els, change) {
  const before = new Map(els.map(e => [e, e.getBoundingClientRect()]));
  change();
  if (quick()) return;
  els.forEach(e => {
    if (!e.isConnected) return;
    const a = before.get(e), b = e.getBoundingClientRect(), k = scaleOf(e) || 1;
    const dx = (a.left - b.left) / k, dy = (a.top - b.top) / k;
    if (!dx && !dy) return;
    e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 380, easing: EASE });
  });
}
/* Une puce qui arrive ou repart change de hauteur en douceur : les voisines glissent au lieu de sauter */
function grow(el) {
  if (quick()) return;
  const cs = getComputedStyle(el), H = el.offsetHeight, m = el.previousElementSibling ? '-4px' : '-5px';
  el.style.overflow = 'hidden';
  el.animate([{ height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: m }, { height: H + 'px', paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, marginTop: '0px' }], { duration: 280, easing: EASE })
    .onfinish = () => { el.style.overflow = ''; };
}
function shrink(el) {
  el.removeAttribute('data-r'); el.disabled = true; el.classList.add('out');
  if (quick()) return el.remove();
  const solo = el.parentElement.children.length === 1, first = !el.previousElementSibling;
  el.style.overflow = 'hidden';
  el.animate([{ height: el.offsetHeight + 'px', opacity: 1 }, { height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: solo ? '-5px' : first ? '0px' : '-4px', marginBottom: !solo && first ? '-4px' : '0px', opacity: 0, transform: 'scale(.92)' }],
    { duration: 220, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).onfinish = () => el.remove();
}
/* Première rencontre avec une attraction : elle montre son geste toute seule, une fois par appareil. Un toucher l'interrompt. */
function demo(kind, root, play) {
  if (quick()) return;
  let seen = []; try { seen = JSON.parse(localStorage.getItem('pbq-gestes') || '[]'); } catch (e) {}
  if (seen.includes(kind)) return;
  const D = { stop: false, over: false, anims: [], t: 0 };
  const cancel = () => { if (D.over) return; D.stop = true; clearTimeout(D.t); D.anims.forEach(a => a.cancel()); if (D.end) D.end(); };
  root.addEventListener('pointerdown', cancel, { once: true, capture: true });
  const tryPlay = () => {
    if (D.stop || !root.isConnected) return;
    if (root.closest('.app:not(.is-on), .answer:not(.on)') || !root.offsetWidth) { D.t = setTimeout(tryPlay, 500); return; }
    seen.push(kind); try { localStorage.setItem('pbq-gestes', JSON.stringify(seen)); } catch (e) {}
    play(D); setTimeout(() => { D.over = true; }, 1500);
  };
  D.t = setTimeout(tryPlay, 1100);
}

/* ───────── Effets : vibration, étincelles, combo ───────── */
let hapt = null;
function buzz(kind) {
  if (fast()) return;
  try { if (navigator.vibrate) { navigator.vibrate(kind === 'no' ? [12, 60, 12] : 9); return; } } catch (e) {}
  /* iPhone : basculer un interrupteur système donne un léger retour haptique (pendant un geste seulement) */
  try {
    if (!hapt) { hapt = document.createElement('label'); hapt.setAttribute('aria-hidden', 'true'); hapt.style.display = 'none'; const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1; hapt.appendChild(i); document.head.appendChild(hapt); }
    hapt.click();
  } catch (e) {}
}
const hostOf = el => (el && el.closest('.layer')) || document.body;
function at(el, host) { const k = scaleOf(host) || 1, hr = host.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - hr.left) / k, y: (r.top + r.height / 2 - hr.top) / k, w: host.offsetWidth }; }
/* Gerbe d'étincelles dorées autour d'un élément */
function sparks(el, n = 14, spread = 1) {
  if (quick() || !el || !el.isConnected || !el.offsetWidth) return;
  const host = hostOf(el), p = at(el, host);
  const fx = h('<div class="fx" aria-hidden="true"></div>'); fx.style.left = p.x + 'px'; fx.style.top = p.y + 'px';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'), a = Math.PI * 2 * (i / n) + Math.random() * .6, d = (28 + Math.random() * 38) * spread, z = 4 + Math.random() * 5;
    if (i % 3 === 0) s.className = 'st';
    s.style.width = s.style.height = z.toFixed(1) + 'px';
    fx.appendChild(s);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 8;
    s.animate([{ transform: 'translate(-50%, -50%) scale(.3)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) scale(1)`, opacity: 1, offset: .5 }, { transform: `translate(calc(-50% + ${(dx * 1.2).toFixed(1)}px), calc(-50% + ${(dy * 1.2 + 26).toFixed(1)}px)) scale(.2)`, opacity: 0 }],
      { duration: 650 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
  }
  host.appendChild(fx); setTimeout(() => fx.remove(), 1100);
}
const BOLT = '<svg viewBox="0 0 12 16" aria-hidden="true"><path d="M7.2 1L1.5 9.2h4L4.6 15l5.9-8.4h-4z" fill="currentColor"/></svg>';
function comboPill(el, n) {
  if (quick() || !el || !el.isConnected || !el.offsetWidth) return;
  const host = hostOf(el), p = at(el, host);
  host.querySelectorAll(':scope > .fx-combo').forEach(x => x.remove());
  const c = h(`<div class="fx-combo" aria-hidden="true">${BOLT}<span>Combo ×${n}</span></div>`);
  c.style.left = Math.max(70, Math.min(p.w - 70, p.x)) + 'px'; c.style.top = Math.max(60, p.y - 34) + 'px';
  host.appendChild(c); setTimeout(() => c.remove(), 1350);
}
/* Bonne réponse : la série continue (combo dès la deuxième d'affilée) et l'élément s'illumine */
function win(el) {
  const X = P.X; let n = 1;
  if (X) { X.streak = (X.streak || 0) + 1; n = X.streak; }
  sparks(el);
  if (n >= 2) comboPill(el, n);
}

/* Registre des attractions : pendant la génération (tests), chaque attraction réussie est décrite dans la console */
function harvest(kind, data) {
  if (!window.PBQ_HARVEST || !P.active) return;
  try { console.log('ARC ' + JSON.stringify({ m: P.active.id, i: P.X ? P.X.i : null, kind, ...data })); } catch (e) {}
}

/* ───────── Habillage commun des attractions ───────── */
const ICON = {
  coaster: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 18.5C5 10 7.5 6 10.5 6c3.6 0 2.6 8.5 6 8.5 2 0 3.2-2.4 5-5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M5 15.5v6M10.5 6.5v15M16.5 15v6.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 21.5h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  wheel: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v14.4M4.8 10h14.4M6.9 4.9l10.2 10.2M17.1 4.9L6.9 15.1" stroke="currentColor" stroke-width="1.1"/><circle cx="12" cy="10" r="1.9" fill="currentColor"/><path d="M8.6 21.5L12 10l3.4 11.5M6.5 21.5h11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  train: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 17V8.5h8.5V17M11 11.5h7.5l2.5 5.5h-18.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4.5 8.5V5h4.5v3.5M14.5 11.5V7.5h3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="6.5" cy="19" r="1.9" fill="currentColor"/><circle cx="16.5" cy="19" r="1.9" fill="currentColor"/></svg>'
};
ICON.tir = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>';
ICON.taupe = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19.5c0-5 3.1-9 7-9s7 4 7 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="14" r="1.1" fill="currentColor"/><circle cx="14" cy="14" r="1.1" fill="currentColor"/><path d="M2.5 20h19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15.5 3.5l4 4M17.5 5.5L13 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const NAME = { coaster: 'Montagnes russes', wheel: 'Grande roue', train: 'Petit train', tir: 'Stand de tir', taupe: 'Tape-taupe' };
/* Étiquette d'attraction pour les questions du panneau du bas */
const tag = kind => `<span class="lbl j-lbl">${ICON[kind]}${NAME[kind]}</span>`;
const head = (kind, n) => `<div class="j-head"><span class="j-attr">${ICON[kind]}${NAME[kind]}</span><span class="j-prog" role="img" aria-label="0 sur ${n}">${'<i></i>'.repeat(Math.min(n, 12))}</span></div>`;
function progress(root, k, n) {
  const p = $('.j-prog', root); if (!p) return;
  const dots = $$('i', p), lit = Math.round(k / n * dots.length);
  dots.forEach((d, i) => { const on = i < lit; if (on && !d.classList.contains('on') && !quick()) { d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop'); } d.classList.toggle('on', on); });
  p.setAttribute('aria-label', `${k} sur ${n}`);
}
/* Petites icônes pour les connecteurs et les fichiers (centre de tri des sources) */
const OPT_IC = {
  excel: ['#1D7A45', '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 9.5h16M4 14.5h16M9.5 4v16"/>'],
  csv: ['#0E8A9A', '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15.5h6"/>'],
  sql: ['#7B5CF0', '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>'],
  pdf: ['#D2453B', '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'],
  dir: ['#C98A00', '<path d="M3.5 7.5V19h17V9.5h-9l-2-2z"/>'],
  web: ['#3E6FD8', '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-3 3-3 14 0 17M12 3.5c3 3 3 14 0 17"/>']
};
const optIcon = lab => {
  const t = String(lab).trim().toLowerCase();
  const k = t === 'excel' ? 'excel' : t === 'csv' ? 'csv' : /^sql/.test(t) ? 'sql' : t === 'pdf' ? 'pdf' : t === 'dossier' ? 'dir' : t === 'web' ? 'web' : null;
  return k ? `<svg class="j-ic" viewBox="0 0 24 24" aria-hidden="true" style="color:${OPT_IC[k][0]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${OPT_IC[k][1]}</svg>` : '';
};
const rowIcon = lab => {
  const t = String(lab).trim().toLowerCase();
  const k = /\.xlsx?$/.test(t) ? 'excel' : /\.csv$/.test(t) ? 'csv' : /\.pdf$/.test(t) ? 'pdf' : /_db$/.test(t) ? 'sql' : /^[a-z0-9-]+(\.[a-z0-9-]+)+\.(fr|com|org|net)$/.test(t) ? 'web' : null;
  return k ? optIcon(k === 'excel' ? 'Excel' : k === 'csv' ? 'CSV' : k === 'pdf' ? 'PDF' : k === 'sql' ? 'SQL' : 'Web') : '';
};
const ARROW_L = '<svg class="j-ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_R = '<svg class="j-ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TEINTES = ['#F2C811', '#4C9BE8', '#3FB592', '#7B5CF0', '#F07A5C', '#E0679B', '#0E8A9A', '#B08A00'];

/* ───────── Montagnes russes et Grande roue : une file de cartes à envoyer au bon endroit ─────────
   spec : { title, intro, bare, mini, options: [[v, libellé]], rows: [{ id, t, sub }], key, btn, ev: 'k2' | 'match' | 'jeu', check(values), onPick }
   Deux options : le wagon arrive à l'aiguillage, on l'envoie à gauche ou à droite. Trois ou plus : la grande roue, une nacelle par option. */
function tri(spec) {
  const n = spec.options.length, two = n === 2, ev = spec.ev || 'k2';
  const kind = two ? 'coaster' : 'wheel', keyed = !!spec.key;
  const keyOf = () => { const k = typeof spec.key === 'function' ? spec.key() : spec.key, o = {}; for (const i in k || {}) o[String(i)] = String(k[i]); return o; };
  const rows = spec.rows.map(r => ({ id: String(r.id), t: r.t, sub: r.sub }));
  const row = id => rows.find(r => r.id === id);
  const help = spec.help || (two ? 'Glisse le wagon vers la bonne voie, ou touche la voie.' : 'Glisse la carte sur la bonne nacelle, ou touche la nacelle.');
  const doneTxt = spec.doneText || (keyed ? (two ? 'Tous les wagons sont arrivés.' : 'Tout le monde est à bord.') : 'Toutes les cartes sont rangées.');
  const el = h(`<div><div class="${spec.bare ? '' : 'board '}j-tri ${two ? 'j-rc' : 'j-fw'} n${n}${keyed ? ' keyed' : ''}${spec.mini ? ' mini' : ''}">${spec.mini ? '' : head(kind, rows.length)}${spec.title ? `<h3>${esc(fr(spec.title))}</h3>` : ''}${spec.intro ? `<p>${esc(fr(spec.intro))}</p>` : ''}
    <div class="j-scene"></div><p class="j-help">${esc(fr(help))}</p></div></div>`);
  const root = el.firstElementChild, scene = $('.j-scene', root);
  const stageHtml = `<div class="j-stage"><div class="j-pile"></div><div class="j-done"><p>${esc(fr(doneTxt))}</p>${keyed ? '' : `<button class="cta dark j-go" type="button">${esc(fr(spec.btn || 'Vérifier'))}</button>`}</div></div>`;
  scene.innerHTML = two
    ? `${stageHtml}<div class="rc-fork" aria-hidden="true"><svg class="rc-rails"></svg><span class="rc-lever"></span></div><div class="j-zones"></div>`
    : `<div class="fw-stage"><svg class="fw-legs" aria-hidden="true"></svg><div class="fw-wheel"><svg class="fw-frame" aria-hidden="true"></svg></div></div>${stageHtml}`;
  const stage = $('.j-stage', scene), pile = $('.j-pile', scene), go = $('.j-go', scene);
  const zonesEl = two ? $('.j-zones', scene) : $('.fw-wheel', scene), fork = $('.rc-fork', scene);
  const vals = {}; const left = rows.map(r => r.id);
  let locked = false, busy = false, lifted = null, probing = false, A = 0;
  const pickZone = v => { if (!busy && !locked && left.length) send(left[0], v); };
  spec.options.forEach(([v, lab], i) => {
    v = String(v);
    if (two) {
      const z = h(`<div class="j-zone rc-gate" data-z="${esc(v)}"><button class="j-zt" type="button" data-v="${esc(v)}">${i === 0 ? ARROW_L : ''}<span class="j-zl">${esc(fr(lab))}</span><i>0</i>${i === 1 ? ARROW_R : ''}</button><div class="j-in"></div></div>`);
      $('.j-zt', z).addEventListener('click', () => pickZone(v));
      zonesEl.appendChild(z);
    } else {
      const z = h(`<button class="j-zone fw-cab" type="button" data-z="${esc(v)}" style="--t:${(360 * i / n).toFixed(3)}deg; --c:${TEINTES[i % TEINTES.length]}"><span class="fw-box">${optIcon(lab)}<span class="j-zl">${esc(fr(lab))}</span><span class="fw-pax"></span></span></button>`);
      z.addEventListener('click', () => pickZone(v));
      zonesEl.appendChild(z);
    }
  });
  const zones = $$('.j-zone', zonesEl);
  const zoneOf = v => zones.find(z => z.dataset.z === v);
  const anchor = z => two ? $('.j-zt', z) : $('.fw-box', z);
  const labOf = v => fr((spec.options.find(o => String(o[0]) === v) || [])[1] || '');
  const nIn = v => Object.values(vals).filter(x => x === v).length;
  const count = (v, bump) => {
    const z = zoneOf(v); if (!z) return; const k = nIn(v);
    if (two) { const i = $('.j-zt i', z); i.textContent = k; $('.j-zt', z).setAttribute('aria-label', `Envoyer vers « ${labOf(v)} » (${k})`); if (bump && !quick()) { i.classList.remove('bump'); void i.offsetWidth; i.classList.add('bump'); } }
    else { const p = $('.fw-pax', z); p.innerHTML = k ? (k > 4 ? `<i></i><b>${k}</b>` : '<i></i>'.repeat(k)) : ''; z.setAttribute('aria-label', `Nacelle « ${labOf(v)} »${k ? `, ${k} à bord` : ''}`); }
    z.classList.toggle('lit', k > 0);
  };
  const cardHtml = (r, k) => `${rowIcon(r.t)}<b>${esc(fr(r.t))}</b>${r.sub ? `<small>${esc(fr(r.sub))}</small>` : ''}<em class="j-k">${k}/${rows.length}</em>`;
  const top = () => $('.j-pile > .j-card:not(.j-ghost)', root);
  /* La pile garde la hauteur de la plus grande carte : rien ne saute d'une carte à l'autre */
  const measure = () => {
    if (!pile.offsetWidth) return;
    const m = h('<div class="j-measure"></div>'); pile.appendChild(m);
    let max = 0; rows.forEach(r => { const c = h(`<div class="j-card">${cardHtml(r, rows.length)}</div>`); m.appendChild(c); max = Math.max(max, c.offsetHeight); });
    m.remove(); if (max) stage.style.setProperty('--jh', max + 'px');
  };
  /* Voies de l'aiguillage, tracées à la largeur réelle */
  const drawRails = () => {
    if (!two) return;
    const W = fork.clientWidth, H = fork.clientHeight; if (!W || !H) return;
    const k = scaleOf(fork) || 1, fr0 = fork.getBoundingClientRect();
    const xs = zones.map(z => { const r = $('.j-zt', z).getBoundingClientRect(); return (r.left + r.width / 2 - fr0.left) / k; });
    const cx = W / 2, y0 = Math.min(16, H * .28), d = x => `M${cx.toFixed(1)} -4 V${y0.toFixed(1)} C${cx.toFixed(1)} ${(y0 + (H - y0) * .58).toFixed(1)} ${x.toFixed(1)} ${(y0 + (H - y0) * .2).toFixed(1)} ${x.toFixed(1)} ${(H + 2).toFixed(1)}`;
    const svg = $('.rc-rails', fork); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = ['l', 'r'].map((s, i) => `<path class="ties ${s}" d="${d(xs[i])}"/><path class="rail ${s}" d="${d(xs[i])}"/><path class="rail-in ${s}" d="${d(xs[i])}"/>`).join('');
  };
  /* Grande roue : rayon et nacelles à la taille de l'écran */
  const drawWheel = () => {
    if (two) return;
    const st = $('.fw-stage', scene), W = st.clientWidth; if (!W) return;
    let cw = Math.round(Math.max(78, Math.min(n > 6 ? 90 : 104, W * .31)));
    const R = Math.round(Math.min(n > 5 ? 128 : 120, W / 2 - cw / 2 - 2, Rcap));
    /* Roue resserrée : les nacelles s'affinent pour ne pas se chevaucher */
    if (Rcap < Infinity) cw = Math.round(Math.max(64, Math.min(cw, 2 * R * Math.sin(Math.PI / n) * 1.1)));
    root.classList.toggle('tight', Rcap < Infinity);
    st.style.setProperty('--cw', cw + 'px');
    let ch = 0; zones.forEach(z => { ch = Math.max(ch, $('.fw-box', z).offsetHeight); });
    const H = 8 + 2 * R + 10 + ch + 6;
    st.style.setProperty('--R', R + 'px'); st.style.height = H + 'px';
    const fr1 = $('.fw-frame', scene), s = 2 * R, c = R, rim = R - 2, inner = R * .8;
    let g = `<circle class="rim" cx="${c}" cy="${c}" r="${rim}"/><circle class="rim2" cx="${c}" cy="${c}" r="${inner.toFixed(1)}"/>`;
    const sp = n * 2;
    for (let i = 0; i < sp; i++) { const a = Math.PI * 2 * i / sp, x = c + Math.sin(a) * rim, y = c + Math.cos(a) * rim; g += `<line class="spoke" x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }
    const nb = Math.max(18, n * 4);
    for (let i = 0; i < nb; i++) { const a = Math.PI * 2 * (i + .5) / nb, x = c + Math.sin(a) * rim, y = c + Math.cos(a) * rim; g += `<circle class="bulb" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4"/>`; }
    g += `<circle class="hub" cx="${c}" cy="${c}" r="${Math.max(8, R * .08).toFixed(1)}"/><circle class="hub-in" cx="${c}" cy="${c}" r="3.2"/>`;
    fr1.setAttribute('viewBox', `0 0 ${s} ${s}`); fr1.setAttribute('width', s); fr1.setAttribute('height', s); fr1.innerHTML = g;
    const legs = $('.fw-legs', scene), hy = 8 + R, gy = H - 2, sx = R * .62;
    legs.setAttribute('viewBox', `0 0 ${W} ${H}`);
    legs.innerHTML = `<path d="M${W / 2 - sx} ${gy} L${W / 2} ${hy} L${W / 2 + sx} ${gy}"/><path class="thin" d="M${W / 2 - sx * .55} ${hy + (gy - hy) * .55} H${W / 2 + sx * .55}"/><path class="ground" d="M${W / 2 - sx - 18} ${gy} H${W / 2 + sx + 18}"/>`;
    bulbs();
  };
  /* Petit écran : la roue rapetisse pour que la carte du quai reste visible sans défiler */
  let Rcap = Infinity;
  const fitWheel = () => {
    if (two || !root.classList.contains('board') || !root.clientHeight) return;
    const R = parseFloat($('.fw-stage', scene).style.getPropertyValue('--R')) || 0, over = root.scrollHeight - root.clientHeight;
    if (over > 2 && R > 76) { Rcap = Math.max(76, R - Math.ceil(over / 2) - 1); drawWheel(); }
  };
  const bulbs = () => { if (two) return; const all = $$('.fw-frame .bulb', scene), done = rows.length - left.length, lit = Math.round(done / rows.length * all.length); all.forEach((b, i) => b.classList.toggle('on', i < lit || root.classList.contains('fete'))); };
  const setA = (a, ms) => { A = a; const w = $('.fw-wheel', scene); w.style.setProperty('--spin', (ms || 0) + 'ms'); w.style.setProperty('--a', A.toFixed(2) + 'deg'); };
  /* Amène une nacelle au quai d'embarquement (en bas de la roue) */
  const spinTo = (z, turns = 0) => new Promise(res => {
    const t = parseFloat(z.style.getPropertyValue('--t')) || 0;
    let target = -t; target += Math.round((A - target) / 360) * 360; target -= turns * 360;
    const d = Math.abs(target - A);
    if (d < .5) return res();
    if (quick()) { setA(target, 0); return res(); }
    const ms = Math.round(Math.min(turns ? 1700 : 900, 300 + d * (turns ? 2.4 : 2.8)));
    setA(target, ms); setTimeout(res, ms);
  });
  let lastW = 0;
  const relayout = () => { const w = scene.offsetWidth; if (!w || w === lastW) return; lastW = w; measure(); if (two) requestAnimationFrame(drawRails); else { drawWheel(); requestAnimationFrame(fitWheel); } };
  if (window.ResizeObserver) { new ResizeObserver(relayout).observe(scene); if (!two) new ResizeObserver(() => requestAnimationFrame(fitWheel)).observe(root); }
  /* Carte soulevée : pendant le geste, un double flotte au-dessus de tout l'écran. Aucun cadre (plateau, dock) ne la coupe. */
  function lift(c, e) {
    drop();
    const host = root.closest('.layer') || document.body, k = scaleOf(host) || 1, hr = host.getBoundingClientRect(), r = c.getBoundingClientRect();
    host.querySelectorAll(':scope > .j-lift').forEach(x => x.remove());
    const f = c.cloneNode(true);
    ['data-r', 'tabindex', 'role', 'aria-label'].forEach(a => f.removeAttribute(a)); f.setAttribute('aria-hidden', 'true');
    f.className = `j-card j-lift ${two ? 'wagon' : ''}`;
    f.insertAdjacentHTML('beforeend', '<span class="j-stamp"></span>');
    Object.assign(f.style, { left: (r.left - hr.left) / k + 'px', top: (r.top - hr.top) / k + 'px', width: c.offsetWidth + 'px', height: c.offsetHeight + 'px',
      transformOrigin: `${((e.clientX - r.left) / k).toFixed(1)}px ${((e.clientY - r.top) / k).toFixed(1)}px` });
    host.appendChild(f);
    c.classList.remove('hintme'); c.classList.add('drag', 'lifted');
    return (lifted = f);
  }
  /* Retire le double et rend la vraie carte visible d'un coup (sans fondu) */
  function drop() {
    if (lifted) { lifted.remove(); lifted = null; }
    const c = top(); if (c && c.classList.contains('lifted')) { c.style.transition = 'none'; c.classList.remove('lifted', 'drag'); void c.offsetWidth; c.style.transition = ''; }
  }
  /* Retour en ressort sur la pile ; la carte reste saisissable pendant le retour */
  function home() {
    const f = lifted; if (!f) return;
    if (quick()) return drop();
    f.classList.add('home');
    f.style.translate = '0px 0px'; f.style.rotate = '0deg'; f.style.scale = '1';
    const fin = () => { clearTimeout(t); if (lifted === f) drop(); };
    const t = setTimeout(fin, 520);
    f.addEventListener('transitionend', e => { if (e.propertyName === 'translate') fin(); });
  }
  /* Lancer : un geste vif compte comme un dépôt, même si le doigt s'arrête avant la cible */
  function thrown(e, v) {
    const sp = Math.hypot(v.x, v.y); if (sp < .45) return null;
    if (two) return Math.abs(v.x) > Math.abs(v.y) * .6 ? zones[v.x < 0 ? 0 : 1] : null;
    for (let d = 16; d <= 420; d += 16) {
      const x = e.clientX + v.x / sp * d, y = e.clientY + v.y / sp * d, hit = zones.filter(zz => inside(x, y, anchor(zz), 10));
      const dist = zz => { const r = anchor(zz).getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y); };
      if (hit.length) return hit.sort((p, q) => dist(p) - dist(q))[0];
    }
    return null;
  }
  const lean = z => { if (!fork) return; const i = z ? zones.indexOf(z) : -1; fork.dataset.side = i === 0 ? 'l' : i === 1 ? 'r' : ''; };
  function draw(how) {
    drop();
    pile.innerHTML = ''; pile.classList.remove('next');
    stage.classList.toggle('fini', !left.length);
    if (!left.length) return;
    const r = row(left[0]);
    if (left.length > 2) pile.appendChild(h(`<div class="j-ghost g2${two ? ' wagon' : ''}"></div>`));
    /* La carte suivante attend juste derrière : on la voit dès qu'on soulève celle du dessus */
    if (left.length > 1) pile.appendChild(h(`<div class="j-card j-ghost g1${two ? ' wagon' : ''}" aria-hidden="true">${cardHtml(row(left[1]), rows.length - left.length + 2)}</div>`));
    const c = h(`<div class="j-card${two ? ' wagon' : ''}${how ? ' enter' : ''}${how === 'back' ? ' back' : ''}" data-r="${esc(r.id)}" tabindex="0" role="group" aria-label="${esc(fr(r.t))}">${cardHtml(r, rows.length - left.length + 1)}</div>`);
    pile.appendChild(c);
    if (how) requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove('enter', 'back')));
    let over = null;
    const hover = z => {
      if (over === z) return; if (over) over.classList.remove('over'); over = z; if (z) z.classList.add('over');
      lean(z);
      if (lifted) { const i = z ? zones.indexOf(z) : -1; lifted.classList.toggle('to-l', two && i === 0); lifted.classList.toggle('to-r', two ? i === 1 : i >= 0); if (z) $('.j-stamp', lifted).textContent = $('.j-zl', z).textContent; }
    };
    draggable(c, {
      can: () => !busy && !locked,
      start: e => lift(c, e),
      move: (dx, dy, e) => {
        const f = lifted; if (!f) return;
        const k = scaleOf(root) || 1;
        c._x = dx / k; c._y = dy / k;
        const inZone = zones.find(zz => inside(e.clientX, e.clientY, anchor(zz)));
        let z = inZone; if (!z && two && Math.abs(c._x) > 46) z = zones[c._x < 0 ? 0 : 1];
        hover(z || null);
        /* La carte suit le doigt sans délai ; seule sa taille s'anime */
        f.style.translate = `${c._x.toFixed(1)}px ${c._y.toFixed(1)}px`;
        f.style.rotate = `${(c._x * .05).toFixed(2)}deg`;
        const sc = inZone ? .62 : z ? .96 : Math.max(.7, 1 - Math.hypot(c._x, c._y) / 600);
        f.style.scale = sc.toFixed(3); f.style.setProperty('--k', (1 / sc).toFixed(3));
      },
      end: (e, cancel, v) => {
        let z = over; hover(null);
        if (!cancel && !z && v) z = thrown(e, v);
        if (!cancel && z) { send(r.id, z.dataset.z, true); return; }
        home();
      }
    });
    c.addEventListener('keydown', e => {
      if (two && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); send(r.id, zones[e.key === 'ArrowLeft' ? 0 : 1].dataset.z); }
    });
    c.addEventListener('click', () => { if (!c._dragged && !quick()) { c.classList.remove('hintme'); void c.offsetWidth; c.classList.add('hintme'); } });
  }
  /* Centre (sans transformation) de la carte qui voyage : la vraie carte, ou son double si elle a été glissée */
  const origin = c => {
    const k = scaleOf(root) || 1, a = c.getBoundingClientRect();
    if (c === lifted) { const hr = c.parentElement.getBoundingClientRect(); return { x: hr.left + (parseFloat(c.style.left) + c.offsetWidth / 2) * k, y: hr.top + (parseFloat(c.style.top) + c.offsetHeight / 2) * k, a, k }; }
    return { x: a.left + a.width / 2, y: a.top + a.height / 2, a, k };
  };
  /* Bon choix : la carte file dans sa voie ou sa nacelle et s'y range */
  function flyInto(c, z, dragged) {
    return new Promise(res => {
      if (!c || quick()) return res();
      const { x: ux, y: uy, a, k } = origin(c), b = anchor(z).getBoundingClientRect();
      c.classList.remove('home');
      c.style.transition = 'none'; c.style.transformOrigin = '50% 50%';
      c.style.translate = `${(a.left + a.width / 2 - ux) / k}px ${(a.top + a.height / 2 - uy) / k}px`;
      void c.offsetWidth; c.style.transition = '';
      c.classList.add('fly');
      c.style.translate = `${(b.left + b.width / 2 - ux) / k}px ${(b.top + b.height / 2 - uy) / k}px`;
      c.style.scale = '.3';
      c.style.rotate = `${dragged ? parseFloat(c.style.rotate) || 0 : two ? (zones.indexOf(z) ? 8 : -8) : 0}deg`;
      c.style.opacity = '0';
      setTimeout(res, 280);
    });
  }
  /* Mauvais choix : la carte part vers la cible, bute, puis revient à sa place */
  function bounceOff(c, z) {
    return new Promise(res => {
      if (!c || quick()) return res();
      if (c === lifted) {
        c.classList.add('nope');
        c.animate([{ transform: 'none' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 320, easing: 'ease-in-out' });
        setTimeout(() => { home(); setTimeout(res, 420); }, 330);
        return;
      }
      const k = scaleOf(root) || 1, a = c.getBoundingClientRect(), b = anchor(z).getBoundingClientRect();
      const dx = (b.left + b.width / 2 - a.left - a.width / 2) / k * .5, dy = (b.top + b.height / 2 - a.top - a.height / 2) / k * .5;
      c.classList.add('nope');
      c.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(.84)`, offset: .36 }, { transform: `translate(${dx - 7}px, ${dy}px) scale(.84)`, offset: .48 }, { transform: `translate(${dx + 6}px, ${dy}px) scale(.84)`, offset: .58 }, { transform: 'none' }],
        { duration: 760, easing: 'cubic-bezier(.35,0,.25,1)' }).onfinish = () => { c.classList.remove('nope'); res(); };
    });
  }
  /* Le choix d'une carte : jugé tout de suite si la solution est connue */
  async function send(id, v, dragged) {
    if (locked || busy || left[0] !== id) return;
    const z = zoneOf(v); if (!z) return;
    let ok = true;
    if (keyed) {
      ok = keyOf()[id] === v;
      if (!ok) {
        /* La mission explique l'erreur comme si toutes les autres cartes étaient bien rangées */
        const sim = { ...keyOf(), [id]: v }; let r;
        probing = true; try { r = spec.probe ? spec.probe(sim) : probe(ev + '.check', { values: sim }); } finally { probing = false; }
        if (r === true) ok = true;
      }
    }
    busy = true;
    buzz(ok ? 'ok' : 'no');
    lean(z);
    if (!two && !dragged) await spinTo(z);
    const c = lifted || top();
    if (ok) {
      await flyInto(c, z, dragged);
      busy = false; drop(); lean(null);
      place(id, v);
      if (keyed) win(anchor(z));
      return;
    }
    z.classList.add('no'); if (two) shake(z);
    announce(`Pas dans « ${labOf(v)} ».`);
    await bounceOff(c, z);
    z.classList.remove('no'); lean(null);
    busy = false; drop();
    const t = top(); if (t) t.classList.remove('nope');
  }
  function place(id, v) {
    const i = left.indexOf(id); if (i < 0) return;
    left.splice(i, 1); vals[id] = v;
    const z = zoneOf(v);
    if (two) {
      const chip = keyed
        ? h(`<span class="j-chip new" data-r="${esc(id)}">${esc(fr(row(id).t))}</span>`)
        : h(`<button class="j-chip new" type="button" data-r="${esc(id)}" aria-label="${esc(fr(row(id).t))}, envoyée vers « ${esc(labOf(v))} ». Toucher pour la reprendre">${esc(fr(row(id).t))}</button>`);
      if (!keyed) chip.addEventListener('click', () => unplace(id));
      $('.j-in', z).appendChild(chip); grow(chip);
      setTimeout(() => chip.classList.remove('new'), 450);
    }
    count(v, true); draw(); progress(root, rows.length - left.length, rows.length); bulbs();
    announce(`${keyed ? 'Juste. ' : ''}Envoyée vers « ${labOf(v)} ». ${left.length ? 'Carte suivante : ' + fr(row(left[0]).t) : doneTxt}`);
    /* La voie ou la nacelle « avale » la carte au moment où elle arrive */
    if (!quick()) { z.classList.remove('got'); void z.offsetWidth; z.classList.add('got'); setTimeout(() => z.classList.remove('got'), 520); }
    if (spec.onPick) spec.onPick({ row: id, value: v }); else act(ev + '.pick', { row: id, value: v });
    if (!left.length) finish();
  }
  /* Tout est en place : avec la solution, la fête puis la validation ; sans, le bouton de vérification apparaît */
  function finish() {
    if (!quick()) requestAnimationFrame(() => { const sc = root.closest('.board, .lesson-card, .ans-card') || root; if (sc.scrollHeight > sc.clientHeight) { const r1 = scene.getBoundingClientRect(), r0 = sc.getBoundingClientRect(); if (r1.top < r0.top) sc.scrollBy({ top: r1.top - r0.top - 12, behavior: 'smooth' }); } });
    if (!keyed) return;
    harvest(two ? 'coaster' : 'wheel', { title: spec.title || '', intro: spec.intro || '', options: spec.options.map(o => [String(o[0]), o[1]]), rows, key: keyOf(), why: spec.why || null });
    busy = true;
    root.classList.add('fete'); bulbs();
    const end = () => { busy = false; check(); };
    if (quick()) return end();
    if (two) { zones.forEach((z, i) => setTimeout(() => sparks(anchor(z), 12), i * 160)); setTimeout(end, 650); }
    else { sparks($('.fw-frame', scene), 18, 1.6); spinTo(zones[0], 1).then(() => setTimeout(end, 120)); }
  }
  function check() {
    if (locked) return;
    const r = spec.check ? spec.check({ ...vals }) : act(ev + '.check', { values: { ...vals } });
    if ((r === 'no' || r === false) && go) shake(go);
  }
  /* Toucher une carte rangée (sans solution) la remet sur la pile */
  function unplace(id, silent) {
    if (locked || busy || vals[id] === undefined) return;
    const v = vals[id]; delete vals[id];
    const chip = $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl); if (chip) shrink(chip);
    left.unshift(id); count(v); draw('back'); progress(root, rows.length - left.length, rows.length); bulbs();
    if (silent) return;
    if (spec.onPick) spec.onPick({ row: id, value: null }); else act(ev + '.pick', { row: id, value: null });
  }
  if (go) go.addEventListener('click', () => {
    if (locked) return;
    if (two || quick()) return check();
    busy = true; spinTo(zones[0], 1).then(() => { busy = false; check(); });
  });
  const B = { el, vals, body: root };
  /* Marque les cartes (sans solution) : justes, ou à revoir ; les erreurs reviennent sur la pile */
  B.mark = (bad, ok) => {
    if (probing) return;
    $$('.j-chip', zonesEl).forEach(c => c.classList.remove('ok', 'bad'));
    if (!bad && !ok) return;
    bad = (bad || []).map(String);
    if (!bad.length) return;
    const chip = id => $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl);
    (ok ? ok.map(String) : Object.keys(vals).filter(k => !bad.includes(k))).forEach(id => { const c = chip(id); if (c) c.classList.add('ok'); });
    bad.forEach(id => { const c = chip(id); if (c) c.classList.add('bad'); const z = zoneOf(vals[id]); if (z && !two) { z.classList.add('no'); later(900, () => z.classList.remove('no')); } });
    later(calm() ? 1400 : 900, () => { if (locked) return; bad.slice().reverse().forEach(id => unplace(id, true)); });
    announce(`${bad.length} carte${bad.length > 1 ? 's' : ''} à revoir, revenue${bad.length > 1 ? 's' : ''} sur la pile.`);
  };
  B.lock = () => {
    if (probing) return;
    if (!keyed && !locked && !left.length) harvest(two ? 'coaster' : 'wheel', { title: spec.title || '', intro: spec.intro || '', options: spec.options.map(o => [String(o[0]), o[1]]), rows, key: { ...vals }, why: spec.why || null });
    locked = true; drop(); root.classList.add('j-locked', 'fete'); bulbs();
    $$('button', root).forEach(b => b.disabled = true);
    $$('.j-chip', zonesEl).forEach((c, i) => { if (!c.classList.contains('bad')) { c.style.setProperty('--i', i); c.classList.add('ok'); } });
    if (go) go.textContent = fr('C’est juste');
  };
  B.reset = () => { Object.keys(vals).forEach(id => { const c = $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl); if (c) c.remove(); delete vals[id]; }); left.length = 0; rows.forEach(r => left.push(r.id)); spec.options.forEach(o => count(String(o[0]))); progress(root, 0, rows.length); draw(); bulbs(); };
  spec.options.forEach(o => count(String(o[0])));
  draw();
  requestAnimationFrame(relayout);
  /* Démonstration : la carte esquisse le geste vers la voie de droite (ou la nacelle du bas), puis revient */
  demo(two ? 'tri2' : 'roue', root, D => {
    const c = top(), z = two ? zones[1] : zones[0]; if (!c) return;
    const to = two ? { translate: '58px 10px', rotate: '3deg' } : { translate: '0px -34px', rotate: '0deg' }, rest = { translate: '0px 0px', rotate: '0deg' };
    D.anims.push(c.animate([rest, { ...to, offset: .4 }, { ...to, offset: .62 }, rest], { duration: 1400, easing: 'cubic-bezier(.45,0,.25,1)' }));
    const t1 = setTimeout(() => { z.classList.add('over'); lean(z); }, 430), t2 = setTimeout(() => { z.classList.remove('over'); lean(null); }, 900);
    D.end = () => { clearTimeout(t1); clearTimeout(t2); z.classList.remove('over'); lean(null); };
  });
  return B;
}

/* ───────── Paires : la grande roue, une nacelle par partenaire ─────────
   spec : { title, intro, rows: [{ id, label, sub }], options: [[v, libellé]], key, btn } — émet match.pick et match.check { values } */
function pairs(spec) {
  const B = tri({ title: spec.title, intro: spec.intro, bare: spec.bare, help: spec.help, btn: spec.btn, key: spec.key, why: spec.why, ev: 'match',
    options: spec.options, rows: spec.rows.map(r => ({ id: r.id, t: r.label, sub: r.sub })) });
  const mark = B.mark; B.mark = (ok, bad) => (ok || bad) ? mark(bad || [], ok || undefined) : mark();
  B.values = B.vals;
  return B;
}

/* ───────── Petit train : poser les gares dans l'ordre du trajet ─────────
   spec : { title, intro, items: [[id, libellé]], start: [ids], key: [ids dans l'ordre], btn } — émet order.change et order.check { order } */
const LOCO = '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="7" y="5" width="14" height="15" rx="4.5" fill="#141B3C"/><rect x="9.5" y="7.5" width="9" height="5.5" rx="1.6" fill="#FFF7D1"/><circle cx="10.6" cy="16.4" r="1.6" fill="#FFE98F"/><circle cx="17.4" cy="16.4" r="1.6" fill="#FFE98F"/><path d="M9 20l-2 3.5M19 20l2 3.5" stroke="#141B3C" stroke-width="1.8" stroke-linecap="round"/></svg>';
function order(spec) {
  const items = spec.items.map(i => [String(i[0]), i[1]]);
  const label = id => (items.find(i => i[0] === id) || [])[1] || id;
  const keyed = !!spec.key;
  const keyOf = () => (typeof spec.key === 'function' ? spec.key() : spec.key).map(String);
  const n = items.length, placed = [], tray = (spec.start || items.map(i => i[0])).map(String);
  const el = h(`<div><div class="${spec.bare ? '' : 'board '}j-order j-train${keyed ? ' keyed' : ''}">${head('train', n)}${spec.title ? `<h3>${esc(fr(spec.title))}</h3>` : ''}${spec.intro ? `<p>${esc(fr(spec.intro))}</p>` : ''}
    <div class="tr-line"><span class="tr-rail" aria-hidden="true"></span>
      <div class="tr-st tr-end tr-dep"><i></i><span>Départ</span></div>
      <ol class="tr-placed"></ol>
      <div class="tr-st tr-slot"><i></i><span>${esc(fr(spec.slot || 'Prochaine gare ?'))}</span></div>
      <div class="tr-st tr-end tr-arr"><i></i><span>Arrivée</span></div>
      <span class="tr-loco" aria-hidden="true">${LOCO}</span>
    </div>
    <div class="tr-tray"><div class="tr-tix" role="list"></div>${keyed ? '' : `<button class="cta dark j-go" type="button">${esc(fr(spec.btn || 'Faire partir le train'))}</button>`}</div>
    <p class="j-help">${esc(fr(spec.help || 'Touche la gare qui vient ensuite, ou glisse-la sur la voie.'))}</p></div></div>`);
  const root = el.firstElementChild, line = $('.tr-line', el), list = $('.tr-placed', el), tix = $('.tr-tix', el), slot = $('.tr-slot', el), loco = $('.tr-loco', el), go = $('.j-go', el);
  let locked = false, busy = false, probing = false;
  const tk = id => $(`.tr-tk[data-id="${CSS.escape(id)}"]`, tix);
  /* La locomotive attend à la dernière gare posée */
  const placeLoco = (where, ms) => {
    const t = where || $('.tr-placed > li:last-child', list) || $('.tr-dep', line);
    const y = t.offsetTop + t.offsetHeight / 2;
    loco.style.transitionDuration = (quick() ? 0 : ms == null ? 520 : ms) + 'ms';
    loco.style.top = y + 'px';
  };
  const sizeRail = () => { const r = $('.tr-rail', line), a = $('.tr-dep', line), b = $('.tr-arr', line); r.style.top = (a.offsetTop + a.offsetHeight / 2) + 'px'; r.style.height = Math.max(0, b.offsetTop + b.offsetHeight / 2 - a.offsetTop - a.offsetHeight / 2) + 'px'; };
  const refresh = () => { slot.hidden = !tray.length; sizeRail(); placeLoco(root.classList.contains('arrive') ? $('.tr-arr', line) : null, 0); };
  if (window.ResizeObserver) new ResizeObserver(() => { sizeRail(); placeLoco(root.classList.contains('arrive') ? $('.tr-arr', line) : null, 0); }).observe(line);
  /* Plateau qui défile : la prochaine gare (ou l'arrivée) reste en vue */
  const reveal = el => {
    const sc = root.closest('.board, .lesson-card') || root; if (!el || sc.scrollHeight <= sc.clientHeight + 1) return;
    const k = scaleOf(sc) || 1, d = (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / k - sc.clientHeight * .32;
    if (Math.abs(d) > 8) sc.scrollBy({ top: d, behavior: quick() ? 'auto' : 'smooth' });
  };
  const renum = () => $$('.tr-placed > li', list).forEach((li, k) => { $('.tr-n', li).textContent = k + 1; li.setAttribute('aria-label', `Gare ${k + 1} : ${fr(label(li.dataset.id))}`); });
  function ticket(id) {
    const b = h(`<button class="tr-tk" type="button" role="listitem" data-id="${esc(id)}"><span class="tr-stub" aria-hidden="true"></span><span class="tr-t">${esc(fr(label(id)))}</span></button>`);
    b.addEventListener('click', () => choose(id));
    let k = 1;
    draggable(b, {
      can: () => !locked && !busy,
      start: () => { k = scaleOf(root) || 1; b.classList.add('drag'); },
      move: (dx, dy, e) => { b.style.transform = `translate(${dx / k}px, ${dy / k}px) scale(1.03)`; line.classList.toggle('over', inside(e.clientX, e.clientY, line, 4)); },
      end: (e, cancel) => {
        const on = !cancel && inside(e.clientX, e.clientY, line, 4); line.classList.remove('over'); b.classList.remove('drag');
        if (on) { b.style.transform = ''; choose(id, true); return; }
        b.animate([{ transform: b.style.transform }, { transform: 'none' }], { duration: quick() ? 0 : 360, easing: 'cubic-bezier(.3,1.3,.5,1)' }); b.style.transform = '';
      }
    });
    return b;
  }
  tray.forEach(id => tix.appendChild(ticket(id)));
  /* La gare choisie : jugée tout de suite si l'ordre est connu */
  function choose(id) {
    if (locked || busy || !tray.includes(id)) return;
    let ok = true;
    if (keyed) {
      const want = keyOf(); ok = want[placed.length] === id;
      if (!ok) {
        const sim = placed.concat([id], want.filter(x => !placed.includes(x) && x !== id)); let r;
        probing = true; try { r = probe('order.check', { order: sim }); } finally { probing = false; }
        if (r === true) ok = true;
      }
    }
    buzz(ok ? 'ok' : 'no');
    const b = tk(id);
    if (!ok) {
      b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); shake(b);
      loco.classList.remove('brake'); void loco.offsetWidth; loco.classList.add('brake');
      later(700, () => b.classList.remove('no'));
      announce(`${fr(label(id))} : pas encore.`);
      return;
    }
    busy = true;
    tray.splice(tray.indexOf(id), 1); placed.push(id);
    const li = h(`<li class="tr-st tr-gare new" data-id="${esc(id)}"><i></i><span class="tr-sign"><b class="tr-n"></b><span class="tr-t">${esc(fr(label(id)))}</span></span></li>`);
    if (!keyed) li.addEventListener('click', () => back(id));
    /* Le billet glisse jusqu'à sa gare pendant que les autres se resserrent */
    const from = b.getBoundingClientRect(), others = $$('.tr-tk', tix).filter(x => x !== b);
    flip([...others, slot, $('.tr-arr', line)], () => { b.remove(); list.appendChild(li); renum(); refresh(); });
    if (!quick()) {
      const to = li.getBoundingClientRect(), k = scaleOf(root) || 1, sign = $('.tr-sign', li);
      sign.animate([{ transform: `translate(${(from.left - to.left) / k}px, ${(from.top - to.top) / k}px)`, opacity: .9 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: EASE });
    }
    later(80, () => placeLoco(li));
    later(quick() ? 0 : 430, () => { li.classList.remove('new'); if (keyed) win($('.tr-sign', li)); });
    progress(root, placed.length, n);
    announce(`Gare ${placed.length} : ${fr(label(id))}.`);
    act('order.change', { order: placed.slice() });
    later(quick() ? 0 : 440, () => { busy = false; reveal(tray.length ? slot : $('.tr-arr', line)); if (!tray.length) finish(); });
  }
  /* Sans solution : toucher une gare posée la renvoie dans les billets */
  function back(id) {
    if (locked || busy || !placed.includes(id)) return;
    placed.splice(placed.indexOf(id), 1); tray.push(id);
    const li = $(`.tr-placed > li[data-id="${CSS.escape(id)}"]`, list);
    flip([...$$('.tr-placed > li', list), slot, $('.tr-arr', line), ...$$('.tr-tk', tix)], () => { li.remove(); tix.appendChild(ticket(id)); renum(); refresh(); });
    B.flag(); progress(root, placed.length, n); placeLoco(null);
    act('order.change', { order: placed.slice() });
  }
  function finish() {
    if (!keyed) return;
    harvest('train', { title: spec.title || '', intro: spec.intro || '', items, key: keyOf(), why: spec.why || null });
    busy = true; root.classList.add('arrive');
    placeLoco($('.tr-arr', line), quick() ? 0 : 900);
    const end = () => { busy = false; if (!locked && act('order.check', { order: placed.slice() }) === 'no' && go) shake(go); };
    if (quick()) return end();
    later(700, () => sparks($('.tr-arr i', line), 16, 1.2));
    later(1050, end);
  }
  if (go) go.addEventListener('click', () => { if (locked || tray.length) { if (tray.length) shake(slot); return; } root.classList.add('arrive'); placeLoco($('.tr-arr', line), 900); later(950, () => { if (act('order.check', { order: placed.slice() }) === 'no') { root.classList.remove('arrive'); placeLoco(null); shake(go); } }); });
  const B = { el, order: placed };
  B.flag = bad => { if (probing) return; $$('.tr-placed > li', list).forEach((b, k) => b.classList.toggle('bad', !!bad && bad.includes(k))); };
  B.lock = () => { if (probing) return; locked = true; root.classList.add('j-locked', 'arrive'); $$('.tr-placed > li', list).forEach((b, k) => b.style.setProperty('--i', k)); $$('button', root).forEach(b => b.disabled = true); if (go) go.textContent = fr('C’est juste'); placeLoco($('.tr-arr', line), 0); };
  B.draw = () => {};
  requestAnimationFrame(refresh);
  /* Démonstration : le premier billet esquisse le trajet vers la voie */
  demo('train', root, D => {
    const b = $('.tr-tk', tix); if (!b) return;
    const d = slot.getBoundingClientRect().top - b.getBoundingClientRect().top, k = scaleOf(root) || 1;
    D.anims.push(b.animate([{ transform: 'none' }, { transform: `translateY(${d / k * .6}px) scale(1.02)`, offset: .4 }, { transform: `translateY(${d / k * .6}px) scale(1.02)`, offset: .62 }, { transform: 'none' }], { duration: 1300, easing: 'cubic-bezier(.45,0,.25,1)' }));
  });
  return B;
}

window.J = { tri, order, pairs, draggable, flip, tag, icon: k => ICON[k] || '', name: k => NAME[k] || '', fx: { buzz, sparks, combo: comboPill, win } };
})();

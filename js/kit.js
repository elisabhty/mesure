/* Power BI Quest — aides partagées par les missions */
(function () {
'use strict';
const { h, esc, fr, $, $$, act, shake } = window.PBQ;

const FILE = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 1.5h5.5L13 5v9.5H4z"/><path d="M9.5 1.5V5H13"/></svg>';
/* Menu contextuel générique (hors simulateur) */
let openMenu = null, offMenu = null;
function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; document.removeEventListener('pointerdown', offMenu, true); } }
function menu(anchor, items, onPick, host) {
  closeMenu();
  host = host || anchor.closest('.app') || anchor.parentElement;
  const m = h(`<div class="menu" role="menu"></div>`);
  for (const it of items) {
    if (it === '-') { m.appendChild(h('<hr>')); continue; }
    const b = h(`<button role="menuitem" data-k="${esc(String(it[0]))}" class="${it[2] ? 'cur' : ''}">${esc(fr(it[1]))}</button>`);
    b.addEventListener('click', e => { e.stopPropagation(); closeMenu(); onPick(it[0]); });
    m.appendChild(b);
  }
  host.appendChild(m);
  const hb = host.getBoundingClientRect(), ab = anchor.getBoundingClientRect(), Z = hb.width / host.offsetWidth || 1;
  requestAnimationFrame(() => {
    const mw = m.offsetWidth, mh = m.offsetHeight, W = host.offsetWidth, H = host.offsetHeight;
    let x = (ab.right - hb.left) / Z - mw, y = (ab.bottom - hb.top) / Z + 4;
    if (x < 6) x = 6; if (x + mw > W - 6) x = W - mw - 6;
    if (y + mh > H - 6) y = Math.max(6, (ab.top - hb.top) / Z - mh - 4);
    m.style.left = x + 'px'; m.style.top = y + 'px'; m.classList.add('on');
  });
  openMenu = m;
  offMenu = e => { if (!m.contains(e.target)) closeMenu(); };
  setTimeout(() => document.addEventListener('pointerdown', offMenu, true), 0);
  return m;
}

/* Planche blanche (exercices hors Power BI) */
function board(title, intro) {
  const el = h(`<div><div class="board">${title ? `<h3>${esc(fr(title))}</h3>` : ''}${intro ? `<p>${esc(fr(intro))}</p>` : ''}</div></div>`);
  return { el, body: $('.board', el) };
}

/* Association : chaque ligne reçoit une valeur choisie dans un menu. Émet match.check {values, rows} */
function matching(spec) {
  const B = board(spec.title, spec.intro);
  const vals = {};
  const lab = id => (spec.options.find(o => o[0] === id) || [])[1];
  spec.rows.forEach(r => {
    const row = h(`<div class="bt-row"><div class="bt-file">${r.icon ? `<span class="ficon ${r.icon}">${esc(r.tag || '')}</span>` : `<span class="ficon" style="background:#E8EAF2; color:#8A90AA">${FILE}</span>`}<span><b>${esc(r.label)}</b>${r.sub ? `<small style="display:block; font-size:12px; color:var(--gris); margin-top:1px">${esc(fr(r.sub))}</small>` : ''}</span></div><button class="pick" data-row="${r.id}">${esc(spec.placeholder || 'Choisir le format')}</button></div>`);
    const pick = $('.pick', row);
    pick.addEventListener('click', () => menu(pick, spec.options.map(o => [o[0], o[1], vals[r.id] === o[0]]), v => {
      vals[r.id] = v; pick.textContent = lab(v); pick.className = 'pick set';
      act('match.pick', { row: r.id, value: v });
    }, B.el));
    B.body.appendChild(row);
  });
  const go = h(`<button class="cta dark" style="margin-top:14px">${esc(spec.btn || 'Vérifier mes réponses')}</button>`);
  go.addEventListener('click', () => { if (act('match.check', { values: { ...vals } }) === 'no') shake(go); });
  B.body.appendChild(go);
  B.mark = (ok, bad) => {
    $$('.pick', B.body).forEach(p => { const id = p.dataset.row; p.classList.remove('ok', 'bad'); if (bad && bad.includes(id)) p.classList.add('bad'); if (ok && ok.includes(id)) p.classList.add('ok'); });
  };
  B.lock = () => { $$('button', B.body).forEach(b => b.disabled = true); };
  return B;
}

/* Ordre : on touche les étiquettes dans l'ordre, on retire une étape en la touchant. Émet order.check {order} */
function ordering(spec) {
  const B = board(spec.title, spec.intro);
  const slots = h(`<div class="order-slots"></div>`), pool = h(`<div class="pool"></div>`);
  const order = [];
  const label = id => spec.items.find(i => i[0] === id)[1];
  const draw = () => {
    slots.innerHTML = '';
    for (let k = 0; k < spec.items.length; k++) {
      const id = order[k];
      const s = h(`<button class="slot ${id ? 'full' : ''}" ${id ? '' : 'disabled'}><i>${k + 1}</i>${id ? esc(fr(label(id))) : esc(fr(spec.empty ? spec.empty(k) : `Étape ${k + 1} à compléter`))}</button>`);
      if (id) s.addEventListener('click', () => { order.splice(k, 1); draw(); act('order.change', { order: [...order] }); });
      slots.appendChild(s);
    }
    $$('.chip', pool).forEach(c => c.classList.toggle('used', order.includes(c.dataset.id)));
  };
  spec.items.forEach(([id, t]) => {
    const c = h(`<button class="chip" data-id="${id}">${esc(fr(t))}</button>`);
    c.addEventListener('click', () => { if (order.includes(id)) return; order.push(id); draw(); act('order.change', { order: [...order] }); });
    pool.appendChild(c);
  });
  B.body.appendChild(slots); B.body.appendChild(pool);
  const foot = h(`<div class="board-foot"><button class="btn-2">Recommencer</button><button class="cta dark">${esc(spec.btn || 'Valider')}</button></div>`);
  const go = $('.cta', foot), reset = $('.btn-2', foot);
  go.addEventListener('click', () => { if (act('order.check', { order: [...order] }) === 'no') shake(go); });
  reset.addEventListener('click', () => { order.length = 0; draw(); act('order.change', { order: [] }); });
  B.body.appendChild(foot);
  B.order = order; B.draw = draw;
  B.flag = bad => $$('.slot', slots).forEach((s, k) => s.classList.toggle('bad', !!bad && bad.includes(k)));
  B.lock = () => { $$('button', B.body).forEach(b => b.disabled = true); };
  draw();
  return B;
}

/* Bureau d'ordinateur avec des applications. Émet desk.open {id} */
const ICONS = {
  excel: ['Excel', '#1D7A45', '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="1.8"><rect x="5" y="5" width="18" height="18" rx="2"/><path d="M5 11h18M5 17h18M11 5v18"/></svg>'],
  word: ['Word', '#2B5FB4', '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M7 8h14M7 12.5h14M7 17h14M7 21.5h9"/></svg>'],
  ppt: ['PowerPoint', '#C4462A', '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="1.8"><rect x="4.5" y="6.5" width="19" height="13" rx="1.5"/><path d="M14 19.5v3M10 22.5h8"/><path d="M9 15l3-3 2.5 2 4-4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'],
  pbi: ['Power BI Desktop', '#F2C811', '<svg viewBox="0 0 28 28" fill="#141B3C"><rect x="6" y="14" width="4.4" height="9" rx="1"/><rect x="11.8" y="9" width="4.4" height="14" rx="1"/><rect x="17.6" y="4.5" width="4.4" height="18.5" rx="1"/></svg>'],
  bin: ['Corbeille', '#5A6478', '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M7 9h14M11.5 9V6.5h5V9M8.8 9l1 13h8.4l1-13"/></svg>'],
  web: ['Navigateur', '#0E8A9A', '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="1.7"><circle cx="14" cy="14" r="8.5"/><path d="M5.5 14h17M14 5.5c-3 3-3 14 0 17M14 5.5c3 3 3 14 0 17"/></svg>'],
  files: ['Explorateur', '#E0A526', '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M5 9.5V21h18V11H13.5l-2-2.5H5z"/></svg>'],
  calc: ['Calculatrice', '#3D4782', '<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="1.7"><rect x="7.5" y="4.5" width="13" height="19" rx="2"/><path d="M10.5 8.5h7"/><path d="M11 13h.01M14 13h.01M17 13h.01M11 16.5h.01M14 16.5h.01M17 16.5h.01M11 20h.01M14 20h.01M17 20h.01" stroke-width="2.4" stroke-linecap="round"/></svg>']
};
function desktop(ids) {
  const el = h(`<div><div class="desk"><div class="desk-icons"></div><div class="desk-bar"><span class="num">09:12</span></div><div class="splash"><div>${ICONS.pbi[2].replace('<svg', '<svg width="64" height="64"')}Power BI Desktop</div></div></div></div>`);
  ids.forEach(id => {
    const [nom, col, svg] = ICONS[id];
    const b = h(`<button class="dicon" data-app="${id}"><i style="background:${col}">${svg}</i>${esc(nom)}</button>`);
    b.addEventListener('click', () => { if (act('desk.open', { id }) === 'no') shake(b); });
    $('.desk-icons', el).appendChild(b);
  });
  return el;
}

/* Carte de leçon */
function lesson(k, titre, html) {
  return h(`<div><div class="lesson-card">${k ? `<div class="lc-k">${esc(fr(k))}</div>` : ''}${titre ? `<div class="lc-h">${esc(fr(titre))}</div>` : ''}${html || ''}</div></div>`);
}

/* Petite pause entre deux gestes, interrompue par un toucher */
const norm = window.PBQ.norm;

window.K = { menu, closeMenu, board, matching, ordering, desktop, lesson, ICONS, norm };
})();

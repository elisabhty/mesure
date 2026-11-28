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

/* Association : deux réponses possibles → montagnes russes ; sinon → grande roue. Émet match.pick et match.check {values} */
function matching(spec) {
  if (spec.options.length === 2) {
    const B = window.J.tri({ title: spec.title, intro: spec.intro, options: spec.options, rows: spec.rows.map(r => ({ id: r.id, t: r.label, sub: r.sub })), btn: spec.btn || 'Vérifier mes réponses', key: spec.key, ev: 'match' });
    const mark = B.mark; B.mark = (ok, bad) => (ok || bad) ? mark(bad || [], ok || undefined) : mark();
    B.body = B.el.firstElementChild;
    return B;
  }
  return window.J.pairs(spec);
}

/* Ordre : le petit train, gare après gare. Émet order.change et order.check {order} */
function ordering(spec) { return window.J.order(spec); }

/* Attraction de leçon, avec sa solution (chaque choix est jugé tout de suite) et une explication par erreur.
   Tri : rows [id, texte, case, explication]. Paires : rows [id, libellé, partenaire, explication]. Ordre : items dans le bon ordre, start mélangé, why[position]. */
async function jeu(x, spec) {
  const T = { title: spec.title, intro: spec.intro, btn: spec.btn || 'Vérifier' };
  if (spec.pairs) {
    const B = window.J.pairs({ ...T, rows: spec.rows.map(r => ({ id: r[0], label: r[1] })), options: spec.options, key: Object.fromEntries(spec.rows.map(r => [r[0], r[2]])), why: Object.fromEntries(spec.rows.map(r => [r[0], r[3]])) });
    x.app(spec.app, B.el); x.todo(spec.todo);
    await x.wait({ 'match.pick': () => { B.mark(); }, 'match.check': ({ values }) => {
      if (spec.rows.some(r => !values[r[0]])) return x.oops('', spec.miss || 'Place chaque élément avant de vérifier.');
      const bad = spec.rows.filter(r => values[r[0]] !== r[2]);
      B.mark(spec.rows.filter(r => !bad.includes(r)).map(r => r[0]), bad.map(r => r[0]));
      if (!bad.length) { B.lock(); return true; }
      return x.oops('', bad[0][3]);
    } });
  } else if (spec.items) {
    const B = window.J.order({ ...T, items: spec.items, start: spec.start, key: spec.items.map(i => i[0]), why: spec.why });
    x.app(spec.app, B.el); x.todo(spec.todo);
    await x.wait({ 'order.change': () => {}, 'order.check': ({ order }) => {
      const k = order.findIndex((id, i) => id !== spec.items[i][0]);
      if (k < 0) { B.lock(); return true; }
      B.flag([k]); return x.oops('', spec.why[k]);
    } });
  } else {
    const B = window.J.tri({ ...T, options: spec.options, rows: spec.rows.map(r => ({ id: r[0], t: r[1] })), key: Object.fromEntries(spec.rows.map(r => [r[0], r[2]])), why: Object.fromEntries(spec.rows.map(r => [r[0], r[3]])), ev: 'jeu' });
    x.app(spec.app, B.el); x.todo(spec.todo);
    await x.wait({ 'jeu.pick': () => {}, 'jeu.check': ({ values }) => {
      const bad = spec.rows.filter(r => values[r[0]] !== r[2]);
      B.mark(bad.map(r => r[0]));
      if (!bad.length) { B.lock(); return true; }
      return x.oops('', bad[0][3]);
    } });
  }
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
  const el = h(`<div><div class="lesson-card">${k ? `<div class="lc-k">${esc(fr(k))}</div>` : ''}${titre ? `<div class="lc-h">${esc(fr(titre))}</div>` : ''}${html || ''}</div></div>`);
  typo(el);
  return el;
}
/* Typographie française sur tous les textes d'un bloc (espaces insécables avant : ; ! ? €, apostrophes) */
function typo(el) {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && n.parentElement.closest('.mono') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const list = []; while (w.nextNode()) list.push(w.currentNode);
  list.forEach(n => { const t = fr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; });
  return el;
}

/* Petite pause entre deux gestes, interrompue par un toucher */
const norm = window.PBQ.norm;

/* ───────── Aides pour les missions de rapport ───────── */
const pageOf = (x, id) => x.pbi.P.pages.find(p => p.id === id);
const visOf = (x, id) => { for (const p of x.pbi.P.pages) { const v = p.visuals.find(v => v.id === id); if (v) return v; } return null; };
/* Remet l'espace de travail sur une page, en vue Rapport, sans dialogue ouvert */
function ready(x, pageId) {
  const pbi = x.pbi; x.app('pbi'); pbi.closeDialog(true); if (pbi.closePQ) pbi.closePQ(true); pbi.closeBackstage && pbi.closeBackstage();
  pbi.st.view = 'report'; pbi.st.focus = null; if (pageId && pageOf(x, pageId)) pbi.P.activePage = pageId; pbi.render();
}
const sig = f => `${f.c}:${f.agg}${f.hier ? ':H' : ''}`;
const titleIs = (v, t) => !!(v && v.title && norm(v.title) === norm(t));
/* Garde générique : protège les visuels validés, laisse le reste libre */
function guard(x, keep, extra = {}) {
  const k = id => keep.includes(id);
  const no = () => x.oops('', 'Ce visuel est déjà validé : laisse-le tel quel.');
  return Object.assign({
    'well.agg': p => k(p.vis) ? no() : undefined, 'well.add': p => k(p.vis) ? no() : undefined, 'well.remove': p => k(p.vis) ? no() : undefined,
    'well.move': p => k(p.vis) ? no() : undefined, 'well.hier': p => k(p.vis) ? no() : undefined, 'well.rename': p => k(p.vis) ? no() : undefined,
    'viz.fmt': p => k(p.vis) ? no() : undefined, 'viz.type': p => k(p.vis) ? no() : undefined, 'table.sort': p => k(p.vis) ? no() : undefined, 'vis.sort': p => k(p.vis) ? no() : undefined,
    'vis.delete': p => k(p.vis) ? x.oops('', 'Garde ce visuel : il fait partie du rapport.') : undefined,
    view: v => v !== 'report' ? x.oops('', 'Reste dans la vue Rapport.') : undefined,
    page: () => {}, pane: () => {}, visual: () => {}, canvas: () => {}, tab: () => {}, field: () => {}, 'table.select': () => {},
    'viz.create': () => {}, 'chart.point': () => {}, 'table.sort2mode': () => {}, 'vis.focus': () => {}, 'page.renameStart': () => {}, 'table.rowsel': () => {},
    'filter.add': () => x.oops('', 'Garde le périmètre complet : aucun filtre n’est nécessaire ici.'), 'filter.set': () => x.oops('', 'Garde le périmètre complet : aucun filtre n’est nécessaire ici.'),
    'filter.type': () => x.oops('', 'Garde le périmètre complet : aucun filtre n’est nécessaire ici.'), 'filter.remove': () => {}, 'slicer': () => {}, 'interaction.set': () => x.oops('', 'Garde les interactions telles qu’elles sont.'),
    'nav.page': () => {}, 'multi.mode': () => {}, 'view.opt': () => {}, 'clip.copy': () => {}, 'tab.start': () => {},
    'page.rename': () => {}, 'page.dup': () => x.oops('', 'Aucune page supplémentaire n’est nécessaire.'), 'page.del': () => x.oops('', 'Garde les pages du rapport.'),
    cmd: c => ['newmeasure', 'newcol'].includes(c) ? x.oops('', 'Pas de formule aujourd’hui : les agrégations suffisent.') : c === 'relations' ? x.oops('', 'Aucune relation n’est nécessaire ici.') : c === 'newpage' ? x.oops('', 'Aucune nouvelle page n’est nécessaire.') : undefined,
    'model.tool': () => x.oops('', 'Aucune relation n’est nécessaire ici.')
  }, extra);
}
/* Enregistrement final : vue Rapport et sauvegarde, validé sur l'état */
async function saveStep(x, valid, msgs = {}) {
  const pbi = x.pbi, P = () => pbi.P;
  const next = () => { x.todo(msgs.todo || 'Enregistre le projet Wonderland_Pilotage.'); x.guide('.pbi-save'); };
  next();
  const save = () => { pbi.closeBackstage(); const e = valid(); if (e) return x.oops(e[0] || '', e[1]); P().dirty = false; P().saved = true; pbi.render(); return true; };
  await x.wait(guard(x, msgs.keep || [], Object.assign({
    save: () => save(), 'file.menu': () => {},
    file: k => k === 'back' ? undefined : k === 'save' ? save() : k === 'saveas' ? x.oops(msgs.saveas || '', 'Utilise Enregistrer pour garder le même projet.') : x.oops('', 'Utilise Enregistrer.')
  }, msgs.extra || {})));
  x.guide();
}

window.K = { menu, closeMenu, board, matching, ordering, jeu, desktop, lesson, typo, ICONS, norm, pageOf, visOf, ready, sig, titleIs, guard, saveStep };
})();

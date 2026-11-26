/* Power BI Quest — éditeur Power Query du module 2 (missions 201 et suivantes)
   Rubans, volet Requêtes (groupes, chargement, références), étapes appliquées, grille virtualisée,
   qualité / distribution / profil des colonnes, dialogues de transformation, dépendances, éditeur avancé.
   Toute action passe par this.emit : « q2.try » avant une modification (refusable), « q2.done » après. */
(function () {
'use strict';
const PBI = window.PBI, P_ = PBI.prototype, PQE = window.PQE;
const { h, esc, fr, $, $$, clone, shake } = window.PBQ;
const I = PBI.I, TY = PQE.TYPES;
const NB = ' ';
const files = () => (window.PBQ_DATA2 || { files: {} }).files;
const svg = (d, w = 20) => `<svg viewBox="0 0 20 20" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const QI = {
  list: svg('<path d="M4 5h12M4 10h12M4 15h12"/>', 18),
  dots: '<svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><circle cx="5" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/></svg>',
  gear: svg('<circle cx="10" cy="10" r="2.6"/><path d="M10 2.5v2.2M10 15.3v2.2M2.5 10h2.2M15.3 10h2.2M4.7 4.7l1.5 1.5M13.8 13.8l1.5 1.5M4.7 15.3l1.5-1.5M13.8 6.2l1.5-1.5"/>', 15),
  warn: '<svg viewBox="0 0 20 20" width="14" height="14"><path d="M10 2.5l8 14H2z" fill="#F2C811" stroke="#8A6D00" stroke-width="1"/><path d="M10 8v4M10 14.2v.1" stroke="#3B2F00" stroke-width="1.6" stroke-linecap="round"/></svg>',
  fn: '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8.5 4.5c-1.6-.4-2.4.4-2.6 1.8L5 13.6c-.2 1.2-.8 1.6-1.8 1.4M3.8 9h3.8" stroke-linecap="round"/><path d="M11 9l5 6M16 9l-5 6" stroke-linecap="round"/></svg>',
  val: svg('<rect x="3" y="5" width="14" height="10" rx="1.5"/><path d="M7 10h6"/>', 14),
  code: svg('<path d="M7 6l-4 4 4 4M13 6l4 4-4 4"/>'),
  props: svg('<rect x="4" y="3" width="12" height="14" rx="1.2"/><path d="M7 7h6M7 10h6M7 13h4"/>'),
  manage: svg('<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/><path d="M9 6h4.5v5M11 14H6.5V9"/>'),
  choose: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M8 3v14M12 3v14"/><path d="M5 7.5l1 1 1.5-2" stroke-width="1.2"/>'),
  keep: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M3 8h14M3 12.5h14"/><path d="M6.5 5.5h7" stroke-width="2.2" stroke="#118DFF"/>'),
  rmrows: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M3 8h14M3 12.5h14"/><path d="M8 4.2l4 2.6M12 4.2l-4 2.6" stroke="#C4314B" stroke-width="1.6"/>'),
  sortA: svg('<path d="M5 4v12M2.5 13.5L5 16l2.5-2.5"/><path d="M10 5h3.5L10 9h3.5M10 15l1.8-5 1.8 5M10.6 13.5h2.4"/>'),
  sortZ: svg('<path d="M5 4v12M2.5 6.5L5 4l2.5 2.5"/><path d="M10 5h3.5L10 9h3.5M10 15l1.8-5 1.8 5M10.6 13.5h2.4"/>'),
  split: svg('<rect x="3" y="4" width="14" height="12" rx="1.2"/><path d="M10 4v12" stroke-dasharray="2 1.6"/><path d="M6 10H4.5M14 10h1.5"/>'),
  group: svg('<rect x="3" y="3" width="5" height="4" rx=".8"/><rect x="3" y="9" width="5" height="4" rx=".8"/><rect x="12" y="6" width="5" height="6" rx=".8"/><path d="M8 5h2v8H8M10 9h2"/>'),
  type: svg('<path d="M4 6h8M8 6v9"/><path d="M13 11l2.5 4 2-6" stroke-width="1.3"/>'),
  promote: svg('<rect x="3" y="7" width="14" height="10" rx="1"/><path d="M3 11h14M10 2.5v6M7.5 5L10 2.5 12.5 5"/>'),
  replace: svg('<path d="M4 6.5h9.5M11 4l2.5 2.5L11 9M16 13.5H6.5M9 11l-2.5 2.5L9 16"/>'),
  merge: svg('<rect x="2.5" y="3" width="6" height="6" rx="1"/><rect x="11.5" y="3" width="6" height="6" rx="1"/><path d="M5.5 9v3.5h9V9M10 12.5V17"/>'),
  append: svg('<rect x="4" y="2.5" width="12" height="6" rx="1"/><rect x="4" y="11.5" width="12" height="6" rx="1" stroke-dasharray="2 1.6"/><path d="M10 8.5v3"/>'),
  multi: svg('<rect x="3" y="4" width="5" height="12" rx="1"/><rect x="12" y="4" width="5" height="12" rx="1"/><path d="M4.8 9.7l.9.9 1.4-1.8M13.8 9.7l.9.9 1.4-1.8" stroke-width="1.2"/>'),
  rename: svg('<rect x="2.5" y="6" width="12" height="8" rx="1"/><path d="M5.5 10h5M16.5 4v12M15 4h3M15 16h3"/>'),
  fill: svg('<rect x="5" y="3" width="10" height="14" rx="1"/><path d="M5 7.5h10M5 12h10"/><path d="M10 8.5v6M8 12.5l2 2 2-2" stroke="#118DFF"/>'),
  format: svg('<path d="M4 15l4-10 4 10M5.5 11.5h5"/><path d="M13 15c0-1.6 1-2.5 2.2-2.5s2 1 2 2.5-1 2.5-2 2.5-2.2-.9-2.2-2.5z" stroke-width="1.2"/>'),
  extract: svg('<rect x="3" y="5" width="14" height="10" rx="1"/><path d="M7 5v10" stroke-dasharray="1.8 1.4"/><path d="M10 10h5M13 8l2 2-2 2"/>'),
  count: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M7.5 7.5h5l-5 5h5"/>'),
  custom: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M11 3v14"/><path d="M13 8h2.5M14.2 6.8v2.5M12.8 12.5h3" stroke="#118DFF"/>'),
  invoke: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M11 3v14"/><path d="M13.5 7.5c-.6-.2-1 .2-1 .8l-.3 4c-.1.6-.4.8-.9.7M12 10h2" stroke="#118DFF" stroke-width="1.1"/>'),
  cond: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M11 3v14"/><path d="M13 6.5l1.5 1.5L13 9.5M16 11.5l-1.5 1.5 1.5 1.5" stroke="#118DFF" stroke-width="1.2"/>'),
  index: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M11 3v14"/><path d="M13.3 6.5h1.2v4M13 13.2h2.4" stroke="#118DFF" stroke-width="1.2"/>'),
  dupcol: svg('<rect x="3" y="3" width="6" height="14" rx="1"/><rect x="11" y="3" width="6" height="14" rx="1" stroke-dasharray="2 1.6"/>'),
  fx: svg('<path d="M9 4.5c-1.7-.5-2.6.4-2.8 1.9l-1 7.2c-.2 1.3-.9 1.8-1.9 1.5M4.2 9h4"/><path d="M11 9l5 6M16 9l-5 6"/>'),
  quality: svg('<rect x="3" y="7" width="14" height="5" rx="1"/><path d="M3 9.5h8" stroke="#3B9D5D" stroke-width="5"/><path d="M11 9.5h3" stroke="#C4314B" stroke-width="5"/>'),
  dist: svg('<path d="M4 16V9M7.5 16V5M11 16v-6M14.5 16V7" stroke-width="2.2"/>'),
  prof: svg('<rect x="3" y="3" width="14" height="14" rx="1.2"/><path d="M6 14v-3M9 14V8M12 14v-5M15 14v-2" stroke-width="1.6"/>'),
  ws: svg('<path d="M4 13.5h3.5M9 13.5h3.5M14 13.5h2.5" stroke-width="1.6"/><path d="M5 7h10" stroke-width="1"/>'),
  deps: svg('<rect x="2.5" y="3" width="6" height="4.5" rx=".8"/><rect x="11.5" y="7.75" width="6" height="4.5" rx=".8"/><rect x="2.5" y="12.5" width="6" height="4.5" rx=".8"/><path d="M8.5 5.2h1.5v4.8h1.5M8.5 14.8h1.5V10"/>'),
  enter: I.enter, apply: I.save, get: I.get, refresh: I.refresh, cols: I.col, table: I.table,
  arrow: '<svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>'
};
const tyIcon = t => { const c = { dec: '1.2', fixed: '$', int: '123', pct: '%', text: 'ABC', bool: '✓✗', any: 'ABC<br>123', table: '⊞', record: '{}', list: '[ ]', bin: '01' }[t]; if (c) return c; if (t === 'date' || t === 'datetime' || t === 'dtz') return I.cal.replace('<svg', '<svg width="12" height="12"'); if (t === 'time' || t === 'dur') return I.clock.replace('<svg', '<svg width="12" height="12"'); return 'ABC<br>123'; };
const isNumT = t => ['dec', 'fixed', 'int', 'pct'].includes(t);
const loadOf = q => q.m2 ? q.load !== false : q.loadEnabled !== false;
const setLoad = (q, v) => { if (q.m2) q.load = v; else q.loadEnabled = v; };
const refreshOf = q => q.refresh !== false;
P_.m2 = function () { return ((this.opts && this.opts.mission) || 0) >= 201; };
P_.engine = function () {
  if (!this.qe || this.qe.P !== this.P) this.qe = new PQE.Engine(this.P, files(), (q, at) => PBI.evalQuery(q, at));
  return this.qe;
};
PBI.loadOf = loadOf; PBI.setLoad = setLoad; PBI.refreshOf = refreshOf; PBI.QI = QI;

/* ───────── Affichage des valeurs ───────── */
const numFr = v => { if (!isFinite(v)) return String(v); const s = String(Math.round(v * 1e10) / 1e10); return s.replace('.', ','); };
function disp(v, type, ws) {
  if (v === null || v === undefined) return { s: 'null', c: 'nul' };
  if (v instanceof PQE.MErr) return { s: 'Error', c: 'err' };
  if (v instanceof PQE.MTable) return { s: 'Table', c: 'lnk' };
  if (Array.isArray(v)) return { s: 'List', c: 'lnk' };
  if (v instanceof PQE.MFn || typeof v === 'function') return { s: 'Function', c: 'lnk' };
  if (v instanceof PQE.MType) return { s: 'Type', c: 'lnk' };
  if (v instanceof PQE.MDate) return { s: v.fr(), c: 'r' };
  if (PQE.isRec(v)) return { s: 'Record', c: 'lnk' };
  if (typeof v === 'number') return { s: type === 'pct' ? numFr(v * 100) + NB + '%' : numFr(v), c: 'r' };
  if (typeof v === 'boolean') return { s: v ? 'TRUE' : 'FALSE', c: '' };
  const s = String(v);
  if (type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(s)) return { s: `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`, c: 'r' };
  return { s: ws ? s.replace(/ /g, '·').replace(/\t/g, '→') : s, c: '' };
}
PBI.q2disp = disp;
const shortVal = v => { const d = disp(v); return d.c === 'nul' ? '(null)' : d.s === '' ? '(vide)' : typeof v === 'string' && v.trim() === '' ? v.replace(/ /g, '·').replace(/\t/g, '→') : d.s; };

/* ───────── Ouverture et fermeture ───────── */
P_.openQ2 = function (opts = {}) {
  this.closeQ2(true); if (this.closePQ) this.closePQ(true);
  const eng = this.engine(); eng.touch();
  const keep = this.q2keep || {};
  this.q2 = Object.assign({ cur: null, selStep: null, sel: [], multi: false, cell: null, tab: 'Accueil', qd: false, stepsOpen: false, fx: true, quality: false, dist: false, prof: false, ws: false, scope: 'top', scroll: {}, dirty: false, collapsed: {} },
    { fx: keep.fx ?? true, quality: !!keep.quality, dist: !!keep.dist, prof: !!keep.prof, ws: !!keep.ws, scope: keep.scope || 'top' }, opts.st || {});
  const want = opts.cur && (eng.q(opts.cur) || null);
  this.q2.cur = want ? want.id : (this.P.queries.find(q => q.m2) || this.P.queries[0] || {}).id || null;
  const el = h(`<div class="pq2" role="dialog" aria-label="Éditeur Power Query"></div>`);
  this.q2El = el; this.el.appendChild(el);
  el.addEventListener('click', e => this.q2Click(e));
  el.addEventListener('keydown', e => { const i = e.target.closest('[data-enter]'); if (i && e.key === 'Enter') { e.preventDefault(); this.q2Enter(i); } });
  this.q2render();
  requestAnimationFrame(() => el.classList.add('on'));
  return this.q2;
};
P_.closeQ2 = function (now) {
  if (!this.q2El) return;
  const q2 = this.q2; this.q2keep = { fx: q2.fx, quality: q2.quality, dist: q2.dist, prof: q2.prof, ws: q2.ws, scope: q2.scope };
  const el = this.q2El; this.q2El = null; this.q2Menu && this.q2Menu.remove(); this.q2Menu = null;
  if (now) el.remove(); else { el.classList.remove('on'); setTimeout(() => el.remove(), 330); }
};
P_.q2q = function () { const eng = this.engine(); return eng.q(this.q2.cur) || null; };
P_.q2at = function () { const q = this.q2q(); if (!q) return -1; const n = q.steps.length - 1; return this.q2.selStep === null || this.q2.selStep > n ? n : this.q2.selStep; };
P_.q2result = function () { const q = this.q2q(); if (!q) return {}; return this.engine().run(q, this.q2at()); };
P_.q2table = function () { const r = this.q2result(); return r.table || null; };
P_.q2refresh = function () { this.engine().touch(); this.q2render(); };
P_.q2emit = function (type, payload) { return this.emit(type, Object.assign({ q: this.q2q(), qn: (this.q2q() || {}).name }, payload || {})); };

/* ───────── Rendu ───────── */
P_.q2render = function () {
  const el = this.q2El, q2 = this.q2; if (!el) return;
  const q = this.q2q();
  const g0 = $('.q2-grid', el);
  if (g0 && q2._shown) q2.scroll[q2._shown] = { t: g0.scrollTop, l: g0.scrollLeft };
  el.innerHTML = '';
  el.appendChild(this.q2top(q));
  el.appendChild(this.q2ribbon(q));
  if (q2.fx && q) el.appendChild(this.q2fx(q));
  const main = h(`<div class="q2-main"></div>`);
  main.appendChild(this.q2gridBox(q));
  if (q2.cell && q) main.appendChild(this.q2valPane());
  else if (q2.prof && q2.sel.length === 1 && q && this.q2table()) main.appendChild(this.q2profPane());
  el.appendChild(main);
  el.appendChild(this.q2status(q));
  el.appendChild(this.q2stepsBar(q));
  if (q2.stepsOpen && q) el.appendChild(this.q2stepsSheet(q));
  if (q2.qd) el.appendChild(this.q2drawer());
  this.applyMarks();
  if (this.hooks.q2after) this.hooks.q2after(this);
};
P_.q2top = function (q) {
  const n = this.P.queries.length;
  return h(`<div class="q2-top">
    <button class="q2-qbtn" data-q="qd" aria-label="Volet Requêtes">${QI.list}<span>Requêtes</span><b>${n}</b></button>
    <button class="q2-qname ${q && !loadOf(q) ? 'nl' : ''}" data-q="qmenu:${q ? esc(q.id) : ''}">${q ? esc(q.name).replace(/_/g, '_<wbr>') : 'Aucune requête'}</button>
    <button class="q2-x" data-q="x" aria-label="Fermer Power Query">${I.close}</button></div>`);
};
const RB = {
  'Accueil': [['apply', 'Fermer et appliquer', 'apply', 1], ['newsource', 'Nouvelle source', 'get', 1], ['enter', 'Entrer des données', 'enter'], '|', ['refresh', 'Actualiser l’aperçu', 'refresh', 1], ['props', 'Propriétés', 'props'], ['adv', 'Éditeur avancé', 'code'], ['manage', 'Gérer', 'manage', 1], '|',
    ['choose', 'Choisir des colonnes', 'choose'], ['rmcols', 'Supprimer les colonnes', 'cols', 1], ['keeprows', 'Conserver les lignes', 'keep', 1], ['rmrows', 'Supprimer les lignes', 'rmrows', 1], '|', ['sortasc', 'Trier croissant', 'sortA'], ['sortdesc', 'Trier décroissant', 'sortZ'], '|',
    ['split', 'Fractionner la colonne', 'split', 1], ['group', 'Regrouper par', 'group'], ['type', 'Type de données', 'type', 1], ['promote', 'Utiliser la première ligne pour les en-têtes', 'promote', 1], ['replace', 'Remplacer les valeurs', 'replace'], '|',
    ['merge', 'Fusionner des requêtes', 'merge', 1], ['append', 'Ajouter des requêtes', 'append', 1], '|', ['multi', 'Sélection multiple', 'multi']],
  'Transformer': [['group', 'Regrouper par', 'group'], ['promote', 'Utiliser la première ligne pour les en-têtes', 'promote', 1], ['count', 'Compter les lignes', 'count'], '|', ['type', 'Type de données', 'type', 1], ['rename', 'Renommer', 'rename'], ['replace', 'Remplacer les valeurs', 'replace'], ['fill', 'Remplir', 'fill', 1], '|',
    ['split', 'Fractionner la colonne', 'split', 1], ['format', 'Format', 'format', 1], ['extract', 'Extraire', 'extract', 1]],
  'Ajouter une colonne': [['custom', 'Colonne personnalisée', 'custom'], ['invoke', 'Appeler une fonction personnalisée', 'invoke'], ['cond', 'Colonne conditionnelle', 'cond'], ['index', 'Colonne d’index', 'index', 1], ['dupcol', 'Dupliquer la colonne', 'dupcol'], '|', ['aformat', 'Format', 'format', 1], ['aextract', 'Extraire', 'extract', 1]],
  'Affichage': [['fx', 'Barre de formule', 'fx'], ['quality', 'Qualité de colonne', 'quality'], ['dist', 'Distribution de colonne', 'dist'], ['prof', 'Profil de colonne', 'prof'], ['ws', 'Afficher les espaces blancs', 'ws'], '|', ['deps', 'Dépendances de requête', 'deps'], ['adv', 'Éditeur avancé', 'code']]
};
const NEEDCOL = ['rmcols', 'sortasc', 'sortdesc', 'split', 'type', 'replace', 'rename', 'fill', 'format', 'extract', 'dupcol', 'aformat', 'aextract'];
P_.q2ribbon = function (q) {
  const q2 = this.q2;
  const r = h(`<div class="q2-rb"><div class="rb-tabs">${Object.keys(RB).map(t => `<button class="rb-tab ${t === q2.tab ? 'on' : ''}" data-q="tab:${t}">${esc(t)}</button>`).join('')}</div><div class="rb-cmds"></div></div>`);
  const box = $('.rb-cmds', r), T = q ? this.q2table() : null;
  const toggles = { fx: q2.fx, quality: q2.quality, dist: q2.dist, prof: q2.prof, ws: q2.ws, multi: q2.multi };
  for (const c of RB[q2.tab]) {
    if (c === '|') { box.appendChild(h('<i class="rb-sep"></i>')); continue; }
    const [k, label, ic, drop] = c;
    const dis = !q || (NEEDCOL.includes(k) && !q2.sel.length) || (['custom', 'cond', 'index', 'group', 'choose', 'keeprows', 'rmrows', 'promote', 'count', 'invoke', 'merge'].includes(k) && !T);
    box.appendChild(h(`<button class="rb-cmd ${label.length > 28 ? 'wide' : ''} ${k in toggles && toggles[k] ? 'rbon' : ''}" data-q="cmd:${k}" ${dis && k !== 'newsource' && k !== 'enter' && k !== 'apply' && k !== 'deps' && !(k in toggles) ? 'disabled' : ''}>${QI[ic] || ''}<span>${esc(label)}${drop ? ' ' + QI.arrow : ''}</span></button>`));
  }
  requestAnimationFrame(() => { const tb = $('.rb-tabs', r), on = $('.rb-tab.on', r); if (tb && on && on.offsetLeft + on.offsetWidth > tb.clientWidth) tb.scrollLeft = on.offsetLeft + on.offsetWidth - tb.clientWidth + 8; PBI.ribbonHint(box); });
  return r;
};
P_.q2fx = function (q) {
  const eng = this.engine(), at = this.q2at(), s = q.steps[at];
  let f = eng.formula(q, at);
  if (f === null) f = PBI.stepFormula ? '= ' + PBI.stepFormula(q, at) : '= …';
  const editable = s && s.op === 'mstep';
  const box = h(`<div class="q2-fx"><button class="q2-fxadd" data-q="fxadd" aria-label="Ajouter une étape">${QI.fx}</button><code data-q="fxview"></code>${editable ? `<button class="q2-fxed" data-q="fxedit">Modifier</button>` : ''}</div>`);
  $('code', box).textContent = f;
  return box;
};
P_.q2status = function (q) {
  const T = q ? this.q2table() : null, q2 = this.q2;
  const nr = T ? T.rows.length : 0;
  return h(`<div class="q2-status"><span>${T ? `${T.cols.length} COLONNE${T.cols.length > 1 ? 'S' : ''}, ${nr > 999 ? '999+' : nr} LIGNE${nr > 1 ? 'S' : ''}` : q ? '—' : ''}</span>
    <button class="q2-scope" data-q="scope" aria-label="${q2.scope === 'all' ? 'Profilage de colonne basé sur l’ensemble des données' : 'Profilage de colonne basé sur les 1 000 premières lignes'}">${q2.scope === 'all' ? 'Profilage sur toutes les lignes' : 'Profilage sur 1 000 lignes'} ${QI.arrow}</button></div>`);
};

/* ───────── Grille virtualisée ───────── */
const RH = 30, HR = 42, HQ = 46, HD = 50;
P_.q2gridBox = function (q) {
  const q2 = this.q2;
  const box = h(`<div class="q2-grid" data-tap></div>`);
  if (!q) { box.appendChild(h(`<div class="q2-empty">Aucune requête. Utilise Nouvelle source pour en créer une.</div>`)); return box; }
  const r = this.q2result();
  if (r.error) {
    const e = r.error, own = r.stepError === this.q2at();
    box.appendChild(h(`<div class="q2-errbox">${QI.warn}<div><b>${esc(e.reason || 'Expression.Error')}${NB}: ${esc(fr(e.mmsg || String(e.message || e)))}</b>${e.detail !== null && e.detail !== undefined && e.detail !== '' ? `<small>Détails${NB}: ${esc(String(e.detail))}</small>` : ''}${own ? '' : `<small>${esc(fr(`L’erreur provient de l’étape « ${q.steps[r.stepError].name} ».`))}</small><button class="q2-goerr" data-q="st:${r.stepError}">Accéder à l’erreur</button>`}</div></div>`));
    q2._shown = null; return box;
  }
  const V = r.value;
  if (!(V instanceof PQE.MTable)) {
    if (V instanceof PQE.MFn) {
      box.appendChild(h(`<div class="q2-fnbox"><p>${QI.fn} Cette requête est une fonction.</p><div class="q2-sig">${esc(q.name)} = (${V.params.map(p => esc(p.name)).join(', ')}) =&gt; …</div><p class="lc-note">${esc(fr('Elle s’utilise dans une autre requête : Ajouter une colonne › Appeler une fonction personnalisée, ou dans une formule.'))}</p></div>`));
    } else box.appendChild(h(`<div class="q2-scalar"><small>${esc(PQE.typeName(V))}</small><b>${esc(disp(V).s)}</b></div>`));
    q2._shown = null; return box;
  }
  const T = V, key = q.id;
  const ws = q2.ws;
  /* largeurs de colonnes */
  const sample = T.rows.slice(0, 80);
  const W = T.cols.map(c => {
    let m = c.n.length * 8.2 + 68;
    for (const row of sample) { const d = disp(row[c.n], c.t, ws); m = Math.max(m, Math.min(d.s.length, 34) * 7.8 + 22); }
    return Math.round(Math.max(86, Math.min(m, 300)));
  });
  const RN = Math.max(38, String(T.rows.length).length * 9 + 16);
  const prof = (q2.quality || q2.dist) ? this.q2profAll(T) : null;
  const headH = HR + (q2.quality ? HQ : 0) + (q2.dist ? HD : 0);
  const totalW = RN + W.reduce((a, b) => a + b, 0);
  const inner = h(`<div class="q2-gin" style="width:${totalW}px; height:${headH + T.rows.length * RH + 6}px"></div>`);
  const sel = new Set(q2.sel);
  const head = h(`<div class="q2-head" style="height:${headH}px"></div>`);
  head.appendChild(h(`<div class="q2-hc rn" style="width:${RN}px"><span class="q2-corner">${I.tbl}</span></div>`));
  T.cols.forEach((c, i) => {
    const p = prof && prof[c.n];
    const qual = p && q2.quality ? `<div class="q2-qual"><i style="--v:${pct(p.valid, p.count)}%; --e:${pct(p.errors, p.count)}%"></i><span><b class="v">●</b>Valide ${pctTxt(p.valid, p.count)}</span><span><b class="e">●</b>Erreur ${pctTxt(p.errors, p.count)}</span><span><b class="n">●</b>Vide ${pctTxt(p.empty, p.count)}</span></div>` : '';
    const dist = p && q2.dist ? `<div class="q2-dist"><div class="q2-bars">${p.top.slice(0, 12).map(t => `<i style="height:${Math.max(6, Math.round(t.n / p.top[0].n * 100))}%"></i>`).join('')}</div><span>${p.distinct.toLocaleString('fr-FR').replace(/\s/g, NB)} distinct${p.distinct > 1 ? 's' : ''}, ${p.unique.toLocaleString('fr-FR').replace(/\s/g, NB)} unique${p.unique > 1 ? 's' : ''}</span></div>` : '';
    head.appendChild(h(`<div class="q2-hc ${sel.has(c.n) ? 'sel' : ''}" style="width:${W[i]}px"><div class="q2-hrow">
      <button class="q2-ty" data-q="ty:${esc(c.n)}" aria-label="Type de ${esc(c.n)}">${tyIcon(c.t)}</button>
      <button class="q2-hn" data-q="hd:${esc(c.n)}">${esc(c.n)}</button>
      ${c.t === 'table' || c.t === 'record' || (c.t === 'any' && T.rows.slice(0, 50).some(r => PQE.isRec(r[c.n]) || r[c.n] instanceof PQE.MTable)) ? `<button class="q2-fl" data-q="exp:${esc(c.n)}" aria-label="Développer ${esc(c.n)}">${svg('<path d="M4 7l6-4 6 4M4 13l6 4 6-4"/>', 14)}</button>` : `<button class="q2-fl" data-q="flt:${esc(c.n)}" aria-label="Filtrer ${esc(c.n)}">${QI.arrow}</button>`}</div>${qual}${dist}</div>`));
  });
  inner.appendChild(head);
  const body = h(`<div class="q2-body"></div>`);
  inner.appendChild(body);
  box.appendChild(inner);
  const cellSel = q2.cell;
  const draw = () => {
    const top = box.scrollTop, hgt = box.clientHeight || 360;
    const first = Math.max(0, Math.floor((top - headH) / RH) - 6), last = Math.min(T.rows.length, first + Math.ceil(hgt / RH) + 14);
    if (body._f === first && body._l === last) return;
    body._f = first; body._l = last;
    body.style.top = (headH + first * RH) + 'px';
    let html = '';
    for (let i = first; i < last; i++) {
      const row = T.rows[i];
      html += `<div class="q2-r"><div class="q2-c rn" style="width:${RN}px">${i + 1}</div>`;
      T.cols.forEach((c, k) => {
        const d = disp(row[c.n], c.t, ws);
        const on = cellSel && cellSel.r === i && cellSel.c === c.n;
        html += `<div class="q2-c ${d.c} ${sel.has(c.n) ? 'sel' : ''} ${on ? 'on' : ''}" style="width:${W[k]}px" data-q="cell:${i}|${esc(c.n)}">${esc(d.s)}</div>`;
      });
      html += '</div>';
    }
    body.innerHTML = html;
    this.applyMarks();
  };
  box.addEventListener('scroll', () => { if (!box._raf) box._raf = requestAnimationFrame(() => { box._raf = 0; draw(); }); }, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(() => { if (box.isConnected) { body._f = -1; draw(); } }).observe(box);
  q2._shown = key;
  const sc = q2.scroll[key];
  requestAnimationFrame(() => {
    if (sc) { box.scrollTop = sc.t; box.scrollLeft = sc.l; }
    /* Une colonne qui vient d'être créée est amenée dans le champ de vision */
    if (q2._reveal) {
      const i = T.cols.findIndex(x => x.n === q2._reveal); q2._reveal = null;
      if (i >= 0) { const left = RN + W.slice(0, i).reduce((a, b) => a + b, 0), right = left + W[i], cw = box.clientWidth; if (left < box.scrollLeft + RN || right > box.scrollLeft + cw) box.scrollLeft = snapLeft(W, RN, Math.max(0, Math.min(left - RN, right - cw + 2))); }
    }
    body._f = -1; draw(); if (q2._scrollTo) { const t = q2._scrollTo; q2._scrollTo = null; this.q2scrollTo(t.r, t.c); }
  });
  draw();
  this.q2grid = { box, T, W, RN, headH, draw };
  return box;
};
/* Défilement horizontal calé sur le bord d'une colonne : jamais de colonne à moitié cachée à gauche */
const snapLeft = (W, RN, want) => { let x = 0; for (const w of W) { if (x >= want - 1) return x; x += w; } return want; };
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : 0;
const pctTxt = (a, b) => { if (!b || !a) return '0' + NB + '%'; const v = a / b * 100; return (v > 0 && v < 1 ? '<' + NB + '1' : v > 99 && v < 100 ? '>' + NB + '99' : String(Math.round(v))) + NB + '%'; };
/* Fait défiler la grille jusqu'à une ligne (et une colonne) */
P_.q2scrollTo = function (r, c) {
  const g = this.q2grid; if (!g || !g.box.isConnected) { this.q2._scrollTo = { r, c }; return; }
  g.box.scrollTop = Math.max(0, g.headH + r * RH - g.box.clientHeight / 2);
  if (c) { const k = g.T.cols.findIndex(x => x.n === c); if (k >= 0) { const left = g.RN + g.W.slice(0, k).reduce((a, b) => a + b, 0); if (left < g.box.scrollLeft + g.RN || left + g.W[k] > g.box.scrollLeft + g.box.clientWidth) g.box.scrollLeft = Math.max(0, left - g.RN); } }
  g.draw();
};
P_.q2profAll = function (T) {
  const key = `${this.engine().rev}|${this.q2.cur}|${this.q2at()}|${this.q2.scope}`;
  if (this._q2pk === key) return this._q2p;
  const out = {}; for (const c of T.cols) out[c.n] = PQE.profile(T, c.n, this.q2.scope);
  this._q2pk = key; this._q2p = out; return out;
};
/* Volet de valeur : contenu complet d'une cellule (texte, erreur, table imbriquée) */
P_.q2valPane = function () {
  const q2 = this.q2, T = this.q2table();
  const box = h(`<div class="q2-pane"><div class="q2-ph"><b></b><button data-q="valx" aria-label="Fermer">${I.close}</button></div><div class="q2-pb"></div></div>`);
  if (!T || !T.rows[q2.cell.r]) { q2.cell = null; return h('<i></i>'); }
  const v = T.rows[q2.cell.r][q2.cell.c], col = T.cols.find(c => c.n === q2.cell.c);
  $('.q2-ph b', box).textContent = `${q2.cell.c} · ligne ${q2.cell.r + 1}`;
  const pb = $('.q2-pb', box);
  if (v instanceof PQE.MErr) pb.appendChild(h(`<div class="q2-errv">${QI.warn}<div><b>${esc(v.reason)}${NB}: ${esc(fr(v.message))}</b>${v.detail !== null && v.detail !== undefined ? `<small>Détails${NB}: ${esc(String(v.detail))}</small>` : ''}</div></div>`));
  else if (v instanceof PQE.MTable) {
    pb.appendChild(h(`<p class="q2-vt">Table · ${v.rows.length} ligne${v.rows.length > 1 ? 's' : ''}, ${v.cols.length} colonne${v.cols.length > 1 ? 's' : ''}</p>`));
    if (v.rows.length) pb.appendChild(this.q2mini(v, 6)); else pb.appendChild(h(`<p class="lc-note">${esc(fr('Table vide : aucune correspondance.'))}</p>`));
  } else if (PQE.isRec(v)) {
    pb.appendChild(h(`<table class="tbl q2-rec"><tbody>${Object.keys(v).map(k => `<tr><th><span class="thc">${esc(k)}</span></th><td class="${disp(v[k]).c}">${esc(disp(v[k]).s)}</td></tr>`).join('')}</tbody></table>`));
  } else if (Array.isArray(v)) pb.appendChild(h(`<p class="q2-vt">Liste · ${v.length} élément${v.length > 1 ? 's' : ''}${NB}: ${esc(v.slice(0, 12).map(x => shortVal(x)).join(', '))}</p>`));
  else if (typeof v === 'string') {
    const shown = v.replace(/ /g, '·');
    pb.appendChild(h(`<div class="q2-txt"><span class="q2-q">"</span><span class="mono">${esc(shown)}</span><span class="q2-q">"</span></div>`));
    pb.appendChild(h(`<p class="q2-vt">Texte · ${[...v].length} caractère${[...v].length > 1 ? 's' : ''}${/^\s|\s$/.test(v) ? ' · espaces au début ou à la fin' : ''}${v.trim() === '' && v !== '' ? ' · uniquement des espaces' : ''}</p>`));
  } else pb.appendChild(h(`<div class="q2-txt"><span class="mono">${esc(disp(v, col && col.t).s)}</span></div><p class="q2-vt">${esc(PQE.typeName(v) === 'Null' ? 'Valeur null : aucune valeur' : PQE.typeName(v) === 'Number' ? 'Nombre' : PQE.typeName(v) === 'Date' ? 'Date' : PQE.typeName(v) === 'Logical' ? 'Vrai/Faux' : PQE.typeName(v))}</p>`));
  return box;
};
P_.q2mini = function (T, n) {
  const t = h(`<div class="q2-mini"><table class="tbl"><thead><tr>${T.cols.map(c => `<th><span class="thc">${esc(c.n)}</span></th>`).join('')}</tr></thead><tbody>${T.rows.slice(0, n).map(r => `<tr>${T.cols.map(c => { const d = disp(r[c.n], c.t); return `<td class="${d.c === 'nul' ? 'null' : d.c}">${esc(d.s)}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`);
  return t;
};
/* Volet Profil de colonne */
P_.q2profPane = function () {
  const T = this.q2table(), col = this.q2.sel[0], c = T.cols.find(x => x.n === col);
  if (!c) return h('<i></i>');
  const p = PQE.profile(T, col, this.q2.scope);
  const n = x => (typeof x === 'number' ? x.toLocaleString('fr-FR', { maximumFractionDigits: 2 }).replace(/\s/g, NB) : shortVal(x));
  const stats = [['Nombre', p.count], ['Erreur', p.errors], ['Vide', p.empty], ['Distinct', p.distinct], ['Unique', p.unique]];
  if (p.nums) stats.push(['Zéro', p.zeros], ['Min', p.min], ['Max', p.max], ['Moyenne', p.avg === null ? null : Math.round(p.avg * 100) / 100]);
  else if (p.min !== null) stats.push(['Valeurs de chaîne vide', p.emptyText], ['Min', p.min], ['Max', p.max]);
  const mx = p.top.length ? p.top[0].n : 1;
  return h(`<div class="q2-pane prof"><div class="q2-ph"><b>Profil · ${esc(col)}</b><button data-q="profx" aria-label="Fermer">${I.close}</button></div><div class="q2-pb q2-pf">
    <div><small>Statistiques de colonne</small><table class="q2-stat"><tbody>${stats.map(s => `<tr><td>${esc(s[0])}</td><td class="r">${esc(n(s[1]))}</td></tr>`).join('')}</tbody></table></div>
    <div><small>Distribution des valeurs</small><div class="q2-vd">${p.top.slice(0, 8).map(t => `<div><span>${esc(shortVal(t.v))}</span><i style="width:${Math.max(3, Math.round(t.n / mx * 100))}%"></i><b>${t.n}</b></div>`).join('')}</div></div></div></div>`);
};

/* ───────── Étapes appliquées ───────── */
P_.q2stepsBar = function (q) {
  if (!q) return h('<div class="q2-sb"></div>');
  const at = this.q2at(), s = q.steps[at], r = this.q2result();
  return h(`<div class="q2-sb"><button data-q="steps" class="${this.q2.stepsOpen ? 'on' : ''}"><span>Étapes appliquées</span><b>${q.steps.length}</b><em>${r.error && r.stepError === at ? QI.warn : ''}${esc(s ? s.name : '')}</em>${svg(this.q2.stepsOpen ? '<path d="M5 8l5 5 5-5"/>' : '<path d="M5 12l5-5 5 5"/>', 14)}</button></div>`);
};
P_.q2stepsSheet = function (q) {
  const eng = this.engine(), at = this.q2at(), legacy = eng.isLegacy(q);
  const errAt = (() => { const r = eng.run(q); return r.error ? r.stepError : -1; })();
  const box = h(`<div class="q2-ss"><div class="q2-props"><label for="q2-qn">Nom</label><input id="q2-qn" value="${esc(q.name)}" data-enter="qname" spellcheck="false" autocapitalize="off" autocomplete="off"><button class="fbtn" data-q="qname">OK</button></div><ol></ol></div>`);
  const ol = $('ol', box);
  q.steps.forEach((s, i) => {
    const op = PQE.OPS[s.op] || {};
    const gear = !legacy && op.gear && s.op !== 'ref';
    const renaming = this.q2.renStep === i;
    ol.appendChild(h(`<li class="${i === at ? 'cur' : ''}">${renaming ? `<input class="q2-rs" value="${esc(s.name)}" data-enter="rstep:${i}" spellcheck="false" autocapitalize="off">` : `<button class="q2-st" data-q="st:${i}">${errAt >= 0 && i >= errAt ? QI.warn : ''}<span>${esc(s.name)}</span></button>`}
      ${gear ? `<button class="q2-sg" data-q="stg:${i}" aria-label="Paramètres de l’étape">${QI.gear}</button>` : '<i class="q2-sgv"></i>'}
      ${i > 0 || !legacy ? `<button class="q2-sx" data-q="stx:${i}" aria-label="Supprimer l’étape">${I.close.replace('<svg', '<svg width="12" height="12"')}</button>` : '<i class="q2-sgv"></i>'}
      <button class="q2-sm" data-q="stm:${i}" aria-label="Menu de l’étape">${QI.dots}</button></li>`));
  });
  if (this.q2.renStep !== undefined && this.q2.renStep !== null) requestAnimationFrame(() => { const inp = $('.q2-rs', box); if (inp) { inp.focus(); inp.select(); } });
  requestAnimationFrame(() => { const cur = $('li.cur', box); if (cur && box.scrollHeight > box.clientHeight) cur.scrollIntoView({ block: 'nearest' }); });
  return box;
};

/* ───────── Volet Requêtes ───────── */
P_.q2drawer = function () {
  const eng = this.engine(), q2 = this.q2;
  const groups = []; const by = new Map();
  for (const q of this.P.queries) { const g = q.group || ''; if (!by.has(g)) { by.set(g, []); groups.push(g); } by.get(g).push(q); }
  const order = (this.P.qgroups || []).filter(g => by.has(g)).concat(groups.filter(g => g && !(this.P.qgroups || []).includes(g)));
  if (by.has('')) order.push('');
  const box = h(`<div class="q2-qd"><div class="q2-qdin"><div class="q2-qdh"><b>Requêtes [${this.P.queries.length}]</b><button data-q="qdx" aria-label="Fermer le volet">${I.close}</button></div><div class="q2-ql"></div></div></div>`);
  const list = $('.q2-ql', box);
  for (const g of order) {
    const qs = by.get(g) || [];
    const named = !!g || order.length > 1;
    if (named) list.appendChild(h(`<button class="q2-grp ${q2.collapsed[g] ? 'off' : ''}" data-q="grp:${esc(g)}">${svg(q2.collapsed[g] ? '<path d="M8 5l5 5-5 5"/>' : '<path d="M5 8l5 5 5-5"/>', 12)}<span>${esc(g || 'Autres requêtes')}</span><b>${qs.length}</b></button>`));
    if (q2.collapsed[g]) continue;
    for (const q of qs) {
      const r = eng.run(q), isFn = r.value instanceof PQE.MFn;
      list.appendChild(h(`<div class="q2-qi ${q.id === q2.cur ? 'on' : ''} ${named ? 'in' : ''}"><button class="q2-qs ${loadOf(q) ? '' : 'nl'}" data-q="qsel:${esc(q.id)}">${isFn ? QI.fn : I.tbl}<span>${esc(q.name).replace(/_/g, '_<wbr>')}</span>${r.error ? QI.warn : ''}</button><button class="q2-qm" data-q="qmenu:${esc(q.id)}" aria-label="Menu de ${esc(q.name)}">${QI.dots}</button></div>`));
    }
  }
  return box;
};

/* ───────── Menus (avec sous-menus) ───────── */
P_.q2menu = function (anchor, items, onPick) {
  this.menu(anchor, items.map(it => it === '-' || typeof it === 'string' ? it : [it[0], it[1] + (it[3] ? ' ›' : ''), it[2]]), (k, b) => {
    const it = items.find(x => Array.isArray(x) && x[0] === k);
    if (it && it[3]) { setTimeout(() => this.q2menu(anchor, it[3], onPick), 0); return; }
    onPick(k, b);
  }, { host: this.el });
};

window.PQ2 = { QI, disp, tyIcon, loadOf, setLoad };
})();

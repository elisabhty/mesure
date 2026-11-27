/* Mission 109 — Le rapport de Victoria */
(function () {
'use strict';
const { esc, fr, $, $$, clone } = window.PBQ;
const PBI = window.PBI;
const DS = 'vis_108_date_slicer', TS = 'vis_108_ticket_type_slicer';
const CARDS = ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_vente_moyenne', 'vis_105_entrees'];
const ANALYTIC = CARDS.concat(['vis_106_categories', 'vis_106_canaux', 'vis_106_detail_ventes', 'vis_107_attraction_bars', 'vis_107_daily_columns', 'vis_107_daily_stacked', DS, TS]);
const PAGES = ['page_001', 'page_002', 'page_003'];
/* Contrat géométrique (px, canevas 1280 × 720) */
const L = {
  vis_105_billets: [24, 260, 296, 112], vis_105_ventes_ttc: [336, 260, 296, 112], vis_105_vente_moyenne: [648, 260, 296, 112], vis_105_entrees: [960, 260, 296, 112],
  [DS]: [24, 128, 608, 80], [TS]: [648, 128, 608, 80], vis_106_categories: [24, 388, 608, 308], vis_106_canaux: [648, 388, 608, 308],
  vis_106_detail_ventes: [24, 152, 1232, 544], vis_107_attraction_bars: [24, 152, 608, 244], vis_107_daily_columns: [648, 152, 608, 244], vis_107_daily_stacked: [24, 412, 1232, 284]
};
const USER3 = [DS, TS, 'vis_106_categories', 'vis_106_canaux', 'vis_107_attraction_bars', 'vis_107_daily_columns', 'vis_107_daily_stacked'];
const BAND = [0, 0, 1280, 80], TITLE_G = [24, 16, 580, 48], NAV_G = [620, 18, 636, 44];
const TITLE = { page_001: 'Wonderland — Pilotage', page_002: 'Détail des ventes', page_003: 'Fréquentation des attractions' };
const NOTES = {
  note_109_extract: ['page_001', [24, 88, 1232, 28], 'Achats enregistrés du 1er au 5 juin 2026 · Extraction du 6 juin.'],
  note_109_commercial: ['page_001', [24, 220, 920, 32], 'Billetterie · Selon les filtres sélectionnés'],
  note_109_history: ['page_001', [960, 220, 296, 32], 'Historique 1–5 juin · Hors segments', '#344F66'],
  note_109_detail: ['page_002', [24, 88, 1232, 48], 'Transactions enregistrées du 1er au 5 juin. Les segments de Vue générale ne sont pas synchronisés.'],
  note_109_attractions: ['page_003', [24, 88, 1232, 48], 'Passages enregistrés du 1er au 5 juin. Il ne s’agit pas de visiteurs uniques.']
};
const NAVST = { normal: { bg: '#354C5D', fg: '#FFFFFF' }, hover: { bg: '#496174', fg: '#FFFFFF' }, selected: { bg: '#E4BD52', fg: '#243746' }, pressed: { bg: '#D4AC40', fg: '#243746' } };
const ALT = {
  vis_105_billets: 'Nombre de billets vendus correspondant aux filtres commerciaux.',
  vis_105_ventes_ttc: 'Montant TTC total des ventes correspondant aux filtres commerciaux.',
  vis_105_vente_moyenne: 'Montant TTC moyen par ligne de vente filtrée.',
  vis_105_entrees: 'Nombre d’entrées historiques du 1er au 5 juin, indépendant des segments commerciaux.',
  vis_106_categories: 'Quantités, montants TTC et montants moyens regroupés par catégorie de billet.',
  vis_106_canaux: 'Quantités, montants TTC et nombre de lignes de vente par canal.',
  vis_106_detail_ventes: 'Transactions individuelles avec dates, catégories, canaux, quantités et montants.',
  vis_107_attraction_bars: 'Nombre de passages historiques par attraction, trié du plus élevé au plus faible.',
  vis_107_daily_columns: 'Nombre de passages historiques par journée, du 1er au 5 juin.',
  vis_107_daily_stacked: 'Répartition des passages quotidiens entre les quatre attractions.',
  [DS]: 'Sélectionner une période de visite prévue dans la billetterie.',
  [TS]: 'Sélectionner une ou plusieurs catégories de billet.'
};
const ALT_BAD = { vis_105_billets: 'La carte affiche 40 billets.', vis_105_ventes_ttc: 'La carte affiche 1 310 € de ventes.', vis_105_vente_moyenne: 'La carte affiche 65,50 € par ligne.', vis_105_entrees: 'La carte affiche 27 entrées du week-end.', vis_106_categories: 'Adulte : 12 billets, 480 €.', vis_106_canaux: 'Le Web vend 20 billets.', vis_106_detail_ventes: 'Vingt transactions affichées.', vis_107_attraction_bars: 'Dragon : 18 passages.', vis_107_daily_columns: 'Quinze passages le 5 juin.', vis_107_daily_stacked: 'Cinquante passages au total.', [DS]: 'Du 06/06 au 07/06.', [TS]: 'Senior et Étudiant.' };
const NAMES = { vis_105_billets: 'Billets vendus', vis_105_ventes_ttc: 'Ventes TTC', vis_105_vente_moyenne: 'Montant moyen', vis_105_entrees: 'Entrées enregistrées', [DS]: 'Segment Période de visite prévue', [TS]: 'Segment Catégorie de billet', vis_106_categories: 'Tableau par catégorie', vis_106_canaux: 'Tableau par canal', vis_106_detail_ventes: 'Détail des ventes', vis_107_attraction_bars: 'Barres par attraction', vis_107_daily_columns: 'Colonnes quotidiennes', vis_107_daily_stacked: 'Colonnes empilées' };
const ALT_ORDER = [DS, TS].concat(CARDS, ['vis_106_categories', 'vis_106_canaux', 'vis_106_detail_ventes', 'vis_107_attraction_bars', 'vis_107_daily_columns', 'vis_107_daily_stacked']);
const TAB1 = ['title_109_page_001', 'nav_109_page_001', 'note_109_extract', DS, TS, 'note_109_commercial', 'vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_vente_moyenne', 'note_109_history', 'vis_105_entrees', 'vis_106_categories', 'vis_106_canaux'];
const DECO = ['text', 'shape', 'button', 'navigator'];
const KEYS = ['x', 'y', 'w', 'h'], KN = { x: 'X', y: 'Y', w: 'largeur', h: 'hauteur' };
const DARK = ['#243746', '#354C5D', '#52616D', '#1F1F1F'];
const up = c => String(c || '').toUpperCase();

/* ───────── État du projet ───────── */
const pageOf = (P, id) => P.pages.find(p => p.id === id);
const findV = (P, id) => { for (const p of P.pages) { const v = p.visuals.find(v => v.id === id); if (v) return [p, v]; } return [null, null]; };
const place = (P, id, t) => { const [pg, v] = findV(P, id); if (v) PBI.setPx(pg, v, { x: t[0], y: t[1], w: t[2], h: t[3] }); };
const toBack = (pg, v) => { pg.visuals = [v].concat(pg.visuals.filter(o => o !== v)); };
function canvas(P) {
  const pg = pageOf(P, 'page_001');
  if (pg.size && pg.size[1] !== 720) { const H0 = pg.size[1]; pg.visuals.forEach(v => { v.y = v.y * H0 / 720; v.h = v.h * H0 / 720; }); }
  pg.size = [1280, 720]; delete pg.slots;
  Object.assign(pg, { bg: '#F3F5F7', alpha: 0, fit: 'page' });
  P.viewOpts = { ...(P.viewOpts || {}), grid: true, snap: true };
}
function frontCards(P) { const pg = pageOf(P, 'page_001'), cs = CARDS.map(id => pg.visuals.find(v => v.id === id)).filter(Boolean); pg.visuals = pg.visuals.filter(v => !cs.includes(v)).concat(cs); }
const layoutCards = P => { frontCards(P); CARDS.forEach(id => place(P, id, L[id])); };
function layoutRest(P) { USER3.concat('vis_106_detail_ventes').forEach(id => place(P, id, L[id])); const [, ts] = findV(P, TS); if (ts) ts.mode = 'dropdown'; }
const theme = P => { P.theme = clone(PBI.THEMES.wonderland); };
const deco = (id, type, extra) => ({ id, type, x: 0, y: 0, w: 10, h: 10, f: { values: [], axis: [], legend: [], cols: [] }, title: null, fmt: {}, temp: false, ...extra });
function headers(P) {
  for (const pid of PAGES) {
    const pg = pageOf(P, pid);
    let s = pg.visuals.find(v => v.id === 'shape_109_' + pid);
    if (!s) { s = deco('shape_109_' + pid, 'shape', { shape: 'rect', fmt: { fill: '#243746', outline: false } }); pg.visuals.push(s); }
    PBI.setPx(pg, s, { x: 0, y: 0, w: 1280, h: 80 }); toBack(pg, s);
    let t = pg.visuals.find(v => v.id === 'title_109_' + pid);
    if (!t) { t = deco('title_109_' + pid, 'text', { text: TITLE[pid], fmt: { size: 24, color: '#FFFFFF', bold: true } }); pg.visuals.push(t); }
    PBI.setPx(pg, t, { x: TITLE_G[0], y: TITLE_G[1], w: TITLE_G[2], h: TITLE_G[3] });
  }
  for (const [id, [pid, g, text, color]] of Object.entries(NOTES)) {
    const pg = pageOf(P, pid);
    let n = pg.visuals.find(v => v.id === id);
    if (!n) { n = deco(id, 'text', { text, fmt: { size: 11, color: color || '#52616D' } }); pg.visuals.push(n); }
    PBI.setPx(pg, n, { x: g[0], y: g[1], w: g[2], h: g[3] });
  }
  const [, e] = findV(P, 'vis_105_entrees'); if (e) e.fmt.bg = '#E9EFF4';
}
function navs(P) {
  for (const pid of PAGES) {
    const pg = pageOf(P, pid);
    let n = pg.visuals.find(v => v.id === 'nav_109_' + pid);
    if (!n) { n = deco('nav_109_' + pid, 'navigator', { fmt: {} }); pg.visuals.push(n); }
    n.fmt.states = clone(NAVST); PBI.setPx(pg, n, { x: NAV_G[0], y: NAV_G[1], w: NAV_G[2], h: NAV_G[3] });
  }
}
function access(P) {
  ANALYTIC.forEach(id => { const [, v] = findV(P, id); if (v) v.alt = ALT[id]; });
  for (const pid of PAGES) {
    const pg = pageOf(P, pid);
    pg.tabSkip = ['shape_109_' + pid];
    pg.tabOrder = pid === 'page_001' ? TAB1.slice() : ['title_109_' + pid, 'nav_109_' + pid].concat(pg.visuals.filter(v => !/^(shape|title|nav)_109_/.test(v.id)).map(v => v.id));
  }
}

/* ───────── Aides de guidage ───────── */
const near = (g, t, tol = 1) => !!g && !!t && KEYS.every((k, i) => Math.abs(g[k] - t[i]) <= tol);
const gx = (x, id) => { const [pg, v] = findV(x.pbi.P, id); return v ? PBI.px(pg, v) : null; };
const atT = (x, id) => near(gx(x, id), L[id]);
const overlap = (a, b) => a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
const later = fn => () => { setTimeout(fn, 0); };
const count = (P, ids) => ids.filter(id => findV(P, id)[1]).length;
const clearSel = pbi => Object.assign(pbi.st, { selVis: null, xsel: null, multi: [], multiMode: false, editInter: false, tabBuild: null, navState: null });
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
/* Sélectionner un objet : directement sur le canevas, ou par le volet Sélection s'il est hors cadre ou s'il s'agit d'un navigateur */
function selectGuide(x, id) {
  const pbi = x.pbi, st = pbi.st, [pg, v] = findV(pbi.P, id);
  if (pbi.P.activePage !== pg.id) return `[data-a="ptab:${pg.id}"]`;
  const g = PBI.px(pg, v), hidden = g.y > 640 || g.x > 1220 || g.y + g.h < 12;
  if (hidden || v.type === 'navigator' || st.pane === 'Sélection') {
    if (st.pane !== 'Sélection') return st.tab !== 'Affichage' ? '[data-a="tab:Affichage"]' : '[data-a="cmd:selpane"]';
    if ((st.spTab || 'layers') !== 'layers') return '[data-a="sptab:layers"]';
    return `.sp [data-a="vis:${id}"]`;
  }
  return `[data-a="vis:${id}"]`;
}
/* Puis le champ de Taille et position (en sélection multiple si les objets partagent la même valeur cible) */
function geoGuide(x, id, k, T) {
  const pbi = x.pbi, st = pbi.st, [pg, v] = findV(pbi.P, id);
  if (pbi.P.activePage !== pg.id) return `[data-a="ptab:${pg.id}"]`;
  const multi = st.multiMode ? (st.multi || []).filter(i => pg.visuals.some(o => o.id === i)) : [];
  if (multi.length > 1) {
    const ki = KEYS.indexOf(k), same = multi.includes(id) && multi.every(i => T(i) && T(i)[ki] === T(id)[ki]);
    if (!same) return st.tab !== 'Format' ? '[data-a="tab:Format"]' : '[data-a="cmd:multisel"]';
    return st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : `[data-geo="${k}"]`;
  }
  if (st.selVis !== id) return selectGuide(x, id);
  if (st.pane !== 'Visualisations') return '[data-a="pane:Visualisations"]';
  if (!DECO.includes(v.type) && st.vzTab !== 'format') return '[data-a="vztab:format"]';
  return `[data-geo="${k}"]`;
}
/* Un objet sélectionné, puis une option de son volet Format */
function fmtGuide(x, id, s) {
  const pbi = x.pbi, st = pbi.st, [, v] = findV(pbi.P, id);
  if (st.selVis !== id || (st.multiMode && (st.multi || []).length > 1)) return st.multiMode && (st.multi || []).length > 1 ? (st.tab !== 'Format' ? '[data-a="tab:Format"]' : '[data-a="cmd:multisel"]') : selectGuide(x, id);
  if (st.pane !== 'Visualisations') return '[data-a="pane:Visualisations"]';
  if (!DECO.includes(v.type) && st.vzTab !== 'format') return '[data-a="vztab:format"]';
  return s;
}
/* Valeurs saisies dans Taille et position : refusées si elles s'écartent du plan, avec l'erreur la plus précise */
function geoRule(x, ids, key, value, T, ctx, other) {
  const ki = KEYS.indexOf(key); if (ki < 0) return;
  for (const id of ids) {
    const t = T(id);
    if (!t) return x.oops('', other || 'Concentre-toi sur les objets demandés.');
    if (Math.abs(value - t[ki]) <= 1) continue;
    const [pg, v] = findV(x.pbi.P, id), g = { ...PBI.px(pg, v), [key]: value };
    const lab = ctx ? ctx(id, g, key, value) : null;
    if (lab) return x.oops(...[].concat(lab));
    if (ids.length > 1 && ids.some(o => T(o) && Math.abs(T(o)[ki] - value) <= 1)) return x.oops('', 'Ces objets n’ont pas la même valeur cible : règle-les un par un.');
    if (g.x < 0 || g.y < 0 || g.x + g.w > 1280 || g.y + g.h > 720) return x.oops('', 'Garde l’objet à l’intérieur du canevas de 1280 × 720.');
    return x.oops('', `${NAMES[id] || { shape: 'Bandeau', navigator: 'Navigateur', text: 'Titre' }[v.type] || PBI.vname(v)} : ${KN[key]} ${t[ki]} px.`);
  }
}
const commonErr = x => ({
  'well.agg': () => x.oops('', 'Nous travaillons sur la présentation, pas sur les calculs.'), 'well.add': () => x.oops('', 'Les champs des visuels restent identiques.'), 'well.remove': () => x.oops('', 'Les champs des visuels restent identiques.'),
  'well.hier': () => x.oops('', 'Les champs des visuels restent identiques.'), 'well.move': () => x.oops('', 'Les champs des visuels restent identiques.'), 'well.rename': () => x.oops('', 'Les champs des visuels restent identiques.'),
  'vis.sort': () => x.oops('', 'Le tri reste celui des missions précédentes.'), 'table.sort': () => x.oops('', 'Le tri reste celui des missions précédentes.'),
  'vis.delete': p => ANALYTIC.includes(p.vis) || /_109_/.test(p.vis) ? x.oops('', 'Garde cet objet : il fait partie du rapport.') : undefined,
  'viz.type': () => x.oops('', 'Garde le type de chaque visuel.'), 'filter.add': () => x.oops('', 'Aucun filtre n’est nécessaire ici.'),
  'filter.set': p => p.restrictive ? x.oops('', 'Aucun filtre n’est nécessaire ici.') : undefined,
  'interaction.set': () => x.oops('', 'Les interactions de la mission 108 restent en place.'), slicer: () => {}, 'page.del': () => x.oops('', 'Les trois pages restent en place.'),
  'page.renameStart': () => x.oops('', 'Les noms des pages restent les mêmes.'), 'page.dup': () => x.oops('', 'Les trois pages existantes suffisent.'),
  'page.fmt': () => x.oops('', 'Le canevas est déjà réglé.'), 'theme.set': () => x.oops('', 'Le thème Wonderland — Direction est déjà appliqué.'),
  'view.opt': () => {}, 'multi.mode': () => {}, 'clip.copy': () => {}, 'tab.start': () => {}, 'interaction.mode': () => {}, 'chart.point': () => {}, 'nav.page': () => {}, 'vis.order': () => {}, 'vis.align': () => {},
  'vis.geo': () => x.oops('', 'La mise en page est déjà validée.'), 'vis.alt': () => {}, 'tab.pick': () => {}, 'tab.order': () => {}, 'tab.skip': () => {},
  'viz.create': () => x.oops('', 'Aucun nouvel objet n’est nécessaire ici.'), 'clip.paste': () => x.oops('', 'Aucun nouvel objet n’est nécessaire ici.'), 'button.kind': () => x.oops('', 'Aucun nouvel objet n’est nécessaire ici.'),
  cmd: c => ['newmeasure', 'newcol', 'relations', 'newtable'].includes(c) ? x.oops('', 'Aucune formule ni relation : nous travaillons sur la présentation.') : c === 'newpage' ? x.oops('', 'Les trois pages existantes suffisent.') : ['transform', 'get', 'excel', 'enter'].includes(c) ? x.oops('', 'Les données ne changent pas dans cette mission.') : undefined
});
const G = (x, keep, extra) => K.guard(x, keep, Object.assign(commonErr(x), extra));

const def = {
  id: 109,
  objectifs: ['Configurer le canevas, aligner et distribuer les visuels', 'Appliquer un thème, des en-têtes et une navigation', 'Rendre le rapport accessible sans changer ses résultats'],
  intro: [
    { bg: 'bureau', n: 'Samedi 6 juin, 8 h 30. Victoria ouvre une enveloppe aux couleurs du parc : l’invitation à la prochaine réunion de direction.' },
    { p: 'victoria', t: 'La présentation approche. Nous devons montrer que Wonderland dispose enfin d’un véritable système de pilotage.' },
    { n: 'Elle ouvre le rapport. Les cartes, puis les tableaux… et les segments, tout en bas de la page. Pour choisir une période, il faut faire défiler.' },
    { p: 'victoria', t: 'Toutes les informations sont là. Pourtant, je ne sais pas toujours où regarder en premier.' },
    { clear: 1, bg: 'conseil', n: 'Salle de réunion. Victoria filtre les visites prévues du week-end. La carte Billets vendus affiche neuf, la carte Entrées enregistrées toujours vingt-sept.' },
    { p: 'lola', t: 'Pourquoi vingt-sept entrées, alors que seulement neuf billets apparaissent ?' },
    { p: 'gabriel', t: 'Les entrées concernent les cinq journées passées. Les neuf billets, les visites prévues samedi et dimanche.' },
    { p: 'victoria', t: 'Je comprends la différence. Mais quelqu’un qui découvre le rapport pourrait facilement se tromper.' },
    { n: 'La qualité d’un rapport ne tient pas qu’à l’exactitude de ses chiffres. Elle dépend aussi de la façon dont ils sont présentés.' },
    { clear: 1, bg: 'studio', card: { k: 'Cahier des charges de Victoria', h: 'Un rapport utilisable sans formation', ul: ['Les indicateurs importants immédiatement visibles', 'Des filtres faciles à retrouver', 'Des couleurs cohérentes sur toutes les pages', 'L’historique clairement distingué des visites prévues', 'Une navigation simple et accessible'] } },
    { p: 'pixel', t: 'On garde toutes les données et tous les calculs. Notre travail porte sur la présentation et l’expérience des lecteurs.' },
    { btn: 'Commencer la refonte' }
  ],
  leconTitre: 'Concevoir un rapport professionnel',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Du rapport fonctionnel au rapport bien conçu', `
      <div class="flow h5"><div class="flow-box on"><b>Orientation</b><small>Comprendre le rapport et la page consultée.</small></div>
      <div class="flow-box on"><b>Périmètre</b><small>Identifier la période, les filtres et les données disponibles.</small></div>
      <div class="flow-box on hot"><b>Indicateurs</b><small>Lire les résultats principaux.</small></div>
      <div class="flow-box on"><b>Explication</b><small>Consulter les tableaux et graphiques détaillés.</small></div>
      <div class="flow-box on"><b>Exploration</b><small>Naviguer et approfondir les résultats.</small></div></div>
      <div data-sec="2" style="display:none"><div class="lc-k" style="margin-top:16px">Expérience · Organiser les cartes</div>
        <div class="seg" data-g="a"><button data-v="0" class="on">Désordonné</button><button data-v="1">Aligné</button><button data-v="2">Distribué</button></div><div data-o="a"></div></div>
      <div data-sec="3" style="display:none"><div class="lc-k" style="margin-top:16px">Charte Wonderland — Direction</div><div class="charte" data-o="c"></div></div>
      <div data-sec="4" style="display:none"><div class="lc-k" style="margin-top:16px">Expérience · Le contraste du texte</div>
        <div class="seg" data-g="k"><button data-v="0" class="on">Faible contraste</button><button data-v="1">Contraste renforcé</button></div><div data-o="k"></div></div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    const show = k => { $(`[data-sec="${k}"]`, card).style.display = ''; requestAnimationFrame(() => sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' })); };
    const toggle = (g, m) => $$(`[data-g="${g}"] button`, card).forEach(b => b.classList.toggle('on', b.dataset.v === m));
    const POS = { 0: [[3, 22, 25, 46], [31, 9, 19, 64], [55, 30, 24, 44], [82, 14, 15, 52]], 1: [[3, 18, 21, 62], [27, 18, 21, 62], [53, 18, 21, 62], [76, 18, 21, 62]], 2: [[3, 18, 21, 62], [27.67, 18, 21, 62], [52.33, 18, 21, 62], [77, 18, 21, 62]] };
    const NOTE = { 0: 'Les cartes ne partagent ni la même taille ni la même position verticale.', 1: 'Même taille, même position Y : les cartes sont alignées en haut. Les espaces restent inégaux.', 2: 'Des espaces égaux entre les cartes : elles sont distribuées.' };
    $('[data-o="a"]', card).innerHTML = `<div class="al-box">${['40', '1 310 €', '65,50 €', '27'].map(t => `<i>${esc(t)}</i>`).join('')}</div><p class="lc-note"></p>`;
    const drawA = m => { toggle('a', m); $$('.al-box i', card).forEach((el, i) => { const p = POS[m][i]; Object.assign(el.style, { left: p[0] + '%', top: p[1] + '%', width: p[2] + '%', height: p[3] + '%' }); }); $('[data-o="a"] .lc-note', card).textContent = fr(NOTE[m]); };
    $('[data-o="c"]', card).innerHTML = [['#243746', 'Bleu nuit', 'En-têtes'], ['#C8A12B', 'Or Wonderland', 'Accents et graphiques'], ['#F3F5F7', 'Gris clair', 'Canevas'], ['#FFFFFF', 'Blanc', 'Surfaces'], ['#52616D', 'Gris ardoise', 'Texte secondaire'], ['#E9EFF4', 'Bleu brume', 'Historique']].map(c => `<div><i style="background:${c[0]}; box-shadow:inset 0 0 0 1px rgba(36,55,70,.14)"></i><b>${esc(c[1])}</b><span>${esc(c[2])}</span><small>${c[0]}</small></div>`).join('') + `<p class="lc-note">${esc(fr('L’or reste une couleur d’identité, mais jamais la couleur principale des petits textes sur fond blanc.'))}</p>`;
    const drawK = m => { toggle('k', m); $('[data-o="k"]', card).innerHTML = `<div class="ctr-demo" style="background:${m === '1' ? '#E9EFF4' : '#FFFFFF'}; color:${m === '1' ? '#243746' : '#C8A12B'}"><small>Entrées historiques</small><b>27</b><span>${esc(fr('Du 1er au 5 juin 2026'))}</span></div><p class="lc-note">${esc(fr(m === '1' ? 'Bleu nuit sur bleu brume : un contraste d’environ 11:1. Les textes se détachent nettement de leur fond.' : 'Or sur blanc : 2,45:1, bien en dessous de l’objectif de 4,5:1 pour un texte courant.'))}</p>`; };
    $$('[data-g] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.' + b.parentElement.dataset.g, b.dataset.v)));
    await x.pixel('Un rapport fonctionnel donne les bonnes informations. Un rapport bien conçu permet aussi de les trouver vite et de les comprendre.');
    await x.pixel('Une page de direction se lit de haut en bas : où suis-je, quel périmètre, quels résultats, puis le détail.');
    show(2); drawA('0');
    await x.pixel('Aligner, c’est placer des objets sur un même axe. Distribuer, c’est répartir régulièrement les espaces entre eux.');
    x.todo('Aligne, puis distribue les quatre cartes.');
    x.target($$('[data-g="a"] button', card).slice(1));
    const seen = new Set();
    await x.wait({ 'lab.k': () => {}, 'lab.a': m => { drawA(m); seen.add(m); if (seen.has('1') && seen.has('2')) return true; } });
    x.untarget();
    await K.jeu(x, { app: 'jeu109', title: 'Aligner ou distribuer ?', btn: 'Vérifier', todo: 'Pour chaque retouche, choisis : aligner ou distribuer.',
      options: [['al', 'Aligner'], ['di', 'Distribuer']],
      rows: [['a', 'Mettre le haut des quatre cartes à la même hauteur', 'al', 'Un même axe pour tous les objets : c’est aligner.'], ['b', 'Laisser le même écart entre chaque carte', 'di', 'Des espaces réguliers entre les objets : c’est distribuer.'], ['c', 'Faire commencer deux tableaux au même bord gauche', 'al', 'Un bord commun : c’est aligner.'], ['d', 'Répartir trois visuels régulièrement sur la largeur de la page', 'di', 'Des écarts égaux sur la largeur : c’est distribuer.']] });
    await x.ok('Aligner place sur un axe, distribuer égalise les espaces.');
    x.app('lecon');
    await x.pixel('Dans Power BI, chaque objet a quatre propriétés : X, Y, largeur et hauteur, en pixels. Les modifier ne change jamais ses données.');
    show(3);
    await x.pixel('Un thème applique des règles communes à tout le rapport : couleurs, textes, arrière-plans. Une mise en forme posée directement sur un visuel reste prioritaire.');
    show(4); drawK('0');
    await x.pixel('Un rapport accessible se lit au clavier, avec un lecteur d’écran, ou quand on distingue mal certaines couleurs.');
    x.todo('Compare les deux contrastes.');
    x.target($('[data-g="k"] [data-v="1"]', card));
    await x.wait({ 'lab.a': m => { drawA(m); }, 'lab.k': m => { drawK(m); if (m === '1') return true; } });
    x.untarget();
    await x.pixel('Objectif du projet : au moins 4,5:1 pour les textes courants. Et jamais une information portée par la seule couleur.');
  },

  exs: [
    /* 1 — Un nouveau cadre pour le rapport */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st;
      K.ready(x, 'page_001'); clearSel(pbi); st.pane = 'Visualisations'; pbi.render();
      await x.say('victoria', 'J’aimerais présenter le rapport sans devoir faire défiler la page.');
      await x.pixel('À la mission précédente, nous avions agrandi Vue générale à 1280 × 880. Passons à un format adapté à un écran de direction.');
      const pg = () => K.pageOf(x, 'page_001'), vo = () => P().viewOpts || {};
      const size = p => p.size || [1280, 720];
      const ok = () => { const p = pg(), s = size(p); return s[0] === 1280 && s[1] === 720 && up(p.bg) === '#F3F5F7' && !p.alpha && (p.fit || 'page') === 'page' && vo().grid && vo().snap && count(P(), ANALYTIC) === 12; };
      const pageG = s => P().activePage !== 'page_001' ? '[data-a="ptab:page_001"]' : st.selVis ? '[data-a="canvas"]' : st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : s;
      const next = () => {
        const p = pg(), s = size(p);
        if (s[0] !== 1280 || s[1] !== 720) { x.todo('Touche une zone vide du canevas, puis choisis le format 16:9, 1280 × 720.'); x.guide(pageG(['[data-a="pgsel:size"]', '.menu [data-k="169"]'])); return; }
        if (up(p.bg) !== '#F3F5F7') { x.todo('Arrière-plan de la page : Gris clair, #F3F5F7.'); x.guide(pageG(['[data-a="pgsel:bg"]', '.menu [data-c="#F3F5F7"]'])); return; }
        if (p.alpha) { x.todo('Remets la transparence de l’arrière-plan à 0 %.'); x.guide(pageG(['[data-a="pgsel:alpha"]', '.menu [data-k="0"]'])); return; }
        if ((p.fit || 'page') !== 'page') { x.todo('Affichage de la page : Ajuster à la page.'); x.guide(pageG(['[data-a="pgsel:fit"]', '.menu [data-k="page"]'])); return; }
        if (!vo().grid) { x.todo('Dans le ruban Affichage, active le quadrillage.'); x.guide(st.tab !== 'Affichage' ? '[data-a="tab:Affichage"]' : '[data-a="cmd:grid"]'); return; }
        x.todo('Active aussi Aligner sur la grille.'); x.guide(st.tab !== 'Affichage' ? '[data-a="tab:Affichage"]' : '[data-a="cmd:snap"]');
      };
      next();
      await x.wait(G(x, ANALYTIC, {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next), tab: later(next),
        cmd: c => c === 'mobile' ? x.oops('Modification de la taille de la fenêtre Power BI') : ['transform', 'get', 'excel', 'refresh', 'enter'].includes(c) ? x.oops('Modification de la taille d’un fichier source') : c === 'newpage' ? x.oops('Création d’une quatrième page') : commonErr(x).cmd(c),
        'vis.delete': p => p.vis === DS || p.vis === TS ? x.oops('Suppression des segments qui dépassent') : x.oops('', 'Garde tous les visuels : seul le canevas change.'),
        'page.fmt': ({ page, key, value }) => {
          if (page !== 'page_001') return x.oops('', 'Les deux autres pages sont déjà en 1280 × 720 : commence par Vue générale.');
          if (key === 'size' && value[0] === 960) return x.oops('Format 4:3 sélectionné');
          if (key === 'size' && value[1] === 880) return x.oops('Canevas 1280 × 880 conservé');
          if (key === 'size' && (value[0] !== 1280 || value[1] !== 720)) return x.oops('', 'Victoria présente sur un écran large : 16:9.');
          if (key === 'bg' && DARK.includes(up(value))) return x.oops('Arrière-plan trop sombre');
          if (key === 'bg' && up(value) !== '#F3F5F7') return x.oops('', 'La charte prévoit le gris clair #F3F5F7 pour le canevas.');
          if (key === 'alpha' && value === 100) return x.oops('Transparence de l’arrière-plan à 100 %');
          if (key === 'alpha' && value) return x.oops('', 'La couleur de fond doit rester pleinement visible : 0 %.');
          if (key === 'fit' && value !== 'page') return x.oops('', 'Pour une présentation, choisis Ajuster à la page.');
        },
        'vis.geo': () => x.oops('', 'Nous déplacerons les visuels juste après. Pour l’instant, règle le canevas.'),
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide();
      await x.ok('Canevas 16:9, fond gris clair, quadrillage actif. Les segments sortent du cadre en bas : on les replacera bientôt.');
      await x.ask('Et les pages Détail des ventes et Attractions ?', [{ t: 'Elles sont déjà en 1280 × 720 : rien à changer', ok: true }, { t: 'Il faut les passer en 1280 × 880', err: 'Canevas 1280 × 880 conservé' }]);
    }, avance: P => canvas(P) },

    /* 2 — Des indicateurs parfaitement alignés */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); clearSel(pbi); frontCards(P()); pbi.render();
      await x.say('gabriel', 'Je voudrais voir les principaux indicateurs ensemble, sur une seule ligne.');
      await x.pixel('Créons une grille régulière : billets, ventes, montant moyen, puis entrées. Les trois indicateurs commerciaux restent côte à côte.');
      await x.pixel('Astuce : Format › Sélection multiple permet de régler la taille et la position Y des quatre cartes en une seule fois.');
      const T = id => CARDS.includes(id) ? L[id] : null;
      const ok = () => CARDS.every(id => atT(x, id));
      const next = () => {
        for (const k of ['w', 'h', 'y', 'x']) {
          const ki = KEYS.indexOf(k), id = CARDS.find(c => Math.abs(gx(x, c)[k] - L[c][ki]) > 1);
          if (!id) continue;
          x.todo(k === 'w' || k === 'h' ? 'Donne aux quatre cartes la même taille : 296 × 112 px.' : k === 'y' ? 'Place les quatre cartes sur la même ligne : Y = 260.' : 'Positions X : billets 24, ventes 336, montant moyen 648, entrées 960.');
          x.guide(geoGuide(x, id, k, T)); return;
        }
      };
      next();
      const ctx = (id, g, key, value) => {
        if (key === 'w' || key === 'h') return 'Quatre cartes de tailles différentes';
        if (g.x < 0 || g.y < 0 || g.x + g.w > 1280 || g.y + g.h > 720) return 'Carte positionnée hors du canevas';
        if (key === 'x') {
          if ((id === 'vis_105_vente_moyenne' && value > 900) || (id === 'vis_105_entrees' && value > 600 && value < 900)) return 'Montant moyen placé après les entrées';
          const pg = K.pageOf(x, 'page_001');
          if (CARDS.some(o => o !== id && overlap(g, PBI.px(pg, K.visOf(x, o))))) return 'Deux cartes superposées';
          return 'Espacement irrégulier';
        }
        return null;
      };
      await x.wait(G(x, [], {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next), tab: later(next), 'multi.mode': later(next),
        'well.agg': () => x.oops('Modification de la moyenne en somme'),
        'viz.create': () => x.oops('Création de nouvelles cartes'), 'clip.paste': () => x.oops('Création de nouvelles cartes'),
        'vis.align': ({ ids, how, few }) => {
          if (few) return x.oops('', 'Sélectionne d’abord plusieurs cartes : Format › Sélection multiple.');
          if (!ids.every(id => CARDS.includes(id))) return x.oops('', 'Concentre-toi sur les quatre cartes.');
          if (how === 'left' || how === 'vdist') return x.oops('Cartes alignées verticalement');
          if (how === 'hdist') { const order = ids.slice().sort((a, b) => gx(x, a).x - gx(x, b).x), want = CARDS.filter(c => ids.includes(c)); if (order.join() !== want.join()) return x.oops('Montant moyen placé après les entrées'); }
        },
        'vis.geo': ({ ids, key, value }) => geoRule(x, ids, key, value, T, ctx, 'Concentre-toi sur les quatre cartes.'),
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide(); clearSel(pbi); pbi.render();
      await x.ok('Quatre cartes de 296 × 112 px, 16 px d’écart entre chacune : une ligne parfaitement régulière.');
    }, avance: P => layoutCards(P) },

    /* 3 — Remettre chaque information à sa place */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st;
      K.ready(x, 'page_001'); clearSel(pbi); pbi.render();
      await x.say('lola', 'Je préférerais choisir mes filtres avant de consulter les résultats.');
      await x.pixel('C’est la logique à adopter : sélectionner, observer, puis approfondir. Les segments montent au-dessus des cartes.');
      await x.pixel('Ils sont sortis du cadre : tu les retrouveras dans Affichage › Volet Sélection.');
      const T = id => L[id] || null;
      const ts = () => K.visOf(x, TS);
      const STEPS = [
        ...[DS, TS].map(id => [() => atT(x, id), id]),
        [() => ts().mode === 'dropdown', 'dd'],
        ...USER3.slice(2).map(id => [() => atT(x, id), id])
      ];
      const ok = () => STEPS.every(s => s[0]());
      const next = () => {
        const s = STEPS.find(s => !s[0]()); if (!s) return;
        if (s[1] === 'dd') { x.todo('Passe ce segment en liste déroulante : à 80 px, la liste ne tient plus.'); x.guide(fmtGuide(x, TS, ['[data-a="fmtsel:mode"]', '.menu [data-k="dropdown"]'])); return; }
        const id = s[1], g = gx(x, id), t = L[id], k = KEYS.find((k, i) => Math.abs(g[k] - t[i]) > 1);
        x.todo(`${NAMES[id]} : X ${t[0]}, Y ${t[1]}, ${t[2]} × ${t[3]} px.`); x.guide(geoGuide(x, id, k, T));
      };
      next();
      const ctx = (id, g, key, value) => {
        if ((id === DS || id === TS) && key === 'y' && value > 560) return 'Segments conservés en bas de page';
        if (id === 'vis_107_daily_stacked' && key === 'w' && value < 1000) return 'Graphique empilé trop étroit';
        if (CARDS.includes(id)) return ['', 'Les cartes sont déjà en place : laisse-les telles quelles.'];
        const [pg] = findV(P(), id);
        if (pg.id === 'page_001' && CARDS.some(c => overlap(g, PBI.px(pg, K.visOf(x, c))))) return 'Objet recouvrant une carte';
        return null;
      };
      await x.wait(G(x, [], {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next), tab: later(next), 'multi.mode': later(next),
        cmd: c => c === 'syncslicers' ? x.oops('Synchronisation automatique sur les trois pages') : commonErr(x).cmd(c),
        'well.add': p => p.vis === DS ? x.oops('Segment de dates transformé en date d’achat') : x.oops('', 'Les champs des visuels restent identiques.'),
        'well.remove': p => p.vis === 'vis_106_detail_ventes' ? x.oops('Tableau détaillé amputé de certaines colonnes') : x.oops('', 'Les champs des visuels restent identiques.'),
        'viz.fmt': p => {
          if (p.vis === TS && p.key === 'single' && p.value) return x.oops('Segment de catégories limité à une sélection unique');
          if (p.vis === TS && p.key === 'mode') return p.value === 'dropdown' ? undefined : x.oops('', 'Choisis la liste déroulante, plus compacte.');
          if (p.vis === DS && p.key === 'mode') return x.oops('', 'Le segment de dates reste en mode Entre.');
          return x.oops('', 'Ici, on déplace les objets sans changer leur mise en forme.');
        },
        'vis.sort': () => x.oops('Modification du tri des graphiques'), 'table.sort': () => x.oops('Modification du tri des graphiques'),
        'vis.geo': ({ ids, key, value }) => geoRule(x, ids, key, value, T, ctx),
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide(); clearSel(pbi); st.pane = 'Visualisations';
      place(P(), 'vis_106_detail_ventes', L.vis_106_detail_ventes); P().activePage = 'page_001'; pbi.render();
      await x.ok('Filtres en haut, indicateurs au milieu, détail en bas. J’ai aussi calé le tableau détaillé de la page 2 sur la même grille : 24, 152, 1232 × 544.');
    }, avance: P => layoutRest(P) },

    /* 4 — L'identité visuelle de Wonderland */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st;
      K.ready(x, 'page_001'); clearSel(pbi); pbi.render();
      await x.say('victoria', 'C’est déjà beaucoup plus clair. Mais les écrans ne semblent pas encore appartenir au même rapport.');
      await x.say('lola', 'Voici notre charte officielle. Je voudrais que tout le rapport adopte cette identité.');
      const card = K.lesson('Thème Wonderland — Direction', 'Les règles communes', `<table class="tbl wrap" style="width:100%"><tbody>${[['Arrière-plan du canevas', '#F3F5F7'], ['Surfaces des visuels', '#FFFFFF'], ['Texte principal', '#243746'], ['Texte secondaire', '#52616D'], ['Couleur d’accent', '#C8A12B'], ['Surface historique', '#E9EFF4'], ['Police', 'Segoe UI'], ['Titre de page', '24 pt'], ['Valeur d’une carte', '28 pt'], ['Titre d’un visuel', '14 pt'], ['Texte contextuel', '11 pt']].map(r => `<tr><td>${esc(r[0])}</td><td class="r">${esc(r[1])}</td></tr>`).join('')}</tbody></table><p class="lc-note">${esc(fr('Les couleurs des attractions, fixées à la mission 107, restent associées aux mêmes séries.'))}</p>`);
      x.app('theme', card);
      await x.pixel('Le thème regroupe ces règles. Une fois appliqué, il vaut pour les trois pages.');
      x.app('pbi');
      let seen3 = false;
      const themed = () => !!P().theme && P().theme.id === 'wonderland';
      const next = () => {
        if (!themed()) { x.todo('Affichage › Thèmes : applique Wonderland — Direction.'); x.guide(st.tab !== 'Affichage' ? '[data-a="tab:Affichage"]' : ['[data-a="cmd:themes"]', '.menu [data-k="wonderland"]']); return; }
        x.todo('Vérifie les graphiques de la page Attractions.'); x.guide('[data-a="ptab:page_003"]');
      };
      next();
      await x.wait(G(x, [], {
        pane: later(next), canvas: later(next), visual: later(next), tab: later(next),
        page: id => { if (id === 'page_003' && themed()) { seen3 = true; setTimeout(() => PBQ.act('ok.state'), 0); } else setTimeout(next, 0); },
        'ok.state': () => themed() && seen3 ? true : undefined,
        cmd: c => c === 'transform' ? x.oops('Conversion des montants en texte') : commonErr(x).cmd(c),
        'page.fmt': () => x.oops('Thème différent sur chaque page'),
        'theme.set': ({ id }) => id === 'soleil' ? x.oops('Petits textes dorés sur fond blanc') : id === 'neige' ? x.oops('Texte blanc sur fond blanc') : id !== 'wonderland' ? x.oops('', 'Applique la charte Wonderland — Direction : fond clair et textes foncés.') : undefined,
        'viz.fmt': p => p.key === 'colors' ? x.oops('Changement des couleurs attribuées aux attractions') : p.key === 'labels' && !p.value ? x.oops('Disparition des étiquettes de données après application du thème') : x.oops('', 'Le thème suffit : pas de réglage individuel ici.'),
        'viz.change': () => { if (themed() && seen3) return true; next(); }
      }));
      x.guide();
      await x.ask('Après le thème, que sont devenues les couleurs des attractions ?', [{ t: 'Elles sont conservées : la mise en forme de la mission 107 reste prioritaire', ok: true }, { t: 'Il faut les réinitialiser pour suivre le thème', err: 'Changement des couleurs attribuées aux attractions' }]);
      await x.ask('Et les étiquettes de données des graphiques ?', [{ t: 'Le thème les a retirées', err: 'Disparition des étiquettes de données après application du thème' }, { t: 'Toujours visibles, avec leurs formats', ok: true }]);
      await x.ask('Que garantit la typographie du thème ?', [{ t: 'Une police différente pour chaque type de visuel', err: 'Quatre polices différentes' }, { t: 'Une seule famille, Segoe UI, et des titres plus grands que les mentions secondaires', ok: true }, { t: 'Des mentions secondaires plus grandes que les titres', err: 'Titres moins visibles que les informations secondaires' }]);
      P().activePage = 'page_001'; pbi.render();
      await x.ok('Une seule identité pour les trois pages : fond gris clair, surfaces blanches, textes bleu nuit, accents dorés.');
    }, avance: P => theme(P) },

    /* 5 — Les chiffres ont besoin d'un contexte */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st, norm = K.norm;
      K.ready(x, 'page_001'); clearSel(pbi); pbi.render();
      const ds = K.visOf(x, DS), keep = ds.sel; ds.sel = { kind: 'range', min: '2026-06-06', max: '2026-06-07' }; pbi.render();
      await x.say('victoria', 'Regarde : neuf billets à côté de vingt-sept entrées. Le conseil pourrait croire qu’ils concernent la même période.');
      ds.sel = keep; pbi.render();
      await x.pixel('Ajoutons du contexte directement dans le rapport : un bandeau, un titre par page, et des mentions de périmètre.');
      const pg = pid => K.pageOf(x, pid);
      const shapeOn = pid => pg(pid).visuals.find(v => v.type === 'shape');
      const texts = pid => pg(pid).visuals.filter(v => v.type === 'text');
      const titleOn = pid => texts(pid).find(v => norm(v.text || '') === norm(TITLE[pid]));
      const titleBox = () => titleOn('page_001') || texts('page_001').find(v => v.temp && !/historique|billetterie/.test(norm(v.text || '')));
      const geoOf = (pid, v) => PBI.px(pg(pid), v);
      const bandGeo = pid => { const s = shapeOn(pid); return !!s && near(geoOf(pid, s), BAND); };
      const bandStyle = pid => { const s = shapeOn(pid); return !!s && up(s.fmt.fill) === '#243746' && s.fmt.outline === false; };
      const titleStyle = pid => { const t = titleOn(pid); return !!t && up(t.fmt.color) === '#FFFFFF' && t.fmt.size === 24; };
      const titleGeo = pid => { const t = titleOn(pid); return !!t && near(geoOf(pid, t), TITLE_G); };
      const behind = pid => { const s = shapeOn(pid), t = titleOn(pid), V = pg(pid).visuals; return !!s && !!t && V.indexOf(s) < V.indexOf(t); };
      const pageDone = pid => bandGeo(pid) && bandStyle(pid) && titleStyle(pid) && titleGeo(pid) && behind(pid);
      const noteOn = re => texts('page_001').find(v => v.temp && re.test(norm(v.text || '')));
      const brume = () => up((K.visOf(x, 'vis_105_entrees').fmt || {}).bg) === '#E9EFF4';
      const multi = () => st.multiMode ? (st.multi || []) : [];
      const offMulti = () => st.tab !== 'Format' ? '[data-a="tab:Format"]' : '[data-a="cmd:multisel"]';
      const ins = s => P().activePage !== 'page_001' ? '[data-a="ptab:page_001"]' : st.tab !== 'Insertion' ? '[data-a="tab:Insertion"]' : s;
      const T = id => { const [p, v] = findV(P(), id); return v && v.type === 'shape' ? BAND : v && v === titleOn(p.id) ? TITLE_G : null; };
      /* Copier le bandeau et le titre de Vue générale, puis les coller sur une autre page */
      const copyG = tp => {
        const clip = st.clip || [], need = [!shapeOn(tp) && 'shape', !texts(tp).length && 'text'].filter(Boolean);
        if (need.length && !need.every(t => clip.some(v => v.type === t))) {
          if (P().activePage !== 'page_001') return '[data-a="ptab:page_001"]';
          const s = shapeOn('page_001'), t = titleOn('page_001');
          if (!st.multiMode) return st.selVis !== s.id ? `[data-a="vis:${s.id}"]` : offMulti();
          if (!multi().includes(s.id)) return `[data-a="vis:${s.id}"]`;
          if (!multi().includes(t.id)) return `[data-a="vis:${t.id}"]`;
          return st.tab !== 'Accueil' ? '[data-a="tab:Accueil"]' : '[data-a="cmd:copy"]';
        }
        if (P().activePage !== tp) return `[data-a="ptab:${tp}"]`;
        if (need.length) return st.tab !== 'Accueil' ? '[data-a="tab:Accueil"]' : '[data-a="cmd:paste"]';
        const t = titleOn(tp) || texts(tp)[0];
        if (multi().length > 1) return offMulti();
        if (st.selVis !== t.id) return `[data-a="vis:${t.id}"]`;
        return st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : '[data-f="text"]';
      };
      const band = () => shapeOn('page_001'), tbox = () => titleBox();
      const isNote = v => /historique.*hors segment|billetterie.*filtre/.test(norm(v.text || ''));
      const noteG = () => { const n = texts('page_001').find(v => v.temp && v !== titleOn('page_001') && !isNote(v)); return n ? (P().activePage !== 'page_001' ? '[data-a="ptab:page_001"]' : fmtGuide(x, n.id, '[data-f="text"]')) : ins('[data-a="cmd:textbox"]'); };
      const STEPS = [
        [() => !!band(), 'Insertion › Formes › Rectangle : ce sera le bandeau de Vue générale.', () => ins(['[data-a="cmd:shapes"]', '.menu [data-k="rect"]'])],
        [() => bandGeo('page_001'), 'Bandeau : X 0, Y 0, 1280 × 80 px.', () => { const g = geoOf('page_001', band()); return geoGuide(x, band().id, KEYS.find((k, i) => Math.abs(g[k] - BAND[i]) > 1), T); }],
        [() => bandStyle('page_001'), 'Remplissage Bleu nuit, sans contour.', () => fmtGuide(x, band().id, up(band().fmt.fill) !== '#243746' ? ['[data-a="decocol:fill"]', '.menu [data-c="#243746"]'] : '[data-a="decotog:outline"]')],
        [() => pg('page_001').visuals[0] === band(), 'Envoie le bandeau à l’arrière-plan : Format › Organiser.', () => { const s = band(); return multi().length > 1 ? offMulti() : st.selVis !== s.id ? `[data-a="vis:${s.id}"]` : st.tab !== 'Format' ? '[data-a="tab:Format"]' : ['[data-a="cmd:arrange"]', '.menu [data-k="back"]']; }],
        [() => !!tbox(), 'Insertion › Zone de texte : le titre de la page.', () => ins('[data-a="cmd:textbox"]')],
        [() => !!titleOn('page_001'), 'Écris le titre : Wonderland — Pilotage.', () => fmtGuide(x, tbox().id, '[data-f="text"]')],
        [() => titleStyle('page_001'), 'Titre en Blanc, taille 24 pt.', () => { const t = titleOn('page_001'); return fmtGuide(x, t.id, up(t.fmt.color) !== '#FFFFFF' ? ['[data-a="decocol:color"]', '.menu [data-c="#FFFFFF"]'] : ['[data-a="decosel:size"]', '.menu [data-k="24"]']); }],
        [() => titleGeo('page_001'), 'Titre : X 24, Y 16, 580 × 48 px.', () => { const t = titleOn('page_001'), g = geoOf('page_001', t); return geoGuide(x, t.id, KEYS.find((k, i) => Math.abs(g[k] - TITLE_G[i]) > 1), T); }],
        [() => pageDone('page_002'), 'Copie le bandeau et le titre, colle-les sur Détail des ventes, puis écris le titre : Détail des ventes.', () => copyG('page_002')],
        [() => pageDone('page_003'), 'Même chose sur Attractions, avec le titre : Fréquentation des attractions.', () => copyG('page_003')],
        [() => !!noteOn(/historique.*hors segment/), 'Sur Vue générale, ajoute une zone de texte : Historique 1–5 juin · Hors segments.', () => noteG()],
        [() => !!noteOn(/billetterie.*filtre/), 'Puis une autre : Billetterie · Selon les filtres sélectionnés.', () => noteG()],
        [() => brume(), 'Dernière touche : la carte Entrées enregistrées prend un arrière-plan Bleu brume.', () => P().activePage !== 'page_001' ? '[data-a="ptab:page_001"]' : fmtGuide(x, 'vis_105_entrees', ['[data-a="decocol:bg"]', '.menu [data-c="#E9EFF4"]'])]
      ];
      const next = () => { const s = STEPS.find(s => !s[0]()); if (!s) return; x.todo(s[1]); x.guide(s[2]()); };
      const ok = () => STEPS.every(s => s[0]());
      next();
      const TXT = t => { const n = norm(t || ''); if (/\b40\b.*billet|billet.*\b40\b/.test(n)) return 'Texte indiquant « 40 billets » de façon permanente'; if (/\b27\b/.test(n) && /week/.test(n)) return 'Mention « 27 entrées du week-end »'; if (/visiteurs? uniques?/.test(n) && !/pas de visiteurs/.test(n)) return 'Mention « 50 visiteurs uniques »'; if (/\b(9|neuf)\b.*billet/.test(n)) return 'Texte indiquant « 40 billets » de façon permanente'; return null; };
      await x.wait(G(x, ANALYTIC, {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next), tab: later(next), 'multi.mode': later(next), 'clip.copy': later(next),
        cmd: c => c === 'narrative' ? x.oops('Insertion d’un récit automatique utilisant de nouveaux calculs') : c === 'image' ? x.oops('', 'Une forme et des zones de texte suffisent.') : commonErr(x).cmd(c),
        'viz.create': ({ type }) => { if (type !== 'shape' && type !== 'text') return x.oops('', 'Ici, seulement des formes et des zones de texte.'); if (type === 'shape' && shapeOn(P().activePage)) return x.oops('', 'Cette page a déjà son bandeau.'); setTimeout(next, 0); },
        'viz.fmt': p => {
          if (p.vis === 'vis_105_entrees') return p.key === 'bg' ? undefined : x.oops('', 'Seule la surface de la carte change.');
          if (ANALYTIC.includes(p.vis)) return x.oops('', 'Les visuels gardent leur mise en forme.');
          if (p.key === 'text') { if (!p.value && p.v && p.v.text) return x.oops('Titre de page absent'); const e = TXT(p.value); if (e) return x.oops(e); }
          if (p.key === 'size' && p.v && p.v === titleOn(P().activePage) && p.value < 18) return x.oops('Titres moins visibles que les informations secondaires');
          setTimeout(next, 0);
        },
        'clip.copy': ({ ids }) => ids.some(id => ANALYTIC.includes(id)) ? x.oops('', 'Copie seulement le bandeau et le titre.') : setTimeout(next, 0),
        'clip.paste': ({ page, types }) => {
          if (page === 'page_001') return x.oops('', 'Colle le bandeau et le titre sur les deux autres pages.');
          if (types.includes('shape') && shapeOn(page)) return x.oops('', 'Cette page a déjà son bandeau.');
          if (types.includes('text') && texts(page).length) return x.oops('', 'Cette page a déjà son titre.');
          if (!types.includes('text') && !texts(page).length) return x.oops('Titre de page absent');
          setTimeout(next, 0);
        },
        'vis.order': ({ ids, how }) => { if (how === 'front' && ids.some(id => (findV(P(), id)[1] || {}).type === 'shape')) return x.oops('Bandeau placé au-dessus des autres objets'); setTimeout(next, 0); },
        'interaction.set': p => p.tgt === 'vis_105_entrees' ? x.oops('Modification de la carte historique pour la filtrer') : x.oops('', 'Les interactions restent en place.'),
        'vis.geo': ({ ids, key, value }) => { if (ids.some(id => ANALYTIC.includes(id))) return x.oops('', 'Les visuels sont déjà en place.'); const known = ids.filter(id => T(id)); if (known.length) return geoRule(x, known, key, value, T, null); },
        'vis.align': () => {}, 'vis.delete': p => ANALYTIC.includes(p.vis) ? x.oops('', 'Garde ce visuel.') : setTimeout(next, 0),
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide(); clearSel(pbi);
      /* Les objets créés reçoivent leurs identifiants définitifs ; Pixel place les mentions et ajoute celles de Lola */
      for (const pid of PAGES) {
        const s = shapeOn(pid), t = titleOn(pid);
        Object.assign(s, { id: 'shape_109_' + pid, temp: false, from: undefined }); Object.assign(t, { id: 'title_109_' + pid, temp: false, from: undefined }); t.fmt.bold = true;
      }
      const h = noteOn(/historique.*hors segment/), c = noteOn(/billetterie.*filtre/);
      Object.assign(h, { id: 'note_109_history', temp: false }); Object.assign(h.fmt, { size: 11, color: '#344F66' });
      Object.assign(c, { id: 'note_109_commercial', temp: false }); Object.assign(c.fmt, { size: 11, color: '#52616D' });
      headers(P()); P().activePage = 'page_001'; pbi.render();
      await x.ok('Je place tes deux mentions au-dessus des cartes, et j’ajoute celles de Lola : l’extraction, le détail des ventes et les passages.');
      await x.ask('Le fond bleu brume suffit-il à distinguer la carte historique ?', [{ t: 'Oui, la couleur suffit', err: 'Distinction fondée uniquement sur la couleur' }, { t: 'Non : la mention « Historique 1–5 juin · Hors segments » reste indispensable', ok: true }]);
    }, avance: P => headers(P) },

    /* 6 — Une navigation sans obstacle */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st;
      K.ready(x, 'page_001'); clearSel(pbi); pbi.render();
      await x.say('oscar', 'Pourrait-on avoir un menu directement dans le rapport, comme dans une application ?');
      await x.pixel('Oui : Power BI propose des boutons et des navigateurs de pages. Le navigateur crée automatiquement un bouton par page.');
      const navOn = pid => K.pageOf(x, pid).visuals.find(v => v.type === 'navigator');
      const geoOk = pid => { const n = navOn(pid); return !!n && near(PBI.px(K.pageOf(x, pid), n), NAV_G); };
      const sv = (n, k) => ((n.fmt.states || {})[k]) || {};
      const stOk = (n, k) => up(sv(n, k).bg) === NAVST[k].bg && up(sv(n, k).fg) === NAVST[k].fg;
      const statesOk = n => !!n && stOk(n, 'normal') && stOk(n, 'selected');
      const T = id => (findV(P(), id)[1] || {}).type === 'navigator' ? NAV_G : null;
      const path = [], PATH = ['page_002', 'page_003', 'page_001'];
      const nav1 = () => navOn('page_001');
      const STEPS = [
        [() => !!nav1(), 'Insertion › Boutons › Navigateur de pages, sur Vue générale.', () => P().activePage !== 'page_001' ? '[data-a="ptab:page_001"]' : st.tab !== 'Insertion' ? '[data-a="tab:Insertion"]' : ['[data-a="cmd:buttons"]', '.menu [data-k="pagenav"]']],
        [() => geoOk('page_001'), 'Place-le dans le bandeau : X 620, Y 18, 636 × 44 px.', () => { const n = nav1(), g = PBI.px(K.pageOf(x, 'page_001'), n); return geoGuide(x, n.id, KEYS.find((k, i) => Math.abs(g[k] - NAV_G[i]) > 1), T); }],
        [() => statesOk(nav1()), 'États : par défaut, fond Bleu acier et texte Blanc. Sélectionné, fond Or clair et texte Bleu nuit.', () => {
          const n = nav1(), need = stOk(n, 'normal') ? 'selected' : 'normal', W = NAVST[need];
          if ((st.navState || 'normal') !== need) return fmtGuide(x, n.id, ['[data-a="decosel:state"]', `.menu [data-k="${need}"]`]);
          return fmtGuide(x, n.id, up(sv(n, need).bg) !== W.bg ? ['[data-a="decocol:navbg"]', `.menu [data-c="${W.bg}"]`] : ['[data-a="decocol:navfg"]', `.menu [data-c="${W.fg}"]`]);
        }],
        [() => PAGES.every(pid => geoOk(pid) && statesOk(navOn(pid))), 'Copie le navigateur, puis colle-le sur Détail des ventes et sur Attractions.', () => {
          const n = nav1(), tp = ['page_002', 'page_003'].find(p => !navOn(p));
          if (!st.clip || !st.clip.some(v => v.type === 'navigator')) return P().activePage !== 'page_001' ? '[data-a="ptab:page_001"]' : st.selVis !== n.id ? selectGuide(x, n.id) : st.tab !== 'Accueil' ? '[data-a="tab:Accueil"]' : '[data-a="cmd:copy"]';
          if (P().activePage !== tp) return `[data-a="ptab:${tp}"]`;
          return st.tab !== 'Accueil' ? '[data-a="tab:Accueil"]' : '[data-a="cmd:paste"]';
        }],
        [() => path.length === 3, 'Teste le parcours avec le navigateur : Détail des ventes, Attractions, puis Vue générale.', () => { const want = PATH[path.length], n = navOn(P().activePage); return n ? `[data-a="navgo:${n.id}|${want}"]` : `[data-a="ptab:${want}"]`; }]
      ];
      const next = () => { const s = STEPS.find(s => !s[0]()); if (!s) return; x.todo(s[1]); x.guide(s[2]()); };
      const ok = () => STEPS.every(s => s[0]());
      next();
      await x.wait(G(x, ANALYTIC, {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next), tab: later(next), 'multi.mode': later(next),
        'button.kind': ({ kind }) => x.oops(kind === 'booknav' ? 'Navigateur de signets sélectionné' : 'Bouton sans action'),
        'viz.create': ({ type }) => type !== 'navigator' ? x.oops('', 'Choisis Boutons › Navigateur de pages.') : navOn(P().activePage) ? x.oops('Deux boutons dirigent vers la même page par erreur') : setTimeout(next, 0),
        'clip.copy': ({ types }) => types.some(t => t !== 'navigator') ? x.oops('', 'Copie seulement le navigateur.') : setTimeout(next, 0),
        'clip.paste': ({ page, types }) => types.some(t => t !== 'navigator') ? x.oops('', 'Copie seulement le navigateur.') : navOn(page) ? x.oops('Deux boutons dirigent vers la même page par erreur') : setTimeout(next, 0),
        'viz.fmt': p => {
          if (ANALYTIC.includes(p.vis) || (p.v && p.v.type !== 'navigator')) return x.oops('', 'Les autres objets gardent leur mise en forme.');
          if (p.key === 'navbg' && st.navState === 'selected' && up(p.value) === up(sv(p.v, 'normal').bg || '#E1DFDD')) return x.oops('État actif impossible à distinguer');
          if (p.key === 'navbg' && (st.navState || 'normal') === 'normal' && up(p.value) === up(sv(p.v, 'selected').bg)) return x.oops('État actif impossible à distinguer');
          setTimeout(next, 0);
        },
        'vis.geo': ({ ids, key, value }) => ids.some(id => !T(id)) ? x.oops('', 'Les autres objets sont déjà en place.') : geoRule(x, ids, key, value, T, null),
        'page.del': () => x.oops('Suppression des pages précédentes au profit d’un menu'),
        'nav.page': ({ page, from }) => {
          if (!PAGES.every(pid => navOn(pid))) return x.oops('Navigation disponible sur une seule page');
          if (page === from) return;
          if (path.length < 3) { if (page === PATH[path.length]) path.push(page); else { path.length = 0; if (page === PATH[0]) path.push(page); } }
          setTimeout(() => { if (ok()) PBQ.act('ok.state'); else next(); }, 0);
        },
        'ok.state': () => ok() ? true : undefined,
        'vis.delete': p => ANALYTIC.includes(p.vis) || /_109_/.test(p.vis) ? x.oops('', 'Garde cet objet.') : setTimeout(next, 0),
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide(); clearSel(pbi);
      PAGES.forEach(pid => { const n = navOn(pid); Object.assign(n, { id: 'nav_109_' + pid, temp: false, from: undefined }); });
      navs(P()); P().activePage = 'page_001'; pbi.render();
      await x.ok('Trois navigateurs, la page active en or. J’ai aussi réglé les états Pointage et Appuyé selon la charte.');
      await x.ask('Pendant ce parcours, les segments de Vue générale ont-ils été réinitialisés ?', [{ t: 'Oui, à chaque changement de page', err: 'Segment réinitialisé à chaque changement de page' }, { t: 'Non : leurs sélections sont conservées au retour sur la page', ok: true }]);
      await x.ask('Oscar voudrait aussi un bouton vers l’adresse Internet du rapport. Qu’en penses-tu ?', [{ t: 'Les destinations restent les pages internes : le navigateur suffit', ok: true }, { t: 'Bonne idée : un lien vers le site remplacera le navigateur', err: 'Lien vers un site Internet' }]);
    }, avance: P => navs(P) },

    /* 7 — Un rapport accessible à tous */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st;
      K.ready(x, 'page_001'); clearSel(pbi); st.pane = 'Visualisations'; pbi.render();
      await x.say('victoria', 'Camille, du service administratif, va tester le rapport. Elle préfère naviguer au clavier.');
      await x.say('camille', 'Je peux accéder aux informations, mais l’ordre n’est pas naturel : le focus s’arrête d’abord sur une forme décorative.');
      await x.pixel('Trois chantiers : les contrastes, les textes de remplacement et l’ordre de tabulation.');
      /* Contraste */
      const lum = c => { const n = parseInt(c.slice(1), 16), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
      const ratio = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); };
      const TXC = [['#C8A12B', 'Or'], ['#243746', 'Bleu nuit'], ['#52616D', 'Ardoise'], ['#FFFFFF', 'Blanc']], BGC = [['#FFFFFF', 'Blanc'], ['#243746', 'Bleu nuit'], ['#E9EFF4', 'Bleu brume']];
      let tc = '#C8A12B', bc = '#FFFFFF';
      const lab = K.lesson('Vérificateur de contraste', 'Le texte de la carte historique', `<div class="lc-k">Couleur du texte</div><div class="seg" data-g="t">${TXC.map(c => `<button data-v="${c[0]}">${c[1]}</button>`).join('')}</div><div class="lc-k">Couleur de fond</div><div class="seg" data-g="f">${BGC.map(c => `<button data-v="${c[0]}">${c[1]}</button>`).join('')}</div><div data-o="r"></div>`);
      const draw = () => {
        $$('[data-g="t"] button', lab).forEach(b => b.classList.toggle('on', b.dataset.v === tc)); $$('[data-g="f"] button', lab).forEach(b => b.classList.toggle('on', b.dataset.v === bc));
        const r = ratio(tc, bc);
        $('[data-o="r"]', lab).innerHTML = `<div class="ctr-demo" style="background:${bc}; color:${tc}"><small>Entrées enregistrées</small><b>27 entrées</b><span>${esc(fr('Historique du 1er au 5 juin'))}</span></div><div class="lc-ratio"><b>${r.toFixed(2).replace('.', ',')}:1</b><span>${esc(fr(r >= 4.5 ? 'Objectif atteint pour un texte courant.' : 'Sous l’objectif de 4,5:1 pour un texte courant.'))}</span></div>`;
      };
      $$('[data-g] button', lab).forEach(b => b.addEventListener('click', () => PBQ.act('lab.' + b.parentElement.dataset.g, b.dataset.v)));
      draw(); x.app('contraste', lab);
      x.todo('Trouve une couleur de texte lisible sur le bleu brume de la carte historique.');
      const done = () => bc === '#E9EFF4' && ratio(tc, bc) >= 4.5;
      await x.wait({
        'lab.t': v => { tc = v; draw(); if (done()) return true; if (bc === '#FFFFFF' && tc === '#C8A12B') return x.oops('Texte doré sur fond blanc'); if (tc === bc || (bc === '#E9EFF4' && ratio(tc, bc) < 4.5)) return x.oops('', `${ratio(tc, bc).toFixed(2).replace('.', ',')}:1 : en dessous de 4,5:1, le texte se lit mal.`); },
        'lab.f': v => { bc = v; draw(); if (done()) return true; if (bc !== '#E9EFF4') x.note('La carte historique utilise le bleu brume : choisis ce fond, puis une couleur de texte.'); }
      });
      await x.ok(`${ratio(tc, bc).toFixed(1).replace('.', ',')}:1 sur bleu brume : un texte courant parfaitement lisible.`);
      await x.ask('Dans les graphiques, comment distinguer les attractions sans voir les couleurs ?', [{ t: 'Par leur couleur, c’est suffisant', err: 'Information transmise uniquement par une couleur' }, { t: 'Grâce aux étiquettes, à la légende et aux info-bulles qui nomment chaque série', ok: true }]);
      x.app('pbi');
      /* Textes de remplacement */
      const choices = id => { const L4 = [ALT[id], 'Carte 1', ALT_BAD[id], 'Aucun texte de remplacement'], r = hash(id) % 4; return L4.slice(r).concat(L4.slice(0, r)); };
      pbi.altChoices = v => ALT[v.id] ? choices(v.id) : [];
      const altLeft = () => ALT_ORDER.filter(id => K.visOf(x, id).alt !== ALT[id]);
      const pg1 = () => K.pageOf(x, 'page_001');
      const tabOk = () => (pg1().tabSkip || []).includes('shape_109_page_001') && JSON.stringify(pg1().tabOrder || []) === JSON.stringify(TAB1);
      await x.pixel('Les textes de remplacement maintenant : un lecteur d’écran lit cette description à la place du visuel.');
      const next = () => {
        const left = altLeft();
        if (left.length) {
          const id = left[0], v = K.visOf(x, id);
          x.todo(`Texte de remplacement : ${NAMES[id]} (${12 - left.length + 1}/12).`);
          x.guide(fmtGuide(x, id, ['[data-a="altpick:' + id + '"]', `.menu [data-k="${choices(id).indexOf(ALT[id])}"]`])); return;
        }
        if (P().activePage !== 'page_001') { x.todo('Reviens sur Vue générale pour l’ordre de tabulation.'); x.guide('[data-a="ptab:page_001"]'); return; }
        if (st.pane !== 'Sélection') { x.todo('Affichage › Volet Sélection, puis l’onglet Tabulation.'); x.guide(st.tab !== 'Affichage' ? '[data-a="tab:Affichage"]' : '[data-a="cmd:selpane"]'); return; }
        if ((st.spTab || 'layers') !== 'tab') { x.todo('Ouvre l’onglet Tabulation.'); x.guide('[data-a="sptab:tab"]'); return; }
        if (!(pg1().tabSkip || []).includes('shape_109_page_001')) { x.todo('Retire le bandeau décoratif de l’ordre de tabulation.'); x.guide('[data-a="tabskip:shape_109_page_001"]'); return; }
        const tb = st.tabBuild;
        if (!tb) { x.todo('Touche Réorganiser, puis les objets dans l’ordre de lecture.'); x.guide('[data-a="tabbuild:start"]'); return; }
        const nid = TAB1[tb.ids.length];
        x.todo(`Position ${tb.ids.length + 1} sur 13 : ${PBI.vname(K.visOf(x, nid))}.`); x.guide(`[data-a="tabpick:${nid}"]`);
      };
      next();
      await x.wait(G(x, [], {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next), tab: later(next), 'multi.mode': later(next),
        'vis.alt': ({ vis, text }) => text === 'Carte 1' ? x.oops('Texte alternatif « Carte 1 »') : /^Aucun/.test(text) ? x.oops('Texte alternatif absent') : text !== ALT[vis] ? x.oops('Texte alternatif contenant une valeur figée') : setTimeout(next, 0),
        'viz.fmt': p => p.key === 'size' ? x.oops('Taille de police réduite pour masquer un débordement') : x.oops('', 'La mise en forme est déjà prête.'),
        'tab.start': later(next),
        'tab.pick': ({ vis, pos }) => vis.startsWith('shape_') ? x.oops('Forme décorative accessible avant les segments') : TAB1[pos - 1] !== vis ? x.oops('Ordre du clavier différent de l’ordre de lecture') : setTimeout(next, 0),
        'tab.order': ({ order }) => JSON.stringify(order) === JSON.stringify(TAB1) ? undefined : x.oops('Ordre du clavier différent de l’ordre de lecture'),
        'tab.skip': ({ vis, skip }) => skip && !vis.startsWith('shape_') ? x.oops('', 'Seules les formes décoratives sortent de l’ordre de tabulation.') : !skip && vis.startsWith('shape_') ? x.oops('Forme décorative accessible avant les segments') : setTimeout(next, 0),
        'viz.change': () => { if (!altLeft().length && tabOk()) return true; next(); }
      }));
      x.guide(); delete pbi.altChoices;
      access(P()); clearSel(pbi); st.pane = 'Visualisations'; st.spTab = 'layers'; pbi.render();
      await x.ok('Douze textes de remplacement et un parcours clavier logique. J’applique la même règle aux pages Détail des ventes et Attractions.');
      await x.ask('Pourquoi ne pas écrire « La carte affiche 40 billets » dans un texte de remplacement ?', [{ t: 'Parce que c’est trop long', msg: 'La longueur n’est pas le problème : après un filtrage, ce chiffre deviendrait faux.' }, { t: 'Parce que la valeur change avec les filtres : on décrit la fonction du visuel', ok: true }]);
    }, avance: P => access(P) },

    /* 8 — La dernière inspection de Victoria */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st;
      K.ready(x, 'page_001'); clearSel(pbi); st.pane = 'Visualisations';
      const ds = K.visOf(x, DS), ts = K.visOf(x, TS);
      ds.sel = { kind: 'range', min: '2026-06-06', max: '2026-06-07' }; ts.sel = { kind: 'basic', values: ['Senior'] }; pbi.render();
      await x.say('victoria', 'Trois billets seniors, 96 €, et les entrées restent à vingt-sept. Le design est très bien.');
      await x.say('victoria', 'Mais je veux être certaine que nos modifications de présentation n’ont pas touché aux calculs.');
      ds.sel = null; ts.sel = null; pbi.render();
      await x.pixel('Comparons plusieurs situations avec les résultats de référence. On part du périmètre complet.');
      const card = id => { const v = K.visOf(x, id), f = v.f.values[0], q = pbi.query(v); return q ? PBI.aggregate(q.rows.map(r => r[f.c]), f.agg) : null; };
      const wk = () => !!ds.sel && ds.sel.kind === 'range' && ds.sel.min === '2026-06-06' && ds.sel.max === '2026-06-07';
      const cats = () => [...((ts.sel && ts.sel.values) || [])].sort().join('+');
      const close = (a, b) => a != null && Math.abs(a - b) < .005;
      const TESTS = [
        ['tout', () => !ds.sel && !cats(), [40, 1310, 65.5], 'Périmètre complet : aucune sélection dans les segments.'],
        ['week-end', () => wk() && !cats(), [9, 276, 55.2], 'Segment de dates : du 06/06 au 07/06.'],
        ['Senior', () => wk() && cats() === 'Senior', [3, 96, 48], 'Week-end et Senior : choisis Senior dans la liste des catégories.'],
        ['Étudiant', () => wk() && cats() === 'Étudiant', [6, 180, 60], 'Week-end et Étudiant seul.'],
        ['les deux', () => wk() && cats() === 'Senior+Étudiant', [9, 276, 55.2], 'Week-end, avec Senior et Étudiant ensemble.']
      ];
      const seen = new Set();
      const check = () => TESTS.forEach(([k, f, [b, t, m]]) => { if (f() && card('vis_105_billets') === b && close(card('vis_105_ventes_ttc'), t) && close(card('vis_105_vente_moyenne'), m) && card('vis_105_entrees') === 27) seen.add(k); });
      const dd = v => [`[data-a="sldrop:${TS}"]`, `.menu [data-k="${v}"]`];
      const nextT = () => {
        check();
        const T = TESTS.find(t => !seen.has(t[0])); if (!T) return;
        x.todo(T[3]);
        if (P().activePage !== 'page_001') { x.guide('[data-a="ptab:page_001"]'); return; }
        if (!wk()) { x.guide(ds.sel && ds.sel.min === '2026-06-06' ? [`[data-a="slrange:${DS}|max"]`, '.menu [data-k="2026-06-07"]'] : [`[data-a="slrange:${DS}|min"]`, '.menu [data-k="2026-06-06"]']); return; }
        const want = T[0] === 'Senior' ? ['Senior'] : T[0] === 'Étudiant' ? ['Étudiant'] : T[0] === 'les deux' ? ['Senior', 'Étudiant'] : [];
        const on = (ts.sel && ts.sel.values) || [];
        const tap = on.find(v => !want.includes(v)) || want.find(v => !on.includes(v));
        x.guide(tap ? (ts.mode === 'dropdown' ? dd(tap) : `[data-a="slpick:${TS}|${tap}"]`) : null);
      };
      check(); nextT();
      const GG = extra => G(x, ANALYTIC, Object.assign({
        page: later(nextT), pane: later(nextT), canvas: later(nextT), visual: later(nextT), tab: later(nextT),
        cmd: c => c === 'relations' || c === 'newmeasure' || c === 'newcol' ? x.oops('Création d’une relation ou d’une mesure pour corriger un problème visuel') : c === 'syncslicers' ? x.oops('Tableau détaillé réduit aux cinq transactions du week-end') : commonErr(x).cmd(c),
        'viz.type': p => p.type === 'stacked100' ? x.oops('Graphique empilé remplacé par un graphique 100 % empilé') : x.oops('', 'Garde le type de chaque visuel.'),
        'vis.order': ({ ids }) => ids.some(id => /^shape_/.test(id)) ? x.oops('Titre ou tableau masqué par une forme') : undefined,
        'vis.delete': () => x.oops('Enregistrement avec des objets manquants'),
        'interaction.set': () => x.oops('Carte Entrées modifiée par le segment commercial'),
        'vis.geo': () => x.oops('', 'La mise en page est validée : on teste les résultats.')
      }, extra));
      await x.wait(GG({ slicer: later(() => { check(); if (seen.size === TESTS.length) PBQ.act('ok.state'); else nextT(); }), 'ok.state': () => seen.size === TESTS.length ? true : undefined, 'viz.change': () => { check(); if (seen.size === TESTS.length) return true; nextT(); } }));
      x.guide();
      await x.ok('Toutes les données : 40 billets et 1 310 €. Week-end : 9 et 276 €. Senior : 3 et 96 €. Étudiant : 6 et 180 €. Les entrées restent à 27.');
      await x.ask('Pendant ces tests, la carte Entrées enregistrées…', [{ t: 'a suivi le segment de dates', err: 'Carte Entrées modifiée par le segment commercial' }, { t: 'est restée à 27 : elle ignore les segments commerciaux', ok: true }]);
      /* Navigation, en gardant le week-end */
      if (!wk()) { ds.sel = { kind: 'range', min: '2026-06-06', max: '2026-06-07' }; ts.sel = null; pbi.render(); }
      const visited = [], ROUTE = ['page_002', 'page_003', 'page_001'];
      const nextN = () => {
        const want = ROUTE[visited.length]; if (!want) return;
        x.todo(['Le week-end reste sélectionné. Ouvre Détail des ventes avec le navigateur.', 'Puis la page Attractions.', 'Reviens sur Vue générale.'][visited.length]);
        const n = K.pageOf(x, P().activePage).visuals.find(v => v.type === 'navigator');
        x.guide(n ? `[data-a="navgo:${n.id}|${want}"]` : `[data-a="ptab:${want}"]`);
      };
      nextN();
      const step = id => { if (id === ROUTE[visited.length]) visited.push(id); setTimeout(() => { if (visited.length === 3) PBQ.act('ok.state'); else nextN(); }, 0); };
      await x.wait(GG({ 'nav.page': ({ page }) => step(page), page: id => step(id), slicer: () => x.oops('', 'Garde le week-end pendant la visite des pages.'), 'ok.state': () => visited.length === 3 && wk() && card('vis_105_billets') === 9 ? true : undefined }));
      x.guide();
      const n20 = pbi.query(K.visOf(x, 'vis_106_detail_ventes')).rows.length;
      await x.ok(`Le détail garde ses ${n20} transactions, les attractions leurs 50 passages, et Vue générale retrouve ses 9 billets du week-end.`);
      const audit = K.lesson('Fiche d’audit', 'Rapport de direction', `<ul class="audit">${['Trois canevas de 1280 × 720 pixels', 'Quatre cartes alignées et distribuées', 'Deux segments au-dessus des indicateurs', 'Périmètres commercial et historique distingués', 'Trois navigateurs fonctionnels', 'Aucun chevauchement analytique', 'Douze textes de remplacement', 'Ordre de tabulation vérifié', 'Couleurs et typographie cohérentes', 'Données, tris et agrégations préservés'].map(t => `<li>${esc(t)}</li>`).join('')}</ul>`);
      x.app('audit', audit);
      await x.pixel('Fiche d’audit complète. Dernière étape : revenir au périmètre global, puis enregistrer.');
      x.app('pbi');
      const nextS = () => {
        if (P().activePage !== 'page_001') { x.todo('Reviens sur Vue générale.'); x.guide('[data-a="ptab:page_001"]'); return; }
        if (ts.sel) { x.todo('Efface les catégories sélectionnées.'); x.guide(`[data-a="slclear:${TS}"]`); return; }
        if (ds.sel) { x.todo('Efface la période du segment de dates.'); x.guide(`[data-a="slclear:${DS}"]`); return; }
        x.todo('Périmètre global : enregistre Wonderland_Pilotage.'); x.guide('.pbi-save');
      };
      nextS();
      const n14 = () => P().pages.reduce((a, p) => a + p.visuals.filter(v => !ANALYTIC.includes(v.id)).length, 0);
      const save = () => {
        pbi.closeBackstage();
        if (ds.sel || ts.sel) return x.oops('Neuf billets affichés dans le périmètre global');
        if (count(P(), ANALYTIC) !== 12 || n14() !== 14) return x.oops('Enregistrement avec des objets manquants');
        if (card('vis_105_ventes_ttc') !== 1310) return x.oops('Carte TTC incohérente avec le tableau par canal');
        P().dirty = false; P().saved = true; pbi.render(); return true;
      };
      await x.wait(GG({ slicer: later(nextS), page: later(nextS), 'nav.page': later(nextS), save: () => save(), 'file.menu': () => {}, file: k => k === 'back' ? undefined : k === 'save' ? save() : x.oops('', 'Utilise Enregistrer pour garder le même projet.'), 'viz.change': later(nextS) }));
      x.guide();
      await x.ok('Projet enregistré : trois pages, douze visualisations analytiques et quatorze objets de présentation.');
    }, avance: P => { P.pages.forEach(p => p.visuals.forEach(v => { if (v.type === 'slicer') v.sel = null; })); P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'pilotage', n: 'Les lumières s’éteignent. Le nouveau rapport apparaît sur le grand écran : bandeau bleu nuit, indicateurs alignés, segments à portée de main.' },
    { p: 'victoria', t: 'Cette fois, je sais immédiatement quelles informations consulter.' },
    { n: 'Elle sélectionne les 6 et 7 juin. Les trois cartes commerciales se mettent à jour. La carte historique reste à vingt-sept, avec sa mention.' },
    { p: 'gabriel', t: 'Nous retrouvons bien les neuf billets et les 276 euros TTC.' },
    { p: 'lola', t: 'Et les couleurs sont cohérentes sur toutes les pages. On peut présenter sans expliquer le fonctionnement du rapport à chaque étape.' },
    { clear: 1, n: 'Victoria passe d’une page à l’autre avec le menu, revient sur Vue générale et retrouve ses filtres.' },
    { p: 'victoria', t: 'Je n’ai même plus besoin de demander comment utiliser le rapport.' },
    { p: 'camille', t: 'Et la navigation au clavier suit enfin un ordre logique.' },
    { card: { k: 'Audit de présentation', ul: ['Intégrité des données', 'Cohérence des indicateurs', 'Organisation du rapport', 'Navigation prévue', 'Critères d’accessibilité'] } },
    { clear: 1, bg: 'conseil', p: 'victoria', t: 'Tu as construit ce rapport depuis notre premier fichier Excel. Demain, c’est toi qui présenteras les résultats devant le conseil d’administration.' },
    { p: 'pixel', t: 'Il reste une dernière épreuve avant de terminer le module : montrer que tu sais tout faire en autonomie.' },
    { wait: 800 }
  ],
  recompense: { titre: 'Prêt pour la direction !', sous: 'Tu sais désormais transformer un rapport technique en un outil de pilotage professionnel.', badge: 'b109', badgeNom: 'Designer décisionnel', objet: 'ecran-panoramique' },
  fiches: [
    ['Canevas', 'À quoi correspondent X, Y, largeur et hauteur dans Power BI ?', 'À la position horizontale, la position verticale et aux dimensions d’un objet, en pixels. Les modifier ne change jamais ses données.'],
    ['Format de page', 'Quel format pour un écran de présentation ?', 'Le 16:9, en 1280 × 720 pixels. On le règle dans le format de la page, avec l’arrière-plan, la transparence et le mode d’affichage.'],
    ['Aligner, distribuer', 'Quelle différence entre aligner et distribuer ?', 'Aligner place plusieurs objets sur un même axe. Distribuer répartit des espaces égaux entre eux.'],
    ['Hiérarchie visuelle', 'Dans quel ordre organiser une page de direction ?', 'Orientation, périmètre, indicateurs, explication, exploration : on choisit ses filtres avant de lire les résultats.'],
    ['Thème', 'Le thème écrase-t-il les couleurs d’un graphique ?', 'Non. Une mise en forme posée directement sur un visuel reste prioritaire : on vérifie les anciens visuels après l’application.'],
    ['Contexte écrit', 'Que ne faut-il jamais écrire dans une zone de texte ?', 'Un chiffre qui dépend des filtres, comme « 40 billets ». On décrit la source et le périmètre ; les cartes donnent les valeurs.'],
    ['Contraste', 'Quel contraste viser pour un texte courant ?', 'Au moins 4,5:1. L’or sur blanc n’atteint que 2,45:1 : on le réserve aux accents.'],
    ['Accessibilité', 'Que vérifier pour un lecteur d’écran ou un clavier ?', 'Un texte de remplacement qui décrit la fonction de chaque visuel, et un ordre de tabulation logique, sans formes décoratives.']
  ],
  suite: [
    { bg: 'conseil', n: 'Le lendemain matin. Les portes de la salle du conseil d’administration sont encore fermées.' },
    { p: 'victoria', t: 'Aujourd’hui, le conseil découvre notre système de pilotage. Et c’est toi qui présentes.' },
    { p: 'pixel', t: 'Huit défis, sans guidage pas à pas. Tu as tout appris pour les relever.' }
  ],
  accroche: 'Tu transformeras le rapport en outil de direction : canevas, alignements, thème, en-têtes, navigation et accessibilité.',
  fin(P) { canvas(P); layoutCards(P); layoutRest(P); theme(P); headers(P); navs(P); access(P); P.pages.forEach(p => p.visuals.forEach(v => { if (v.type === 'slicer') v.sel = null; })); P.activePage = 'page_001'; P.dirty = false; P.saved = true; }
};
window.PBQ.mission(def);
})();

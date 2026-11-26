/* Mission 107 — Les attractions populaires */
(function () {
'use strict';
const { h, esc, fr, $, $$, clone } = window.PBQ;
const PBI = window.PBI;
const A = 'tbl_attractions', SRC = 'src_attractions_20260606_v1', FILE = 'Frequentation_Attractions.csv';

/* ───────── La source d'Oscar ───────── */
const CSV = `ID_Stat;Date_Passage;Attraction;Type_Attraction;Passages
A001;2026-06-01;Dragon;Sensations;2
A002;2026-06-01;Pirates;Découverte;2
A003;2026-06-01;Wonder Wheel;Découverte;1
A004;2026-06-01;Sky Tower;Sensations;1
A005;2026-06-02;Dragon;Sensations;4
A006;2026-06-02;Pirates;Découverte;3
A007;2026-06-02;Wonder Wheel;Découverte;2
A008;2026-06-02;Sky Tower;Sensations;1
A009;2026-06-03;Dragon;Sensations;3
A010;2026-06-03;Pirates;Découverte;2
A011;2026-06-03;Wonder Wheel;Découverte;1
A012;2026-06-03;Sky Tower;Sensations;1
A013;2026-06-04;Dragon;Sensations;4
A014;2026-06-04;Pirates;Découverte;3
A015;2026-06-04;Wonder Wheel;Découverte;3
A016;2026-06-04;Sky Tower;Sensations;2
A017;2026-06-05;Dragon;Sensations;5
A018;2026-06-05;Pirates;Découverte;4
A019;2026-06-05;Wonder Wheel;Découverte;3
A020;2026-06-05;Sky Tower;Sensations;3`;
const LINES = CSV.split('\n'), HEAD = LINES[0].split(';');
const RAW = LINES.slice(1).map(l => { const v = l.split(';'); const o = {}; HEAD.forEach((k, i) => o[k] = v[i]); return o; });
const COLS = [['ID_Stat', 'text'], ['Date_Passage', 'date'], ['Attraction', 'text'], ['Type_Attraction', 'text'], ['Passages', 'int']];
const WANT = Object.fromEntries(COLS);
const TNOM = t => (PBI.TYPES[t] || { nom: t }).nom;

function makeQuery(detect) {
  const q = { id: 'qry_attractions', name: 'Frequentation_Attractions', tableId: A, sourceId: SRC, loadEnabled: true, kind: 'csv', file: FILE, delim: ';', enc: 65001,
    cols: COLS.map(([n]) => ({ n, t: 'text' })), data: clone(RAW),
    steps: [{ op: 'source', name: 'Source' }, { op: 'promote', name: 'En-têtes promus' }] };
  if (detect !== 'none') q.steps.push({ op: 'type', name: 'Type modifié', auto: true, changes: COLS.map(c => [...c]) });
  return q;
}
function importAttractions(P, q) {
  if (P.tables.some(t => t.id === A)) return;
  q = q || makeQuery();
  P.sources.push({ id: SRC, fileName: FILE, connector: 'Csv.Document', version: 1, service: 'Attractions', delimiter: ';', encoding: 65001 });
  P.connections = (P.connections || []).concat({ id: 'conn_attractions_001', sourceId: SRC, status: 'connected' });
  if (!P.queries.includes(q)) P.queries.push(q);
  const T = PBI.evalQuery(q);
  P.tables.push({ id: A, name: 'Frequentation_Attractions', queryId: q.id, sourceId: SRC, loadStatus: 'completed', cols: T.cols.map(c => ({ n: c.n, t: c.t === 'any' ? 'text' : c.t })), rows: T.rows });
  P.formats[A + '.Date_Passage'] = { pattern: 'fr' };
}

/* ───────── La page Attractions ───────── */
const SLOTS3 = [[2, 4, 47, 46], [51, 4, 47, 46], [2, 52, 96, 45]];
const geo = s => ({ x: s[0], y: s[1], w: s[2], h: s[3] });
const fa = (c, agg) => ({ t: A, c, agg });
const CHARTE = { Dragon: '#c8a12b', Pirates: '#397fa8', 'Wonder Wheel': '#639d87', 'Sky Tower': '#9378b6' };
const ORDER = ['Dragon', 'Pirates', 'Wonder Wheel', 'Sky Tower'];
const NAME = Object.fromEntries(PBI.NAMED_PAL.map(([c, n]) => [c.toLowerCase(), n]));
const OLD = ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees', 'vis_105_vente_moyenne', 'vis_106_detail_ventes', 'vis_106_categories', 'vis_106_canaux'];
const NEW = ['vis_107_attraction_bars', 'vis_107_daily_columns', 'vis_107_daily_stacked'];
const TITLES = { vis_107_attraction_bars: 'Passages par attraction', vis_107_daily_columns: 'Passages quotidiens dans les attractions', vis_107_daily_stacked: 'Répartition quotidienne par attraction' };
const DAYS = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05'];

function addPage3(P) { if (!P.pages.some(p => p.id === 'page_003')) P.pages.push({ id: 'page_003', name: 'Attractions', visuals: [], filters: [], slots: clone(SLOTS3) }); }
function chartOn(P, id, type, slot, f) {
  addPage3(P);
  const pg = P.pages.find(p => p.id === 'page_003');
  let v = pg.visuals.find(v => v.id === id);
  if (!v) { v = { id, type, ...geo(SLOTS3[slot]), f: { values: [], axis: [], legend: [], cols: [], ...f }, title: TITLES[id], fmt: {}, temp: false }; pg.visuals.push(v); }
  return v;
}
function addBars(P, k) {
  const v = chartOn(P, 'vis_107_attraction_bars', 'bar', 0, { axis: [fa('Attraction', 'none')], values: [fa('Passages', 'sum')] });
  if (k >= 2) { v.sort = { by: 'value', dir: 'desc' }; Object.assign(v.fmt, { labels: true, dec: 0, colors: { 'Somme de Passages': CHARTE.Dragon }, axisTitle: 'Nombre de passages' }); }
}
function addColumns(P, k) {
  const v = chartOn(P, 'vis_107_daily_columns', 'column', 1, { axis: [fa('Date_Passage', 'none')], values: [fa('Passages', 'sum')] });
  if (k >= 2) Object.assign(v.fmt, { labels: true, dec: 0 });
}
function addStacked(P, k) {
  const v = chartOn(P, 'vis_107_daily_stacked', 'stacked', 2, { axis: [fa('Date_Passage', 'none')], values: [fa('Passages', 'sum')], legend: [fa('Attraction', 'none')] });
  if (k >= 2) Object.assign(v.fmt, { colors: clone(CHARTE), totals: true, dec: 0 });
}

/* ───────── Aides ───────── */
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const isF = (f, c, agg) => !!f && f.t === A && f.c === c && (agg === undefined || f.agg === agg);
/* Données d'un graphique sans la sélection croisée en cours */
const pure = (x, v) => { const st = x.pbi.st, s = st.xsel; st.xsel = null; try { return x.pbi.chartData(v); } finally { st.xsel = s; } };
const byCat = d => d ? Object.fromEntries(d.cats.map((c, i) => [c, d.series[0].values[i]])) : {};
const temps = x => { const p = K.pageOf(x, 'page_003'); return p ? p.visuals.filter(v => v.temp) : []; };
const tempChart = x => temps(x).find(v => PBI.CHART_T.includes(v.type));
/* Guides : d'abord sélectionner le visuel, ouvrir le volet, puis l'onglet voulu */
const selG = (x, v, s) => x.pbi.st.selVis !== v.id ? `[data-a="vis:${v.id}"]` : x.pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : s;
const champsG = (x, v, s) => selG(x, v, (x.pbi.st.vzTab || 'champs') !== 'champs' ? '[data-a="vztab:champs"]' : s);
const fmtG = (x, v, s) => selG(x, v, x.pbi.st.vzTab !== 'format' ? '[data-a="vztab:format"]' : s);
const menuG = (x, v, s) => x.pbi.st.selVis !== v.id ? `[data-a="vis:${v.id}"]` : s;
const createG = (x, type) => x.pbi.P.activePage !== 'page_003' ? '[data-a="ptab:page_003"]' : x.pbi.st.selVis ? '[data-a="canvas"]' : x.pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : `[data-a="vtype:${type}"]`;
const noTouch = x => x.oops('', 'Ce visuel est déjà validé : laisse-le tel quel.');
const visuals = P => P.pages.reduce((a, p) => a + p.visuals.length, 0);

const def = {
  id: 107,
  objectifs: ['Choisir et créer des graphiques en barres et en colonnes', 'Utiliser les axes, la légende et le tri', 'Mettre en forme un graphique lisible et honnête'],
  intro: [
    { bg: 'dragon', n: '10 h 15. Une longue file s’étire devant les montagnes russes Dragon. Le train démarre dans un concert de cris de joie.' },
    { n: 'Quelques mètres plus loin, la grande roue tourne lentement. Plusieurs nacelles sont vides.' },
    { p: 'oscar', t: 'Dragon attire beaucoup de monde aujourd’hui. Mais est-ce vraiment notre attraction la plus fréquentée sur toute la semaine ?' },
    { n: 'Une impression ne constitue pas une preuve. Pour décider, il faut analyser les données sur une période définie.' },
    { clear: 1, bg: 'pilotage', card: { k: 'Les affiches de Lola', ul: ['Dragon : montagnes russes, sensations', 'Pirates : attraction aquatique, découverte', 'Wonder Wheel : grande roue, découverte', 'Sky Tower : tour de chute, sensations'] } },
    { p: 'lola', t: 'Nous devons choisir les attractions de notre prochaine campagne. J’aimerais disposer de données objectives.' },
    { p: 'victoria', t: 'Je veux aussi savoir quels jours nos attractions sont les plus sollicitées. Cela nous aidera à préparer les prochaines semaines.' },
    { p: 'lola', t: 'Je vais demander au service Data de nous préparer des graphiques.' },
    { clear: 1, bg: 'bureau', mail: { de: 'oscar', a: 'Direction Data', heure: '10:32', objet: 'Statistiques des attractions', corps: ['Bonjour, voici les statistiques quotidiennes de nos quatre attractions pour les cinq premiers jours de juin.', 'Le registre contient 50 passages validés. Attention : ce ne sont pas 50 visiteurs différents, une même personne peut faire plusieurs attractions.', 'Peux-tu construire des graphiques pour Victoria et Lola ? Merci ! Oscar'], pj: { nom: FILE, type: 'csv', info: 'UTF-8, séparateur point-virgule' } } },
    { p: 'pixel', t: 'Attends… notre registre indique 27 entrées, et Oscar annonce 50 passages. C’est une erreur ?' },
    { p: 'pixel', t: 'Bien sûr que non ! Une famille entre une fois dans le parc, puis monte dans Dragon et dans Pirates. Une entrée, plusieurs passages.' },
    { btn: 'Récupérer les données d’Oscar' }
  ],
  leconTitre: 'Comprendre les graphiques',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Une entrée, plusieurs passages', `
      <div class="flow-row" style="grid-template-columns:1fr 1fr">
        <div class="flow-box on"><b class="num" style="font-size:26px">1</b><small>Entrée dans le parc : un billet validé au portique.</small></div>
        <div class="flow-box on hot"><b class="num" style="font-size:26px">3</b><small>Passages : Dragon, Pirates, puis Wonder Wheel.</small></div>
      </div>
      <table class="tbl wrap" style="width:100%; margin-top:12px"><thead><tr><th><span class="thc">Table</span></th><th><span class="thc">Une ligne, c’est…</span></th></tr></thead><tbody>
        <tr><td>tBilletterie</td><td>une vente, d’un ou plusieurs billets</td></tr>
        <tr><td>Frequentation_Wonderland</td><td>une première entrée validée</td></tr>
        <tr><td>Frequentation_Attractions</td><td>une journée d’une attraction</td></tr></tbody></table>
      <div data-sec="2" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · Tableau ou graphique ?</div>
        <div class="seg" data-g="r"><button data-v="t" class="on">Tableau</button><button data-v="b">Barres</button><button data-v="c">Colonnes</button></div>
        <div data-o="r"></div>
      </div>
      <div data-sec="3" style="display:none">
        <div class="lc-k" style="margin-top:16px">Les axes X et Y</div>
        <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>Barres horizontales</b><small>Axe X : les valeurs. Axe Y : les catégories.</small></div><div class="flow-box on"><b>Colonnes verticales</b><small>Axe X : les catégories ou les dates. Axe Y : les valeurs.</small></div></div>
      </div>
      <div data-sec="4" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · La légende</div>
        <div class="seg" data-g="l"><button data-v="0" class="on">Sans légende</button><button data-v="1">Légende Attraction</button></div>
        <div data-o="l"></div>
      </div>
      <div data-sec="5" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · L’échelle</div>
        <div class="seg" data-g="z"><button data-v="0" class="on">Axe à zéro</button><button data-v="1">Axe tronqué</button></div>
        <div data-o="z"></div>
      </div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    const show = k => { $(`[data-sec="${k}"]`, card).style.display = ''; requestAnimationFrame(() => sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' })); };
    const TOT = [['Dragon', 18], ['Pirates', 14], ['Wonder Wheel', 10], ['Sky Tower', 8]];
    const D5 = ['01/06', '02/06', '03/06', '04/06', '05/06'];
    const mini = (spec, hgt) => { const b = h(`<div class="lc-chart" style="height:${hgt || 150}px"></div>`); PBI.renderChart(b, spec); return b; };
    const toggle = (g, m) => $$(`[data-g="${g}"] button`, card).forEach(b => b.classList.toggle('on', b.dataset.v === m));
    const drawR = m => {
      toggle('r', m); const o = $('[data-o="r"]', card); o.innerHTML = '';
      if (m === 't') { o.innerHTML = `<table class="tbl" style="width:100%"><thead><tr><th><span class="thc">Attraction</span></th><th class="r"><span class="thc">Passages</span></th></tr></thead><tbody>${TOT.map(r => `<tr><td>${r[0]}</td><td class="r">${r[1]}</td></tr>`).join('')}</tbody></table><p class="lc-note">Idéal pour lire une valeur précise.</p>`; return; }
      o.appendChild(mini({ kind: m === 'b' ? 'bar' : 'column', cats: TOT.map(r => r[0]), series: [{ name: 'Passages', values: TOT.map(r => r[1]), color: '#c8a12b' }], labels: true }));
      o.appendChild(h(`<p class="lc-note">${esc(fr(m === 'b' ? 'Idéal pour comparer et classer des catégories, surtout quand leurs noms sont longs.' : 'Les colonnes comparent aussi des catégories, et conviennent bien à une suite de dates.'))}</p>`));
    };
    const drawL = m => {
      toggle('l', m); const o = $('[data-o="l"]', card); o.innerHTML = '';
      o.appendChild(mini(m === '1'
        ? { kind: 'column', cats: D5, series: [{ name: 'Dragon', values: [2, 4, 3, 4, 5], color: '#c8a12b' }, { name: 'Pirates', values: [2, 3, 2, 3, 4], color: '#397fa8' }], labels: true }
        : { kind: 'column', cats: D5, series: [{ name: 'Dragon et Pirates', values: [4, 7, 5, 7, 9], color: '#8A90AA' }], labels: true }));
      o.appendChild(h(`<p class="lc-note">${esc(fr(m === '1' ? 'Axe X : la date. Axe Y : la somme des passages. Légende : l’attraction.' : 'Sans légende, Dragon et Pirates se confondent dans une seule série.'))}</p>`));
    };
    const drawZ = m => {
      toggle('z', m); const o = $('[data-o="z"]', card); o.innerHTML = '';
      o.appendChild(mini({ kind: 'bar', cats: ['Dragon', 'Pirates'], series: [{ name: 'Passages', values: [18, 14], color: '#c8a12b' }], labels: true, min: m === '1' ? 12 : 0 }, 112));
      o.appendChild(h(`<p class="lc-note">${esc(fr((m === '1' ? 'L’axe démarre à 12 : Dragon paraît trois fois plus fréquentée que Pirates.' : 'Les longueurs représentent fidèlement les quantités comparées.') + ' Dans les deux cas, Dragon compte seulement quatre passages de plus.'))}</p>`));
    };
    $$('[data-g] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.' + b.parentElement.dataset.g, b.dataset.v)));
    const quiet = { 'lab.r': m => { drawR(m); }, 'lab.l': m => { drawL(m); }, 'lab.z': m => { drawZ(m); } };
    await x.pixel('Une famille entre une seule fois dans le parc. Elle monte ensuite dans Dragon, dans Pirates et dans Wonder Wheel.');
    await x.pixel('Une entrée, trois passages. Avant tout graphique, demande-toi ce que représente une ligne : c’est la granularité.');
    await x.pixel('La table des attractions ne contient aucun identifiant de visiteur. Elle ne dira jamais combien de personnes différentes sont venues.');
    show(2); drawR('t');
    await x.pixel('Un tableau permet de lire une valeur précise. Un graphique fait voir les écarts d’un coup d’œil.');
    x.todo('Affiche les mêmes chiffres en barres, puis en colonnes.');
    const seen = new Set();
    const aim = () => x.target($$('[data-g="r"] button', card).filter(b => b.dataset.v !== 't' && !seen.has(b.dataset.v)));
    aim();
    await x.wait({ ...quiet, 'lab.r': m => { drawR(m); seen.add(m); aim(); if (seen.has('b') && seen.has('c')) return true; } });
    x.untarget();
    await x.ok('Les barres classent bien des noms longs. Les colonnes conviennent aussi, surtout pour une suite de dates.');
    show(3);
    await x.pixel('L’axe X est horizontal, l’axe Y vertical. Entre barres et colonnes, les catégories et les valeurs échangent leur axe.');
    await x.pixel('Dans Power BI, les zones du visuel suivent ce changement : les catégories vont sur l’axe Y d’un graphique à barres, sur l’axe X d’un histogramme.');
    show(4); drawL('0');
    await x.pixel('Une légende répartit les valeurs en plusieurs séries, selon les catégories d’un champ.');
    x.todo('Ajoute la légende Attraction.');
    x.target($('[data-g="l"] [data-v="1"]', card));
    await x.wait({ ...quiet, 'lab.l': m => { drawL(m); if (m === '1') return true; } });
    x.untarget();
    await x.ok('Deux séries, une par attraction. La légende n’ajoute ni table ni mesure : elle découpe les mêmes valeurs.');
    show(5); drawZ('0');
    await x.say('lola', 'Si Dragon est un peu devant Pirates, peut-on changer l’échelle pour rendre l’écart plus spectaculaire ?');
    await x.pixel('Ce serait trompeur. Regarde plutôt.');
    x.todo('Tronque l’axe pour voir l’effet.');
    x.target($('[data-g="z"] [data-v="1"]', card));
    await x.wait({ ...quiet, 'lab.z': m => { drawZ(m); if (m === '1') return true; } });
    x.untarget();
    await x.pixel('Pour les barres et les colonnes de cette mission, l’axe des valeurs commencera toujours à zéro.');
  },

  exs: [
    /* 1 — Les données des attractions arrivent */
    { async run(x) {
      K.ready(x, 'page_001');
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('oscar', 'Cette fois-ci, les données sont déjà bien structurées. Tu devrais pouvoir les intégrer rapidement.');
      await x.pixel('Importer un CSV, contrôler ses types : tu sais faire. Je te laisse réutiliser ces gestes sans te guider à chaque clic.');
      let stage = 'get', csv = null, q = null;
      const audited = new Set();
      const colT = n => { if (!q) return null; const c = PBI.evalQuery(q).cols.find(c => c.n === n); return c ? c.t : null; };
      const typesOk = () => COLS.every(([n, t]) => colT(n) === t);
      const FILES = [
        { id: SRC, nom: FILE, type: 'csv', date: '06/06/2026' },
        { id: 'f_freq', nom: 'Frequentation_Wonderland.csv', type: 'csv', date: '06/06/2026', err: 'Remplacement du registre des entrées' },
        { id: 'f_billet', nom: 'Billetterie_Wonderland.xlsx', type: 'xlsx', date: '06/06/2026', fb: 'Ce classeur est déjà connecté : c’est notre billetterie.' },
        { id: 'f_maint', nom: 'Maintenance_Attractions.xlsx', type: 'xlsx', date: '05/06/2026', fb: 'Ce fichier recense les interventions techniques, pas les passages.' },
        { id: 'f_affiches', nom: 'Affiches_Campagne.pdf', type: 'pdf', date: '04/06/2026', fb: 'Ce sont les affiches de Lola, pas les statistiques d’Oscar.' }
      ];
      const next = () => {
        if (stage === 'get') {
          x.todo('Importe Frequentation_Attractions.csv avec le connecteur adapté.');
          x.guide(pbi.dlgKind === 'getdata' ? ['[data-c="csv"]', '[data-d="connect"]'] : pbi.dlgKind === 'open' ? [`[data-f="${SRC}"]`, '[data-d="open"]'] : '[data-a="cmd:get"]');
          return;
        }
        if (stage === 'csv') {
          if (csv.delim !== ';') { x.todo('Vérifie l’aperçu : le fichier doit donner cinq colonnes distinctes.'); x.guide(['[data-x="delim"]', '.menu [data-k=";"]']); return; }
          if (csv.enc !== 65001) { x.todo('Vérifie les accents : « Découverte » doit rester lisible.'); x.guide(['[data-x="enc"]', '.menu [data-k="65001"]']); return; }
          x.todo('L’aperçu est correct. Contrôle maintenant les types dans Power Query.'); x.guide('[data-d="transform"]');
          return;
        }
        const left = COLS.find(([n]) => !audited.has(n));
        if (left) { x.todo(`Contrôle les cinq types : touche chaque en-tête de Frequentation_Attractions (${audited.size}/5).`); x.guide(`[data-a="pqcol:${left[0]}"]`); return; }
        const bad = COLS.find(([n, t]) => colT(n) !== t);
        if (bad) { x.todo(`${bad[0]} doit être de type ${TNOM(bad[1])}.`); x.guide([`[data-a="pqtype:${bad[0]}"]`, `.menu [data-k="${bad[1]}"]`]); return; }
        x.todo('Les cinq types sont conformes : ferme Power Query en appliquant les changements.'); x.guide('[data-q="cmd:apply"]');
      };
      next();
      const later = () => { setTimeout(next, 0); };
      await x.wait({
        view: v => v !== 'report' ? x.oops('', 'Reste dans la vue Rapport pendant l’importation.') : undefined,
        tab: () => {}, pane: () => {}, page: () => {}, canvas: () => {}, visual: () => {}, field: () => {}, 'table.select': () => {},
        cmd: c => {
          if (c === 'get') { if (stage !== 'get') return; pbi.getData(); later(); return; }
          if (c === 'excel') return x.oops('Connecteur Excel sélectionné');
          if (c === 'transform') return x.oops('', stage === 'get' ? 'Le fichier d’Oscar n’est pas encore connecté : commence par Obtenir les données.' : 'Utilise le bouton Transformer les données de l’aperçu.');
          if (c === 'relations') return x.oops('Création d’une relation automatique');
          return x.oops('', 'Concentre-toi sur l’importation du fichier d’Oscar.');
        },
        'model.tool': () => x.oops('Création d’une relation automatique'),
        'file.menu': () => {}, file: k => k === 'back' ? undefined : x.oops('', 'Reste dans le projet Wonderland_Pilotage.'),
        'connector.pick': () => {},
        connector: c => {
          if (!c) return x.oops('', 'Sélectionne d’abord un connecteur.');
          if (c === 'csv') { pbi.filePicker(FILES); later(); return; }
          return x.oops(c === 'excel' ? 'Connecteur Excel sélectionné' : '', 'Ce connecteur ne lit pas les fichiers texte.');
        },
        'file.pick': () => {},
        'file.open': id => {
          if (!id) return x.oops('', 'Sélectionne d’abord un fichier.');
          const f = FILES.find(f => f.id === id);
          if (f.err || f.fb) return x.oops(f.err || '', f.fb);
          csv = pbi.csvDialog({ file: FILE, text: CSV, enc: 1252, delim: ',' }); stage = 'csv'; later();
        },
        'dialog.cancel': () => { later(); },
        'csv.enc': () => { later(); }, 'csv.delim': () => { later(); }, 'csv.detect': () => {}, 'csv.row': () => {},
        'csv.load': ({ st }) => {
          if (st.delim !== ';') return x.oops('Mauvais délimiteur');
          if (st.enc !== 65001) return x.oops('Mauvais encodage');
          return x.oops('', 'Oscar a été clair : contrôle les types avant de charger. Choisis Transformer les données.');
        },
        'csv.transform': () => {
          if (csv.delim !== ';') return x.oops('Mauvais délimiteur');
          if (csv.enc !== 65001) return x.oops('Mauvais encodage');
          q = makeQuery(csv.detect); pbi.closeDialog(true);
          const qs = P().queries.concat(q);
          pbi.openPQ(qs, { label: 'Wonderland_Pilotage', cur: qs.length - 1 }); stage = 'pq'; later();
        },
        'csv.cancel': () => { stage = 'get'; later(); }, 'csv.close': () => { stage = 'get'; later(); },
        'pq.query': () => { later(); },
        'pq.col': ({ col, query }) => { if (q && query === q.name) audited.add(col); later(); },
        'pq.step': () => {}, 'pq.steps': () => {}, 'pq.err': () => {},
        'pq.typeTry': ({ col, type, query }) => {
          if (!q || query !== q.name) return x.oops(query === 'Frequentation_Wonderland' ? 'Remplacement du registre des entrées' : '', 'Les deux tables existantes sont déjà auditées : ne modifie que Frequentation_Attractions.');
          const w = WANT[col];
          if (type === w) return;
          if (col === 'Passages' && type === 'text') return x.oops('Passages en Texte');
          if (col === 'Date_Passage' && type === 'text') return x.oops('Date_Passage en Texte');
          return x.oops('', `${col} doit être de type ${TNOM(w)}.`);
        },
        'pq.type': () => { later(); }, 'pq.change': () => { later(); },
        'pq.delstep': ({ query }) => { if (!q || query !== q.name) return x.oops('', 'Ne touche pas aux étapes des tables existantes.'); later(); },
        'pq.replaceTry': () => x.oops('', 'Les valeurs d’Oscar sont correctes : aucune ne doit être remplacée.'),
        'pq.replaceNoCol': () => x.oops('', 'Aucune valeur ne doit être remplacée ici.'),
        'pq.filterTry': () => x.oops('', 'Garde les vingt lignes : aucun filtre n’est nécessaire.'),
        'pq.cmd': () => x.oops('', 'Aucune transformation n’est nécessaire : contrôle simplement les types.'),
        'pq.close': () => x.oops('', 'Ferme avec Fermer et appliquer, pour charger la nouvelle table.'),
        'pq.apply': () => {
          if (audited.size < 5) return x.oops('', `Contrôle d’abord les cinq colonnes (${audited.size}/5).`);
          if (colT('Passages') === 'text') return x.oops('Passages en Texte');
          if (colT('Date_Passage') === 'text') return x.oops('Date_Passage en Texte');
          if (!typesOk()) return x.oops('', 'Un type ne correspond pas encore au dictionnaire des données.');
          importAttractions(P(), q); pbi.applyPQ(); pbi.closePQ(); pbi.loading('Chargement de Frequentation_Attractions dans le modèle…', 20);
          return true;
        }
      });
      x.guide();
      await x.wait({ 'load.done': () => true, 'load.cancel': () => x.oops('', 'Laisse le chargement se terminer.') });
      pbi.st.pane = 'Données'; pbi.render(); pbi.mark('.panes');
      await x.ok('Une troisième table rejoint le modèle : Frequentation_Attractions. Les deux autres n’ont pas bougé.');
      pbi.mark();
      x.todo('Ouvre la vue Table et sélectionne Frequentation_Attractions.');
      x.guide(pbi.st.view !== 'table' ? '[data-a="view:table"]' : `[data-a="tsel:${A}"]`);
      await x.wait({
        view: v => { if (v === 'table') { x.guide(`[data-a="tsel:${A}"]`); return; } if (v === 'model') return x.oops('', 'Commence par la vue Table : on vérifie les lignes.'); },
        'table.select': id => { if (pbi.st.view !== 'table') return; if (id !== A) return x.oops('', 'Sélectionne la nouvelle table, Frequentation_Attractions.'); return true; },
        tab: () => {}, pane: () => {}, field: () => {}, 'col.select': () => {}, row: () => {},
        cmd: c => c === 'relations' ? x.oops('Création d’une relation automatique') : x.oops('', 'Vérifie simplement la table.'),
        'model.tool': () => x.oops('Création d’une relation automatique')
      });
      x.guide();
      x.todo('Remplis la fiche de contrôle de la nouvelle table.');
      await x.inputs({
        lbl: 'Fiche de contrôle', q: 'Que contient Frequentation_Attractions ?', btn: 'Valider les comptes',
        fields: [{ id: 'l', label: 'Nombre de lignes' }, { id: 'c', label: 'Nombre de colonnes' }],
        check: ({ l, c }) => {
          if (l === null || c === null) return ['', 'Renseigne les deux nombres.'];
          if (l === 50) return ['', 'La table compte moins de lignes que de passages : relis le nombre indiqué au-dessus de la table.'];
          if (l !== 20) return ['', 'Relis le nombre de lignes indiqué au-dessus de la table.'];
          if (c !== 5) return ['', 'Compte les en-têtes, de ID_Stat à Passages.'];
          return true;
        }
      });
      await x.ask('20 lignes, mais Oscar annonce 50 passages. Comment l’expliquer ?', [
        { t: 'Il y a 20 passages : Oscar s’est trompé', err: 'Vingt passages annoncés' },
        { t: 'Chaque ligne résume une journée d’une attraction, avec plusieurs passages', ok: true },
        { t: 'Il manque 30 lignes dans l’importation', msg: 'Rien ne manque : la colonne Passages donne la quantité de chaque ligne.' }
      ]);
      K.ready(x, 'page_001');
      await x.ok('Trois sources, trois tables, aucune relation. Un nouveau bâtiment s’illumine sur la carte de Wonderland.');
    }, avance: P => { importAttractions(P); P.dirty = true; } },

    /* 2 — Quel graphique choisir ? */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001');
      await x.say('lola', 'Je veux comparer les attractions, suivre leur fréquentation jour après jour, et comprendre comment elles composent chaque journée.');
      await x.say('lola', 'Quel type de graphique pour chacune de ces questions ?');
      const B = K.matching({
        title: 'Laboratoire · Choix des visualisations', intro: 'Associe chaque question de Lola au visuel le plus adapté.', placeholder: 'Choisir un visuel', btn: 'Présenter mes choix', plain: true,
        options: [['card', 'Carte'], ['table', 'Tableau'], ['bar', 'Barres horizontales'], ['column', 'Colonnes simples'], ['stacked', 'Colonnes empilées'], ['stacked100', 'Colonnes empilées 100 %'], ['pie', 'Secteurs']],
        rows: [{ id: 'q1', label: 'Classer les attractions par nombre de passages' }, { id: 'q2', label: 'Comparer les passages des cinq journées successives' }, { id: 'q3', label: 'Observer le total quotidien et sa composition par attraction' }]
      });
      x.app('choix', B.el);
      x.todo('Choisis un visuel pour chacune des trois questions.');
      const W = { q1: 'bar', q2: 'column', q3: 'stacked' };
      const ERR = {
        q1: { card: 'Carte pour comparer quatre attractions', table: 'Tableau pour la demande de classement visuel' },
        q2: { pie: 'Graphique en secteurs pour les cinq journées', stacked100: 'Graphique 100 % empilé pour les volumes quotidiens' },
        q3: { column: 'Colonnes simples pour la composition par attraction', stacked100: 'Graphique 100 % empilé pour les volumes quotidiens' }
      };
      const FB = {
        q1: 'Pour classer quatre attractions, cherche un visuel où les longueurs se comparent d’un coup d’œil.',
        q2: 'Cinq journées dans l’ordre : un visuel vertical les aligne de gauche à droite.',
        q3: 'Il faut lire le total de chaque jour et la part de chaque attraction dans la même colonne.'
      };
      await x.wait({
        'match.pick': () => {},
        'match.check': ({ values }) => {
          const ks = Object.keys(W);
          if (ks.some(k => !values[k])) return x.oops('', 'Choisis un visuel pour chaque question.');
          const bad = ks.filter(k => values[k] !== W[k]);
          B.mark(ks.filter(k => !bad.includes(k)), bad);
          if (!bad.length) { B.lock(); return true; }
          return x.oops((ERR[bad[0]] || {})[values[bad[0]]] || '', FB[bad[0]]);
        }
      });
      await x.ok('Barres pour classer, colonnes pour suivre les jours, colonnes empilées pour la composition.');
      await x.pixel('C’est le cahier des charges de Wonderland. D’autres choix existent : une courbe, par exemple, suit très bien une évolution dans le temps.');
      x.app('pbi');
      await x.pixel('Ces graphiques auront leur propre page. Les cartes et les tableaux restent où ils sont.');
      const p3 = () => P().pages.find(p => p.id === 'page_003');
      const ok = () => { const p = p3(); return !!p && K.norm(p.name) === K.norm('Attractions') && P().pages.length === 3 && K.pageOf(x, 'page_001').visuals.length === 6 && K.pageOf(x, 'page_002').visuals.length === 1; };
      const next = () => {
        const p = p3();
        if (!p) { x.todo('Ajoute une troisième page au rapport.'); x.guide('.ptab-add'); return; }
        if (K.norm(p.name) !== K.norm('Attractions')) { x.todo('Renomme la nouvelle page « Attractions ».'); x.guide(P().activePage !== 'page_003' ? '[data-a="ptab:page_003"]' : ['[data-a="ptab:page_003"]', '.menu [data-k="rename"]']); }
      };
      next();
      const later = () => { setTimeout(() => { if (ok()) PBQ.act('ok.state'); else next(); }, 0); };
      const base = K.guard(x, OLD);
      await x.wait(K.guard(x, OLD, {
        'ok.state': () => ok() ? true : undefined,
        cmd: c => {
          if (c === 'newpage') { if (p3()) return x.oops('', 'Une seule nouvelle page suffit.'); const p = pbi.newPage(); p.id = 'page_003'; p.slots = clone(SLOTS3); P().activePage = 'page_003'; pbi.render(); later(); return; }
          return base.cmd(c);
        },
        'page.del': id => id === 'page_003' ? x.oops('', 'Garde la nouvelle page : renomme-la plutôt.') : x.oops(id === 'page_002' ? 'Suppression de Détail des ventes' : 'Remplacement des quatre cartes', 'Garde cette page.'),
        'page.renameStart': id => id !== 'page_003' ? x.oops('', 'Garde le nom de cette page : renomme seulement la nouvelle.') : undefined,
        'page.rename': ({ id, name }) => {
          if (id !== 'page_003') return x.oops('', 'Garde le nom de cette page.');
          if (/^page\s*\d*$/i.test(name.trim())) return x.oops('Création d’une nouvelle page nommée Page 3');
          later();
        },
        page: () => { later(); },
        'viz.create': () => P().activePage === 'page_001' ? x.oops('Remplacement des quatre cartes') : x.oops(p3() && K.norm(p3().name) !== K.norm('Attractions') ? 'Création d’une nouvelle page nommée Page 3' : '', 'Les graphiques viendront juste après : nomme d’abord la page.'),
        'vis.delete': p => OLD.slice(0, 4).includes(p.vis) ? x.oops('Remplacement des quatre cartes') : x.oops('', 'Garde ce visuel : il fait partie du rapport.')
      }));
      x.guide();
      await x.ok('Trois pages : Vue générale, Détail des ventes et Attractions, encore vide.');
    }, avance: P => addPage3(P) },

    /* 3 — Le classement des attractions */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_003'); pbi.st.xsel = null; pbi.st.selVis = null; pbi.render();
      await x.say('lola', 'Commençons par identifier notre attraction la plus fréquentée. Je veux comprendre le classement en un seul regard.');
      await x.pixel('Un graphique à barres groupées fera l’affaire. Avec une seule série, chaque attraction aura sa barre.');
      const want = { Dragon: 18, Pirates: 14, 'Wonder Wheel': 10, 'Sky Tower': 8 };
      const ok = () => {
        const v = tempChart(x); if (!v || v.type !== 'bar') return false;
        if (v.f.axis.length !== 1 || !isF(v.f.axis[0], 'Attraction', 'none') || v.f.values.length !== 1 || !isF(v.f.values[0], 'Passages', 'sum') || v.f.legend.length) return false;
        const m = byCat(pure(x, v));
        return Object.keys(m).length === 4 && Object.entries(want).every(([k, n]) => m[k] === n) && K.titleIs(v, 'Passages par attraction');
      };
      const next = () => {
        const v = tempChart(x);
        if (!v) { x.todo('Sur la page Attractions, crée un graphique à barres groupées.'); x.guide(createG(x, 'bar')); return; }
        if (v.type !== 'bar') { x.todo('Transforme ce visuel en graphique à barres groupées.'); x.guide(selG(x, v, '[data-a="vtype:bar"]')); return; }
        if (!v.f.axis.length) { x.todo('Place Attraction sur l’axe Y.'); x.guide(champsG(x, v, ['[data-a="well:axis"]', `.menu [data-k="${A}|Attraction"]`])); return; }
        if (!v.f.values.length) { x.todo('Place Passages sur l’axe X.'); x.guide(champsG(x, v, ['[data-a="well:values"]', `.menu [data-k="${A}|Passages"]`])); return; }
        if (v.f.values[0].agg !== 'sum') { x.todo('Choisis la Somme de Passages.'); x.guide(champsG(x, v, ['[data-a="chip:values|0"]', '.menu [data-k="agg:sum"]'])); return; }
        x.todo('Nomme le graphique « Passages par attraction ».'); x.guide(fmtG(x, v, '[data-f="title"]'));
      };
      next();
      const later = () => { setTimeout(next, 0); };
      await x.wait(K.guard(x, OLD, {
        page: later, pane: later, canvas: later, visual: later,
        'viz.create': ({ type }) => {
          if (P().activePage !== 'page_003') return x.oops('', 'Ce graphique va sur la page Attractions.');
          if (tempChart(x)) return x.oops('', 'Un seul graphique pour ce classement : complète celui que tu as créé.');
          if (type !== 'bar') return x.oops('', type === 'column' ? 'Lola veut un classement horizontal : choisis le graphique à barres groupées.' : 'Choisis le graphique à barres groupées.');
          later();
        },
        'viz.type': p => OLD.includes(p.vis) ? noTouch(x) : p.type !== 'bar' ? x.oops('', 'Garde le graphique à barres groupées.') : undefined,
        'well.add': p => {
          if (OLD.includes(p.vis)) return noTouch(x);
          const f = p.field;
          if (f.t === 'tbl_frequentation') return x.oops('Utilisation de la table des portiques');
          if (f.t !== A) return x.oops('', 'Les passages viennent de la troisième table, Frequentation_Attractions.');
          if (p.well === 'legend') return x.oops('', 'Laisse la légende vide : une seule série suffit.');
          if (p.well === 'axis') {
            if (f.c === 'Passages') return x.oops('Passages sur l’axe des catégories');
            if (f.c === 'Date_Passage') return x.oops('Date_Passage comme catégorie');
            if (f.c === 'Type_Attraction') return x.oops('Type_Attraction à la place d’Attraction');
            if (f.c !== 'Attraction') return x.oops('', 'Les catégories sont les noms des attractions.');
          }
          if (p.well === 'values') {
            if (f.c === 'Attraction') return x.oops('Attraction sur l’axe numérique');
            if (f.c !== 'Passages') return x.oops('', 'L’axe X mesure les passages.');
          }
        },
        'well.agg': p => {
          if (OLD.includes(p.vis)) return noTouch(x);
          if (p.agg === 'count') return x.oops('Nombre de Passages');
          if (p.agg === 'avg') return x.oops('Moyenne de Passages');
          if (p.agg === 'countd') return x.oops('Nombre distinct de Passages');
          if (p.agg !== 'sum') return x.oops('', 'Additionne les passages : choisis la Somme.');
        },
        'viz.fmt': p => {
          if (OLD.includes(p.vis)) return noTouch(x);
          if ((p.key === 'title' || p.key === 'axisTitle') && /visiteur|personne/i.test(p.value || '')) return x.oops('', 'Ce graphique compte des passages, pas des visiteurs.');
        },
        'vis.sort': () => {},
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide();
      const v = tempChart(x); v.id = 'vis_107_attraction_bars'; v.temp = false; Object.assign(v, geo(SLOTS3[0])); pbi.st.selVis = null; pbi.st.xsel = null; pbi.render();
      await x.ok('Dragon 18, Pirates 14, Wonder Wheel 10, Sky Tower 8 : les 50 passages d’Oscar. Pour l’instant, l’ordre ne dit rien du classement.');
    }, avance: P => addBars(P, 1) },

    /* 4 — Un classement lisible et honnête */
    { async run(x) {
      const pbi = x.pbi;
      K.ready(x, 'page_003'); pbi.st.xsel = null;
      const v = K.visOf(x, 'vis_107_attraction_bars');
      pbi.st.selVis = v.id; pbi.st.pane = 'Visualisations'; pbi.st.vzTab = 'format'; pbi.render();
      await x.say('victoria', 'Je vois les quatre attractions, mais j’aimerais que la plus fréquentée apparaisse en premier.');
      await x.say('victoria', 'Et je ne veux pas devoir survoler chaque barre pour lire les chiffres.');
      await x.pixel('Réglons le tri, les étiquettes, les décimales, la couleur et le titre de l’axe.');
      const G = CHARTE.Dragon;
      const col = () => ((v.fmt.colors || {})['Somme de Passages'] || '').toLowerCase();
      const STEPS = [
        [() => !!v.sort && v.sort.by === 'value' && v.sort.dir === 'desc', 'Trie l’axe sur Somme de Passages, par ordre décroissant : menu ⋯ du visuel.', () => menuG(x, v, ['.vbar .vmore', '.menu [data-k="s:value:desc"]'])],
        [() => !!v.fmt.labels, 'Dans Format, active les étiquettes de données.', () => fmtG(x, v, '[data-a="fmttog:labels"]')],
        [() => v.fmt.dec === 0, 'Règle les décimales sur 0.', () => fmtG(x, v, ['[data-a="fmtsel:dec"]', '.menu [data-k="0"]'])],
        [() => col() === G, 'Colore les barres en Or Wonderland.', () => fmtG(x, v, ['[data-a="fmtcol:Somme de Passages"]', `.menu [data-c="${G}"]`])],
        [() => K.norm(v.fmt.axisTitle || '') === K.norm('Nombre de passages'), 'Donne un titre à l’axe des valeurs : « Nombre de passages ».', () => fmtG(x, v, '[data-f="axisTitle"]')]
      ];
      const ok = () => {
        if (!STEPS.every(s => s[0]()) || v.fmt.zero === false || (v.fmt.units || 'none') !== 'none' || v.f.legend.length || !K.titleIs(v, 'Passages par attraction')) return false;
        const d = pure(x, v);
        return !!d && eq(d.cats, ORDER) && eq(d.series[0].values, [18, 14, 10, 8]);
      };
      const next = () => { const s = STEPS.find(s => !s[0]()); if (!s) return; x.todo(s[1]); x.guide(s[2]()); };
      next();
      const later = () => { setTimeout(next, 0); };
      await x.wait(K.guard(x, OLD, {
        page: later, pane: later, canvas: later, visual: later,
        'vis.sort': p => {
          if (p.vis !== v.id) return;
          if (p.by === 'axis') return x.oops('Tri alphabétique');
          if (p.dir === 'asc') return x.oops('Tri croissant');
        },
        'viz.fmt': p => {
          if (OLD.includes(p.vis)) return noTouch(x);
          if (p.vis !== v.id) return;
          if (p.key === 'labels' && !p.value) return x.oops('Étiquettes désactivées');
          if (p.key === 'zero' && p.value === false) return x.oops('Axe numérique commençant à 7');
          if (p.key === 'dec' && p.value !== 0) return x.oops(p.value === 2 ? 'Deux décimales affichées' : '', 'Les passages sont des quantités entières : 0 décimale.');
          if (p.key === 'units' && p.value !== 'none') return x.oops('', 'Garde les nombres exacts : aucune unité d’affichage.');
          if ((p.key === 'title' || p.key === 'axisTitle') && /visiteur|unique|personne/i.test(p.value || '')) return x.oops('Titre Nombre de visiteurs uniques');
          if (p.key === 'title' && !K.titleIs({ title: p.value }, 'Passages par attraction')) return x.oops('', 'Garde le titre « Passages par attraction ».');
          if (p.key === 'colors') { const c = ((p.value || {})['Somme de Passages'] || '').toLowerCase(); if (c && c !== G) return x.oops('', 'La couleur principale de Wonderland, c’est l’Or Wonderland.'); }
        },
        'well.add': p => p.vis === v.id ? (p.well === 'legend' ? x.oops('Légende ajoutée inutilement') : x.oops('', 'Les champs sont prêts : règle seulement le tri et le format.')) : undefined,
        'well.agg': p => p.vis === v.id ? x.oops('', 'Garde la Somme de Passages.') : undefined,
        'well.remove': p => p.vis === v.id ? x.oops('', 'Garde les deux champs du graphique.') : undefined,
        'well.rename': p => p.vis === v.id ? x.oops('', 'Garde les noms des champs.') : undefined,
        'viz.type': p => p.vis === v.id || OLD.includes(p.vis) ? x.oops('', 'Garde le graphique à barres groupées.') : undefined,
        'viz.create': () => x.oops('', 'Améliore le graphique existant, sans en créer un autre.'),
        'vis.delete': p => p.vis === v.id || OLD.includes(p.vis) ? x.oops('', 'Garde ce visuel : il fait partie du rapport.') : undefined,
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide(); pbi.st.selVis = null; pbi.st.xsel = null; pbi.render();
      await x.ok('Dragon passe en tête avec 18 passages, puis Pirates, Wonder Wheel et Sky Tower. L’axe part de zéro : les longueurs restent honnêtes.');
    }, avance: P => addBars(P, 2) },

    /* 5 — Une fréquentation qui évolue */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_003'); pbi.st.xsel = null; pbi.st.selVis = null; pbi.render();
      await x.say('oscar', 'Le classement est intéressant, mais je dois prévoir les équipes selon la fréquentation de chaque jour.');
      await x.say('oscar', 'Peux-tu me montrer les passages jour après jour ?');
      await x.pixel('Utilisons un histogramme groupé : chaque colonne représentera une journée.');
      const KEEP = OLD.concat('vis_107_attraction_bars');
      const ok = () => {
        const v = tempChart(x); if (!v || v.type !== 'column') return false;
        if (v.f.axis.length !== 1 || !isF(v.f.axis[0], 'Date_Passage', 'none') || v.f.axis[0].hier || v.f.values.length !== 1 || !isF(v.f.values[0], 'Passages', 'sum') || v.f.legend.length) return false;
        if (v.sort && (v.sort.by !== 'axis' || v.sort.dir !== 'asc')) return false;
        const d = pure(x, v);
        return !!d && eq(d.cats, DAYS) && eq(d.series[0].values, [6, 10, 7, 12, 15]) && K.titleIs(v, 'Passages quotidiens dans les attractions');
      };
      const next = () => {
        const v = tempChart(x);
        if (!v) { x.todo('Crée un histogramme groupé sur la page Attractions.'); x.guide(createG(x, 'column')); return; }
        if (v.type !== 'column') { x.todo('Transforme ce visuel en histogramme groupé.'); x.guide(selG(x, v, '[data-a="vtype:column"]')); return; }
        if (!v.f.axis.length) { x.todo('Place Date_Passage sur l’axe X.'); x.guide(champsG(x, v, ['[data-a="well:axis"]', `.menu [data-k="${A}|Date_Passage"]`])); return; }
        if (!v.f.values.length) { x.todo('Place Passages sur l’axe Y.'); x.guide(champsG(x, v, ['[data-a="well:values"]', `.menu [data-k="${A}|Passages"]`])); return; }
        if (v.f.axis[0].hier) { x.todo('Une seule colonne pour 2026 : choisis Date_Passage elle-même, pas sa hiérarchie.'); x.guide(champsG(x, v, ['[data-a="chip:axis|0"]', '.menu [data-k="raw"]'])); return; }
        if (v.f.values[0].agg !== 'sum') { x.todo('Choisis la Somme de Passages.'); x.guide(champsG(x, v, ['[data-a="chip:values|0"]', '.menu [data-k="agg:sum"]'])); return; }
        if (v.sort && (v.sort.by !== 'axis' || v.sort.dir !== 'asc')) { x.todo('Remets les dates dans l’ordre chronologique.'); x.guide(menuG(x, v, ['.vbar .vmore', '.menu [data-k="s:axis:asc"]'])); return; }
        x.todo('Nomme le graphique « Passages quotidiens dans les attractions ».'); x.guide(fmtG(x, v, '[data-f="title"]'));
      };
      next();
      const later = () => { setTimeout(next, 0); };
      const mine = id => (tempChart(x) || {}).id === id;
      await x.wait(K.guard(x, KEEP, {
        page: later, pane: later, canvas: later, visual: later,
        'viz.create': ({ type }) => {
          if (P().activePage !== 'page_003') return x.oops('', 'Ce graphique va sur la page Attractions.');
          if (tempChart(x)) return x.oops('', 'Complète le graphique que tu as créé.');
          if (type !== 'column') return x.oops('', type === 'bar' ? 'Oscar veut voir les journées de gauche à droite : choisis l’histogramme groupé.' : 'Choisis l’histogramme groupé.');
          later();
        },
        'viz.type': p => KEEP.includes(p.vis) ? noTouch(x) : p.type !== 'column' ? x.oops('', 'Garde l’histogramme groupé.') : undefined,
        'well.add': p => {
          if (!mine(p.vis)) return noTouch(x);
          const f = p.field;
          if (f.t !== A) return x.oops(f.t === 'tbl_frequentation' ? 'Utilisation de la table des portiques' : '', 'Les passages viennent de Frequentation_Attractions.');
          if (p.well === 'legend') return x.oops('', 'Laisse la légende vide : une seule série suffit.');
          if (p.well === 'axis' && f.c === 'Attraction') return x.oops('Attraction sur l’axe X');
          if (p.well === 'axis' && f.c !== 'Date_Passage') return x.oops('', 'Les journées viennent de Date_Passage.');
          if (p.well === 'values' && f.c !== 'Passages') return x.oops('', 'L’axe Y mesure les passages.');
        },
        'well.agg': p => {
          if (!mine(p.vis)) return noTouch(x);
          if (p.agg === 'count') return x.oops('Nombre de Passages');
          if (p.agg === 'avg') return x.oops('Moyenne de Passages');
          if (p.agg !== 'sum') return x.oops('', 'Additionne les passages : choisis la Somme.');
        },
        'well.hier': p => { if (!mine(p.vis)) return noTouch(x); if (p.hier) return x.oops('Hiérarchie annuelle utilisée'); },
        'vis.sort': p => {
          if (!mine(p.vis)) return KEEP.includes(p.vis) ? noTouch(x) : undefined;
          if (p.by === 'value') return x.oops('Tri par nombre de passages décroissant');
          if (p.dir === 'desc') return x.oops('', 'Le graphique doit respecter la chronologie : dates croissantes.');
        },
        'viz.fmt': p => {
          if (KEEP.includes(p.vis)) return noTouch(x);
          if (p.key === 'zero' && p.value === false) return x.oops('', 'Garde l’axe des valeurs à zéro.');
          if ((p.key === 'title' || p.key === 'axisTitle') && /visiteur|personne/i.test(p.value || '')) return x.oops('', 'Ce graphique compte des passages, pas des visiteurs.');
        },
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide();
      const v = tempChart(x); v.id = 'vis_107_daily_columns'; v.temp = false; v.sort = null; Object.assign(v, geo(SLOTS3[1])); pbi.st.selVis = null; pbi.st.xsel = null; pbi.render();
      await x.ask('Quelle journée a enregistré le plus de passages ?', [
        { t: 'Le 05/06, avec 15 passages', ok: true },
        { t: 'Le 05/06, avec 15 visiteurs uniques', err: '5 juin identifié comme 15 visiteurs uniques' },
        { t: 'Le 04/06, avec 12 passages', msg: 'Le 4 juin arrive juste derrière. Regarde la dernière colonne.' }
      ]);
      await x.pixel('Remarque aussi le 3 juin : les passages reculent de 10 à 7, avant de remonter.');
      await x.ask('D’où vient ce recul du 3 juin ?', [
        { t: 'D’une panne sur une attraction', err: 'Baisse du 3 juin attribuée à une panne' },
        { t: 'De la pluie, qui a découragé les visiteurs', msg: 'Rien dans nos données ne parle de la météo.' },
        { t: 'Nos données ne permettent pas de le savoir', ok: true }
      ]);
      await x.say('oscar', 'D’accord. Je noterai la question pour l’équipe, sans tirer de conclusion hâtive.');
    }, avance: P => addColumns(P, 1) },

    /* 6 — Les attractions se partagent les journées */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_003'); pbi.st.xsel = null; pbi.st.selVis = null; pbi.render();
      await x.say('lola', 'Le 5 juin a été notre journée la plus fréquentée. Mais quelles attractions ont contribué à ces quinze passages ?');
      await x.pixel('Ajoutons une dimension au graphique grâce à la légende. On commence par un essai en colonnes groupées.');
      const KEEP = OLD.concat('vis_107_attraction_bars', 'vis_107_daily_columns');
      const legOk = v => v.f.legend.length === 1 && isF(v.f.legend[0], 'Attraction', 'none');
      const baseOk = v => v.f.axis.length === 1 && isF(v.f.axis[0], 'Date_Passage', 'none') && !v.f.axis[0].hier && v.f.values.length === 1 && isF(v.f.values[0], 'Passages', 'sum');
      let phase = 1;
      const ok1 = () => { const v = tempChart(x); return !!v && v.type === 'column' && baseOk(v) && legOk(v); };
      const ok2 = () => {
        const v = tempChart(x); if (!v || v.type !== 'stacked' || !baseOk(v) || !legOk(v) || !K.titleIs(v, 'Répartition quotidienne par attraction')) return false;
        const d = pure(x, v);
        return !!d && eq(d.cats, DAYS) && d.series.length === 4 && eq(d.cats.map((_, i) => d.series.reduce((a, s) => a + s.values[i], 0)), [6, 10, 7, 12, 15]);
      };
      const next = () => {
        const v = tempChart(x);
        if (!v) { x.todo('Crée un histogramme groupé : il servira de laboratoire.'); x.guide(createG(x, 'column')); return; }
        if (phase === 1) {
          if (v.type !== 'column') { x.todo('Commence par un histogramme groupé.'); x.guide(selG(x, v, '[data-a="vtype:column"]')); return; }
          if (!v.f.axis.length) { x.todo('Axe X : Date_Passage.'); x.guide(champsG(x, v, ['[data-a="well:axis"]', `.menu [data-k="${A}|Date_Passage"]`])); return; }
          if (v.f.axis[0].hier) { x.todo('Choisis Date_Passage elle-même, pas sa hiérarchie.'); x.guide(champsG(x, v, ['[data-a="chip:axis|0"]', '.menu [data-k="raw"]'])); return; }
          if (!v.f.values.length) { x.todo('Axe Y : la Somme de Passages.'); x.guide(champsG(x, v, ['[data-a="well:values"]', `.menu [data-k="${A}|Passages"]`])); return; }
          x.todo('Place Attraction dans la zone Légende.'); x.guide(champsG(x, v, ['[data-a="well:legend"]', `.menu [data-k="${A}|Attraction"]`]));
          return;
        }
        if (v.type !== 'stacked') { x.todo('Transforme ce visuel en histogramme empilé.'); x.guide(selG(x, v, '[data-a="vtype:stacked"]')); return; }
        x.todo('Nomme-le « Répartition quotidienne par attraction ».'); x.guide(fmtG(x, v, '[data-f="title"]'));
      };
      const later = () => { setTimeout(next, 0); };
      const mine = id => (tempChart(x) || {}).id === id;
      const H = {
        page: later, pane: later, canvas: later, visual: later,
        cmd: c => ['newtable', 'enter', 'get', 'excel', 'transform'].includes(c) ? x.oops('Création de quatre tables différentes') : K.guard(x, KEEP).cmd(c),
        'viz.create': ({ type }) => {
          if (P().activePage !== 'page_003') return x.oops('', 'Ce graphique va sur la page Attractions.');
          if (tempChart(x)) return x.oops('Conservation de deux graphiques supplémentaires');
          if (type === 'stacked100') return x.oops('Colonnes 100 % empilées');
          if (type !== 'column') return x.oops('', phase === 1 ? 'Commence par un histogramme groupé.' : 'Transforme le visuel du laboratoire.');
          later();
        },
        'viz.type': p => {
          if (KEEP.includes(p.vis)) return noTouch(x);
          if (p.type === 'stacked100') return x.oops('Colonnes 100 % empilées');
          if (phase === 1 && p.type !== 'column') { const v = tempChart(x); if (v && !legOk(v) && p.type === 'stacked') return x.oops('Légende vide'); return x.oops('', 'D’abord l’essai en colonnes groupées, avec la légende.'); }
          if (phase === 2 && p.type !== 'stacked') return x.oops('', 'Il faut maintenant un histogramme empilé.');
          if (phase === 2) { const v = tempChart(x); if (v && !legOk(v)) return x.oops('Légende vide'); }
        },
        'well.add': p => {
          if (!mine(p.vis)) return noTouch(x);
          const f = p.field;
          if (f.t !== A) return x.oops('', 'Tout vient de Frequentation_Attractions.');
          if (p.well === 'legend') {
            if (f.c === 'Type_Attraction') return x.oops('Légende Type_Attraction');
            if (f.c === 'ID_Stat') return x.oops('Légende ID_Stat');
            if (f.c === 'Date_Passage') return x.oops('Date_Passage placée dans la légende');
            if (f.c !== 'Attraction') return x.oops('', 'La légende doit créer une série par attraction.');
          }
          if (p.well === 'axis' && f.c !== 'Date_Passage') return x.oops('', 'Les journées restent sur l’axe X.');
          if (p.well === 'values' && f.c !== 'Passages') return x.oops('', 'L’axe Y mesure les passages.');
        },
        'well.remove': p => { if (!mine(p.vis)) return noTouch(x); if (p.well === 'legend' && phase === 2) return x.oops('Légende vide'); },
        'well.agg': p => {
          if (!mine(p.vis)) return noTouch(x);
          if (p.agg === 'count') return x.oops('Somme de Passages remplacée par Nombre');
          if (p.agg !== 'sum') return x.oops('', 'Additionne les passages : choisis la Somme.');
        },
        'well.hier': p => { if (!mine(p.vis)) return noTouch(x); if (p.hier) return x.oops('', 'Garde la date elle-même : une colonne par jour.'); },
        'vis.sort': p => mine(p.vis) && p.by === 'value' ? x.oops('', 'Les journées restent dans l’ordre chronologique.') : undefined,
        'viz.fmt': p => { if (KEEP.includes(p.vis)) return noTouch(x); if (p.key === 'zero' && p.value === false) return x.oops('', 'Garde l’axe des valeurs à zéro.'); }
      };
      next();
      await x.wait(K.guard(x, KEEP, { ...H, 'viz.change': () => { if (ok1()) return true; next(); } }));
      x.guide(); phase = 2;
      await x.ok('Quatre colonnes par journée, côte à côte : on compare facilement les attractions entre elles.');
      await x.say('victoria', 'Je veux aussi lire le volume total de chaque journée, et la part de chaque attraction.');
      next();
      await x.wait(K.guard(x, KEEP, { ...H, 'viz.change': () => { if (ok2()) return true; next(); } }));
      x.guide();
      const v = tempChart(x); v.id = 'vis_107_daily_stacked'; v.temp = false; Object.assign(v, geo(SLOTS3[2])); pbi.st.selVis = null; pbi.st.xsel = null; pbi.render();
      await x.ok('Cinq journées, quatre séries, vingt valeurs : chaque colonne donne le total du jour et la part de chaque attraction.');
    }, avance: P => addStacked(P, 1) },

    /* 7 — Les couleurs de Wonderland */
    { async run(x) {
      const pbi = x.pbi;
      K.ready(x, 'page_003'); pbi.st.xsel = null; pbi.st.selVis = null; pbi.render();
      const bars = K.visOf(x, 'vis_107_attraction_bars'), cols = K.visOf(x, 'vis_107_daily_columns'), stk = K.visOf(x, 'vis_107_daily_stacked');
      await x.say('victoria', 'Les informations sont là, mais je voudrais un rapport plus professionnel.');
      await x.say('victoria', 'Des titres clairs, et des couleurs qui permettent de reconnaître les attractions au premier coup d’œil.');
      await x.pixel('Un graphique doit être agréable à lire, mais sa mise en forme sert d’abord la compréhension. Voici la charte des attractions.');
      const card = K.lesson('Charte graphique · Attractions', 'Une attraction, une couleur', `<div class="charte">${ORDER.map(a => `<div><i style="background:${CHARTE[a]}"></i><b>${esc(a)}</b><span>${esc(NAME[CHARTE[a]])}</span><small>${CHARTE[a].toUpperCase()}</small></div>`).join('')}</div><p class="lc-note">${esc(fr('Ces couleurs serviront dans tous les rapports sur les attractions. La couleur ne suffit pas : les noms, la légende et les info-bulles restent indispensables.'))}</p>`);
      x.app('charte', card);
      await x.pixel('Dragon garde l’or de Wonderland, comme dans le classement. Chaque attraction aura la même couleur partout.');
      x.app('pbi');
      const SER = ['Dragon', 'Pirates', 'Sky Tower', 'Wonder Wheel'];   // ordre des séries dans le graphique
      const eff = (all, s) => ((all || {})[s] || PBI.PAL[SER.indexOf(s) % PBI.PAL.length]).toLowerCase();
      const C = s => ((stk.fmt.colors || {})[s] || '').toLowerCase();
      const nOk = () => ORDER.filter(a => C(a) === CHARTE[a]).length;
      let tipOk = false;
      const STEPS = [
        ...ORDER.map(a => [() => C(a) === CHARTE[a], () => `Histogramme empilé : ${a} en ${NAME[CHARTE[a]]} (${nOk()}/4).`, () => fmtG(x, stk, [`[data-a="fmtcol:${a}"]`, `.menu [data-c="${CHARTE[a]}"]`])]),
        [() => !!stk.fmt.totals, () => 'Histogramme empilé : active les étiquettes de total.', () => fmtG(x, stk, '[data-a="fmttog:totals"]')],
        [() => stk.fmt.dec === 0, () => 'Histogramme empilé : règle les décimales sur 0.', () => fmtG(x, stk, ['[data-a="fmtsel:dec"]', '.menu [data-k="0"]'])],
        [() => !!cols.fmt.labels, () => 'Histogramme quotidien : active les étiquettes de données.', () => fmtG(x, cols, '[data-a="fmttog:labels"]')],
        [() => cols.fmt.dec === 0, () => 'Histogramme quotidien : règle les décimales sur 0.', () => fmtG(x, cols, ['[data-a="fmtsel:dec"]', '.menu [data-k="0"]'])],
        [() => tipOk, () => 'Dernière vérification : touche le segment Dragon de la colonne du 05/06 pour lire son info-bulle.', () => `[data-a="seg:${stk.id}|4|0"]`]
      ];
      const ok = () => STEPS.every(s => s[0]()) && !!bars.fmt.labels && bars.fmt.dec === 0 && ((bars.fmt.colors || {})['Somme de Passages'] || '').toLowerCase() === CHARTE.Dragon
        && [bars, cols, stk].every(v => v.fmt.zero !== false && (v.fmt.units || 'none') === 'none' && K.titleIs(v, TITLES[v.id])) && stk.fmt.legend !== false && !stk.fmt.labels;
      const next = () => { const s = STEPS.find(s => !s[0]()); if (!s) return; x.todo(s[1]()); x.guide(s[2]()); };
      next();
      const later = () => { setTimeout(next, 0); };
      const ours = id => [bars, cols, stk].find(o => o.id === id);
      const frozen = () => x.oops('', 'Les champs sont prêts : on ne touche qu’à la mise en forme.');
      const base = K.guard(x, OLD);
      await x.wait(K.guard(x, OLD, {
        page: later, pane: later, canvas: later, visual: later,
        cmd: c => c === 'transform' ? x.oops('Modification des valeurs sources pour améliorer le graphique') : base.cmd(c),
        view: v => v === 'table' ? x.oops('Modification des valeurs sources pour améliorer le graphique') : v !== 'report' ? x.oops('', 'Reste dans la vue Rapport.') : undefined,
        'well.add': p => ours(p.vis) ? frozen() : undefined, 'well.agg': p => ours(p.vis) ? frozen() : undefined, 'well.remove': p => ours(p.vis) ? frozen() : undefined,
        'well.hier': p => ours(p.vis) ? frozen() : undefined, 'well.rename': p => ours(p.vis) ? frozen() : undefined, 'well.move': p => ours(p.vis) ? frozen() : undefined,
        'viz.type': p => ours(p.vis) || OLD.includes(p.vis) ? x.oops('', 'Garde les trois types de graphiques.') : undefined,
        'viz.create': () => x.oops('', 'Pas de nouveau visuel : on met en forme les trois graphiques.'),
        'vis.delete': p => ours(p.vis) || OLD.includes(p.vis) ? x.oops('', 'Garde ce visuel : il fait partie du rapport.') : undefined,
        'vis.sort': p => p.vis === bars.id ? x.oops('', 'Le classement est déjà trié.') : ours(p.vis) && p.by === 'value' ? x.oops('', 'Les journées restent dans l’ordre chronologique.') : undefined,
        'viz.fmt': p => {
          if (OLD.includes(p.vis)) return noTouch(x);
          const v = ours(p.vis); if (!v) return;
          if (p.key === 'colors') {
            const all = p.value || {};
            if (v === bars) return (all['Somme de Passages'] || '').toLowerCase() !== CHARTE.Dragon ? x.oops('Couleurs différentes pour une même attraction') : undefined;
            if (v !== stk) return;
            const before = stk.fmt.colors || {};
            const s = SER.find(k => (all[k] || '').toLowerCase() !== (before[k] || '').toLowerCase()); if (!s) return;
            const c = (all[s] || '').toLowerCase();
            if (SER.some(o => o !== s && eff(all, o) === c)) return x.oops('Même couleur pour toutes les séries');
            if (s === 'Dragon' && c !== CHARTE.Dragon) return x.oops('Couleurs différentes pour une même attraction');
            if (c !== CHARTE[s]) return x.oops('', `Dans la charte, ${s} est en ${NAME[CHARTE[s]]}.`);
            return;
          }
          if (p.key === 'legend' && p.value === false) return x.oops(v === stk ? 'Légende désactivée dans le graphique empilé' : '', 'Garde la légende.');
          if (p.key === 'labels' && p.value && v === stk) return x.oops('Étiquettes de toutes les séries superposées');
          if (p.key === 'labels' && !p.value && v !== stk) return x.oops('', 'Garde les étiquettes : elles donnent les valeurs exactes.');
          if (p.key === 'totals' && !p.value) return x.oops('', 'Garde les étiquettes de total : elles donnent le volume de chaque journée.');
          if (p.key === 'units' && p.value !== 'none') return x.oops('Valeurs abrégées en milliers');
          if (p.key === 'zero' && p.value === false) return x.oops('Axe numérique tronqué');
          if (p.key === 'dec' && p.value !== 0) return x.oops('', 'Des passages se comptent en nombres entiers : 0 décimale.');
          if (p.key === 'title' && !K.titleIs({ title: p.value }, TITLES[v.id])) return x.oops('', 'Les titres sont déjà clairs : garde-les.');
          if (p.key === 'axisTitle' && v === bars && K.norm(p.value || '') !== K.norm('Nombre de passages')) return x.oops('', 'Garde le titre d’axe « Nombre de passages ».');
        },
        'chart.point': p => {
          if (p.vis !== stk.id || p.clear) return;
          if (p.cat === '2026-06-05' && p.series === 'Dragon') { tipOk = true; return; }
          if (p.cat === '2026-06-05' && p.series === 'Pirates') return x.oops('Info-bulle associée à Pirates au lieu de Dragon');
          if (STEPS.slice(0, -1).every(s => s[0]())) return x.oops('', 'Cherche la colonne du 05/06, puis son segment Dragon, tout en bas.');
        },
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide();
      await x.ask('Que t’indique l’info-bulle pour Dragon, le 5 juin ?', [
        { t: '5 passages', ok: true },
        { t: '15 passages', msg: '15, c’est le total de la journée, toutes attractions confondues.' },
        { t: '18 passages', msg: '18, c’est le total de Dragon sur les cinq jours.' }
      ]);
      await x.ok('Une charte cohérente, des axes à zéro, des totaux lisibles. Et les info-bulles donnent le détail de chaque segment.');
    }, avance: P => { addColumns(P, 2); addStacked(P, 2); } },

    /* 8 — Cinquante visiteurs ? */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_003');
      const KEEP10 = OLD.concat(NEW);
      await x.say('victoria', 'Notre parc a donc accueilli cinquante visiteurs pendant les cinq premiers jours de juin !');
      await x.pixel('Attention ! Notre registre des entrées contient 27 enregistrements. Les 50 passages dans les attractions sont un autre indicateur.');
      await x.pixel('Corrigeons cette interprétation avant la réunion. Mais d’abord, la copie d’entraînement du graphique par attraction affiche un résultat étrange.');
      if (!P().pages.some(p => p.id === 'page_lab')) P().pages.push({ id: 'page_lab', name: 'Laboratoire', temp: true, filters: [], visuals: [
        { id: 'vis_lab_bars', type: 'bar', x: 2, y: 4, w: 96, h: 92, f: { values: [fa('Passages', 'count')], axis: [fa('Attraction', 'none')], legend: [], cols: [] }, title: 'Copie d’entraînement : passages par attraction', fmt: { labels: true, dec: 0 }, temp: true }] });
      P().activePage = 'page_lab'; pbi.st.selVis = null; pbi.render();
      const lv = K.visOf(x, 'vis_lab_bars');
      const fixed = () => lv.f.values[0] && lv.f.values[0].agg === 'sum';
      const nextA = () => { x.todo('Cette copie affiche 5 pour chaque attraction. Trouve l’erreur et corrige le calcul.'); x.guide(P().activePage !== 'page_lab' ? '[data-a="ptab:page_lab"]' : champsG(x, lv, ['[data-a="chip:values|0"]', '.menu [data-k="agg:sum"]'])); };
      nextA();
      const laterA = () => { setTimeout(nextA, 0); };
      const entrees = id => id === 'vis_105_entrees' ? x.oops('Modification de la carte Entrées pour afficher 50') : noTouch(x);
      await x.wait(K.guard(x, KEEP10, {
        page: laterA, pane: laterA, visual: laterA, canvas: laterA,
        'well.agg': p => {
          if (p.vis !== lv.id) return KEEP10.includes(p.vis) ? entrees(p.vis) : undefined;
          if (p.agg === 'countd') return x.oops('', 'Nombre distinct compte les valeurs différentes, pas les quantités.');
          if (p.agg === 'avg') return x.oops('', 'La moyenne donne une journée type, pas le total des passages.');
          if (p.agg !== 'sum') return x.oops('', 'Il faut additionner les passages.');
        },
        'well.add': p => KEEP10.includes(p.vis) ? entrees(p.vis) : p.vis === lv.id ? x.oops('', 'Corrige l’agrégation, sans ajouter de champ.') : undefined,
        'well.remove': p => KEEP10.includes(p.vis) ? entrees(p.vis) : p.vis === lv.id ? x.oops('', 'Corrige l’agrégation, sans retirer de champ.') : undefined,
        'viz.fmt': p => KEEP10.includes(p.vis) ? entrees(p.vis) : undefined,
        'viz.type': p => KEEP10.includes(p.vis) ? noTouch(x) : p.vis === lv.id ? x.oops('', 'Garde le graphique à barres : seul le calcul est faux.') : undefined,
        'viz.create': () => x.oops('', 'Corrige la copie existante.'),
        'page.del': id => id === 'page_lab' ? x.oops('', 'Corrige d’abord la copie, puis tu fermeras le laboratoire.') : x.oops('Suppression d’un tableau précédent'),
        'vis.delete': p => KEEP10.includes(p.vis) ? x.oops('Suppression d’un tableau précédent') : x.oops('', 'Corrige la copie plutôt que de la supprimer.'),
        cmd: c => c === 'relations' ? x.oops('Création d’une relation entre les trois tables') : K.guard(x, KEEP10).cmd(c),
        'model.tool': () => x.oops('Création d’une relation entre les trois tables'),
        save: () => x.oops('', 'Termine l’audit avant d’enregistrer.'), 'file.menu': () => x.oops('', 'Termine l’audit avant d’enregistrer.'),
        'viz.change': () => fixed() ? true : undefined
      }));
      x.guide();
      await x.ok('18, 14, 10 et 8. Nombre comptait les cinq lignes quotidiennes de chaque attraction ; Somme additionne leurs passages.');
      const B = K.matching({
        title: 'Quatre chiffres, quatre significations', intro: 'Associe chaque indicateur du rapport à sa valeur.', placeholder: 'Choisir', btn: 'Vérifier', plain: true,
        options: [['20', '20'], ['27', '27'], ['40', '40'], ['50', '50']],
        rows: [{ id: 'lv', label: 'Lignes de vente', sub: 'Enregistrements commerciaux' }, { id: 'bv', label: 'Billets vendus', sub: 'Somme des quantités vendues' }, { id: 'ee', label: 'Entrées enregistrées', sub: 'Premières admissions validées' }, { id: 'pa', label: 'Passages dans les attractions', sub: 'Somme des utilisations d’attractions' }]
      });
      x.app('quatre', B.el);
      x.todo('Associe chaque indicateur à sa valeur.');
      const W = { lv: '20', bv: '40', ee: '27', pa: '50' };
      await x.wait({
        'match.pick': () => {},
        'match.check': ({ values }) => {
          const ks = Object.keys(W);
          if (ks.some(k => !values[k])) return x.oops('', 'Associe une valeur à chaque indicateur.');
          const bad = ks.filter(k => values[k] !== W[k]);
          B.mark(ks.filter(k => !bad.includes(k)), bad);
          if (!bad.length) { B.lock(); return true; }
          if (values.pa === '20') return x.oops('Total des passages égal à 20');
          if (values.ee === '50') return x.oops('50 visiteurs uniques');
          return x.oops('', 'Chaque chiffre a sa source : la billetterie, les portiques ou les attractions.');
        }
      });
      await x.ask('Victoria propose d’additionner 27 entrées et 50 passages pour obtenir la fréquentation. Est-ce correct ?', [
        { t: 'Oui : 77 visites au total', err: 'Addition de 27 et 50 pour obtenir la fréquentation' },
        { t: 'Non : ce sont deux événements différents, qu’on n’additionne pas', ok: true }
      ]);
      x.app('pbi'); P().activePage = 'page_003'; pbi.st.selVis = null; pbi.render();
      await x.pixel('Présentons maintenant nos conclusions à la direction.');
      const n = s => K.norm(s || '').replace(/[\s.]/g, '');
      await x.inputs({
        lbl: 'Conclusions pour la direction', q: 'Les attractions', btn: 'Valider',
        fields: [{ id: 'top', label: 'La plus fréquentée', text: true }, { id: 'topn', label: 'Ses passages' }, { id: 'low', label: 'La moins fréquentée', text: true }, { id: 'lown', label: 'Ses passages' }],
        check: ({ top, topn, low, lown }) => {
          if (!top || topn === null || !low || lown === null) return ['', 'Renseigne les quatre réponses.'];
          if (n(top) !== 'dragon') return ['', 'Relis le haut du classement.'];
          if (topn === 5 && pbi.st.xsel) return ['', 'Une sélection filtre encore la page : touche un espace vide du canevas pour retrouver les totaux.'];
          if (topn !== 18) return ['', 'Relis la barre de Dragon.'];
          if (n(low) !== 'skytower') return ['', 'Relis le bas du classement.'];
          if (lown !== 8) return ['', 'Relis la barre de Sky Tower.'];
          return true;
        }
      });
      await x.inputs({
        lbl: 'Conclusions pour la direction', q: 'Les journées et les totaux', btn: 'Valider',
        fields: [{ id: 'day', label: 'Journée la plus fréquentée', text: true }, { id: 'dayn', label: 'Passages ce jour-là' }, { id: 'tot', label: 'Total des passages' }, { id: 'ent', label: 'Entrées du parc' }],
        check: ({ day, dayn, tot, ent }) => {
          if (!day || dayn === null || tot === null || ent === null) return ['', 'Renseigne les quatre réponses.'];
          if (!/^(vendredi )?0?5 (0?6|juin)( 2026)?$|^2026 06 05$/.test(K.norm(day))) return ['', 'Relis l’histogramme quotidien : quelle colonne est la plus haute ?'];
          if (dayn !== 15) return ['', 'Relis la colonne la plus haute de l’histogramme quotidien.'];
          if (tot === 20) return 'Total des passages égal à 20';
          if (tot === 77) return 'Addition de 27 et 50 pour obtenir la fréquentation';
          if (tot !== 50) return ['', 'Additionne les quatre barres du classement.'];
          if (ent === 50) return '50 visiteurs uniques';
          if (ent !== 27) return ['', 'Les entrées viennent de la carte Entrées enregistrées.'];
          return true;
        }
      });
      await x.ask('Quelle conclusion peux-tu présenter à la direction ?', [
        { t: 'Dragon est l’attraction préférée des visiteurs', msg: 'La fréquentation ne mesure pas directement la satisfaction.' },
        { t: 'Sky Tower n’est pas rentable : il faut la fermer', err: 'Sky Tower déclarée non rentable' },
        { t: 'Le 5 juin est notre jour le plus rentable', msg: 'Aucun coût d’exploitation n’est disponible.' },
        { t: 'Wonderland a accueilli 50 personnes différentes', err: '50 visiteurs uniques' },
        { t: 'Dragon totalise le plus de passages : 18 sur 50', ok: true }
      ]);
      const audit = K.lesson('Audit avant la réunion', 'Dix visuels sur trois pages', `<div class="flow-row"><div class="flow-box on"><b class="num">6</b><small>Vue générale : 4 cartes et 2 tableaux</small></div><div class="flow-box on"><b class="num">1</b><small>Détail des ventes : 1 tableau</small></div><div class="flow-box on"><b class="num">3</b><small>Attractions : 3 graphiques</small></div></div><p class="lc-note">${esc(fr('Trois tables, vingt colonnes auditées, aucune relation et aucune mesure DAX. Le laboratoire ne fait pas partie du rapport.'))}</p>`);
      x.app('audit', audit);
      await x.pixel('Le rapport doit compter dix visuels sur trois pages. Le laboratoire, lui, n’en fait pas partie.');
      x.app('pbi');
      const valid = () => {
        if (P().pages.some(p => p.id === 'page_lab')) return ['', 'Supprime d’abord la page Laboratoire.'];
        if (P().activePage !== 'page_003') return ['', 'Reviens sur la page Attractions avant d’enregistrer.'];
        if (pbi.st.xsel) return ['Sauvegarde avec sélection temporaire active'];
        if (P().pages.length !== 3 || visuals(P()) !== 10 || !fixed()) return ['Suppression d’un tableau précédent'];
        return null;
      };
      const nextS = () => {
        if (P().pages.some(p => p.id === 'page_lab')) { x.todo('Ferme le laboratoire : supprime la page Laboratoire depuis son onglet.'); x.guide(P().activePage !== 'page_lab' ? '[data-a="ptab:page_lab"]' : ['[data-a="ptab:page_lab"]', '.menu [data-k="del"]']); return; }
        if (P().activePage !== 'page_003') { x.todo('Reviens sur la page Attractions.'); x.guide('[data-a="ptab:page_003"]'); return; }
        if (pbi.st.xsel) { x.todo('Une sélection filtre encore la page : touche un espace vide du canevas pour l’effacer.'); x.guide('[data-a="canvas"]'); return; }
        x.todo('Dix visuels, trois pages : enregistre Wonderland_Pilotage.'); x.guide('.pbi-save');
      };
      nextS();
      const laterS = () => { setTimeout(nextS, 0); };
      const save = () => { pbi.closeBackstage(); const e = valid(); if (e) return x.oops(e[0] || '', e[1]); P().dirty = false; P().saved = true; pbi.render(); return true; };
      await x.wait(K.guard(x, KEEP10, {
        page: laterS, canvas: laterS, pane: laterS, visual: laterS, 'chart.point': laterS,
        'page.del': id => {
          if (id !== 'page_lab') return x.oops('Suppression d’un tableau précédent');
          P().pages = P().pages.filter(p => p.id !== 'page_lab'); P().activePage = 'page_003'; pbi.st.selVis = null; pbi.render(); laterS();
        },
        'vis.delete': p => KEEP10.includes(p.vis) ? x.oops('Suppression d’un tableau précédent') : undefined,
        'well.agg': p => KEEP10.includes(p.vis) ? entrees(p.vis) : undefined,
        cmd: c => c === 'relations' ? x.oops('Création d’une relation entre les trois tables') : K.guard(x, KEEP10).cmd(c),
        'model.tool': () => x.oops('Création d’une relation entre les trois tables'),
        'viz.change': laterS,
        save: () => save(), 'file.menu': () => {},
        file: k => k === 'back' ? undefined : k === 'save' ? save() : x.oops('', 'Utilise Enregistrer pour garder le même projet.')
      }));
      x.guide();
      await x.ok('Rapport enregistré : trois pages, dix visuels, et trois chiffres qui ne se mélangent plus.');
    }, avance: P => { P.pages = P.pages.filter(p => p.id !== 'page_lab'); P.activePage = 'page_003'; P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'conseil', n: 'La lumière baisse. Le rapport Wonderland s’affiche sur le grand écran, à la page Attractions.' },
    { p: 'victoria', t: 'Dragon arrive donc en tête avec dix-huit passages. Pirates suit avec quatorze.' },
    { p: 'lola', t: 'Nous pourrions mettre Dragon en avant dans la campagne. Mais il faudrait aussi étudier la satisfaction des visiteurs avant de décider.' },
    { p: 'oscar', t: 'Le vendredi 5 juin est notre journée la plus chargée sur cette période. C’est utile pour préparer nos équipes.' },
    { p: 'gabriel', t: 'Et la billetterie est toujours là. Notre rapport commence à couvrir plusieurs activités du parc.' },
    { clear: 1, p: 'victoria', t: 'Nous avons bien enregistré cinquante passages dans les attractions, et non cinquante visiteurs différents.' },
    { card: { k: 'Trois chiffres, trois significations', ul: ['40 billets vendus', '27 entrées dans le parc', '50 passages dans les attractions'] } },
    { p: 'pixel', t: 'Exactement. Un bon graphique transmet la bonne information, pas seulement un résultat impressionnant.' },
    { clear: 1, bg: 'parc', n: 'Les quatre attractions s’illuminent l’une après l’autre. Une nouvelle connexion relie le centre de supervision au bâtiment administratif.' },
    { card: { k: 'Réseau de données du parc', h: '3 services sur 6 connectés', chips: ['Billetterie', 'Fréquentation', 'Attractions'] } },
    { wait: 800 }
  ],
  recompense: { titre: 'Les chiffres prennent vie !', sous: 'Tu sais désormais transformer des données en visualisations pertinentes.', badge: 'b107', badgeNom: 'Architecte des graphiques', objet: 'dragon' },
  fiches: [
    ['Choix du graphique', 'Quel graphique utiliser pour classer des catégories aux noms longs ?', 'Un graphique à barres horizontales : les noms se lisent sur l’axe Y, et les longueurs se comparent d’un coup d’œil.'],
    ['Les axes X et Y', 'Dans un graphique à barres, où vont les catégories ?', 'Sur l’axe Y, vertical. Les valeurs vont sur l’axe X. Dans un histogramme, c’est l’inverse.'],
    ['La légende', 'À quoi sert la zone Légende ?', 'À répartir les valeurs en plusieurs séries selon les catégories d’un champ, par exemple une série par attraction.'],
    ['Groupé ou empilé ?', 'Quand préférer des colonnes empilées ?', 'Pour lire à la fois le total de chaque catégorie et la contribution de chaque série. Les colonnes groupées comparent plutôt les séries entre elles.'],
    ['L’axe à zéro', 'Pourquoi faire commencer l’axe des valeurs à zéro ?', 'Pour que la longueur des barres reste proportionnelle aux valeurs. Un axe tronqué exagère les écarts.'],
    ['Date ou hiérarchie ?', 'Pourquoi mon histogramme n’affiche-t-il qu’une colonne 2026 ?', 'Le champ date utilise sa hiérarchie automatique. Choisis la date elle-même pour obtenir une colonne par jour.'],
    ['Somme ou Nombre ?', 'Somme de Passages ou Nombre de Passages ?', 'Somme additionne les quantités : 50. Nombre compte les lignes qui contiennent une valeur : 20.'],
    ['Passages et visiteurs', '50 passages, est-ce 50 visiteurs ?', 'Non. Une même entrée peut donner plusieurs passages, et la source ne contient aucun identifiant de visiteur.']
  ],
  suite: [
    { bg: 'samedi', n: 'Samedi 6 juin, 7 h 30. Les allées de Wonderland sont encore désertes. Oscar vérifie les portiques avant l’ouverture.' },
    { p: 'victoria', t: 'Je dois organiser les équipes d’accueil du week-end. Combien de billets avons-nous déjà vendus pour samedi et dimanche ?' },
    { p: 'gabriel', t: 'Notre rapport affiche toutes les ventes à la fois. Comment isoler les seules visites du week-end ?' },
    { p: 'pixel', t: 'Le rapport va devenir interactif : chacun pourra choisir le périmètre qu’il veut analyser.' }
  ],
  accroche: 'Tu construiras tes premiers graphiques : barres, colonnes, légende, tri, couleurs et axes honnêtes.',
  fin(P) { importAttractions(P); addBars(P, 2); addColumns(P, 2); addStacked(P, 2); P.pages = P.pages.filter(p => p.id !== 'page_lab'); P.activePage = 'page_003'; P.dirty = false; P.saved = true; }
};
window.PBQ.mission(def);
window.PBQ.importAttractions = importAttractions;
})();

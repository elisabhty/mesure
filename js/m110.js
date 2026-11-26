/* Mission 110 — La première présentation (épreuve finale du module 1) */
(function () {
'use strict';
const { h, esc, fr, $, $$, clone, S, store } = window.PBQ;
const PBI = window.PBI;
const B = 'tbl_billetterie', DS = 'vis_108_date_slicer', TS = 'vis_108_ticket_type_slicer';
const CARDS = ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_vente_moyenne', 'vis_105_entrees'];
const ANALYTIC = CARDS.concat(['vis_106_categories', 'vis_106_canaux', 'vis_106_detail_ventes', 'vis_107_attraction_bars', 'vis_107_daily_columns', 'vis_107_daily_stacked', DS, TS]);
const STACK = 'vis_107_daily_stacked';
const POINTS = [10, 15, 10, 15, 10, 15, 10, 15];
const TRAIN = 'qry_billetterie_training';
const PERSIST = ['qry_billetterie', 'qry_frequentation', 'qry_attractions'];

/* ───────── Évaluation : mode, chronomètre, premières tentatives ───────── */
const EV = () => S.eval110 || (S.eval110 = { mode: 'learning', first: {}, hints: {}, t0: null, tEnd: null });
const first = (i, parts) => { const e = EV(); if (!e.first[i]) { e.first[i] = parts; store.save(); } };
const hintsOf = (x, i) => { const e = EV(); e.hints[i] = Math.max(e.hints[i] || 0, x.hintsUsed); store.save(); };
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
let tick = null;
function timer() {
  const e = EV(); clearInterval(tick); tick = null;
  if (e.mode !== 'test') return;
  if (!e.t0) { e.t0 = Date.now(); store.save(); }
  const draw = () => {
    const k = $('#w-kicker');
    if (!PBQ.active || PBQ.active.id !== 110 || !k) { clearInterval(tick); tick = null; if (k) k.classList.remove('late'); return; }
    const base = k.textContent.split(' · ')[0];
    if (!/^Défi/.test(base)) return;
    const left = 1800 - Math.floor(((e.tEnd || Date.now()) - e.t0) / 1000);
    k.textContent = `${base} · ${left >= 0 ? mmss(left) : '+' + mmss(-left)}`;
    k.classList.toggle('late', left < 0);
  };
  draw(); tick = setInterval(draw, 1000);
}

/* ───────── Lecture du rapport ───────── */
const card = (x, id) => { const v = K.visOf(x, id), f = v.f.values[0], q = x.pbi.query(v); return q ? PBI.aggregate(q.rows.map(r => r[f.c]), f.agg) : null; };
const rowsOf = (x, id) => { const v = K.visOf(x, id), q = v && x.pbi.query(v); return q ? q.rows : []; };
const near = (a, b) => a != null && Math.abs(a - b) < .005;
const restr = f => PBI.restrictive(f), anyRestr = fs => (fs || []).some(restr);
const later = fn => () => { setTimeout(fn, 0); };
const range = (ds, a, b) => !!ds.sel && ds.sel.kind === 'range' && ds.sel.min === a && ds.sel.max === b;
const cats = ts => [...((ts.sel && ts.sel.values) || [])].sort().join('+');
const clearSel = pbi => Object.assign(pbi.st, { selVis: null, xsel: null, multi: [], multiMode: false, editInter: false, tabBuild: null });
const restrictiveAnywhere = P => anyRestr(P.filters) || P.pages.some(p => anyRestr(p.filters) || p.visuals.some(v => anyRestr(v.filters)));
/* Empreinte du rapport approuvé en mission 109 : champs, agrégations, tris, positions, mise en forme, interactions, thème */
function sig(P) {
  const r = n => Math.round(n * 100) / 100;
  return JSON.stringify({
    pages: P.pages.map(p => ({ id: p.id, size: p.size || [1280, 720], bg: p.bg || null, skip: p.tabSkip || [], order: p.tabOrder || [], vis: p.visuals.map(v => [v.id, v.type, r(v.x), r(v.y), r(v.w), r(v.h), JSON.stringify(v.f), JSON.stringify(v.sort || null), JSON.stringify(v.sort2 || null), v.mode || null, JSON.stringify(v.fmt || {}), v.alt || null, v.text || null, v.title || null]) })),
    inter: Object.keys(P.interactions || {}).sort().map(k => k + '=' + P.interactions[k]), theme: P.theme ? P.theme.id : null, tables: P.tables.map(t => t.id + ':' + t.rows.length + ':' + t.cols.map(c => c.n + c.t).join(','))
  });
}
let CHECK = null;
const VN = { vis_105_billets: 'la carte Billets vendus', vis_105_ventes_ttc: 'la carte Ventes TTC', vis_105_vente_moyenne: 'la carte Montant moyen', vis_105_entrees: 'la carte Entrées enregistrées', vis_106_categories: 'le tableau par catégorie', vis_106_canaux: 'le tableau par canal', vis_106_detail_ventes: 'le tableau détaillé', vis_107_attraction_bars: 'le graphique en barres', vis_107_daily_columns: 'le graphique quotidien', vis_107_daily_stacked: 'le graphique empilé', [DS]: 'le segment de dates', [TS]: 'le segment des catégories' };
function diffSig(P) {
  const a = JSON.parse(CHECK), b = JSON.parse(sig(P));
  for (const pa of a.pages) { const pb = b.pages.find(p => p.id === pa.id); if (!pb) return 'les pages du rapport'; for (const va of pa.vis) { const vb = pb.vis.find(v => v[0] === va[0]); if (!vb) return VN[va[0]] || 'les objets de présentation'; if (JSON.stringify(va) !== JSON.stringify(vb)) return VN[va[0]] || 'les objets de présentation'; } if (pb.vis.length !== pa.vis.length) return 'les objets de présentation'; }
  if (JSON.stringify(a.inter) !== JSON.stringify(b.inter)) return 'les interactions des segments';
  return a.theme !== b.theme ? 'le thème' : null;
}
const errKeys = (x, from) => x.errors - from;
const G = (x, extra) => K.guard(x, ANALYTIC, Object.assign({
  'viz.create': () => x.oops('', 'Le rapport est approuvé : aucun nouvel objet n’est nécessaire.'), 'clip.paste': () => x.oops('', 'Le rapport est approuvé : aucun nouvel objet n’est nécessaire.'),
  'vis.geo': () => x.oops('', 'La mise en page approuvée reste telle quelle.'), 'vis.order': () => x.oops('', 'La mise en page approuvée reste telle quelle.'), 'vis.align': () => x.oops('', 'La mise en page approuvée reste telle quelle.'),
  'theme.set': () => x.oops('', 'Le thème Wonderland — Direction reste en place.'), 'page.fmt': () => x.oops('', 'Le canevas approuvé reste en place.'),
  'vis.alt': () => x.oops('', 'Les textes de remplacement sont déjà validés.'), 'tab.pick': () => x.oops('', 'L’ordre de tabulation est déjà validé.'), 'tab.skip': () => x.oops('', 'L’ordre de tabulation est déjà validé.'),
  'button.kind': () => x.oops('', 'Le rapport est approuvé : aucun nouvel objet n’est nécessaire.'), 'nav.page': () => {}, 'view.opt': () => {}, 'multi.mode': () => {}, 'clip.copy': () => {}, 'tab.start': () => {},
  cmd: c => ['newmeasure', 'newcol', 'newtable'].includes(c) ? x.oops('', 'Aucune mesure ni colonne : les agrégations implicites suffisent.') : c === 'relations' ? x.oops('', 'Le modèle ne change pas : aucune relation à créer.') : c === 'newpage' ? x.oops('', 'Les trois pages existantes suffisent.') : ['get', 'excel', 'enter'].includes(c) ? x.oops('', 'Les sources sont déjà chargées.') : c === 'transform' ? x.oops('', 'Les données sources ne sont pas en cause ici.') : c === 'syncslicers' ? x.oops('', 'Les segments restent locaux à Vue générale.') : undefined
}, extra));

/* ───────── Défi 1 : la copie d'entraînement, Montant_TTC en texte ───────── */
function trainingQuery(P) {
  const T = PBI.evalQuery(P.queries.find(q => q.id === 'qry_billetterie'));
  return { id: TRAIN, name: 'Copie_Entrainement', kind: 'excel', file: 'Billetterie_Wonderland.xlsx', loadEnabled: false, training: true,
    cols: T.cols.map(c => ({ n: c.n, t: c.n === 'Montant_TTC' ? 'text' : c.t })),
    data: T.rows.map(r => ({ ...r, Montant_TTC: Number(r.Montant_TTC).toFixed(2).replace('.', ',') })),
    steps: [{ op: 'source', name: 'Source' }] };
}

const def = {
  id: 110,
  objectifs: ['Contrôler les sources, les types et les agrégations', 'Analyser les ventes, les visites prévues et les attractions', 'Diagnostiquer un incident et présenter des conclusions fiables'],
  intro: [
    { bg: 'parc', n: 'Dimanche 7 juin, 8 h 45. Les attractions se préparent pour une nouvelle journée. Sur ta tablette : « Présentation des résultats Wonderland — 9 h 00 ».' },
    { p: 'pixel', t: 'Il y a quelques jours, tu découvrais Power BI. Aujourd’hui, tu as trois sources, un rapport interactif et tous les outils pour répondre à la direction.' },
    { p: 'pixel', t: 'Mais cette fois, je ne te dirai pas sur quel bouton cliquer. À toi de choisir la bonne méthode.' },
    { clear: 1, bg: 'conseil', card: { k: 'Le conseil d’administration', ul: ['Victoria, direction générale : la fiabilité du rapport', 'Gabriel, finance : l’exactitude des montants', 'Lola, marketing : les catégories et les canaux', 'Oscar, exploitation : les visites prévues et les attractions'] } },
    { p: 'victoria', t: 'Merci d’être là. Nous voulons comprendre les premiers résultats du parc, et vérifier que notre système de pilotage est assez fiable pour tous les services.' },
    { p: 'gabriel', t: 'Je vais aussi te demander de contrôler quelques chiffres. Certains m’ont paru incohérents pendant la répétition.' },
    { p: 'oscar', t: 'Et j’aimerais savoir ce que nous pouvons réellement déduire des données de ce week-end.' },
    { p: 'victoria', t: 'À toi de jouer.' },
    { btn: 'Entrer dans la salle du conseil' }
  ],
  leconTitre: 'Avant l’épreuve',
  async lecon(x) {
    const e = S.eval110 = { mode: 'learning', first: {}, hints: {}, t0: null, tEnd: null }; store.save();
    $('#w-kicker').textContent = fr('Mission 110 · Épreuve finale');
    const pick = K.lesson('Comment souhaites-tu passer ton épreuve ?', '', `<div class="modes">
      <button class="mode" data-m="learning"><b>Mode apprentissage</b><span>Sans limite de temps. Trois indices par défi, corrections et nouvelles tentatives autorisées.</span></button>
      <button class="mode" data-m="test"><b>Mode test technique</b><span>Objectif : 30 minutes. Tes premières réponses sont évaluées et les indices consultés sont enregistrés.</span></button></div>
      <p class="lc-note">${esc(fr('Les deux modes mènent au certificat. Le test technique ajoute un bilan de rapidité.'))}</p>`);
    $$('.mode', pick).forEach(b => b.addEventListener('click', () => PBQ.act('mode', b.dataset.m)));
    x.app('lecon', pick);
    x.todo('Choisis ton mode d’épreuve.');
    await x.wait({ mode: m => { e.mode = m; store.save(); $$('.mode', pick).forEach(b => b.classList.toggle('on', b.dataset.m === m)); return true; } });
    await x.pause(500);
    const dossier = K.lesson('Dossier métier', 'Ce que contient Wonderland_Pilotage', `
      <table class="tbl wrap" style="width:100%"><thead><tr><th><span class="thc">Source</span></th><th class="r"><span class="thc">Lignes</span></th><th class="r"><span class="thc">Colonnes</span></th></tr></thead><tbody>
      ${[['tBilletterie', 20, 8], ['Frequentation_Wonderland', 27, 7], ['Frequentation_Attractions', 20, 5]].map(r => `<tr><td>${esc(r[0])}</td><td class="r">${r[1]}</td><td class="r">${r[2]}</td></tr>`).join('')}
      <tr><td><b>Total technique</b></td><td class="r"><b>67</b></td><td class="r"><b>20</b></td></tr></tbody></table>
      <p class="lc-note">${esc(fr('Les 67 lignes ne sont pas 67 visiteurs : trois granularités différentes. Extraction du 6 juin, historique jusqu’au 5 juin.'))}</p>
      <div class="flow-row" style="grid-template-columns:repeat(3,1fr); margin-top:12px"><div class="flow-box on"><b class="num">14</b><small>Objets · Vue générale</small></div><div class="flow-box on"><b class="num">5</b><small>Objets · Détail</small></div><div class="flow-box on"><b class="num">7</b><small>Objets · Attractions</small></div></div>`);
    x.app('dossier', dossier);
    await x.pixel('Je reste disponible si tu as besoin d’un indice. Mais je ne prendrai aucune décision à ta place.');
    await x.pixel(e.mode === 'test' ? 'Mode test technique : le chronomètre démarre au premier défi. Il continue même si tu le dépasses.' : 'Mode apprentissage : prends le temps qu’il faut. Seule compte la maîtrise.');
  },
  debut(P) { CHECK = sig(P); },

  exs: [
    /* 1 — Puis-je faire confiance à tes données ? */
    { titre: 'Puis-je faire confiance à tes données ?', async run(x) {
      const pbi = x.pbi, P = () => pbi.P; timer();
      K.ready(x, 'page_001'); clearSel(pbi); pbi.render();
      await x.say('victoria', 'Avant de consulter les résultats, je veux être certaine que nous utilisons les bonnes sources et que leurs données sont exploitables.');
      await x.say('gabriel', 'Sur une copie de notre fichier commercial, les montants étaient considérés comme du texte. Vérifie aussi ce point.');
      const brief = 'Vérifie les trois sources, puis corrige le type de Montant_TTC dans la copie d’entraînement.';
      x.todo(brief);
      const e0 = x.errors; let invErr = null;
      const seen = new Set(['qry_billetterie']);
      const train = () => pbi.pqs && pbi.pqs.queries.find(q => q.id === TRAIN);
      const ref = () => PBI.evalQuery(P().queries.find(q => q.id === 'qry_billetterie')).rows.map(r => r.Montant_TTC);
      const fixed = () => { const q = train(); if (!q) return false; const T = PBI.evalQuery(q), c = T.cols.find(c => c.n === 'Montant_TTC'), R = ref(); return !!c && c.t === 'fixed' && T.rows.length === 20 && T.rows.every((r, i) => typeof r.Montant_TTC === 'number' && near(r.Montant_TTC, R[i])); };
      const qIdx = id => pbi.pqs ? pbi.pqs.queries.findIndex(q => q.id === id) : -1;
      const next = () => {
        if (!pbi.pqs) { x.guide(pbi.st.tab !== 'Accueil' ? '[data-a="tab:Accueil"]' : '[data-a="cmd:transform"]'); return; }
        const miss = PERSIST.find(id => !seen.has(id));
        if (miss) { x.guide(`[data-q="query:${qIdx(miss)}"]`); return; }
        if (!fixed()) { const cur = pbi.pqs.queries[pbi.pqs.cur]; x.guide(cur.id !== TRAIN ? `[data-q="query:${qIdx(TRAIN)}"]` : ['[data-a="pqtype:Montant_TTC"]', '.menu [data-k="fixed"]']); return; }
        x.guide('[data-q="cmd:apply"]');
      };
      next();
      await x.wait(G(x, {
        page: later(next), pane: later(next), tab: later(next), visual: later(next), canvas: later(next),
        cmd: c => {
          if (c === 'transform') { if (!pbi.pqs) { pbi.openPQ(P().queries.filter(q => PERSIST.includes(q.id)).concat(trainingQuery(P())), { label: 'Wonderland_Pilotage' }); } setTimeout(next, 0); return; }
          if (c === 'excel' || c === 'get') return x.oops('Importation répétée du fichier Excel');
          return G(x).cmd(c);
        },
        'pq.query': i => { const q = pbi.pqs.queries[i]; if (q) seen.add(q.id); if (PERSIST.every(id => seen.has(id)) && invErr === null) invErr = x.errors - e0; setTimeout(next, 0); },
        'pq.col': () => {}, 'pq.step': () => {}, 'pq.steps': () => {}, 'pq.err': () => {},
        'pq.typeTry': ({ col, type, loc, query }) => {
          const q = pbi.pqs.queries.find(o => o.name === query);
          if (!q || q.id !== TRAIN) return x.oops(['Quantite', 'Prix_Unitaire'].includes(col) ? 'Modification du prix ou des quantités' : '', 'Les sources persistantes sont déjà correctes : ne change pas leurs types.');
          if (col !== 'Montant_TTC') return x.oops(['Quantite', 'Prix_Unitaire'].includes(col) ? 'Modification du prix ou des quantités' : '', 'Seule la colonne Montant_TTC pose problème.');
          if (type === 'text' || type === 'any') return x.oops('Montant_TTC conservé en texte');
          if (type === 'int') return x.oops('Conversion en nombre entier');
          if (loc === 'en-US') return x.oops('Mauvaise interprétation de la virgule décimale');
          if (type !== 'fixed') return x.oops('', type === 'dec' ? 'Pour des montants, choisis Nombre décimal fixe : la précision monétaire est garantie.' : 'Montant_TTC est un montant : Nombre décimal fixe.');
        },
        'pq.type': later(next), 'pq.change': later(next), 'pq.delstep': p => p.query === 'Copie_Entrainement' ? undefined : x.oops('', 'Les étapes des sources persistantes restent intactes.'),
        'pq.cmd': c => c === 'rows' ? x.oops('Suppression des lignes difficiles à convertir') : c === 'newsource' ? x.oops('Importation répétée du fichier Excel') : c === 'cols' ? x.oops('', 'Toutes les colonnes restent utiles.') : x.oops('', 'Aucune valeur ne doit être remplacée.'),
        'pq.replaceTry': () => x.oops('Modification du prix ou des quantités'),
        'pq.close': () => x.oops('', 'Ferme avec Fermer et appliquer, une fois le contrôle terminé.'),
        'pq.apply': () => {
          const miss = PERSIST.filter(id => !seen.has(id));
          if (miss.length) return x.oops('', `Inspecte d’abord chaque source : il reste ${miss.length === 1 ? 'une requête' : miss.length + ' requêtes'} à ouvrir.`);
          if (!fixed()) { const q = train(), c = q && PBI.evalQuery(q).cols.find(c => c.n === 'Montant_TTC'); return x.oops(c && c.t === 'text' ? 'Montant_TTC conservé en texte' : 'Mauvaise interprétation de la virgule décimale'); }
          pbi.applyPQ(); pbi.closePQ(); pbi.loading && pbi.loading('Vérification des trois sources…', 20); return true;
        },
        'viz.change': later(next)
      }));
      x.guide();
      if (invErr === null) invErr = x.errors - e0;
      const typErr = x.errors - e0 - invErr, eB0 = x.errors;
      const res = K.lesson('Contrôle des sources', 'Résultat de l’audit', `<table class="tbl wrap" style="width:100%"><tbody>${[['Sources et requêtes chargées', '3'], ['Colonnes métier auditées', '20'], ['Lignes de vente', '20'], ['Billets', '40'], ['Montant total', '1 310,00 €'], ['Erreurs de conversion', '0'], ['Nouvelle table créée', 'Aucune']].map(r => `<tr><td>${esc(r[0])}</td><td class="r"><b>${esc(fr(r[1]))}</b></td></tr>`).join('')}</tbody></table><p class="lc-note">${esc(fr('Les vingt montants convertis correspondent exactement aux montants de la source commerciale.'))}</p>`);
      x.app('audit', res);
      await x.ok('Vingt montants en Nombre décimal fixe, identiques à la source. La copie d’entraînement n’a jamais été chargée.');
      await x.ask('Gabriel : « Les cartes affichaient déjà 1 310 €. Ce contrôle était-il vraiment utile ? »', [{ t: 'Non : une carte correcte suffit', err: 'Vérification limitée aux cartes' }, { t: 'Oui : une carte juste ne garantit pas que chaque colonne est bien typée', ok: true }]);
      const eAsk = x.errors - eB0;
      await x.ask('La copie corrigée doit-elle devenir une table du modèle ?', [{ t: 'Non : elle sert seulement à l’entraînement', ok: true }, { t: 'Oui, comme quatrième table', err: 'Chargement de la copie d’entraînement' }]);
      x.app('pbi');
      first(1, { 'Inventaire des sources': invErr + eAsk ? 0 : 3, 'Correction des types': typErr + (x.errors - eB0 - eAsk) ? 0 : 7 });
      hintsOf(x, 1);
    }, avance: P => P },

    /* 2 — Les chiffres ne correspondent pas */
    { titre: 'Les chiffres ne correspondent pas', async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st; timer();
      K.ready(x, 'page_001'); clearSel(pbi); st.pane = 'Visualisations';
      const bil = K.visOf(x, 'vis_105_billets'), moy = K.visOf(x, 'vis_105_vente_moyenne');
      bil.f.values[0].agg = 'count'; moy.f.values[0].agg = 'sum'; pbi.render();
      await x.say('gabriel', 'Notre carte indique vingt billets vendus. Pourtant, je suis presque certain que nous en avons vendu davantage.');
      await x.say('gabriel', 'Et le montant moyen me paraît étrange aussi : 1 310 €. Peux-tu comprendre pourquoi ?');
      x.todo('Identifie les agrégations responsables des deux incohérences et corrige les cartes.');
      let eQ = 0, eM = 0;
      const okQ = () => bil.f.values[0] && bil.f.values[0].c === 'Quantite' && bil.f.values[0].agg === 'sum' && card(x, 'vis_105_billets') === 40;
      const okM = () => moy.f.values[0] && moy.f.values[0].c === 'Montant_TTC' && moy.f.values[0].agg === 'avg' && near(card(x, 'vis_105_vente_moyenne'), 65.5);
      const next = () => {
        const v = !okQ() ? bil : !okM() ? moy : null; if (!v) return;
        x.guide(st.selVis !== v.id ? `[data-a="vis:${v.id}"]` : st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : st.vzTab === 'format' ? '[data-a="vztab:champs"]' : ['[data-a="chip:values|0"]', `.menu [data-k="agg:${v === bil ? 'sum' : 'avg'}"]`]);
      };
      next();
      const Gx = G(x);
      await x.wait(G(x, {
        page: later(next), pane: later(next), tab: later(next), visual: later(next), canvas: later(next),
        cmd: c => c === 'newmeasure' ? (eQ++, x.oops('Création d’une mesure DAX explicite')) : Gx.cmd(c),
        'well.agg': p => {
          if (p.vis === 'vis_105_billets') { if (p.agg === 'sum') return; eQ++; return p.agg === 'count' ? x.oops('Nombre de Quantite conservé') : p.agg === 'countd' ? x.oops('Nombre distinct de Quantite') : p.agg === 'avg' ? x.oops('Moyenne de Quantite') : x.oops('', 'Un total de billets s’obtient en additionnant les quantités.'); }
          if (p.vis === 'vis_105_vente_moyenne') { if (p.agg === 'avg') return; eM++; return p.agg === 'sum' ? x.oops('Somme de Montant_TTC sur la carte moyenne') : x.oops('', 'Le montant moyen par ligne de vente est une moyenne.'); }
          return x.oops('', 'Les autres visuels sont corrects.');
        },
        'well.add': p => { if (p.vis === 'vis_105_vente_moyenne' && /Prix_Unitaire/.test(JSON.stringify(p))) { eM++; return x.oops('Moyenne de Prix_Unitaire'); } return x.oops('', 'Les champs des cartes sont les bons : seule l’agrégation est en cause.'); },
        'well.remove': () => x.oops('', 'Les champs des cartes sont les bons : seule l’agrégation est en cause.'),
        'viz.fmt': p => CARDS.includes(p.vis) ? x.oops('Saisie manuelle de 40 et 65,50') : x.oops('', 'La mise en forme n’est pas en cause.'),
        'viz.change': () => { if (okQ() && okM()) return true; next(); }
      }));
      x.guide(); clearSel(pbi); pbi.render();
      await x.ok('Somme de Quantite : 40 billets. Moyenne de Montant_TTC : 65,50 € par ligne de vente.');
      const eD0 = x.errors;
      await x.inputs({ lbl: 'Explique les résultats à Gabriel', q: 'Complète les quatre indicateurs.', fields: [{ id: 'l', label: 'Lignes de vente' }, { id: 'b', label: 'Billets vendus' }, { id: 'm', label: 'Montant moyen par ligne', unit: '€' }, { id: 'p', label: 'Montant moyen par billet', unit: '€' }], check: v => {
        if (v.l == null || v.b == null || v.m == null || v.p == null) return ['', 'Complète les quatre valeurs.'];
        if (near(v.m, 32.75)) return 'Division de 1 310 par 40 pour la moyenne par transaction';
        if (v.l !== 20) return ['', v.l === 40 ? 'Quarante, ce sont les billets. Les lignes de vente sont les transactions.' : 'Compte les transactions de la table commerciale.'];
        if (v.b !== 40) return v.b === 20 ? 'Nombre de Quantite conservé' : ['', 'Additionne les quantités.'];
        if (!near(v.m, 65.5)) return ['', '1 310 € répartis sur 20 lignes de vente.'];
        if (!near(v.p, 32.75)) return near(v.p, 65.5) ? 'Division de 1 310 par 40 pour la moyenne par transaction' : ['', '1 310 € répartis sur 40 billets.'];
        return true;
      } });
      await x.say('gabriel', 'Je comprends. Une transaction peut contenir plusieurs billets : compter les transactions ne revient pas à compter les billets.');
      first(2, { 'Quantités': eQ ? 0 : 6, 'Moyenne par ligne': eM ? 0 : 6, 'Montant par billet': x.errors - eD0 ? 0 : 3 });
      hintsOf(x, 2);
    }, avance: P => { const pg = P.pages.find(p => p.id === 'page_001'); pg.visuals.find(v => v.id === 'vis_105_billets').f.values[0].agg = 'sum'; pg.visuals.find(v => v.id === 'vis_105_vente_moyenne').f.values[0].agg = 'avg'; } },

    /* 3 — Qui génère le plus de ventes ? */
    { titre: 'Qui génère le plus de ventes ?', async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st; timer();
      K.ready(x, 'page_001'); clearSel(pbi); pbi.render();
      const TBL = ['vis_106_categories', 'vis_106_canaux', 'vis_106_detail_ventes'];
      const sorts0 = TBL.map(id => JSON.stringify([K.visOf(x, id).sort || null, K.visOf(x, id).sort2 || null]));
      const sortsOk = () => TBL.every((id, i) => JSON.stringify([K.visOf(x, id).sort || null, K.visOf(x, id).sort2 || null]) === sorts0[i]);
      await x.say('lola', 'Je prépare notre prochaine campagne. Quelles catégories génèrent le plus de ventes ? Quel canal est le plus important ? Et le classement change-t-il avec l’indicateur ?');
      x.todo('Compare les catégories et les canaux avec les tableaux existants. Justifie tes conclusions.');
      const eC0 = x.errors;
      const Gx = G(x);
      const H = extra => G(x, Object.assign({
        'well.agg': p => p.agg === 'count' ? x.oops('Classement sur Nombre de Quantite') : x.oops('', 'Les agrégations des tableaux sont déjà justes.'),
        'well.add': () => x.oops('', 'Utilise les tableaux tels qu’ils sont : ne les recrée pas.'), 'well.remove': () => x.oops('', 'Utilise les tableaux tels qu’ils sont : ne les recrée pas.'),
        'table.sort': p => { const col = (K.visOf(x, p.vis).f.cols || [])[p.i]; if (p.vis === 'vis_106_detail_ventes' && col && col.c === 'Prix_Unitaire') return x.oops('Classement sur le prix unitaire pour rechercher le montant maximal'); },
        'viz.change': () => {}
      }, extra));
      const ask = (q, o) => x.ask(q, o);
      await ask('Quelle catégorie génère le montant TTC le plus élevé ?', [{ t: 'Enfant', msg: 'Compare la colonne Ventes TTC du tableau par catégorie.' }, { t: 'Adulte, avec 480 €', ok: true }, { t: 'Étudiant', msg: 'Compare la colonne Ventes TTC du tableau par catégorie.' }]);
      await ask('Et la catégorie vendue en plus grande quantité ?', [{ t: 'Adulte, seule en tête', err: 'Adulte identifié comme seul premier en quantité' }, { t: 'Adulte et Enfant, à égalité avec 12 billets', ok: true }, { t: 'Enfant, seule en tête', msg: 'Regarde bien les deux premières lignes : il y a égalité.' }]);
      const eC = x.errors - eC0, eK0 = x.errors;
      await ask('Quel canal pèse le plus ?', [{ t: 'Web : 646 € et 20 transactions', err: 'Canal Web annoncé avec 20 transactions' }, { t: 'Web : 646 € et 20 billets, en 9 lignes de vente', ok: true }, { t: 'Guichet : 484 € et 14 billets', msg: 'Compare les montants TTC des trois canaux.' }]);
      await x.inputs({ lbl: 'Contrôle des totaux', q: 'Le montant moyen global, toutes catégories confondues ?', fields: [{ id: 'm', label: 'Montant moyen par ligne', unit: '€' }], check: v => v.m == null ? ['', 'Indique le montant.'] : near(v.m, 262) ? 'Moyennes des catégories additionnées' : near(v.m, 65.5) ? true : ['', 'Lis la ligne Total du tableau par catégorie.'] });
      await ask('Lola : « Le Web est donc notre canal le plus rentable ? »', [{ t: 'Oui, il génère le plus de ventes', err: 'Web déclaré le canal le plus rentable' }, { t: 'On ne peut pas le dire : les coûts et les commissions ne sont pas connus', ok: true }]);
      const eK = x.errors - eK0, eT0 = x.errors;
      /* La transaction la plus élevée : dans le tableau détaillé */
      let seen2 = P().activePage === 'page_002';
      const nextT = () => { x.todo('Retrouve la transaction au montant le plus élevé.'); x.guide(seen2 ? null : '[data-a="ptab:page_002"]'); };
      nextT();
      if (!seen2) await x.wait(H({
        page: id => { if (id === 'page_002') { seen2 = true; setTimeout(() => PBQ.act('ok.state'), 0); } },
        'nav.page': ({ page }) => { if (page === 'page_002') { seen2 = true; setTimeout(() => PBQ.act('ok.state'), 0); } },
        'table.rowsel': p => p.vis !== 'vis_106_detail_ventes' ? x.oops('Recherche de B013 dans le tableau agrégé') : undefined,
        'ok.state': () => seen2 ? true : undefined
      }));
      x.guide();
      await x.inputs({ lbl: 'La transaction la plus élevée', fields: [{ id: 'id', label: 'Identifiant', text: true }, { id: 'm', label: 'Montant TTC', unit: '€' }], check: v => {
        const id = String(v.id || '').trim().toUpperCase();
        if (id !== 'B013') return ['', /B01[0-9]|B00[0-9]|B020/.test(id) ? 'Trie le tableau détaillé sur Montant_TTC, du plus élevé au plus faible.' : 'Indique l’identifiant ID_Vente, par exemple B001.'];
        if (!near(v.m, 160)) return ['', 'Relis le montant TTC de cette transaction.'];
        return true;
      } });
      if (!sortsOk()) {
        x.oops('Tri d’entraînement enregistré définitivement');
        const nextR = () => { x.todo('Restaure les tris d’origine des tableaux.'); };
        nextR();
        await x.wait(H({ 'table.sort': p => { const col = (K.visOf(x, p.vis).f.cols || [])[p.i]; if (p.vis === 'vis_106_detail_ventes' && col && col.c === 'Prix_Unitaire') return x.oops('Classement sur le prix unitaire pour rechercher le montant maximal'); setTimeout(() => { if (sortsOk()) PBQ.act('ok.state'); }, 0); }, 'ok.state': () => sortsOk() ? true : undefined }));
      }
      P().activePage = 'page_001'; clearSel(pbi); pbi.render();
      await x.say('lola', 'Donc le canal qui génère le plus de ventes n’est pas forcément celui qui rapporte le plus de bénéfices.');
      first(3, { 'Catégories et égalités': eC ? 0 : 3, 'Canaux': eK ? 0 : 4, 'Transaction maximale': x.errors - eT0 ? 0 : 3 });
      hintsOf(x, 3);
    } },

    /* 4 — Combien de visiteurs devons-nous prévoir ? */
    { titre: 'Combien de visiteurs devons-nous prévoir ?', async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st; timer();
      K.ready(x, 'page_001'); clearSel(pbi);
      const ds = K.visOf(x, DS), ts = K.visOf(x, TS); ds.sel = null; ts.sel = null; pbi.render();
      await x.say('oscar', 'Je dois organiser les équipes d’accueil. Combien de billets sont déjà vendus pour les visites de samedi et de dimanche ?');
      await x.say('oscar', 'Ensuite, isole les seniors et les étudiants. Et explique-moi pourquoi les entrées historiques ne bougent pas.');
      const TESTS = [
        ['samedi', () => range(ds, '2026-06-06', '2026-06-06') && !cats(ts), [5, 156, 3]],
        ['dimanche', () => range(ds, '2026-06-07', '2026-06-07') && !cats(ts), [4, 120, 2]],
        ['week-end', () => range(ds, '2026-06-06', '2026-06-07') && !cats(ts), [9, 276, 5]],
        ['Senior', () => range(ds, '2026-06-06', '2026-06-07') && cats(ts) === 'Senior', [3, 96, 2]],
        ['Étudiant', () => range(ds, '2026-06-06', '2026-06-07') && cats(ts) === 'Étudiant', [6, 180, 3]],
        ['les deux', () => range(ds, '2026-06-06', '2026-06-07') && cats(ts) === 'Senior+Étudiant', [9, 276, 5]]
      ];
      const seen = new Set();
      const check = () => TESTS.forEach(([k, f, [b, t, l]]) => { if (f() && card(x, 'vis_105_billets') === b && near(card(x, 'vis_105_ventes_ttc'), t) && rowsOf(x, 'vis_105_billets').length === l && card(x, 'vis_105_entrees') === 27) seen.add(k); });
      const NAMES = { samedi: 'samedi', dimanche: 'dimanche', 'week-end': 'le week-end', Senior: 'Senior', Étudiant: 'Étudiant', 'les deux': 'Senior et Étudiant' };
      const next = () => {
        check();
        const T = TESTS.find(t => !seen.has(t[0])); if (!T) return;
        x.todo(`Teste chaque contexte : samedi, dimanche, le week-end, puis Senior, Étudiant et les deux (${seen.size}/6).`);
        const want = { samedi: ['2026-06-06', '2026-06-06'], dimanche: ['2026-06-07', '2026-06-07'] }[T[0]] || ['2026-06-06', '2026-06-07'];
        if (P().activePage !== 'page_001') { x.guide('[data-a="ptab:page_001"]'); return; }
        const s = ds.sel && ds.sel.kind === 'range' ? ds.sel : { min: null, max: null };
        if (s.min !== want[0]) { x.guide([`[data-a="slrange:${DS}|min"]`, `.menu [data-k="${want[0]}"]`]); return; }
        if (s.max !== want[1]) { x.guide([`[data-a="slrange:${DS}|max"]`, `.menu [data-k="${want[1]}"]`]); return; }
        const wantC = T[0] === 'Senior' ? ['Senior'] : T[0] === 'Étudiant' ? ['Étudiant'] : T[0] === 'les deux' ? ['Senior', 'Étudiant'] : [];
        const on = (ts.sel && ts.sel.values) || [], tap = on.find(v => !wantC.includes(v)) || wantC.find(v => !on.includes(v));
        x.guide(tap ? [`[data-a="sldrop:${TS}"]`, `.menu [data-k="${tap}"]`] : null);
      };
      check(); next();
      const e0 = x.errors, Gx = G(x);
      await x.wait(G(x, {
        page: later(next), pane: later(next), tab: later(next), visual: later(next), canvas: later(next),
        cmd: c => c === 'relations' ? x.oops('Modification des relations pour filtrer les entrées') : Gx.cmd(c),
        'model.tool': () => x.oops('Modification des relations pour filtrer les entrées'),
        'well.add': p => p.vis === DS && /Date_Achat/.test(JSON.stringify(p)) ? x.oops('Utilisation de Date_Achat') : x.oops('', 'Les segments existants suffisent.'),
        'well.remove': () => x.oops('', 'Les segments existants suffisent.'),
        'interaction.set': p => p.tgt === 'vis_105_entrees' ? x.oops('Modification des relations pour filtrer les entrées') : x.oops('', 'Les interactions sont déjà réglées.'),
        slicer: later(() => { check(); if (seen.size === 6) PBQ.act('ok.state'); else next(); }),
        'ok.state': () => seen.size === 6 ? true : undefined,
        'viz.change': () => { check(); if (seen.size === 6) return true; next(); }
      }));
      x.guide();
      await x.ok('Six contextes testés. Les entrées historiques sont restées à 27 dans chacun.');
      await x.inputs({ lbl: 'Préparation du week-end', q: 'Billets déjà vendus pour les visites des 6 et 7 juin ?', fields: [{ id: 'b', label: 'Billets' }, { id: 't', label: 'Ventes TTC', unit: '€' }], check: v => {
        if (v.b == null || v.t == null) return ['', 'Complète les deux valeurs.'];
        if (v.b === 5 && near(v.t, 156)) return 'Sélection du samedi uniquement';
        if (v.b === 5) return 'Résultat de cinq billets';
        if (v.b === 31) return 'Total de 31 billets';
        if (near(v.t, 96)) return 'Total de 96 € pour tout le week-end';
        if (v.b !== 9) return ['', 'Sélectionne les deux journées dans le segment des visites prévues.'];
        if (!near(v.t, 276)) return ['', 'Relis la carte Ventes TTC pour le week-end.'];
        return true;
      } });
      await x.ask('Quelles transactions correspondent à ces neuf billets ?', [{ t: 'B012, B015, B016, B019 et B020', ok: true }, { t: 'B016, B017, B018, B019 et B020', msg: 'Ce sont les dernières ventes enregistrées, pas les visites prévues le week-end.' }, { t: 'B012, B015 et B019', msg: 'Ce sont les visites du samedi seulement.' }]);
      const eA = x.errors - e0, eI0 = x.errors;
      await x.ask('Oscar : « Nous sommes dimanche. Les cinq billets de samedi ont donc tous été utilisés ? »', [{ t: 'Oui, puisque samedi est passé', msg: 'Ces billets sont des visites prévues : rien ne prouve qu’ils ont été utilisés.' }, { t: 'Non, la carte Entrées n’a pas bougé : personne n’est venu samedi', err: 'Zéro entrée annoncée pour samedi' }, { t: 'On ne sait pas : le registre des entrées s’arrête au 5 juin', ok: true }]);
      await x.ask('Pourquoi les 27 entrées n’ont-elles pas changé avec les segments ?', [{ t: 'Ce sont les entrées du week-end', err: '27 entrées considérées comme les entrées du week-end' }, { t: 'Elles viennent d’une autre table, du 1er au 5 juin, hors segments commerciaux', ok: true }]);
      first(4, { 'Contrôles de filtrage': eA ? 0 : 10, 'Interprétation des entrées': x.errors - eI0 ? 0 : 5 });
      hintsOf(x, 4);
    }, avance: P => { P.pages.forEach(p => p.visuals.forEach(v => { if (v.type === 'slicer') v.sel = null; })); } },

    /* 5 — Quelle attraction mérite notre attention ? */
    { titre: 'Quelle attraction mérite notre attention ?', async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st; timer();
      K.ready(x, 'page_001'); clearSel(pbi); pbi.render();
      await x.say('oscar', 'Nous devons organiser nos équipes techniques. Quelle attraction a enregistré le plus de passages ? Et quelle journée a été la plus chargée ?');
      await x.say('oscar', 'Est-ce que nous devrions fermer l’attraction la moins fréquentée ?');
      x.todo('Utilise les trois graphiques de la page Attractions, puis explore la composition de la journée la plus chargée.');
      const e0 = x.errors;
      const pt = () => st.xsel && st.xsel.vis === STACK && st.xsel.value === '2026-06-05';
      const next = () => {
        if (P().activePage !== 'page_003') { x.guide('[data-a="ptab:page_003"]'); return; }
        const d = pbi.chartData(K.visOf(x, STACK)), i = d ? d.cats.indexOf('2026-06-05') : 4;
        x.guide(`[data-a^="seg:${STACK}|${i}|"]`);
      };
      next();
      await x.wait(G(x, {
        page: later(next), pane: later(next), tab: later(next), visual: later(next), canvas: later(next), 'nav.page': later(next),
        'viz.type': p => p.type === 'stacked100' ? x.oops('Modification du graphique empilé en graphique 100 % empilé') : x.oops('', 'Les graphiques gardent leur type.'),
        'well.agg': p => p.agg === 'count' ? x.oops('Total de 20 passages') : x.oops('', 'Les agrégations des graphiques sont déjà justes.'),
        'chart.point': p => { setTimeout(() => { if (pt()) PBQ.act('ok.state'); else next(); }, 0); },
        'ok.state': () => pt() ? true : undefined,
        'viz.change': () => { if (pt()) return true; next(); }
      }));
      x.guide();
      await x.pixel('L’info-bulle détaille la journée : chaque attraction, sa couleur, son nombre de passages.');
      await x.ask('Quelle attraction a enregistré le plus de passages ?', [{ t: 'Pirates', err: 'Pirates identifié comme premier' }, { t: 'Dragon', ok: true }, { t: 'Wonder Wheel', msg: 'Compare les barres du graphique horizontal.' }]);
      const e1 = x.errors - e0, eQ0 = x.errors;
      await x.inputs({ lbl: 'Les chiffres clés', fields: [{ id: 'dr', label: 'Passages · Dragon' }, { id: 'sk', label: 'Passages · Sky Tower' }, { id: 'tot', label: 'Total historique' }, { id: 'd5', label: 'Dragon, le 5 juin' }], check: v => {
        if ([v.dr, v.sk, v.tot, v.d5].some(n => n == null)) return ['', 'Complète les quatre valeurs.'];
        if (v.tot === 20) return 'Total de 20 passages';
        if (v.d5 === 15) return 'Cinq passages de Dragon interprétés comme total de la journée du 5 juin';
        if (v.dr !== 18 || v.sk !== 8) return ['', 'Relis les barres du graphique Passages par attraction.'];
        if (v.tot !== 50) return ['', 'Additionne les passages des quatre attractions.'];
        if (v.d5 !== 5) return ['', 'Relis l’info-bulle de la colonne du 5 juin.'];
        return true;
      } });
      await x.ask('Quelle journée a été la plus chargée ?', [{ t: 'Le 5 juin, avec 15 passages', ok: true }, { t: 'Le 5 juin, le jour le plus rentable', err: '5 juin annoncé comme jour le plus rentable' }, { t: 'Le 4 juin, avec 12 passages', msg: 'Compare les cinq colonnes du graphique quotidien.' }]);
      await x.ask('Entre le 2 et le 3 juin, les passages passent de 10 à 7. Pourquoi ?', [{ t: 'Une panne a dû arrêter une attraction', err: 'Baisse du 3 juin attribuée à une panne' }, { t: 'La cause n’est pas connue : c’est une piste à investiguer', ok: true }]);
      await x.ask('Les 50 passages correspondent-ils à 50 visiteurs ?', [{ t: 'Oui, 50 visiteurs uniques', err: '50 visiteurs uniques annoncés' }, { t: 'Non : une même personne peut faire plusieurs attractions', ok: true }]);
      const e2 = x.errors - eQ0, eR0 = x.errors;
      await x.ask('Oscar : « Faut-il fermer Sky Tower ? » Ta recommandation :', [{ t: 'Oui, la fermer au plus vite', err: 'Fermeture immédiate de Sky Tower recommandée' }, { t: 'Examiner la capacité de Dragon et comprendre la faible fréquentation de Sky Tower, sans décider sur ces seuls chiffres', ok: true }]);
      await x.say('oscar', 'D’accord. Il nous faudrait les coûts, les horaires, les capacités et la satisfaction avant de décider.');
      P().activePage = 'page_001'; clearSel(pbi); pbi.render();
      first(5, { 'Classement': e1 ? 0 : 4, 'Analyse quotidienne': e2 ? 0 : 4, 'Recommandation': x.errors - eR0 ? 0 : 2 });
      hintsOf(x, 5);
    } },

    /* 6 — L'incident en pleine présentation */
    { titre: 'L’incident en pleine présentation', async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st; timer();
      K.ready(x, 'page_001'); clearSel(pbi);
      const ds = K.visOf(x, DS), ts = K.visOf(x, TS), ttc = K.visOf(x, 'vis_105_ventes_ttc'), ent = K.visOf(x, 'vis_105_entrees');
      ds.sel = { kind: 'range', min: '2026-06-06', max: '2026-06-07' }; ts.sel = null;
      P().filters = (P().filters || []).filter(f => !(f.t === B && f.c === 'Canal')).concat({ t: B, c: 'Canal', kind: 'basic', values: ['Web'] });
      pbi.render();
      await x.say('victoria', 'Peux-tu sélectionner de nouveau les visites du week-end ?');
      await x.say('gabriel', 'Quatre billets et 122 € ? Tout à l’heure, nous avions neuf billets et 276 euros. Pourquoi les résultats ont-ils changé ?');
      await x.pixel('Les données sources n’ont pas changé. Vérifie le contexte du rapport.');
      x.todo('Identifie l’origine de l’écart sans modifier les données. Vérifie ensuite que toutes les cartes commerciales réagissent au segment.');
      let stage = 'A', eE = 0;
      const web = () => (P().filters || []).find(f => f.t === B && f.c === 'Canal');
      const wkOk = () => range(ds, '2026-06-06', '2026-06-07');
      const okA = () => (!web() || !restr(web())) && wkOk() && card(x, 'vis_105_billets') === 9 && near(card(x, 'vis_105_ventes_ttc'), 276);
      const okB = () => pbi.inter(ds, ttc) === 'filter' && near(card(x, 'vis_105_ventes_ttc'), 276) && pbi.inter(ds, ent) === 'none' && pbi.inter(ts, ent) === 'none';
      const next = () => {
        if (stage === 'A') { x.guide(st.pane !== 'Filtres' ? '[data-a="pane:Filtres"]' : `[data-a="fcdel:report|${B}|Canal"]`); return; }
        x.guide(!st.editInter ? (st.selVis !== DS ? `[data-a="vis:${DS}"]` : st.tab !== 'Format' ? '[data-a="tab:Format"]' : '[data-a="cmd:interactions"]') : `[data-a="inter:${DS}|vis_105_ventes_ttc|filter"]`);
      };
      next();
      const Gx = G(x);
      const H = () => G(x, {
        page: later(next), pane: later(next), tab: later(next), visual: later(next), canvas: later(next), 'interaction.mode': later(next),
        cmd: c => c === 'transform' ? x.oops('Suppression de lignes Web dans Power Query') : Gx.cmd(c),
        slicer: p => p.vis === DS ? x.oops('Suppression du segment de dates') : x.oops('', 'Garde le périmètre demandé : le week-end, toutes catégories.'),
        'vis.delete': p => p.vis === DS ? x.oops('Suppression du segment de dates') : x.oops('', 'Garde ce visuel.'),
        'well.add': p => p.vis === DS ? x.oops('Modification de Date_Visite vers Date_Achat') : x.oops('', 'Les champs ne sont pas en cause.'),
        'well.remove': p => p.vis === DS ? x.oops('Modification de Date_Visite vers Date_Achat') : x.oops('', 'Les champs ne sont pas en cause.'),
        'well.agg': p => p.agg === 'count' ? x.oops('Modification de Somme en Nombre') : x.oops('', 'Les agrégations ne sont pas en cause.'),
        'viz.fmt': p => CARDS.includes(p.vis) ? x.oops('Chiffres corrigés manuellement') : x.oops('', 'La mise en forme n’est pas en cause.'),
        'filter.add': p => x.oops(p && p.scope !== 'report' ? 'Filtre Web retiré uniquement du mauvais visuel' : '', 'Il ne faut pas ajouter de filtre, mais en retirer un.'),
        'filter.set': p => { if (p.scope === 'report' && p.c === 'Canal' && !p.restrictive) return; if (p.scope !== 'report') return x.oops('Filtre Web retiré uniquement du mauvais visuel'); if (p.restrictive) return x.oops('', 'Il ne faut pas ajouter de filtre, mais en retirer un.'); },
        'filter.remove': p => p.scope === 'report' && p.c === 'Canal' ? undefined : x.oops('Filtre Web retiré uniquement du mauvais visuel'),
        'filter.type': () => x.oops('', 'Le type de filtrage n’est pas en cause.'),
        'interaction.set': p => {
          if (stage === 'A') return x.oops('', 'Commence par chercher pourquoi le week-end ne donne que quatre billets.');
          if (p.tgt === 'vis_105_entrees' && p.mode !== 'none') { eE++; return x.oops('Interaction des segments activée sur la carte Entrées'); }
          if (p.src === DS && p.tgt === 'vis_105_ventes_ttc' && p.mode !== 'filter') return x.oops('Interaction TTC toujours désactivée');
          if (!(p.src === DS && p.tgt === 'vis_105_ventes_ttc')) return x.oops('', 'Cette interaction est correcte : concentre-toi sur la carte qui affiche encore un total global.');
        },
        'viz.change': () => { if (stage === 'A' ? okA() : okB()) return true; next(); }
      });
      const eA0 = x.errors;
      await x.wait(H());
      x.guide();
      const eA = x.errors - eA0;
      await x.ok('Un filtre de rapport, Canal est Web, réduisait toutes les ventes. Sans lui : 9 billets et 276 €.');
      stage = 'B';
      P().interactions = Object.assign(P().interactions || {}, { [DS + '>vis_105_ventes_ttc']: 'none' }); pbi.render();
      await x.say('gabriel', 'Attends… La carte Ventes TTC affiche maintenant 1 310 €, alors que les billets portent sur le week-end.');
      const eB0 = x.errors; next();
      await x.wait(H());
      x.guide(); st.editInter = false; clearSel(pbi);
      delete P().interactions[DS + '>vis_105_ventes_ttc']; P().filters = (P().filters || []).filter(f => !(f.t === B && f.c === 'Canal')); pbi.render();
      const eB = x.errors - eB0;
      const cmp = K.lesson('Diagnostic du rapport', 'Deux incidents, deux causes', `<table class="tbl wrap" style="width:100%"><thead><tr><th><span class="thc">Situation</span></th><th class="r"><span class="thc">Billets</span></th><th class="r"><span class="thc">TTC</span></th></tr></thead><tbody>
        ${[['Week-end et filtre Web', '4', '122 €'], ['Filtre Web supprimé', '9', '276 €'], ['Interaction TTC désactivée', '9', '1 310 €'], ['Interaction TTC rétablie', '9', '276 €']].map(r => `<tr><td>${esc(r[0])}</td><td class="r">${r[1]}</td><td class="r"><b>${esc(fr(r[2]))}</b></td></tr>`).join('')}</tbody></table><p class="lc-note">${esc(fr('La carte Entrées enregistrées est restée à 27 dans chaque situation.'))}</p>`);
      x.app('diag', cmp);
      await x.ok('Interaction rétablie : les trois cartes commerciales portent de nouveau sur le week-end.');
      x.app('pbi');
      first(6, { 'Correction du filtre': eA ? 0 : 6, 'Correction de l’interaction': eB ? 0 : 6, 'Indépendance des entrées': eE ? 0 : 3 });
      hintsOf(x, 6);
    }, avance: P => { P.filters = (P.filters || []).filter(f => !(f.t === B && f.c === 'Canal')); if (P.interactions) delete P.interactions[DS + '>vis_105_ventes_ttc']; } },

    /* 7 — Un rapport utilisable sans ton aide */
    { titre: 'Un rapport utilisable sans ton aide', async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st; timer();
      K.ready(x, 'page_001'); clearSel(pbi);
      const ds = K.visOf(x, DS), ts = K.visOf(x, TS); ds.sel = null; ts.sel = null; pbi.render();
      await x.say('victoria', 'Imagine que tu sois absent demain. Pourrions-nous continuer à utiliser ton rapport sans toi ?');
      await x.say('victoria', 'Sélectionne le week-end, visite les trois pages avec le menu, puis reviens sur la vue principale.');
      x.todo('Vérifie que le rapport s’utilise sans toi : week-end sélectionné, parcours Détail des ventes, Attractions, puis Vue générale.');
      const e0 = x.errors;
      const visited = [], ROUTE = ['page_002', 'page_003', 'page_001'];
      const wkOk = () => range(ds, '2026-06-06', '2026-06-07');
      const next = () => {
        if (!wkOk() && !visited.length) { const s = ds.sel && ds.sel.kind === 'range' ? ds.sel : {}; x.guide(P().activePage !== 'page_001' ? '[data-a="ptab:page_001"]' : s.min !== '2026-06-06' ? [`[data-a="slrange:${DS}|min"]`, '.menu [data-k="2026-06-06"]'] : [`[data-a="slrange:${DS}|max"]`, '.menu [data-k="2026-06-07"]']); return; }
        const want = ROUTE[visited.length]; if (!want) return;
        const n = K.pageOf(x, P().activePage).visuals.find(v => v.type === 'navigator');
        x.guide(n ? `[data-a="navgo:${n.id}|${want}"]` : `[data-a="ptab:${want}"]`);
      };
      next();
      const step = id => { if (!wkOk()) { visited.length = 0; } else if (id === ROUTE[visited.length]) visited.push(id); else if (id === 'page_002') { visited.length = 0; visited.push(id); } setTimeout(() => { if (visited.length === 3 && wkOk()) PBQ.act('ok.state'); else next(); }, 0); };
      const Gx = G(x);
      await x.wait(G(x, {
        pane: later(next), tab: later(next), visual: later(next), canvas: later(next),
        page: id => step(id), 'nav.page': ({ page }) => step(page),
        slicer: p => { if (visited.length && p.vis === DS) return x.oops('Retour sur Vue générale avec un segment réinitialisé'); if (p.vis === TS) return x.oops('', 'Garde toutes les catégories : seul le week-end est demandé.'); setTimeout(next, 0); },
        cmd: c => c === 'syncslicers' ? x.oops('Cinq transactions seulement dans Détail') : Gx.cmd(c),
        'viz.create': p => x.oops(p.type === 'navigator' ? 'Nouveau navigateur créé à la place d’un navigateur existant' : '', 'Le rapport est approuvé : aucun nouvel objet.'),
        'button.kind': () => x.oops('Nouveau navigateur créé à la place d’un navigateur existant'),
        'vis.delete': p => /^note_109_/.test(p.vis) ? x.oops('Suppression d’une mention historique') : x.oops('', 'Garde cet objet.'),
        'theme.set': () => x.oops('Modification de l’identité visuelle'), 'page.fmt': () => x.oops('Modification de l’identité visuelle'),
        'viz.fmt': p => x.oops(/^(shape|title|nav|note)_109_/.test(p.vis) ? 'Modification de l’identité visuelle' : '', 'La mise en forme approuvée reste telle quelle.'),
        'tab.skip': p => !p.skip && /^shape_/.test(p.vis) ? x.oops('Forme décorative réintroduite dans la tabulation') : x.oops('', 'L’ordre de tabulation est déjà validé.'),
        'ok.state': () => visited.length === 3 && wkOk() ? true : undefined,
        'viz.change': later(next)
      }));
      x.guide();
      await x.ok(`Retour sur Vue générale : le week-end est toujours sélectionné, ${card(x, 'vis_105_billets')} billets et 27 entrées.`);
      await x.ask('Sur la page Attractions, les graphiques réagissent-ils au segment Catégorie de billet ?', [{ t: 'Oui, ils se filtrent aussi', err: 'Page Attractions filtrée par la catégorie de billet' }, { t: 'Non : aucune relation ne relie la billetterie aux attractions', ok: true }]);
      const eN = x.errors - e0, eI0 = x.errors;
      await x.inputs({ lbl: 'Inventaire du rapport', q: 'Contrôle la présentation sans rien créer.', fields: [{ id: 'p', label: 'Pages' }, { id: 'a', label: 'Visualisations analytiques' }, { id: 'o', label: 'Objets au total' }], check: v => {
        if ([v.p, v.a, v.o].some(n => n == null)) return ['', 'Complète les trois valeurs.'];
        if (v.p !== 3) return ['', 'Compte les onglets de pages.'];
        if (v.a !== 12) return ['', 'Quatre cartes, trois tableaux, trois graphiques, deux segments.'];
        if (v.o !== 26) return ['', 'Ajoute les quatorze objets de présentation : bandeaux, titres, mentions, navigateurs.'];
        return true;
      } });
      const eI = x.errors - eI0, eX0 = x.errors;
      await x.ask('Qu’est-ce qui distingue la carte Entrées pour tous les lecteurs ?', [{ t: 'Son fond bleu brume', msg: 'Une couleur seule ne suffit pas pour tous les lecteurs.' }, { t: 'La mention « Historique 1–5 juin · Hors segments » et son texte de remplacement', ok: true }]);
      await x.ask('Pourquoi éviter le doré pour les petits libellés sur fond blanc ?', [{ t: 'Son contraste, 2,45:1, reste sous l’objectif de 4,5:1', ok: true }, { t: 'Parce que l’or n’appartient pas à la charte', msg: 'L’or fait partie de la charte : il est réservé aux accents.' }]);
      ds.sel = null; pbi.render();
      first(7, { 'Navigation': eN ? 0 : 4, 'Inventaire': eI ? 0 : 3, 'Accessibilité': x.errors - eX0 ? 0 : 3 });
      hintsOf(x, 7);
    }, avance: P => { P.pages.forEach(p => p.visuals.forEach(v => { if (v.type === 'slicer') v.sel = null; })); } },

    /* 8 — À toi de présenter les résultats */
    { titre: 'À toi de présenter les résultats', async run(x) {
      const pbi = x.pbi, P = () => pbi.P, st = pbi.st; timer();
      K.ready(x, 'page_001'); clearSel(pbi);
      const ds = K.visOf(x, DS), ts = K.visOf(x, TS);
      ds.sel = { kind: 'range', min: '2026-06-06', max: '2026-06-07' }; pbi.render();
      await x.say('victoria', 'Nous avons contrôlé les données, les indicateurs et les visualisations. Présente-nous maintenant tes principales conclusions.');
      await x.say('gabriel', 'Quelles sont les informations commerciales les plus importantes ?');
      await x.say('oscar', 'Et que savons-nous réellement de la fréquentation ?');
      /* Conclusions */
      const STAT = [
        ['c1', '40 billets vendus pour 1 310 € TTC.', 1], ['c2', 'Le parc a déjà accueilli 40 visiteurs uniques.', 0, '40 billets interprétés comme 40 personnes uniques'],
        ['c3', 'Le Web génère 646 € TTC et 20 billets.', 1], ['c4', 'Le canal Web est forcément le plus rentable.', 0, 'Confusion entre montant TTC et bénéfice'],
        ['c5', 'Neuf billets étaient vendus pour les visites des 6 et 7 juin.', 1], ['c6', 'Neuf entrées ont été enregistrées ce week-end.', 0, '9 entrées réelles annoncées pour le week-end'],
        ['c7', 'Les 27 entrées enregistrées concernent le 1er au 5 juin.', 1], ['c8', 'Le taux de fréquentation réel est de 27 sur 40.', 0, 'Taux de fréquentation réel calculé avec 27 ÷ 40'],
        ['c9', 'Dragon a enregistré 18 passages, le volume le plus élevé.', 1], ['c10', 'Dragon est l’attraction préférée des visiteurs.', 0, 'Popularité assimilée à la satisfaction'],
        ['c11', 'Sky Tower doit être définitivement fermée.', 0, 'Conclusion causale non démontrée'], ['c12', 'Les entrées réelles du week-end ne sont pas disponibles.', 1]
      ];
      const board = (title, intro, rows, opts, btn) => K.matching({ title, intro, plain: true, placeholder: 'Choisir', btn, options: opts, rows: rows.map(r => ({ id: r[0], label: fr(r[1]) })) });
      const bc = board('Construis ta restitution', 'Pour chaque affirmation : démontrée par les données, ou non ?', STAT, [['oui', 'Démontrée'], ['non', 'Non démontrée']], 'Soumettre mes conclusions');
      x.app('conclusions', bc.el);
      x.todo('Sélectionne uniquement les conclusions démontrées par les données.');
      const e0 = x.errors;
      await x.wait({ 'match.pick': () => {}, 'match.check': ({ values }) => {
        const miss = STAT.filter(r => !values[r[0]]); if (miss.length) return x.oops('', `Il reste ${miss.length === 1 ? 'une affirmation' : miss.length + ' affirmations'} à classer.`);
        const bad = STAT.filter(r => (values[r[0]] === 'oui') !== !!r[2]);
        bc.mark(STAT.filter(r => !bad.includes(r)).map(r => r[0]), bad.map(r => r[0]));
        if (!bad.length) { bc.lock(); return true; }
        const w = bad.find(r => !r[2] && r[3]) || bad[0];
        return x.oops(w[3] || '', `« ${w[1]} » : relis cette affirmation, elle est démontrée par le rapport.`);
      } });
      const eC = x.errors - e0, eR0 = x.errors;
      await x.ok('Six conclusions démontrées, six affirmations écartées.');
      /* Recommandations */
      const REC = [['r1', 'Préparer l’accueil à partir des billets déjà vendus', 1], ['r2', 'Approfondir les performances commerciales du Web', 1], ['r3', 'Fermer Sky Tower dès la semaine prochaine', 0, 'Conclusion causale non démontrée'], ['r4', 'Examiner la capacité et les besoins de Dragon', 1], ['r5', 'Actualiser les registres des entrées et des passages', 1], ['r6', 'Augmenter les prix du Web, puisqu’il est le plus rentable', 0, 'Confusion entre montant TTC et bénéfice'], ['r7', 'Collecter les coûts et les données de satisfaction', 1]];
      const br = board('Tes recommandations', 'Lesquelles les données permettent-elles de proposer ?', REC, [['oui', 'À proposer'], ['non', 'À écarter']], 'Soumettre mes recommandations');
      x.app('recos', br.el);
      x.todo('Choisis les recommandations compatibles avec les données disponibles.');
      await x.wait({ 'match.pick': () => {}, 'match.check': ({ values }) => {
        const miss = REC.filter(r => !values[r[0]]); if (miss.length) return x.oops('', `Il reste ${miss.length === 1 ? 'une recommandation' : miss.length + ' recommandations'} à classer.`);
        const bad = REC.filter(r => (values[r[0]] === 'oui') !== !!r[2]);
        br.mark(REC.filter(r => !bad.includes(r)).map(r => r[0]), bad.map(r => r[0]));
        if (!bad.length) { br.lock(); return true; }
        const w = bad.find(r => !r[2] && r[3]) || bad[0];
        return x.oops(w[3] || '', `« ${w[1]} » : cette action est justifiée par les données.`);
      } });
      const eR = x.errors - eR0;
      const model = K.lesson('Restitution modèle', 'Environ 90 secondes', `<div class="speech">${['Notre extraction du 6 juin contient vingt transactions, soit quarante billets pour 1 310 € TTC. Le montant moyen par transaction est de 65,50 €.', 'Les billets adultes génèrent le montant le plus élevé, 480 € TTC. Le Web est notre principal canal dans cet échantillon : vingt billets et 646 € de ventes.', 'Pour le week-end, neuf billets étaient déjà vendus pour les visites des 6 et 7 juin, soit 276 € TTC. Ce sont des visites prévues, pas des entrées effectives.', 'Du 1er au 5 juin, nous avons enregistré vingt-sept entrées et cinquante passages dans les attractions. Dragon arrive en tête avec dix-huit passages.', 'Je recommande d’actualiser les données du week-end et de compléter nos sources avec les coûts, les temps d’attente et la satisfaction des visiteurs, pour analyser les performances sans conclusion prématurée.'].map(p => `<p>${esc(fr(p))}</p>`).join('')}</div>`);
      x.app('restitution', model);
      await x.pixel('Voici une restitution de référence. Elle s’appuie sur les faits, leur sens et leurs limites.');
      x.app('pbi');
      /* Restaurer et enregistrer */
      const eS0 = x.errors;
      const nextS = () => {
        if (P().activePage !== 'page_001') { x.todo('Reviens sur Vue générale.'); x.guide('[data-a="ptab:page_001"]'); return; }
        if (ts.sel) { x.todo('Restaure le rapport : efface les catégories sélectionnées.'); x.guide(`[data-a="slclear:${TS}"]`); return; }
        if (ds.sel) { x.todo('Restaure le rapport : efface la période du segment de dates.'); x.guide(`[data-a="slclear:${DS}"]`); return; }
        x.todo('Rapport restauré : enregistre Wonderland_Pilotage.'); x.guide('.pbi-save');
      };
      nextS();
      const save = () => {
        pbi.closeBackstage();
        if (ds.sel || ts.sel || restrictiveAnywhere(P()) || st.xsel) return x.oops('Rapport sauvegardé avec une restriction active');
        if (sig(P()) !== CHECK) { const d = diffSig(P()); return x.oops('Projet final différent du checkpoint approuvé', d ? `Vérifie ${d} : sa configuration diffère du rapport approuvé.` : null); }
        if (card(x, 'vis_105_billets') !== 40 || !near(card(x, 'vis_105_ventes_ttc'), 1310) || !near(card(x, 'vis_105_vente_moyenne'), 65.5) || card(x, 'vis_105_entrees') !== 27) return x.oops('Projet final différent du checkpoint approuvé');
        P().dirty = false; P().saved = true; pbi.render(); return true;
      };
      const Gx = G(x);
      await x.wait(G(x, { page: later(nextS), pane: later(nextS), slicer: later(nextS), 'nav.page': later(nextS), save: () => save(), 'file.menu': () => {}, file: k => k === 'back' ? undefined : k === 'save' ? save() : x.oops('', 'Utilise Enregistrer pour garder le même projet.'), 'viz.change': later(nextS) }));
      x.guide();
      const e = EV(); if (e.mode === 'test' && e.t0 && !e.tEnd) { e.tEnd = Date.now(); store.save(); }
      await x.ok('Projet enregistré : 40 billets, 1 310 € TTC, 65,50 € par ligne, 27 entrées. Trois tables, vingt-six objets, aucune restriction.');
      first(8, { 'Conclusions': eC ? 0 : 7, 'Recommandations': eR ? 0 : 4, 'Restauration du rapport': x.errors - eS0 ? 0 : 4 });
      hintsOf(x, 8);
    }, avance: P => { P.pages.forEach(p => p.visuals.forEach(v => { if (v.type === 'slicer') v.sel = null; })); P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'conseil', n: 'Tu termines ta présentation. Le silence s’installe. Victoria regarde Gabriel.' },
    { p: 'gabriel', t: 'Les résultats sont cohérents. Les quarante billets et les 1 310 euros correspondent bien à nos données commerciales.' },
    { p: 'lola', t: 'Les tableaux vont nous permettre de préparer nos prochaines analyses commerciales.' },
    { p: 'oscar', t: 'Et nous savons ce que nous devons encore mesurer. C’est important de ne pas décider sur des informations incomplètes.' },
    { clear: 1, p: 'victoria', t: 'Quand tu es arrivé à Wonderland, nous avions des fichiers dispersés. Aujourd’hui, nous avons un rapport structuré, contrôlé et interactif.' },
    { p: 'victoria', t: 'Tu viens de terminer ta première mission de pilotage en autonomie. Félicitations.' },
    { p: 'pixel', t: 'Tu maîtrises les fondamentaux de Power BI : importer, contrôler, visualiser et expliquer.' },
    { card: { k: 'Module 1 · Les premiers pas', h: '10 missions validées', chips: ['101 · Ton premier jour', '102 · Les billets d’entrée', '103 · Le registre des visiteurs', '104 · Les portes du parc', '105 · Les premières statistiques', '106 · Une journée mouvementée', '107 · Les attractions populaires', '108 · Les visiteurs du week-end', '109 · Le rapport de Victoria', '110 · La première présentation'] } },
    { clear: 1, bg: 'parc', n: 'La caméra quitte la salle du conseil, traverse les bureaux, la billetterie et les zones d’exploitation.' },
    { card: { k: 'Réseau de pilotage de Wonderland', h: '3 services sur 6 connectés', chips: ['Billetterie', 'Fréquentation', 'Attractions'] } },
    { wait: 800 }
  ],
  recompense: { titre: 'Premier niveau maîtrisé !', sous: 'Tu as réussi les dix missions des fondamentaux de Power BI.', badge: 'b110', badgeNom: 'Analyste autonome', objet: 'certificat' },
  bilan() {
    const e = EV(), pts = Object.values(e.first || {}).reduce((a, p) => a + Object.values(p).reduce((s, n) => s + n, 0), 0);
    const hints = Object.values(e.hints || {}).reduce((a, n) => a + n, 0);
    const dur = e.mode === 'test' && e.t0 ? Math.round(((e.tEnd || Date.now()) - e.t0) / 1000) : null;
    const level = pts >= 90 ? 'Excellent' : pts >= 75 ? 'Solide' : pts >= 55 ? 'En progression' : 'À consolider';
    const auto = hints === 0 ? 'Autonome' : hints <= 6 ? 'Aide ponctuelle' : 'Accompagné';
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const rows = (e.first ? Object.entries(e.first) : []).sort((a, b) => a[0] - b[0]).map(([i, p]) => `<tr><td>Défi ${i}</td><td class="r">${Object.values(p).reduce((s, n) => s + n, 0)}/${POINTS[i - 1]}</td></tr>`).join('');
    return h(`<div class="bilan">
      <p class="bl-k">Bilan de l’épreuve · ${e.mode === 'test' ? 'mode test technique' : 'mode apprentissage'}</p>
      <div class="bl-score"><b>${pts}</b><span>/100</span></div>
      <p class="bl-sub">${esc(fr('Score de première tentative. Score de maîtrise : 100/100, les huit défis validés.'))}</p>
      <div class="bl-grid">
        <div><small>Niveau initial</small><b>${esc(level)}</b></div>
        <div><small>Autonomie</small><b>${esc(auto)}</b><span>${hints}/24 indices</span></div>
        ${dur != null ? `<div><small>Objectif de 30 minutes</small><b>${dur <= 1800 ? 'Atteint' : 'Dépassé'}</b><span>${Math.max(1, Math.round(dur / 60))} min</span></div>` : ''}
        <div><small>Certificat</small><b>Débloqué</b></div>
      </div>
      <table class="tbl" style="width:100%; margin-top:14px"><tbody>${rows}</tbody></table>
      <div class="cert">
        <p class="ct-k">Power BI Quest · Wonderland Academy</p>
        <h2>Certificat de réussite</h2>
        <p class="ct-s">Ce certificat atteste la validation du parcours</p>
        <h3>Les fondamentaux de Power BI</h3>
        <p class="ct-d">10 missions immersives · 80 exercices pratiques</p>
        <p class="ct-skills">Importation, qualité, agrégations, visualisations, filtres, restitution métier</p>
        <p class="ct-rank">Rang obtenu : Data Analyst Junior</p>
        <div class="ct-sig"><span><i>Victoria</i>Direction Wonderland</span><span><i>Pixel</i>Académie Data</span></div>
        <p class="ct-f">${esc(fr(`Certificat pédagogique interne · Module 01 · ${today}`))}</p>
      </div>
      <p class="bl-note">${esc(fr('Il ne s’agit pas d’une certification officielle Microsoft : le rang Data Analyst Junior est un niveau de progression du jeu.'))}</p>
      <div class="bl-path"><p class="bl-k">Mon parcours de formation</p>
        <div class="bl-grid"><div><small>Missions</small><b>10/10</b></div><div><small>Exercices validés</small><b>80</b></div><div><small>Expérience</small><b>${esc(fr(String(S.xp).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' XP'))}</b></div><div><small>Fiches de révision</small><b>80</b></div></div>
        <ul class="skills">${['Interface Power BI', 'Importation Excel', 'Importation CSV', 'Types de données', 'Agrégations implicites', 'Tableaux et regroupements', 'Graphiques', 'Filtres et segments', 'Design et navigation', 'Analyse en autonomie'].map(s => `<li><span>${esc(s)}</span><b>Acquis</b></li>`).join('')}</ul>
      </div>
    </div>`);
  },
  fiches: [
    ['Fiabilité des données', 'Avant d’analyser un rapport, quels contrôles effectuer sur ses sources ?', 'Les connexions, les requêtes et le type de chaque colonne dans Power Query. Une carte juste ne garantit pas que les données sont bien typées.'],
    ['Agrégations', 'Pourquoi Nombre de Quantite donne-t-il 20 et non 40 ?', 'Nombre compte les lignes, Somme additionne les quantités. Une transaction peut contenir plusieurs billets.'],
    ['Analyse commerciale', 'Le canal qui vend le plus est-il le plus rentable ?', 'Pas forcément : sans coûts ni commissions, on mesure une contribution aux ventes, pas une rentabilité.'],
    ['Dates et périmètres', 'Visites prévues ou entrées réelles ?', 'Date_Visite décrit une visite prévue. Les entrées réelles viennent d’un autre registre, arrêté au 5 juin.'],
    ['Lire un graphique', 'Quel graphique pour comparer les attractions ? Et les journées ?', 'Les barres classent les attractions, les colonnes suivent les journées, l’empilé montre la composition d’une journée.'],
    ['Diagnostiquer un écart', 'Les chiffres changent sans que les données bougent : où chercher ?', 'Dans le contexte : filtres de visuel, de page ou de rapport, segments et interactions.'],
    ['Un rapport autonome', 'Comment vérifier qu’un rapport s’utilise sans son auteur ?', 'Tester la navigation, contrôler l’inventaire des objets, l’accessibilité et la conservation des sélections.'],
    ['Restituer des résultats', 'Que doit contenir une bonne restitution ?', 'Des faits vérifiables, leur période et leur sens, leurs limites, et des recommandations proportionnées aux données.']
  ],
  suite: [
    { bg: 'bureau', n: 'Lundi 8 juin, 7 h 55. Ton certificat est encadré au-dessus de l’écran panoramique. La maquette de Dragon tourne doucement sur l’étagère.' },
    { p: 'pixel', t: 'Le premier rapport est terminé. Nous pouvons maintenant intégrer les autres services de Wonderland.' },
    { card: { k: 'Messages reçus', ul: ['Oscar, maintenance : export des interventions techniques', 'Gabriel, finance : anciens fichiers de dépenses du parc', 'Lola, marketing : historique clients et réservations'] } },
    { p: 'pixel', t: 'Ah… nous avons un problème.' },
    { clear: 1, card: { k: 'Maintenance_Wonderland_Brut.xlsx', h: 'Aperçu de la prochaine source', ul: ['En-têtes mal positionnés', 'Valeurs manquantes et doublons apparents', 'Formats et types incohérents', 'Lignes de commentaires et de total mélangées'] } },
    { p: 'oscar', t: 'Désolé pour l’état du fichier. Chaque technicien le complète à sa manière depuis des années.' },
    { p: 'pixel', t: 'Avant toute visualisation, il faudra comprendre ces données, identifier leurs anomalies et les préparer correctement.' },
    { clear: 1, bg: 'controle', n: 'Sous-sol du bâtiment administratif. Oscar ouvre une porte métallique : des cartons, d’anciens ordinateurs, des classeurs à perte de vue.' },
    { p: 'oscar', t: 'Toute l’histoire du parc se trouve ici. Si nous rendons ces fichiers exploitables, nous comprendrons enfin une grande partie de nos problèmes.' },
    { p: 'pixel', t: 'Bienvenue dans le monde de Power Query.' }
  ],
  accroche: 'Huit défis en autonomie devant le conseil : sources, agrégations, segments, graphiques, incidents et restitution.',
  fin(P) { P.pages.forEach(p => p.visuals.forEach(v => { if (v.type === 'slicer') v.sel = null; })); P.activePage = 'page_001'; P.dirty = false; P.saved = true; }
};
window.PBQ.mission(def);
})();

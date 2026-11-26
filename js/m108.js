/* Mission 108 — Les visiteurs du week-end */
(function () {
'use strict';
const { h, esc, fr, $, $$, clone, D } = window.PBQ;
const PBI = window.PBI;
const B = 'tbl_billetterie';
const DS = 'vis_108_date_slicer', TS = 'vis_108_ticket_type_slicer';
const CARDS = ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees', 'vis_105_vente_moyenne'];
const OLD10 = CARDS.concat('vis_106_detail_ventes', 'vis_106_categories', 'vis_106_canaux', 'vis_107_attraction_bars', 'vis_107_daily_columns', 'vis_107_daily_stacked');
const CH107 = ['vis_107_attraction_bars', 'vis_107_daily_columns', 'vis_107_daily_stacked'];
const SL_SLOTS = [[2, 80.6, 47, 18.4], [51, 80.6, 47, 18.4]];
const WEEKEND = ['B012', 'B015', 'B016', 'B019', 'B020'];
const geo = s => ({ x: s[0], y: s[1], w: s[2], h: s[3] });

/* La page Vue générale s'allonge (1280 × 880) : les visuels gardent leur position, deux emplacements s'ajoutent en bas */
function extendCanvas(P) {
  const pg = P.pages.find(p => p.id === 'page_001'); if (!pg || pg.size) return;
  const k = 720 / 880;
  pg.visuals.forEach(v => { v.y = +(v.y * k).toFixed(2); v.h = +(v.h * k).toFixed(2); });
  pg.size = [1280, 880]; pg.slots = clone(SL_SLOTS);
}
const slicerOf = (id, slot, c, title, extra) => ({ id, type: 'slicer', ...geo(SL_SLOTS[slot]), f: { values: [{ t: B, c, agg: 'none' }], axis: [], legend: [], cols: [] }, title, fmt: {}, temp: false, sel: null, ...extra });
function addDateSlicer(P, weekend) {
  extendCanvas(P);
  const pg = P.pages.find(p => p.id === 'page_001');
  let v = pg.visuals.find(v => v.id === DS);
  if (!v) { v = slicerOf(DS, 0, 'Date_Visite', 'Période de visite prévue', { mode: 'range' }); pg.visuals.push(v); }
  v.sel = weekend ? { kind: 'range', min: '2026-06-06', max: '2026-06-07' } : null;
}
function addTypeSlicer(P) {
  extendCanvas(P);
  const pg = P.pages.find(p => p.id === 'page_001');
  if (!pg.visuals.some(v => v.id === TS)) pg.visuals.push(slicerOf(TS, 1, 'Type_Billet', 'Catégorie de billet', { mode: 'list', fmt: { ctrl: false } }));
  P.interactions = Object.assign(P.interactions || {}, { [TS + '>' + DS]: 'none' });
}
function interFinal(P) { P.interactions = Object.assign(P.interactions || {}, { [DS + '>vis_105_entrees']: 'none', [TS + '>vis_105_entrees']: 'none', [TS + '>' + DS]: 'none' }); }
function clearAll(P) {
  P.filters = (P.filters || []).filter(f => !PBI.restrictive(f));
  P.pages.forEach(p => { p.filters = (p.filters || []).filter(f => !PBI.restrictive(f)); p.visuals.forEach(v => { if (v.filters) v.filters = v.filters.filter(f => !PBI.restrictive(f)); if (v.type === 'slicer') v.sel = null; }); });
}

/* ───────── Aides ───────── */
const cardVal = (x, id) => { const v = K.visOf(x, id); if (!v) return null; const f = v.f.values[0], q = x.pbi.query(v); return q ? PBI.aggregate(q.rows.map(r => r[f.c]), f.agg) : null; };
const rowsOf = (x, id) => { const v = K.visOf(x, id); const q = v && x.pbi.query(v); return q ? q.rows : []; };
const restr = f => PBI.restrictive(f);
const anyRestr = list => (list || []).some(restr);
const fl = (list, c, t = B) => (list || []).find(f => f.t === t && f.c === c);
const later = fn => () => { setTimeout(fn, 0); };
const noTouch = x => x.oops('', 'Ce visuel est déjà validé : laisse-le tel quel.');
const pg1 = x => K.pageOf(x, 'page_001');
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
/* Guides du volet Filtres : ouvrir le volet, ajouter ou ouvrir la carte, puis l'action */
const fpG = (x, scope, c, after, t = B) => {
  const st = x.pbi.st, key = `${scope}|${t}|${c}`;
  if (st.pane !== 'Filtres') return '[data-a="pane:Filtres"]';
  const f = x.pbi.fpFind(scope, t, c);
  if (!f) return [`[data-a="fpadd:${scope}"]`, `.menu [data-k="${t}|${c}"]`];
  if (st.fcOpen !== key) return `[data-a="fcopen:${key}"]`;
  return after(key, f);
};
const valG = (x, key, f, val) => `[data-a="fcv:${key}|${x.pbi.fpValues(f).indexOf(val)}"]`;
const selG = (x, id, s) => x.pbi.st.selVis !== id ? `[data-a="vis:${id}"]` : x.pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : s;
const champsG = (x, id, s) => selG(x, id, (x.pbi.st.vzTab || 'champs') !== 'champs' ? '[data-a="vztab:champs"]' : s);
const fmtG = (x, id, s) => selG(x, id, x.pbi.st.vzTab !== 'format' ? '[data-a="vztab:format"]' : s);
const createG = (x, type) => x.pbi.P.activePage !== 'page_001' ? '[data-a="ptab:page_001"]' : x.pbi.st.selVis ? '[data-a="canvas"]' : x.pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : `[data-a="vtype:${type}"]`;
const tempSlicer = x => (pg1(x) || { visuals: [] }).visuals.find(v => v.temp && v.type === 'slicer');

const def = {
  id: 108,
  objectifs: ['Filtrer un visuel, une page ou tout le rapport', 'Créer des segments de dates et de catégories', 'Régler les interactions et interpréter un périmètre'],
  intro: [
    { bg: 'samedi', n: 'Samedi 6 juin, 7 h 30. Les allées de Wonderland sont désertes. On nettoie les attractions, on prépare les guichets.' },
    { p: 'oscar', t: 'Ici le poste d’accueil. Combien de visiteurs devons-nous prévoir aujourd’hui ?' },
    { p: 'employe', t: 'Le rapport indique quarante billets vendus. Mais je ne sais pas combien sont prévus pour aujourd’hui.' },
    { p: 'oscar', t: 'Il nous faut cette information avant l’ouverture.' },
    { clear: 1, bg: 'conseil', p: 'victoria', t: 'Nous devons organiser les équipes du week-end. Je veux connaître les billets déjà vendus pour samedi et dimanche, les catégories et les canaux.' },
    { p: 'gabriel', t: 'Nous avons les données. Mais nos indicateurs affichent l’ensemble des ventes.' },
    { p: 'lola', t: 'Il faudrait pouvoir choisir ces deux journées directement dans le rapport, sans nouvelle extraction.' },
    { clear: 1, bg: 'bureau', mail: { de: 'victoria', a: 'Direction Data', heure: '07:42', objet: 'Préparation du week-end', corps: ['Bonjour, j’ai besoin d’une vision précise des billets déjà vendus pour les visites des 6 et 7 juin.', 'Je souhaite pouvoir sélectionner une période et une catégorie de billet directement dans notre rapport, tout en gardant l’accès à l’historique.', 'Merci, Victoria'] } },
    { p: 'pixel', t: 'Jusqu’ici, nos visuels montraient toutes les données. Aujourd’hui, tu vas choisir exactement lesquelles analyser.' },
    { clear: 1, card: { k: 'Transaction B016', h: '3 billets étudiants, 90 €', ul: ['Date d’achat : jeudi 4 juin 2026', 'Date de visite prévue : dimanche 7 juin 2026'] } },
    { p: 'pixel', t: 'Cette vente a eu lieu jeudi, mais les billets servent dimanche. Pour préparer le week-end, sur quelle date faut-il filtrer ?' },
    { btn: 'Découvrir les filtres' }
  ],
  leconTitre: 'Les filtres dans Power BI',
  debut(P) { extendCanvas(P); },
  async lecon(x) {
    const V = D.ventes;
    const card = K.lesson('Leçon', 'Choisir les données à analyser', `
      <div class="lc-k">Expérience · Le périmètre des ventes</div>
      <div class="seg" data-g="c"><button data-v="" class="on">Toutes</button><button data-v="Web">Web</button><button data-v="Guichet">Guichet</button><button data-v="Partenaire">Partenaire</button></div>
      <div class="sales" data-o="c"></div>
      <div class="flow-row" style="grid-template-columns:1fr 1fr; margin-top:10px"><div class="flow-box on"><b class="num" data-k="n">20/20</b><small>Lignes retenues</small></div><div class="flow-box on"><b class="num" data-k="q">40</b><small>Billets dans le périmètre</small></div></div>
      <p class="lc-note">Les ventes grisées sont exclues du calcul, mais elles restent dans la table.</p>
      <div data-sec="2" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · La portée d’un filtre sur tBilletterie</div>
        <div class="seg" data-g="s"><button data-v="v">Visuel</button><button data-v="p">Page</button><button data-v="r">Rapport</button></div>
        <div class="scope" data-o="s"></div>
      </div>
      <div data-sec="3" style="display:none">
        <div class="lc-k" style="margin-top:16px">Filtrage de base, filtrage avancé</div>
        <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>De base</b><small>Cocher des valeurs précises : Adulte, Enfant…</small></div><div class="flow-box on"><b>Avancé</b><small>Poser des conditions : Date_Visite est le ou après le 06/06 et le ou avant le 07/06.</small></div></div>
      </div>
      <div data-sec="4" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · Un segment</div>
        <div class="mini-sl" data-o="t"></div>
      </div>
      <div data-sec="5" style="display:none">
        <div class="lc-k" style="margin-top:16px">Trois tables indépendantes</div>
        <div class="flow"><div class="flow-box on hot"><b>tBilletterie</b><small>Filtre Date_Visite du 6 au 7 juin : 5 lignes, 9 billets, 276 €.</small></div>
        <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b class="num">27</b><small>Entrées historiques, inchangées</small></div><div class="flow-box on"><b class="num">50</b><small>Passages historiques, inchangés</small></div></div></div>
        <p class="lc-note">${esc(fr('Les trois tables ont des dates, mais elles ne sont pas reliées. Un filtre sur tBilletterie.Date_Visite ne se transmet ni à Date_Entree ni à Date_Passage.'))}</p>
      </div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    const show = k => { $(`[data-sec="${k}"]`, card).style.display = ''; requestAnimationFrame(() => sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' })); };
    const toggle = (g, m) => $$(`[data-g="${g}"] button`, card).forEach(b => b.classList.toggle('on', b.dataset.v === m));
    const drawC = m => {
      toggle('c', m);
      $('[data-o="c"]', card).innerHTML = V.map(r => `<span class="${!m || r.Canal === m ? '' : 'out'}"><b>${r.ID_Vente}</b><small>${r.Quantite} b.</small></span>`).join('');
      const keep = V.filter(r => !m || r.Canal === m);
      $('[data-k="n"]', card).textContent = `${keep.length}/20`; $('[data-k="q"]', card).textContent = keep.reduce((a, r) => a + r.Quantite, 0);
    };
    const TREE = [['Vue générale', [['Carte billets', 'p'], ['Carte TTC', 'p'], ['Carte entrées', ''], ['Carte moyenne', 'p'], ['Tableau catégories', 'v'], ['Tableau canaux', 'p']]], ['Détail des ventes', [['Tableau détaillé', 'r']]], ['Attractions', [['Barres', ''], ['Colonnes', ''], ['Colonnes empilées', '']]]];
    const LEVEL = { v: ['v'], p: ['v', 'p'], r: ['v', 'p', 'r'] };
    const drawS = m => {
      toggle('s', m);
      $('[data-o="s"]', card).innerHTML = TREE.map(([pg, vs]) => `<div class="sc-pg"><b>${esc(pg)}</b><div>${vs.map(([n, lv]) => `<span class="${m && LEVEL[m].includes(lv) ? 'on' : ''}">${esc(n)}</span>`).join('')}</div></div>`).join('') + `<p class="lc-note">${esc(fr(!m ? 'Choisis une portée.' : m === 'v' ? 'Un seul visuel reçoit le filtre.' : m === 'p' ? 'Tous les visuels de billetterie de la page. La carte des entrées vient d’une autre table.' : 'Les visuels de billetterie de toutes les pages. Les attractions restent indépendantes.'))}</p>`;
    };
    const CAT = { Adulte: [12, 480], Enfant: [12, 336], Senior: [7, 224], 'Étudiant': [9, 270] };
    let pickT = [];
    const drawT = () => {
      const tot = pickT.length ? pickT.reduce((a, c) => [a[0] + CAT[c][0], a[1] + CAT[c][1]], [0, 0]) : [40, 1310];
      $('[data-o="t"]', card).innerHTML = `<div class="ms-box"><b>Catégorie de billet</b>${Object.keys(CAT).map(c => `<button class="ms-it ${pickT.includes(c) ? 'on' : ''}" data-t="${c}"><i></i>${c}</button>`).join('')}</div><div class="ms-out"><div><b class="num">${tot[0]}</b><small>Billets vendus</small></div><div><b class="num">${tot[1].toLocaleString('fr-FR').replace(/\s/g, '\u00a0')},00\u00a0€</b><small>Ventes TTC</small></div></div>`;
      $$('[data-t]', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.t', b.dataset.t)));
    };
    $$('[data-g] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.' + b.parentElement.dataset.g, b.dataset.v)));
    const quiet = { 'lab.c': m => { drawC(m); }, 'lab.s': m => { drawS(m); }, 'lab.t': c => { pickT = pickT.includes(c) ? pickT.filter(y => y !== c) : [...pickT, c]; drawT(); } };
    drawC('');
    await x.pixel('Un filtre sélectionne une partie des données pour répondre à une question précise.');
    await x.pixel('Les lignes exclues restent dans le modèle : elles ne comptent simplement plus dans le calcul.');
    x.todo('Ne garde que les ventes Web.');
    x.target($('[data-g="c"] [data-v="Web"]', card));
    await x.wait({ ...quiet, 'lab.c': m => { drawC(m); if (m === 'Web') return true; } });
    x.untarget();
    await x.ok('9 lignes sur 20, et 20 billets. Les 11 autres ventes sont toujours là, grisées.');
    await x.pixel('Attention : un filtre dans Power Query change les lignes chargées dans le modèle. Un filtre de rapport change seulement le contexte d’analyse.');
    show(2); drawS('');
    await x.pixel('Dans le volet Filtres, un filtre peut viser un seul visuel, une page, ou toutes les pages du rapport.');
    x.todo('Compare les trois portées, jusqu’au niveau Rapport.');
    x.target($$('[data-g="s"] button', card));
    await x.wait({ ...quiet, 'lab.s': m => { drawS(m); if (m === 'r') return true; } });
    x.untarget();
    await x.pixel('Même au niveau du rapport, un filtre sur la billetterie ne touche pas les tables indépendantes.');
    show(3);
    await x.pixel('Le filtrage de base coche des valeurs. Le filtrage avancé pose des conditions, par exemple entre deux dates.');
    show(4); drawT();
    await x.pixel('Un segment est un visuel de filtrage posé sur le canevas : plus besoin d’ouvrir le volet Filtres.');
    x.todo('Sélectionne Senior dans le segment.');
    x.target($('[data-t="Senior"]', card));
    await x.wait({ ...quiet, 'lab.t': c => { pickT = pickT.includes(c) ? pickT.filter(y => y !== c) : [...pickT, c]; drawT(); x.target($('[data-t="Senior"]', card)); if (pickT.length === 1 && pickT[0] === 'Senior') return true; } });
    x.untarget();
    await x.ok('7 billets seniors, 224 € TTC.');
    await x.pixel('Senior et Étudiant dans un même segment : on garde les ventes de l’une OU l’autre catégorie.');
    await x.pixel('Ajoute une période dans un autre segment : chaque vente doit alors respecter les deux critères, ET.');
    show(5);
    await x.pixel('Dernier point : nos trois tables ne sont pas reliées. Un filtre sur la billetterie ne se transmet ni aux entrées ni aux passages.');
    await x.pixel('Les relations entre tables viendront plus tard, au module 3.');
  },

  exs: [
    /* 1 — Un filtre pour une seule information */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); pbi.st.selVis = null; pbi.st.xsel = null; pbi.render();
      await x.say('lola', 'Je prépare une communication pour les familles. J’aimerais afficher uniquement les ventes de billets adultes dans le tableau par catégorie.');
      await x.say('lola', 'Mais je veux garder les indicateurs globaux à l’écran.');
      await x.pixel('Utilisons un filtre au niveau du visuel : les autres visualisations garderont leur périmètre.');
      const v = K.visOf(x, 'vis_106_categories');
      const f = () => fl(v.filters, 'Type_Billet');
      const adulte = () => { const g = f(); return !!g && g.kind === 'basic' && eq(g.values, ['Adulte']); };
      let stage = 1;
      const ok1 = () => adulte() && pbi.tableData(v).rows.length === 1 && rowsOf(x, v.id).length === 5 && cardVal(x, 'vis_105_billets') === 40 && cardVal(x, 'vis_105_ventes_ttc') === 1310 && !anyRestr(pg1(x).filters) && !anyRestr(P().filters);
      const ok2 = () => !anyRestr(v.filters) && pbi.tableData(v).rows.length === 4;
      const next = () => {
        if (stage === 1) {
          if (pbi.st.selVis !== v.id) { x.todo('Sélectionne le tableau Ventes par catégorie de billet.'); x.guide(`[data-a="vis:${v.id}"]`); return; }
          x.todo('Dans le volet Filtres, sur ce visuel, ne garde que Adulte pour Type_Billet.'); x.guide(fpG(x, 'visual', 'Type_Billet', (key, g) => valG(x, key, g, 'Adulte')));
          return;
        }
        x.todo('Efface ce filtre pour retrouver les quatre catégories.');
        x.guide(pbi.st.selVis !== v.id ? `[data-a="vis:${v.id}"]` : pbi.st.pane !== 'Filtres' ? '[data-a="pane:Filtres"]' : `[data-a="fcclear:visual|${B}|Type_Billet"]`);
      };
      const base = K.guard(x, OLD10);
      const H = () => K.guard(x, OLD10, {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next),
        'table.rowsel': () => x.oops('Sélection d’une ligne du tableau'),
        cmd: c => c === 'transform' ? x.oops('Suppression des lignes dans Power Query') : base.cmd(c),
        'filter.add': p => {
          if (stage === 2) return x.oops('Filtre conservé après l’expérience');
          if (p.scope === 'page') return x.oops('Filtre ajouté au niveau de la page');
          if (p.scope === 'report') return x.oops('Filtre ajouté au niveau du rapport');
          if (p.target !== v.id) return x.oops('', 'Le filtre concerne seulement le tableau par catégorie.');
          if (p.c === 'Canal') return x.oops('Filtrage de Canal');
          if (p.c !== 'Type_Billet') return x.oops('', 'Lola s’intéresse à la catégorie de billet.');
        },
        'filter.set': p => {
          if (p.scope === 'page') return x.oops('Filtre ajouté au niveau de la page');
          if (p.scope === 'report') return x.oops('Filtre ajouté au niveau du rapport');
          if (p.target !== v.id) return x.oops('', 'Le filtre concerne seulement le tableau par catégorie.');
          if (p.c === 'Canal') return x.oops('Filtrage de Canal');
          if (p.c !== 'Type_Billet') return x.oops('', 'Lola s’intéresse à la catégorie de billet.');
          if (stage === 2) return p.restrictive ? x.oops('Filtre conservé après l’expérience') : undefined;
          if (p.values && p.values.length > 1) return x.oops('Sélection de plusieurs catégories');
          if (p.values && p.values.length === 1 && p.values[0] !== 'Adulte') return x.oops(p.values[0] === 'Senior' ? 'Sélection de Senior' : '', 'Le périmètre demandé concerne les adultes.');
        },
        'filter.type': () => x.oops('', 'Le filtrage de base suffit : coche simplement la catégorie.'),
        'filter.remove': () => {},
        'viz.change': () => { if (stage === 1 ? ok1() : ok2()) return true; next(); }
      });
      next();
      await x.wait(H());
      x.guide();
      await x.ok('Le tableau ne montre plus que les adultes : 12 billets et 480 € TTC. La carte Billets vendus reste à 40.');
      await x.say('lola', 'Parfait. Je peux consulter une catégorie sans modifier toute la page.');
      stage = 2; next();
      await x.wait(H());
      x.guide();
      await x.ok('Filtre effacé : les quatre catégories sont de retour.');
    }, avance: () => {} },

    /* 2 — Toute une page sous contrôle */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); pbi.st.selVis = null; pbi.st.xsel = null; pbi.st.pane = 'Filtres'; pbi.render();
      await x.say('gabriel', 'Je voudrais examiner uniquement les ventes réalisées sur Internet.');
      await x.say('gabriel', 'Cette fois, tous les indicateurs commerciaux de la page doivent s’adapter.');
      await x.pixel('Nous allons utiliser un filtre au niveau de la page.');
      const f = () => fl(pg1(x).filters, 'Canal');
      let stage = 1;
      const ok1 = () => { const g = f(); return !!g && g.kind === 'basic' && eq(g.values, ['Web']) && rowsOf(x, 'vis_105_billets').length === 9 && cardVal(x, 'vis_105_billets') === 20 && cardVal(x, 'vis_105_ventes_ttc') === 646 && cardVal(x, 'vis_105_entrees') === 27 && !anyRestr(P().filters); };
      const ok3 = () => !anyRestr(pg1(x).filters) && cardVal(x, 'vis_105_billets') === 40;
      const next = () => {
        if (stage === 1) { x.todo('Filtres sur cette page : ajoute Canal et ne garde que Web.'); x.guide(fpG(x, 'page', 'Canal', (key, g) => valG(x, key, g, 'Web'))); return; }
        if (stage === 2) { x.todo('Ouvre la page Détail des ventes pour vérifier qu’elle n’est pas filtrée.'); x.guide('[data-a="ptab:page_002"]'); return; }
        if (P().activePage !== 'page_001') { x.todo('Reviens sur Vue générale, puis efface le filtre de page.'); x.guide('[data-a="ptab:page_001"]'); return; }
        x.todo('Efface le filtre Canal de la page.'); x.guide(pbi.st.pane !== 'Filtres' ? '[data-a="pane:Filtres"]' : `[data-a="fcclear:page|${B}|Canal"]`);
      };
      const base = K.guard(x, OLD10);
      const H = () => K.guard(x, OLD10, {
        pane: later(next), canvas: later(next), visual: later(next),
        page: id => { if (stage === 2 && id === 'page_002') setTimeout(() => PBQ.act('ok.state'), 0); else setTimeout(next, 0); },
        'ok.state': () => stage === 2 && P().activePage === 'page_002' && rowsOf(x, 'vis_106_detail_ventes').length === 20 ? true : undefined,
        cmd: c => c === 'transform' ? x.oops('', 'Un filtre de page suffit : ne modifie pas les données chargées.') : base.cmd(c),
        'filter.add': p => {
          if (stage === 3) return x.oops('Filtre non effacé après le contrôle');
          if (stage === 2) return x.oops('', 'Vérifie d’abord la page Détail des ventes.');
          if (p.scope === 'visual') return x.oops('Filtre appliqué uniquement à une carte');
          if (p.scope === 'report') return x.oops('Filtre au niveau du rapport');
          if (p.c !== 'Canal') return x.oops('', 'Gabriel s’intéresse au canal de distribution.');
        },
        'filter.set': p => {
          if (p.scope === 'visual') return x.oops('Filtre appliqué uniquement à une carte');
          if (p.scope === 'report') return x.oops('Filtre au niveau du rapport');
          if (p.c !== 'Canal') return x.oops('', 'Gabriel s’intéresse au canal de distribution.');
          if (stage === 2) return x.oops('', 'Vérifie d’abord la page Détail des ventes.');
          if (stage === 3) return p.restrictive ? x.oops('Filtre non effacé après le contrôle') : undefined;
          if (p.values && p.values.includes('Guichet')) return x.oops('Sélection de Guichet');
          if (p.values && (p.values.length > 1 || (p.values.length === 1 && p.values[0] !== 'Web'))) return x.oops('', 'Le canal demandé est Web, seul.');
        },
        'filter.type': () => x.oops('', 'Le filtrage de base suffit : coche Web.'),
        'filter.remove': () => {},
        'viz.fmt': p => CARDS.includes(p.vis) ? x.oops('Modification manuelle des cartes') : noTouch(x),
        'viz.change': () => { if (stage === 1 && ok1()) return true; if (stage === 3 && ok3()) return true; next(); }
      });
      next();
      await x.wait(H());
      x.guide();
      await x.ok('Toute la page suit le filtre : 20 billets Web, 646 € TTC.');
      await x.ask('Combien de billets ont été vendus sur le Web ?', [{ t: '20 billets', ok: true }, { t: '9 billets', err: 'Carte Billets vendus affichant 9' }]);
      await x.ask('Le montant moyen passe à 71,78 €. D’où vient-il ?', [{ t: '646 € ÷ 9 lignes de vente', ok: true }, { t: '646 € ÷ 20 billets', err: 'Montant moyen calculé avec 646 ÷ 20' }]);
      await x.ask('Et la carte Entrées enregistrées, qui reste à 27 ?', [
        { t: 'Normal : elle vient d’une table indépendante de la billetterie', ok: true },
        { t: 'Le filtre aurait dû la ramener à 20', err: 'Carte Entrées ramenée à 20' },
        { t: 'Corrigeons-la à la main', err: 'Modification manuelle des cartes' }
      ]);
      stage = 2; next();
      await x.wait(H());
      await x.ok('Sur Détail des ventes, les 20 transactions restent consultables : le filtre ne vise que Vue générale.');
      stage = 3; next();
      await x.wait(H());
      x.guide();
      await x.ok('Filtre effacé : la page retrouve ses 40 billets.');
    }, avance: () => {} },

    /* 3 — Un filtre qui traverse les pages */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); pbi.st.selVis = null; pbi.st.xsel = null; pbi.st.pane = 'Filtres'; pbi.render();
      await x.say('lola', 'Je prépare une offre étudiante. J’aimerais que tout le rapport commercial soit consacré aux billets étudiants, y compris le détail des ventes.');
      await x.pixel('Un filtre au niveau du rapport sera plus adapté. Mais regarde bien ce qui se passe sur les pages qui utilisent d’autres tables.');
      const f = () => fl(P().filters, 'Type_Billet');
      let stage = 1;
      const seen = new Set();
      const ok1 = () => { const g = f(); return !!g && eq(g.values || [], ['Étudiant']) && cardVal(x, 'vis_105_billets') === 9 && cardVal(x, 'vis_105_ventes_ttc') === 270 && cardVal(x, 'vis_105_vente_moyenne') === 54 && rowsOf(x, 'vis_106_detail_ventes').length === 5; };
      const ok3 = () => !anyRestr(P().filters) && cardVal(x, 'vis_105_billets') === 40;
      const next = () => {
        if (stage === 1) { x.todo('Filtres sur toutes les pages : ajoute Type_Billet et ne garde que Étudiant.'); x.guide(fpG(x, 'report', 'Type_Billet', (key, g) => valG(x, key, g, 'Étudiant'))); return; }
        if (stage === 2) { const p = ['page_002', 'page_003'].find(p => !seen.has(p)); x.todo(`Visite les pages Détail des ventes et Attractions (${seen.size}/2).`); x.guide(`[data-a="ptab:${p}"]`); return; }
        x.todo('Retire le filtre étudiant du rapport.'); x.guide(pbi.st.pane !== 'Filtres' ? '[data-a="pane:Filtres"]' : `[data-a="fcdel:report|${B}|Type_Billet"]`);
      };
      const base = K.guard(x, OLD10);
      const H = () => K.guard(x, OLD10, {
        pane: later(next), canvas: later(next), visual: later(next),
        page: id => { if (stage === 2 && (id === 'page_002' || id === 'page_003')) { seen.add(id); if (seen.size === 2) setTimeout(() => PBQ.act('ok.state'), 0); else setTimeout(next, 0); } else setTimeout(next, 0); },
        'ok.state': () => stage === 2 && seen.size === 2 ? true : undefined,
        cmd: c => c === 'relations' ? x.oops('Création d’une relation pour forcer le filtrage') : base.cmd(c),
        'model.tool': () => x.oops('Création d’une relation pour forcer le filtrage'),
        'filter.add': p => {
          if (stage === 3) return x.oops('Filtre étudiant oublié dans le rapport');
          if (p.scope === 'visual') return x.oops('Filtre au niveau visuel');
          if (p.scope === 'page') return x.oops('Filtre au niveau page');
          if (p.c !== 'Type_Billet') return x.oops('', 'Lola s’intéresse à la catégorie de billet.');
        },
        'filter.set': p => {
          if (p.scope === 'visual') return x.oops('Filtre au niveau visuel');
          if (p.scope === 'page') return x.oops('Filtre au niveau page');
          if (p.c !== 'Type_Billet') return x.oops('', 'Lola s’intéresse à la catégorie de billet.');
          if (stage === 3) return p.restrictive ? x.oops('Filtre étudiant oublié dans le rapport') : undefined;
          if (stage === 2) return x.oops('', 'Visite d’abord les deux autres pages.');
          if (p.values && p.values.includes('Senior')) return x.oops('Sélection de Senior');
          if (p.values && (p.values.length > 1 || (p.values.length === 1 && p.values[0] !== 'Étudiant'))) return x.oops('', 'Le besoin concerne les étudiants, seuls.');
        },
        'filter.type': () => x.oops('', 'Le filtrage de base suffit : coche Étudiant.'),
        'filter.remove': p => stage < 3 ? x.oops('', 'Garde le filtre pendant la visite des pages.') : undefined,
        'viz.change': () => { if (stage === 1 && ok1()) return true; if (stage === 3 && ok3()) return true; next(); }
      });
      next();
      await x.wait(H());
      x.guide();
      await x.ok('Vue générale : 9 billets étudiants, 270 € TTC, 54 € par ligne.');
      stage = 2; next();
      await x.wait(H());
      x.guide();
      await x.say('lola', 'Pourquoi les attractions ne changent-elles pas ? J’ai pourtant choisi un filtre sur toutes les pages.');
      await x.pixel('Le filtre s’applique à tout le rapport, mais il repose sur une colonne de la billetterie. Sans relation, impossible de savoir quels passages viennent de billets étudiants.');
      await x.ask('Combien de transactions étudiantes affiche le détail des ventes ?', [{ t: '5 transactions : B004, B008, B012, B016, B020', ok: true }, { t: '9 transactions', err: '9 lignes de vente annoncées' }]);
      await x.ask('Que représentent ces 9 billets étudiants ?', [{ t: '9 étudiants déjà entrés dans le parc', err: '9 entrées étudiantes annoncées' }, { t: '9 billets vendus, en 5 transactions', ok: true }]);
      await x.ask('Et les 50 passages de la page Attractions ?', [{ t: '50 passages d’étudiants', err: '50 passages attribués aux étudiants' }, { t: 'Les 50 passages historiques, toutes clientèles confondues', ok: true }]);
      stage = 3; next();
      await x.wait(H());
      x.guide();
      await x.ok('Filtre retiré : le rapport retrouve son périmètre complet.');
    }, avance: () => {} },

    /* 4 — Le calendrier du week-end */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); pbi.st.selVis = null; pbi.st.xsel = null; pbi.st.pane = 'Visualisations'; pbi.render();
      await x.say('victoria', 'Ces expériences sont intéressantes, mais je ne veux pas manipuler moi-même le volet Filtres.');
      await x.say('victoria', 'Je voudrais un calendrier directement sur le rapport.');
      await x.pixel('Créons un segment de dates. On pourra choisir une période en quelques secondes.');
      const ok = () => {
        const v = tempSlicer(x); if (!v) return false;
        const f = v.f.values[0];
        if (!f || f.t !== B || f.c !== 'Date_Visite' || f.hier || v.mode !== 'range' || !K.titleIs(v, 'Période de visite prévue')) return false;
        if (!v.sel || v.sel.kind !== 'range' || v.sel.min !== '2026-06-06' || v.sel.max !== '2026-06-07') return false;
        const ids = rowsOf(x, 'vis_105_billets').map(r => r.ID_Vente).sort();
        return eq(ids, WEEKEND) && cardVal(x, 'vis_105_billets') === 9 && cardVal(x, 'vis_105_ventes_ttc') === 276;
      };
      const next = () => {
        const v = tempSlicer(x);
        if (!v) { x.todo('Sur Vue générale, crée un segment.'); x.guide(createG(x, 'slicer')); return; }
        const f = v.f.values[0];
        if (!f) { x.todo('Ajoute Date_Visite au segment.'); x.guide(champsG(x, v.id, ['[data-a="well:values"]', `.menu [data-k="${B}|Date_Visite"]`])); return; }
        if (f.hier) { x.todo('Choisis Date_Visite elle-même, pas sa hiérarchie.'); x.guide(champsG(x, v.id, ['[data-a="chip:values|0"]', '.menu [data-k="raw"]'])); return; }
        if (v.mode !== 'range') { x.todo('Dans Format, choisis le style Entre.'); x.guide(fmtG(x, v.id, ['[data-a="fmtsel:mode"]', '.menu [data-k="range"]'])); return; }
        if (!K.titleIs(v, 'Période de visite prévue')) { x.todo('Nomme le segment « Période de visite prévue ».'); x.guide(fmtG(x, v.id, '[data-f="title"]')); return; }
        const s = v.sel && v.sel.kind === 'range' ? v.sel : {};
        if (s.min !== '2026-06-06') { x.todo('Règle la borne de début sur le 06/06/2026.'); x.guide([`[data-a="slrange:${v.id}|min"]`, '.menu [data-k="2026-06-06"]']); return; }
        x.todo('Règle la borne de fin sur le 07/06/2026.'); x.guide([`[data-a="slrange:${v.id}|max"]`, '.menu [data-k="2026-06-07"]']);
      };
      next();
      const mine = id => (tempSlicer(x) || {}).id === id;
      await x.wait(K.guard(x, OLD10, {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next),
        cmd: c => c === 'syncslicers' ? x.oops('Synchronisation du segment sur toutes les pages') : K.guard(x, OLD10).cmd(c),
        'viz.create': ({ type }) => {
          if (P().activePage !== 'page_001') return x.oops('', 'Le segment va sur la page Vue générale.');
          if (tempSlicer(x)) return x.oops('', 'Complète le segment que tu as créé.');
          if (type !== 'slicer') return x.oops('', 'Choisis le visuel Segment.');
          setTimeout(next, 0);
        },
        'viz.type': p => OLD10.includes(p.vis) ? noTouch(x) : p.type !== 'slicer' ? x.oops('', 'Garde un segment.') : undefined,
        'well.add': p => {
          if (!mine(p.vis)) return noTouch(x);
          if (p.field.t === B && p.field.c === 'Date_Achat') return x.oops('Date_Achat utilisée');
          if (p.field.t !== B || p.field.c !== 'Date_Visite') return x.oops('', 'La période concerne les dates de visite prévues : Date_Visite.');
        },
        'well.hier': p => mine(p.vis) && p.hier ? x.oops('Hiérarchie de dates utilisée') : undefined,
        'viz.fmt': p => {
          if (!mine(p.vis)) return noTouch(x);
          if (p.key === 'mode' && p.value === 'relative') return x.oops('Segment relatif « Aujourd’hui »');
          if (p.key === 'mode' && p.value !== 'range') return x.oops('', 'Le style Entre permet de choisir un intervalle.');
        },
        slicer: p => {
          if (!mine(p.vis) || !p.range) return;
          const { min, max } = p.range;
          if (max === '2026-06-05' || max < '2026-06-06') return x.oops('Borne de fin au 5 juin');
          if (min === '2026-06-06' && max === '2026-06-06') return x.oops('Sélection du samedi uniquement');
          if (min === '2026-06-07' && max === '2026-06-07') return x.oops('Sélection du dimanche uniquement');
        },
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide();
      const v = tempSlicer(x); v.id = DS; v.temp = false; Object.assign(v, geo(SL_SLOTS[0])); pbi.st.selVis = null; pbi.render();
      await x.ok('Du 6 au 7 juin : 5 lignes de vente, 9 billets, 276 € TTC. Les 27 entrées historiques ne bougent pas.');
      await x.ask('Que représentent ces 9 billets ?', [{ t: '9 visiteurs qui viendront ce week-end, c’est certain', err: 'Interprétation des 9 billets comme 9 entrées certaines' }, { t: '9 billets déjà vendus pour des visites prévues', ok: true }]);
    }, avance: P => addDateSlicer(P, true) },

    /* 5 — Plusieurs catégories, un seul rapport */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); pbi.st.selVis = null; pbi.st.xsel = null; pbi.st.pane = 'Visualisations'; pbi.render();
      const ds = K.visOf(x, DS);
      if (!ds.sel) ds.sel = { kind: 'range', min: '2026-06-06', max: '2026-06-07' };
      await x.say('lola', 'Parmi les billets déjà vendus, je voudrais isoler les seniors, puis comparer avec les étudiants.');
      await x.pixel('Créons un deuxième segment. Il fonctionnera en même temps que le calendrier.');
      let stage = 'create', seenSingle = false;
      const sv = () => tempSlicer(x);
      const weekend = () => ds.sel && ds.sel.kind === 'range' && ds.sel.min === '2026-06-06' && ds.sel.max === '2026-06-07';
      const created = () => { const v = sv(); return !!v && v.f.values[0] && v.f.values[0].t === B && v.f.values[0].c === 'Type_Billet' && K.titleIs(v, 'Catégorie de billet'); };
      const sel = () => (sv() && sv().sel && sv().sel.values) || [];
      const fm = () => (sv() && sv().fmt) || {};
      const okSingle = () => fm().single && eq(sel(), ['Senior']) && weekend() && cardVal(x, 'vis_105_billets') === 3 && cardVal(x, 'vis_105_ventes_ttc') === 96;
      const okMulti = () => !fm().single && fm().ctrl === false && eq([...sel()].sort(), ['Senior', 'Étudiant'].sort()) && weekend() && cardVal(x, 'vis_105_billets') === 9 && cardVal(x, 'vis_105_ventes_ttc') === 276;
      const okClear = () => !sel().length && !fm().single && fm().ctrl === false && weekend();
      const next = () => {
        const v = sv();
        if (stage === 'create') {
          if (!v) { x.todo('Crée un deuxième segment sur Vue générale.'); x.guide(createG(x, 'slicer')); return; }
          if (!v.f.values[0]) { x.todo('Ajoute Type_Billet au segment.'); x.guide(champsG(x, v.id, ['[data-a="well:values"]', `.menu [data-k="${B}|Type_Billet"]`])); return; }
          x.todo('Nomme le segment « Catégorie de billet ».'); x.guide(fmtG(x, v.id, '[data-f="title"]')); return;
        }
        if (stage === 'single') {
          if (!fm().single) { x.todo('Dans Format, active la sélection unique.'); x.guide(fmtG(x, v.id, '[data-a="fmttog:single"]')); return; }
          x.todo('Sélectionne Senior dans le segment.'); x.guide(`[data-a="slpick:${v.id}|Senior"]`); return;
        }
        if (stage === 'multi') {
          if (fm().single) { x.todo('Désactive la sélection unique.'); x.guide(fmtG(x, v.id, '[data-a="fmttog:single"]')); return; }
          if (fm().ctrl !== false) { x.todo('Désactive « Multisélection avec Ctrl » : sur mobile, pas de touche Ctrl.'); x.guide(fmtG(x, v.id, '[data-a="fmttog:ctrl"]')); return; }
          x.todo('Ajoute Étudiant sans retirer Senior.'); x.guide(`[data-a="slpick:${v.id}|${sel().includes('Senior') ? 'Étudiant' : 'Senior'}"]`); return;
        }
        x.todo('Efface les catégories sélectionnées. Le calendrier, lui, garde le week-end.'); x.guide(`[data-a="slclear:${v.id}"]`);
      };
      const mine = id => (sv() || {}).id === id;
      const H = check => K.guard(x, OLD10.concat(DS), {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next),
        cmd: c => c === 'transform' ? x.oops('Création d’un filtre Power Query') : c === 'syncslicers' ? x.oops('', 'Les segments restent propres à Vue générale.') : K.guard(x, OLD10).cmd(c),
        'viz.create': ({ type }) => {
          if (stage !== 'create' || sv()) return x.oops('', 'Un deuxième segment suffit.');
          if (P().activePage !== 'page_001') return x.oops('', 'Le segment va sur la page Vue générale.');
          if (type !== 'slicer') return x.oops('', 'Choisis le visuel Segment.');
          setTimeout(next, 0);
        },
        'viz.type': p => OLD10.includes(p.vis) || p.vis === DS ? noTouch(x) : p.type !== 'slicer' ? x.oops('', 'Garde un segment.') : undefined,
        'well.add': p => {
          if (!mine(p.vis)) return p.vis === DS ? x.oops('Désactivation du segment de dates') : noTouch(x);
          if (p.field.c === 'Canal') return x.oops('Segment construit avec Canal');
          if (p.field.t !== B || p.field.c !== 'Type_Billet') return x.oops('', 'Lola compare les catégories de billets : Type_Billet.');
        },
        'well.remove': p => p.vis === DS ? x.oops('Désactivation du segment de dates') : undefined,
        'viz.fmt': p => {
          if (p.vis === DS) return x.oops('Désactivation du segment de dates');
          if (!mine(p.vis)) return noTouch(x);
          if (p.key === 'single' && p.value && stage === 'multi') return x.oops('Sélection unique conservée');
        },
        slicer: p => {
          if (p.vis === DS) return x.oops('Désactivation du segment de dates');
          if (!mine(p.vis)) return;
          if (stage === 'create') return x.oops('', 'Termine d’abord la création du segment.');
          if (stage === 'single') { if (!fm().single) return x.oops('', 'Active d’abord la sélection unique.'); if (p.values.length === 1 && p.values[0] !== 'Senior') return x.oops('', 'Commence par Senior.'); }
          if (stage === 'multi') {
            if (fm().single) return x.oops('Sélection unique conservée');
            if (fm().ctrl !== false && !(p.values.length === 0)) return x.oops('', 'Sans touche Ctrl, ce toucher remplacerait Senior : désactive d’abord « Multisélection avec Ctrl ».');
          }
          if (stage === 'clear' && p.values.length) return x.oops('', 'Efface les catégories avec la gomme du segment.');
        },
        'vis.delete': p => p.vis === DS || mine(p.vis) ? x.oops('Suppression du segment après le test') : undefined,
        'viz.change': () => { if (check()) return true; next(); }
      });
      next();
      await x.wait(H(created));
      x.guide(); stage = 'single'; next();
      await x.wait(H(okSingle));
      x.guide(); seenSingle = true;
      await x.ok('Senior seul, sur le week-end : 3 billets, 96 € TTC, 2 transactions.');
      stage = 'multi'; next();
      await x.wait(H(okMulti));
      x.guide();
      await x.ask('Senior OU Étudiant, sur le week-end : combien de billets ?', [{ t: '9 billets', ok: true }, { t: '16 billets', err: 'Résultat de 16 billets' }, { t: '5 billets', err: 'Résultat de 5 billets' }]);
      await x.ask('Une même vente peut-elle être Senior et Étudiant à la fois ?', [{ t: 'Oui : le segment garde les ventes qui ont les deux catégories', err: 'Interprétation du OU comme une intersection des catégories' }, { t: 'Non : chaque vente a une seule catégorie, on garde l’une OU l’autre', ok: true }]);
      await x.pixel('Les deux segments travaillent ensemble : une vente doit être dans la période ET dans l’une des catégories choisies.');
      stage = 'clear'; next();
      await x.wait(H(okClear));
      x.guide();
      const v = sv(); v.id = TS; v.temp = false; Object.assign(v, geo(SL_SLOTS[1])); P().interactions = Object.assign(P().interactions || {}, { [TS + '>' + DS]: 'none' });
      pbi.st.selVis = null; pbi.render();
      await x.ok(seenSingle ? 'Deux modes testés, et un segment prêt pour la suite, en multisélection.' : 'Segment prêt.');
    }, avance: P => addTypeSlicer(P) },

    /* 6 — Les visualisations se parlent */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); pbi.st.selVis = null; pbi.st.xsel = null; pbi.st.editInter = false; pbi.render();
      const ds = K.visOf(x, DS); if (!ds.sel) ds.sel = { kind: 'range', min: '2026-06-06', max: '2026-06-07' };
      await x.say('victoria', 'Tous les chiffres commerciaux changent quand je choisis le week-end. Pourrais-je décider quels visuels doivent réagir ?');
      await x.pixel('Oui : Power BI permet de modifier les interactions entre les visuels d’une même page.');
      const I = () => P().interactions || {};
      const im = (s, t) => pbi.inter(K.visOf(x, s), K.visOf(x, t));
      let stage = 'none', sawNone = false;
      const next = () => {
        const st = pbi.st;
        if (stage === 'lab') return nextLab();
        if (!st.editInter || st.selVis !== (stage === 'ts' ? TS : DS)) {
          const src = stage === 'ts' ? TS : DS;
          x.todo(stage === 'ts' ? 'Sélectionne maintenant le segment Catégorie de billet, en mode Modifier les interactions.' : 'Sélectionne le segment Période de visite prévue, puis Format › Modifier les interactions.');
          x.guide(st.selVis !== src ? `[data-a="vis:${src}"]` : st.tab !== 'Format' ? '[data-a="tab:Format"]' : '[data-a="cmd:interactions"]'); return;
        }
        if (stage === 'none') { x.todo('Sur la carte Ventes TTC, choisis Aucune.'); x.guide(`[data-a="inter:${DS}|vis_105_ventes_ttc|none"]`); return; }
        if (stage === 'restore') { x.todo('Rétablis Filtrer sur la carte Ventes TTC.'); x.guide(`[data-a="inter:${DS}|vis_105_ventes_ttc|filter"]`); return; }
        if (stage === 'ds') { x.todo('Exclus la carte Entrées enregistrées de ce segment : Aucune.'); x.guide(`[data-a="inter:${DS}|vis_105_entrees|none"]`); return; }
        x.todo('Pour ce segment aussi, la carte Entrées enregistrées passe sur Aucune.'); x.guide(`[data-a="inter:${TS}|vis_105_entrees|none"]`);
      };
      const ok = () => {
        if (stage === 'none') return im(DS, 'vis_105_ventes_ttc') === 'none' && cardVal(x, 'vis_105_ventes_ttc') === 1310 && cardVal(x, 'vis_105_billets') === 9;
        if (stage === 'restore') return im(DS, 'vis_105_ventes_ttc') === 'filter' && cardVal(x, 'vis_105_ventes_ttc') === 276;
        if (stage === 'ds') return im(DS, 'vis_105_entrees') === 'none';
        if (stage === 'ts') return im(TS, 'vis_105_entrees') === 'none';
        return false;
      };
      const COMM = ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_vente_moyenne', 'vis_106_categories', 'vis_106_canaux'];
      const H = () => K.guard(x, OLD10.concat(DS, TS), {
        page: later(next), pane: later(next), canvas: later(next), visual: later(next), tab: later(next),
        cmd: c => {
          if (c === 'interactions') { if (pbi.st.editInter && im(DS, 'vis_105_ventes_ttc') === 'none') return x.oops('Carte TTC exclue définitivement'); setTimeout(next, 0); return; }
          return K.guard(x, OLD10).cmd(c);
        },
        'interaction.mode': () => {},
        'interaction.set': p => {
          const src = stage === 'ts' ? TS : DS;
          if (CH107.includes(p.src) || CH107.includes(p.tgt)) return x.oops('Modification permanente des anciens graphiques');
          if (p.src !== src) return x.oops('Mauvais visuel sélectionné avant Modifier les interactions');
          if (stage === 'none' && p.tgt !== 'vis_105_ventes_ttc') return x.oops('', 'Commence par la carte Ventes TTC.');
          if (stage === 'restore' && p.tgt === 'vis_105_ventes_ttc' && p.mode !== 'filter') return x.oops('Carte TTC exclue définitivement');
          if (stage === 'restore' && p.tgt !== 'vis_105_ventes_ttc') return x.oops('', 'Rétablis d’abord Filtrer sur la carte Ventes TTC.');
          if ((stage === 'ds' || stage === 'ts') && COMM.includes(p.tgt) && p.mode !== 'filter') return x.oops('Carte TTC exclue définitivement');
          if ((stage === 'ds' || stage === 'ts') && p.tgt !== 'vis_105_entrees') return x.oops('', 'Seule la carte Entrées enregistrées doit être exclue.');
        },
        'well.agg': p => CARDS.includes(p.vis) ? x.oops('Modification de l’agrégation de la carte') : noTouch(x),
        slicer: () => x.oops('', 'Garde les segments tels quels pendant ce réglage.'),
        'viz.change': () => { if (ok()) return true; next(); }
      });
      next();
      await x.wait(H());
      x.guide(); sawNone = true;
      await x.ok('La carte Ventes TTC ignore maintenant le segment : 1 310 €, alors que les billets affichent 9.');
      stage = 'restore'; next();
      await x.wait(H());
      x.guide();
      await x.ok('Retour à 276 € : les indicateurs commerciaux respectent de nouveau la même période.');
      await x.pixel('La carte Entrées enregistrées, elle, est un indicateur historique indépendant. Rendons ce choix explicite.');
      stage = 'ds'; next();
      await x.wait(H());
      stage = 'ts'; next();
      await x.wait(H());
      x.guide();
      await x.ok('Les deux segments filtrent les visuels commerciaux, et laissent la carte des entrées tranquille.');
      /* Laboratoire : filtrer, mettre en surbrillance ou rien */
      await x.pixel('Passons aux graphiques, dans une copie d’entraînement de la page Attractions.');
      const A = 'tbl_attractions';
      P().pages.push({ id: 'page_lab', name: 'Laboratoire', temp: true, filters: [], visuals: [
        { id: 'vis_lab_bars', type: 'bar', x: 2, y: 4, w: 46, h: 92, f: { axis: [{ t: A, c: 'Attraction', agg: 'none' }], values: [{ t: A, c: 'Passages', agg: 'sum' }], legend: [], cols: [] }, title: 'Copie : passages par attraction', fmt: { labels: true, dec: 0, colors: { 'Somme de Passages': '#c8a12b' } }, sort: { by: 'value', dir: 'desc' }, temp: true },
        { id: 'vis_lab_daily', type: 'column', x: 52, y: 4, w: 46, h: 92, f: { axis: [{ t: A, c: 'Date_Passage', agg: 'none' }], values: [{ t: A, c: 'Passages', agg: 'sum' }], legend: [], cols: [] }, title: 'Copie : passages quotidiens', fmt: { labels: true, dec: 0 }, temp: true }] });
      P().activePage = 'page_lab'; pbi.st.selVis = null; pbi.st.xsel = null; pbi.render();
      stage = 'lab';
      const seen = new Set();
      const dragon = () => { const xs = pbi.st.xsel; return !!xs && xs.vis === 'vis_lab_bars' && xs.value === 'Dragon'; };
      const daily = () => pbi.chartData(K.visOf(x, 'vis_lab_daily'));
      const check = () => {
        if (!dragon()) return;
        const m = im('vis_lab_bars', 'vis_lab_daily'), d = daily(); if (!d) return;
        const vals = d.series[0].values;
        if (m === 'filter' && eq(vals, [2, 4, 3, 4, 5])) seen.add('filter');
        if (m === 'highlight' && eq(vals, [6, 10, 7, 12, 15]) && d.hlv && eq(d.hlv[0], [2, 4, 3, 4, 5])) seen.add('highlight');
        if (m === 'none' && eq(vals, [6, 10, 7, 12, 15]) && !d.hlv) seen.add('none');
      };
      const nextLab = () => {
        const st = pbi.st;
        if (seen.size === 3) {
          if (st.xsel) { x.todo('Efface la sélection de Dragon : touche à nouveau sa barre, ou un espace vide.'); x.guide('[data-a="seg:vis_lab_bars|0|0"]'); return; }
          x.todo('Désactive Modifier les interactions.'); x.guide(st.selVis ? (st.tab !== 'Format' ? '[data-a="tab:Format"]' : '[data-a="cmd:interactions"]') : '[data-a="vis:vis_lab_bars"]'); return;
        }
        if (!dragon()) { x.todo('Dans la copie, touche la barre Dragon.'); x.guide('[data-a="seg:vis_lab_bars|0|0"]'); return; }
        if (!st.editInter) { x.todo('Active Modifier les interactions, le graphique en barres restant sélectionné.'); x.guide(st.tab !== 'Format' ? '[data-a="tab:Format"]' : '[data-a="cmd:interactions"]'); return; }
        const m = ['filter', 'highlight', 'none'].find(m => !seen.has(m));
        x.todo(`Sur le graphique quotidien, teste ${({ filter: 'Filtrer', highlight: 'Mettre en surbrillance', none: 'Aucune' })[m]} (${seen.size}/3).`); x.guide(`[data-a="inter:vis_lab_bars|vis_lab_daily|${m}"]`);
      };
      const done = () => seen.size === 3 && !pbi.st.xsel && !pbi.st.editInter;
      nextLab();
      await x.wait(K.guard(x, OLD10.concat(DS, TS), {
        pane: later(nextLab), canvas: later(nextLab), visual: later(nextLab), tab: later(nextLab),
        page: id => id !== 'page_lab' ? x.oops(pbi.st.xsel ? 'Sélection de Dragon oubliée' : '', 'Reste dans le laboratoire jusqu’à la fin de l’expérience.') : undefined,
        cmd: c => {
          if (c !== 'interactions') return K.guard(x, OLD10).cmd(c);
          if (pbi.st.editInter && seen.size < 3) return x.oops('', 'Garde le mode Modifier les interactions pour tester les trois réglages.');
          if (pbi.st.editInter && pbi.st.xsel) return x.oops('Sélection de Dragon oubliée');
          setTimeout(() => { if (done()) PBQ.act('ok.state'); else nextLab(); }, 0);
        },
        'ok.state': () => done() ? true : undefined,
        'interaction.mode': () => {},
        'chart.point': p => { if (p.vis !== 'vis_lab_bars') return x.oops('', 'Touche une barre du graphique par attraction.'); if (!p.clear && p.cat !== 'Dragon') return x.oops('', 'Sélectionne Dragon.'); },
        'interaction.set': p => {
          if (CH107.includes(p.src) || CH107.includes(p.tgt)) return x.oops('Modification permanente des anciens graphiques');
          if (p.src !== 'vis_lab_bars' || p.tgt !== 'vis_lab_daily') return x.oops('Mauvais visuel sélectionné avant Modifier les interactions');
        },
        'well.agg': () => x.oops('', 'Nous testons une interaction, pas un calcul.'), 'well.add': () => x.oops('', 'Nous testons une interaction, pas les champs.'),
        'viz.change': () => { check(); setTimeout(() => { if (done()) PBQ.act('ok.state'); else nextLab(); }, 0); }
      }));
      x.guide();
      await x.ask('Avec la surbrillance, que devient le volume de référence du graphique quotidien ?', [{ t: 'Il reste à 50 passages, dont 18 mis en évidence pour Dragon', ok: true }, { t: 'Il tombe à 18 passages', err: 'Filtrer confondu avec mettre en surbrillance' }]);
      await x.ask('Dragon compte 18 passages. Cela fait-il 18 visiteurs ?', [{ t: 'Oui, 18 visiteurs uniques', err: 'Interprétation des 18 passages comme 18 visiteurs uniques' }, { t: 'Non : 18 passages, pas des personnes identifiées', ok: true }]);
      P().pages = P().pages.filter(p => p.id !== 'page_lab'); P().activePage = 'page_001'; pbi.st.selVis = null; pbi.render();
      await x.ok('Copie refermée : les graphiques de la page Attractions n’ont pas changé.');
    }, avance: P => { interFinal(P); P.pages = P.pages.filter(p => p.id !== 'page_lab'); } },

    /* 7 — Le piège des trois dates */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); pbi.st.selVis = null; pbi.st.xsel = null; pbi.st.editInter = false; pbi.render();
      await x.say('oscar', 'Nous avons prévu neuf billets pour le week-end. Pourtant, quand je filtre sur la date d’achat, je ne trouve rien. Où sont passés les billets ?');
      await x.pixel('Ils n’ont pas disparu : le filtre porte simplement sur un autre événement. Vérifions dans un laboratoire.');
      const F = 'tbl_frequentation', A = 'tbl_attractions';
      const card = (id, x0, t, c, agg, title) => ({ id, type: 'card', x: x0, y: 8, w: 30, h: 40, f: { values: [{ t, c, agg }], axis: [], legend: [], cols: [] }, title, fmt: { units: 'none' }, temp: true });
      P().pages.push({ id: 'page_lab', name: 'Laboratoire des dates', temp: true, filters: [], visuals: [card('vis_lab_billets', 2, B, 'Quantite', 'sum', 'Billets'), card('vis_lab_entrees', 35, F, 'ID_Entree', 'count', 'Entrées'), card('vis_lab_passages', 68, A, 'Passages', 'sum', 'Passages')] });
      P().activePage = 'page_lab'; pbi.st.selVis = null; pbi.st.pane = 'Filtres'; pbi.render();
      const TESTS = [
        ['vis_lab_billets', B, 'Date_Achat', null, 'Billets : filtre Date_Achat du 06/06 au 07/06.'],
        ['vis_lab_billets', B, 'Date_Visite', 9, 'Billets : remplace Date_Achat par Date_Visite, même intervalle.'],
        ['vis_lab_entrees', F, 'Date_Entree', null, 'Entrées : filtre Date_Entree du 06/06 au 07/06.'],
        ['vis_lab_passages', A, 'Date_Passage', null, 'Passages : filtre Date_Passage du 06/06 au 07/06.']
      ];
      const seen = [false, false, false, false];
      const weekendF = (vid, t, c) => { const g = fl(K.visOf(x, vid).filters, c, t); return !!g && g.kind === 'range' && g.min === '2026-06-06' && g.max === '2026-06-07' && (g.minOp || 'ge') === 'ge' && (g.maxOp || 'le') === 'le'; };
      const check = () => {
        TESTS.forEach(([vid, t, c, want], i) => {
          if (seen[i]) return;
          if (i === 1 && !seen[0]) return;
          const others = (K.visOf(x, vid).filters || []).filter(g => restr(g) && !(g.t === t && g.c === c));
          if (weekendF(vid, t, c) && !others.length && cardVal(x, vid) === want) seen[i] = true;
        });
      };
      const next = () => {
        const i = seen.findIndex(s => !s); if (i < 0) return;
        const [vid, t, c] = TESTS[i];
        x.todo(TESTS[i][4]);
        if (pbi.st.selVis !== vid) { x.guide(`[data-a="vis:${vid}"]`); return; }
        const v = K.visOf(x, vid);
        const stale = (v.filters || []).find(g => restr(g) && !(g.t === t && g.c === c));
        if (stale && pbi.st.pane === 'Filtres') { x.guide(`[data-a="fcdel:visual|${stale.t}|${stale.c}"]`); return; }
        x.guide(fpG(x, 'visual', c, (key, g) => {
          if (g.kind !== 'range') return [`[data-a="fctype:${key}"]`, '.menu [data-k="advanced"]'];
          const pd = pbi.fcPend(key, g);
          if (pd.min !== '2026-06-06') return [`[data-a="fcval:${key}|min"]`, '.menu [data-k="2026-06-06"]'];
          if (pd.max !== '2026-06-07') return [`[data-a="fcval:${key}|max"]`, '.menu [data-k="2026-06-07"]'];
          return `[data-a="fcapply:${key}"]`;
        }, t));
      };
      next();
      await x.wait(K.guard(x, OLD10.concat(DS, TS), {
        pane: later(next), canvas: later(next), visual: later(next),
        page: id => id !== 'page_lab' ? x.oops('', 'Reste dans le laboratoire : le rapport n’est pas concerné.') : undefined,
        'well.add': p => p.vis === DS ? x.oops('Modification du segment permanent vers Date_Achat') : x.oops('', 'Garde les cartes du laboratoire telles quelles.'),
        'filter.add': p => {
          if (p.scope !== 'visual') return x.oops('', 'Filtre chaque carte séparément, avec un filtre sur ce visuel.');
          const i = seen.findIndex(s => !s), T = TESTS[i] || TESTS[3];
          if (p.target !== T[0]) return x.oops('', 'Commence par la carte indiquée.');
          if (p.c !== T[2]) return x.oops(p.c === 'Date_Visite' && i === 0 ? '' : '', `Utilise ${T[2]} pour ce test.`);
        },
        'filter.set': p => {
          if (p.scope !== 'visual') return x.oops('', 'Filtre chaque carte séparément, avec un filtre sur ce visuel.');
          if (p.kind === 'range' && p.max && p.min && p.min > p.max) return x.oops('', 'La borne de début doit précéder la borne de fin.');
        },
        'filter.type': () => {}, 'filter.remove': () => {}, 'filter.invalid': () => x.oops('', 'La borne de début doit précéder la borne de fin.'),
        'viz.change': () => { check(); if (seen.every(Boolean)) return true; next(); }
      }));
      x.guide();
      const res = K.lesson('Laboratoire · Du 6 au 7 juin 2026', 'Quatre dates, quatre événements', `<table class="tbl wrap" style="width:100%"><thead><tr><th><span class="thc">Champ filtré</span></th><th><span class="thc">Résultat</span></th></tr></thead><tbody>
        <tr><td>Date_Achat</td><td>(Vide) : aucun achat à ces dates dans l’extraction</td></tr>
        <tr><td>Date_Visite</td><td>9 billets, 5 lignes, 276 € : visites prévues</td></tr>
        <tr><td>Date_Entree</td><td>(Vide) : entrées du week-end pas encore disponibles</td></tr>
        <tr><td>Date_Passage</td><td>(Vide) : passages du week-end pas encore disponibles</td></tr></tbody></table>
        <p class="lc-note">${esc(fr('Une valeur vide signale l’absence de lignes dans le contexte. Ce n’est pas forcément un zéro.'))}</p>`);
      x.app('dates', res);
      await x.ask('Pour préparer le week-end, quel champ faut-il filtrer ?', [{ t: 'Date_Achat', err: 'Date_Achat utilisée pour les prévisions' }, { t: 'Date_Visite', ok: true }]);
      await x.ask('La carte affiche (Vide) avec Date_Achat. Que faut-il en conclure ?', [
        { t: 'Le rapport est en panne', err: 'Interprétation d’une valeur vide comme une panne du rapport' },
        { t: 'Il faut remplacer (Vide) par 0', err: 'Remplacement systématique de BLANK par zéro' },
        { t: 'Aucune ligne ne correspond au filtre', ok: true }
      ]);
      await x.say('oscar', 'Puis-je annoncer que nous avons déjà accueilli neuf personnes ce week-end ?');
      await x.ask('Que répondre à Oscar ?', [
        { t: 'Oui, 9 entrées réelles', err: 'Déclaration de neuf entrées réelles' },
        { t: 'Non : aucune entrée ce week-end', err: 'Déclaration de zéro entrée réelle le week-end' },
        { t: 'Non : 9 billets sont vendus, mais les entrées réelles ne sont pas encore connues', ok: true }
      ]);
      await x.ask('Pour estimer la fréquentation totale du week-end, peut-on additionner les 9 billets et les 27 entrées ?', [
        { t: 'Oui : 36 visiteurs', err: 'Addition de neuf billets et vingt-sept entrées' },
        { t: 'On peut reprendre les 50 passages comme prévision', err: 'Utilisation des cinquante passages historiques comme prévision' },
        { t: 'Non : ces chiffres ne portent ni sur la même population ni sur la même période', ok: true }
      ]);
      x.app('pbi');
      P().pages = P().pages.filter(p => p.id !== 'page_lab'); P().activePage = 'page_001'; pbi.st.selVis = null; pbi.st.pane = 'Données'; pbi.render();
      await x.ok('Laboratoire refermé : les trois tables et le rapport sont intacts.');
    }, avance: P => { P.pages = P.pages.filter(p => p.id !== 'page_lab'); } },

    /* 8 — Le filtre fantôme */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K.ready(x, 'page_001'); pbi.st.selVis = null; pbi.st.xsel = null; pbi.st.editInter = false;
      const ds = K.visOf(x, DS), ts = K.visOf(x, TS);
      ds.sel = { kind: 'range', min: '2026-06-06', max: '2026-06-07' }; ts.sel = null;
      P().filters = (P().filters || []).filter(f => !(f.t === B && f.c === 'Canal')).concat({ t: B, c: 'Canal', kind: 'basic', values: ['Web'] });
      pbi.st.pane = 'Données'; pbi.render();
      await x.say('victoria', 'Hier, nous avions neuf billets pour le week-end. Pourquoi n’en reste-t-il que quatre, pour 122 € ?');
      await x.pixel('Un filtre oublié peut agir sans se voir sur le canevas. Vérifions tous les niveaux de filtrage.');
      let stage = 1;
      const web = () => fl(P().filters, 'Canal');
      const weekend = () => ds.sel && ds.sel.kind === 'range' && ds.sel.min === '2026-06-06' && ds.sel.max === '2026-06-07';
      const ok1 = () => (!web() || !restr(web())) && weekend() && cardVal(x, 'vis_105_billets') === 9 && cardVal(x, 'vis_105_ventes_ttc') === 276 && rowsOf(x, 'vis_105_billets').length === 5;
      const restrictiveAnywhere = () => anyRestr(P().filters) || P().pages.some(p => anyRestr(p.filters) || p.visuals.some(v => anyRestr(v.filters)));
      const slicersOn = () => P().pages.some(p => p.visuals.some(v => v.type === 'slicer' && v.sel));
      const next = () => {
        if (stage === 1) { x.todo('Trouve et retire le filtre qui réduit les billets à 4. Garde le segment du week-end.'); x.guide(pbi.st.pane !== 'Filtres' ? '[data-a="pane:Filtres"]' : `[data-a="fcdel:report|${B}|Canal"]`); return; }
        if (ds.sel) { x.todo('Réinitialise le rapport : efface la période du segment de dates.'); x.guide(`[data-a="slclear:${DS}"]`); return; }
        if (ts.sel) { x.todo('Efface aussi les catégories du second segment.'); x.guide(`[data-a="slclear:${TS}"]`); return; }
        x.todo('Périmètre global restauré : enregistre Wonderland_Pilotage.'); x.guide('.pbi-save');
      };
      next();
      const later2 = later(next);
      const base = K.guard(x, OLD10.concat(DS, TS));
      const H = () => K.guard(x, OLD10.concat(DS, TS), {
        page: later2, pane: later2, canvas: later2, visual: later2,
        cmd: c => c === 'relations' || c === 'newmeasure' ? x.oops('Création d’une relation ou d’une mesure DAX') : base.cmd(c),
        'model.tool': () => x.oops('Création d’une relation ou d’une mesure DAX'),
        slicer: p => {
          if (stage === 1) return x.oops(p.vis === DS ? 'Modification du segment vers une période plus large' : '', 'Garde le week-end pour retrouver l’origine précise de l’écart.');
          if (p.vis === DS && !p.clear) return x.oops('', 'Efface la période avec la gomme du segment.');
        },
        'well.agg': p => p.agg === 'count' ? x.oops('Modification de Somme vers Nombre') : noTouch(x),
        'viz.fmt': p => CARDS.includes(p.vis) ? x.oops('Modification manuelle de 122 en 276') : noTouch(x),
        'vis.delete': p => p.vis === DS ? x.oops('Suppression du segment de dates') : p.vis === 'vis_105_entrees' ? x.oops('Suppression de la carte Entrées') : x.oops('', 'Garde ce visuel : il fait partie du rapport.'),
        'filter.add': () => x.oops('', 'Aucun nouveau filtre : il faut au contraire en retirer un.'),
        'filter.set': p => p.restrictive ? x.oops('', 'Aucun nouveau filtre : il faut au contraire en retirer un.') : undefined,
        'filter.remove': p => p.scope === 'report' && p.c === 'Canal' ? undefined : x.oops('', 'Ce filtre-là n’explique pas l’écart.'),
        'interaction.set': () => x.oops('', 'Les interactions sont déjà bien réglées.'),
        save: () => save(), 'file.menu': () => {},
        file: k => k === 'back' ? undefined : k === 'save' ? save() : x.oops('', 'Utilise Enregistrer.'),
        'viz.change': () => { if (stage === 1 && ok1()) return true; next(); }
      });
      const save = () => {
        pbi.closeBackstage();
        if (stage === 1) return x.oops(web() && restr(web()) ? 'Filtre Web encore actif lors de la sauvegarde' : '', 'Termine d’abord la correction.');
        if (restrictiveAnywhere()) return x.oops('Filtre Web encore actif lors de la sauvegarde');
        if (slicersOn()) return x.oops('Sauvegarde avec les segments encore restrictifs');
        if (P().pages.length !== 3 || P().pages.reduce((a, p) => a + p.visuals.length, 0) !== 12) return x.oops('', 'Il faut trois pages et douze visuels.');
        if (Object.keys(P().interactions || {}).some(k => CH107.some(id => k.includes(id)))) return x.oops('', 'Restaure les interactions des graphiques d’origine.');
        if (pbi.inter(ds, K.visOf(x, 'vis_105_entrees')) !== 'none' || pbi.inter(ts, K.visOf(x, 'vis_105_entrees')) !== 'none' || pbi.inter(ds, K.visOf(x, 'vis_105_ventes_ttc')) !== 'filter') return x.oops('', 'Vérifie les interactions des segments : filtrer les visuels commerciaux, pas la carte des entrées.');
        if (pbi.st.xsel) return x.oops('', 'Efface la sélection en cours avant d’enregistrer.');
        if (cardVal(x, 'vis_105_billets') !== 40 || cardVal(x, 'vis_105_ventes_ttc') !== 1310) return x.oops('Sauvegarde avec les segments encore restrictifs');
        P().dirty = false; P().saved = true; pbi.render(); return true;
      };
      await x.wait(H());
      x.guide();
      const cmp = K.lesson('Contrôle avant et après correction', 'Le filtre fantôme : Canal est Web', `<table class="tbl" style="width:100%"><thead><tr><th><span class="thc">Contrôle</span></th><th class="r"><span class="thc">Avant</span></th><th class="r"><span class="thc">Après</span></th></tr></thead><tbody>
        ${[['Lignes de vente', '3', '5'], ['Billets prévus', '4', '9'], ['Ventes TTC', '122 €', '276 €'], ['Montant moyen', '40,67 €', '55,20 €'], ['Entrées historiques', '27', '27']].map(r => `<tr><td>${esc(r[0])}</td><td class="r">${esc(fr(r[1]))}</td><td class="r"><b>${esc(fr(r[2]))}</b></td></tr>`).join('')}</tbody></table>`);
      x.app('fantome', cmp);
      await x.ok('9 billets et 276 € : le filtre global Canal est Web expliquait l’écart.');
      await x.pixel('Avant d’enregistrer, on remet le rapport sur son périmètre global : la mission suivante doit partir des vrais totaux.');
      x.app('pbi');
      stage = 2; next();
      await x.wait(H());
      x.guide();
      await x.ok('Projet enregistré : 40 billets, 1 310 € TTC, 27 entrées, 50 passages. Et deux segments prêts à servir.');
    }, avance: P => { clearAll(P); P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'conseil', n: '8 h 15. Victoria réunit les responsables du parc. Le rapport s’affiche sur le grand écran, et le joueur sélectionne les 6 et 7 juin.' },
    { p: 'victoria', t: 'Nous avons donc déjà vendu neuf billets pour le week-end, pour un total de 276 euros.' },
    { p: 'gabriel', t: 'Six billets étudiants et trois billets seniors, en cinq lignes de vente.' },
    { p: 'lola', t: 'Quatre billets achetés sur Internet, trois via nos partenaires et deux au guichet.' },
    { p: 'oscar', t: 'De quoi préparer l’accueil. Il faudra quand même prévoir les ventes de dernière minute.' },
    { p: 'pixel', t: 'Exactement. Ce rapport montre les billets déjà vendus, pas une prévision complète de la fréquentation.' },
    { clear: 1, card: { k: 'Samedi et dimanche', ul: ['Samedi : 5 billets, 156 € TTC', 'Dimanche : 4 billets, 120 € TTC'] } },
    { p: 'victoria', t: 'Je peux maintenant changer moi-même les critères. Plus besoin de te demander un nouveau tableau à chaque question.' },
    { p: 'pixel', t: 'C’est tout l’intérêt d’un rapport interactif : chacun explore les données en autonomie.' },
    { clear: 1, bg: 'samedi', n: 'Dans le bureau des prévisions, un nouvel écran s’allume. Les équipes choisissent une journée et consultent les billets vendus.' },
    { card: { k: 'Réseau de données du parc', h: '3 services sur 6 connectés', chips: ['Billetterie', 'Fréquentation', 'Attractions'] } },
    { wait: 800 }
  ],
  recompense: { titre: 'Maîtrise du périmètre !', sous: 'Tu sais désormais explorer les données sans perdre de vue leur signification métier.', badge: 'b108', badgeNom: 'Maître des filtres', objet: 'calendrier' },
  fiches: [
    ['Filtre de visuel', 'Quand utiliser un filtre au niveau du visuel ?', 'Pour restreindre une seule visualisation, sans toucher aux autres : le tableau des adultes, à côté des cartes globales.'],
    ['Filtre de page', 'Que filtre un filtre au niveau de la page ?', 'Tous les visuels concernés de la page active. Les autres pages gardent leur périmètre.'],
    ['Filtre de rapport', 'Un filtre sur toutes les pages filtre-t-il toutes les tables ?', 'Non. Il ne s’applique qu’aux visuels qui utilisent sa table. Sans relation, les tables indépendantes restent globales.'],
    ['Filtrage avancé', 'Comment garder les visites du 6 au 7 juin ?', 'Filtrage avancé sur Date_Visite : est le ou après le 06/06/2026, et est le ou avant le 07/06/2026.'],
    ['Le segment', 'Qu’est-ce qu’un segment ?', 'Un visuel de filtrage posé sur le canevas. L’utilisateur choisit son périmètre sans ouvrir le volet Filtres.'],
    ['ET ou OU ?', 'Senior et Étudiant dans un segment, plus une période : quelle logique ?', 'OU entre les valeurs d’un même segment, ET entre les segments différents.'],
    ['Filtrer ou surbrillance', 'Quelle différence entre filtrer et mettre en surbrillance ?', 'Filtrer retire le reste des données. La surbrillance garde le total de référence et met en évidence la sélection.'],
    ['(Vide) n’est pas zéro', 'Une carte affiche (Vide) : que comprendre ?', 'Qu’aucune ligne ne correspond au filtre. Ce n’est pas une panne, ni forcément une valeur nulle.']
  ],
  suite: [
    { bg: 'conseil', n: 'Samedi 6 juin, 8 h 30. Victoria ouvre une enveloppe : l’invitation à la prochaine réunion de direction.' },
    { p: 'victoria', t: 'La présentation approche. Nous devons montrer que Wonderland dispose enfin d’un véritable système de pilotage.' },
    { p: 'victoria', t: 'Toutes les informations sont là. Pourtant, je ne sais pas toujours où regarder en premier.' },
    { p: 'pixel', t: 'Les chiffres sont justes. Il reste à soigner leur présentation : direction le studio.' }
  ],
  accroche: 'Tu rendras le rapport interactif : filtres de visuel, de page et de rapport, segments, interactions et pièges des dates.',
  fin(P) { extendCanvas(P); addDateSlicer(P, false); addTypeSlicer(P); interFinal(P); clearAll(P); P.pages = P.pages.filter(p => p.id !== 'page_lab'); P.activePage = 'page_001'; P.dirty = false; P.saved = true; }
};
window.PBQ.mission(def);
})();

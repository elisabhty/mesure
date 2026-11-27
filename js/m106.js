/* Mission 106 — Une journée mouvementée */
(function () {
'use strict';
const { h, esc, fr, $, $$, clone, toast } = window.PBQ;
const B = 'tbl_billetterie';
const fl = (c, agg, as) => ({ t: B, c, agg, ...(as ? { as } : {}) });
const CARDS = ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees', 'vis_105_vente_moyenne'];
/* La page Vue générale fait de la place : les quatre cartes passent sur une ligne */
function relayout(P) {
  const pg = P.pages.find(p => p.id === 'page_001'); if (!pg) return;
  CARDS.forEach((id, i) => { const v = pg.visuals.find(v => v.id === id); if (v) Object.assign(v, { x: 2 + i * 24.5, y: 3, w: 22.5, h: 30 }); });
  pg.slots = [[2, 37, 47, 60], [51, 37, 47, 60]];
}
const DETAIL = ['ID_Vente', 'Date_Achat', 'Date_Visite', 'Type_Billet', 'Canal', 'Quantite', 'Prix_Unitaire', 'Montant_TTC'];
const CAT = [fl('Type_Billet', 'none', 'Catégorie'), fl('Quantite', 'sum', 'Billets vendus'), fl('Montant_TTC', 'sum', 'Ventes TTC'), fl('Montant_TTC', 'avg', 'Montant moyen par ligne')];
const CAN = [fl('Canal', 'none', 'Canal'), fl('Quantite', 'sum', 'Billets vendus'), fl('Montant_TTC', 'sum', 'Ventes TTC'), fl('ID_Vente', 'count', 'Lignes de vente')];
const tbl = (id, geo, cols, title, extra = {}) => ({ id, type: 'table', x: geo[0], y: geo[1], w: geo[2], h: geo[3], f: { values: [], axis: [], legend: [], cols: clone(cols) }, title, fmt: {}, temp: false, ...extra });

function addPage2(P) { if (!P.pages.some(p => p.id === 'page_002')) P.pages.push({ id: 'page_002', name: 'Détail des ventes', visuals: [], filters: [], slots: [[2, 4, 96, 92]] }); }
function addDetail(P, k) {
  addPage2(P);
  const pg = P.pages.find(p => p.id === 'page_002');
  let v = pg.visuals.find(v => v.id === 'vis_106_detail_ventes');
  if (!v) { v = tbl('vis_106_detail_ventes', [2, 4, 96, 92], [fl('ID_Vente', 'none')], null); pg.visuals.push(v); }
  if (k >= 2) { v.f.cols = DETAIL.map(c => fl(c, 'none')); v.fmt.total = false; }
  if (k >= 3) { v.sort = { i: 7, dir: 'desc' }; v.sort2 = { i: 0, dir: 'asc' }; }
}
function addSummary(P, which) {
  const pg = P.pages.find(p => p.id === 'page_001');
  if (which === 'cat' && !pg.visuals.some(v => v.id === 'vis_106_categories')) pg.visuals.push(tbl('vis_106_categories', [2, 37, 47, 60], CAT, 'Ventes par catégorie de billet', { sort: { i: 2, dir: 'desc' } }));
  if (which === 'cat3' && !pg.visuals.some(v => v.id === 'vis_106_categories')) pg.visuals.push(tbl('vis_106_categories', [2, 37, 47, 60], CAT.slice(0, 3), 'Ventes par catégorie de billet'));
  if (which === 'can' && !pg.visuals.some(v => v.id === 'vis_106_canaux')) pg.visuals.push(tbl('vis_106_canaux', [51, 37, 47, 60], CAN, 'Ventes par canal de distribution', { sort: { i: 2, dir: 'desc' } }));
}
function upgradeCat(P) { const v = P.pages[0].visuals.find(v => v.id === 'vis_106_categories'); if (v) { v.f.cols = clone(CAT); v.sort = { i: 2, dir: 'desc' }; } }
const zebra = P => ['vis_106_detail_ventes', 'vis_106_categories', 'vis_106_canaux'].forEach(id => P.pages.forEach(p => { const v = p.visuals.find(v => v.id === id); if (v) v.fmt.zebra = true; }));

const temps = (x, pg) => (K.pageOf(x, pg) || { visuals: [] }).visuals.filter(v => v.temp);
const sameCols = (v, spec) => v && v.f.cols.length === spec.length && v.f.cols.every((f, i) => f.c === spec[i].c && f.agg === spec[i].agg && !f.hier);
const labelsOk = (v, spec) => v.f.cols.every((f, i) => !spec[i].as || K.norm(PBI.fieldLabel(f)) === K.norm(spec[i].as));

const def = {
  id: 106,
  objectifs: ['Créer une page et des visuels Tableau', 'Ordonner, trier et renommer les colonnes', 'Comprendre la granularité et les totaux'],
  intro: [
    { bg: 'matinee', n: '8 h 45. Des files se forment aux guichets, d’autres familles présentent leurs billets numériques aux portiques.' },
    { p: 'lola', t: 'Les ventes en ligne semblent fonctionner de mieux en mieux. Mais est-ce vraiment notre canal le plus rentable ?' },
    { p: 'gabriel', t: 'Avant de parler de rentabilité, il faudrait connaître les recettes de chaque canal. Et nous n’avons pas encore intégré les coûts.' },
    { n: 'Les indicateurs globaux résument une situation. Pour l’expliquer, il faut examiner ses composantes.' },
    { clear: 1, bg: 'bureau', p: 'gabriel', t: 'Victoria a apprécié ton premier rapport. Mais elle m’a demandé quelle était notre plus grande vente, et je n’ai pas su répondre.' },
    { p: 'gabriel', t: 'J’aimerais consulter les transactions directement, sans ouvrir les fichiers Excel à chaque fois.' },
    { p: 'pixel', t: 'Une carte est idéale pour un chiffre. Pour examiner plusieurs informations en détail, un tableau est bien plus adapté.' },
    { clear: 1, card: { k: 'Trois demandes ce matin', ul: ['Gabriel : consulter les vingt transactions, avec dates, quantités et montants.', 'Lola : comparer les billets adultes, enfants, seniors et étudiants.', 'Victoria : connaître les ventes Web, Guichet et Partenaire.'] } },
    { p: 'pixel', t: 'Trois demandes, trois tableaux. Construisons un rapport où chacun trouve ce qu’il cherche.' },
    { btn: 'Commencer la mission' }
  ],
  leconTitre: 'Les tableaux dans Power BI',
  debut(P) { relayout(P); },
  async lecon(x) {
    const S = [['B001', 'Adulte', 2, 80], ['B002', 'Enfant', 1, 28], ['B005', 'Adulte', 3, 120], ['B006', 'Enfant', 2, 56]];
    const card = K.lesson('Leçon', 'Carte, tableau ou matrice ?', `
      <div class="flow"><div class="flow-box on"><b>Carte</b><small>Un indicateur synthétique, lisible d’un coup d’œil.</small></div>
      <div class="flow-box on hot"><b>Tableau</b><small>Des enregistrements détaillés, ou des résultats regroupés en lignes et colonnes. C’est le sujet du jour.</small></div>
      <div class="flow-box on"><b>Matrice</b><small>Plusieurs axes, des hiérarchies en lignes et en colonnes. Pour plus tard.</small></div></div>
      <div class="lc-k" style="margin-top:14px">Expérience · La granularité</div>
      <div class="seg" data-g="g"><button data-v="d" class="on">Détail</button><button data-v="s">Synthèse</button></div>
      <div data-o="g"></div>
      <div data-sec="2" style="display:none">
        <div class="lc-k" style="margin-top:14px">Trier n’est pas filtrer</div>
        <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>Tri croissant</b><small>28 €, 56 €, 80 €, 160 € : du plus petit au plus grand.</small></div><div class="flow-box on"><b>Tri décroissant</b><small>160 €, 80 €, 56 €, 28 € : du plus grand au plus petit.</small></div></div>
      </div>`);
    x.app('lecon', card);
    const draw = m => {
      $$('[data-g="g"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === m));
      const rows = m === 'd' ? S.map(r => [r[0], r[1], r[2], r[3] + ' €']) : [['Adulte', 5, '200 €'], ['Enfant', 3, '84 €']];
      const head = m === 'd' ? ['ID_Vente', 'Type_Billet', 'Quantité', 'Montant'] : ['Type_Billet', 'Quantité', 'Montant'];
      $('[data-o="g"]', card).innerHTML = `<table class="tbl" style="width:100%"><thead><tr>${head.map(c => `<th><span class="thc">${c}</span></th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(String(c))}</td>`).join('')}</tr>`).join('')}<tr><td><b>Total</b></td>${m === 'd' ? '<td></td>' : ''}<td><b>8</b></td><td><b>284 €</b></td></tr></tbody></table><p class="lc-note">${m === 'd' ? 'Une ligne par identifiant de vente.' : 'Sans ID_Vente, les ventes se regroupent par catégorie.'} Le total reste identique.</p>`;
    };
    $$('[data-g="g"] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.g', b.dataset.v)));
    draw('d');
    await x.pixel('Avant de créer un visuel, demande-toi ce que la personne veut comprendre.');
    await x.pixel('Si un tableau contient ID_Vente, chaque vente reste visible séparément. Sans lui, Power BI regroupe les ventes.');
    x.todo('Passe en vue Synthèse pour voir les ventes se regrouper.');
    x.target($('[data-g="g"] [data-v="s"]', card));
    await x.wait({ 'lab.g': m => { draw(m); if (m === 's') return true; } });
    x.untarget();
    await x.ok('Le niveau de détail change, mais le total reste le même : ce sont les mêmes données.');
    $('[data-sec="2"]', card).style.display = ''; card.firstElementChild.scrollTo({ top: 9999, behavior: 'smooth' });
    await x.pixel('Trier change l’ordre d’affichage. Filtrer change les données prises en compte. Deux opérations différentes.');
    await K.jeu(x, { app: 'jeu106', title: 'Trier ou filtrer ?', btn: 'Vérifier', todo: 'Pour chaque demande, choisis : trier ou filtrer.',
      options: [['tri', 'Trier'], ['flt', 'Filtrer']],
      rows: [['a', 'Afficher les ventes du montant le plus élevé au plus bas', 'tri', 'L’ordre change, mais toutes les ventes restent : c’est un tri.'], ['b', 'Ne garder que les ventes du guichet', 'flt', 'Les autres ventes ne comptent plus : c’est un filtre.'], ['c', 'Classer les canaux par ordre alphabétique', 'tri', 'Les canaux changent de place, aucun ne disparaît : c’est un tri.'], ['d', 'Exclure les ventes passées sur Internet', 'flt', 'Des ventes sortent du calcul : c’est un filtre.']] });
    await x.ok('Trier réorganise, filtrer retire du calcul.');
    x.app('lecon');
    await x.say('gabriel', 'Si le montant moyen est de 60 € au guichet et de 72 € sur Internet, puis-je faire la moyenne des deux ?');
    await x.pixel('Pas forcément ! Si les canaux n’ont pas le même nombre de ventes, la moyenne globale doit être recalculée sur toutes les lignes.');
    K.ready(x, 'page_001');
    await x.pixel('J’ai resserré les quatre cartes en haut de Vue générale, pour faire de la place aux futurs tableaux.');
  },

  exs: [
    /* 1 — Derrière les 1 310 € */
    { async run(x) {
      relayout(x.pbi.P); K.ready(x, 'page_001');
      const pbi = x.pbi;
      await x.say('gabriel', 'Je vois bien les 1 310 €, mais je ne peux pas retrouver une transaction particulière. Il nous manque le détail.');
      await x.pixel('Créons une page réservée à cette consultation : la synthèse de direction reste sur la première page.');
      const pg2 = () => K.pageOf(x, 'page_002');
      const table = () => pg2() && pg2().visuals.find(v => v.type === 'table');
      const ok = () => { const p = pg2(), t = table(); return p && p.name === 'Détail des ventes' && t && sameCols(t, [fl('ID_Vente', 'none')]) && pbi.tableData(t).rows.length === 20 && K.pageOf(x, 'page_001').visuals.length === 4; };
      const next = () => {
        const p = pg2(), t = table();
        if (!p) { x.todo('Ajoute une page avec le bouton + à côté de Vue générale.'); x.guide('.ptab-add'); return; }
        if (p.name !== 'Détail des ventes') { x.todo('Renomme la nouvelle page « Détail des ventes ».'); x.guide(['.ptab.on', '.menu [data-k="rename"]']); return; }
        if (pbi.P.activePage !== 'page_002') { x.todo('Ouvre la page Détail des ventes.'); x.guide('[data-a="ptab:page_002"]'); return; }
        if (!t) { x.todo('Insère un visuel Tableau sur cette page.'); x.guide(pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : '[data-a="vtype:table"]'); return; }
        x.todo('Ajoute la colonne ID_Vente de tBilletterie.'); x.guide(['[data-a="well:cols"]', `.menu [data-k="${B}|ID_Vente"]`]);
      };
      next();
      await x.wait(K.guard(x, ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees', 'vis_105_vente_moyenne'], {
        cmd: c => {
          if (c === 'newpage') { if (pg2()) return x.oops('', 'Une seule nouvelle page suffit.'); const p = pbi.newPage(); p.id = 'page_002'; p.slots = [[2, 4, 96, 92]]; pbi.P.activePage = 'page_002'; pbi.render(); setTimeout(next, 0); return; }
          if (['get', 'excel'].includes(c)) return x.oops('Importation d’un autre fichier');
        },
        'file.menu': () => {}, file: k => k === 'new' ? x.oops('Création d’un nouveau projet') : k === 'back' ? undefined : x.oops('', 'Reste dans le projet Wonderland_Pilotage.'),
        'page.del': id => x.oops(id === 'page_001' ? 'Suppression de Vue générale' : '', 'Garde cette page.'),
        'page.rename': ({ id, name }) => { if (id === 'page_001') return x.oops('', 'Garde le nom Vue générale.'); setTimeout(next, 0); },
        page: () => { setTimeout(next, 0); },
        'viz.create': ({ type }) => { if (pbi.P.activePage !== 'page_002') return x.oops('', 'Crée le tableau sur la nouvelle page, pas sur Vue générale.'); if (type === 'card') return x.oops('Création d’une Carte'); if (type !== 'table') return x.oops('', 'Gabriel veut voir les lignes : choisis un Tableau.'); setTimeout(next, 0); },
        'viz.type': ({ type }) => type !== 'table' ? x.oops(type === 'card' ? 'Création d’une Carte' : '', 'Garde un Tableau.') : undefined,
        'well.add': p => { if (p.field.c === 'ID_Entree' || p.field.t !== B) return x.oops('Sélection de ID_Entree'); if (p.field.c !== 'ID_Vente') return x.oops('', 'Commence par ID_Vente : les autres colonnes viendront ensuite.'); },
        'well.agg': p => { if (p.agg === 'count' || p.agg === 'countd') return x.oops('Nombre de ID_Vente'); },
        'viz.change': () => { if (ok()) return true; next(); },
        pane: () => { setTimeout(next, 0); }
      }));
      x.guide();
      const t = table(); t.id = 'vis_106_detail_ventes'; t.temp = false; Object.assign(t, { x: 2, y: 4, w: 96, h: 92 }); pbi.st.selVis = null; pbi.render();
      await x.ok('Une page Détail des ventes, et les vingt identifiants. Un dossier apparaît sur ton deuxième écran.');
    }, avance: P => { relayout(P); addDetail(P, 1); } },

    /* 2 — Remettre les informations dans l'ordre */
    { async run(x) {
      relayout(x.pbi.P); K.ready(x, 'page_002');
      const pbi = x.pbi, v = K.visOf(x, 'vis_106_detail_ventes');
      pbi.st.selVis = v.id; pbi.st.pane = 'Visualisations'; pbi.st.vzTab = 'champs'; pbi.render();
      await x.say('gabriel', 'Les numéros de vente sont là, mais il me manque la date d’achat, le nombre de billets, le montant et le canal.');
      await x.pixel('Ajoutons les champs et organisons-les : d’abord ce qui décrit la vente, ensuite les quantités et les montants.');
      const card = K.lesson('L’ordre attendu', 'Huit colonnes, de gauche à droite', `<ol class="goals">${DETAIL.map((c, i) => `<li>${i + 1}. ${c}${['Date_Achat', 'Date_Visite'].includes(c) ? ' : la date elle-même' : ['Quantite', 'Prix_Unitaire', 'Montant_TTC'].includes(c) ? ' : Ne pas résumer' : ''}</li>`).join('')}</ol><p class="lc-note">Pas de ligne de total : les synthèses porteront les totaux.</p>`);
      x.app('ordre', card);
      await x.pixel('Voici l’ordre attendu. Sur mobile, le menu de chaque champ propose Monter et Descendre.');
      x.app('pbi');
      const want = DETAIL.map(c => fl(c, 'none'));
      const next = () => {
        const cols = v.f.cols, names = cols.map(f => f.c);
        const miss = DETAIL.find(c => !names.includes(c));
        if (miss) { x.todo(`Ajoute ${miss} (${names.length}/8 colonnes).`); x.guide(['[data-a="well:cols"]', `.menu [data-k="${B}|${miss}"]`]); return; }
        const hi = cols.findIndex(f => f.hier);
        if (hi >= 0) { x.todo(`Pour ${cols[hi].c}, choisis la date elle-même plutôt que sa hiérarchie.`); x.guide([`[data-a="chip:cols|${hi}"]`, '.menu [data-k="raw"]']); return; }
        const ai = cols.findIndex(f => f.agg !== 'none');
        if (ai >= 0) { x.todo(`Règle ${cols[ai].c} sur Ne pas résumer.`); x.guide([`[data-a="chip:cols|${ai}"]`, '.menu [data-k="agg:none"]']); return; }
        const oi = cols.findIndex((f, i) => f.c !== DETAIL[i]);
        if (oi >= 0) { const j = cols.findIndex(f => f.c === DETAIL[oi]); x.todo(`Remonte ${DETAIL[oi]} en position ${oi + 1}.`); x.guide([`[data-a="chip:cols|${j}"]`, '.menu [data-k="up"]']); return; }
        if (v.fmt.total !== false) { x.todo('Dans Format, désactive la ligne de total.'); x.guide(pbi.st.vzTab !== 'format' ? '[data-a="vztab:format"]' : '[data-a="fmttog:total"]'); return; }
      };
      const ok = () => sameCols(v, want) && v.fmt.total === false && pbi.tableData(v).rows.length === 20;
      next();
      await x.wait(K.guard(x, ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees', 'vis_105_vente_moyenne'], {
        'well.add': p => {
          if (p.vis !== v.id) return x.oops('', 'Complète le tableau Détail des ventes.');
          if (p.field.t !== B) return x.oops('Ajout de la colonne Portique');
          if (v.f.cols.some(f => f.c === p.field.c)) return x.oops('Colonne présente deux fois');
          if (!DETAIL.includes(p.field.c)) return x.oops('', 'Ce champ ne fait pas partie du détail demandé.');
        },
        'well.remove': p => { if (p.vis === v.id && p.field.c === 'ID_Vente') return x.oops('Suppression de ID_Vente'); },
        'well.agg': p => {
          if (p.field.c === 'Quantite' && p.agg === 'sum') return x.oops('Somme de Quantite');
          if (p.field.c === 'Prix_Unitaire' && p.agg === 'sum') return x.oops('Somme de Prix_Unitaire');
          if (p.field.c === 'Montant_TTC' && p.agg === 'avg') return x.oops('Moyenne de Montant_TTC');
        },
        'well.hier': p => { if (p.hier) return x.oops('Hiérarchie de dates'); },
        'viz.change': () => { if (ok()) return true; next(); },
        pane: () => { setTimeout(next, 0); }, visual: () => { setTimeout(next, 0); }
      }));
      x.guide();
      await x.ok('Huit colonnes dans l’ordre, des dates lisibles, aucune valeur additionnée : 20 lignes, une par vente.');
    }, avance: P => addDetail(P, 2) },

    /* 3 — À la recherche de la plus grande vente */
    { async run(x) {
      K.ready(x, 'page_002');
      const pbi = x.pbi, v = K.visOf(x, 'vis_106_detail_ventes');
      v.sort = null; v.sort2 = null; pbi.render();
      await x.say('gabriel', 'Victoria voudrait connaître notre plus petite vente, puis notre plus grande.');
      await x.pixel('Au lieu de parcourir toutes les lignes, utilisons le tri : on touche l’en-tête d’une colonne.');
      const mi = () => v.f.cols.findIndex(f => f.c === 'Montant_TTC');
      const first = () => pbi.tableData(v).raw[0];
      let seenAsc = false, seenDesc = false;
      const next = () => {
        if (!seenAsc) { x.todo('Trie Montant_TTC par ordre croissant : touche son en-tête.'); x.guide(`[data-a="thsort:${v.id}|${mi()}"]`); return; }
        if (!seenDesc) { x.todo('Touche à nouveau l’en-tête pour passer en ordre décroissant.'); x.guide(`[data-a="thsort:${v.id}|${mi()}"]`); return; }
        x.todo('Tri secondaire croissant sur ID_Vente : ⋯ › Ajouter un critère de tri.');
        x.guide(pbi.st.sortMode === 'secondary' ? `[data-a="thsort:${v.id}|0"]` : [`[data-a="vis:${v.id}"]`, '.vbar .vmore', '.menu [data-k="sort2"]']);
      };
      const ok = () => seenAsc && seenDesc && v.sort && v.sort.i === mi() && v.sort.dir === 'desc' && v.sort2 && v.sort2.i === 0 && v.sort2.dir === 'asc' && pbi.tableData(v).rows.length === 20;
      next();
      await x.wait(K.guard(x, [], {
        'table.sort': p => {
          if (p.vis !== v.id) return;
          const c = v.f.cols[p.i].c;
          if (p.secondary) { if (c !== 'ID_Vente') return x.oops('', 'Le critère secondaire doit être ID_Vente.'); if (p.dir === 'desc') { setTimeout(() => x.oops('Tri secondaire décroissant sur ID_Vente'), 0); } return; }
          if (c === 'Prix_Unitaire') return x.oops('Tri de Prix_Unitaire');
          if (c === 'Quantite') return x.oops('Tri de Quantite');
        },
        'well.remove': () => x.oops('Suppression des petites ventes'), 'well.add': () => x.oops('', 'Les colonnes sont prêtes : utilise le tri.'), 'well.agg': () => x.oops('', 'Les colonnes sont prêtes : utilise le tri.'),
        cmd: c => c === 'transform' ? x.oops('Tri effectué dans la source Excel') : undefined,
        'viz.change': () => {
          const r = first(); if (!r) return;
          if (v.sort && v.sort.i === mi() && v.sort.dir === 'asc' && r[0] === 'B002') seenAsc = true;
          if (seenAsc && v.sort && v.sort.i === mi() && v.sort.dir === 'desc' && r[0] === 'B013') seenDesc = true;
          if (ok()) return true; next();
        },
        'table.sort2mode': () => { setTimeout(next, 0); }, visual: () => { setTimeout(next, 0); }
      }));
      x.guide();
      await x.ask('Quelle est la plus grande vente ?', [{ t: 'B013, 160 €', ok: true }, { t: 'B018, 4 billets', err: 'B018 sélectionnée comme maximum' }, { t: 'B005, 120 €', msg: 'B005 arrive juste après B013.' }]);
      await x.ok('B002 est la plus petite vente, B013 la plus grande. Et B001 passe avant B017 pour leurs 80 € identiques.');
    }, avance: P => addDetail(P, 3) },

    /* 4 — Quelle catégorie de billets fonctionne le mieux ? */
    { async run(x) {
      relayout(x.pbi.P); K.ready(x, 'page_001');
      const pbi = x.pbi;
      await x.say('lola', 'Notre prochaine campagne concerne les catégories de billets. Combien de billets adultes, enfants, seniors et étudiants avons-nous vendus ?');
      await x.pixel('Regroupons les ventes par catégorie, puis additionnons les quantités et les montants.');
      const want = CAT.slice(0, 3);
      const t = () => temps(x, 'page_001').find(v => v.type === 'table');
      const ok = () => { const v = t(); return v && sameCols(v, want) && K.titleIs(v, 'Ventes par catégorie de billet') && pbi.tableData(v).rows.length === 4; };
      const next = () => {
        const v = t();
        if (!v) { x.todo('Sur Vue générale, touche un espace vide puis crée un Tableau.'); x.guide(pbi.st.selVis ? '[data-a="canvas"]' : pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : '[data-a="vtype:table"]'); return; }
        const names = v.f.cols.map(f => f.c);
        const miss = want.find(f => !names.includes(f.c));
        if (miss) { x.todo(`Ajoute ${miss.c}.`); x.guide(['[data-a="well:cols"]', `.menu [data-k="${B}|${miss.c}"]`]); return; }
        const bad = v.f.cols.findIndex((f, i) => !want[i] || f.agg !== want[i].agg || f.c !== want[i].c);
        if (bad >= 0) { x.todo('Type_Billet en détail, puis la Somme de Quantite et la Somme de Montant_TTC.'); x.guide(`[data-a="chip:cols|${bad}"]`); return; }
        x.todo('Nomme le tableau « Ventes par catégorie de billet ».'); x.guide(pbi.st.vzTab !== 'format' ? '[data-a="vztab:format"]' : '.fmt-in');
      };
      next();
      await x.wait(K.guard(x, CARDS.concat('vis_106_detail_ventes'), {
        'viz.type': p => CARDS.includes(p.vis) ? x.oops('Remplacement d’une carte existante') : undefined,
        'viz.create': ({ type }) => { if (pbi.P.activePage !== 'page_001') return x.oops('', 'Ce tableau va sur la page Vue générale.'); if (type !== 'table') return x.oops('', 'Lola veut un Tableau.'); setTimeout(next, 0); },
        'well.add': p => {
          if (CARDS.includes(p.vis)) return x.oops('Remplacement d’une carte existante');
          if (p.field.c === 'ID_Vente') return x.oops('Ajout de ID_Vente');
          if (p.field.c === 'Prix_Unitaire') return x.oops('Somme de Prix_Unitaire');
          if (p.field.c === 'Canal') return x.oops('Regroupement par Canal');
          if (!['Type_Billet', 'Quantite', 'Montant_TTC'].includes(p.field.c) || p.field.t !== B) return x.oops('', 'Ce champ ne sert pas cette synthèse.');
        },
        'well.agg': p => {
          if (p.field.c === 'Quantite' && p.agg === 'count') setTimeout(() => x.oops('Nombre de Quantite'), 0);
          if (p.field.c === 'Quantite' && p.agg === 'none') setTimeout(() => x.oops('Ne pas résumer sur Quantite'), 0);
          if (p.field.c === 'Type_Billet' && p.agg === 'countd') setTimeout(() => x.oops('Nombre distinct de Type_Billet'), 0);
        },
        cmd: c => c === 'transform' ? x.oops('Regroupement des catégories dans Power Query') : undefined,
        page: () => { setTimeout(next, 0); }, pane: () => { setTimeout(next, 0); }, canvas: () => { setTimeout(next, 0); },
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide();
      const v = t(); v.id = 'vis_106_categories'; v.temp = false; Object.assign(v, { x: 2, y: 37, w: 47, h: 60 }); pbi.st.selVis = null; pbi.render();
      await x.ok('Quatre lignes, une par catégorie : Adulte et Enfant à 12 billets, Étudiant à 9, Senior à 7.');
    }, avance: P => addSummary(P, 'cat3') },

    /* 5 — Un tableau, plusieurs calculs */
    { async run(x) {
      relayout(x.pbi.P); K.ready(x, 'page_001');
      const pbi = x.pbi, v = K.visOf(x, 'vis_106_categories');
      pbi.st.selVis = v.id; pbi.st.pane = 'Visualisations'; pbi.st.vzTab = 'champs'; pbi.render();
      await x.say('gabriel', 'Je vois ce que vend chaque catégorie. Peux-tu aussi afficher le montant moyen d’une ligne de vente ?');
      await x.pixel('Oui : on peut utiliser deux fois la même colonne dans un visuel, avec deux agrégations différentes.');
      const ok = () => sameCols(v, CAT) && labelsOk(v, CAT) && v.fmt.total !== false && v.sort && v.sort.i === 2 && v.sort.dir === 'desc';
      const next = () => {
        const c = v.f.cols;
        if (c.length < 4) { x.todo('Ajoute une deuxième fois Montant_TTC dans Colonnes.'); x.guide(['[data-a="well:cols"]', `.menu [data-k="${B}|Montant_TTC"]`]); return; }
        if (c[3] && c[3].agg !== 'avg') { x.todo('Passe la deuxième occurrence de Montant_TTC en Moyenne.'); x.guide(['[data-a="chip:cols|3"]', '.menu [data-k="agg:avg"]']); return; }
        const ri = c.findIndex((f, i) => CAT[i] && K.norm(PBI.fieldLabel(f)) !== K.norm(CAT[i].as));
        if (ri >= 0) { x.todo(`Renomme la colonne ${ri + 1} en « ${CAT[ri].as} » pour ce visuel.`); x.guide([`[data-a="chip:cols|${ri}"]`, '.menu [data-k="rename"]']); return; }
        if (v.fmt.total === false) { x.todo('Réactive la ligne de total.'); x.guide(['[data-a="vztab:format"]', '[data-a="fmttog:total"]']); return; }
        x.todo('Trie le tableau sur Ventes TTC, par ordre décroissant.'); x.guide(`[data-a="thsort:${v.id}|2"]`);
      };
      next();
      await x.wait(K.guard(x, CARDS.concat('vis_106_detail_ventes'), {
        'well.add': p => {
          if (p.vis !== v.id) return x.oops('', 'Complète le tableau par catégorie.');
          if (p.field.c === 'Prix_Unitaire') return x.oops('Ajout de Prix_Unitaire en Moyenne');
          if (p.field.c !== 'Montant_TTC') return x.oops('', 'Il manque seulement une deuxième occurrence de Montant_TTC.');
          if (v.f.cols.length >= 4) return x.oops('', 'Le tableau a déjà ses quatre colonnes.');
        },
        'well.agg': p => { if (p.vis !== v.id) return; if (p.i === 2 && p.agg !== 'sum') return x.oops('Remplacement de Somme par Moyenne'); if (p.i === 1 && p.agg !== 'sum') return x.oops('', 'Garde la Somme des billets.'); if (p.i === 0 && p.agg !== 'none') return x.oops('', 'Type_Billet reste en détail.'); },
        'well.rename': p => { if (/panier|client/i.test(p.as)) return x.oops('Titre Panier moyen par client'); },
        'viz.fmt': p => { if (p.key === 'total' && p.value === false) return x.oops('Désactivation des totaux'); },
        'table.sort': () => {},
        'well.remove': p => p.vis === v.id && p.i < 3 ? x.oops('', 'Garde les trois premières colonnes.') : undefined,
        cmd: c => c === 'newmeasure' ? x.oops('Création d’une mesure DAX') : undefined,
        'viz.change': () => { const c = v.f.cols; if (c.length === 4 && c[2].agg === 'sum' && c[3].agg === 'sum') x.todo('Deux colonnes en Somme : passe la seconde en Moyenne.'); if (ok()) return true; next(); },
        visual: () => { setTimeout(next, 0); }
      }));
      x.guide();
      await x.ok('Adulte en tête avec 480 €, et un total moyen recalculé à 65,50 €, comme la carte.');
    }, avance: P => upgradeCat(P) },

    /* 6 — Internet contre guichet */
    { async run(x) {
      relayout(x.pbi.P); K.ready(x, 'page_001');
      const pbi = x.pbi;
      await x.say('victoria', 'Notre site Internet a été amélioré. Génère-t-il plus de ventes que nos guichets et nos partenaires ?');
      await x.pixel('Mêmes données, autre regroupement : le canal de distribution.');
      const t = () => temps(x, 'page_001').find(v => v.type === 'table');
      const ok = () => { const v = t(); return v && sameCols(v, CAN) && labelsOk(v, CAN) && K.titleIs(v, 'Ventes par canal de distribution') && v.fmt.total !== false && v.sort && v.sort.i === 2 && v.sort.dir === 'desc' && pbi.tableData(v).rows.length === 3; };
      const next = () => {
        const v = t();
        if (!v) { x.todo('Touche un espace vide de Vue générale, puis crée un troisième Tableau.'); x.guide(pbi.st.selVis ? '[data-a="canvas"]' : pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : '[data-a="vtype:table"]'); return; }
        const names = v.f.cols.map(f => f.c + f.agg);
        const miss = CAN.findIndex((f, i) => !v.f.cols[i] || v.f.cols[i].c !== f.c);
        if (miss >= 0) { x.todo(`Colonne ${miss + 1} : ${CAN[miss].c}.`); x.guide(v.f.cols.length > miss ? `[data-a="chip:cols|${miss}"]` : ['[data-a="well:cols"]', `.menu [data-k="${B}|${CAN[miss].c}"]`]); return; }
        const ai = v.f.cols.findIndex((f, i) => f.agg !== CAN[i].agg);
        if (ai >= 0) { x.todo(`Règle l’agrégation de ${CAN[ai].c} : ${({ none: 'Ne pas résumer', sum: 'Somme', count: 'Nombre' })[CAN[ai].agg]}.`); x.guide([`[data-a="chip:cols|${ai}"]`, `.menu [data-k="agg:${CAN[ai].agg}"]`]); return; }
        const ri = v.f.cols.findIndex((f, i) => K.norm(PBI.fieldLabel(f)) !== K.norm(CAN[i].as));
        if (ri >= 0) { x.todo(`Renomme la colonne ${ri + 1} en « ${CAN[ri].as} ».`); x.guide([`[data-a="chip:cols|${ri}"]`, '.menu [data-k="rename"]']); return; }
        if (!K.titleIs(v, 'Ventes par canal de distribution')) { x.todo('Nomme le tableau « Ventes par canal de distribution ».'); x.guide(pbi.st.vzTab !== 'format' ? '[data-a="vztab:format"]' : '.fmt-in'); return; }
        x.todo('Trie sur Ventes TTC, par ordre décroissant.'); x.guide(`[data-a="thsort:${v.id}|2"]`);
      };
      next();
      await x.wait(K.guard(x, CARDS.concat('vis_106_detail_ventes', 'vis_106_categories'), {
        'viz.create': ({ type }) => { if (pbi.P.activePage !== 'page_001') return x.oops('', 'Ce tableau va sur Vue générale.'); if (type !== 'table') return x.oops('', 'Victoria veut un Tableau.'); setTimeout(next, 0); },
        'well.add': p => {
          if (p.field.c === 'Type_Billet') return x.oops('Utilisation de Type_Billet');
          if (!['Canal', 'Quantite', 'Montant_TTC', 'ID_Vente'].includes(p.field.c) || p.field.t !== B) return x.oops('', 'Ce champ ne sert pas cette synthèse.');
        },
        'well.agg': p => {
          const f = p.field;
          if (f.c === 'ID_Vente' && p.agg === 'none') setTimeout(() => x.oops('ID_Vente en Ne pas résumer'), 0);
          if (f.c === 'Quantite' && p.agg === 'count') setTimeout(() => x.oops('Nombre de Quantite comme billets vendus'), 0);
          if (f.c === 'Montant_TTC' && p.agg === 'avg') setTimeout(() => x.oops('Moyenne de Montant_TTC'), 0);
        },
        'table.sort': () => {}, 'well.rename': () => {},
        cmd: c => c === 'relations' ? x.oops('Création d’une relation avec la fréquentation') : undefined,
        page: () => { setTimeout(next, 0); }, pane: () => { setTimeout(next, 0); }, canvas: () => { setTimeout(next, 0); }, visual: () => { setTimeout(next, 0); },
        'viz.change': () => { if (ok()) return true; next(); }
      }));
      x.guide();
      const v = t(); v.id = 'vis_106_canaux'; v.temp = false; Object.assign(v, { x: 51, y: 37, w: 47, h: 60 }); pbi.st.selVis = null; pbi.render();
      await x.ask('Quel canal génère le montant TTC le plus élevé ?', [{ t: 'Web, 646 €', ok: true }, { t: 'Guichet, 484 €', err: 'Sélection de Guichet comme premier canal' }, { t: 'Partenaire, 180 €', msg: 'Partenaire arrive dernier, avec 3 lignes de vente.' }]);
      await x.ask('Peut-on dire que le Web est le canal le plus rentable ?', [{ t: 'Oui, il rapporte le plus', err: 'Conclusion que Web est le plus rentable' }, { t: 'Non : sans les coûts, on ne connaît que les recettes', ok: true }]);
      await x.say('victoria', 'Très clair : le Web mène en recettes. Pour la rentabilité, on attendra les coûts.');
    }, avance: P => addSummary(P, 'can') },

    /* 7 — Le total qui ne tombe pas juste */
    { async run(x) {
      relayout(x.pbi.P); K.ready(x, 'page_001');
      const pbi = x.pbi, P = pbi.P;
      await x.say('gabriel', 'J’ai calculé la moyenne des trois canaux affichés. Mais je ne retrouve pas les 65,50 € de notre carte !');
      await x.pixel('C’est parce que les trois canaux n’ont pas le même nombre de lignes de vente. Ouvrons un laboratoire.');
      if (!P.pages.some(p => p.id === 'page_lab')) P.pages.push({ id: 'page_lab', name: 'Laboratoire', temp: true, filters: [], visuals: [tbl('vis_lab_canaux', [2, 4, 96, 92], [fl('Canal', 'none', 'Canal'), fl('ID_Vente', 'count', 'Lignes de vente'), fl('Montant_TTC', 'sum', 'Ventes TTC')], 'Laboratoire : moyennes par canal', { temp: true })] });
      P.activePage = 'page_lab'; pbi.st.selVis = 'vis_lab_canaux'; pbi.st.pane = 'Visualisations'; pbi.st.vzTab = 'champs'; pbi.render();
      const lv = K.visOf(x, 'vis_lab_canaux');
      x.todo('Ajoute la Moyenne de Montant_TTC au tableau du laboratoire.');
      x.guide(['[data-a="well:cols"]', `.menu [data-k="${B}|Montant_TTC"]`]);
      await x.wait(K.guard(x, CARDS.concat('vis_106_detail_ventes', 'vis_106_categories', 'vis_106_canaux'), {
        'well.add': p => { if (p.vis !== lv.id) return x.oops('', 'Travaille dans le tableau du laboratoire.'); if (p.field.c !== 'Montant_TTC') return x.oops('', 'Ajoute Montant_TTC.'); },
        'viz.change': () => { const c = lv.f.cols[3]; if (c && c.c === 'Montant_TTC' && c.agg === 'avg') return true; if (c && c.c === 'Montant_TTC') { x.todo('Passe cette colonne en Moyenne.'); x.guide(['[data-a="chip:cols|3"]', '.menu [data-k="agg:avg"]']); } },
        page: () => {}
      }));
      x.guide();
      await x.pixel('Web : 71,78 €, Guichet : 60,50 €, Partenaire : 60,00 €. Et le total du tableau affiche 65,50 €.');
      const cmp = K.lesson('Laboratoire · Comprendre les moyennes', 'Deux méthodes, deux résultats', `<div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b class="num" style="font-size:24px">64,09${' '}€</b><small>Moyenne des trois moyennes : chaque canal pèse autant, même avec 3 ventes.</small></div><div class="flow-box on hot"><b class="num" style="font-size:24px">65,50${' '}€</b><small>Moyenne recalculée sur les 20 lignes : 1 310 € ÷ 20.</small></div></div><p class="lc-note">Le total standard d’une Moyenne est recalculé sur les lignes sous-jacentes. On ne fait jamais la moyenne des résultats visibles.</p>`);
      x.app('moy', cmp);
      await x.ask('Quel est le montant moyen global d’une ligne de vente ?', [{ t: '64,09 €', err: 'Total moyen fixé à 64,09 €' }, { t: '65,50 €', ok: true }, { t: '192,28 €', err: 'Addition des moyennes' }]);
      x.app('pbi');
      x.todo('Ferme le laboratoire : supprime la page Laboratoire depuis son onglet.');
      x.guide(['[data-a="ptab:page_lab"]', '.menu [data-k="del"]']);
      await x.wait(K.guard(x, CARDS.concat('vis_106_detail_ventes', 'vis_106_categories', 'vis_106_canaux'), {
        'page.del': id => { if (id !== 'page_lab') return x.oops('', 'Supprime seulement la page Laboratoire.'); P.pages = P.pages.filter(p => p.id !== 'page_lab'); P.activePage = 'page_001'; pbi.st.selVis = null; pbi.render(); return true; },
        page: () => {}
      }));
      x.guide();
      await x.pixel('Dernière étape : rendre les trois tableaux plus lisibles. Les formats euros et dates viennent déjà du modèle audité.');
      const ids = ['vis_106_detail_ventes', 'vis_106_categories', 'vis_106_canaux'];
      const left = () => ids.filter(id => !K.visOf(x, id).fmt.zebra);
      const next = () => {
        const l = left(); if (!l.length) return;
        const v = K.visOf(x, l[0]), pid = P.pages.find(p => p.visuals.includes(v)).id;
        x.todo(`Active les lignes alternées du tableau « ${v.title || 'Détail des ventes'} » (${3 - l.length}/3).`);
        x.guide(P.activePage !== pid ? `[data-a="ptab:${pid}"]` : pbi.st.selVis !== v.id ? `[data-a="vis:${v.id}"]` : pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : pbi.st.vzTab !== 'format' ? '[data-a="vztab:format"]' : '[data-a="fmttog:zebra"]');
      };
      next();
      await x.wait(K.guard(x, CARDS, {
        'viz.fmt': p => { if (CARDS.includes(p.vis)) return x.oops('', 'Les cartes sont déjà prêtes.'); if (p.key === 'total' && p.value === false && p.vis !== 'vis_106_detail_ventes') return x.oops('Masquage des totaux des synthèses'); },
        'well.agg': () => x.oops('', 'Ne touche pas aux calculs : seulement à la présentation.'), 'well.add': () => x.oops('Conservation du tableau de test'), 'well.remove': () => x.oops('', 'Ne touche pas aux colonnes.'),
        cmd: c => c === 'transform' ? x.oops('Conversion des montants en Texte') : undefined,
        'viz.change': () => { if (!left().length) return true; next(); },
        page: () => { setTimeout(next, 0); }, visual: () => { setTimeout(next, 0); }, pane: () => { setTimeout(next, 0); }
      }));
      x.guide();
      await x.ok('Trois tableaux lisibles : montants en euros, dates jj/mm/aaaa, totaux visibles sur les synthèses.');
    }, avance: P => zebra(P) },

    /* 8 — L'enquête avant la réunion */
    { async run(x) {
      relayout(x.pbi.P); K.ready(x, 'page_001');
      const pbi = x.pbi, can = K.visOf(x, 'vis_106_canaux');
      can.f.cols[1].agg = 'count'; pbi.P.dirty = true; pbi.render();
      await x.pixel('Victoria attend le rapport. Mais je détecte une anomalie : deux résultats différents pour le même indicateur.');
      await x.pixel('À toi de trouver l’origine de l’incohérence.');
      const okCan = () => can.f.cols[1].agg === 'sum';
      x.todo('Compare les totaux des tableaux avec les cartes, et corrige le visuel fautif.');
      x.guide([`[data-a="vis:vis_106_canaux"]`, '[data-a="chip:cols|1"]', '.menu [data-k="agg:sum"]']);
      await x.wait(K.guard(x, CARDS.concat('vis_106_detail_ventes', 'vis_106_categories'), {
        'well.agg': p => {
          if (CARDS.includes(p.vis)) return x.oops('Modification de la carte pour afficher 20');
          if (p.vis === 'vis_106_canaux' && p.i === 1 && p.agg !== 'sum') return x.oops('', 'Il faut additionner les billets.');
          if (p.vis === 'vis_106_canaux' && p.i !== 1) return x.oops('', 'Les autres colonnes de ce tableau sont correctes.');
        },
        'well.remove': () => x.oops('', 'Corrige l’agrégation, sans retirer de colonne.'), 'well.add': () => x.oops('', 'Corrige l’agrégation, sans ajouter de colonne.'),
        'viz.change': () => okCan() ? true : undefined,
        save: () => x.oops('Sauvegarde d’un rapport incomplet'), 'file.menu': () => x.oops('Sauvegarde d’un rapport incomplet')
      }));
      x.guide();
      await x.ok('Web 20, Guichet 14, Partenaire 6 : 40 billets, comme la carte.');
      await x.ask('La carte affiche 40 billets vendus et 27 entrées enregistrées. Est-ce une anomalie ?', [{ t: 'Oui, il manque 13 entrées', err: 'Comparaison de 40 billets et 27 entrées comme une anomalie' }, { t: 'Non : ventes et entrées sont deux événements différents', ok: true }]);
      const P = () => pbi.P;
      await K.saveStep(x, () => {
        if (!okCan()) return ['Sauvegarde d’un rapport incomplet'];
        const n = P().pages.reduce((a, p) => a + p.visuals.length, 0);
        if (P().pages.length !== 2 || n !== 7) return ['Sauvegarde d’un rapport incomplet'];
        return null;
      }, { keep: CARDS.concat('vis_106_detail_ventes', 'vis_106_categories', 'vis_106_canaux'), todo: 'Sept visuels, deux pages : enregistre le projet.' });
      await x.ok('Rapport enregistré : sept visuels cohérents sur deux pages.');
    }, avance: P => { P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'conseil', n: 'Dans la salle de réunion, le rapport s’affiche sur le grand écran.' },
    { p: 'victoria', t: 'Les cartes me donnent la situation, et les tableaux me permettent de comprendre d’où viennent les chiffres.' },
    { p: 'gabriel', t: 'Et je retrouve enfin la vente B013 sans ouvrir un seul fichier Excel.' },
    { p: 'lola', t: 'Adulte et Enfant à égalité en billets, mais les adultes rapportent bien plus. Ma campagne a de quoi démarrer.' },
    { p: 'pixel', t: 'Un tableau bien construit répond à une question précise : le bon niveau de détail, le bon tri, les bons totaux.' },
    { wait: 700 }
  ],
  recompense: { titre: 'Le détail fait la différence !', sous: 'Tu sais désormais explorer et expliquer les résultats du parc.', badge: 'b106', badgeNom: 'Détective des données', objet: 'clavier' },
  fiches: [
    ['Carte ou tableau ?', 'Quand préférer un tableau à une carte ?', 'Quand on doit examiner plusieurs informations ou des lignes détaillées. La carte, elle, résume un seul chiffre.'],
    ['La granularité', 'Pourquoi ajouter ID_Vente change-t-il le tableau ?', 'Avec un identifiant, chaque vente reste une ligne. Sans lui, Power BI regroupe les ventes selon les autres colonnes.'],
    ['Hiérarchie de dates', 'Ma date s’affiche en Année, Trimestre, Mois, Jour. Pourquoi ?', 'Power BI propose une hiérarchie automatique. Choisis la date elle-même dans le menu du champ pour l’afficher telle quelle.'],
    ['Trier un tableau', 'Comment trier un tableau Power BI ?', 'Touche l’en-tête d’une colonne : une fois pour croissant, une deuxième fois pour décroissant.'],
    ['Tri secondaire', 'Comment départager deux montants identiques ?', 'Avec un second critère de tri, par exemple ID_Vente en ordre croissant.'],
    ['Un champ, deux calculs', 'Peut-on afficher la Somme et la Moyenne du même champ ?', 'Oui : on ajoute deux fois le champ dans le visuel, avec une agrégation différente pour chaque occurrence.'],
    ['Renommer pour ce visuel', 'Comment changer un en-tête sans toucher au modèle ?', 'Menu du champ › Renommer pour ce visuel : seul le libellé du visuel change, pas la colonne source.'],
    ['Le total d’une moyenne', 'Pourquoi le total moyen n’est-il pas la moyenne des lignes affichées ?', 'Le total recalcule la moyenne sur toutes les lignes sources. Faire la moyenne des moyennes donnerait le même poids à chaque groupe.']
  ],
  suite: [
    { bg: 'dragon', n: 'Le lendemain, une alerte arrive du centre de supervision des attractions.' },
    { p: 'oscar', t: 'Les attractions enregistrent leurs passages. J’aimerais savoir lesquelles attirent le plus de monde.' },
    { p: 'pixel', t: 'Pour comparer des attractions ou suivre une évolution, un graphique sera bien plus parlant qu’un tableau.' }
  ],
  accroche: 'Tu construiras de vrais tableaux : une page de détail, des colonnes ordonnées, des tris, des regroupements et des totaux justes.',
  fin(P) { relayout(P); addDetail(P, 3); addSummary(P, 'cat'); addSummary(P, 'can'); upgradeCat(P); zebra(P); P.dirty = false; P.saved = true; }
};
window.PBQ.mission(def);
})();

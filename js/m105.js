/* Mission 105 — Les premières statistiques */
(function () {
'use strict';
const { h, esc, fr, $, $$, clone, D, toast } = window.PBQ;
const B = 'tbl_billetterie', F = 'tbl_frequentation';
const SLOT = { vis_105_billets: [2, 6, 30, 42], vis_105_ventes_ttc: [34, 6, 30, 42], vis_105_entrees: [2, 52, 30, 42], vis_105_vente_moyenne: [34, 52, 30, 42] };
const CARDS = {
  vis_105_billets: { t: B, c: 'Quantite', agg: 'sum', title: 'Billets vendus', fmt: {} },
  vis_105_ventes_ttc: { t: B, c: 'Montant_TTC', agg: 'sum', title: 'Ventes TTC', fmt: { units: 'none' } },
  vis_105_entrees: { t: F, c: 'ID_Entree', agg: 'count', title: 'Entrées enregistrées', fmt: {} },
  vis_105_vente_moyenne: { t: B, c: 'Montant_TTC', agg: 'avg', title: 'Montant moyen par ligne de vente', fmt: {} }
};
function addCard(P, id) {
  const pg = P.pages.find(p => p.id === 'page_001');
  if (pg.visuals.some(v => v.id === id)) return;
  const c = CARDS[id], s = SLOT[id];
  pg.visuals.push({ id, type: 'card', x: s[0], y: s[1], w: s[2], h: s[3], f: { values: [{ t: c.t, c: c.c, agg: c.agg }], axis: [], legend: [], cols: [] }, title: c.title, fmt: clone(c.fmt), temp: false });
}
const page1 = x => x.pbi.P.pages.find(p => p.id === 'page_001');
const vis = (x, id) => page1(x).visuals.find(v => v.id === id);
const temps = x => page1(x).visuals.filter(v => v.temp);
const cardVal = (x, v) => { const f = v.f.values[0]; if (!f) return null; const q = x.pbi.query(v); return q ? PBI.aggregate(q.rows.map(r => r[f.c]), f.agg) : null; };
const titleIs = (v, t) => v.title && K.norm(v.title) === K.norm(t);
const AGGN = { sum: 'Somme', avg: 'Moyenne', min: 'Minimum', max: 'Maximum', count: 'Nombre', countd: 'Nombre distinct', none: 'Ne pas résumer', first: 'Premier', last: 'Dernier' };

/* Remet l'espace de travail sur la page Vue générale, vue Rapport */
function ready(x) {
  const pbi = x.pbi; x.app('pbi'); pbi.closeDialog(true); pbi.closePQ && pbi.closePQ(true);
  pbi.st.view = 'report'; pbi.P.activePage = 'page_001'; pbi.render();
}
/* Gestionnaires communs : on ne casse pas les cartes déjà validées */
function guard(x, keep, extra = {}) {
  return Object.assign({
    'well.agg': p => keep.includes(p.vis) ? x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.') : undefined,
    'well.add': p => keep.includes(p.vis) ? x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.') : undefined,
    'well.remove': p => keep.includes(p.vis) ? x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.') : undefined,
    'viz.fmt': p => keep.includes(p.vis) ? x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.') : undefined,
    'viz.type': p => keep.includes(p.vis) ? x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.') : undefined,
    'vis.delete': p => keep.includes(p.vis) ? x.oops('', 'Garde cette carte : elle fait partie du rapport de Victoria.') : undefined,
    view: v => v !== 'report' ? x.oops('', 'Reste dans la vue Rapport pour construire les indicateurs.') : undefined,
    page: () => {}, pane: () => {}, visual: () => {}, canvas: () => {}, tab: () => {}, field: () => {}, 'table.select': () => {},
    'viz.create': () => {}, 'well.rename': () => {}, 'well.hier': () => {}, 'chart.point': () => {}, 'vis.sort': () => {}, 'table.sort': () => {},
    cmd: c => ['newmeasure', 'newcol'].includes(c) ? x.oops('', 'Pas de formule aujourd’hui : une agrégation suffit.') : c === 'relations' ? x.oops('', 'Aucune relation n’est nécessaire pour ces indicateurs.') : undefined,
    'model.tool': () => x.oops('', 'Aucune relation n’est nécessaire pour ces indicateurs.')
  }, extra);
}
/* Création guidée d'une carte : retourne la carte validée */
async function buildCard(x, spec) {
  const pbi = x.pbi;
  let card = null;
  const find = () => page1(x).visuals.find(v => v.temp && v.type === 'card' && (!spec.avoid || !spec.avoid.includes(v.id)));
  const next = () => {
    card = find();
    if (!card) { x.todo(spec.t0); x.guide(pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : '[data-a="vtype:card"]'); return; }
    const f = card.f.values[0];
    if (!f) { x.todo(spec.t1); x.guide(pbi.st.selVis !== card.id ? `[data-a="vis:${card.id}"]` : pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : ['[data-a="well:values"]', `.menu [data-k="${spec.t}|${spec.c}"]`]); return; }
    if (f.agg !== spec.agg) { x.todo(spec.t2); x.guide(['[data-a="chip:values|0"]', `.menu [data-k="agg:${spec.agg}"]`]); return; }
    if (spec.units && (card.fmt.units || 'auto') !== spec.units) { x.todo(spec.t4); x.guide(pbi.st.vzTab !== 'format' ? '[data-a="vztab:format"]' : ['[data-a="fmtsel:units"]', '.menu [data-k="none"]']); return; }
    if (!titleIs(card, spec.title)) { x.todo(spec.t3); x.guide(pbi.st.vzTab !== 'format' ? '[data-a="vztab:format"]' : '.fmt-in'); return; }
  };
  const ok = () => { card = find(); if (!card) return false; const f = card.f.values[0]; return f && f.t === spec.t && f.c === spec.c && f.agg === spec.agg && Math.round(cardVal(x, card) * 100) === Math.round(spec.val * 100) && titleIs(card, spec.title) && (!spec.units || card.fmt.units === spec.units); };
  next();
  await x.wait(guard(x, spec.keep, {
    'viz.create': ({ type }) => type === 'card' ? undefined : x.oops(spec.chartErr || '', 'Victoria veut un chiffre synthétique : choisis une Carte.'),
    'viz.type': ({ type }) => type === 'card' ? undefined : x.oops(spec.chartErr || '', 'Victoria veut un chiffre synthétique : choisis une Carte.'),
    'well.add': p => {
      if (spec.keep.includes(p.vis)) return x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.');
      const k = p.field.t + '|' + p.field.c;
      if (k !== spec.t + '|' + spec.c) return x.oops((spec.fieldErr || {})[k] || '', spec.fieldMsg);
    },
    'well.agg': p => {
      if (spec.keep.includes(p.vis)) return x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.');
      if (p.agg === 'none') return x.oops('', 'Une carte affiche un résultat résumé : choisis une agrégation.');
      if (p.agg !== spec.agg && (spec.aggErr || {})[p.agg]) { setTimeout(() => x.oops(spec.aggErr[p.agg]), 0); }
    },
    'viz.fmt': p => {
      if (spec.keep.includes(p.vis)) return x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.');
      if (p.key === 'title' && spec.titleErr) { const m = spec.titleErr(p.value); if (m) return x.oops(m[0], m[1]); }
      if (p.key === 'units' && p.value !== 'none' && spec.units) setTimeout(() => x.oops(spec.unitsErr || '', 'Victoria veut le montant exact, sans abréviation.'), 0);
    },
    view: v => v === 'table' ? x.oops(spec.tableErr || '', 'Reste dans la vue Rapport pour construire l’indicateur.') : v !== 'report' ? x.oops('', 'Reste dans la vue Rapport.') : undefined,
    'viz.change': () => { if (ok()) return true; next(); },
    pane: () => { setTimeout(next, 0); }, visual: () => { setTimeout(next, 0); }, vztab: () => {}
  }));
  x.guide();
  return card;
}
function promote(x, card, id) {
  card.id = id; card.temp = false;
  const s = SLOT[id]; [card.x, card.y, card.w, card.h] = s;
  x.pbi.st.selVis = null; x.pbi.P.dirty = true; x.pbi.render();
}

const def = {
  id: 105,
  objectifs: ['Résumer des données avec Somme, Moyenne, Nombre, Minimum et Maximum', 'Créer des cartes et régler leur format', 'Choisir l’agrégation qui répond à la question'],
  intro: [
    { bg: 'conseil', n: '8 h 30. Gabriel arrive avec une pile de documents, Oscar avec les registres des portiques, Lola avec ses fichiers commerciaux.' },
    { p: 'victoria', t: 'Nous avons maintenant beaucoup de données. Mais je ne peux pas présenter des centaines de lignes au conseil d’administration.' },
    { p: 'victoria', t: 'J’ai besoin de quelques chiffres clairs.' },
    { n: 'Posséder des données ne suffit pas. Pour comprendre une activité, il faut savoir les résumer.' },
    { clear: 1, bg: 'bureau', card: { k: 'Les questions de Victoria', ul: ['Combien de billets avons-nous vendus ?', 'Quel montant ces ventes ont-elles généré ?', 'Combien d’entrées avons-nous enregistrées ?'] } },
    { p: 'victoria', t: 'J’aimerais aussi savoir combien rapporte en moyenne une ligne de vente. Gabriel veut comparer ce montant avec les prochaines semaines.' },
    { p: 'pixel', t: 'Quatre questions, quatre indicateurs ! Nous allons créer nos premières cartes.' },
    { p: 'victoria', t: 'Parfait. Je reviens cet après-midi.' },
    { clear: 1, p: 'pixel', t: 'Cette opération s’appelle une agrégation : résumer plusieurs valeurs en un seul résultat.' },
    { p: 'pixel', t: 'Mais selon l’agrégation choisie, le résultat peut complètement changer.' },
    { btn: 'Découvrir les agrégations' }
  ],
  leconTitre: 'Les agrégations implicites',
  async lecon(x) {
    const vals = [['B001', 2], ['B002', 1], ['B003', 1], ['B004', 2], ['B005', 3]];
    const ops = { sum: ['Somme', 9, 'Addition de toutes les quantités'], avg: ['Moyenne', '1,8', 'Somme divisée par le nombre de valeurs'], count: ['Nombre', 5, 'Nombre de valeurs renseignées'], countd: ['Nombre distinct', 3, 'Nombre de valeurs différentes : 1, 2 et 3'], min: ['Minimum', 1, 'La plus petite valeur'], max: ['Maximum', 3, 'La plus grande valeur'] };
    const card = K.lesson('La machine à résumer', 'Cinq ventes, une seule colonne', `
      <div class="flow-row" style="grid-template-columns:repeat(5,1fr)">${vals.map(v => `<div class="flow-box on" style="padding:8px 4px; text-align:center"><small>${v[0]}</small><b class="num" style="font-size:20px">${v[1]}</b></div>`).join('')}</div>
      <div class="seg" data-g="a">${Object.entries(ops).map(([k, o]) => `<button data-v="${k}">${o[0]}</button>`).join('')}</div>
      <div class="lc-big"><b data-o="r">?</b><span data-o="n">Choisis une opération.</span></div>
      <div data-sec="2" style="display:none">
        <div class="lc-k" style="margin-top:14px">Implicite ou explicite ?</div>
        <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on hot"><b>Agrégation implicite</b><small>On choisit une colonne et son opération dans un visuel : « Somme de Quantite ». C’est le sujet d’aujourd’hui.</small></div><div class="flow-box on"><b>Mesure explicite</b><small>Un calcul nommé, écrit en DAX et réutilisable. Pour le module 4.</small></div></div>
      </div>`);
    x.app('lecon', card);
    $$('[data-g="a"] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.a', b.dataset.v)));
    const tried = new Set();
    const setA = k => { tried.add(k); $$('[data-g="a"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === k)); $('[data-o="r"]', card).textContent = ops[k][1]; $('[data-o="n"]', card).textContent = ops[k][2]; };
    await x.pixel('Imagine les quantités vendues lors de cinq ventes.');
    await x.pixel('Tu peux les additionner, en calculer la moyenne, les compter, ou chercher la plus grande. Mêmes données, résultats différents.');
    x.todo('Essaie au moins trois opérations, dont Somme et Nombre.');
    x.target($$('[data-g="a"] button', card));
    await x.wait({ 'lab.a': k => { setA(k); if (tried.size >= 3 && tried.has('sum') && tried.has('count')) return true; } });
    x.untarget();
    await x.ok('Somme donne 9 billets, Nombre donne 5 ventes : deux réponses à deux questions différentes.');
    await K.jeu(x, { app: 'jeu105', title: 'Somme ou Nombre ?', btn: 'Vérifier', todo: 'Pour chaque question, choisis Somme ou Nombre.',
      options: [['sum', 'Somme'], ['cnt', 'Nombre']],
      rows: [['a', 'Combien de billets ont été vendus ?', 'sum', 'Les billets s’additionnent : Somme des quantités.'], ['b', 'Combien de ventes ont eu lieu ?', 'cnt', 'Chaque vente est une ligne : on les compte avec Nombre.'], ['c', 'Combien de lignes contient la colonne Quantite ?', 'cnt', 'Compter des lignes, c’est le rôle de Nombre.'], ['d', 'Quel total donnent les quantités additionnées ?', 'sum', 'Additionner les valeurs, c’est le rôle de Somme.']] });
    await x.ok('Des billets à additionner : Somme. Des ventes à compter : Nombre.');
    x.app('lecon');
    await x.pixel('Power BI propose aussi Ne pas résumer, pour afficher chaque valeur sans la regrouper.');
    await x.pixel('Les options disponibles dépendent du type : on ne peut pas additionner du texte, mais on peut le compter.');
    $('[data-sec="2"]', card).style.display = ''; card.firstElementChild.scrollTo({ top: 9999, behavior: 'smooth' });
    await x.pixel('Aujourd’hui, on obtient les résultats sans écrire de formule. Plus tard, on créera nos propres calculs en DAX.');
    ready(x);
    x.pbi.st.pane = 'Visualisations'; x.pbi.render();
    await x.pixel('Pour afficher un indicateur, on utilise un visuel Carte.');
    x.pbi.mark('.vz-gal');
    await x.pixel('L’onglet Visualisations présente les types de visuels. Touche Carte pour en créer une.');
    x.pbi.mark();
    await x.pixel('Ensuite, ajoute un champ dans Champs, vérifie son agrégation, et donne-lui un titre dans l’onglet Format.');
    x.pbi.st.pane = 'Données'; x.pbi.render();
  },

  exs: [
    /* 1 — Le premier chiffre de Wonderland */
    { async run(x) {
      ready(x);
      await x.say('victoria', 'Combien de billets avons-nous vendus pendant les cinq premiers jours de juin ?');
      await x.pixel('La colonne Quantite indique le nombre de billets de chaque ligne de vente. Pour le total, il faut additionner les quantités.');
      const card = await buildCard(x, {
        keep: [], t: B, c: 'Quantite', agg: 'sum', val: 40, title: 'Billets vendus',
        t0: 'Crée une carte : onglet Visualisations, puis Carte.', t1: 'Ajoute la colonne Quantite de tBilletterie dans Champs.', t2: 'Vérifie l’agrégation : il faut additionner les quantités.', t3: 'Nomme la carte « Billets vendus » dans l’onglet Format.',
        fieldErr: { [B + '|Montant_TTC']: 'Somme de Montant_TTC', [F + '|ID_Entree']: 'Nombre de ID_Entree' }, fieldMsg: 'Ce champ ne compte pas les billets vendus.',
        aggErr: { count: 'Utilisation de Nombre sur Quantite', countd: 'Nombre distinct de Quantite', avg: 'Moyenne de Quantite' },
        chartErr: 'Création d’un graphique en barres', tableErr: 'Sélection de la vue Table',
        titleErr: t => /\b40\b/.test(t) ? ['Saisie manuelle de 40'] : null
      });
      promote(x, card, 'vis_105_billets');
      await x.ok('40 billets vendus. Le premier emplacement du tableau de pilotage s’allume !');
    }, avance: P => addCard(P, 'vis_105_billets') },

    /* 2 — Le piège des vingt ventes */
    { async run(x) {
      ready(x);
      await x.say('gabriel', 'Je compte vingt lignes dans le fichier, mais ta carte affiche quarante billets. Est-ce qu’on a une erreur ?');
      await x.pixel('Non : ces deux chiffres sont corrects, mais ils ne disent pas la même chose. Vérifions-le avec une carte d’essai.');
      const seen = new Set();
      let test = null;
      const next = () => {
        test = temps(x).find(v => v.type === 'card');
        if (!test) { x.todo('Crée une carte d’essai avec Quantite.'); x.guide(x.pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : '[data-a="vtype:card"]'); return; }
        const f = test.f.values[0];
        if (!f) { x.todo('Ajoute Quantite de tBilletterie à la carte d’essai.'); x.guide(['[data-a="well:values"]', `.menu [data-k="${B}|Quantite"]`]); return; }
        if (!seen.has('sum')) { x.todo('Affiche la Somme de Quantite sur la carte d’essai.'); x.guide(['[data-a="chip:values|0"]', '.menu [data-k="agg:sum"]']); return; }
        if (!seen.has('count')) { x.todo('Passe maintenant la carte d’essai en Nombre.'); x.guide(['[data-a="chip:values|0"]', '.menu [data-k="agg:count"]']); return; }
      };
      const look = () => {
        test = temps(x).find(v => v.type === 'card'); if (!test) return;
        const f = test.f.values[0]; if (!f || f.t !== B || f.c !== 'Quantite') return;
        const r = cardVal(x, test);
        if (f.agg === 'sum' && r === 40) seen.add('sum');
        if (f.agg === 'count' && r === 20) seen.add('count');
      };
      next();
      await x.wait(guard(x, ['vis_105_billets'], {
        'well.add': p => {
          if (p.vis === 'vis_105_billets') return x.oops('Remplacement de la carte persistante par Nombre');
          if (p.field.c !== 'Quantite' || p.field.t !== B) return x.oops('', 'Pour cette expérience, utilise Quantite.');
        },
        'well.agg': p => {
          if (p.vis === 'vis_105_billets') return x.oops('Remplacement de la carte persistante par Nombre');
          if (p.agg === 'countd') setTimeout(() => x.oops('Nombre distinct = 20 sur Quantite'), 0);
          if (p.agg === 'avg') setTimeout(() => x.oops('Moyenne = 40'), 0);
        },
        'viz.create': ({ type }) => type === 'card' ? undefined : x.oops('', 'Une carte suffit pour cette expérience.'),
        'viz.change': () => { look(); if (seen.size === 2) return true; next(); },
        pane: () => { setTimeout(next, 0); }
      }));
      x.guide();
      await x.pixel('Regarde la vente B013 : une seule ligne, mais quatre billets.');
      await x.pixel('Nombre la compte une fois. Somme, elle, ajoute ses quatre billets.');
      await x.ask('Somme de Quantite donne 40. Que représente ce nombre ?', [{ t: 'Les billets vendus', ok: true }, { t: 'Les lignes de vente', err: 'Somme = 20' }, { t: 'Les personnes venues au parc', msg: 'Un billet vendu ne prouve pas une entrée, et encore moins une personne différente.' }]);
      await x.ask('Nombre de Quantite donne 20. Que représente ce nombre ?', [{ t: 'Les quantités renseignées, une par ligne de vente', ok: true }, { t: 'Les billets vendus', err: 'Nombre = 40' }, { t: '20 clients différents', err: '20 personnes uniques' }]);
      await x.pixel('Ici, chaque ligne a une quantité : Nombre égale le nombre de lignes. Ce ne serait plus vrai avec des valeurs manquantes.');
      x.todo('Supprime la carte d’essai : touche-la, puis ⋯ › Supprimer le visuel.');
      const t = temps(x)[0];
      if (t) { x.pbi.st.selVis = t.id; x.pbi.render(); }
      x.pbi.mark('.vbar .vmore', '.menu [data-k="del"]');
      if (temps(x).length) await x.wait(guard(x, ['vis_105_billets'], {
        'vis.delete': p => p.vis === 'vis_105_billets' ? x.oops('', 'Garde la carte Billets vendus : supprime seulement la carte d’essai.') : undefined,
        'viz.change': () => !temps(x).length ? true : undefined,
        'viz.create': () => x.oops('Conservation de la carte de test dans le rapport')
      }));
      x.pbi.mark();
      await x.ok('Carte d’essai supprimée. La carte Billets vendus garde sa Somme : 40.');
    } },

    /* 3 — Les recettes de Gabriel */
    { async run(x) {
      ready(x);
      await x.say('gabriel', 'Maintenant que je connais le nombre de billets vendus, j’aimerais connaître le montant total des ventes.');
      await x.pixel('Attention : deux colonnes parlent d’argent, Prix_Unitaire et Montant_TTC. Elles n’ont pas le même sens.');
      const anim = K.lesson('Vente B013', 'Le montant inclut la quantité', `<div class="flow-row" style="grid-template-columns:1fr auto 1fr auto 1fr; align-items:center"><div class="flow-box on"><b class="num" style="font-size:22px">4</b><small>Quantité</small></div><b>×</b><div class="flow-box on"><b class="num" style="font-size:22px">40${' '}€</b><small>Prix unitaire</small></div><b>=</b><div class="flow-box on hot"><b class="num" style="font-size:22px">160${' '}€</b><small>Montant TTC</small></div></div>`);
      x.app('b013', anim);
      await x.pixel('Montant_TTC contient déjà le montant complet de chaque ligne : il suffit de l’additionner.');
      ready(x);
      const card = await buildCard(x, {
        keep: ['vis_105_billets'], t: B, c: 'Montant_TTC', agg: 'sum', val: 1310, title: 'Ventes TTC', units: 'none',
        t0: 'Crée une deuxième carte pour les ventes.', t1: 'Ajoute la colonne qui contient le montant complet de chaque ligne.', t2: 'Il faut additionner les montants des lignes.', t3: 'Nomme la carte « Ventes TTC ».', t4: 'Dans Format, règle Unités d’affichage sur Aucune pour lire le montant exact.',
        fieldErr: { [B + '|Prix_Unitaire']: 'Somme de Prix_Unitaire' }, fieldMsg: 'Ce champ ne contient pas le montant des ventes.',
        aggErr: { avg: 'Moyenne de Montant_TTC', count: 'Nombre de Montant_TTC', max: 'Maximum de Montant_TTC' },
        unitsErr: 'Affichage 1,31 K€'
      });
      promote(x, card, 'vis_105_ventes_ttc');
      await x.ok('1 310,00 € : le montant exact, en euros, avec deux décimales.');
      await x.say('gabriel', 'Voilà un chiffre que je peux utiliser dans notre suivi commercial !');
    }, avance: P => addCard(P, 'vis_105_ventes_ttc') },

    /* 4 — Combien de personnes sont entrées ? */
    { async run(x) {
      ready(x);
      await x.say('oscar', 'Nous connaissons les ventes. Mais combien de passages ont été enregistrés à l’entrée du parc ?');
      await x.pixel('Utilisons le registre des portiques. Attention, cette table contient plusieurs identifiants.');
      const card = await buildCard(x, {
        keep: ['vis_105_billets', 'vis_105_ventes_ttc'], t: F, c: 'ID_Entree', agg: 'count', val: 27, title: 'Entrées enregistrées',
        t0: 'Crée une troisième carte pour les entrées.', t1: 'Ajoute ID_Entree, de Frequentation_Wonderland.', t2: 'Une carte de texte affiche la première valeur. Choisis Nombre pour compter les entrées.', t3: 'Nomme la carte « Entrées enregistrées ».',
        fieldErr: { [B + '|ID_Vente']: 'Nombre de ID_Vente dans tBilletterie', [B + '|Quantite']: 'Somme de Quantite' }, fieldMsg: 'Chaque entrée possède son propre identifiant dans le registre des portiques.',
        aggErr: { countd: '' }
      });
      promote(x, card, 'vis_105_entrees');
      await x.ok('27 entrées enregistrées.');
      await x.pixel('Contrôlons les autres identifiants avec une carte d’essai, en Nombre distinct.');
      const seen = new Set();
      const next = () => {
        const t = temps(x).find(v => v.type === 'card');
        if (!t) { x.todo('Crée une carte d’essai.'); x.guide('[data-a="vtype:card"]'); return; }
        if (!seen.has('ID_Billet')) { x.todo('Affiche le Nombre distinct de ID_Billet (registre des portiques).'); x.guide(['[data-a="well:values"]', `.menu [data-k="${F}|ID_Billet"]`]); return; }
        if (!seen.has('ID_Vente')) { x.todo('Remplace par ID_Vente du registre, toujours en Nombre distinct.'); x.guide(['[data-a="chip:values|0"]', '.menu [data-k="remove"]']); return; }
      };
      const look = () => {
        const t = temps(x).find(v => v.type === 'card'); if (!t) return;
        const f = t.f.values[0]; if (!f || f.t !== F || f.agg !== 'countd') return;
        const r = cardVal(x, t);
        if (f.c === 'ID_Billet' && r === 27) seen.add('ID_Billet');
        if (f.c === 'ID_Vente' && r === 15) seen.add('ID_Vente');
        if (f.c === 'Portique') x.oops('Nombre distinct de Portique');
      };
      next();
      await x.wait(guard(x, ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees'], {
        'well.add': p => {
          if (['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees'].includes(p.vis)) return x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.');
          if (p.field.t !== F) return x.oops('Nombre de ID_Vente dans tBilletterie');
        },
        'viz.change': () => { look(); if (seen.size === 2) return true; next(); },
        pane: () => { setTimeout(next, 0); }
      }));
      x.guide();
      await x.pixel('ID_Billet : 27 valeurs différentes, chaque billet admis n’apparaît qu’une fois. ID_Vente : seulement 15.');
      await x.ask('Que représentent ces 15 valeurs distinctes de ID_Vente ?', [{ t: 'Les entrées enregistrées', err: 'Résultat de 15 présenté comme des entrées' }, { t: 'Les ventes distinctes associées à ces entrées', ok: true }, { t: '15 visiteurs uniques', err: '27 personnes uniques' }]);
      await x.pixel('Une vente peut contenir plusieurs billets : son identifiant revient donc plusieurs fois dans le registre.');
      x.todo('Supprime la carte d’essai.');
      const t = temps(x)[0]; if (t) { x.pbi.st.selVis = t.id; x.pbi.render(); }
      x.pbi.mark('.vbar .vmore', '.menu [data-k="del"]');
      if (temps(x).length) await x.wait(guard(x, ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees'], { 'viz.change': () => !temps(x).length ? true : undefined }));
      x.pbi.mark();
      await x.ok('Trois cartes en place, et aucune carte d’essai qui traîne.');
    }, avance: P => addCard(P, 'vis_105_entrees') },

    /* 5 — Combien rapporte une vente ? */
    { async run(x) {
      ready(x);
      await x.say('gabriel', 'Pour comparer avec la semaine prochaine, j’aimerais connaître le montant moyen de nos lignes de vente.');
      await x.pixel('Une moyenne de Montant_TTC fera l’affaire. Mais attention à ne pas la confondre avec le prix moyen d’un billet.');
      const card = await buildCard(x, {
        keep: ['vis_105_billets', 'vis_105_ventes_ttc', 'vis_105_entrees'], t: B, c: 'Montant_TTC', agg: 'avg', val: 65.5, title: 'Montant moyen par ligne de vente',
        t0: 'Crée la quatrième carte.', t1: 'Ajoute le champ qui contient le montant complet de chaque ligne.', t2: 'Gabriel veut une moyenne.', t3: 'Nomme la carte « Montant moyen par ligne de vente ».',
        fieldErr: { [B + '|Prix_Unitaire']: 'Moyenne de Prix_Unitaire', [B + '|Quantite']: 'Moyenne de Quantite' }, fieldMsg: 'Ce champ ne contient pas le montant des lignes.',
        aggErr: { sum: 'Somme de Montant_TTC', count: 'Nombre de Montant_TTC' },
        titleErr: t => /panier|client/i.test(t) ? ['Titre Panier moyen par client'] : null
      });
      promote(x, card, 'vis_105_vente_moyenne');
      const piege = K.lesson('Le piège des moyennes', 'Trois calculs, trois questions', `<table class="tbl" style="width:100%"><thead><tr><th><span class="thc">Calcul</span></th><th class="r"><span class="thc">Résultat</span></th></tr></thead><tbody>
        <tr><td>Moyenne de Montant_TTC<br><small style="color:var(--gris)">Montant moyen d’une ligne de vente</small></td><td class="r"><b>65,50${' '}€</b></td></tr>
        <tr><td>Moyenne de Prix_Unitaire<br><small style="color:var(--gris)">Moyenne simple des prix affichés</small></td><td class="r">32,50${' '}€</td></tr>
        <tr><td>Ventes TTC ÷ Billets vendus<br><small style="color:var(--gris)">Montant moyen par billet</small></td><td class="r">32,75${' '}€</td></tr></tbody></table>
        <p class="lc-note">Le dernier ratio combine deux agrégations : on le construira dans le module DAX.</p>`);
      x.app('piege', piege);
      await x.ok('65,50 € par ligne de vente : 1 310 € divisés par 20 lignes.');
      await x.pixel('Une ligne de vente n’est pas forcément un panier client : c’est pour ça que le titre reste précis.');
      ready(x);
    }, avance: P => addCard(P, 'vis_105_vente_moyenne') },

    /* 6 — Les records de la billetterie */
    { async run(x) {
      ready(x);
      await x.say('lola', 'J’aimerais connaître le plus petit montant enregistré, et le montant de notre plus grosse vente.');
      await x.pixel('Minimum et Maximum retrouvent les valeurs extrêmes. Testons-les sur une carte d’essai.');
      const seen = new Set();
      const need = [['Montant_TTC', 'min', 28], ['Montant_TTC', 'max', 160], ['Quantite', 'min', 1], ['Quantite', 'max', 4]];
      const next = () => {
        const t = temps(x).find(v => v.type === 'card');
        if (!t) { x.todo('Crée une carte d’essai.'); x.guide(x.pbi.st.pane !== 'Visualisations' ? '[data-a="pane:Visualisations"]' : '[data-a="vtype:card"]'); return; }
        const n = need.find(([c, a]) => !seen.has(c + a));
        const f = t.f.values[0];
        if (!f) { x.todo(`Ajoute ${n[0]} à la carte d’essai.`); x.guide(['[data-a="well:values"]', `.menu [data-k="${B}|${n[0]}"]`]); return; }
        if (f.c !== n[0]) { x.todo(`Remplace le champ par ${n[0]}.`); x.guide(['[data-a="chip:values|0"]', '.menu [data-k="remove"]']); return; }
        x.todo(`Affiche le ${n[1] === 'min' ? 'Minimum' : 'Maximum'} de ${n[0]}.`); x.guide(['[data-a="chip:values|0"]', `.menu [data-k="agg:${n[1]}"]`]);
      };
      const look = () => {
        const t = temps(x).find(v => v.type === 'card'); if (!t) return;
        const f = t.f.values[0]; if (!f || f.t !== B) return;
        const r = cardVal(x, t);
        need.forEach(([c, a, v]) => { if (f.c === c && f.agg === a && r === v) seen.add(c + a); });
      };
      next();
      await x.wait(guard(x, Object.keys(CARDS), {
        'well.add': p => { if (Object.keys(CARDS).includes(p.vis)) return x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.'); if (p.field.c === 'Prix_Unitaire') return x.oops('Maximum de Prix_Unitaire = 40 €'); if (!['Montant_TTC', 'Quantite'].includes(p.field.c)) return x.oops('', 'Teste Montant_TTC, puis Quantite.'); },
        'well.agg': p => { if (Object.keys(CARDS).includes(p.vis)) return x.oops('', 'Cette carte est déjà validée : laisse-la telle quelle.'); if (p.agg === 'avg') setTimeout(() => x.oops('Moyenne utilisée à la place de Maximum'), 0); },
        'viz.change': () => { look(); if (seen.size === 4) return true; next(); },
        pane: () => { setTimeout(next, 0); }
      }));
      x.guide();
      await x.pixel('Montant_TTC : de 28 € à 160 €. Quantite : de 1 à 4 billets.');
      await x.pixel('Un maximum donne une valeur, pas la ligne qui la porte. Retrouve les ventes dans la vue Table.');
      x.todo('Dans la vue Table, retrouve la plus petite et la plus grande vente.');
      await x.inputs({
        lbl: 'Les records de Lola', q: 'Quelles ventes portent le minimum et le maximum de Montant_TTC ?', btn: 'Envoyer à Lola',
        fields: [{ id: 'mn', label: 'Plus petite vente (28 €)', text: true }, { id: 'mx', label: 'Plus grande vente (160 €)', text: true }],
        check: ({ mn, mx }) => {
          const a = mn.toUpperCase().replace(/\s/g, ''), b = mx.toUpperCase().replace(/\s/g, '');
          if (!a || !b) return ['', 'Renseigne les deux identifiants.'];
          if (b === 'B018') return 'B018 sélectionnée comme plus grande vente';
          if (a !== 'B002') return ['', 'Cherche la ligne dont Montant_TTC vaut 28.'];
          if (b !== 'B013') return ['', 'Cherche la ligne dont Montant_TTC vaut 160.'];
          return true;
        }
      });
      await x.ask('La quantité maximale est 4. Combien de lignes de vente atteignent ce maximum ?', [{ t: '4 lignes', err: 'Confusion entre maximum et nombre de valeurs maximales' }, { t: '2 lignes : B013 et B018', ok: true }, { t: '1 ligne : B013', msg: 'Relis la colonne Quantite : une autre vente compte aussi quatre billets.' }]);
      ready(x);
      x.todo('Supprime la carte d’essai.');
      const t = temps(x)[0]; if (t) { x.pbi.st.selVis = t.id; x.pbi.render(); }
      x.pbi.mark('.vbar .vmore', '.menu [data-k="del"]');
      if (temps(x).length) await x.wait(guard(x, Object.keys(CARDS), { 'viz.change': () => !temps(x).length ? true : undefined }));
      x.pbi.mark();
      await x.ok('B002 pour le minimum, B013 pour le maximum, et deux ventes à quatre billets.');
    } },

    /* 7 — Ne pas résumer n'est pas ne rien faire */
    { async run(x) {
      ready(x);
      const pbi = x.pbi, pg = page1(x);
      await x.say('oscar', 'La somme des billets est intéressante, mais parfois je dois consulter chaque vente séparément.');
      await x.say('oscar', 'Comment afficher les valeurs sans les regrouper ?');
      await x.pixel('Avec l’option Ne pas résumer, dans un visuel Tableau. J’en ai préparé un pour l’essai.');
      let tv = pg.visuals.find(v => v.id === 'vis_lab_tableau');
      if (!tv) { tv = { id: 'vis_lab_tableau', type: 'table', x: 67, y: 6, w: 31, h: 58, f: { values: [], axis: [], legend: [], cols: [{ t: B, c: 'ID_Vente', agg: 'none' }, { t: B, c: 'Type_Billet', agg: 'none' }, { t: B, c: 'Quantite', agg: 'sum' }] }, title: null, fmt: {}, temp: true }; pg.visuals.push(tv); }
      pbi.st.selVis = tv.id; pbi.st.pane = 'Visualisations'; pbi.st.vzTab = 'champs'; pbi.render();
      const qi = () => tv.f.cols.findIndex(f => f.c === 'Quantite');
      const okT = () => { const q = tv.f.cols.find(f => f.c === 'Quantite'); const d = pbi.tableData(tv); return q && q.agg === 'none' && tv.f.cols.some(f => f.c === 'ID_Vente') && d.rows.length === 20; };
      x.todo('Dans le tableau d’essai, règle Quantite sur Ne pas résumer.');
      x.guide([`[data-a="chip:cols|${qi()}"]`, '.menu [data-k="agg:none"]']);
      await x.wait(guard(x, Object.keys(CARDS), {
        'well.remove': p => { if (p.vis === tv.id && p.field.c === 'ID_Vente') setTimeout(() => x.oops('Suppression de ID_Vente'), 0); },
        'well.agg': p => { if (p.vis !== tv.id) return x.oops('', 'Travaille dans le tableau d’essai.'); },
        'viz.change': () => { if (okT()) return true; if (!tv.f.cols.some(f => f.c === 'ID_Vente')) x.todo('Remets ID_Vente dans le tableau : chaque vente doit rester identifiable.'); },
        'vis.delete': p => p.vis === tv.id ? x.oops('', 'Garde le tableau d’essai pour l’instant.') : x.oops('', 'Garde les cartes du rapport.')
      }));
      x.guide();
      await x.ok('20 lignes, une par vente, identifiables grâce à ID_Vente.');
      await x.pixel('Sans identifiant, deux ventes identiques fusionneraient en une seule ligne : Ne pas résumer ne garantit pas une ligne par enregistrement.');
      await x.pixel('Dernier test : combien de catégories de billets existe-t-il ?');
      const seen = { ok: false };
      const next = () => {
        const t = temps(x).find(v => v.type === 'card');
        if (!t) { x.todo('Crée une carte d’essai avec Type_Billet.'); x.guide(['[data-a="canvas"]', '[data-a="vtype:card"]']); return; }
        const f = t.f.values[0];
        if (!f) { x.todo('Ajoute Type_Billet à la carte d’essai.'); x.guide(['[data-a="well:values"]', `.menu [data-k="${B}|Type_Billet"]`]); return; }
        x.todo('Choisis l’agrégation qui compte les catégories différentes.'); x.guide(['[data-a="chip:values|0"]', '.menu [data-k="agg:countd"]']);
      };
      pbi.st.selVis = null; pbi.render();
      next();
      await x.wait(guard(x, Object.keys(CARDS), {
        'well.add': p => { if (p.vis === tv.id) return x.oops('', 'Utilise une carte d’essai pour ce test.'); if (p.field.c !== 'Type_Billet') return x.oops(p.field.c === 'Quantite' ? 'Nombre distinct de Quantite' : '', 'Utilise Type_Billet pour compter les catégories.'); },
        'well.agg': p => {
          if (p.agg === 'none' && temps(x).some(v => v.id === p.vis && v.type === 'card')) return x.oops('Ne pas résumer dans une carte numérique');
          if (p.agg === 'count') setTimeout(() => x.oops('Nombre de Type_Billet'), 0);
        },
        'viz.change': () => { const t = temps(x).find(v => v.type === 'card'); const f = t && t.f.values[0]; if (f && f.c === 'Type_Billet' && f.agg === 'countd' && cardVal(x, t) === 4) return true; next(); },
        cmd: c => c === 'transform' ? x.oops('Modification du type de Quantite en Texte') : undefined
      }));
      x.guide();
      await x.ok('4 catégories : Adulte, Enfant, Senior et Étudiant.');
      x.todo('Supprime le tableau et la carte d’essai.');
      x.pbi.mark('.vbar .vmore', '.menu [data-k="del"]');
      await x.wait(guard(x, Object.keys(CARDS), { 'vis.delete': p => Object.keys(CARDS).includes(p.vis) ? x.oops('Conservation du tableau temporaire dans Vue générale') : undefined, 'viz.change': () => !temps(x).length ? true : undefined }));
      x.pbi.mark();
      await x.ok('Le rapport est propre : quatre cartes, rien de plus.');
    } },

    /* 8 — La première synthèse de direction */
    { async run(x) {
      ready(x);
      const pbi = x.pbi, pg = page1(x);
      const b = vis(x, 'vis_105_billets'); if (b) b.f.values[0].agg = 'count';
      if (!pg.visuals.some(v => v.id === 'vis_test')) pg.visuals.push({ id: 'vis_test', type: 'card', x: 67, y: 30, w: 31, h: 40, f: { values: [{ t: B, c: 'Montant_TTC', agg: 'count' }], axis: [], legend: [], cols: [] }, title: 'Carte de test', fmt: {}, temp: true });
      pbi.P.dirty = true; pbi.render();
      await x.say('victoria', 'Est-ce que mes quatre indicateurs sont prêts ?');
      await x.pixel('Presque ! Un dernier contrôle : chaque carte doit utiliser la bonne source et la bonne agrégation.');
      await x.pixel('Oh ! Pendant la nuit, une carte a été modifiée par erreur, et une carte de test est restée sur la page.');
      const check = () => {
        const errs = [];
        for (const [id, c] of Object.entries(CARDS)) {
          const v = vis(x, id); if (!v) { errs.push(id); continue; }
          const f = v.f.values[0];
          if (!f || f.t !== c.t || f.c !== c.c || f.agg !== c.agg || !titleIs(v, c.title)) errs.push(id);
        }
        return errs;
      };
      const next = () => {
        const e = check();
        if (e.length) { x.todo('Repère la carte dont le résultat ne correspond pas à son titre, et corrige-la.'); x.guide(['[data-a="vis:vis_105_billets"]', '[data-a="chip:values|0"]', '.menu [data-k="agg:sum"]']); return; }
        if (temps(x).length) { x.todo('Supprime la carte de test.'); x.guide(['[data-a="vis:vis_test"]', '.vbar .vmore', '.menu [data-k="del"]']); return; }
        x.todo('Tout est conforme : enregistre le projet.'); x.guide('.pbi-save');
      };
      next();
      const save = () => { pbi.closeBackstage(); if (check().length) return x.oops('Carte Billets vendus affichant 20'); if (temps(x).length) return x.oops('Présence d’une cinquième carte de test'); pbi.P.dirty = false; pbi.P.saved = true; pbi.render(); return true; };
      await x.wait(guard(x, [], {
        'well.agg': p => {
          if (p.vis === 'vis_105_billets' && p.agg !== 'sum') return x.oops('Carte Billets vendus affichant 20');
          if (p.vis === 'vis_105_ventes_ttc' && p.agg !== 'sum') return x.oops('', 'Cette carte est correcte : garde la Somme.');
          if (p.vis === 'vis_105_entrees' && p.agg !== 'count') return x.oops('', 'Cette carte est correcte : garde Nombre.');
          if (p.vis === 'vis_105_vente_moyenne' && p.agg !== 'avg') return x.oops('', 'Cette carte est correcte : garde la Moyenne.');
        },
        'well.add': p => Object.keys(CARDS).includes(p.vis) ? x.oops('', 'Corrige l’agrégation, pas le champ.') : undefined,
        'well.remove': p => Object.keys(CARDS).includes(p.vis) ? x.oops('', 'Corrige l’agrégation, pas le champ.') : undefined,
        'viz.fmt': p => p.key === 'title' && Object.keys(CARDS).includes(p.vis) && K.norm(p.value) !== K.norm(CARDS[p.vis].title) ? x.oops('Titre incohérent avec le calcul') : undefined,
        'vis.delete': p => Object.keys(CARDS).includes(p.vis) ? x.oops('', 'Garde les quatre cartes de Victoria.') : undefined,
        'viz.create': () => x.oops('', 'Aucun nouveau visuel n’est nécessaire.'),
        'viz.change': () => { setTimeout(next, 0); },
        save: () => save(), 'file.menu': () => {}, file: k => k === 'save' ? save() : k === 'back' ? undefined : x.oops('', 'Utilise Enregistrer.'),
        cmd: c => ['newmeasure', 'relations'].includes(c) ? x.oops('Création d’une relation ou d’une mesure explicite') : undefined
      }));
      x.guide();
      await x.ok('Quatre indicateurs justes, une page propre, un projet enregistré.');
    }, avance: P => { P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'conseil', n: 'La lumière baisse dans la salle de réunion. Le rapport Wonderland apparaît sur le grand écran.' },
    { card: { k: 'Wonderland · Vue générale', ul: ['Billets vendus : 40', 'Ventes TTC : 1 310,00 €', 'Entrées enregistrées : 27', 'Montant moyen par ligne de vente : 65,50 €'] } },
    { p: 'victoria', t: 'Quarante billets vendus. Mille trois cent dix euros de ventes. Vingt-sept entrées. Et soixante-cinq euros cinquante par ligne de vente.' },
    { p: 'gabriel', t: 'Nous avons enfin une synthèse commerciale exploitable !' },
    { p: 'oscar', t: 'Et nous ne confondons plus les billets vendus avec les entrées enregistrées.' },
    { p: 'pixel', t: 'Chaque chiffre répond à une question précise. Mais il faut aussi comprendre comment il a été calculé.' },
    { p: 'victoria', t: 'C’est une excellente première étape. Maintenant, j’aimerais consulter le détail derrière ces chiffres.' },
    { clear: 1, bg: 'pilotage', n: 'Dans la salle de pilotage, quatre écrans s’allument l’un après l’autre.' },
    { p: 'pixel', t: 'Notre centre de contrôle prend enfin vie !' },
    { wait: 700 }
  ],
  recompense: { titre: 'Premier tableau de pilotage !', sous: 'Tu as transformé les données de Wonderland en informations exploitables.', badge: 'b105', badgeNom: 'Maître des indicateurs', objet: 'second-ecran' },
  fiches: [
    ['Agrégation implicite', 'Qu’est-ce qu’une agrégation implicite dans Power BI ?', 'Un résumé choisi directement dans un visuel, comme « Somme de Quantite », sans écrire de formule DAX.'],
    ['Somme ou Nombre ?', 'Somme de Quantite = 40, Nombre de Quantite = 20 : pourquoi ?', 'Somme additionne les billets de chaque ligne. Nombre compte les valeurs renseignées, ici une par ligne de vente.'],
    ['Prix ou montant ?', 'Pourquoi ne pas additionner Prix_Unitaire ?', 'Le prix concerne un seul billet. Montant_TTC inclut déjà la quantité : c’est lui qu’on additionne pour les ventes.'],
    ['Unités d’affichage', 'Comment éviter « 1,31 k€ » sur une carte ?', 'Dans Format, règle Unités d’affichage sur Aucune : la carte affiche 1 310,00 €.'],
    ['Nombre distinct', 'À quoi sert Nombre (distinct) ?', 'À compter les valeurs différentes : 4 catégories de billets, 15 ventes distinctes dans le registre.'],
    ['Moyenne', 'Que donne la Moyenne de Montant_TTC ?', '65,50 € : le montant moyen d’une ligne de vente, pas le prix moyen d’un billet.'],
    ['Minimum et Maximum', 'Le Maximum donne-t-il la ligne concernée ?', 'Non, seulement la valeur. Pour la vente, on cherche la ligne dans la vue Table. Plusieurs lignes peuvent partager le maximum.'],
    ['Ne pas résumer', 'Comment afficher chaque valeur sans la regrouper ?', 'Choisir Ne pas résumer dans un tableau, en gardant un identifiant comme ID_Vente pour distinguer chaque ligne.']
  ],
  suite: [
    { bg: 'bureau', n: 'Le lendemain, les quatre indicateurs s’affichent sur le deuxième écran du bureau.' },
    { mail: { de: 'gabriel', role: 'Direction financière', a: 'Direction Data', heure: '08:12', objet: 'Besoin du détail des ventes', corps: ['Bonjour, les indicateurs sont parfaits pour notre suivi global.', 'Victoria souhaite maintenant consulter les ventes individuelles et comprendre comment les recettes se répartissent entre les catégories de billets.', 'Pourrais-tu ajouter ces informations au rapport sans supprimer les indicateurs existants ? Gabriel'] } },
    { p: 'pixel', t: 'Une carte donne une réponse synthétique. Pour comprendre ce qu’il y a derrière, un tableau est bien plus utile.' },
    { p: 'pixel', t: 'Demain, nous construirons de vrais tableaux : leurs colonnes, leur tri, et leurs totaux.' }
  ],
  accroche: 'Tu découvriras les agrégations : Somme, Moyenne, Nombre, Nombre distinct, Minimum, Maximum et Ne pas résumer, avec tes premières cartes.',
  fin(P) { Object.keys(CARDS).forEach(id => addCard(P, id)); P.dirty = false; P.saved = true; }
};
window.PBQ.mission(def);
})();

/* Mission 210 — Le grand nettoyage (finale du module 2 : sources, réconciliations, tests et décision de publication) */
(function () {
'use strict';
const { h, esc, fr, $, $$, S, store } = window.PBQ;
const PQE = window.PQE;
const POINTS = [10, 15, 15, 10, 15, 15, 10, 10];
const N = K2.N209;
const LIB = 'prep_Maintenance_Libelles', STRUCT = 'prep_Maintenance_Structure', DBL = 'prep_Maintenance_Doublons', ANN = 'atelier_M208_Annuel';
const A206 = 'atelier_M206_Colonnes', A206B = 'atelier_M206_Brut', G206 = 'Atelier M206';
const TEST = 'test_M210_Derive', CTL = 'controle_M210_Schema';
const STEPK = ['add', 'edit', 'del', 'delEnd', 'moveStep', 'renameStep', 'code', 'type', 'renameCol'];
const MM = i => String(i).padStart(2, '0');
const OBLIG = ['ID_Intervention', 'Date_Intervention', 'Attraction', 'Type_Maintenance', 'Duree_Heures', 'Cout_HT', 'TVA_Taux', 'Cout_TTC'];
const SCHEMA = `let\n    Source = ${TEST},\n    Obligatoires = {${OBLIG.map(c => `"${c}"`).join(', ')}},\n    Manquantes =\n        List.Difference(\n            Obligatoires,\n            Table.ColumnNames(Source)\n        ),\n    Controle =\n        if List.Count(Manquantes) > 0 then\n            error "Schéma à revoir : "\n                & Text.Combine(Manquantes, ", ")\n                & " absent"\n        else\n            Source\nin\n    Controle`;

/* ───────── Évaluation : mode, chronomètre, premières tentatives ───────── */
const EV = () => S.eval210 || (S.eval210 = { mode: 'learning', first: {}, hints: {}, t0: null, tEnd: null });
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
    if (!PBQ.active || PBQ.active.id !== 210 || !k) { clearInterval(tick); tick = null; if (k) k.classList.remove('late'); return; }
    const base = k.textContent.split(' · ')[0];
    if (!/^Défi/.test(base)) return;
    const left = 3600 - Math.floor(((e.tEnd || Date.now()) - e.t0) / 1000);
    k.textContent = `${base} · ${left >= 0 ? mmss(left) : '+' + mmss(-left)}`;
    k.classList.toggle('late', left < 0);
  };
  draw(); tick = setInterval(draw, 1000);
}
/* Une partie de défi garde ses points tant qu'aucune erreur n'y a été commise */
const part = x => { const e0 = x.errors; return pts => (x.errors === e0 ? pts : 0); };

/* ───────── État canonique ───────── */
const tmps = P => P.queries.filter(q => q.tmp210);
function AV(P) {
  K2.grp(P, G206);
  P.queries.forEach(q => { if (q.name === A206 || q.name === A206B) q.group = G206; });
  P.queries = P.queries.filter(q => !q.tmp210);
}
function EX8(P) { AV(P); P.name = 'Wonderland_Pilotage_M210'; P.saved = true; P.dirty = false; }

/* ───────── Petits outils ───────── */
const look = (x, n, tries) => K2.work(x, { cur: n, next: () => K2.shown(x, n) ? true : K2.showTodo(x, n), tries });
/* Affirmations à cocher : toutes les justes, aucune fausse. [texte, true] ou [texte, libellé d'erreur, message] */
const claims = (x, q, items) => x.multi(q, items.map((it, i) => ({ t: it[0], v: String(i) })), sel => {
  const bad = items.find((it, i) => sel.includes(String(i)) && it[1] !== true);
  if (bad) return [bad[1] || '', bad[2] || 'Cette affirmation ne tient pas devant les preuves.'];
  return items.some((it, i) => it[1] === true && !sel.includes(String(i))) ? ['', 'Il manque une affirmation que les preuves permettent de défendre.'] : true;
});
/* Vue temporaire du registre filtrée sur quelques identifiants */
const idView = (x, kind, ids, tries) => {
  const same = T => !!T && [...new Set(T.rows.map(r => r.ID_Intervention))].sort().join() === ids.slice().sort().join();
  return K2.tmp(x, { src: LIB, flag: 'tmp210', kind, ops: ['filter'],
    next: t => same(K2.T(x, t.name)) ? true : [`Filtre ID_Intervention : garde seulement ${ids.join(', ')}.`, ['[data-q="flt:ID_Intervention"]', '[data-all]', '.q2-search', '[data-d="ok"]']],
    tries: (p, t) => {
      if (tries) { const r = tries(p, t); if (r === false || r === true) return r; }
      if (p.kind === 'add' && p.op === 'filter') { const R = K2.simulate(x, t, p.step); return same(R.table) ? true : x.oops('', `Garde exactement ${ids.join(', ')}.`); }
    } });
};
const tmpTodoDel = (x, t) => [`Supprime la vue ${t.name} : volet Requêtes, ⋯, Supprimer.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']];

const def = {
  id: 210,
  objectifs: ['Retrouver les sources et la chaîne de chaque résultat', 'Expliquer chaque ligne retirée depuis l’import', 'Prouver que les contrôles détectent les erreurs', 'Décider ce qui est utilisable, et avec quelles limites'],
  xpEx: POINTS.map(p => p * 3),
  intro: [
    { bg: 'archives', n: 'Lundi 8 juin, 15 h 30. Le classeur brut est rangé dans son dossier d’origine. Les préparations sont organisées dans Power Query. Les registres d’investigation portent leurs questions encore ouvertes.' },
    { p: 'oscar', t: 'Nous avons une méthode pour chaque problème. Mais je veux être certain que l’ensemble fonctionne encore quand nous reprenons les sources.' },
    { p: 'gabriel', t: 'Et que les contrôles ne se contentent pas de montrer les chiffres attendus. Ils doivent détecter une erreur si elle apparaît.' },
    { card: { k: 'Épreuve de synthèse', h: 'Préparation et audit' } },
    { clear: 1, bg: 'reunion', card: { k: 'Trois dossiers', ul: ['Maintenance de mai 2026', 'Archives mensuelles 2025', 'Rapprochement des équipements'] } },
    { p: 'victoria', t: 'Ces dossiers ont des états de qualité différents. Je veux savoir lesquels peuvent servir à une analyse, lesquels nécessitent des réserves, et lesquels restent bloqués.' },
    { p: 'oscar', t: 'Le registre principal possède encore des dates impossibles et des informations manquantes.' },
    { p: 'victoria', t: 'Alors expliquez-les. Une bonne préparation doit rendre ces limites visibles.' },
    { clear: 1, p: 'pixel', t: 'Tu connais maintenant les outils. À toi d’organiser les preuves, de contrôler les résultats et de défendre tes décisions.' },
    { btn: 'Entrer dans la salle de réunion' }
  ],
  leconTitre: 'Avant l’épreuve',
  async lecon(x) {
    const e = S.eval210 = { mode: 'learning', first: {}, hints: {}, t0: null, tEnd: null }; store.save();
    $('#w-kicker').textContent = fr('Mission 210 · Épreuve finale');
    const pick = K.lesson('Comment souhaites-tu passer ton épreuve ?', '', `<div class="modes">
      <button class="mode" data-m="learning"><b>Mode apprentissage</b><span>Sans limite de temps. Trois indices par défi, corrections et nouvelles tentatives autorisées.</span></button>
      <button class="mode" data-m="test"><b>Mode test technique</b><span>Objectif : 60 minutes. Tes premières réponses et les indices consultés sont enregistrés.</span></button></div>
      <p class="lc-note">${esc(fr('Les deux modes mènent au certificat. Les cinématiques ne comptent pas dans le temps.'))}</p>`);
    $$('.mode', pick).forEach(b => b.addEventListener('click', () => PBQ.act('mode', b.dataset.m)));
    x.app('lecon', pick);
    x.todo('Choisis ton mode d’épreuve.');
    await x.wait({ mode: m => { e.mode = m; store.save(); $$('.mode', pick).forEach(b => b.classList.toggle('on', b.dataset.m === m)); return true; } });
    await x.pause(500);
    const dossier = K.lesson('Dossier d’épreuve', 'Trois périmètres, à ne jamais additionner', `
      <table class="tbl wrap" style="width:100%"><thead><tr><th><span class="thc">Périmètre</span></th><th><span class="thc">Préparation</span></th><th class="r"><span class="thc">Lignes</span></th></tr></thead><tbody>
      ${[['Maintenance de mai 2026', LIB, '1 099'], ['Archives 2025', ANN, '96'], ['Rapprochement', N.e, '8']].map(r => `<tr><td>${esc(fr(r[0]))}</td><td><small>${esc(r[1])}</small></td><td class="r">${esc(r[2])}</td></tr>`).join('')}</tbody></table>
      <p class="lc-note">${esc(fr('Aucun nouveau justificatif n’arrive pendant la finale : les montants, dates et identités incertains le restent.'))}</p>`);
    x.app('dossier', dossier);
    await x.pixel('Je reste disponible si tu as besoin d’un indice. Mais je ne prendrai aucune décision à ta place.');
    await x.pixel(e.mode === 'test' ? 'Mode test technique : le chronomètre démarre au premier défi. Il continue même si tu le dépasses.' : 'Mode apprentissage : prends le temps qu’il faut. Seule compte la maîtrise.');
  },
  exs: [
    /* 1 — Retrouver les sources et les dépendances */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P; timer();
      x.app('pbi'); pbi.render();
      await x.say('victoria', 'Si quelqu’un reprend ton travail demain, pourra-t-il comprendre d’où viennent les résultats ?');
      const guard = p => {
        if (p.kind === 'renameQuery') return x.oops(p.target && !p.target.m2 ? 'Requête historique renommée' : '', 'Garde les noms : on présente la chaîne, sans la modifier.');
        if (p.kind === 'newQuery') return x.oops(p.how === 'csv' || p.how === 'excel' ? 'Référence remplacée par une nouvelle importation non documentée' : '', 'Aucune nouvelle requête : la chaîne existe déjà.');
        if (p.kind === 'append' || p.kind === 'merge') return x.oops('Supports d’atelier mélangés');
        if (STEPK.includes(p.kind)) { const q = p.target || p.q; return x.oops(q && /_Brut$/.test(q.name) ? 'Fichier brut modifié pour faciliter les contrôles' : '', 'On présente la chaîne : aucune transformation pour l’instant.'); }
      };
      const sc = part(x);
      let seen = false;
      await K2.work(x, { cur: LIB, tries: guard,
        next: () => seen ? true : pbi.dlgKind === 'q2deps' ? ['Suis les flèches depuis les fichiers jusqu’aux résultats, puis ferme la vue.', ['[data-d="close"]']] : ['Présente la chaîne : Affichage › Dépendances de requête.', ['[data-q="tab:Affichage"]', '[data-q="cmd:deps"]']],
        on: { 'q2.depsClose': () => { seen = true; } } });
      await K2.ask(x, 'Quelle requête alimente directement prep_Maintenance_Libelles ?', [{ t: 'prep_Maintenance_Dates, avec la fonction fn_Normaliser', ok: true }, { t: 'atelier_M208_Annuel', err: 'Atelier 2025 présenté comme source de mai 2026' }, { t: 'Le classeur brut, directement', err: 'Référence remplacée par une nouvelle importation non documentée' }]);
      await K2.ask(x, 'D’où viennent les 96 lignes de atelier_M208_Annuel ?', [{ t: 'Des douze CSV de Maintenance › Archives_2025, un par mois', ok: true }, { t: 'D’un export qu’on ne retrouve plus', err: 'Chemin source inconnu' }]);
      const s1 = sc(4), sg = part(x);
      await x.pixel('Les deux requêtes de l’atelier M206 ne sont rangées dans aucun groupe. Range-les dans un groupe Atelier M206.');
      const q206 = () => P().queries.filter(q => q.name === A206 || q.name === A206B);
      await K2.work(x, { cur: A206B,
        next: () => {
          const left = q206().find(q => q.group !== G206); if (!left) return true;
          const has = (P().qgroups || []).includes(G206);
          return [has ? `Range ${left.name} dans le groupe ${G206} : ⋯, Déplacer vers le groupe.` : `Crée le groupe ${G206} avec ${left.name} : ⋯, Déplacer vers le groupe, Nouveau groupe.`, ['[data-q="qd"]', K2.qmenu(x, left), '.menu [data-k="grp"]', has ? `.menu [data-k="g:${G206}"]` : '.menu [data-k="g:+"]', '.dlg input', '[data-d="ok"]']];
        },
        tries: p => {
          if (p.kind === 'newGroup') return p.group === G206 ? true : x.oops('', `Nomme le groupe exactement ${G206}.`);
          if (p.kind === 'group') return q206().includes(p.target) ? (p.group === G206 ? true : x.oops('', `Range-la dans ${G206}.`)) : x.oops('', 'Seules les deux requêtes de l’atelier M206 changent de groupe.');
          if (p.kind === 'load') return x.oops('Groupes assimilés à des protections de chargement');
          return guard(p);
        } });
      const s2 = sg(3), sl = part(x);
      await K2.num(x, 'Dans le diagramme, chaque requête indique son chargement. Combien de préparations de maintenance ou d’atelier sont chargées ?', [{ id: 'n', label: 'Préparations chargées' }], v => v.n === 0 ? true : ['', 'Relis les étiquettes du diagramme : Chargement désactivé, ou Table du modèle pour les trois tables historiques.']);
      await x.ok('La chaîne se lit de bout en bout : un classeur, cinq préparations, et trois ateliers séparés, chacun avec ses fichiers. Rien n’est chargé.');
      first(1, { 'Dépendances': s1, 'Organisation': s2, 'Chargement': sl(3) }); hintsOf(x, 1);
    }, avance: AV },

    /* 2 — Défendre la structure et la conservation des lignes */
    { async run(x) {
      const pbi = x.pbi; timer();
      await x.say('oscar', 'Le classeur brut contient 1 109 lignes, la préparation finale 1 099. Explique-moi les dix lignes de différence.');
      const sr = part(x);
      await K2.work(x, { cur: STRUCT, next: () => !K2.shown(x, STRUCT) ? K2.showTodo(x, STRUCT) : pbi.q2.stepsOpen ? true : ['Retrouve les étapes de structure : ouvre ses Étapes appliquées.', ['[data-q="steps"]']] });
      await x.pause(900);
      const ROWS = [['a', 'Contexte_Retire', 'Titre, notes et ligne vide du haut', '5'], ['b', 'Entetes_Promus', 'La ligne des noms de colonnes', '1'], ['c', 'Commentaire_Structure_Retire', 'La note glissée au milieu', '1'], ['d', 'Pied_Export_Retire', 'Total provisoire et fin d’export', '2'], ['e', 'Copie_Export_Confirmee_Retiree', 'prep_Maintenance_Doublons', '1']];
      const B = K2.sorter({ title: 'De 1 109 à 1 099 lignes', intro: 'Combien de lignes chaque étape retire-t-elle ?', btn: 'Vérifier', options: [['1', '− 1'], ['2', '− 2'], ['5', '− 5']], rows: ROWS.map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
      x.app('rec210', B.el);
      x.todo('Indique l’écart de chaque étape.');
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        if (ROWS.some(r => !values[r[0]])) return x.oops('', 'Indique un écart pour les cinq étapes.');
        const bad = ROWS.filter(r => values[r[0]] !== r[3]).map(r => r[0]); B.mark(bad);
        if (!bad.length) { B.lock(); return true; }
        if (bad.includes('b')) return x.oops('', 'La promotion des en-têtes retire aussi une ligne : celle des noms de colonnes.');
        if (bad.includes('e')) return x.oops('Deux occurrences M0899 supprimées');
        return x.oops('', 'Relis ce que retire chaque étape : le profil de colonne, sur l’ensemble des données, donne le volume exact.');
      } });
      const vol = (n, i) => { const T = K2.T(x, n, i); return T ? T.rows.length : null; };
      const sq = K2.q(x, STRUCT), at = nm => sq.steps.findIndex(z => z.name === nm);
      const V = [['Feuille brute', '—', vol('prep_Maintenance_Brut')]].concat(ROWS.slice(0, 4).map(r => [r[1], '− ' + r[3], vol(STRUCT, at(r[1]))]), [[ROWS[4][1], '− 1', vol(DBL)]]);
      x.app('rec210b', K.lesson('Réconciliation des volumes', 'Recalculée sur les préparations', `<table class="tbl" style="width:100%"><thead><tr><th><span class="thc">Étape</span></th><th class="r"><span class="thc">Écart</span></th><th class="r"><span class="thc">Restant</span></th></tr></thead><tbody>${V.map(r => `<tr><td><small>${esc(r[0])}</small></td><td class="r">${esc(r[1])}</td><td class="r">${r[2] === null ? '—' : esc(K2.n(r[2]))}</td></tr>`).join('')}</tbody></table>`));
      await K2.ask(x, 'Combien d’interventions ont réellement été retirées ?', [{ t: 'Une seule : la copie technique de M0899. Les neuf autres lignes étaient de la structure', ok: true }, { t: 'Dix interventions', err: 'Dix interventions annoncées supprimées' }]);
      x.app('pbi');
      const s1 = sr(6), st = part(x);
      await x.pixel('Vérifie maintenant les traces : M0899 et M0949, dans une vue temporaire du registre.');
      await idView(x, 'ids', ['M0899', 'M0949'], p => {
        if (p.kind === 'add' && p.op === 'index') return x.oops('Index recréé après filtrage');
        if (p.kind === 'add' && ['rename', 'removeCols', 'replace'].includes(p.op)) return x.oops('Colonnes sources remplacées');
      });
      await K2.num(x, 'Lis la vue : Ligne_Source se trouve plus à droite.', [{ id: 'n', label: 'Lignes M0899' }, { id: 'l', label: 'Ligne_Source de M0899' }, { id: 'w', label: 'Lignes M0949' }], v => {
        if (v.n === 2 || v.l === 907) return ['Copie M0899 revenue'];
        if (v.n === 0) return ['Deux occurrences M0899 supprimées'];
        return v.n === 1 && v.l === 906 && v.w === 2 ? true : ['', 'Lis Ligne_Source et compte les lignes de chaque identifiant.'];
      });
      const s2 = st(5), sj = part(x);
      await K2.ask(x, 'Les deux lignes M0949 ?', [{ t: 'Deux interventions différentes, conservées, avec une collision d’identifiant ouverte', ok: true }, { t: 'Un doublon : il aurait fallu en retirer une', err: 'Retrait de M0949 justifié comme doublon' }]);
      await x.ok('1 109 lignes brutes, neuf lignes de structure, une copie technique confirmée : 1 099 candidats. La ligne 906 reste, la 907 est partie, et M0949 garde ses deux interventions.');
      first(2, { 'Réconciliation': s1, 'Traçabilité': s2, 'Justification': sj(4) }); hintsOf(x, 2);
    }, avance: AV },

    /* 3 — Présenter les anomalies encore ouvertes */
    { async run(x) {
      timer();
      await x.say('gabriel', 'Le fichier semble beaucoup plus propre. Peut-on dire qu’il ne contient plus d’erreurs ?');
      await x.pixel('Une présentation claire ne résout pas les questions restées sans justificatif. Réutilise les indicateurs déjà construits.');
      const si = part(x);
      await K2.prof(x, LIB, 'Dossier_Incomplet');
      await K2.num(x, 'Dossiers incomplets.', [{ id: 'n', label: 'TRUE · Dossier_Incomplet' }], v => v.n === 7 ? true : v.n === 5 ? ['', 'Le profil doit porter sur l’ensemble des données, pas sur les 1 000 premières lignes.'] : ['', 'Lis la ligne TRUE de la distribution.']);
      await K2.prof(x, LIB, 'A_Investiguer_Dates');
      await K2.num(x, 'Dossiers temporels.', [{ id: 'n', label: 'TRUE · A_Investiguer_Dates' }], v => v.n === 6 ? true : ['', 'Lis la ligne TRUE de la distribution, sur l’ensemble des données.']);
      const s1 = si(5), sc = part(x);
      const B = K2.sorter({ title: 'Quatre façons d’en parler', intro: 'Classe chaque phrase selon ce qu’elle affirme.', btn: 'Vérifier', options: [['obs', 'Anomalie observée'], ['hyp', 'Hypothèse'], ['conf', 'Correction confirmée'], ['open', 'Décision ouverte']],
        rows: [['a', 'M0040 porte la date du 31 février', 'Constat sur la source'], ['b', 'Le coût négatif de M0220 est peut-être un avoir', 'Explication possible'], ['c', 'La copie de M0899 a été retirée, justificatif à l’appui', 'Mission 204'], ['d', 'M0500 reste Planifiée, en attente de confirmation', 'Statut']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
      x.app('cls210', B.el);
      const SOL = { a: 'obs', b: 'hyp', c: 'conf', d: 'open' };
      x.todo('Classe les quatre phrases.');
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Classe les quatre phrases.');
        const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
        if (!bad.length) { B.lock(); return true; }
        if (bad.includes('a') && values.a === 'conf') return x.oops('Date impossible corrigée par supposition');
        if (bad.includes('b') && values.b === 'conf') return x.oops('Avoir possible supprimé');
        if (bad.includes('d') && values.d === 'conf') return x.oops('M0500 passé à Terminée');
        return x.oops('', 'Un constat se lit dans la source, une hypothèse explique sans prouver, une correction s’appuie sur une pièce, une décision ouverte attend sa réponse.');
      } });
      x.app('pbi');
      const s2 = sc(5), sd = part(x);
      await claims(x, 'Coche les décisions que tu peux défendre.', [['M0025 : coût inconnu, laissé vide et signalé', true], ['M0025 : coût mis à 0 €', 'Null remplacés par zéro'], ['M0600 : durée de 0 h, renseignée, à justifier', true], ['M0600 : durée traitée comme absente', 'Durée nulle assimilée à durée absente'], ['M0949 : deux interventions, collision d’identifiant toujours ouverte', true], ['M0949 : réglé en mission 204', 'Collision M0949 oubliée']]);
      await K2.ask(x, 'Gabriel : « Alors, le registre ne contient plus d’erreurs ? »', [{ t: 'Si : des dossiers restent ouverts, et nos contrôles ne couvrent que les catégories étudiées', ok: true }, { t: 'Non, tout est résolu', err: 'Tous les dossiers déclarés résolus' }, { t: 'Non : nos contrôles valent pour tout le fichier', err: 'Liste de contrôles présentée comme certification exhaustive' }]);
      await x.ok('Sept dossiers incomplets, six dossiers temporels, une collision d’identifiant et plusieurs valeurs incohérentes : tous visibles, aucun maquillé.');
      first(3, { 'Indicateurs': s1, 'Classement': s2, 'Décisions': sd(5) }); hintsOf(x, 3);
    }, avance: AV },

    /* 4 — Auditer les transformations textuelles */
    { async run(x) {
      timer();
      await x.say('victoria', 'Comment prouver que les règles harmonisent les écritures sans changer le sens ?');
      const sr = part(x);
      await x.pixel('Compare source et résultat sur cinq cas limites, dans une vue temporaire.');
      await idView(x, 'txt', ['M0150', 'M0180', 'M0350', 'M0500', 'M0700']);
      await claims(x, 'Coche ce que montre la vue.', [['M0150 : « dragon » reçu, Dragon dans Attraction_Normalisee', true], ['M0150 : la colonne Attraction affiche déjà Dragon', 'Source normalisée puis présentée comme brute'], ['M0700 : Correctif reçu, Corrective selon NOM-M207-01', true], ['M0350 : toujours sans attraction', true], ['M0500 : toujours Planifiée', true]]);
      await K2.ask(x, 'Une règle qui remplacerait « terminee » par « Terminée » partout dans le texte ?', [{ t: 'Refusée : elle changerait aussi « Non terminée »', ok: true }, { t: 'Acceptée : elle est plus simple', err: 'Non terminée remplacé par Terminée' }]);
      const s1 = sr(5), sa = part(x);
      await x.pixel('Côté atelier M206 maintenant.');
      await K2.prof(x, A206, 'A_Revoir');
      await K2.num(x, 'Lignes à revoir dans l’atelier M206.', [{ id: 'n', label: 'TRUE · A_Revoir' }, { id: 'l', label: 'Lignes de l’atelier' }], v => v.n === 3 && v.l === 8 ? true : ['', 'Lis la distribution de A_Revoir et la barre d’état.']);
      await claims(x, 'Coche ce que montre l’atelier.', [['S005 : Jean-Pierre garde son trait d’union', true], ['S006 : Anne Marie réduite à Anne', 'Anne Marie tronqué'], ['S007 : Urgence conservé dans Complement_Equipement', true], ['S008 : rattaché à l’attraction la plus proche', 'S008 interprété arbitrairement'], ['S006, S007 et S008 restent à revoir', true]]);
      await x.ok('Les colonnes dérivées harmonisent, les sources restent telles quelles, et chaque cas limite est signalé plutôt que deviné.');
      first(4, { 'Registre': s1, 'Atelier M206': sa(5) }); hintsOf(x, 4);
    }, avance: AV },

    /* 5 — Prouver la consolidation annuelle */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P; timer();
      await x.say('gabriel', 'Nous avons douze fichiers. Vérifie que chaque mois contribue une fois, et une seule.');
      const sc = part(x);
      await K2.prof(x, ANN, 'Fichier_Source');
      await K2.num(x, 'Profil de Fichier_Source.', [{ id: 'd', label: 'Distinct' }, { id: 'n', label: 'Lignes par fichier' }], v => v.d === 12 && v.n === 8 ? true : ['', 'Lis Distinct et la distribution des valeurs.']);
      const s1 = sc(5), si = part(x);
      await x.pixel('Provoque l’incident dans une copie temporaire : les douze mois, mais janvier deux fois et pas février.');
      const ids = () => Array.from({ length: 12 }, (_, k) => (K2.q(x, 'm208_' + MM(k + 1)) || {}).id);
      const inc = () => tmps(P()).find(q => q.tmp210 === 'inc');
      await K2.work(x, {
        cur: ANN, edit: [], editNew: true,
        next: () => {
          const t = inc();
          if (!t) return pbi.dlgKind === 'q2append' ? ['Trois tables ou plus : m208_01 deux fois, puis m208_03 à m208_12. Pas m208_02. Puis OK.', ['input[name="am"][value="many"]', `[data-add="${ids()[0]}"]`].concat(ids().slice(2).map(id => `[data-add="${id}"]`), ['[data-d="ok"]'])] : ['Accueil › Ajouter des requêtes › Ajouter des requêtes comme nouvelle.', ['[data-q="tab:Accueil"]', '[data-q="cmd:append"]', '.menu [data-k="new"]']];
          if (!K2.shown(x, t.name)) return K2.showTodo(x, t.name);
          if (t.load !== false) return ['Désactive le chargement de cette copie.', ['.q2-qname', '.menu [data-k="load"]']];
          return true;
        },
        tries: p => {
          if (p.kind === 'append') {
            if (!p.asNew) return x.oops('Incident injecté dans la source persistante');
            const I = ids(), want = [I[0], I[0]].concat(I.slice(2));
            return p.list.slice().sort().join() === want.slice().sort().join() ? true : x.oops('', 'Douze tables : m208_01 deux fois, m208_03 à m208_12, et pas m208_02.');
          }
          if (p.kind === 'newQuery') { if (inc()) return x.oops('', 'La copie existe déjà.'); if (p.how !== 'append') return x.oops('', 'Passe par Ajouter des requêtes comme nouvelle.'); p.query.tmp210 = 'inc'; return true; }
          if (p.kind === 'load') { if (p.on) return x.oops('', 'La copie reste non chargée.'); return p.target === inc() ? true : x.oops('', 'Règle seulement la copie.'); }
          if (p.kind === 'renameQuery') return p.target === inc() ? true : x.oops('', 'Garde le nom de cette requête.');
          if (STEPK.includes(p.kind)) { const q = p.target || p.q; if (q && (q.name === ANN || /^m208_/.test(q.name))) return x.oops('Incident injecté dans la source persistante'); if (p.kind === 'add' && p.op === 'distinct') return x.oops('Doublons supprimés pour réparer l’incident'); }
        }
      });
      await K2.prof(x, inc().name, 'Mois_Source');
      await K2.num(x, 'Que détectent les contrôles sur la copie ?', [{ id: 'l', label: 'Lignes' }, { id: 'm', label: 'Mois distincts' }, { id: 'j', label: 'Lignes 2025-01' }], v => {
        if (v.l === 96 && v.m === 12) return ['96 lignes considérées suffisantes'];
        return v.l === 96 && v.m === 11 && v.j === 16 ? true : ['', 'Lis la barre d’état, Distinct, et la ligne 2025-01 de la distribution.'];
      });
      await K2.prof(x, inc().name, 'ID_Intervention');
      await K2.num(x, 'Identifiants distincts dans la copie.', [{ id: 'd', label: 'Distinct' }], v => v.d === 88 ? true : ['', 'Lis Distinct dans le profil.']);
      await K2.num(x, 'Février valait 1 140 € HT, janvier 1 060 €. Quel total HT afficherait la copie, au lieu de 18 000 € ?', [{ id: 't', label: 'Total HT', unit: '€' }], v => v.t === 17920 ? true : v.t === 18000 ? ['96 lignes considérées suffisantes'] : ['', '18 000 €, moins février, plus un second janvier.']);
      await K2.work(x, { cur: ANN, next: () => { const t = inc(); return t ? tmpTodoDel(x, t) : true; }, delQuery: p => p.target === inc() ? true : false });
      const s2 = si(6), sj = part(x);
      await x.ok('Le contrôle a résisté : même avec 96 lignes, il a vu onze mois, seize lignes de janvier, 88 identifiants et 17 920 €. La copie fautive est supprimée, la consolidation reste juste.');
      first(5, { 'Contrôles': s1, 'Incident': s2, 'Justification': sj(4) }); hintsOf(x, 5);
    }, avance: AV },

    /* 6 — Vérifier la fusion et ses garde-fous */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P; timer();
      await x.say('oscar', 'Le code EQ04 a toujours deux responsables. Comment empêches-tu cette ambiguïté d’augmenter les coûts ?');
      const sc = part(x);
      await K2.prof(x, N.e, 'Statut_Rapprochement');
      await K2.num(x, 'Statuts de atelier_M209_Enrichi.', [{ id: 'u', label: 'Correspondance unique' }, { id: 'a', label: 'Référentiel ambigu' }, { id: 'i', label: 'Code inconnu' }, { id: 'c', label: 'Clé absente' }], v => v.u === 5 && v.a === 1 && v.i === 1 && v.c === 1 ? true : v.i === 2 ? ['J007 et J008 confondus'] : ['', 'Lis la distribution des valeurs.']);
      const s1 = sc(5), sd = part(x);
      await x.pixel('Démontre le risque dans une copie temporaire du diagnostic : développe les correspondances sans protection.');
      const demo = () => tmps(P()).find(q => q.tmp210 === 'demo');
      await K2.tmp(x, { src: N.d, flag: 'tmp210', kind: 'demo', ops: ['expand'],
        next: t => t.steps.some(s => s.op === 'expand') ? true : ['Développe Correspondances : l’icône à droite de son en-tête, puis OK.', ['[data-q="exp:Correspondances"]', '[data-d="ok"]']],
        tries: (p, t) => {
          if (p.kind === 'add' && p.op === 'filter') return x.oops('J004 supprimé');
          if (p.kind === 'add' && p.op === 'expand') return p.step.col === 'Correspondances' ? true : x.oops('', 'Développe Correspondances.');
        } });
      await K2.num(x, 'La copie développée, face au résultat protégé.', [{ id: 'l', label: 'Lignes de la copie' }, { id: 't', label: 'Total HT de la copie', unit: '€' }], v => v.l === 9 && v.t === 2450 ? true : v.t === 2200 ? ['', 'J004 apparaît deux fois dans la copie : son coût aussi.'] : ['', 'Lis la barre d’état ; le total vaut 2 200 € plus la répétition de J004.']);
      await K2.work(x, { cur: N.d, next: () => { const t = demo(); return t ? tmpTodoDel(x, t) : true; }, delQuery: p => p.target === demo() ? true : false });
      const s2 = sd(6), sg = part(x);
      await claims(x, 'Coche les garde-fous effectivement en place.', [['J004 reste sans responsable choisi', true], ['J004 attribué à Malik, listé en premier', 'Premier responsable choisi'], ['Les coûts de J004, J007 et J008 restent présents', true], ['Le total ne compte que les cinq dossiers enrichis', 'Total limité aux dossiers enrichis'], ['J007 vaut 0 € puisqu’il n’a pas de description', 'Attributs nulls interprétés comme coût nul']]);
      await K2.ask(x, 'Faut-il retirer une des deux lignes EQ04 du référentiel ?', [{ t: 'Non, pas sans confirmation : les deux affectations restent à investiguer', ok: true }, { t: 'Oui, celle de Lina', err: 'Référentiel corrigé sans confirmation' }]);
      await x.ok('Huit interventions, 2 200 € HT, cinq correspondances uniques et trois causes distinctes. La copie de neuf lignes a montré le piège, sans rien laisser derrière elle.');
      first(6, { 'Contrôles': s1, 'Démonstration': s2, 'Garde-fous': sg(4) }); hintsOf(x, 6);
    }, avance: AV },

    /* 7 — Tester la reproductibilité */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P; timer();
      await x.say('gabriel', 'Tout fonctionne sur cette ouverture. Mais les étapes retrouveront-elles les mêmes résultats si nous relisons les mêmes fichiers ?');
      const sa = part(x);
      let refreshed = false;
      await K2.work(x, { cur: ANN,
        next: () => refreshed ? true : !K2.shown(x, ANN) ? K2.showTodo(x, ANN) : ['Relis seulement cet atelier : Accueil › Actualiser l’aperçu › Actualiser l’aperçu.', ['[data-q="tab:Accueil"]', '[data-q="cmd:refresh"]', '.menu [data-k="one"]']],
        on: { 'q2.refresh': p => { if (p.all) return x.oops('Actualisation générale des sources historiques'); if (K2.shown(x, ANN)) refreshed = true; } } });
      await K2.num(x, 'Après la relecture des douze fichiers.', [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 96 && v.c === 11 ? true : ['', 'Lis la barre d’état.']);
      const s1 = sa(3), sd = part(x);
      await x.pixel('Simule maintenant une dérive de schéma, sur une copie : une référence de m208_10 où Cout_TTC change de nom.');
      const test = () => P().queries.find(q => q.tmp210 === 'test');
      await K2.tmp(x, { src: 'm208_10', flag: 'tmp210', kind: 'test', ops: ['rename'],
        next: t => {
          if (t.name !== TEST) return [`Renomme la copie ${TEST} : touche son nom en haut, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']];
          return K2.cols(K2.T(x, t.name)).includes('Cout_TTC') ? K2.colTodo('Cout_TTC', 'CoutTotal') : true;
        },
        mainErr: 'Fichier original modifié pour le test',
        tries: (p, t) => {
          if (p.kind === 'renameQuery') return p.target === t && p.name === TEST ? true : x.oops('', `Écris exactement ${TEST}.`);
          if (p.kind === 'add' && p.op === 'rename') { const [from, to] = p.merge ? [p.col, p.name] : p.step.pairs[p.step.pairs.length - 1]; return from === 'Cout_TTC' && to === 'CoutTotal' ? true : x.oops('', 'Renomme Cout_TTC en CoutTotal.'); }
        } });
      await x.pixel('Passe cette copie au contrôle de schéma de la préparation annuelle : une requête vide qui exige les huit champs obligatoires.');
      await x.formula(SCHEMA, `Code · ${CTL}`);
      await K2.blank(x, { name: CTL, src: SCHEMA, flag: 'tmp210', kind: 'ctl', cur: TEST, pasteTodo: 'Touche Coller, puis Terminé.' });
      await look(x, CTL);
      await K2.ask(x, `Que montre ${CTL} ?`, [{ t: 'Une erreur explicite : Cout_TTC absent', ok: true }, { t: 'Rien de particulier, je n’ai pas besoin de le regarder', err: 'Contrôle décrit mais jamais exécuté' }]);
      await K2.ask(x, 'Comment réagir à cette dérive ?', [{ t: 'La diagnostiquer avec le fournisseur avant de toucher à la préparation', ok: true }, { t: 'Renommer CoutTotal en Cout_TTC sans rien dire', err: 'Changement de nom réparé sans diagnostic' }, { t: 'Remplacer l’erreur par 0', err: 'Erreur masquée par une valeur zéro' }]);
      const s2 = sd(4), sc = part(x);
      await K2.work(x, { cur: ANN,
        next: () => { const c = P().queries.find(q => q.tmp210 === 'ctl'), t = test(); if (c) return [`Les preuves sont relevées : supprime d’abord ${c.name}.`, ['[data-q="qd"]', K2.qmenu(x, c), '.menu [data-k="del"]', '[data-d="del"]']]; if (t) return [`Puis supprime ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']]; return true; },
        delQuery: p => p.target.tmp210 ? true : false,
        tries: p => { if (p.kind === 'append') return x.oops('Résultat de test conservé dans l’annuel'); } });
      await x.ok('Les mêmes fichiers redonnent les mêmes 96 lignes, et une colonne renommée déclenche une erreur visible au lieu d’un coût vide. Les copies de test sont supprimées.');
      first(7, { 'Actualisation': s1, 'Dérive': s2, 'Rangement': sc(3) }); hintsOf(x, 7);
    }, avance: AV },

    /* 8 — Présenter une décision de publication */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P; timer();
      await x.say('victoria', 'Je ne veux pas seulement savoir ce que vous avez transformé. Dites-moi maintenant ce que nous pouvons utiliser, et avec quelles limites.');
      const sd = part(x);
      const B = K2.sorter({ title: 'Décision par périmètre', intro: 'Ce que chaque résultat permet, en l’état.', btn: 'Vérifier', options: [['ok', 'Réconcilié'], ['res', 'Avec réserves'], ['diag', 'Diagnostic seulement'], ['hist', 'Historique conservé']],
        rows: [['a', 'Maintenance de mai 2026', LIB], ['b', 'Archives 2025', ANN], ['c', 'Atelier M206', A206], ['d', 'Atelier M209', N.e], ['e', 'Rapport du module 1', 'Checkpoint 110']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
      x.app('dec210', B.el);
      const SOL = { a: 'diag', b: 'ok', c: 'res', d: 'res', e: 'hist' };
      x.todo('Décide pour chaque périmètre.');
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        if (Object.keys(SOL).some(k => !values[k])) return x.oops('Absence de décision');
        const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
        if (!bad.length) { B.lock(); return true; }
        if (values.a === 'ok' || values.c === 'ok' || values.d === 'ok') return x.oops('Tout déclaré publiable');
        if (bad.includes('a')) return x.oops('', 'Le registre de mai sert au diagnostic : ses coûts et ses analyses globales ne sont pas validés.');
        if (bad.includes('b')) return x.oops('', 'Les archives 2025 sont réconciliées, dans le périmètre du jeu fourni.');
        if (bad.includes('e')) return x.oops('Checkpoint modifié');
        return x.oops('', 'Les ateliers M206 et M209 sont utilisables, avec des dossiers à revoir.');
      } });
      x.app('pbi');
      await claims(x, 'Victoria t’écoute. Coche les phrases de ta synthèse.', [['Le registre conserve 1 099 candidats : neuf lignes de structure et une copie confirmée ont été retirées', true], ['Le coût total de maintenance de mai est de 420 000 €', 'Total maintenance inventé'], ['Les archives 2025 concordent : 96 lignes, 18 000 € HT, provenance conservée', true], ['L’atelier de fusion garde 8 interventions et 2 200 € HT ; trois dossiers restent ouverts, avec leur cause', true], ['Quelques réserves subsistent, sans plus de détail', 'Réserves cachées dans une note vague'], ['Les tests ont détecté un mois répété, une dérive de schéma et une ligne multipliée', true]]);
      await K2.ask(x, 'Victoria : « Peut-on te remettre le certificat dès maintenant ? »', [{ t: 'Après le contrôle final : chargements, sauvegarde et rapport du module 1', ok: true }, { t: 'Oui, les défis sont faits', err: 'Certificat attribué sans contrôle' }]);
      const s1 = sd(4), sp = part(x);
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M210', cur: LIB,
        work: { loadErr: 'Préparations chargées', overErr: 'Checkpoint modifié', fileErr: '', delErr: '',
          delQuery: p => p.target.tmp210 ? true : false },
        pre: () => {
          const t = tmps(P())[0];
          if (t) { if (!pbi.q2El) return ['Rouvre l’éditeur Power Query pour retirer les vues temporaires.', ['[data-a="cmd:transform"]']]; return [`Les preuves sont relevées : supprime la vue temporaire ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']]; }
          return true;
        }
      });
      const e = EV(); if (e.mode === 'test' && e.t0 && !e.tEnd) { e.tEnd = Date.now(); store.save(); }
      x.app('ctl210', K.lesson('Dossier de validation', 'Huit pièces, trois périmètres séparés', `${K2.facts([['1 099', 'candidats au registre de mai, chaque retrait expliqué'], ['96', 'lignes 2025, 18 000 € HT, 12 contributions'], ['8', 'interventions rapprochées, 2 200 € HT'], [3, 'tests observés : mois répété, dérive, multiplication']])}${K2.card110(P())}`));
      await x.ok('Copie M210 enregistrée. Chaque périmètre a sa décision et ses limites, les tests sont rangés, et le rapport du module 1 est intact.');
      first(8, { 'Décisions': s1, 'Persistance': sp(6) }); hintsOf(x, 8);
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'archives', n: 'Lundi 8 juin, fin d’après-midi. Retour dans les archives. Les dossiers autrefois dispersés sont identifiés ; chaque préparation a un rôle, et les questions ouvertes restent visibles.' },
    { p: 'oscar', t: 'Nous n’avons pas trouvé toutes les réponses. Mais nous savons désormais où sont les problèmes, et comment les traiter.' },
    { p: 'gabriel', t: 'Et nous avons arrêté de confondre un tableau qui s’affiche avec des données validées.' },
    { p: 'victoria', t: 'Les archives sont organisées. Merci. Nous allons maintenant travailler sur la façon dont les services communiquent entre eux.' },
    { card: { k: 'Module 2 · Les archives oubliées', h: '10 missions validées', chips: ['Structurer', 'Diagnostiquer', 'Dédoublonner', 'Contrôler les dates', 'Fractionner', 'Normaliser', 'Ajouter', 'Fusionner', 'Décider'] } },
    { wait: 800 }
  ],
  recompense: { titre: 'Archives maîtrisées !', sous: 'Tu as préparé, contrôlé et défendu les données de maintenance de Wonderland.', badge: 'b210', badgeNom: 'Maître des archives', objet: 'station' },
  bilan() {
    const e = EV(), pts = Object.values(e.first || {}).reduce((a, p) => a + Object.values(p).reduce((s, n) => s + n, 0), 0);
    const hints = Object.values(e.hints || {}).reduce((a, n) => a + n, 0);
    const dur = e.mode === 'test' && e.t0 ? Math.round(((e.tEnd || Date.now()) - e.t0) / 1000) : null;
    const level = pts >= 90 ? 'Excellent' : pts >= 80 ? 'Solide' : pts >= 60 ? 'En progression' : 'À consolider';
    const auto = hints === 0 ? 'Autonome' : hints <= 6 ? 'Aide ponctuelle' : 'Accompagné';
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const rows = (e.first ? Object.entries(e.first) : []).sort((a, b) => a[0] - b[0]).map(([i, p]) => `<tr><td>Défi ${i}</td><td class="r">${Object.values(p).reduce((s, n) => s + n, 0)}/${POINTS[i - 1]}</td></tr>`).join('');
    const skills = ['Structurer des exports désorganisés', 'Diagnostiquer valeurs manquantes et erreurs', 'Traiter un doublon confirmé sans effacer les cas ambigus', 'Contrôler des dates et normaliser des libellés', 'Fractionner et recomposer des informations', 'Consolider des fichiers avec leur provenance', 'Fusionner en contrôlant les correspondances', 'Présenter les limites d’un jeu de données'];
    return h(`<div class="bilan">
      <p class="bl-k">Bilan de l’épreuve · ${e.mode === 'test' ? 'mode test technique' : 'mode apprentissage'}</p>
      <div class="bl-score"><b>${pts}</b><span>/100</span></div>
      <p class="bl-sub">${esc(fr('Score de première tentative. Seuil de réussite : 80. Score de maîtrise : 100/100, les huit défis validés sur preuves.'))}</p>
      <div class="bl-grid">
        <div><small>Niveau initial</small><b>${esc(level)}</b></div>
        <div><small>Autonomie</small><b>${esc(auto)}</b><span>${hints}/24 indices</span></div>
        ${dur != null ? `<div><small>Objectif de 60 minutes</small><b>${dur <= 3600 ? 'Atteint' : 'Dépassé'}</b><span>${Math.max(1, Math.round(dur / 60))} min</span></div>` : ''}
        <div><small>Certificat</small><b>Débloqué</b></div>
      </div>
      <table class="tbl" style="width:100%; margin-top:14px"><tbody>${rows}</tbody></table>
      <div class="cert">
        <p class="ct-k">Power BI Quest · Wonderland Academy</p>
        <h2>Certificat de réussite</h2>
        <p class="ct-s">Ce certificat atteste la validation du parcours</p>
        <h3>Module 2 : Les archives oubliées</h3>
        <p class="ct-d">10 missions immersives · 80 exercices dans Power Query</p>
        <p class="ct-skills">${esc(fr(skills.join(' · ')))}</p>
        <p class="ct-rank">Grade : Data Analyst Junior</p>
        <div class="ct-sig"><span><i>Victoria</i>Direction Wonderland</span><span><i>Pixel</i>Académie Data</span></div>
        <p class="ct-f">${esc(fr(`Certificat pédagogique interne · Module 02 · ${today}`))}</p>
      </div>
      <p class="bl-note">${esc(fr('Ce certificat appartient au parcours du jeu : il ne constitue pas une certification Microsoft. Le certificat du module 1 reste conservé.'))}</p>
      <div class="bl-path"><p class="bl-k">Mon parcours de formation</p>
        <div class="bl-grid"><div><small>Missions</small><b>20/20</b></div><div><small>Exercices validés</small><b>160</b></div><div><small>Expérience</small><b>${esc(fr(String(S.xp).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' XP'))}</b></div><div><small>Fiches de révision</small><b>160</b></div></div>
        <ul class="skills">${['Explorer un fichier brut', 'Retrouver les en-têtes', 'Valeurs manquantes', 'Doublons et collisions', 'Dates et types', 'Fractionner, fusionner les colonnes', 'Normaliser les libellés', 'Ajouter des fichiers mensuels', 'Fusionner des requêtes', 'Préparation en autonomie'].map(s => `<li><span>${esc(fr(s))}</span><b>Acquis</b></li>`).join('')}</ul>
      </div>
    </div>`);
  },
  fiches: [
    ['Sources et dépendances', 'Que doit permettre une chaîne de préparation ?', 'Retrouver sans ambiguïté les sources, les transformations et les résultats de chaque périmètre.'],
    ['Conservation des lignes', 'Que contient une réconciliation de volume ?', 'Chaque écart, sa nature et sa justification : des lignes de structure ne sont pas des interventions retirées.'],
    ['Anomalies ouvertes', 'Que distingue un registre de qualité ?', 'Les constats, leurs explications possibles et les décisions appuyées sur des preuves.'],
    ['Transformations textuelles', 'À quoi juge-t-on une transformation de texte ?', 'Elle préserve le contenu, respecte les correspondances autorisées et signale ce qu’elle ne reconnaît pas.'],
    ['Consolidation', 'Un contrôle de consolidation doit résister à quelle erreur ?', 'À celle qui garde le bon total de lignes : un mois oublié compensé par un mois répété.'],
    ['Fusion contrôlée', 'Qu’est-ce qu’une fusion fiable ?', 'Elle compte les correspondances avant de développer et garde les événements non résolus, avec leur cause.'],
    ['Reproductibilité', 'Qu’est-ce qu’une préparation reproductible ?', 'Elle retrouve ses résultats sur les mêmes sources, et signale tout changement qui casse son contrat.'],
    ['Décision de publication', 'Que précise une décision de publication ?', 'Le périmètre, les contrôles réalisés, les limites et les usages encore interdits par l’état des données.']
  ],
  suiteTitre: 'Lundi, fin d’après-midi',
  suite: [
    { bg: 'parc', n: 'La caméra traverse le parc et s’arrête devant un nouveau bâtiment. Sur sa façade : le centre névralgique.' },
    { card: { k: 'Centre névralgique', h: 'Billetterie · Entrées · Attractions', p: 'Trois tables, aucun lien entre elles' } },
    { p: 'pixel', t: 'Jusqu’ici, nous avons préparé les données en amont. Dans le prochain module, nous apprendrons à construire un modèle qui organise leurs relations.' },
    { p: 'victoria', t: 'Bienvenue dans le centre névralgique de Wonderland.' }
  ],
  finModule: { img: 'o-station.webp', titre: 'Module 2 terminé', texte: 'Les archives sont organisées. Le module 3 t’attend : construire le modèle qui relie les services de Wonderland.', liste: [['Module 3 · bientôt', 'Le centre névralgique'], ['Mission 301', 'Les services déconnectés']] },
  accroche: 'Huit défis en autonomie : retrouver chaque source, expliquer chaque ligne, prouver que les contrôles détectent, et décider ce qui est utilisable.',
  fin(P) { EX8(P); }
};
window.PBQ.mission(def);
})();

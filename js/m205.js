/* Mission 205 — Des dates impossibles (lecture explicite, échecs capturés, période et chronologie) */
(function () {
'use strict';
const { esc, fr, $, $$, h } = window.PBQ;
const PQE = window.PQE;
const DBL = 'prep_Maintenance_Doublons', NULLS = 'prep_Maintenance_Nulls', NAME = 'prep_Maintenance_Dates', FN = 'fn_LireDate';

/* ───────── État canonique ───────── */
const SET = n => P => {
  let q = P.queries.find(x => x.id === 'q_dates');
  if (!q) { q = K2.C.dates(); P.queries.push(q); }
  q.steps = K2.C.datesSteps().slice(0, n);
  if (n > 1 && !P.queries.some(x => x.id === 'q_fn')) P.queries.push(K2.C.fn());
};
const EX1 = SET(1), EX3 = SET(9), EX6 = SET(10), EX7 = SET(11);
const tmps = P => P.queries.filter(q => q.tmp205);
function EX2(P) {
  if (tmps(P).some(q => q.kind205 === 'fmt')) return;
  P.queries.push({ id: 'q_t205fmt', name: NAME + ' (2)', m2: true, load: false, refresh: true, group: 'Maintenance', tmp205: true, kind205: 'fmt',
    steps: [K2.st('Source', 'ref', { of: 'q_dates' }), K2.st('Lignes filtrées', 'filter', { cond: { kind: 'values', col: 'ID_Intervention', exclude: false, values: ['M0055', 'M0550', 'M0650'] } })] });
}
/* Registre des dossiers temporels (complété au fil de la mission) */
const DOSSIERS = [
  { id: 'M0040', src: 46, brut: 'Demande 31/02/2026', cause: 'Date de demande impossible', preuve: 'Date de demande sur la pièce d’origine' },
  { id: 'M0055', src: 61, brut: 'Intervention 2026-05-14 · demande 28/05/2026', cause: 'Intervention avant demande', preuve: 'Bon d’intervention et date de saisie' },
  { id: 'M0120', src: 126, brut: 'Intervention 01/05/2026 · demande 09/05/2026', cause: 'Intervention avant demande', preuve: 'Bon d’intervention et date de saisie' },
  { id: 'M0550', src: 557, brut: 'Intervention 12/31/2026', cause: 'Format d’intervention non accepté', preuve: 'Date d’intervention confirmée' },
  { id: 'M0650', src: 657, brut: 'Demande 03/04/2026', cause: 'Date de demande hors période', preuve: 'Mois et convention du poste source' },
  { id: 'M1005', src: 1012, brut: 'Demande 29/02/2026', cause: 'Date de demande impossible', preuve: 'Pièce d’origine, année à vérifier' }];
const putReg = (P, ids) => {
  const m = new Map((P.regDates || []).map(r => [r.id, r]));
  DOSSIERS.filter(d => ids.includes(d.id)).forEach(d => m.set(d.id, Object.assign({ resp: 'Oscar', statut: 'Ouvert' }, d)));
  P.regDates = [...m.values()].sort((a, b) => a.id.localeCompare(b.id));
};
function EX4(P) { putReg(P, ['M0040', 'M1005']); }
function EX7r(P) { putReg(P, DOSSIERS.map(d => d.id)); }
function EX8(P) { P.queries = P.queries.filter(q => !q.tmp205); P.name = 'Wonderland_Pilotage_M205'; P.saved = true; P.dirty = false; }

const norm = s => String(s || '').replace(/\s+/g, '');
const regCard = rows => `<table class="tbl wrap" style="width:100%"><thead><tr><th><span class="thc">Dossier</span></th><th><span class="thc">Constat</span></th><th><span class="thc">Pièce attendue</span></th></tr></thead><tbody>${rows.map(d => `<tr><td><b>${esc(d.id)}</b><br><small>Ligne ${d.src}</small></td><td>${esc(fr(d.cause))}<br><small>${esc(fr(d.brut))}</small></td><td>${esc(fr(d.preuve))}</td></tr>`).join('')}</tbody></table>`;

/* Profil d'une colonne sur l'ensemble des données */
const seeProfile = (x, col, todo) => K2.work(x, {
  cur: NAME,
  next: () => {
    const s = x.pbi.q2;
    if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
    if (s.scope !== 'all') return ['Barre d’état : profilage sur l’ensemble des données.', ['[data-q="scope"]', '.menu [data-k="all"]']];
    if (!(s.prof && s.sel.length === 1 && s.sel[0] === col)) return [todo || `Affiche le profil de ${col} : sélectionne la colonne, puis Affichage › Profil de colonne.`, s.prof ? [`[data-q="hd:${col}"]`] : [`[data-q="hd:${col}"]`, '[data-q="tab:Affichage"]', '[data-q="cmd:prof"]']];
    return true;
  },
  on: { 'q2.scope': p => { if (p.scope === 'top') return x.oops('', 'Garde l’ensemble des données : les 1 000 premières lignes ne couvrent pas tout l’export.'); } }
});

/* Fonction appelée sur une colonne de date, développée, renommée et typée */
async function lireColonne(x, src) {
  const DIAG = 'Diagnostic_' + src, RAW = 'Date_' + src, PAR = `Date_${src}_Parsee`, CTL = `Controle_Date_${src}`;
  const T = () => K2.T(x, NAME), cols = () => K2.cols(T());
  const ty = n => { const t = T(); const c = t && t.cols.find(z => z.n === n); return c ? c.t : null; };
  const dateCol = () => cols().find(c => c === 'Date' || c === DIAG + '.Date');
  const ctlCol = () => cols().find(c => c === 'Controle' || c === DIAG + '.Controle');
  await K2.work(x, {
    cur: NAME, edit: [NAME], ops: ['custom', 'expand', 'rename'], offOpMsg: 'Cette transformation n’est pas demandée : appelle la fonction, développe, renomme, puis type.',
    next: () => {
      if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
      const c = cols();
      if (!c.includes(PAR) && !c.includes(DIAG) && !dateCol()) return x.pbi.dlgKind === 'q2invoke' ? [`Nom : ${DIAG}, fonction ${FN}, Valeur : colonne ${RAW}, puis OK.`, ['[data-x="n"]', '[data-p="0"]', '[data-d="ok"]']] : ['Ajouter une colonne › Appeler une fonction personnalisée.', ['[data-q="tab:Ajouter une colonne"]', '[data-q="cmd:invoke"]']];
      if (c.includes(DIAG)) return x.pbi.dlgKind === 'q2expand' ? ['Garde Date et Controle, décoche le préfixe, puis OK.', ['[data-x="prefix"]', '[data-d="ok"]']] : [`Touche la double flèche de l’en-tête ${DIAG}.`, [`[data-q="exp:${DIAG}"]`]];
      if (dateCol()) return K2.colTodo(dateCol(), PAR);
      if (ctlCol()) return K2.colTodo(ctlCol(), CTL);
      if (ty(PAR) !== 'date') return [`Type de ${PAR} : touche l’icône de type de son en-tête, puis Date.`, [`[data-q="ty:${PAR}"]`, '.menu [data-k="date"]']];
      if (ty(CTL) !== 'text') return [`Type de ${CTL} : touche l’icône de type de son en-tête, puis Texte.`, [`[data-q="ty:${CTL}"]`, '.menu [data-k="text"]']];
      return true;
    },
    tries: p => {
      const c = cols();
      if (p.kind === 'invoke' && p.none) return x.oops('', `Crée d’abord la fonction ${FN}.`);
      if (p.kind === 'renameCol' && p.dup) return x.oops('', 'Ce nom existe déjà dans la requête.');
      if (p.kind === 'type') {
        if (p.loc) return x.oops('', 'Pas de paramètres régionaux ici : la fonction a déjà lu la date selon le contrat.');
        for (const col of p.cols) {
          if (col === RAW || /^Date_(Demande|Intervention)$/.test(col)) return x.oops('Valeur brute supprimée');
          if (col === PAR && p.type !== 'date') return x.oops(p.type === 'text' ? 'Résultat converti stocké en texte' : '', `${PAR} porte le type Date.`);
          if (col === CTL && p.type !== 'text') return x.oops('', `${CTL} est un texte d’explication.`);
          if (col !== PAR && col !== CTL) return x.oops('', `Change seulement les types de ${PAR} et ${CTL}.`);
        }
        return true;
      }
      if (p.kind !== 'add') return;
      const s = p.step;
      if (p.op === 'custom') {
        if (!s.invoke) return x.oops('', 'Passe par Appeler une fonction personnalisée : la règle est déjà écrite dans la fonction.');
        if (c.includes(DIAG) || dateCol() || c.includes(PAR)) return x.oops('', `${DIAG} est déjà là : poursuis avec elle.`);
        if (!s.src.includes(`[${RAW}]`)) return x.oops('', `Pour le paramètre Valeur, choisis la colonne ${RAW}.`);
        if (!s.src.startsWith(FN)) return x.oops('', `Choisis la fonction ${FN}.`);
        if (s.col !== DIAG) return x.oops('', `Nomme la colonne ${DIAG}.`);
        return true;
      }
      if (p.op === 'expand') {
        if (s.col !== DIAG) return x.oops('', `Développe ${DIAG}.`);
        if (!(s.fields.includes('Date') && s.fields.includes('Controle'))) return x.oops('Valeur brute supprimée', 'Garde les deux champs : la date lue et son contrôle.');
        return true;
      }
      if (p.op === 'rename') {
        const [from, to] = p.merge ? [p.col, p.name] : s.pairs[s.pairs.length - 1];
        if (from === RAW || /^Date_(Demande|Intervention)$/.test(from)) return x.oops('Valeur brute supprimée');
        if (from === dateCol()) return to === PAR ? true : x.oops('', `Écris exactement ${PAR}.`);
        if (from === ctlCol()) return to === CTL ? true : x.oops('', `Écris exactement ${CTL}.`);
        return x.oops('', 'Garde le nom de cette colonne.');
      }
      if (p.op === 'replaceErrors' || p.op === 'replace') return x.oops('Remplacement silencieux des erreurs par null');
      if (p.op === 'removeErrors' || p.op === 'filter') return x.oops('Suppression des lignes en erreur');
      if (p.op === 'removeCols' || p.op === 'selectCols') return x.oops('Valeur brute supprimée');
    }
  });
}

const def = {
  id: 205,
  objectifs: ['Lire les dates selon un contrat explicite : français ou ISO', 'Capturer les échecs de conversion avec un état lisible', 'Contrôler la période de mai et l’ordre des événements', 'Lister les dossiers à investiguer sans rien corriger par supposition'],
  intro: [
    { bg: 'calendrier', n: 'Dimanche 7 juin, 15 h 45. Bureau Data. La caméra s’approche de l’écran : une cellule est sélectionnée.' },
    { card: { k: 'Date_Demande', h: '31/02/2026' } },
    { p: 'gabriel', t: 'Je peux comprendre un montant mal saisi. Mais une intervention au 31 février…' },
    { p: 'oscar', t: 'Le fichier a été repris manuellement. Il peut y avoir une erreur de jour, de mois ou de transcription.' },
    { clear: 1, card: { k: 'Trois corrections imaginables', h: '28 février · 3 mars · 31 mars', p: 'Puis les trois propositions disparaissent.' } },
    { p: 'pixel', t: 'Plusieurs corrections sont imaginables. Aucune n’est démontrée. Nous devons signaler l’erreur avant de demander la date correcte.' },
    { clear: 1, card: { k: 'Une autre cellule', h: '12/31/2026' } },
    { p: 'gabriel', t: 'Celle-ci ne fonctionne pas non plus. Il n’existe pas de trente et unième mois.' },
    { p: 'pixel', t: 'Selon une convention américaine, elle pourrait désigner le 31 décembre. Mais notre export couvre mai 2026 : trouver une façon de la lire ne prouve pas qu’elle appartient au bon périmètre.' },
    { clear: 1, card: { k: 'Une troisième intervention', h: 'Demande 28/05/2026 · Intervention 2026-05-14' } },
    { p: 'oscar', t: 'Cette date est écrite autrement, mais elle existe.' },
    { p: 'pixel', t: 'Oui. Pourtant, elle place l’intervention quatorze jours avant la demande. Le format et la chronologie sont deux contrôles différents.' },
    { clear: 1, p: 'victoria', t: 'Je veux des dates exploitables, mais aussi des explications sur ce qui reste incertain.' },
    { btn: 'Quatre questions pour une date' }
  ],
  leconTitre: 'Quatre questions pour une date',
  async lecon(x) {
    const DOORS = [['pres', 'Présence'], ['lect', 'Lecture'], ['peri', 'Période'], ['chrono', 'Chronologie']];
    const card = K.lesson('Leçon', 'Quatre portes pour une date', `
      <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>Présence</b><small>Une valeur est-elle renseignée ?</small></div><div class="flow-box on"><b>Lecture</b><small>Format accepté, jour qui existe ?</small></div><div class="flow-box on"><b>Période</b><small>La date tombe-t-elle en mai 2026 ?</small></div><div class="flow-box on"><b>Chronologie</b><small>L’ordre des événements tient-il ?</small></div></div>
      <div data-sec="2" style="display:none; margin-top:14px"></div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    await x.pixel('Quatre portes. Passer une porte ne garantit pas de passer les suivantes.');
    await x.say('gabriel', 'Une date peut donc être correctement convertie, tout en restant inutilisable pour notre analyse de mai.');
    await x.pixel('Exactement. Et une date techniquement invalide ne doit pas disparaître de notre registre. À toi : à quelle porte chaque cas s’arrête-t-il ?');
    const B = K2.sorter({ key: () => SOL, bare: true, title: 'Où le contrôle échoue-t-il ?', btn: 'Vérifier', options: DOORS,
      rows: [['a', 'Date_Demande vide', 'null'], ['b', '31/02/2026', 'Contrat : jj/MM/aaaa'], ['c', '03/04/2026', 'Lue selon le contrat : 3 avril 2026'], ['d', 'Intervention 14/05, demande 28/05', 'Deux dates lisibles, en mai']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
    const sec = $('[data-sec="2"]', card); sec.appendChild(B.el); sec.style.display = '';
    requestAnimationFrame(() => sc.scrollTo({ top: Math.max(0, sec.offsetTop - 14), behavior: 'smooth' }));
    const SOL = { a: 'pres', b: 'lect', c: 'peri', d: 'chrono' };
    x.todo('Choisis une porte pour chacun des quatre cas.');
    await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
      if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Choisis une porte pour les quatre cas.');
      const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
      if (!bad.length) { B.lock(); return true; }
      if (bad.includes('c')) return x.oops('', '03/04/2026 se lit très bien selon le contrat : c’est le mois d’avril qui pose problème.');
      if (bad.includes('d')) return x.oops('', 'Les deux dates existent et tombent en mai : regarde leur ordre.');
      if (bad.includes('b')) return x.oops('', 'Février 2026 n’a pas de 31 : la lecture échoue.');
      return x.oops('', 'Sans valeur, aucune autre porte ne peut s’ouvrir.');
    } });
    await x.say('oscar', 'Dans le registre de la mission 201, M0055 était rangé parmi les formats mélangés.');
    await x.ok('Une fois sa date ISO lue, M0055 révèle autre chose : une intervention le 14 mai pour une demande du 28 mai. Normaliser le format ne suffira pas à résoudre cette ligne.');
  },
  exs: [
    /* 1 — Préparer une zone de conversion */
    { async run(x) {
      const pbi = x.pbi;
      x.app('pbi'); pbi.render();
      await x.say('victoria', 'Je veux pouvoir retrouver le texte reçu, même lorsqu’une conversion échoue.');
      await x.pixel('Nouvelle branche : une référence de la préparation de la mission 204, consacrée aux dates.');
      await K2.branch(x, { src: DBL, name: NAME, deps: false, errs: {
        wrongSrc: q => q.name === NULLS ? 'Référence à la préparation Nulls' : q.name === 'prep_Maintenance_Brut' ? 'Conversion dans le brut' : '',
        imp: 'Volume revenu à 1100', edit: 'Conversion dans le brut', srcEdit: 'Dates sources écrasées', name: 'Nom de requête ambigu', load: 'Chargement activé',
        legacy: 'Conversion des tables historiques', legacyName: 'Conversion des tables historiques' } });
      K2.open(x, NAME);
      await x.pixel('Vérifions le volume exact. Le profil d’une colonne compte toutes les lignes, à condition de profiler l’ensemble des données.');
      await seeProfile(x, 'Date_Demande', 'Affiche le profil de Date_Demande : sélectionne la colonne, puis Affichage › Profil de colonne.');
      await K2.num(x, 'Lis le profil et la barre d’état.', [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 1099 && v.c === 19 ? true : v.l === 1100 ? ['Volume revenu à 1100'] : ['', 'Le nombre de lignes est la ligne Nombre du profil ; les colonnes sont dans la barre d’état.']);
      await x.pixel('Regarde l’icône de type de Date_Demande : ABC123. Les valeurs sont encore les textes reçus, rien n’a été converti.');
      await K2.ask(x, 'Où ranger les dates converties ?', [{ t: 'Dans de nouvelles colonnes, à côté de Date_Demande et Date_Intervention', ok: true }, { t: 'En changeant directement le type des deux colonnes', err: 'Dates sources écrasées' }, { t: 'Après avoir retiré les dates difficiles', err: 'Suppression des dates difficiles' }]);
      await x.ok('1 099 lignes, 19 colonnes : l’état exact de la mission 204. Les textes reçus restent intacts ; les conversions viendront à côté.');
    }, avance: EX1 },

    /* 2 — Reconnaître les formats sans deviner */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, D = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.pixel('Trois écritures relevées dans le fichier : 14/05/2026, 2026-05-14 et 12/31/2026.');
      await x.say('oscar', 'Les deux premières désignent le même jour. La troisième utilise peut-être une autre convention.');
      await x.pixel('Nous acceptons les formats prévus par notre contrat et nous isolons les autres. Examinons M0055, M0550 et M0650 dans une vue temporaire.');
      const T1 = () => tmps(P()).find(q => q.kind205 === 'fmt'), IDS = ['M0055', 'M0550', 'M0650'];
      await K2.work(x, {
        cur: NAME, edit: [], editNew: true, ops: ['filter'],
        next: () => {
          const t = T1();
          if (!t) return [`Volet Requêtes : ⋯ à côté de ${NAME}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, D()), '.menu [data-k="ref"]']];
          if (t.load !== false) return ['Désactive le chargement de cette vue temporaire.', ['.q2-qname', '.menu [data-k="load"]']];
          if (!K2.shown(x, t.name)) return K2.showTodo(x, t.name);
          if (!t.steps.some(s => s.op === 'filter')) return ['Filtre ID_Intervention : garde seulement M0055, M0550 et M0650.', ['[data-q="flt:ID_Intervention"]', '[data-all]', '.q2-search', '[data-d="ok"]']];
          return true;
        },
        tries: p => {
          const t = T1();
          if (p.kind === 'newQuery') { if (t) return x.oops('', 'La vue temporaire existe déjà.'); if (p.how !== 'ref' || p.src !== D()) return x.oops('', `Crée une référence de ${NAME}.`); p.query.tmp205 = true; p.query.kind205 = 'fmt'; return true; }
          if (p.kind === 'load') { if (p.on) return x.oops('', 'Cette vue temporaire reste non chargée.'); return p.target === t ? true : x.oops('', 'Règle seulement la vue temporaire.'); }
          if (p.kind === 'renameQuery') return p.target === t ? true : x.oops('', 'Garde le nom de cette requête.');
          if (p.kind === 'type') return x.oops(p.loc === 'en-US' ? 'Toutes les dates lues en américain' : p.loc ? 'Plusieurs cultures essayées sans règle' : 'Culture de l’ordinateur utilisée implicitement');
          if (p.kind === 'add' && p.q !== t) return x.oops('', 'La préparation principale ne change pas : examine dans la vue temporaire.');
          if (p.kind === 'add' && p.op === 'filter') {
            const R = K2.simulate(x, t, p.step), ids = R.table ? [...new Set(R.table.rows.map(r => r.ID_Intervention))].sort() : [];
            return ids.join() === IDS.join() ? true : x.oops('', `Garde exactement ${IDS.join(', ')}.`);
          }
        }
      });
      await x.pixel('Trois lignes. Lis leurs dates, puis applique le contrat : jj/MM/aaaa se lit en français, aaaa-MM-jj en ISO, tout le reste est signalé.');
      const B = K2.sorter({ key: () => SOL, title: 'Lecture selon le contrat', intro: 'Valeurs relevées dans la vue temporaire.', btn: 'Vérifier', options: [['fr', 'Français'], ['iso', 'ISO'], ['non', 'Non accepté']],
        rows: [['a', '28/05/2026', 'M0055 · Date_Demande'], ['b', '2026-05-14', 'M0055 · Date_Intervention'], ['c', '12/31/2026', 'M0550 · Date_Intervention'], ['d', '03/04/2026', 'M0650 · Date_Demande']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
      x.app('fmt205', B.el);
      const SOL = { a: 'fr', b: 'iso', c: 'non', d: 'fr' };
      x.todo('Classe les quatre valeurs.');
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Classe les quatre valeurs.');
        const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
        if (!bad.length) { B.lock(); return true; }
        if (bad.includes('b')) return x.oops(values.b === 'non' ? 'ISO rejeté comme date impossible' : '', 'L’année en premier, des tirets : c’est la forme ISO aaaa-MM-jj.');
        if (bad.includes('c')) return x.oops(values.c === 'fr' ? '' : 'Format américain accepté sans justification', values.c === 'fr' ? 'En lecture française, 31 serait le mois : la valeur ne suit pas le contrat.' : '');
        if (bad.includes('d')) return x.oops(values.d === 'non' ? 'Format et période confondus' : '', '03/04/2026 a exactement la forme jj/MM/aaaa : le contrat la lit en français.');
        return x.oops('', '28/05/2026 suit la forme jj/MM/aaaa.');
      } });
      x.app('pbi');
      await K2.ask(x, 'Selon le contrat, que désigne 03/04/2026 pour M0650 ?', [{ t: 'Le 3 avril 2026', ok: true }, { t: 'Le 4 mars 2026', err: 'M0650 déclaré certain au 4 mars' }, { t: 'Le 3 mai 2026, puisque l’export couvre mai', err: 'Correction de l’année pour entrer dans la période', msg: 'Ne fabrique pas une date pour satisfaire le périmètre.' }]);
      await K2.ask(x, 'Et 12/31/2026 pour M0550 ?', [{ t: 'Un format non accepté, à faire confirmer', ok: true }, { t: 'Le 31 décembre : lisons tout le fichier en américain', err: 'Toutes les dates lues en américain' }, { t: 'Essayer en-US pour cette ligne, puisque ça marche', err: 'Plusieurs cultures essayées sans règle' }]);
      await x.ok('Le contrat décide : 03/04/2026 est le 3 avril, même si la période posera problème. 12/31/2026 reste une valeur à confirmer, sans conversion de complaisance.');
    }, avance: EX2 },

    /* 3 — Tester les conversions sans perdre les erreurs */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      const T1 = () => tmps(P()).find(q => q.kind205 === 'fmt');
      if (!T1()) EX2(P());
      K2.open(x, T1().name);
      await x.say('gabriel', 'Et si on convertissait simplement ces colonnes en Date ? Essayons dans la vue temporaire.');
      let seen = false;
      const errRow = () => { const T = K2.T(x, T1().name); return T ? T.rows.findIndex(r => r.Date_Intervention instanceof PQE.MErr) : -1; };
      await K2.work(x, {
        cur: () => T1().name, edit: [T1().name],
        next: () => {
          const t = T1();
          if (!K2.shown(x, t.name)) return K2.showTodo(x, t.name);
          if (!t.steps.some(s => s.op === 'type' && s.changes.some(c => c[0] === 'Date_Intervention' && c[1] === 'date'))) return ['Type de Date_Intervention : touche l’icône ABC123 de son en-tête, puis Date.', ['[data-q="ty:Date_Intervention"]', '.menu [data-k="date"]']];
          if (!seen) { const r = errRow(); return ['Une cellule affiche Error : touche-la pour lire le message.', r >= 0 ? [`[data-q="cell:${r}|Date_Intervention"]`] : null]; }
          return true;
        },
        tries: p => {
          if (p.kind === 'type') { if (p.loc) return x.oops('', 'Garde un essai simple, sans paramètres régionaux.'); return p.cols.every(c => /^Date_(Demande|Intervention)$/.test(c)) && p.type === 'date' ? true : x.oops('', 'Convertis Date_Intervention en Date.'); }
          if (p.kind === 'add') return x.oops(p.op === 'removeErrors' ? 'Suppression des lignes en erreur' : p.op === 'replaceErrors' ? 'Remplacement silencieux des erreurs par null' : '', 'Observe simplement le résultat de la conversion.');
        },
        on: { 'q2.cell': p => { if (p.v instanceof PQE.MErr) seen = true; } }
      });
      await K2.ask(x, 'Cette erreur bloque-t-elle la préparation ?', [{ t: 'Non : seule la cellule est en erreur, mais sa cause et le texte reçu disparaissent', ok: true }, { t: 'Oui : il faut supprimer la ligne', err: 'Suppression des lignes en erreur' }, { t: 'Il suffit de remplacer l’erreur par null', err: 'Remplacement silencieux des erreurs par null' }]);
      await x.pixel('La bonne approche : tenter la conversion, garder le texte reçu et noter le résultat de la tentative. En M, c’est try.');
      await x.code('try Date.FromText(\n    [Date_Demande],\n    [Format = "dd/MM/yyyy", Culture = "fr-FR"]\n)', 'Une tentative contrôlée');
      await x.pixel('try renvoie un enregistrement, une petite fiche à champs nommés : HasError dit si la tentative a échoué, Value contient la date sinon. Rien ne plante, et l’échec reste visible.');
      await x.pixel('fn_LireDate applique toute la règle du contrat : français ou ISO, tentative contrôlée, puis un état de lecture. On l’écrit une fois, on l’appelle pour chaque colonne.');
      await x.formula(K2.F.lireDate, 'Fonction · fn_LireDate', 'Copier la fonction');
      const FQ = () => P().queries.find(q => q.m2 && q.blank && (q.fn205 || q.id === 'q_fn'));
      await K2.work(x, {
        cur: NAME, edit: [], editNew: true,
        next: () => {
          const f = FQ();
          if (!f) return ['Crée une requête vide : Accueil › Nouvelle source › Requête vide.', ['[data-q="tab:Accueil"]', '[data-q="cmd:newsource"]', '.menu [data-k="blank"]']];
          if (!(pbi.engine().value(f) instanceof PQE.MFn)) {
            if (pbi.dlgKind === 'q2adv') return ['Touche Coller, puis Terminé.', ['[data-x="paste"]', '[data-d="ok"]']];
            if (!K2.shown(x, f.name)) return K2.showTodo(x, f.name);
            return ['Ouvre l’éditeur avancé de la requête vide : Accueil › Éditeur avancé.', ['[data-q="tab:Accueil"]', '[data-q="cmd:adv"]']];
          }
          if (f.name !== FN) return [`Renomme la requête ${FN} : touche son nom en haut, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']];
          return true;
        },
        tries: p => {
          const f = FQ();
          if (p.kind === 'newQuery') { if (f) return x.oops('', 'La requête vide existe déjà : poursuis avec elle.'); if (p.how !== 'blank') return x.oops('', 'Crée une requête vide : la fonction s’y colle entière.'); p.query.fn205 = true; return true; }
          if (p.kind === 'code') {
            if (p.target !== f) return x.oops('', 'Colle la fonction dans la requête vide.');
            if (p.syntax === false) return x.oops('', 'La formule contient une erreur : touche Effacer, puis Coller.');
            return norm(p.src) === norm(K2.F.lireDate) ? true : x.oops('', 'Touche Effacer, puis Coller : la fonction doit être reprise telle quelle.');
          }
          if (p.kind === 'renameQuery') { if (p.target !== f) return x.oops('', 'Garde le nom de cette requête.'); return p.name === FN ? true : x.oops('', `Écris exactement ${FN}.`); }
          if (p.kind === 'delQuery' && p.target === f) return x.oops('', 'Garde cette requête : elle accueille la fonction.');
        }
      });
      await x.ok('fn_LireDate est une fonction : elle ne se charge pas, elle s’appelle depuis une autre requête.');
      await x.pixel('Appelons-la sur Date_Demande. Chaque ligne recevra un enregistrement à deux champs, Date et Controle, que tu développeras en deux colonnes.');
      await lireColonne(x, 'Demande');
      await x.pixel('Même méthode pour Date_Intervention.');
      await lireColonne(x, 'Intervention');
      await seeProfile(x, 'Controle_Date_Demande');
      await K2.num(x, 'Combien de demandes sont classées Date invalide ?', [{ id: 'n', label: 'Date invalide' }], v => v.n === 2 ? true : ['', 'Le profil liste chaque état avec son nombre de lignes : lis la ligne Date invalide.']);
      await K2.ask(x, 'Que signifie le null de Date_Demande_Parsee pour ces deux demandes ?', [{ t: 'Une conversion non disponible, expliquée par Controle_Date_Demande', ok: true }, { t: 'Aucune demande ce jour-là', err: 'Null technique assimilé à coût ou événement nul' }, { t: 'Une date à remplacer par la plus proche', err: 'Date impossible déplacée automatiquement' }]);
      await x.ok('Quatre colonnes ajoutées, 23 en tout : deux dates converties, deux contrôles. Deux dates invalides, une ISO lue, un format non accepté — et aucun texte reçu modifié.');
    }, avance: EX3 },

    /* 4 — Examiner les jours impossibles */
    { async run(x) {
      const pbi = x.pbi, Q = () => K2.q(x, NAME);
      const fi = () => Q().steps.findIndex(s => s.op === 'filter');
      K2.open(x, NAME);
      await x.say('oscar', 'Pour M0040, il faudra retrouver la demande originale. Pour M1005, la saisie indique un 29 février en 2026.');
      await x.pixel('Cette année ne possède pas de 29 février. Nous savons que la date est impossible, mais pas quelle date était voulue.');
      await x.pixel('Retrouve-les avec un filtre sur Controle_Date_Demande. Ce filtre sert de loupe : tu le retireras ensuite.');
      await K2.work(x, {
        cur: NAME, edit: [NAME], ops: ['filter'],
        next: () => {
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (fi() < 0) return ['Filtre Controle_Date_Demande : garde seulement Date invalide.', ['[data-q="flt:Controle_Date_Demande"]', '[data-all]', '.q2-search', '[data-d="ok"]']];
          return true;
        },
        tries: p => {
          if (p.kind !== 'add' || p.op !== 'filter') return;
          const R = K2.simulate(x, Q(), p.step), ids = R.table ? R.table.rows.map(r => r.ID_Intervention).sort().join() : '';
          if (ids === 'M0040,M1005') return true;
          if (R.table && R.table.rows.length > 1000) return x.oops('Ligne supprimée', 'Ce filtre retire les dossiers au lieu de les isoler : garde seulement Date invalide.');
          return x.oops('', 'Garde seulement les lignes Date invalide.');
        }
      });
      await K2.num(x, 'Relève la position source de chaque dossier.', [{ id: 'a', label: 'Ligne_Source · M0040' }, { id: 'b', label: 'Ligne_Source · M1005' }], v => v.a === 46 && v.b === 1012 ? true : v.a === 1012 ? ['', 'Associe chaque identifiant à sa propre ligne.'] : ['', 'Lis la colonne Ligne_Source de chaque ligne filtrée.']);
      await K2.ask(x, 'Quelle anomalie est certaine pour ces deux dates ?', [{ t: 'Des jours inexistants : le 31 février, et un 29 février en 2026', ok: true }, { t: 'Une simple question de format', err: 'Anomalie classée simple question de format' }]);
      await K2.ask(x, 'Que faire pour 31/02/2026 ?', [{ t: 'Demander la date de demande sur la pièce d’origine', ok: true }, { t: 'La remplacer par le 28 février', err: '31 février remplacé par 28 février' }, { t: 'La reporter au 3 mars', err: '31 février remplacé par 3 mars' }, { t: 'Reprendre la date d’intervention', err: 'Date d’intervention copiée dans Date_Demande' }]);
      await x.pixel('La loupe a servi. Retire le filtre : la préparation doit garder ses 1 099 lignes.');
      await K2.work(x, {
        cur: NAME, edit: [NAME],
        next: () => {
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          const i = fi();
          if (i >= 0) return ['Supprime l’étape de filtre : Étapes appliquées, puis la croix à gauche de l’étape.', ['[data-q="steps"]', `[data-q="stx:${i}"]`, '[data-d="del"]']];
          return true;
        },
        tries: p => {
          if (p.kind === 'del' || p.kind === 'delEnd') return p.steps.every(s => s.op === 'filter') ? true : x.oops('', 'Supprime seulement l’étape de filtre.');
          if (p.kind === 'add') return x.oops(p.op === 'filter' ? 'Ligne supprimée' : '', 'Retire le filtre, sans rien ajouter.');
        }
      });
      EX4(pbi.P);
      x.app('reg205', K.lesson('Registre d’investigation', 'Deux jours inexistants', `${regCard(pbi.P.regDates.filter(d => ['M0040', 'M1005'].includes(d.id)))}<p class="lc-note">${esc(fr('Responsable de confirmation : Oscar. Aucune confirmation n’est encore fournie.'))}</p>`));
      await x.pixel('Ils entrent au registre : l’erreur est identifiée, la correction reste à obtenir.');
      x.app('pbi');
      await x.ok('Deux dates impossibles, documentées avec leur ligne source. Aucune n’est corrigée par supposition, et la préparation garde ses 1 099 lignes.');
    }, avance: EX4 },

    /* 5 — Contrôler le périmètre de mai */
    { async run(x) {
      K2.open(x, NAME);
      await x.say('victoria', 'Le 3 avril existe. Pourquoi cette ligne pose-t-elle encore problème ?');
      await x.pixel('Notre fichier est annoncé comme un export de mai. La valeur est techniquement valide, mais elle sort de la période attendue.');
      await K2.ask(x, 'Quelles bornes appliquer ?', [{ t: 'Du 1er au 31 mai 2026', ok: true }, { t: 'Le mois en cours', err: 'Bornes basées sur le mois actuel' }, { t: 'Toute l’année 2026', msg: 'Le fichier est annoncé comme un export de mai.' }]);
      await x.pixel('fn_LireDate compare déjà chaque date convertie à ces bornes. Vérifions sur les valeurs : le profil d’une colonne Date donne son minimum et son maximum.');
      await seeProfile(x, 'Date_Demande_Parsee');
      await K2.ask(x, 'Que révèle le minimum de Date_Demande_Parsee ?', [{ t: 'Le 03/04/2026 : une date lue, mais antérieure au 1er mai', ok: true }, { t: 'Rien d’anormal : la date existe, elle compte pour mai', err: '3 avril accepté dans l’analyse de mai' }]);
      await seeProfile(x, 'Controle_Date_Demande');
      await K2.num(x, 'Combien de demandes sont hors période ?', [{ id: 'n', label: 'Hors période' }], v => v.n === 1 ? true : ['', 'Lis la ligne Hors période dans le profil de Controle_Date_Demande.']);
      await seeProfile(x, 'Controle_Date_Intervention');
      await K2.num(x, 'Et côté interventions ?', [{ id: 'f', label: 'Format non accepté' }, { id: 'h', label: 'Hors période' }], v => v.f === 1 && v.h === 0 ? true : v.h === 1 ? ['M0550 converti en américain puis validé', 'M0550 n’est pas converti : il reste dans sa propre catégorie, Format non accepté.'] : ['', 'Lis les états listés dans le profil de Controle_Date_Intervention.']);
      await K2.ask(x, 'M0650 : que faire de sa demande du 3 avril ?', [{ t: 'La garder et confirmer le mois et la convention du poste source', ok: true }, { t: 'Changer le mois en mai', err: 'Mois automatiquement changé en mai' }, { t: 'Filtrer les dates hors période', err: 'Filtre supprimant toutes les dates hors période' }, { t: 'La déclarer fictive', err: 'Hors période assimilé à événement fictif' }]);
      await x.ok('Une demande hors période, M0650 ; un format non accepté, M0550, rangé à part. Le contrôle de période ne juge que les dates effectivement converties.');
    } },

    /* 6 — Reconstituer l'ordre des événements */
    { async run(x) {
      K2.open(x, NAME);
      await x.say('oscar', 'Pour M0120, l’intervention apparaît avant la demande. Nous avions déjà repéré ce cas.');
      await x.pixel('M0055 présente le même problème une fois sa date ISO lue. Une différence de format pouvait le rendre moins visible.');
      await x.pixel('La règle : comparer seulement quand les deux dates converties sont disponibles. Sinon, l’ordre est non évaluable.');
      await K2.custom(x, { q: NAME, col: 'Controle_Chronologie', type: 'text', src: K2.F.chrono, typeErr: '',
        check: T => {
          const n = v => T.rows.filter(r => r.Controle_Chronologie === v).length;
          if (n('Non évaluable') !== 3) return ['Date manquante considérée égale à zéro'];
          return n('Intervention avant demande') === 2 ? true : ['', 'Deux interventions précèdent leur demande : vérifie la formule collée.'];
        },
        tries: p => {
          if (p.kind === 'add' && p.op === 'custom' && /\[Date_(Demande|Intervention)\]/.test(p.step.src || '')) return x.oops('Comparaison des textes sources');
          if (p.kind !== 'add') return;
          if (p.op === 'filter') return x.oops('Ligne antérieure supprimée');
          if (p.op === 'replace') return x.oops('Dates permutées automatiquement');
        } });
      await seeProfile(x, 'Controle_Chronologie');
      await K2.num(x, 'Lis le profil de Controle_Chronologie.', [{ id: 'a', label: 'Intervention avant demande' }, { id: 'n', label: 'Non évaluable' }], v => v.a === 2 && v.n === 3 ? true : v.n === 0 ? ['Date manquante considérée égale à zéro'] : ['', 'Chaque état du profil est suivi de son nombre de lignes.']);
      await K2.ask(x, 'M0055 avait seulement un format différent. Est-il résolu ?', [{ t: 'Non : son format est lisible, sa chronologie reste à investiguer', ok: true }, { t: 'Oui, sa date ISO est convertie', err: 'M0055 déclaré entièrement résolu' }]);
      await K2.ask(x, 'Que conclure pour M0120 ?', [{ t: 'Un ordre inhabituel à vérifier sur les bons', ok: true }, { t: 'Il faut permuter ses deux dates', err: 'Dates permutées automatiquement' }, { t: 'C’est une fraude', err: 'Anomalie assimilée à fraude' }]);
      await x.say('oscar', 'Une demande saisie tardivement après une urgence pourrait expliquer un ordre inhabituel. Mais nous devons le vérifier sur les bons.');
      await x.ok('Deux chronologies inversées, M0055 et M0120 ; trois ordres non évaluables, faute de deux dates converties. Aucune date permutée.');
    }, avance: EX6 },

    /* 7 — Construire la liste des dates à investiguer */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, Q = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('victoria', 'Donne-moi maintenant une liste unique des dossiers concernés. Je ne veux pas compter deux fois la même intervention parce qu’elle échoue à plusieurs contrôles.');
      await x.pixel('Un indicateur Vrai/Faux calculé depuis les trois contrôles, puis une vue temporaire filtrée.');
      await K2.custom(x, { q: NAME, col: 'A_Investiguer_Dates', type: 'bool', src: K2.F.investDates,
        check: T => T.rows.filter(r => r.A_Investiguer_Dates === true).length === 6 ? true : ['', 'Six dossiers doivent ressortir : vérifie la formule collée.'],
        tries: p => p.kind === 'add' && p.op === 'custom' && /M\d{4}/.test(p.step.src || '') ? x.oops('Indicateur saisi manuellement par ID') : p.kind === 'add' && p.op === 'filter' ? x.oops('Préparation principale réduite à six lignes') : undefined });
      const T2 = () => tmps(P()).find(q => q.kind205 === 'inv');
      await K2.work(x, {
        cur: NAME, edit: [], editNew: true, ops: ['filter'],
        next: () => {
          const t = T2();
          if (!t) return [`Volet Requêtes : ⋯ à côté de ${NAME}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, Q()), '.menu [data-k="ref"]']];
          if (t.load !== false) return ['Désactive le chargement de cette liste temporaire.', ['.q2-qname', '.menu [data-k="load"]']];
          if (!K2.shown(x, t.name)) return K2.showTodo(x, t.name);
          if (!t.steps.some(s => s.op === 'filter')) return ['Filtre A_Investiguer_Dates : décoche FALSE, puis OK.', ['[data-q="flt:A_Investiguer_Dates"]', '.q2-chk', '[data-d="ok"]']];
          return true;
        },
        tries: p => {
          const t = T2();
          if (p.kind === 'newQuery') { if (t) return x.oops('', 'La liste temporaire existe déjà.'); if (p.how !== 'ref' || p.src !== Q()) return x.oops('', `Crée une référence de ${NAME}.`); p.query.tmp205 = true; p.query.kind205 = 'inv'; return true; }
          if (p.kind === 'load') { if (p.on) return x.oops('Liste chargée dans le modèle'); return p.target === t ? true : x.oops('', 'Règle seulement la liste temporaire.'); }
          if (p.kind === 'renameQuery') return p.target === t ? true : x.oops('', 'Garde le nom de cette requête.');
          if (p.kind === 'add' && p.q === Q()) return x.oops('Préparation principale réduite à six lignes');
          if (p.kind === 'add' && p.op === 'filter') { const R = K2.simulate(x, t, p.step); return R.table && R.table.rows.length === 6 && R.table.rows.every(r => r.A_Investiguer_Dates === true) ? true : x.oops('', 'Garde seulement les lignes où A_Investiguer_Dates vaut TRUE.'); }
        }
      });
      await K2.num(x, 'Combien de dossiers dans la liste ?', [{ id: 'n', label: 'Dossiers à investiguer' }], v => v.n === 6 ? true : ['', 'Lis la barre d’état de la liste temporaire.']);
      await x.multi('Coche les dossiers dont toutes les dates se lisent, mais qui restent à investiguer.', ['M0040', 'M0055', 'M0120', 'M0550', 'M0650', 'M1005'].map(v => ({ t: v, v })), sel => {
        const want = ['M0055', 'M0120', 'M0650'];
        if (want.every(v => sel.includes(v)) && sel.length === 3) return true;
        if (!sel.includes('M0055')) return ['M0055 oublié'];
        if (!sel.includes('M0650')) return ['M0650 oublié'];
        if (!sel.includes('M0120')) return ['', 'M0120 a deux dates lisibles, mais dans le mauvais ordre.'];
        return ['', 'M0040, M0550 et M1005 ont une date qui ne se convertit pas : lis leurs contrôles.'];
      });
      await K2.ask(x, 'M0550 n’a pas de date d’intervention convertie. Reste-t-il dans la liste ?', [{ t: 'Oui : son état de lecture impose une investigation', ok: true }, { t: 'Non, il n’est pas évaluable', err: 'M0550 ignoré parce que non convertible' }]);
      EX7r(P());
      await x.ok('Six dossiers, un par ligne : deux dates impossibles, un format non accepté, une demande hors période, deux chronologies inversées. La préparation garde ses 1 099 lignes.');
    }, avance: P => { EX7(P); EX7r(P); } },

    /* 8 — Sauvegarder les dates sans certifier l'incertain */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      if (!P().regDates || P().regDates.length < 6) EX7r(P());
      K2.open(x, NAME);
      await x.say('gabriel', 'Nous avons des dates utilisables pour beaucoup de lignes, mais certains dossiers restent bloqués.');
      await x.say('victoria', 'C’est précisément ce que le registre doit montrer.');
      await x.pixel('Nous conservons cet état, sans publier d’analyse temporelle prématurée. Contrôle d’abord la préparation.');
      await K2.num(x, 'État de prep_Maintenance_Dates.', [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 1099 && v.c === 25 ? true : v.l < 1099 ? ['Volume réduit après suppression des erreurs'] : ['', '19 colonnes héritées et 6 ajoutées ; les lignes restent celles de la mission 204.']);
      x.app('reg205b', K.lesson('Registre d’investigation', 'Six dossiers temporels ouverts', `${regCard(P().regDates)}<p class="lc-note">${esc(fr('Le registre est enregistré dans le projet. Les vues temporaires peuvent disparaître.'))}</p>`));
      await K2.ask(x, 'Victoria : « Pouvons-nous maintenant calculer les délais moyens d’intervention de mai ? »', [{ t: 'Pas encore un délai global : il faut définir quelles lignes y contribuent et expliquer les exclusions', ok: true }, { t: 'Oui, toutes les dates sont prêtes', err: 'Dates incertaines présentées comme certifiées' }]);
      x.app('pbi'); K2.open(x, NAME);
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M205', cur: NAME,
        work: { loadErr: 'Chargement activé', overErr: 'Checkpoint 110 écrasé', fileErr: 'Indicateurs commerciaux modifiés', delErr: 'Volume réduit après suppression des erreurs',
          delQuery: p => p.target.tmp205 ? true : false },
        pre: () => {
          const t = tmps(P())[0];
          if (t) { if (!pbi.q2El) return ['Rouvre l’éditeur Power Query pour ranger les vues temporaires.', ['[data-a="cmd:transform"]']]; return [`Supprime la vue temporaire ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']]; }
          return true;
        }
      });
      x.app('ctl205', K.lesson('Contrôle final', 'Des dates lisibles, des doutes visibles', `${K2.facts([['1 099', 'lignes, aucune retirée'], [25, 'colonnes, dont 6 ajoutées'], [6, 'dossiers temporels ouverts'], [0, 'date corrigée par supposition']])}${K2.card110(P())}`));
      await x.ok('Copie M205 enregistrée. Les textes reçus, leurs lectures et les contrôles métier restent séparés ; le rapport du conseil est intact.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'calendrier', n: 'Archives techniques, 17 h 05. Les six dossiers temporels rejoignent le tableau des investigations. Les dates impossibles portent une demande de justificatif.' },
    { p: 'gabriel', t: 'Nous pouvons donc préparer le calcul des délais, mais d’abord préciser ce qu’il mesure et quelles lignes peuvent y contribuer.' },
    { p: 'victoria', t: 'C’est cette précision que j’attends avant de prendre une décision.' },
    { card: { k: NAME, h: '1 099 lignes · 6 dossiers temporels', chips: ['2 dates impossibles', '1 format non accepté', '1 hors période', '2 chronologies inversées'] } },
    { wait: 600 }
  ],
  recompense: { titre: 'Calendrier tenu !', sous: 'Six dossiers temporels signalés, aucune date inventée.', badge: 'b205', badgeNom: 'Gardien du calendrier', objet: 'horloge' },
  fiches: [
    ['Garder le témoin', 'Pourquoi convertir une date dans une nouvelle colonne ?', 'Conserver la valeur brute à côté de la valeur convertie permet de contrôler la transformation et d’expliquer ses échecs.'],
    ['Contrat de lecture', 'À quoi sert un paramètre régional ?', 'À traduire une convention de source connue. Il ne doit pas servir à rendre arbitrairement toutes les valeurs lisibles.'],
    ['Erreur utile', 'Que conserve une bonne gestion d’erreur ?', 'La valeur reçue, le résultat de la tentative et la cause de l’échec : try, puis un état de lecture.'],
    ['Date impossible', 'Un 31 février est identifié : peut-on le corriger ?', 'Le diagnostic est certain. Retrouver la date voulue exige une preuve supplémentaire, la pièce d’origine.'],
    ['Période', 'Que vérifie le contrôle de période ?', 'L’appartenance au périmètre attendu, sur les dates converties. Il ne dit pas, à lui seul, si l’événement existe réellement.'],
    ['Chronologie', 'Une intervention précède sa demande : que faire ?', 'Ouvrir une enquête. Le contrôle compare deux événements définis ; il ne fournit pas de correction automatique.'],
    ['Indicateur de revue', 'Pourquoi un indicateur Vrai/Faux plutôt qu’une somme d’erreurs ?', 'Il rassemble les causes sans confondre le nombre de problèmes avec le nombre de dossiers concernés.'],
    ['Incertitude visible', 'Que montre une préparation fiable ?', 'Elle rend l’incertitude visible : valeur source, interprétation technique et contrôles métier restent séparés.']
  ],
  suiteTitre: 'Dimanche, 17 h 15',
  suite: [
    { bg: 'compartiments', n: 'Oscar ouvre un bon d’intervention plus ancien. Une seule cellule contient plusieurs informations : Dragon / Zone Nord / Corrective.' },
    { p: 'oscar', t: 'Nous avons aussi récupéré un ancien export. Le logiciel mettait parfois plusieurs informations dans la même colonne.' },
    { p: 'gabriel', t: 'Et si nous coupons au mauvais endroit, nous risquons de mélanger les noms ou les équipements.' },
    { p: 'pixel', t: 'Prochaine enquête : retrouver la structure à l’intérieur des cellules. Il faudra choisir les séparateurs, et conserver les informations d’origine.' }
  ],
  accroche: 'Un 31 février, un 12/31 et une intervention avant sa demande : lire les dates selon un contrat, sans rien deviner.',
  fin(P) { EX7(P); EX7r(P); EX8(P); }
};
window.PBQ.mission(def);
})();

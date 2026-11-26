/* Mission 209 — Les données dispersées (rôles des tables, clés, jointure externe gauche, correspondances comptées, anti-jointure) */
(function () {
'use strict';
const { esc, fr, $ } = window.PBQ;
const PQE = window.PQE;
const N = K2.N209, GRP = N.g;
const IB = N.ib, RB = N.rb, I = N.i, R = N.r, D = N.d, E = N.e;
const FI = 'M209_Interventions.csv', FR = 'M209_Referentiel_Equipements.csv', DIR = 'Maintenance/Atelier_M209';
const LIB = 'prep_Maintenance_Libelles', ANN = 'atelier_M208_Annuel';
const STEPK = ['add', 'edit', 'del', 'delEnd', 'moveStep', 'renameStep', 'code', 'type', 'renameCol'];
const SRC = ['ID_Intervention', 'Date_Intervention', 'Code_Equipement', 'Duree_Heures', 'Cout_HT'];
const STATUTS = { J001: 'Correspondance unique', J002: 'Correspondance unique', J003: 'Correspondance unique', J004: 'Référentiel ambigu', J005: 'Correspondance unique', J006: 'Correspondance unique', J007: 'Code inconnu', J008: 'Clé absente' };

/* ───────── État canonique ───────── */
const NAMES = [IB, RB, I, R, D, E];
const SET = stage => P => {
  K2.grp(P, GRP);
  P.queries = P.queries.filter(q => !NAMES.includes(q.name) && !/^q_(ib|rb|i|r|d|e)209$/.test(q.id) && !q.tmp209);
  P.queries.push(K2.C.ib209(), K2.C.rb209(), K2.C.i209(stage), K2.C.r209(stage));
  if (stage >= 3) P.queries.push(K2.C.d209(stage));
  if (stage >= 6) P.queries.push(K2.C.e209());
};
function EX8(P) { SET(6)(P); P.name = 'Wonderland_Pilotage_M209'; P.saved = true; P.dirty = false; }
const tmps = P => P.queries.filter(q => q.tmp209);
const srcFile = q => q && q.steps[0] && q.steps[0].op === 'csv' ? q.steps[0].file : null;
const colsOf = s => (s.cols || []).concat(s.col ? [s.col] : [], (s.pairs || []).map(z => z[0]));
const qrenTodo = name => [`Renomme la requête ${name} : touche son nom en haut, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']];
const loadTodo = ['Désactive son chargement : touche son nom, puis Activer le chargement.', ['.q2-qname', '.menu [data-k="load"]']];
const mergeRibbon = ['[data-q="tab:Accueil"]', '[data-q="cmd:merge"]', '.menu [data-k="new"]'];
/* Contrôle commun d'une boîte Fusionner : interventions à gauche, référentiel à droite, clés préparées, correspondance exacte */
const mergeCheck = (x, p, kind, labels) => {
  const s = p.spec, id = n => (K2.q(x, n) || {}).id;
  if (!p.asNew) return x.oops('', 'Choisis Fusionner des requêtes comme nouvelle : les préparations restent intactes.');
  if (p.from === id(R) && s.with === id(I)) return x.oops(labels.left || '', `Les interventions vont à gauche : ${I}.`);
  if (p.from !== id(I)) return x.oops('', `La première table est ${I}.`);
  if (s.with !== id(R)) return x.oops('', `La deuxième table est ${R}.`);
  if (s.left.length > 1 || s.right.length > 1) return x.oops(labels.multi || '', 'Une seule colonne de chaque côté : Cle_Equipement.');
  if (s.left.includes('Attraction') || s.right.includes('Attraction')) return x.oops(labels.attr || '', 'Les interventions n’ont pas de libellé d’attraction : le lien passe par la clé.');
  if (s.left[0] !== 'Cle_Equipement') return x.oops('', 'À gauche aussi, utilise la clé préparée : Cle_Equipement.');
  if (s.right[0] !== 'Cle_Equipement') return x.oops(labels.right || '', 'À droite aussi, la clé préparée : Cle_Equipement.');
  if (s.fuzzy) return x.oops(labels.fuzzy || '', 'Les codes attendent une correspondance exacte : décoche la correspondance approximative.');
  if (s.kind !== kind) return x.oops(s.kind === 'inner' && labels.inner ? labels.inner : '', kind === 'leftouter' ? 'Choisis Externe gauche : toutes les interventions, avec leurs correspondances.' : 'Choisis Anti gauche : les interventions sans aucune correspondance.');
  return true;
};
const mergeTodo = (x, kind, lbl) => [`Première table : ${I}. Deuxième : ${R}. Touche Cle_Equipement dans les deux aperçus, choisis ${lbl}, puis OK.`,
  ['[data-k="l"]', `.menu [data-k="${(K2.q(x, I) || {}).id}"]`, '[data-k="r"]', `.menu [data-k="${(K2.q(x, R) || {}).id}"]`, '[data-mc="l|Cle_Equipement"]', '[data-mc="r|Cle_Equipement"]', '[data-k="j"]', `.menu [data-k="${kind}"]`, '[data-d="ok"]']];

const def = {
  id: 209,
  objectifs: ['Préparer une clé identique des deux côtés', 'Choisir la jointure qui conserve toutes les interventions', 'Compter les correspondances avant de développer', 'Signaler les absences et les ambiguïtés sans rien deviner'],
  intro: [
    { bg: 'connexions', n: 'Lundi 8 juin, 13 h 30. Bureau Data. Oscar affiche les deux fichiers côte à côte : des interventions avec un code d’équipement, et un référentiel qui décrit ces équipements.' },
    { p: 'gabriel', t: 'Il faut ramener les noms et les responsables dans la liste des interventions.' },
    { card: { k: 'Clé commune', h: 'Code_Equipement', p: 'Présent dans les deux fichiers' } },
    { p: 'pixel', t: 'Nous allons rapprocher les tables à partir de cette clé. Cette fois, nous ne les empilons pas.' },
    { clear: 1, n: 'Gabriel tente un rapprochement de démonstration et développe les résultats.' },
    { card: { k: 'Démonstration', h: '8 → 9 lignes', p: 'Coût HT : 2 200 € → 2 450 €' } },
    { p: 'gabriel', t: 'Nous n’avons ajouté aucune intervention. Pourquoi le total augmente-t-il ?' },
    { p: 'oscar', t: 'J004 apparaît deux fois. Le code EQ04 a deux responsables dans le référentiel.' },
    { p: 'pixel', t: 'Une ligne de gauche peut trouver plusieurs lignes à droite. Quand on développe les correspondances, elle est répétée.' },
    { clear: 1, p: 'victoria', t: 'Je veux retrouver chaque intervention une seule fois. Si le responsable n’est pas certain, laissez l’incertitude visible.' },
    { btn: 'Choisir ce que la jointure conserve' }
  ],
  leconTitre: 'Choisir ce que la jointure conserve',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Quatre jointures, quatre populations', `
      <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>Externe gauche</b><small>Toutes les lignes de gauche, avec leurs correspondances à droite, s’il y en a</small></div><div class="flow-box"><b>Interne</b><small>Seulement les lignes qui trouvent une correspondance</small></div></div>
      <div class="flow-row" style="grid-template-columns:1fr 1fr; margin-top:8px"><div class="flow-box"><b>Anti gauche</b><small>Seulement les lignes de gauche qui ne trouvent rien</small></div><div class="flow-box"><b>Externe complète</b><small>Toutes les lignes des deux côtés, appariées quand c’est possible</small></div></div>
      <div data-sec="2" style="display:none; margin-top:14px"></div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    await x.pixel('À gauche, les interventions. À droite, le référentiel. Le choix de la jointure dépend de ce qu’on veut garder.');
    await x.pixel('Pour enrichir notre registre sans perdre d’événement, nous partirons d’une jointure externe gauche. À toi d’associer chaque besoin à sa jointure.');
    const B = K2.sorter({ bare: true, title: 'Quelle jointure pour ce besoin ?', btn: 'Vérifier', options: [['lo', 'Externe gauche'], ['in', 'Interne'], ['la', 'Anti gauche'], ['fo', 'Externe complète']],
      rows: [['a', 'Garder les huit interventions et ajouter leur description', 'Même sans correspondance'], ['b', 'Ne garder que les interventions décrites', 'Les autres disparaissent'], ['c', 'Lister les interventions qui ne trouvent rien', 'Codes à vérifier'], ['d', 'Voir aussi les équipements sans intervention', 'Les deux côtés']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
    const sec = $('[data-sec="2"]', card); sec.appendChild(B.el); sec.style.display = '';
    requestAnimationFrame(() => sc.scrollTo({ top: Math.max(0, sec.offsetTop - 14), behavior: 'smooth' }));
    const SOL = { a: 'lo', b: 'in', c: 'la', d: 'fo' };
    x.todo('Associe chaque besoin à sa jointure.');
    await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
      if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Choisis une jointure pour les quatre besoins.');
      const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
      if (!bad.length) { B.lock(); return true; }
      if (bad.includes('a')) return x.oops('', 'Pour garder toutes les interventions, même sans correspondance : externe gauche.');
      if (bad.includes('b')) return x.oops('', 'Ne garder que les lignes appariées, c’est la jointure interne.');
      if (bad.includes('c')) return x.oops('', 'Les lignes de gauche qui ne trouvent rien : anti gauche.');
      return x.oops('', 'Les lignes des deux côtés, appariées ou non : externe complète.');
    } });
    await x.say('gabriel', 'Avec l’externe gauche, nous aurons forcément huit lignes à la fin ?');
    await x.pixel('Pas après développement, si une clé trouve plusieurs correspondances. Il faudra aussi compter les correspondances de chaque clé.');
    await x.ok('Deux contrôles distincts : la jointure décide quelles lignes restent ; le nombre de correspondances par clé décide du risque de répétition.');
  },
  exs: [
    /* 1 — Importer deux rôles différents */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      x.app('pbi'); pbi.render();
      await x.say('oscar', 'Le premier fichier décrit les événements. Le second fournit des informations sur les équipements.');
      await x.pixel('Nous gardons ces deux rôles visibles dans les noms des requêtes. Les deux fichiers sont dans Maintenance › Atelier_M209.');
      const FILES = [{ f: FI, n: IB }, { f: FR, n: RB }], W = K2.dirWatch(x);
      const byFile = f => P().queries.find(q => q.m2 && srcFile(q) === f);
      await K2.work(x, {
        cur: LIB, edit: [], editNew: true,
        next: () => {
          for (const s of FILES) {
            const q = byFile(s.f);
            if (!q) {
              if (pbi.dlgKind === 'q2csv') return ['Garde l’origine 65001 : Unicode (UTF-8). Délimiteur Point-virgule, et Ne pas détecter les types de données : ils seront définis dans la préparation. Puis OK.', ['[data-x="delim"]', '.menu [data-k=";"]', '[data-x="detect"]', '.menu [data-k="none"]', '[data-d="ok"]']];
              if (pbi.dlgKind === 'q2open') return [`Ouvre Maintenance › Atelier_M209, puis ${s.f}.`, W.nav(DIR, s.f)];
              return [`Importe ${s.f} : Accueil › Nouvelle source › Texte/CSV.`, ['[data-q="tab:Accueil"]', '[data-q="cmd:newsource"]', '.menu [data-k="csv"]']];
            }
            if (q.name !== s.n) return K2.shown(x, q.name) ? qrenTodo(s.n) : K2.showTodo(x, q.name);
            if (q.load !== false) return K2.shown(x, q.name) ? loadTodo : K2.showTodo(x, q.name);
          }
          return true;
        },
        tries: p => {
          if (p.kind === 'append') return x.oops('Fichiers ajoutés l’un sous l’autre');
          if (p.kind === 'merge') return x.oops('', 'Pas encore : importe d’abord les deux sources.');
          if (p.kind === 'newQuery') {
            if (p.how === 'append') return x.oops('Fichiers ajoutés l’un sous l’autre');
            if (p.how !== 'csv') return x.oops('', 'Passe par Nouvelle source › Texte/CSV.');
            const s = FILES.find(z => z.f === srcFile(p.query));
            if (!s) return x.oops('', 'Importe les deux fichiers de l’atelier M209.');
            if (byFile(s.f)) return x.oops('', `${s.f} est déjà importé : une seule lecture suffit.`);
            p.query.group = GRP; return true;
          }
          if (p.kind === 'renameQuery') { const s = FILES.find(z => byFile(z.f) === p.target); if (!s) return x.oops('', 'Garde le nom de cette requête.'); return p.name === s.n ? true : x.oops('', `Écris exactement ${s.n}.`); }
          if (p.kind === 'load') { if (p.on) return x.oops('Chargement activé'); return FILES.some(z => byFile(z.f) === p.target) ? true : x.oops('', 'Règle seulement les deux nouvelles requêtes.'); }
          if (STEPK.includes(p.kind)) return x.oops('Sources brutes transformées directement');
        },
        on: Object.assign({}, W.on, {
          'q2.file': p => {
            if (p.fileKind === 'xlsx' || /2026|Wonderland_Brut/.test(p.file)) return x.oops('Périmètre 2026 utilisé');
            if (![FI, FR].includes(p.file)) return x.oops('', 'Les deux fichiers de l’atelier sont dans Maintenance › Atelier_M209.');
          },
          'q2.csvOk': p => {
            if (p.enc !== 65001) return x.oops('', 'Garde l’origine 65001 : Unicode (UTF-8), pour lire correctement les caractères.');
            if (p.delim !== ';') return x.oops('Mauvais séparateur');
            if (p.detect !== 'none') return x.oops('', 'Choisis Ne pas détecter les types de données : la préparation les définira explicitement.');
          }
        })
      });
      await x.pixel('Les sources brutes restent intactes. On travaille dans deux références de préparation.');
      const errs = { edit: 'Sources brutes transformées directement', srcEdit: 'Sources brutes transformées directement', load: 'Chargement activé', legacy: '', legacyName: '', name: '' };
      await K2.branch(x, { src: IB, name: I, deps: false, errs });
      await K2.branch(x, { src: RB, name: R, deps: false, errs });
      await x.pixel('Les interventions d’abord : les codes et identifiants en texte, puis la date, la durée et le coût avec la convention du fichier, point décimal et dates ISO.');
      const typeErr = p => {
        if (p.kind !== 'type') return;
        if (p.cols.includes('Code_Equipement') && ['int', 'dec', 'fixed', 'pct'].includes(p.type)) return x.oops('Codes convertis en nombres');
        if (p.cols.includes('Cout_HT') && p.type === 'text') return x.oops('Coûts laissés en texte pour les contrôles');
      };
      await K2.types(x, { q: I, groups: [[['ID_Intervention', 'Code_Equipement'], 'text'], [['Date_Intervention'], 'date', 'en-US'], [['Duree_Heures'], 'dec', 'en-US'], [['Cout_HT'], 'fixed', 'en-US']], tries: typeErr });
      await x.pixel('Dans le référentiel, les quatre colonnes sont du texte.');
      await K2.types(x, { q: R, groups: [[['Code_Equipement', 'Attraction', 'Zone', 'Responsable'], 'text']], tries: typeErr });
      await K2.num(x, 'Volumes de l’atelier : lis la barre d’état de chaque préparation.', [{ id: 'il', label: 'Interventions · lignes' }, { id: 'ic', label: 'Interventions · colonnes' }, { id: 'rl', label: 'Référentiel · lignes' }, { id: 'rc', label: 'Référentiel · colonnes' }, { id: 't', label: 'Coût HT des 8 interventions', unit: '€' }], v => {
        if (v.rl === 5) return ['Référentiel réduit immédiatement à cinq lignes'];
        if (v.il !== 8 || v.ic !== 5 || v.rl !== 6 || v.rc !== 4) return ['', 'Affiche chaque préparation et lis sa barre d’état.'];
        return v.t === 2200 ? true : ['', 'Additionne les huit coûts de Cout_HT.'];
      });
      await K2.ask(x, 'Six lignes pour cinq codes dans le référentiel. Que faire de la ligne en trop ?', [{ t: 'Rien pour l’instant : examiner d’abord cette répétition', ok: true }, { t: 'La supprimer tout de suite', err: 'Référentiel réduit immédiatement à cinq lignes' }]);
      await K2.ask(x, 'Ces interventions datent de juin 2025. Les relie-t-on au registre de mai 2026 ?', [{ t: 'Non : l’atelier reste à part, sur juin 2025', ok: true }, { t: 'Oui, c’est la même maintenance', err: 'Périmètre 2026 utilisé' }]);
      await x.ok('Deux sources brutes intactes, deux préparations typées : 8 interventions pour 2 200 € HT, et un référentiel de 6 lignes.');
    }, avance: SET(1) },

    /* 2 — Examiner les clés avant la fusion */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('gabriel', 'EQ01 apparaît deux fois dans les interventions. Est-ce déjà un problème ?');
      await x.say('oscar', 'Deux interventions peuvent concerner le même équipement.');
      await x.pixel('La répétition est normale dans les événements. Dans le référentiel, qui doit fournir une seule description, elle demande un contrôle.');
      await x.pixel('D’abord, une clé de comparaison préparée de la même façon des deux côtés : espaces retirés, majuscules, texte vide changé en null. Le code reçu reste intact.');
      const cleTries = q => p => {
        if (p.kind === 'add' && ['fmt', 'replace', 'rename', 'removeCols'].includes(p.op) && colsOf(p.step).includes('Code_Equipement')) return x.oops('Clés sources écrasées');
        if (p.kind === 'add' && p.op === 'custom' && /"EQ99"/.test(p.step.src || '')) return x.oops('Code absent remplacé par EQ99');
        if (p.kind === 'add' && p.op === 'distinct') return x.oops(q === I ? 'EQ01 dédoublonné dans les interventions' : 'Doublon du référentiel supprimé sans preuve');
      };
      await K2.custom(x, { q: I, col: 'Cle_Equipement', type: 'text', src: K2.F.cle209, tries: cleTries(I),
        check: T => K2.find(T, 'ID_Intervention', 'J008').Cle_Equipement === null && K2.find(T, 'ID_Intervention', 'J001').Cle_Equipement === 'EQ01' ? true : ['', 'Vérifie la formule collée.'] });
      await x.pixel('Même règle dans le référentiel : les deux côtés doivent se comparer de la même façon.');
      await K2.custom(x, { q: R, col: 'Cle_Equipement', type: 'text', src: K2.F.cle209, tries: cleTries(R), check: T => T.rows.every(r => r.Cle_Equipement === r.Code_Equipement) ? true : ['', 'Vérifie la formule collée.'] });
      await x.pixel('Regarde les fréquences des clés dans les interventions.');
      await K2.prof(x, I, 'Cle_Equipement');
      await K2.num(x, 'Profil de Cle_Equipement, interventions.', [{ id: 'a', label: 'Lignes EQ01' }, { id: 'b', label: 'Lignes EQ02' }, { id: 'v', label: 'Vide' }], v => v.a === 2 && v.b === 2 && v.v === 1 ? true : ['', 'Lis la distribution des valeurs et la ligne Vide.']);
      await x.pixel('Côté référentiel, regroupe par clé dans une vue temporaire : chaque clé ne devrait apparaître qu’une fois.');
      await K2.tmp(x, { src: R, flag: 'tmp209', kind: 'cles', ops: ['group'],
        next: t => t.steps.some(s => s.op === 'group') ? true : ['Sélectionne Cle_Equipement, puis Transformer › Regrouper par : Nombre de lignes, puis OK.', ['[data-q="hd:Cle_Equipement"]', '[data-q="tab:Transformer"]', '[data-q="cmd:group"]', '[data-d="ok"]']],
        tries: (p, t) => {
          if (p.kind === 'add' && p.op === 'distinct') return x.oops('Doublon du référentiel supprimé sans preuve');
          if (p.kind === 'add' && p.op === 'group') {
            if (p.step.keys.join() !== 'Cle_Equipement') return x.oops(p.step.keys.includes('Attraction') ? 'EQ04 considéré unique parce que l’attraction est identique' : '', 'Regroupe par Cle_Equipement.');
            return p.step.aggs.some(a => a.op === 'count') ? true : x.oops('', 'Compte les lignes de chaque clé : opération Nombre de lignes.');
          }
        } });
      await K2.num(x, 'Lis le regroupement.', [{ id: 'k', label: 'Clés distinctes' }, { id: 'n', label: 'Lignes pour EQ04' }], v => v.k === 5 && v.n === 2 ? true : v.k === 6 ? ['', 'Une ligne par clé : lis la barre d’état du regroupement.'] : ['', 'Lis la barre d’état et la ligne EQ04.']);
      await x.pixel('Compare les deux lignes EQ04 dans le référentiel.');
      await K2.work(x, { cur: R, next: () => K2.shown(x, R) ? true : K2.showTodo(x, R), tries: cleTries(R) });
      const B = K2.sorter({ title: 'Quatre situations', intro: 'Ce que montrent les clés, avant toute fusion.', btn: 'Vérifier', options: [['evt', 'Plusieurs événements'], ['conc', 'Descriptions concurrentes'], ['abs', 'Clé absente'], ['inc', 'Code à vérifier']],
        rows: [['a', 'EQ01 deux fois', 'Interventions J001 et J005'], ['b', 'EQ04 deux fois', 'Référentiel : Malik, puis Lina'], ['c', 'J008', 'Code_Equipement vide'], ['d', 'J007', 'Code EQ99']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
      x.app('cles209', B.el);
      const SOL = { a: 'evt', b: 'conc', c: 'abs', d: 'inc' };
      x.todo('Classe les quatre situations.');
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Classe les quatre situations.');
        const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
        if (!bad.length) { B.lock(); return true; }
        if (bad.includes('a')) return x.oops('Répétition des événements assimilée à une erreur de clé');
        if (bad.includes('b')) return x.oops('EQ04 considéré unique parce que l’attraction est identique');
        return x.oops('Code absent remplacé par EQ99');
      } });
      x.app('pbi');
      await K2.ask(x, 'EQ99 ressemble à EQ09. Active-t-on la correspondance approximative ?', [{ t: 'Non : un code attend une correspondance exacte', ok: true }, { t: 'Oui, pour le rattraper', err: 'Rapprochement approximatif activé' }]);
      await K2.ask(x, 'Pourquoi la même règle de clé des deux côtés ?', [{ t: 'Pour comparer des valeurs préparées de la même façon', ok: true }, { t: 'Par habitude : un seul côté suffirait', err: 'Nettoyage effectué d’un seul côté' }]);
      await x.ok('Des répétitions normales côté événements, une clé en double côté référentiel, une clé absente et un code à vérifier : quatre situations distinctes, avant toute fusion.');
    }, avance: SET(2) },

    /* 3 — Choisir la jointure externe gauche */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      const dq = () => P().queries.find(q => q.d209 || q.id === 'q_d209');
      await x.say('victoria', 'Je veux garder les huit interventions, même lorsque nous ne savons pas les enrichir.');
      await x.pixel('Les interventions à gauche, le référentiel à droite, et une jointure externe gauche, dans une nouvelle requête.');
      const labels = { left: 'Référentiel placé à gauche', multi: 'Plusieurs colonnes sélectionnées involontairement', attr: 'Jointure sur Attraction', right: 'Mauvaise colonne sélectionnée à droite', fuzzy: 'Correspondance approximative activée', inner: 'Jointure interne choisie' };
      await K2.work(x, {
        cur: I, edit: [], editNew: true,
        next: () => {
          const d = dq();
          if (!d) return pbi.dlgKind === 'q2merge' ? mergeTodo(x, 'leftouter', 'Externe gauche') : ['Accueil › Fusionner des requêtes › Fusionner des requêtes comme nouvelle.', mergeRibbon];
          if (!K2.shown(x, d.name)) return K2.showTodo(x, d.name);
          if (d.name !== D) return qrenTodo(D);
          if (d.load !== false) return loadTodo;
          if (K2.cols(K2.T(x, d.name)).includes(R)) return [`La colonne fusionnée porte le nom du référentiel. Renomme ${R} en Correspondances : sélectionne-la, puis Transformer › Renommer.`, [`[data-q="hd:${R}"]`, '[data-q="tab:Transformer"]', '[data-q="cmd:rename"]', '.dlg input', '[data-d="ok"]']];
          return true;
        },
        tries: p => {
          if (p.kind === 'merge') return mergeCheck(x, p, 'leftouter', labels);
          if (p.kind === 'append') return x.oops('', 'On rapproche par clé : Fusionner des requêtes.');
          if (p.kind === 'newQuery') { if (dq()) return x.oops('', 'La fusion existe déjà.'); if (p.how !== 'merge') return x.oops('', 'Passe par Fusionner des requêtes comme nouvelle.'); p.query.d209 = true; p.query.group = GRP; return true; }
          if (p.kind === 'renameQuery') { if (p.target !== dq()) return x.oops('', 'Garde le nom de cette requête.'); return p.name === D ? true : x.oops('', `Écris exactement ${D}.`); }
          if (p.kind === 'load') { if (p.on) return x.oops('Résultat chargé'); return p.target === dq() ? true : x.oops('', 'Règle seulement la fusion.'); }
          if (p.kind === 'add' && p.op === 'expand') return x.oops('Développement immédiat sans contrôle');
          if (p.kind === 'add' && p.op === 'rename' && (p.q || {}) === dq()) { const [from, to] = p.merge ? [p.col, p.name] : p.step.pairs[p.step.pairs.length - 1]; return from === R && to === 'Correspondances' ? true : x.oops('', `Renomme seulement ${R}, en Correspondances.`); }
          if (STEPK.includes(p.kind)) return x.oops('', 'Pas d’autre transformation pour l’instant.');
        }
      });
      await x.pixel('Chaque cellule Table contient les correspondances d’une intervention. Touche celle de J004, en ligne 4.');
      const cellIs = r => !!pbi.q2.cell && pbi.q2.cell.r === r && pbi.q2.cell.c === 'Correspondances';
      const noExp = p => { if (p.kind === 'add' && p.op === 'expand') return x.oops('Développement immédiat sans contrôle'); };
      await K2.work(x, { cur: D, next: () => !K2.shown(x, D) ? K2.showTodo(x, D) : cellIs(3) ? true : ['Touche l’espace de la cellule Table de J004, ligne 4 de Correspondances.', ['[data-q="cell:3|Correspondances"]']], tries: noExp });
      await K2.ask(x, 'Que contient la table de J004 ?', [{ t: 'Deux lignes EQ04 : Malik et Lina', ok: true }, { t: 'Une seule ligne, comme les autres', msg: 'Lis le volet du bas : Table · 2 lignes.' }]);
      await K2.work(x, { cur: D, next: () => !K2.shown(x, D) ? K2.showTodo(x, D) : cellIs(6) ? true : ['Touche maintenant la cellule de J007, ligne 7.', ['[data-q="cell:6|Correspondances"]']], tries: noExp });
      await K2.ask(x, 'Et celle de J007 ?', [{ t: 'Une table vide : EQ99 ne trouve rien', ok: true }, { t: 'Une ligne EQ99', msg: 'Lis le volet du bas : la table est vide.' }]);
      await K2.num(x, `Combien de lignes compte ${D} ?`, [{ id: 'l', label: 'Lignes' }], v => v.l === 8 ? true : ['', 'Lis la barre d’état : la fusion garde une ligne par intervention.']);
      await x.ok('Huit lignes : la jointure externe gauche a gardé toutes les interventions. Les correspondances attendent dans leurs tables, sans être développées.');
    }, avance: SET(3) },

    /* 4 — Compter avant de développer */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('gabriel', 'La cellule indique Table. Comment savoir qu’elle contient deux responsables ?');
      await x.pixel('En comptant ses lignes. Nous allons transformer ce risque en contrôle visible.');
      await K2.custom(x, { q: D, col: 'Nb_Correspondances', type: 'int', src: K2.F.nb209,
        tries: p => { if (p.kind === 'add' && p.op === 'custom' && new RegExp(R).test(p.step.src || '')) return x.oops('Compte réalisé sur le référentiel entier'); if (p.kind === 'add' && p.op === 'expand') return x.oops('', 'Pas encore : on compte avant de développer.'); },
        check: T => K2.find(T, 'ID_Intervention', 'J004').Nb_Correspondances === 2 && K2.find(T, 'ID_Intervention', 'J007').Nb_Correspondances === 0 ? true : ['', 'Vérifie la formule collée.'] });
      await K2.num(x, 'Nombre de correspondances.', [{ id: 'a', label: 'J004' }, { id: 'b', label: 'J007' }, { id: 'c', label: 'J008' }], v => v.a === 2 && v.b === 0 && v.c === 0 ? true : (v.b === 1 || v.c === 1) ? ['Table vide traitée comme correspondance valide'] : ['', 'Lis Nb_Correspondances sur chaque ligne.']);
      await K2.ask(x, 'Toutes les cellules affichaient Table. Contenaient-elles la même chose ?', [{ t: 'Non : zéro, une ou deux lignes selon l’intervention', ok: true }, { t: 'Oui, une table chacune', err: 'Toutes les cellules Table considérées identiques' }]);
      await x.pixel('Observons le risque dans une branche de démonstration : on y développe les correspondances sans protection.');
      const demo = () => tmps(P()).find(q => q.tmp209 === 'demo');
      await K2.tmp(x, { src: D, flag: 'tmp209', kind: 'demo', ops: ['expand'],
        next: t => t.steps.some(s => s.op === 'expand') ? true : ['Touche l’icône de développement à droite de l’en-tête Correspondances, garde les colonnes proposées, puis OK.', ['[data-q="exp:Correspondances"]', '[data-d="ok"]']],
        tries: (p, t) => {
          if (p.kind === 'add' && p.op === 'distinct') return x.oops('Doublon retiré après développement au hasard');
          if (p.kind === 'add' && (p.op === 'removeCols' || p.op === 'selectCols')) return x.oops('Colonne de coût supprimée pour cacher l’écart');
          if (p.kind === 'add' && p.op === 'expand') return p.step.col === 'Correspondances' ? true : x.oops('', 'Développe Correspondances.');
        } });
      await K2.num(x, 'Dans la branche développée…', [{ id: 'l', label: 'Lignes' }, { id: 'j', label: 'Lignes de J004' }], v => v.l === 9 && v.j === 2 ? true : ['', 'Lis la barre d’état, puis compte les lignes J004.']);
      await K2.ask(x, 'J004 représente-t-il deux interventions ?', [{ t: 'Non : le développement a répété la même intervention', ok: true }, { t: 'Oui : deux lignes, deux interventions', err: 'J004 déclaré deux interventions' }]);
      await K2.num(x, 'Les huit interventions coûtent 2 200 €, dont 250 € pour J004. Quel total HT afficherait cette branche ?', [{ id: 't', label: 'Total HT', unit: '€' }], v => v.t === 2450 ? true : v.t === 2200 ? ['', 'J004 compte deux fois dans la branche : son coût aussi.'] : ['', '2 200 €, plus la répétition de J004.']);
      await K2.ask(x, '2 450 €, est-ce le coût des interventions ?', [{ t: 'Non : elles coûtent 2 200 € ; les 250 € de plus viennent de la répétition', ok: true }, { t: 'Oui, c’est le nouveau total', err: '2450 € présenté comme coût source' }]);
      await K2.ask(x, 'Que fait-on de cette branche ?', [{ t: 'On la supprime : elle a servi à montrer le risque', ok: true }, { t: 'On la garde comme résultat enrichi', err: 'Branche multipliée conservée comme résultat final' }]);
      await K2.work(x, {
        cur: D,
        next: () => { const t = demo(); return t ? [`Supprime la branche ${t.name} : volet Requêtes, ⋯, Supprimer.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']] : true; },
        delQuery: p => p.target === demo() ? true : false,
        tries: p => { if (p.kind === 'renameQuery' && p.target === demo()) return x.oops('Branche multipliée conservée comme résultat final'); }
      });
      await x.ok('Le comptage distingue déjà absence, correspondance unique et ambiguïté. La démonstration a montré le piège ; elle est rangée.');
    }, avance: SET(4) },

    /* 5 — Séparer les absences et les ambiguïtés */
    { async run(x) {
      await x.say('oscar', 'Malik et Lina figurent tous les deux comme responsables de EQ04. Ce pourrait être un changement d’affectation, mais ce référentiel n’a aucune date de validité.');
      await x.say('victoria', 'Ne choisissez personne arbitrairement. Signalez le dossier.');
      await x.pixel('Une colonne de statut va classer chaque rapprochement selon sa cause : clé absente, code inconnu, correspondance unique ou référentiel ambigu.');
      await K2.custom(x, { q: D, col: 'Statut_Rapprochement', type: 'text', src: K2.F.statut209,
        tries: p => {
          if (p.kind !== 'add' || p.op !== 'custom') return;
          const src = p.step.src || '';
          if (/Malik/.test(src)) return x.oops('Malik choisi parce qu’il apparaît avant Lina');
          if (/Text\.Combine|"\/"/.test(src)) return x.oops('Deux responsables fusionnés dans une chaîne puis validés');
          if (!/Clé absente/.test(src)) return x.oops('J007 et J008 regroupés comme code erroné');
        },
        check: T => {
          const j4 = K2.find(T, 'ID_Intervention', 'J004');
          if (j4 && j4.Statut_Rapprochement === 'Correspondance unique') return ['J004 marqué résolu'];
          return T.rows.every(r => r.Statut_Rapprochement === STATUTS[r.ID_Intervention]) ? true : ['', 'Vérifie la formule collée.'];
        } });
      await K2.prof(x, D, 'Statut_Rapprochement');
      await K2.num(x, 'Répartition des statuts.', [{ id: 'u', label: 'Correspondance unique' }, { id: 'a', label: 'Référentiel ambigu' }, { id: 'i', label: 'Code inconnu' }, { id: 'c', label: 'Clé absente' }], v => v.u === 5 && v.a === 1 && v.i === 1 && v.c === 1 ? true : ['', 'Lis la distribution des valeurs.']);
      await K2.ask(x, 'Victoria : « J004 concerne Sky Tower. Pouvons-nous l’attribuer à Malik, puisqu’il apparaît en premier dans le référentiel ? »', [{ t: 'Non : l’ordre du fichier ne prouve pas l’affectation. J004 garde son coût, son enrichissement attend', ok: true }, { t: 'Oui, la première ligne fait foi', err: 'Malik choisi parce qu’il apparaît avant Lina' }, { t: 'On écrit « Malik/Lina »', err: 'Deux responsables fusionnés dans une chaîne puis validés' }]);
      await K2.ask(x, 'J007 et J008 ?', [{ t: 'Deux causes : un code renseigné mais inconnu, et une clé absente', ok: true }, { t: 'Un seul cas : un code erroné', err: 'J007 et J008 regroupés comme code erroné' }, { t: 'Remplacer EQ99 par EQ09, le code le plus proche', err: 'EQ99 remplacé par le code le plus proche' }]);
      await K2.ask(x, 'Pour J004, quelle question poser au métier ?', [{ t: 'Quel responsable s’applique à la date de l’intervention, et faut-il des dates de validité ?', ok: true }, { t: 'Aucune : on garde le premier responsable', err: 'Premier responsable conservé automatiquement' }, { t: 'Aucune : on fixe une validité au 1er juin', err: 'Date de validité inventée' }]);
      await K2.ask(x, 'Et ces trois dossiers ?', [{ t: 'Ils restent dans la table, ouverts, avec leur question', ok: true }, { t: 'On les retire jusqu’à confirmation', err: 'Trois dossiers supprimés' }, { t: 'J004 est réglé : il a des correspondances', err: 'J004 marqué résolu' }]);
      x.app('q209', K.lesson('Questions métier', 'Trois dossiers ouverts, aucune réponse inventée', `<div class="k2-facts" style="grid-template-columns:1fr">${[['J004 · Sky Tower', 'Quel responsable s’applique à la date de l’intervention ? Le référentiel doit-il porter des dates de validité ?'], ['J007 · EQ99', 'Code valide absent du référentiel, ou erreur de saisie ?'], ['J008 · sans code', 'Quel équipement figure sur le bon d’intervention ?']].map(i => `<div><b>${esc(fr(i[0]))}</b><span>${esc(fr(i[1]))}</span></div>`).join('')}</div>`));
      await x.ok('Cinq correspondances uniques et trois dossiers à investiguer, chacun avec sa cause. Aucune confirmation n’est fournie : ils restent ouverts.');
      x.app('pbi');
    }, avance: SET(5) },

    /* 6 — Développer uniquement les résultats uniques */
    { async run(x) {
      const pbi = x.pbi;
      await x.say('gabriel', 'Pouvons-nous enrichir les cinq dossiers certains tout en gardant les trois autres ?');
      await x.pixel('Oui : une seule description par intervention. Pour les cas non résolus, les attributs resteront nulls, et leur cause restera visible. Nouvelle branche, à partir du diagnostic.');
      await K2.branch(x, { src: D, name: E, deps: false, errs: { edit: '', srcEdit: '', load: '', legacy: '', legacyName: '', name: '' } });
      await K2.custom(x, { q: E, col: 'Description', type: 'any', src: K2.F.desc209,
        tries: p => {
          if (p.kind === 'add' && p.op === 'expand') return x.oops(p.step.col === 'Correspondances' ? 'Développement brut des correspondances' : '', 'D’abord la description contrôlée.');
          if (p.kind !== 'add' || p.op !== 'custom') return;
          const src = p.step.src || '';
          if (/Text\.Combine|"\/"/.test(src)) return x.oops('Responsable concaténé Malik/Lina');
          if (/\{0\}/.test(src) && !/Nb_Correspondances\]\s*=\s*1/.test(src)) return x.oops('Sélection systématique de la première ligne');
        },
        check: T => { const a = K2.find(T, 'ID_Intervention', 'J001').Description, b = K2.find(T, 'ID_Intervention', 'J004').Description; return a && a.Attraction === 'Dragon' && b && b.Responsable === null ? true : ['', 'Vérifie la formule collée.']; } });
      const T = () => K2.T(x, E), has = c => K2.cols(T()).includes(c);
      await K2.work(x, {
        cur: E, edit: [E], ops: ['expand', 'removeCols'],
        next: () => {
          if (!K2.shown(x, E)) return K2.showTodo(x, E);
          if (has('Description')) return ['Touche l’icône de développement de Description, décoche Utiliser le nom de la colonne d’origine comme préfixe, puis OK.', ['[data-q="exp:Description"]', '[data-x="prefix"]', '[data-d="ok"]']];
          if (has('Correspondances')) return ['Retire la colonne de tables du résultat : sélectionne Correspondances, puis Accueil › Supprimer les colonnes.', ['[data-q="hd:Correspondances"]', '[data-q="tab:Accueil"]', '[data-q="cmd:rmcols"]', '.menu [data-k="rm"]']];
          return true;
        },
        tries: p => {
          if (p.kind !== 'add') return;
          if (p.op === 'filter' || p.op === 'rmrows') return x.oops('Cas ambigus exclus du résultat');
          if (p.op === 'replace' && colsOf(p.step).includes('Cout_HT')) return x.oops('Coûts remplacés par null sur les cas non appariés');
          if (p.op === 'expand') {
            if (p.step.col === 'Correspondances') return x.oops('Développement brut des correspondances');
            if (p.step.prefix) return x.oops('', 'Décoche le préfixe : les colonnes s’appellent Attraction, Zone et Responsable.');
            return ['Attraction', 'Zone', 'Responsable'].every(f => p.step.fields.includes(f)) ? true : x.oops('', 'Garde les trois champs : Attraction, Zone et Responsable.');
          }
          if (p.op === 'removeCols' || p.op === 'selectCols') {
            const gone = p.op === 'removeCols' ? p.step.cols : K2.cols(T()).filter(c => !p.step.cols.includes(c));
            if (gone.some(c => SRC.includes(c))) return x.oops('Colonnes sources supprimées');
            if (gone.some(c => ['Statut_Rapprochement', 'Nb_Correspondances'].includes(c))) return x.oops('Nulls ajoutés sans statut');
            return gone.length === 1 && gone[0] === 'Correspondances' ? true : x.oops('', 'Retire seulement Correspondances.');
          }
        }
      });
      await x.pixel('Les trois attributs développés sont du texte.');
      await K2.types(x, { q: E, groups: [[['Attraction', 'Zone', 'Responsable'], 'text']] });
      await K2.num(x, `État de ${E}.`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 9 ? ['Résultat de neuf lignes accepté'] : v.l === 8 && v.c === 11 ? true : ['', 'Lis la barre d’état.']);
      await K2.ask(x, 'Coût HT de J004 dans le résultat ?', [{ t: '250 €, comme dans la source', ok: true }, { t: 'null : il n’est pas enrichi', err: 'Coûts remplacés par null sur les cas non appariés' }]);
      await K2.ask(x, 'Pourquoi Responsable est-il vide pour J007 ?', [{ t: 'Son statut l’explique : Code inconnu', ok: true }, { t: 'On ne peut pas le savoir', err: 'Nulls ajoutés sans statut' }]);
      await x.ok('Huit interventions, onze colonnes, 2 200 € HT. Cinq sont décrites, trois gardent des attributs vides expliqués par leur statut. Personne n’a été choisi au hasard.');
    }, avance: SET(6) },

    /* 7 — Utiliser l’anti-jointure et réconcilier */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('victoria', 'Je veux aussi une liste claire des interventions qui ne trouvent rien dans le référentiel.');
      await x.pixel('Une anti-jointure gauche les isole. Elle ne retrouvera pas J004 : lui a des correspondances, et même trop.');
      const anti = () => tmps(P()).find(q => q.tmp209 === 'anti');
      await K2.work(x, {
        cur: I, edit: [], editNew: true,
        next: () => {
          const a = anti();
          if (!a) return pbi.dlgKind === 'q2merge' ? mergeTodo(x, 'leftanti', 'Anti gauche') : ['Une vue temporaire : Accueil › Fusionner des requêtes › Fusionner des requêtes comme nouvelle.', mergeRibbon];
          if (!K2.shown(x, a.name)) return K2.showTodo(x, a.name);
          if (a.load !== false) return ['Désactive le chargement de cette vue temporaire.', ['.q2-qname', '.menu [data-k="load"]']];
          return true;
        },
        tries: p => {
          if (p.kind === 'merge') return mergeCheck(x, p, 'leftanti', {});
          if (p.kind === 'newQuery') { if (anti()) return x.oops('', 'La vue anti-jointure existe déjà.'); if (p.how !== 'merge') return x.oops('', 'Passe par Fusionner des requêtes comme nouvelle.'); p.query.tmp209 = 'anti'; p.query.group = GRP; return true; }
          if (p.kind === 'renameQuery') return p.target === anti() && !NAMES.includes(p.name) ? true : x.oops(p.target === anti() ? 'Anti-jointure conservée comme table finale' : '', 'Garde le nom de cette requête.');
          if (p.kind === 'load') { if (p.on) return x.oops('Anti-jointure conservée comme table finale'); return p.target === anti() ? true : x.oops('', 'Règle seulement la vue temporaire.'); }
          if (p.kind === 'add' && p.op === 'distinct') return x.oops('Doublons supprimés pour retrouver huit lignes');
          if (STEPK.includes(p.kind)) return x.oops('', 'Pas de transformation : la vue sert au diagnostic.');
        }
      });
      await K2.num(x, 'Lis la vue anti-jointure.', [{ id: 'l', label: 'Lignes' }], v => v.l === 2 ? true : ['', 'Lis la barre d’état.']);
      await K2.ask(x, 'J004 y figure-t-il ?', [{ t: 'Non : il a deux correspondances, pas zéro', ok: true }, { t: 'Oui, il devrait', err: 'J004 attendu dans l’anti-jointure' }]);
      await K2.ask(x, 'J007 et J008 sont-ils tous les dossiers à revoir ?', [{ t: 'Non : il faut y ajouter J004, l’ambigu', ok: true }, { t: 'Oui', err: 'Liste de deux lignes considérée comme totalité des dossiers à revoir' }]);
      await x.pixel('L’ambiguïté se retrouve par le comptage : une vue du diagnostic, filtrée sur plus d’une correspondance.');
      const onlyJ4 = T => !!T && T.rows.length === 1 && T.rows[0].ID_Intervention === 'J004';
      await K2.tmp(x, { src: D, flag: 'tmp209', kind: 'amb', ops: ['filter'],
        next: t => onlyJ4(K2.T(x, t.name)) ? true : ['Filtre Nb_Correspondances : garde seulement les valeurs supérieures à 1.', ['[data-q="flt:Nb_Correspondances"]']],
        tries: (p, t) => {
          if (p.kind === 'add' && p.op === 'distinct') return x.oops('Doublons supprimés pour retrouver huit lignes');
          if (p.kind === 'add' && p.op === 'filter') { const S = K2.simulate(x, t, p.step); return onlyJ4(S.table) ? true : x.oops('', 'Garde seulement les interventions à plusieurs correspondances : Nb_Correspondances supérieur à 1.'); }
        } });
      await x.pixel('Réconcilions enfin le résultat enrichi : une vue regroupée par statut, avec le nombre d’interventions et la somme du coût HT.');
      const rec = () => tmps(P()).find(q => q.tmp209 === 'rec');
      await K2.tmp(x, { src: E, flag: 'tmp209', kind: 'rec', ops: ['group'],
        next: t => t.steps.some(s => s.op === 'group') ? true : ['Transformer › Regrouper par, Avancé : Statut_Rapprochement ; Nombre (Nombre de lignes) et Cout_HT_Total (Somme de Cout_HT).', ['[data-q="hd:Statut_Rapprochement"]', '[data-q="tab:Transformer"]', '[data-q="cmd:group"]', 'input[name="gm"][value="a"]', '[data-d="ok"]']],
        tries: (p, t) => {
          if (p.kind === 'add' && p.op === 'distinct') return x.oops('Doublons supprimés pour retrouver huit lignes');
          if (p.kind !== 'add' || p.op !== 'group') return;
          const s = p.step, ag = k => s.aggs.find(a => a.as === k);
          if (s.keys.join() !== 'Statut_Rapprochement') return x.oops('', 'Regroupe par Statut_Rapprochement.');
          if (!s.aggs.some(a => a.op === 'count')) return x.oops('', 'Ajoute le nombre de lignes.');
          if (!ag('Cout_HT_Total') || ag('Cout_HT_Total').op !== 'sum' || ag('Cout_HT_Total').col !== 'Cout_HT') return x.oops('', 'Ajoute Cout_HT_Total : Somme de Cout_HT.');
          return true;
        } });
      await K2.num(x, 'Lis Cout_HT_Total dans le regroupement.', [{ id: 'u', label: 'Correspondances uniques', unit: '€' }, { id: 't', label: 'Total des quatre statuts', unit: '€' }], v => {
        if (v.t === 1100) return ['Total limité à 1100 €'];
        return v.u === 1100 && v.t === 2200 ? true : ['', 'Lis Cout_HT_Total sur chaque ligne du regroupement, puis additionne les quatre.'];
      });
      await K2.ask(x, 'J007 n’a ni attraction, ni zone, ni responsable. Et son coût ?', [{ t: '400 €, comme dans la source', ok: true }, { t: '0 € : il n’est pas décrit', err: 'Nulls descriptifs transformés en coût nul' }]);
      /* Comparaison par identifiant : source et résultat, côte à côte */
      const S = K2.T(x, I), F = K2.T(x, E), by = {};
      (F ? F.rows : []).forEach(r => { by[r.ID_Intervention] = r; });
      const m = v => (v === null || v === undefined ? '—' : esc(K2.n(Math.round(v))));
      x.app('rec209', K.lesson('Réconciliation', 'Chaque intervention, avant et après la fusion', `<table class="tbl" style="width:100%"><thead><tr><th><span class="thc">ID</span></th><th style="text-align:right"><span class="thc">HT source</span></th><th style="text-align:right"><span class="thc">HT final</span></th><th><span class="thc">Statut</span></th></tr></thead><tbody>${(S ? S.rows : []).map(r => { const f = by[r.ID_Intervention] || {}; return `<tr><td>${esc(r.ID_Intervention)}</td><td style="text-align:right">${m(r.Cout_HT)}</td><td style="text-align:right">${m(f.Cout_HT)}</td><td><small>${esc(fr(f.Statut_Rapprochement || '—'))}</small></td></tr>`; }).join('')}</tbody></table>`));
      await K2.ask(x, 'Comparer les deux totaux aurait-il suffi ?', [{ t: 'Non : deux écarts peuvent se compenser. On compare aussi chaque identifiant', ok: true }, { t: 'Oui : 2 200 € des deux côtés', err: 'Somme seule contrôlée' }]);
      await K2.ask(x, 'EQ05 n’a aucune intervention. En manque-t-il une ?', [{ t: 'Pas forcément : l’échantillon peut ne pas en contenir', ok: true }, { t: 'Oui, il en manque une', err: 'EQ05 considéré comme intervention manquante certaine' }]);
      await K2.ask(x, 'Que deviennent les vues anti-jointure et ambiguïté ?', [{ t: 'Des vues de diagnostic, pas la table finale', ok: true }, { t: 'L’anti-jointure remplace la table enrichie', err: 'Anti-jointure conservée comme table finale' }]);
      x.app('pbi');
      await x.ok('Deux absences par l’anti-jointure, une ambiguïté par le comptage, huit interventions et 2 200 € HT, identifiant par identifiant.');
    }, avance: SET(6) },

    /* 8 — Sauvegarder un enrichissement explicable */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('oscar', 'Nous savons maintenant quels dossiers peuvent être décrits, et lesquels nécessitent une investigation.');
      await x.say('victoria', 'Conservez cet état. Je veux retrouver les mêmes événements et les mêmes montants à la prochaine ouverture.');
      const look = n => K2.work(x, { cur: n, next: () => K2.shown(x, n) ? true : K2.showTodo(x, n) });
      await look(E);
      await K2.num(x, `État de ${E}.`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 8 && v.c === 11 ? true : ['', 'Lis la barre d’état.']);
      await look(LIB);
      await K2.num(x, 'Registre principal de mai 2026.', [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 1099 && v.c === 29 ? true : v.l === 1107 ? ['Atelier ajouté au registre principal'] : ['', 'Le registre n’a pas bougé : lis sa barre d’état.']);
      await look(ANN);
      await K2.num(x, 'Atelier annuel de la mission 208.', [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 96 && v.c === 11 ? true : ['', 'Lis sa barre d’état.']);
      await K2.ask(x, 'Corrige-t-on le référentiel brut en retirant la ligne EQ04 de Malik ?', [{ t: 'Non : sans confirmation, la source reçue reste telle quelle', ok: true }, { t: 'Oui, pour que la fusion soit propre', err: 'Référentiel brut corrigé sans preuve' }]);
      await K2.ask(x, 'Victoria : « Qu’est-ce qui prouve que l’enrichissement est fiable ? »', [{ t: 'Les contrôles constatés : 8 interventions, 2 200 € HT, 5 statuts uniques et 3 dossiers ouverts', ok: true }, { t: 'La fusion s’est exécutée sans erreur', err: 'Réussite déclarée sans contrôle' }]);
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M209', cur: E,
        work: { loadErr: 'Résultat enrichi chargé', overErr: 'Checkpoint 110 écrasé', fileErr: 'Tables historiques modifiées', delErr: 'Diagnostic perdu',
          delQuery: p => p.target.tmp209 ? true : false },
        pre: () => {
          const t = tmps(P())[0];
          if (t) { if (!pbi.q2El) return ['Rouvre l’éditeur Power Query pour ranger les vues temporaires.', ['[data-a="cmd:transform"]']]; return [`Les preuves sont relevées : supprime la vue temporaire ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']]; }
          return true;
        }
      });
      x.app('ctl209', K.lesson('Contrôle final', 'Un enrichissement explicable, à part du reste', `${K2.facts([[8, 'interventions dans atelier_M209_Enrichi, non chargée'], ['2 200 €', 'HT, comme dans la source'], [3, 'dossiers ouverts : J004, J007, J008'], ['1 099', 'lignes au registre de mai, inchangé']])}${K2.card110(P())}`));
      await x.ok('Copie M209 enregistrée. Les événements et les montants sources sont intacts, chaque dossier ouvert reste expliqué, et le rapport du conseil n’a pas bougé.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'connexions', n: 'Lundi 8 juin, 15 h 10. Les huit interventions restent visibles. Cinq ont une description issue d’une correspondance unique ; trois portent un statut d’investigation.' },
    { card: { k: E, h: '8 interventions · 2 200 € HT', chips: ['5 correspondances uniques', 'J004 · ambigu', 'J007 · code inconnu', 'J008 · clé absente'] } },
    { p: 'gabriel', t: 'Le total est revenu à 2 200 €. Et les 2 450 € venaient seulement d’une ligne répétée.' },
    { p: 'pixel', t: 'Une jointure peut créer un écart financier apparent sans changer un seul montant de la source.' },
    { wait: 600 }
  ],
  recompense: { titre: 'Correspondances maîtrisées !', sous: 'Huit interventions, aucune répétée, trois dossiers ouverts et expliqués.', badge: 'b209', badgeNom: 'Enquêteur des correspondances', objet: 'tableau-connexions' },
  fiches: [
    ['Rôles et clés', 'Que définir avant une fusion ?', 'Le rôle de chaque table et la clé qui les relie. Une table d’événements et un référentiel n’ont pas le même rôle.'],
    ['Clés répétées', 'Une clé répétée est-elle une erreur ?', 'Pas dans une table d’événements. Dans le référentiel qui enrichit, en revanche, elle doit être unique.'],
    ['Externe gauche', 'Que garantit une jointure externe gauche ?', 'Elle garde toutes les lignes de gauche, mais n’empêche pas leur répétition au développement.'],
    ['Compter', 'Pourquoi compter les correspondances avant de développer ?', 'Pour distinguer l’absence, le résultat unique et l’ambiguïté.'],
    ['Trois causes', 'Clé absente, code inconnu, référentiel ambigu : même problème ?', 'Non. Ce sont trois causes différentes, à signaler séparément.'],
    ['Enrichir sans deviner', 'Comment enrichir sans attribuer une description incertaine ?', 'En construisant une seule description par événement : les cas non résolus restent, avec des attributs vides et leur statut.'],
    ['Réconcilier', 'Que vérifie un rapprochement réussi ?', 'Les absences, les ambiguïtés, le nombre d’événements et leurs montants, identifiant par identifiant.'],
    ['Fusion ou relation', 'Une fusion Power Query est-elle une relation du modèle ?', 'Non. La fusion transforme une préparation ; une relation relie des tables du modèle.']
  ],
  suiteTitre: 'Lundi, 15 h 30',
  suite: [
    { bg: 'reunion', n: 'Oscar regarde le panneau des requêtes. Victoria dépose un dossier au centre du bureau.' },
    { p: 'oscar', t: 'Nous avons appris à structurer, diagnostiquer, normaliser, ajouter et fusionner. Mais saurons-nous tout enchaîner dans une préparation complète, sans perdre le fil ?' },
    { p: 'victoria', t: 'Ce sera votre épreuve de fin de module. Je veux une chaîne de préparation claire, reproductible et contrôlée.' },
    { card: { k: 'Le parcours', h: 'Sources › Structure › Qualité › Transformations › Contrôles › Décision' } },
    { p: 'pixel', t: 'La finale ne consistera pas à faire disparaître toutes les erreurs à l’écran. Il faudra démontrer ce qui est exploitable, ce qui reste incertain, et pourquoi.' }
  ],
  accroche: 'Deux fichiers, une clé, un responsable en double : enrichir sans perdre ni répéter une seule intervention.',
  fin(P) { EX8(P); }
};
window.PBQ.mission(def);
})();

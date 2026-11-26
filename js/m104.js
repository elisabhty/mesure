/* Mission 104 — Les portes du parc */
(function () {
'use strict';
const { h, esc, fr, $, $$, clone, D, toast, nfmt } = window.PBQ;
const PBI = () => window.PBI;
const ev = q => PBI().evalQuery(q);
const colT = (T, n) => (T.cols.find(c => c.n === n) || {}).t;
const vals = (T, n) => T.rows.map(r => r[n]);
const errs = T => T.rows.reduce((a, r) => a + T.cols.filter(c => r[c.n] && typeof r[c.n] === 'object' && r[c.n].err).length, 0);
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const TN = { text: 'Texte', int: 'Nombre entier', dec: 'Nombre décimal', fixed: 'Nombre décimal fixe', date: 'Date', time: 'Heure', datetime: 'Date/Heure', bool: 'Vrai/Faux' };

/* ───────── Laboratoire ───────── */
const LAB = 'Laboratoire de Pixel';
const txt = n => ({ n, t: 'text' });
function labPortiques(k) {
  const q = { name: 'Labo_Portiques', kind: 'lab', file: 'lab_104_portiques',
    cols: ['Code_Portique', 'Capacite_Minute', 'Temperature_C', 'Cout_Intervention', 'Date_Controle', 'Heure_Controle', 'Horodatage', 'Ouvert'].map(txt),
    data: [
      { Code_Portique: '007', Capacite_Minute: '12', Temperature_C: '21,75', Cout_Intervention: '39,9900', Date_Controle: '05/06/2026', Heure_Controle: '09:25:14', Horodatage: '05/06/2026 09:25:14', Ouvert: 'TRUE' },
      { Code_Portique: '008', Capacite_Minute: '15', Temperature_C: '23,50', Cout_Intervention: '120,1250', Date_Controle: '05/06/2026', Heure_Controle: '10:12:03', Horodatage: '05/06/2026 10:12:03', Ouvert: 'FALSE' },
      { Code_Portique: '009', Capacite_Minute: '10', Temperature_C: '22,25', Cout_Intervention: '85,4567', Date_Controle: '05/06/2026', Heure_Controle: '11:15:22', Horodatage: '05/06/2026 11:15:22', Ouvert: 'TRUE' }
    ],
    steps: [{ op: 'source', name: 'Source' }, { op: 'type', name: 'Type modifié', auto: true, changes: [['Code_Portique', 'int']] }] };
  if (k >= 1) q.steps[1] = { op: 'type', name: 'Type modifié', changes: [['Code_Portique', 'text']] };
  if (k >= 2) q.steps.push({ op: 'type', name: 'Type modifié 1', changes: [['Capacite_Minute', 'int'], ['Temperature_C', 'dec'], ['Cout_Intervention', 'fixed']] });
  if (k >= 3) q.steps.push({ op: 'type', name: 'Type modifié 2', changes: [['Date_Controle', 'date'], ['Heure_Controle', 'time'], ['Horodatage', 'datetime']] });
  if (k >= 4) q.steps.push({ op: 'type', name: 'Type modifié 3', changes: [['Ouvert', 'bool']] });
  return q;
}
function labLocale(k) {
  const q = { name: 'Labo_Regional', kind: 'lab', file: 'lab_104_locale', cols: ['ID', 'Date_FR', 'Date_US', 'Montant_FR', 'Montant_US'].map(txt),
    data: [
      { ID: 'L001', Date_FR: '05/06/2026', Date_US: '06/05/2026', Montant_FR: '1234,56', Montant_US: '1,234.56' },
      { ID: 'L002', Date_FR: '13/06/2026', Date_US: '06/13/2026', Montant_FR: '2500,75', Montant_US: '2,500.75' },
      { ID: 'L003', Date_FR: '21/06/2026', Date_US: '06/21/2026', Montant_FR: '89,90', Montant_US: '89.90' }
    ], steps: [{ op: 'source', name: 'Source' }] };
  if (k >= 5) q.steps.push(
    { op: 'type', name: 'Type modifié avec paramètres régionaux', changes: [['Date_FR', 'date', 'fr-FR'], ['Montant_FR', 'fixed', 'fr-FR']] },
    { op: 'type', name: 'Type modifié avec paramètres régionaux 1', changes: [['Date_US', 'date', 'en-US'], ['Montant_US', 'fixed', 'en-US']] });
  return q;
}
function labErreurs(k) {
  const q = { name: 'Labo_Erreurs', kind: 'lab', file: 'lab_104_erreurs', cols: ['ID', 'Quantite_Brute', 'Date_Brute'].map(txt),
    data: [{ ID: 'T001', Quantite_Brute: '12', Date_Brute: '05/06/2026' }, { ID: 'T002', Quantite_Brute: 'N/A', Date_Brute: '06/06/2026' }, { ID: 'T003', Quantite_Brute: '8', Date_Brute: '31/06/2026' }, { ID: 'T004', Quantite_Brute: '15', Date_Brute: '07/06/2026' }],
    steps: [{ op: 'source', name: 'Source' }] };
  if (k >= 6) q.steps.push({ op: 'replace', name: 'Valeur remplacée', col: 'Quantite_Brute', from: 'N/A', to: '10' }, { op: 'replace', name: 'Valeur remplacée 1', col: 'Date_Brute', from: '31/06/2026', to: '30/06/2026' }, { op: 'type', name: 'Type modifié', changes: [['Quantite_Brute', 'int'], ['Date_Brute', 'date']] });
  return q;
}
/* Ouvre (ou retrouve) le laboratoire dans l'état attendu au début de l'exercice k */
function ensureLab(x, k, cur) {
  const pbi = x.pbi;
  if (!(pbi.pqs && pbi.pqLabel === LAB)) {
    const qs = [labPortiques(k)];
    if (k >= 4) qs.push(labLocale(k));
    if (k >= 5) qs.push(labErreurs(k));
    pbi.openPQ(qs, { label: LAB });
  }
  const pq = pbi.pqs;
  if (cur) {
    let i = pq.queries.findIndex(q => q.name === cur);
    if (i < 0) { pq.queries.push(cur === 'Labo_Regional' ? labLocale(k) : labErreurs(k)); i = pq.queries.length - 1; }
    if (pq.cur !== i) { pq.cur = i; pq.selStep = null; pq.selCol = null; pq.errSel = null; }
  }
  pbi.pqRender(); x.app('pbi');
  return pq;
}
const Q = (x, name) => x.pbi.pqs.queries.find(q => q.name === name);

/* Attente générique dans Power Query : refus des mauvaises conversions, validation sur l'état réel */
function pqWait(x, o) {
  const check = () => o.check();
  return x.wait(Object.assign({
    'pq.col': () => {}, 'pq.step': () => {}, 'pq.steps': () => {}, 'pq.err': () => {},
    'pq.query': i => o.query ? o.query(i) : x.oops('', 'Reste sur la requête de cet exercice.'),
    'pq.typeTry': p => o.tryType(p),
    'pq.type': check, 'pq.change': check, 'pq.replace': check, 'pq.filter': check,
    'pq.replaceTry': p => o.replaceTry ? o.replaceTry(p) : x.oops('', 'Aucune valeur ne doit être remplacée ici.'),
    'pq.replaceNoCol': () => x.oops('', 'Sélectionne d’abord une colonne.'),
    'pq.filterTry': p => o.filterTry ? o.filterTry(p) : undefined,
    'pq.delstep': p => o.delstep ? o.delstep(p) : undefined,
    'pq.cmd': c => o.cmd ? o.cmd(c) : x.oops('', 'Cette commande n’est pas nécessaire ici.'),
    'pq.close': () => o.close ? o.close() : x.oops('', 'Le laboratoire reste ouvert jusqu’à la fin de l’entraînement.'),
    'pq.apply': () => o.close ? o.close() : x.oops('', 'Le laboratoire reste ouvert jusqu’à la fin de l’entraînement.'),
    'dialog.cancel': () => {}
  }, o.extra || {}));
}

/* ───────── Projet réel ───────── */
const WANT = {
  tBilletterie: { ID_Vente: 'text', Date_Achat: 'date', Date_Visite: 'date', Type_Billet: 'text', Canal: 'text', Quantite: 'int', Prix_Unitaire: 'fixed', Montant_TTC: 'fixed' },
  Frequentation_Wonderland: { ID_Entree: 'text', ID_Billet: 'text', ID_Vente: 'text', Date_Entree: 'date', Heure_Entree: 'time', Portique: 'text', Zone_Entree: 'text' }
};
function fixQueries(P) {
  const qb = P.queries.find(q => q.id === 'qry_billetterie'), qf = P.queries.find(q => q.id === 'qry_frequentation');
  if (qb && !qb.steps.some(s => s.audit)) qb.steps.push({ op: 'type', name: 'Type modifié 1', audit: true, changes: [['Prix_Unitaire', 'fixed'], ['Montant_TTC', 'fixed']] });
  if (qf && !qf.steps.some(s => s.audit)) qf.steps.push({ op: 'type', name: 'Type modifié 1', audit: true, changes: [['Heure_Entree', 'time']] });
}
function applyQueries(P) {
  for (const q of P.queries) {
    const t = P.tables.find(t => t.id === q.tableId); if (!t) continue;
    const T = ev(q); t.cols = T.cols.map(c => ({ n: c.n, t: c.t === 'any' ? 'text' : c.t })); t.rows = T.rows;
  }
}
const FMT = {
  'tbl_billetterie.Prix_Unitaire': { style: 'currency', cur: 'EUR', dec: 2 },
  'tbl_billetterie.Montant_TTC': { style: 'currency', cur: 'EUR', dec: 2 },
  'tbl_billetterie.Quantite': { style: 'int', dec: 0 },
  'tbl_billetterie.Date_Achat': { pattern: 'fr' },
  'tbl_billetterie.Date_Visite': { pattern: 'fr' },
  'tbl_frequentation.Date_Entree': { pattern: 'fr' },
  'tbl_frequentation.Heure_Entree': { pattern: 'hms' }
};
const NEED = [
  ['tbl_billetterie.Prix_Unitaire', 'Prix_Unitaire en Monnaie, euros, deux décimales', f => f && f.style === 'currency' && f.cur === 'EUR' && f.dec === 2],
  ['tbl_billetterie.Montant_TTC', 'Montant_TTC en Monnaie, euros, deux décimales', f => f && f.style === 'currency' && f.cur === 'EUR' && f.dec === 2],
  ['tbl_billetterie.Date_Achat', 'Date_Achat au format jj/mm/aaaa', f => f && f.pattern === 'fr'],
  ['tbl_billetterie.Date_Visite', 'Date_Visite au format jj/mm/aaaa', f => f && f.pattern === 'fr'],
  ['tbl_frequentation.Date_Entree', 'Date_Entree au format jj/mm/aaaa', f => f && f.pattern === 'fr']
];

const def = {
  id: 104,
  objectifs: ['Choisir le bon type pour chaque colonne', 'Utiliser les paramètres régionaux et corriger les erreurs de conversion', 'Distinguer le type et le format d’affichage'],
  intro: [
    { bg: 'controle', n: '8 h 15. Dans l’atelier, Oscar teste un nouveau portique. L’écran affiche le code 007.' },
    { n: 'Il lance une simulation d’importation. Le numéro devient 7.' },
    { p: 'oscar', t: 'Ce portique possède le code 007. Pourquoi l’ordinateur affiche-t-il seulement 7 ?' },
    { n: 'Une donnée faite de chiffres n’est pas forcément un nombre à calculer. Une mauvaise interprétation peut modifier une information importante.' },
    { clear: 1, bg: 'pilotage', p: 'gabriel', t: '80 euros, 28 euros, 32 euros… Pourtant, ces montants sont bien des nombres ! Pourquoi je ne peux pas les additionner ?' },
    { p: 'pixel', t: 'Ils ressemblent à des nombres, mais ce fichier d’entraînement les a enregistrés comme du texte. Il faut convertir leur type avant de calculer.' },
    { p: 'gabriel', t: 'Dans ce cas, je veux que notre véritable projet soit entièrement vérifié avant la réunion avec Victoria.' },
    { card: { k: 'Dossier de test', h: 'Audit des types requis' } },
    { clear: 1, bg: 'bureau', p: 'pixel', t: 'Nous avons deux tables et quinze colonnes à vérifier. Mais d’abord, je vais te montrer comment fonctionnent les types dans un laboratoire.' },
    { card: { k: 'Deux espaces distincts', ul: ['Le laboratoire : tester des conversions, provoquer des erreurs et apprendre à les corriger.', 'Le projet Wonderland : n’appliquer que les modifications validées aux vraies données.'] } },
    { p: 'pixel', t: 'Dans le laboratoire, tu peux te tromper autant que tu veux. Nos vraies ventes et nos entrées restent protégées.' },
    { btn: 'Entrer dans le laboratoire' }
  ],
  leconTitre: 'Les types de données',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Chaque colonne a un type', `
      <table class="tbl" style="width:100%" data-types><thead><tr><th><span class="thc">Type</span></th><th><span class="thc">Exemple</span></th></tr></thead><tbody>
      ${[['Texte', '007'], ['Nombre entier', '27'], ['Nombre décimal', '12,75'], ['Nombre décimal fixe', '39,9900'], ['Date', '05/06/2026'], ['Heure', '09:25:14'], ['Date/Heure', '05/06/2026 09:25:14'], ['Vrai/Faux', 'Vrai']].map(r => `<tr style="opacity:.15; transition:opacity .4s"><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join('')}</tbody></table>
      <div data-sec="1" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · Texte ou nombre ?</div>
        <div class="seg" data-g="t"><button data-v="text" class="on">Texte</button><button data-v="int">Nombre entier</button></div>
        <div class="lc-big"><b data-o="t">007</b><span data-n="t">Le code d’origine est préservé.</span></div>
      </div>
      <div data-sec="2" style="display:none">
        <div class="lc-k" style="margin-top:16px">Trois types de nombres</div>
        <div class="flow-row"><div class="flow-box on"><b>27</b><small>Entier : une quantité</small></div><div class="flow-box on"><b>23,758</b><small>Décimal : une mesure</small></div><div class="flow-box on"><b>39,9900</b><small>Décimal fixe : un montant</small></div></div>
      </div>
      <div data-sec="3" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · Type ou format ?</div>
        <p class="lc-note" style="margin-top:4px">Valeur stockée : 39,9900 (décimal fixe)</p>
        <div class="seg" data-g="f"><button data-v="2">Deux décimales</button><button data-v="eur">Devise EUR</button><button data-v="0">Sans décimale</button><button data-v="4">Quatre décimales</button></div>
        <div class="lc-big"><b data-o="f">39,99</b><span>valeur affichée</span></div>
        <p class="lc-note">Valeur utilisée dans un calcul × 2 : <b>79,98</b>, quel que soit l’affichage.</p>
      </div>`);
    x.app('lecon', card);
    const scroll = () => card.firstElementChild.scrollTo({ top: 9999, behavior: 'smooth' });
    $$('[data-g] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.' + b.parentElement.dataset.g, b.dataset.v)));
    await x.pixel('Dans Power BI, chaque colonne possède un type de données.');
    await x.pixel('Ce type détermine les opérations possibles sur ses valeurs : additionner, comparer des dates, filtrer un état…');
    for (const tr of $$('[data-types] tbody tr', card)) { tr.style.opacity = 1; await x.pause(260); }
    await x.pixel('Il en existe d’autres, comme Durée ou Binaire : on les verra dans les modules avancés.');
    $('[data-sec="1"]', card).style.display = ''; scroll();
    await x.pixel('Premier piège : un code fait uniquement de chiffres.');
    x.todo('Passe le code 007 en Nombre entier pour voir ce qu’il devient.');
    x.target($('[data-g="t"] [data-v="int"]', card));
    const setT = v => { $$('[data-g="t"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === v)); $('[data-o="t"]', card).textContent = v === 'int' ? '7' : '007'; $('[data-n="t"]', card).textContent = v === 'int' ? 'Les zéros initiaux ont disparu.' : 'Le code d’origine est préservé.'; };
    await x.wait({ 'lab.t': v => { setT(v); if (v === 'int') return true; } });
    x.untarget();
    await x.pixel('Les zéros ont disparu ! Un numéro de portique, de téléphone ou un code postal ne représente pas une quantité.');
    await x.pixel('Et attention : reconvertir 7 en texte ne redonne pas 007. Il faut revenir à la valeur source.');
    setT('text');
    $('[data-sec="2"]', card).style.display = ''; scroll();
    await x.say('gabriel', 'Pourquoi ne pas utiliser le même type pour tous nos nombres ?');
    await x.pixel('Parce qu’on ne manipule pas les mêmes informations. Un nombre de billets est entier. Une température peut avoir des décimales.');
    await x.pixel('Et un montant financier demande une précision maîtrisée : le décimal fixe garde quatre décimales, sans petits écarts de calcul.');
    $('[data-sec="3"]', card).style.display = ''; scroll();
    await x.pixel('Dernier point : ne confonds pas la valeur stockée et la façon dont elle s’affiche.');
    x.todo('Choisis l’affichage Sans décimale et regarde le calcul.');
    x.target($('[data-g="f"] [data-v="0"]', card));
    const show = { 2: '39,99', eur: '39,99 €', 0: '40', 4: '39,9900' };
    await x.wait({ 'lab.f': v => { $$('[data-g="f"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === v)); $('[data-o="f"]', card).textContent = show[v]; if (v === '0') return true; } });
    x.untarget();
    await x.ok('Affichée 40, la valeur reste 39,99 dans les calculs. Le format ne remplace ni une conversion ni un arrondi.');
  },

  exs: [
    /* 1 — Le portique 007 */
    { async run(x) {
      await x.say('oscar', 'Chaque portique possède un code unique. Les zéros au début du code sont importants pour notre système de maintenance.');
      await x.pixel('Ouvrons le laboratoire dans Power Query. Une détection automatique a déjà converti les codes…');
      const pq = ensureLab(x, 0);
      const q = Q(x, 'Labo_Portiques');
      x.todo('Rends ses zéros à Code_Portique en lui donnant le bon type.');
      x.guide('[data-a="pqtype:Code_Portique"]');
      const BAD = { int: 'Nombre entier', dec: 'Nombre décimal', fixed: 'Nombre décimal fixe', date: 'Date', bool: 'Vrai/Faux' };
      await pqWait(x, {
        tryType: ({ col, type }) => {
          if (col !== 'Code_Portique') return x.oops('', 'Concentre-toi sur Code_Portique pour l’instant.');
          if (type !== 'text') return x.oops(BAD[type] || '', 'Ce type ne correspond pas à un code.');
        },
        check: () => {
          const T = ev(q);
          if (colT(T, 'Code_Portique') === 'text' && eq(vals(T, 'Code_Portique'), ['007', '008', '009'])) return true;
          if (colT(T, 'Code_Portique') === 'text' && eq(vals(T, 'Code_Portique'), ['7', '8', '9'])) {
            x.oops('Valeurs 7, 8 et 9 reconverties en texte');
            setTimeout(() => x.todo('Supprime les étapes de conversion (×) pour revenir aux valeurs brutes.'), 2400);
          }
        },
        replaceTry: ({ col }) => col === 'Code_Portique' ? x.oops('Modification manuelle d’un code') : x.oops('', 'Aucune valeur ne doit être modifiée.'),
        cmd: c => c === 'cols' ? x.oops('Suppression de la colonne') : x.oops('', 'Cette commande n’est pas nécessaire ici.')
      });
      x.guide();
      await x.ok('007, 008, 009 : les codes sont intacts. Le voyant du portique repasse au vert.');
    } },

    /* 2 — Les nombres de Gabriel */
    { async run(x) {
      ensureLab(x, 1, 'Labo_Portiques');
      const q = Q(x, 'Labo_Portiques');
      await x.say('gabriel', 'J’ai trois informations à analyser : la capacité d’un portique, sa température et le coût de son entretien.');
      await x.say('gabriel', 'Elles sont toutes numériques, mais je ne sais pas quel type utiliser.');
      await x.pixel('Choisissons un type adapté à chacune. Le laboratoire lit les virgules à la française.');
      const want = { Capacite_Minute: 'int', Temperature_C: 'dec', Cout_Intervention: 'fixed' };
      const left = () => Object.keys(want).filter(n => colT(ev(q), n) !== want[n]);
      const todo = () => { const l = left(); x.todo(l.length === 3 ? 'Donne le bon type à Capacite_Minute, Temperature_C et Cout_Intervention.' : `Encore ${l.length === 1 ? 'une colonne' : l.length + ' colonnes'} : ${l.join(', ')}.`); x.guide(`[data-a="pqtype:${l[0]}"]`); };
      todo();
      const ERR = {
        Capacite_Minute: { text: 'Capacité en Texte', dec: 'Capacité en Nombre décimal' },
        Temperature_C: { int: 'Température en Nombre entier', text: 'Température en Texte' },
        Cout_Intervention: { int: 'Coût en Nombre entier', dec: 'Coût en Nombre décimal', text: 'Coût transformé en texte avec €' }
      };
      await pqWait(x, {
        tryType: ({ col, type }) => {
          if (!want[col]) return x.oops('', col === 'Code_Portique' ? 'Code_Portique est déjà correct : il reste en Texte.' : 'Cette colonne viendra plus tard.');
          if (type !== want[col]) return x.oops((ERR[col] || {})[type] || '', 'Ce type ne correspond pas à cette information.');
        },
        check: () => {
          const T = ev(q);
          if (Object.keys(want).every(n => colT(T, n) === want[n]) && !errs(T)) {
            const cap = vals(T, 'Capacite_Minute').reduce((a, b) => a + b, 0);
            const cost = vals(T, 'Cout_Intervention').reduce((a, b) => a + Math.round(b * 1e4), 0);
            if (cap === 37 && cost === 2455717) return true;
          }
          todo();
        },
        replaceTry: ({ col }) => col === 'Cout_Intervention' ? x.oops('Arrondi prématuré à deux décimales') : x.oops('', 'Aucune valeur ne doit être modifiée.')
      });
      x.guide();
      const ctl = K.lesson('Contrôle technique du laboratoire', 'Les nombres sont prêts', `<div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b class="num" style="font-size:26px">37</b><small>Capacité totale, en passages par minute</small></div><div class="flow-box on"><b class="num" style="font-size:26px">245,5717${' '}€</b><small>Coût total des interventions</small></div></div><p class="lc-note">Contrôles faits par le moteur du jeu : aucune mesure n’est créée dans le projet.</p>`);
      x.app('ctl104', ctl);
      await x.ok('Capacité totale : 37. Coût total : 245,5717 €, sans perdre une seule décimale.');
      x.app('pbi');
    } },

    /* 3 — Le temps s'arrête à Wonderland */
    { async run(x) {
      ensureLab(x, 2, 'Labo_Portiques');
      const q = Q(x, 'Labo_Portiques');
      await x.say('oscar', 'Je veux savoir quel jour le contrôle a eu lieu, à quelle heure, et à quel instant précis.');
      await x.say('oscar', 'Ces informations se ressemblent, mais elles ne répondent pas aux mêmes questions.');
      await x.pixel('Une date donne le jour, une heure le moment de la journée, et une date/heure réunit les deux.');
      const want = { Date_Controle: 'date', Heure_Controle: 'time', Horodatage: 'datetime' };
      const left = () => Object.keys(want).filter(n => colT(ev(q), n) !== want[n]);
      const todo = () => { const l = left(); x.todo(l.length === 3 ? 'Type Date_Controle, Heure_Controle et Horodatage.' : `Encore ${l.length === 1 ? 'une colonne' : l.length + ' colonnes'} : ${l.join(', ')}.`); x.guide(`[data-a="pqtype:${l[0]}"]`); };
      todo();
      const ERR = {
        Date_Controle: { text: 'Date_Controle en Texte', bool: 'Date_Controle en Vrai/Faux' },
        Heure_Controle: { text: 'Heure_Controle en Texte', int: 'Heure_Controle en Nombre entier' },
        Horodatage: { date: 'Horodatage en Date', time: 'Horodatage en Heure' }
      };
      await pqWait(x, {
        tryType: ({ col, type }) => {
          if (!want[col]) return x.oops('', 'Cette colonne est déjà traitée, ou viendra plus tard.');
          if (type !== want[col]) return x.oops((ERR[col] || {})[type] || '', 'Ce type ne correspond pas à cette information.');
        },
        check: () => { const T = ev(q); if (!left().length && !errs(T)) return true; todo(); }
      });
      x.guide();
      x.todo('Quel portique a été contrôlé le 5 juin 2026 à 10:12:03 ?');
      await x.ask('Contrôle du 5 juin 2026 à 10:12:03 : quel portique ?', [{ t: 'Portique 007', err: 'Réponse 007' }, { t: 'Portique 008', ok: true }, { t: 'Portique 009', err: 'Réponse 009' }]);
      await x.ok('Le 008. Les neuf valeurs de temps sont bien interprétées.');
    } },

    /* 4 — Ouvert ou fermé ? */
    { async run(x) {
      ensureLab(x, 3, 'Labo_Portiques');
      const q = Q(x, 'Labo_Portiques');
      await x.say('oscar', 'Le portique 008 est fermé pour maintenance. Notre système transmet TRUE ou FALSE selon son état.');
      await x.pixel('Deux états logiques : c’est le rôle du type Vrai/Faux.');
      x.todo('Donne le bon type à la colonne Ouvert.');
      x.guide('[data-a="pqtype:Ouvert"]');
      const ERR = { text: 'Texte', int: 'Nombre entier', dec: 'Nombre décimal' };
      let phase = colT(ev(q), 'Ouvert') === 'bool' ? 1 : 0;
      const filtered = () => q.steps.some(s => s.op === 'filter');
      const go = () => { if (phase === 1) { x.todo('Filtre la colonne Ouvert pour ne garder que les portiques ouverts.'); x.guide('[data-a="pqfilter:Ouvert"]'); } };
      go();
      await pqWait(x, {
        tryType: ({ col, type }) => {
          if (col !== 'Ouvert') return x.oops('', 'Seule la colonne Ouvert est concernée.');
          if (type !== 'bool') return x.oops(ERR[type] || '', 'Ce type ne représente pas un état ouvert ou fermé.');
        },
        filterTry: ({ keep }) => {
          if (phase === 0) return x.oops('', 'Convertis d’abord la colonne en Vrai/Faux.');
          if (keep.length === 1 && keep[0] === false) return x.oops('Filtre sur Faux');
          if (!(keep.length === 1 && keep[0] === true)) return x.oops('', 'Ne garde que la valeur TRUE.');
        },
        check: () => {
          const T = ev(q);
          if (phase === 0 && colT(T, 'Ouvert') === 'bool') { phase = 1; go(); return; }
          if (phase === 1 && filtered() && eq(vals(T, 'Code_Portique'), ['007', '009'])) { phase = 2; return true; }
          if (phase === 3 && !filtered() && T.rows.length === 3 && eq(vals(T, 'Ouvert'), [true, false, true])) return true;
        },
        delstep: ({ step }) => { if (step.op !== 'filter') return x.oops('', 'Garde cette étape de conversion.'); },
        cmd: c => c === 'rows' ? x.oops('Suppression de 008') : x.oops('', 'Cette commande n’est pas nécessaire ici.')
      });
      x.guide();
      await x.ask('Quels portiques sont ouverts ?', [{ t: '007 et 009', ok: true }, { t: '008', err: 'Sélection de 008' }, { t: 'Deux visiteurs sont entrés', err: 'TRUE considéré comme un nombre de visiteurs' }]);
      phase = 3;
      x.todo('Retire maintenant le filtre (×) pour restaurer les trois lignes.');
      x.pbi.mark('.step .x');
      await pqWait(x, {
        tryType: () => x.oops('', 'Les types sont bons : retire seulement le filtre.'),
        filterTry: () => x.oops('Filtre non retiré'),
        check: () => { const T = ev(q); if (!filtered() && T.rows.length === 3 && eq(vals(T, 'Ouvert'), [true, false, true])) return true; },
        delstep: ({ step }) => { if (step.op !== 'filter') return x.oops('', 'Supprime uniquement l’étape Lignes filtrées.'); },
        cmd: c => c === 'rows' ? x.oops('Suppression de 008') : x.oops('Filtre non retiré')
      });
      x.pbi.mark();
      await x.ok('Les trois portiques sont de retour. 007 et 009 laissent passer les visiteurs, 008 reste en maintenance.');
    } },

    /* 5 — Le casse-tête international */
    { async run(x) {
      await x.say('lola', 'Un partenaire américain m’a envoyé des données de test. Les dates et les montants ne sont pas écrits comme chez nous.');
      await x.say('lola', 'Pourtant, nous parlons des mêmes chiffres !');
      const card = K.lesson('Expérience', 'Comment lire 05/06/2026 ?', `
        <div class="seg" data-g="l"><button data-v="fr" class="on">France</button><button data-v="us">États-Unis</button></div>
        <div class="lc-big"><b data-o="d">5 juin 2026</b><span data-o="r">Jour / Mois / Année</span></div>
        <p class="lc-note" data-o="n">Et 13/06/2026 ? Le 13 juin 2026.</p>`);
      x.app('loc', card);
      $$('[data-g="l"] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.l', b.dataset.v)));
      const setL = v => { $$('[data-g="l"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === v)); $('[data-o="d"]', card).textContent = v === 'us' ? '6 mai 2026' : '5 juin 2026'; $('[data-o="r"]', card).textContent = v === 'us' ? 'Mois / Jour / Année' : 'Jour / Mois / Année'; $('[data-o="n"]', card).textContent = v === 'us' ? 'Et 13/06/2026 ? Erreur : il n’y a pas de 13e mois.' : 'Et 13/06/2026 ? Le 13 juin 2026.'; };
      await x.pixel('Power Query peut lire une valeur selon les conventions d’un pays : ce sont les paramètres régionaux.');
      x.todo('Compare les deux lectures de la même date.');
      x.target($('[data-g="l"] [data-v="us"]', card));
      await x.wait({ 'lab.l': v => { setL(v); if (v === 'us') return true; } });
      x.untarget();
      await x.pixel('Une mauvaise configuration peut donner une erreur visible… ou une date valide mais fausse. La seconde est la plus dangereuse.');
      ensureLab(x, 4, 'Labo_Regional');
      const q = Q(x, 'Labo_Regional');
      const want = { Date_FR: 'date', Date_US: 'date', Montant_FR: 'fixed', Montant_US: 'fixed' };
      const left = () => Object.keys(want).filter(n => colT(ev(q), n) !== want[n]);
      const todo = () => { const l = left(); x.todo(l.length === 4 ? 'Convertis les quatre colonnes avec les bons paramètres régionaux.' : `Encore ${l.length === 1 ? 'une colonne' : l.length + ' colonnes'} : ${l.join(', ')}.`); x.guide([`[data-a="pqtype:${l[0]}"]`, '.menu button:last-child']); };
      todo();
      await pqWait(x, {
        tryType: ({ col, type, loc }) => {
          const L = loc || 'fr-FR', us = L === 'en-US';
          if (!want[col]) return x.oops('', 'La colonne ID reste en texte.');
          if (type === 'text') return x.oops('Conversion en Texte');
          if (col === 'Date_FR') { if (type !== 'date') return x.oops('', 'Date_FR doit devenir une Date.'); if (us) return x.oops('Date_FR convertie avec en-US'); return; }
          if (col === 'Date_US') { if (type !== 'date') return x.oops('', 'Date_US doit devenir une Date.'); if (!loc) return x.oops('Date du 5 juin interprétée comme le 6 mai'); if (!us) return x.oops('Date_US convertie avec fr-FR'); return; }
          if (type !== 'fixed') return x.oops('', 'Pour des montants, choisis Nombre décimal fixe.');
          if (col === 'Montant_FR' && us) return x.oops('Montant_FR converti avec en-US');
          if (col === 'Montant_US' && !us) return x.oops('Montant_US converti avec fr-FR');
        },
        check: () => {
          const T = ev(q);
          if (!left().length && !errs(T) && eq(vals(T, 'Date_FR'), vals(T, 'Date_US')) && T.rows.every(r => Math.round(r.Montant_FR * 100) === Math.round(r.Montant_US * 100))) return true;
          todo();
        },
        replaceTry: () => x.oops('Remplacement global des virgules par des points'),
        cmd: c => c === 'rows' ? x.oops('Suppression des lignes en erreur') : x.oops('', 'Cette commande n’est pas nécessaire ici.')
      });
      x.guide();
      await x.ok('Les deux colonnes de dates et les deux colonnes de montants sont maintenant identiques, sans aucune erreur.');
    } },

    /* 6 — Les deux erreurs mystérieuses */
    { async run(x) {
      await x.say('gabriel', 'Le service exploitation a converti ses quantités et ses dates, mais Power Query affiche deux erreurs.');
      await x.say('gabriel', 'Peut-on simplement supprimer les lignes concernées ?');
      await x.pixel('Certainement pas sans comprendre ce qui s’est passé : on perdrait des informations utiles.');
      ensureLab(x, 5, 'Labo_Erreurs');
      const q = Q(x, 'Labo_Erreurs');
      const typed = () => { const T = ev(q); return colT(T, 'Quantite_Brute') === 'int' && colT(T, 'Date_Brute') === 'date'; };
      const typeIdx = () => q.steps.findIndex(s => s.op === 'type');
      let phase = typed() ? 1 : 0; const seen = new Set();
      const step = () => {
        if (phase === 0) { x.todo('Convertis Quantite_Brute en Nombre entier et Date_Brute en Date.'); x.guide('[data-a="pqtype:Quantite_Brute"]'); }
        else if (phase === 1) { x.todo('Touche chacune des deux cellules Error pour lire son détail.'); x.guide('.pq td.err'); }
        else { x.todo('Étape Source, puis Remplacer les valeurs sur les deux valeurs brutes.'); x.guide(['[data-q="step:0"]', '[data-q="cmd:replace"]']); }
      };
      step();
      await pqWait(x, {
        tryType: ({ col, type }) => {
          if (type === 'text') return x.oops('Conversion des colonnes en Texte pour masquer les erreurs');
          if (col === 'Quantite_Brute' && type !== 'int') return x.oops('', 'Une quantité de billets est un nombre entier.');
          if (col === 'Date_Brute' && type !== 'date') return x.oops('', 'Date_Brute doit devenir une Date.');
          if (col === 'ID') return x.oops('', 'La colonne ID reste en texte.');
        },
        check: () => {
          const T = ev(q);
          if (phase === 0 && typed()) { phase = 1; step(); return; }
          if (phase === 2 && typed() && !errs(T) && T.rows.length === 4 && eq(vals(T, 'Quantite_Brute'), [12, 10, 8, 15]) && eq(vals(T, 'Date_Brute'), ['2026-06-05', '2026-06-06', '2026-06-30', '2026-06-07'])) return true;
        },
        extra: {
          'pq.err': ({ row, c }) => {
            if (phase !== 1) return;
            seen.add(row.ID + '|' + c);
            if (seen.has('T002|Quantite_Brute') && seen.has('T003|Date_Brute')) { phase = 1.5; return true; }
          }
        },
        replaceTry: () => x.oops('', phase === 0 ? 'Convertis d’abord les colonnes pour voir les erreurs.' : 'Examine d’abord les deux cellules en erreur.'),
        cmd: c => c === 'rows' ? x.oops('Suppression de T002') : c === 'replace' ? x.oops('', 'Examine d’abord les deux cellules en erreur.') : x.oops('', 'Cette commande n’est pas nécessaire ici.')
      });
      x.guide();
      if (phase === 1.5) {
        await x.pixel('N/A n’est pas un entier, et le 31 juin n’existe pas. Ne devinons rien : demandons au service producteur.');
        toast('oscar', 'Justificatif COR-104', 'Corrections confirmées par l’exploitation');
        await x.say('oscar', 'Justificatif COR-104, après vérification du registre de maintenance :');
        await x.say('oscar', 'T002 : la quantité confirmée est de 10. T003 : la date correcte est le 30/06/2026.');
      }
      phase = 2; step();
      await pqWait(x, {
        tryType: ({ type }) => type === 'text' ? x.oops('Conversion des colonnes en Texte pour masquer les erreurs') : x.oops('', 'Les types sont bons : corrige les valeurs brutes.'),
        check: () => { const T = ev(q); if (typed() && !errs(T) && T.rows.length === 4 && eq(vals(T, 'Quantite_Brute'), [12, 10, 8, 15]) && eq(vals(T, 'Date_Brute'), ['2026-06-05', '2026-06-06', '2026-06-30', '2026-06-07'])) return true; },
        cmd: c => c === 'rows' ? x.oops('Suppression de T002') : c === 'replace' ? undefined : x.oops('', 'Cette commande n’est pas nécessaire ici.'),
        replaceTry: ({ col, from, to, at }) => {
          if (at >= typeIdx()) return x.oops('Correction après conversion sans traiter les cellules Error');
          const F = from.trim().toUpperCase(), T2 = to.trim();
          if (col === 'Quantite_Brute') {
            if (F !== 'N/A') return x.oops('', 'Dans cette colonne, seule la valeur N/A pose problème.');
            if (from.trim() !== 'N/A') return x.oops('', 'Écris la valeur exactement comme dans la cellule : N/A, en majuscules.');
            if (T2 === '0') return x.oops('Remplacement de N/A par zéro');
            if (T2 === '1') return x.oops('Remplacement arbitraire par 1');
            if (!T2 || /^null$/i.test(T2)) return x.oops('Remplacement des deux valeurs par null');
            if (T2 !== '10') return x.oops('', 'Utilise la valeur confirmée par Oscar.');
            return;
          }
          if (col === 'Date_Brute') {
            if (F !== '31/06/2026') return x.oops('', 'Dans cette colonne, seule la date 31/06/2026 pose problème.');
            if (T2 === '01/07/2026' || T2 === '1/07/2026') return x.oops('Remplacement du 31 juin par le 1er juillet');
            if (!T2 || /^null$/i.test(T2)) return x.oops('Remplacement des deux valeurs par null');
            if (T2 !== '30/06/2026') return x.oops('', 'Utilise la date confirmée par Oscar.');
            return;
          }
          return x.oops('', 'Cette colonne ne contient pas d’erreur.');
        },
        delstep: ({ step: s }) => s.op === 'type' ? x.oops('', 'Garde la conversion : corrige plutôt les valeurs avant elle.') : undefined
      });
      x.guide();
      await x.ok('4 lignes sur 4, 0 erreur, et une quantité totale de 45.');
      await x.pixel('Bravo ! Tu as corrigé les erreurs sans supprimer d’informations utiles. C’est exactement ce qu’on attend d’un Data Analyst.');
    } },

    /* 7 — L'audit des quinze colonnes */
    { async run(x) {
      const pbi = x.pbi;
      pbi.closePQ(true); pbi.closeDialog(true); x.app('pbi'); pbi.st.view = 'report'; pbi.render();
      await x.pixel('Fin de l’entraînement ! Place maintenant aux vraies données de Wonderland.');
      await x.say('victoria', 'Je veux pouvoir utiliser les données en toute confiance. Vérifie chaque champ, même ceux qui semblent déjà corrects.');
      x.todo('Ouvre Power Query depuis le ruban Accueil.');
      x.guide('[data-a="cmd:transform"]');
      await x.wait({ cmd: c => { if (c === 'transform') { pbi.openPQ(pbi.P.queries, { label: 'Wonderland_Pilotage' }); return true; } return x.oops('', 'Cherche Transformer les données.'); } });
      x.guide();
      const audited = new Set();
      const typeOk = () => pbi.P.queries.every(q => { const T = ev(q), w = WANT[q.name]; return Object.keys(w).every(n => colT(T, n) === w[n]) && !errs(T); });
      const todo = () => x.todo(audited.size < 15 ? `Audit : touche chaque en-tête et vérifie son type (${audited.size}/15).` : 'Il reste au moins une colonne au mauvais type. Corrige-la.');
      await x.pixel('Les deux requêtes sont là : tBilletterie et Frequentation_Wonderland. Passe les quinze colonnes en revue.');
      todo();
      const ERR = (q, c, t) => {
        if (/^ID_/.test(c) && ['int', 'dec', 'fixed'].includes(t)) return 'ID_Vente ou ID_Billet en numérique';
        if (c === 'Quantite' && t === 'text') return 'Quantite en Texte';
        if (c === 'Montant_TTC' && t === 'text') return 'Montant_TTC en Texte';
        if (c === 'Prix_Unitaire' && t === 'int') return 'Prix_Unitaire en Nombre entier';
        if (c === 'Date_Visite' && t === 'text') return 'Date_Visite en Texte';
        if (c === 'Heure_Entree' && t === 'date') return 'Heure_Entree en Date';
        return '';
      };
      await pqWait(x, {
        tryType: ({ col, type, query }) => {
          const w = (WANT[query] || {})[col];
          if (type === w) return;
          return x.oops(ERR(query, col, type), `${col} doit être de type ${TN[w]}.`);
        },
        check: () => { if (audited.size >= 15 && typeOk()) return true; todo(); },
        query: () => {},
        extra: { 'pq.col': ({ col, query }) => { audited.add(query + '|' + col); if (audited.size >= 15 && typeOk()) return true; todo(); } },
        replaceTry: ({ col }) => col === 'Zone_Entree' ? x.oops('Zone_Entree modifiée ou accents supprimés') : x.oops('', 'Aucune valeur ne doit être modifiée pendant cet audit.'),
        delstep: ({ step }) => step.auto ? x.oops('', 'Garde cette étape : elle type déjà correctement la plupart des colonnes.') : undefined,
        cmd: c => ['cols', 'rows', 'newsource'].includes(c) ? x.oops('Ajout d’une table, d’une relation ou suppression de lignes') : x.oops('', 'Cette commande n’est pas nécessaire ici.'),
        close: () => x.oops('', 'Termine d’abord l’audit des quinze colonnes.')
      });
      const ctl = K.lesson('Contrôle d’intégrité avant application', 'Rien n’a bougé dans les données', `<div class="flow-row"><div class="flow-box on"><b class="num">20</b><small>Lignes de vente</small></div><div class="flow-box on"><b class="num">40</b><small>Billets vendus</small></div><div class="flow-box on"><b class="num">1${' '}310${' '}€</b><small>Montant TTC</small></div></div><div class="flow-row" style="margin-top:8px"><div class="flow-box on"><b class="num">27</b><small>Entrées</small></div><div class="flow-box on"><b class="num">20</b><small>Ventes distinctes</small></div><div class="flow-box on"><b class="num">27</b><small>Entrées distinctes</small></div></div>`);
      x.app('integ', ctl);
      await x.ok('Quinze colonnes conformes, zéro erreur, 47 lignes conservées.');
      await x.pixel('Les montants n’ont pas encore de centimes, mais en décimal fixe ils pourront accueillir un futur tarif à 39,99 €.');
      x.app('pbi');
    }, avance: P => fixQueries(P) },

    /* 8 — Le certificat de fiabilité */
    { async run(x) {
      const pbi = x.pbi; x.app('pbi');
      if (!pbi.pqs) pbi.openPQ(pbi.P.queries, { label: 'Wonderland_Pilotage' });
      await x.say('gabriel', 'Pourquoi les prix n’apparaissent-ils pas avec le symbole euro ?');
      await x.pixel('Leur type numérique est bon. Il reste à transmettre les changements au modèle, puis à choisir leur format d’affichage.');
      x.todo('Transmets les transformations au modèle.');
      x.guide('[data-q="cmd:apply"]');
      await x.wait({
        'pq.apply': () => { pbi.applyPQ(); pbi.closePQ(); pbi.loading('Application des modifications aux deux tables…', 47); return true; },
        'pq.close': () => x.oops('Fermeture de Power Query sans appliquer'),
        'pq.col': () => {}, 'pq.query': () => {}, 'pq.step': () => {},
        'pq.typeTry': () => x.oops('', 'L’audit est terminé : applique les changements.'),
        'pq.cmd': () => x.oops('', 'Cherche Fermer et appliquer.')
      });
      x.guide();
      await x.wait({ 'load.done': () => true, 'load.cancel': () => x.oops('', 'Laisse l’application se terminer.') });
      const fiche = K.lesson('Fiche des formats', 'L’affichage attendu', `<table class="tbl" style="width:100%"><thead><tr><th><span class="thc">Champ</span></th><th><span class="thc">Format</span></th></tr></thead><tbody>
        ${[['Prix_Unitaire', 'Monnaie, euros, 2 décimales'], ['Montant_TTC', 'Monnaie, euros, 2 décimales'], ['Quantite', 'Nombre entier'], ['Date_Achat', 'jj/mm/aaaa'], ['Date_Visite', 'jj/mm/aaaa'], ['Date_Entree', 'jj/mm/aaaa'], ['Heure_Entree', 'hh:mm:ss']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>
        <p class="lc-note">Ces formats sont des propriétés d’affichage du modèle : les valeurs restent numériques ou temporelles.</p>`);
      x.app('fiche104', fiche);
      await x.pixel('Voici la fiche des formats. Quantite et Heure_Entree s’affichent déjà correctement : vérifie-les simplement.');
      await x.pixel('Pour le reste, ouvre la vue Table, sélectionne une colonne et utilise l’onglet Outils de colonne.');
      x.app('pbi');
      const F = () => pbi.P.formats;
      const left = () => NEED.filter(([k, , ok]) => !ok(F()[k]));
      const todo = () => { const l = left(); if (!l.length) return; x.todo(`Format suivant : ${l[0][1]} (${5 - l.length}/5).`); x.guide(pbi.st.view !== 'table' ? '[data-a="view:table"]' : ['[data-a="colfmt"]', '[data-a="colcur"]']); };
      todo();
      await x.wait({
        view: () => { setTimeout(todo, 0); }, 'table.select': () => {}, 'col.select': () => {}, tab: () => {},
        'col.format': ({ key, f }) => {
          if (f.style === 'currency' && f.cur === 'USD') { x.oops('Devise USD'); return; }
          if (f.pattern === 'frt') { x.oops('Date affichée avec une heure inutile'); return; }
          if (f.short) { x.oops('Heure sans les secondes'); return; }
          if (f.style === 'currency' && f.dec !== 2) { x.oops('', 'Deux décimales pour des montants en euros.'); return; }
          if (!left().length) return true;
          todo();
        },
        cmd: c => c === 'transform' ? x.oops('Montants transformés en texte') : undefined,
        save: () => x.oops('Sauvegarde avant application des changements'), 'file.menu': () => x.oops('Sauvegarde avant application des changements')
      });
      x.guide();
      const B = pbi.table('tbl_billetterie');
      await x.ask('Comment s’affiche maintenant le Montant_TTC de la vente B001 ?', [{ t: '80', msg: 'C’était l’affichage avant le format Monnaie.' }, { t: '80,00 €', ok: true }, { t: '80,0000 €', msg: 'Le format demande deux décimales.' }]);
      await x.pixel('B001 garde ses deux billets et ses 80 € ; E001 garde sa date du 1er juin et son passage à 09:05:12.');
      const P = () => pbi.P;
      const valid = () => pbi.st.view === 'report' && !P().dirty && P().tables.length === 2;
      const next = () => { if (pbi.st.view !== 'report') { x.todo('Reviens dans la vue Rapport, puis enregistre le projet.'); x.guide('[data-a="view:report"]'); } else { x.todo('Enregistre le projet Wonderland_Pilotage.'); x.guide('.pbi-save'); } };
      next();
      const save = () => { pbi.closeBackstage(); P().dirty = false; P().saved = true; pbi.render(); if (valid()) return true; next(); };
      await x.wait({
        view: v => { if (v === 'report') setTimeout(() => { if (valid()) PBQ.act('ok.state'); else next(); }, 0); },
        'ok.state': () => valid() ? true : undefined,
        save: () => save(), 'file.menu': () => {},
        file: k => k === 'back' ? undefined : k === 'save' ? save() : k === 'saveas' ? (pbi.closeBackstage(), pbi.saveAs({ name: 'Wonderland_Pilotage' }), undefined) : x.oops('', 'Utilise Enregistrer.'),
        saveas: ({ name, ext }) => { if (name !== 'Wonderland_Pilotage' || ext !== 'pbix') return x.oops('Enregistrement sous un autre nom'); pbi.closeDialog(); return save(); },
        'dialog.cancel': () => {}, 'col.format': () => {}
      });
      x.guide();
      await x.ok('Projet enregistré. Les deux tables sont fiables : types vérifiés, formats définis.');
    }, avance: P => { applyQueries(P); Object.assign(P.formats, clone(FMT)); P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'conseil', card: { k: 'Wonderland · Audit interne AUD-104', h: 'Certificat de conformité des types', ul: ['Colonnes conformes : 15 sur 15', 'Erreurs de conversion : 0', 'Lignes de vente préservées : 20 sur 20', 'Entrées préservées : 27 sur 27', 'Formats d’affichage définis, projet sauvegardé'] } },
    { p: 'gabriel', t: 'Nous pouvons maintenant utiliser nos montants pour des calculs financiers.' },
    { p: 'oscar', t: 'Et nos dates ainsi que nos heures de passage sont correctement reconnues.' },
    { p: 'victoria', t: 'Excellent travail. Je veux désormais voir nos premiers chiffres : combien de billets vendus, quelles recettes, combien d’entrées ?' },
    { p: 'pixel', t: 'Tu vois ? Tout ce travail va enfin nous permettre de commencer l’analyse.' },
    { clear: 1, bg: 'portiques', n: 'Les voyants des portiques passent au vert. Au-dessus du bâtiment administratif brille un bouclier doré : la fiabilité des données.' },
    { wait: 800 }
  ],
  recompense: { titre: 'Gardien des données !', sous: 'Tu as fiabilisé les quinze colonnes de Wonderland.', badge: 'b104', badgeNom: 'Gardien des données', objet: 'tableau-qualite' },
  fiches: [
    ['Le type Texte', 'Pourquoi un identifiant comme 007 doit-il parfois être de type Texte ?', 'Parce qu’il ne sert pas à calculer. En nombre, il deviendrait 7 et perdrait ses zéros initiaux.'],
    ['Trois types de nombres', 'Quel type pour une quantité, une température, un montant ?', 'Nombre entier, Nombre décimal, Nombre décimal fixe. Le décimal fixe garde quatre décimales : idéal pour l’argent.'],
    ['Date, Heure, Date/Heure', 'Quelle différence entre ces trois types ?', 'La date donne le jour, l’heure le moment de la journée, la date/heure réunit les deux dans une seule valeur.'],
    ['Vrai/Faux', 'Quel type pour un état ouvert ou fermé ?', 'Vrai/Faux, le type booléen : deux valeurs logiques, true et false.'],
    ['Paramètres régionaux', 'Comment lire 06/05/2026 venant des États-Unis ?', 'Modifier le type › Utiliser les paramètres régionaux › Anglais (États-Unis) : le mois vient d’abord, c’est donc le 5 juin.'],
    ['Erreur de conversion', 'Que faire d’une cellule Error ?', 'Lire son détail, comprendre la cause, puis corriger la valeur brute avant la conversion, sur une base vérifiée. Jamais supprimer à l’aveugle.'],
    ['Type ou format ?', '39,99 affiché « 40 » : la valeur a-t-elle changé ?', 'Non. Le format change l’affichage, pas la valeur stockée : les calculs utilisent toujours 39,99.'],
    ['Fermer et appliquer', 'Comment transmettre les transformations au modèle ?', 'Avec Fermer et appliquer : Power Query réévalue les requêtes et met à jour les tables existantes.']
  ],
  suite: [
    { bg: 'conseil', n: 'Le lendemain matin, Victoria a posé trois documents retournés sur la table de réunion.' },
    { p: 'victoria', t: 'Nos données sont disponibles et correctement typées. Maintenant, j’aimerais connaître trois chiffres essentiels.' },
    { card: { k: 'Les trois documents de Victoria', chips: ['Billets vendus : ?', 'Ventes TTC : ?', 'Entrées effectives : ?'] } },
    { p: 'victoria', t: 'Je veux obtenir ces chiffres directement à partir de notre rapport Power BI.' },
    { p: 'pixel', t: 'C’est le moment que nous attendions ! Power BI sait faire des calculs simples sans que tu écrives la moindre formule.' }
  ],
  accroche: 'Tu vérifieras les types des quinze colonnes, les paramètres régionaux et les erreurs de conversion, puis les formats d’affichage.',
  fin(P) { fixQueries(P); applyQueries(P); Object.assign(P.formats, clone(FMT)); P.dirty = false; P.saved = true; }
};
window.PBQ.mission(def);
})();

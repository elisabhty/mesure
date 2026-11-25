/* Mission 102 — Les billets d'entrée */
(function () {
'use strict';
const { h, esc, fr, $, $$, clone, D, toast } = window.PBQ;
const SRC = 'src_billetterie_20260606_v1';
const COLS = [['ID_Vente', 'text'], ['Date_Achat', 'date'], ['Date_Visite', 'date'], ['Type_Billet', 'text'], ['Canal', 'text'], ['Quantite', 'int'], ['Prix_Unitaire', 'int'], ['Montant_TTC', 'int']].map(([n, t]) => ({ n, t }));

/* Import canonique : source, connexion, requête et table du modèle */
function importBilletterie(P) {
  if (P.tables.some(t => t.id === 'tbl_billetterie')) return;
  P.sources.push({ id: SRC, fileName: 'Billetterie_Wonderland.xlsx', connector: 'Excel.Workbook', version: 1, service: 'Billetterie' });
  P.connections = (P.connections || []).concat({ id: 'conn_billetterie_001', sourceId: SRC, status: 'connected' });
  P.queries.push({ id: 'qry_billetterie', name: 'tBilletterie', tableId: 'tbl_billetterie', sourceId: SRC, objectName: 'tBilletterie', objectKind: 'Table', loadEnabled: true, kind: 'excel', file: 'Billetterie_Wonderland.xlsx',
    cols: COLS.map(c => ({ n: c.n, t: 'any' })), data: D.ventes,
    steps: [{ op: 'source', name: 'Source' }, { op: 'nav', name: 'Navigation', item: 'tBilletterie' }, { op: 'type', name: 'Type modifié', auto: true, changes: COLS.map(c => [c.n, c.t]) }] });
  P.tables.push({ id: 'tbl_billetterie', name: 'tBilletterie', queryId: 'qry_billetterie', sourceId: SRC, loadStatus: 'completed', cols: clone(COLS), rows: clone(D.ventes) });
}

/* Le classeur de Lola, tel que le Navigateur le présente */
function classeur() {
  const sheetVentes = [
    ['Ventes de billets — Wonderland', '', '', '', '', '', '', ''],
    ['Extraction du 06/06/2026', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    D.colsVentes.slice(),
    ...D.ventes.map(r => [r.ID_Vente, PBQ.dfr(r.Date_Achat), PBQ.dfr(r.Date_Visite), r.Type_Billet, r.Canal, r.Quantite, r.Prix_Unitaire, r.Montant_TTC])
  ];
  const asRaw = (rows, n) => ({ cols: Array.from({ length: n }, (_, i) => ({ n: 'Column' + (i + 1), t: 'text' })), rows: rows.map(r => Object.fromEntries(r.map((v, i) => ['Column' + (i + 1), v]))) });
  const tarifsSheet = [['Code_Tarif', 'Type_Billet', 'Prix_TTC'], ...D.tarifs.map(t => [t.Code_Tarif, t.Type_Billet, t.Prix_TTC])];
  return {
    file: 'Billetterie_Wonderland.xlsx',
    objects: [
      { id: 'ventes', nom: 'Ventes', kind: 'Sheet', raw: true, ...asRaw(sheetVentes, 8) },
      { id: 'tbl', nom: 'tBilletterie', kind: 'Table', rowAct: true, cols: COLS, rows: D.ventes },
      { id: 'tarifs', nom: 'Tarifs', kind: 'Sheet', raw: true, ...asRaw(tarifsSheet, 3) },
      { id: 'ttarifs', nom: 'tTarifs', kind: 'Table', cols: [{ n: 'Code_Tarif', t: 'text' }, { n: 'Type_Billet', t: 'text' }, { n: 'Prix_TTC', t: 'int' }], rows: D.tarifs },
      { id: 'lisez', nom: 'LisezMoi', kind: 'Sheet', raw: true, ...asRaw([['Information', 'Valeur'], ...D.lisezmoi], 2) }
    ]
  };
}
const FILES = [
  { id: SRC, nom: 'Billetterie_Wonderland.xlsx', type: 'xlsx', date: '06/06/2026' },
  { id: 'f_archive', nom: 'Billetterie_Archive.xlsx', type: 'xlsx', date: '31/05/2026', err: 'Billetterie_Archive.xlsx' },
  { id: 'f_freq', nom: 'Frequentation.csv', type: 'csv', date: '05/06/2026', err: 'Frequentation.csv' },
  { id: 'f_budget', nom: 'Budget_Wonderland.xlsx', type: 'xlsx', date: '01/06/2026', err: 'Budget_Wonderland.xlsx' },
  { id: 'f_tarifs', nom: 'Tarifs_2025.xlsx', type: 'xlsx', date: '01/01/2025', err: 'Tarifs_2025.xlsx' },
  { id: 'f_marketing', nom: 'Rapport_Marketing.pdf', type: 'pdf', date: '04/06/2026', err: 'Rapport_Marketing.pdf' },
  { id: 'f_modele', nom: 'Billetterie_Modele.xlsx', type: 'xlsx', date: '28/05/2026', err: 'Billetterie_Modele.xlsx' },
  { id: 'f_maint', nom: 'Maintenance.xlsx', type: 'xlsx', date: '03/06/2026', err: 'Maintenance.xlsx' },
  { id: 'f_test', nom: 'Billetterie_Test.xlsx', type: 'xlsx', date: '05/06/2026', err: 'Billetterie_Test.xlsx' }
];
const NAV_ERR = { ventes: 'Ventes', tarifs: 'Tarifs', ttarifs: 'tTarifs', lisez: 'LisezMoi', root: 'Classeur parent' };

function ensurePicker(x) { if (x.pbi.dlgKind !== 'open') x.pbi.filePicker(FILES); x.app('pbi'); }
function ensureNav(x, st = {}) {
  if (x.pbi.dlgKind !== 'nav') x.pbi.navigator({ ...classeur(), ...st });
  x.app('pbi');
  return x.pbi.navState;
}
const same = (set, ids) => set.length === ids.length && ids.every(i => set.includes(i));

const def = {
  id: 102,
  objectifs: ['Choisir le bon connecteur', 'Lire un classeur dans le Navigateur', 'Charger la table des ventes et la vérifier'],
  intro: [
    { bg: 'billetterie', n: '8 h 15. Les guichets ouvrent et les premières familles attendent devant les grilles.' },
    { n: 'Un employé encaisse une vente. La transaction file de la caisse jusqu’au système informatique du parc.' },
    { card: { k: 'Système de billetterie', ul: ['B001 — Adulte, 2 billets, 80 €', 'B002 — Enfant, 1 billet, 28 €', 'B003 — Senior, 1 billet, 32 €'] } },
    { n: 'Chaque billet vendu génère des données. Encore faut-il savoir les récupérer et les exploiter.' },
    { clear: 1, bg: 'bureau', mail: { de: 'lola', a: 'Direction Data', heure: '08:30', objet: 'Les premières ventes de billets', corps: ['Bonjour, voici le fichier Excel contenant les premières ventes de billets du mois de juin.', 'Gabriel et Victoria souhaitent bientôt analyser les recettes de la billetterie. Peux-tu intégrer ces données à ton projet Power BI ?', 'Merci et bon courage ! Lola'], pj: { nom: 'Billetterie_Wonderland.xlsx', type: 'xlsx', info: 'Classeur Excel, 3 feuilles' } } },
    { p: 'pixel', t: 'Notre premier fichier de données ! Nous allons enfin commencer à alimenter le projet Wonderland.' },
    { btn: 'Récupérer la pièce jointe' },
    { clear: 1, p: 'gabriel', t: 'Bonjour ! J’espère que ton installation s’est bien passée. Nous aimerions connaître les recettes générées par les ventes de billets.' },
    { p: 'pixel', t: 'Nous avons justement reçu le fichier de la billetterie !' },
    { p: 'gabriel', t: 'Excellent. Mais attention, le fichier contient plusieurs feuilles. Certaines servent uniquement de documentation.' },
    { p: 'gabriel', t: 'Je ne voudrais pas que tu mélanges les ventes avec les tarifs de référence.' },
    { p: 'pixel', t: 'Bonne remarque ! Dans Power BI, nous pouvons choisir précisément les données à importer.' },
    { clear: 1, p: 'pixel', t: 'Allez, ouvre ton projet Wonderland_Pilotage. Notre première mission commerciale nous attend !' },
    { btn: 'Ouvrir Power BI' }
  ],
  leconTitre: 'Comment Power BI récupère les données',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Une connexion vers le fichier', `
      <div class="flow">
        <div class="flow-box" data-k="0"><b>Excel</b><small>Le fichier source</small></div>
        <div class="flow-arrow">${ARROW}</div>
        <div class="flow-box" data-k="1"><b>Connecteur</b><small>L’accès aux données</small></div>
        <div class="flow-arrow">${ARROW}</div>
        <div class="flow-box" data-k="2"><b>Power BI</b><small>Le modèle de données</small></div>
      </div>
      <p class="lc-note" style="margin-top:14px">Mode Importation : les données sont copiées dans le modèle. Si le fichier change, on actualise.</p>`);
    x.app('lecon', card);
    const light = k => { $$('.flow-box', card).forEach(b => b.classList.remove('hot')); const b = $(`[data-k="${k}"]`, card); b.classList.add('on', 'hot'); };
    await x.pixel('Pour travailler avec les ventes, nous devons établir une connexion entre Power BI et le fichier Excel.');
    light(0); await x.pixel('Au départ, il y a le fichier source : le classeur de Lola.');
    light(1); await x.pixel('Le connecteur sait lire ce type de fichier. Chaque type de source possède le sien.');
    light(2); await x.pixel('Les lignes arrivent dans Power BI et deviennent une table du modèle. Cette connexion est enregistrée dans notre projet.');
    $$('.flow-box', card).forEach(b => b.classList.remove('hot'));
    await x.pixel('Nous allons utiliser le mode Importation : Power BI copie les données dans son modèle.');
    await x.pixel('Si le fichier Excel change plus tard, il faudra actualiser pour récupérer les changements.');
    x.app('pbi'); x.pbi.st.view = 'report'; x.pbi.st.tab = 'Accueil'; x.pbi.render();
    await x.pixel('Dans le ruban Accueil, deux chemins mènent à un classeur Excel.');
    x.pbi.mark('[data-a="cmd:excel"]');
    await x.pixel('Le premier : le bouton Classeur Excel, directement.');
    x.pbi.mark('[data-a="cmd:get"]');
    await x.pixel('Le second : Obtenir les données, qui présente tous les connecteurs, puis Classeur Excel.');
    x.pbi.mark();
    await x.pixel('Ensuite, Power BI demande le fichier, puis ouvre le Navigateur pour choisir ce qu’on charge.');
  },

  exs: [
    /* 1 — Trouver le bon connecteur */
    { async run(x) {
      x.app('pbi'); x.pbi.closeDialog(true); x.pbi.st.view = 'report'; x.pbi.render();
      await x.pixel('Nous devons indiquer à Power BI le type de fichier auquel nous voulons nous connecter.');
      await x.pixel('Le fichier de Lola s’appelle Billetterie_Wonderland.xlsx.');
      x.todo('Ouvre le connecteur qui correspond à ce fichier.');
      x.guide('[data-a="cmd:excel"]');
      const CONN = { csv: 'Texte/CSV', sql: 'SQL Server', web: 'Web', pdf: 'PDF', folder: 'Dossier', sharepoint: 'SharePoint', enter: 'Entrer des données' };
      await x.wait({
        cmd: c => {
          if (c === 'excel') { x.pbi.filePicker(FILES); return true; }
          if (c === 'get') { x.pbi.getData(); x.guide('[data-c="excel"]'); return; }
          if (c === 'enter') return x.oops('Entrer des données');
          if (c === 'refresh') return x.oops('Actualiser');
          return x.oops('', 'Cherche plutôt dans le groupe des données, au début du ruban Accueil.');
        },
        'connector.pick': () => {},
        connector: c => {
          if (!c) return x.oops('', 'Sélectionne d’abord un connecteur dans la liste.');
          if (c === 'excel') { x.pbi.filePicker(FILES); return true; }
          return x.oops(CONN[c]);
        },
        'dialog.cancel': () => { x.guide('[data-a="cmd:excel"]'); }
      });
      x.guide();
      await x.ok('Connecteur Classeur Excel activé : la fenêtre de sélection des fichiers est ouverte.');
    } },

    /* 2 — Retrouver le bon fichier */
    { async run(x) {
      ensurePicker(x);
      await x.pixel('Attention, plusieurs fichiers portent des noms proches. Vérifie que tu choisis bien celui envoyé ce matin par Lola.');
      x.todo('Sélectionne le fichier de Lola, puis clique sur Ouvrir.');
      x.guide([`[data-f="${SRC}"]`, '[data-d="open"]']);
      await x.wait({
        'file.pick': () => {},
        'file.open': id => {
          if (!id) return x.oops('', 'Sélectionne d’abord un fichier dans la liste.');
          const f = FILES.find(f => f.id === id);
          if (f.err) return x.oops(f.err);
          x.pbi.navigator(classeur()); return true;
        },
        'dialog.cancel': () => x.oops('', 'Garde la fenêtre ouverte : il nous faut le fichier de Lola.')
      });
      x.guide();
      await x.ok('Le classeur est ouvert dans le Navigateur.');
    } },

    /* 3 — Le mystère des cinq objets */
    { async run(x) {
      const st = ensureNav(x);
      await x.pixel('Tiens, notre fichier Excel contient trois feuilles, mais Power BI nous présente cinq objets. Sais-tu pourquoi ?');
      const card = K.lesson('Feuille ou tableau structuré ?', 'Deux façons de lire les ventes', `
        <p class="lc-note" style="margin:0 0 6px">Feuille Ventes : tout l’onglet, avec son titre et ses cellules vides.</p>
        <div class="mono" style="font-size:11px; white-space:pre; margin-bottom:12px">Ventes de billets — Wonderland
Extraction du 06/06/2026

ID_Vente  Date_Achat  …  Montant_TTC
B001      01/06/2026  …  80
B002      01/06/2026  …  28</div>
        <p class="lc-note" style="margin:0 0 6px">Tableau structuré tBilletterie : uniquement ses colonnes et ses lignes.</p>
        <div class="mono" style="font-size:11px; white-space:pre">ID_Vente  Date_Achat  …  Montant_TTC
B001      01/06/2026  …  80
B002      01/06/2026  …  28</div>`);
      x.app('cmp', card);
      await x.pixel('Une feuille Excel représente un onglet complet.');
      await x.pixel('Un tableau structuré est une zone de données définie, avec son propre nom et ses propres en-têtes.');
      await x.pixel('Quand il existe, on préfère importer le tableau structuré : la feuille entière demanderait du nettoyage.');
      x.app('pbi');
      x.todo('Affiche l’aperçu des ventes de billets, sans rien charger.');
      x.guide('[data-o="tbl"]');
      await x.wait({
        'nav.focus': id => { if (id === 'tbl') return true; if (id === 'root') return x.oops('Classeur parent'); x.oops(NAV_ERR[id]); },
        'nav.check': () => {},
        'nav.load': () => x.oops('Charger prématurément'),
        'nav.transform': () => x.oops('Charger prématurément'),
        'nav.cancel': () => x.oops('Annuler'), 'nav.close': () => x.oops('Annuler')
      });
      x.guide();
      await x.ok('Voici l’aperçu de tBilletterie : uniquement les ventes, avec leurs en-têtes.');
    } },

    /* 4 — Une vente à vérifier */
    { async run(x) {
      const st = ensureNav(x, { focus: 'tbl' });
      if (st.focus !== 'tbl') { st.focus = 'tbl'; x.pbi.navDraw(); }
      await x.say('gabriel', 'Une vente a été effectuée le 3 juin pour des billets enfants. Son identifiant est B010.');
      await x.say('gabriel', 'Avant de charger le fichier, peux-tu me confirmer la quantité et le montant ?');
      await x.pixel('Le Navigateur affiche un aperçu des données : nous pouvons déjà vérifier.');
      x.todo('Retrouve la vente B010 dans l’aperçu et touche sa ligne.');
      x.guide(() => $$('.nav-prev tbody tr', x.pbi.el)[9]);
      let row = null;
      await x.wait({
        'nav.row': ({ focus, i }) => {
          if (focus !== 'tbl') return;
          const id = D.ventes[i].ID_Vente; row = id;
          if (id === 'B010') return true;
          if (id === 'B009') return x.oops('Ligne B009');
          if (id === 'B011') return x.oops('Ligne B011');
          x.oops('', `Tu as touché la vente ${id}. Gabriel a demandé B010.`);
        },
        'nav.focus': id => id === 'tbl' ? undefined : x.oops('', 'Reste sur l’aperçu de tBilletterie.'),
        'nav.check': () => {}, 'nav.load': () => x.oops('', 'Vérifie d’abord la vente B010.'), 'nav.cancel': () => x.oops('', 'Garde le Navigateur ouvert.'), 'nav.close': () => x.oops('', 'Garde le Navigateur ouvert.')
      });
      x.guide();
      st.compact = true; x.pbi.navDraw();
      x.todo('Relève la quantité et le montant TTC de la vente B010.');
      await x.inputs({
        lbl: 'Réponse pour Gabriel', q: 'Vente B010 : combien de billets, pour quel montant ?', btn: 'Envoyer à Gabriel',
        fields: [{ id: 'q', label: 'Quantité de billets' }, { id: 'm', label: 'Montant TTC', unit: '€' }],
        check: ({ q, m }) => {
          if (q === null || m === null) return 'Réponse vide';
          if (q === 84 && m === 3) return 'Quantité et montant inversés';
          if (m === 28) return 'Montant 28 €';
          if (m === 112) return 'Montant 112 €';
          if (q === 1) return 'Quantité 1';
          if (q !== 3) return ['', 'Recompte les billets de la ligne B010, colonne Quantite.'];
          if (m !== 84) return ['', 'Relis la colonne Montant_TTC de la ligne B010.'];
          if (row !== 'B010') return 'Bonne réponse sans consulter B010';
          return true;
        }
      });
      st.compact = false; x.pbi.navDraw();
      await x.say('gabriel', 'Excellent ! C’est rassurant de vérifier les données avant de commencer une analyse.');
    } },

    /* 5 — Ne garder que l'essentiel */
    { async run(x) {
      const st = ensureNav(x, { focus: 'tbl' });
      st.compact = false; x.pbi.navDraw();
      await x.pixel('Power BI permet de sélectionner plusieurs objets du même classeur.');
      await x.pixel('Mais importer davantage de données ne veut pas dire mieux travailler : un modèle encombré de doublons et de documentation devient vite illisible.');
      await x.pixel('Notre mission concerne uniquement les ventes de billets.');
      x.todo('Coche uniquement le ou les objets à importer.');
      x.guide('[data-chk="tbl"]');
      let timer = 0;
      const judge = set => {
        clearTimeout(timer);
        if (same(set, ['tbl'])) return true;
        if (!set.length) return;
        timer = setTimeout(() => {
          if (set.length === 5) x.oops('Toutes les cases cochées');
          else if (same(set, ['ventes'])) x.oops('Ventes uniquement');
          else if (same(set, ['ventes', 'tbl'])) x.oops('Ventes et tBilletterie');
          else if (same(set, ['tbl', 'ttarifs'])) x.oops('tBilletterie et tTarifs');
          else if (same(set, ['tbl', 'lisez'])) x.oops('tBilletterie et LisezMoi');
          else if (same(set, ['tarifs']) || same(set, ['ttarifs'])) x.oops('Tarifs uniquement');
          else x.oops('', 'Décoche ce qui ne concerne pas les ventes de billets.');
        }, window.PBQ_FAST ? 30 : 1100);
      };
      if (same([...st.checked], ['tbl'])) { await x.pause(300); }
      else await x.wait({
        'nav.check': ({ set }) => judge(set),
        'nav.focus': () => {},
        'nav.load': set => set.length ? judge(set) && undefined : x.oops(st.focus === 'tbl' ? 'Aperçu affiché sans case cochée' : 'Aucun objet coché'),
        'nav.transform': () => x.oops('', 'Termine d’abord ta sélection.'),
        'nav.cancel': () => x.oops('', 'Garde le Navigateur ouvert.'), 'nav.close': () => x.oops('', 'Garde le Navigateur ouvert.')
      });
      clearTimeout(timer);
      x.guide();
      await x.ok('Une seule case cochée : tBilletterie. Le modèle restera propre.');
    } },

    /* 6 — Charger ou transformer ? */
    { async run(x) {
      ensureNav(x, { focus: 'tbl', checked: ['tbl'] });
      await x.pixel('Deux boutons s’offrent à nous. Charger importe la sélection dans le modèle.');
      await x.pixel('Transformer les données ouvre d’abord Power Query pour préparer la sélection.');
      await x.pixel('Notre tableau a déjà des en-têtes et des valeurs bien organisées : chargeons-le directement.');
      x.todo('Importe la sélection dans le modèle.');
      x.guide('[data-d="load"]');
      await x.wait({
        'nav.load': set => {
          if (!set.length) return x.oops('Charger sans sélection');
          if (same(set, ['ventes'])) return x.oops('Charger la feuille Ventes');
          if (set.length > 1) return x.oops('Charger plusieurs objets');
          if (!same(set, ['tbl'])) return x.oops('', 'Ce n’est pas le tableau des ventes.');
          x.pbi.loading('Chargement de tBilletterie dans le modèle…', 20); return true;
        },
        'nav.check': () => {}, 'nav.focus': () => {},
        'nav.transform': () => x.oops('Transformer les données'),
        'nav.cancel': () => x.oops('Annuler'), 'nav.close': () => x.oops('Fermer le Navigateur')
      });
      x.guide();
      await x.wait({ 'load.done': () => true, 'load.cancel': () => x.oops('Interrompre le chargement') });
      const P = x.pbi.P; importBilletterie(P); P.dirty = true; x.pbi.st.pane = 'Données'; x.pbi.render();
      x.pbi.mark('.panes');
      await x.ok('Bravo ! Tu viens d’alimenter ton premier modèle Power BI.');
      await x.pixel('Même sans ouvrir Power Query, Power BI a créé une requête qui lit le fichier à chaque actualisation.');
      x.pbi.mark();
    }, avance: P => { importBilletterie(P); P.dirty = true; } },

    /* 7 — Le contrôle après importation */
    { async run(x) {
      const pbi = x.pbi; x.app('pbi'); pbi.closeDialog(true);
      await x.pixel('Le volet Données contient désormais la table tBilletterie.');
      await x.pixel('Un chargement réussi ne dispense jamais d’une vérification. Assure-toi que toutes les données attendues sont présentes.');
      x.todo('Ouvre la vue Table et sélectionne tBilletterie.');
      x.guide('[data-a="view:table"]');
      const inTable = () => pbi.st.view === 'table';
      if (inTable()) x.guide('[data-a="tsel:tbl_billetterie"]');
      await x.wait({
        view: v => { if (v === 'table') { x.guide('[data-a="tsel:tbl_billetterie"]'); return; } return x.oops(v === 'report' ? 'Vue Rapport' : 'Vue Modèle'); },
        'table.select': () => inTable() ? true : x.oops('Vue Rapport')
      });
      x.guide();
      x.todo('Compte les lignes et les colonnes de la table.');
      await x.inputs({
        lbl: 'Contrôle de l’import', q: 'Que contient tBilletterie ?', btn: 'Confirmer le contrôle',
        fields: [{ id: 'l', label: 'Nombre de lignes' }, { id: 'c', label: 'Nombre de colonnes' }],
        check: ({ l, c }) => {
          if (l === null || c === null) return ['', 'Renseigne les deux nombres.'];
          if (l === 40) return '40 lignes'; if (l === 21) return '21 lignes'; if (l === 4) return '4 lignes';
          if (l !== 20) return ['', 'Regarde le nombre de lignes indiqué en bas de la vue Table.'];
          if (c === 7) return '7 colonnes'; if (c === 9) return '9 colonnes';
          if (c !== 8) return ['', 'Compte les en-têtes de colonnes, sans la colonne des numéros.'];
          return true;
        }
      });
      await x.ask('La colonne Montant_TTC est-elle bien présente ?', [{ t: 'Oui, elle est présente', ok: true }, { t: 'Non, elle est absente', err: 'Montant_TTC absent' }]);
      await x.ok('20 lignes, 8 colonnes, Montant_TTC bien là : l’import est conforme.');
      await x.pixel('Retiens bien : 20 lignes de vente ne font pas 20 visiteurs. Une ligne peut contenir plusieurs billets.');
    } },

    /* 8 — Mission accomplie, Gabriel ! */
    { async run(x) {
      const pbi = x.pbi; x.app('pbi'); pbi.closeDialog(true);
      const P = () => pbi.P;
      await x.say('gabriel', 'Alors, nos données sont-elles enfin disponibles ?');
      await x.pixel('Oui ! Mais il reste une étape essentielle : enregistrer notre travail pour ne pas perdre le modèle créé.');
      const valid = () => pbi.st.view === 'report' && P().activePage === 'page_001' && !P().dirty && P().name === 'Wonderland_Pilotage' && P().tables.length === 1 && P().pages.length === 1 && !P().pages[0].visuals.length;
      const next = () => {
        if (pbi.st.view !== 'report') { x.todo('Reviens dans la vue Rapport, sur la page Vue générale.'); x.guide('[data-a="view:report"]'); }
        else { x.todo('Enregistre le projet Wonderland_Pilotage.'); x.guide('.pbi-save'); }
      };
      next();
      const save = () => { pbi.closeBackstage(); P().dirty = false; P().saved = true; pbi.render(); if (valid()) return true; next(); };
      await x.wait({
        view: v => { if (v === 'report') { setTimeout(() => { if (valid()) PBQ.act('ok.state'); else next(); }, 0); return; } },
        'ok.state': () => valid() ? true : undefined,
        save: () => save(),
        'file.menu': () => {},
        file: k => {
          if (k === 'back') return;
          if (k === 'save') return save();
          if (k === 'saveas') { pbi.closeBackstage(); pbi.saveAs({ name: 'Wonderland_Pilotage' }); return; }
          if (k === 'new') return x.oops('Nouveau projet');
          if (k === 'export') return x.oops('Exporter en PDF');
          if (k === 'publish') return x.oops('Publier');
          if (k === 'quit') return x.oops('Quitter sans enregistrer');
          return x.oops('', 'Cette commande ne sert pas à enregistrer.');
        },
        saveas: ({ name, ext }) => { if (name !== 'Wonderland_Pilotage' || ext !== 'pbix') return x.oops('Enregistrer sous un autre nom'); pbi.closeDialog(); return save(); },
        'dialog.cancel': () => {},
        cmd: c => c === 'refresh' ? x.oops('Actualiser') : c === 'publish' ? x.oops('Publier') : c === 'newvisual' ? x.oops('Créer un graphique') : undefined
      });
      x.guide();
      await x.say('gabriel', 'Parfait. Pour la première fois, nous allons pouvoir exploiter les données de la billetterie dans notre système de pilotage.');
    }, avance: P => { P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'bureau', p: 'gabriel', t: 'C’est exactement ce dont nous avions besoin. Une source de données identifiable et disponible dans notre projet.' },
    { p: 'pixel', t: 'Et ce n’est que le début ! Bientôt, nous pourrons calculer les ventes totales, comparer les catégories de billets et identifier les canaux les plus performants.' },
    { p: 'gabriel', t: 'Victoria sera ravie de l’apprendre. Continue comme ça !' },
    { clear: 1, bg: 'parc', n: 'Le bâtiment de la billetterie s’illumine. Une ligne lumineuse le relie au bureau administratif.' },
    { card: { k: 'Réseau de données du parc', h: '1 service sur 6 connecté', chips: ['Billetterie'] } },
    { wait: 800 }
  ],
  recompense: { titre: 'Première connexion réussie !', sous: 'Tu viens d’intégrer les premières données de Wonderland.', badge: 'b102', badgeNom: 'Première source', objet: 'lampe' },
  fiches: [
    ['Le connecteur', 'À quoi sert un connecteur ?', 'À accéder à un type de source précis : Classeur Excel, Texte/CSV, SQL Server, Web, PDF, Dossier…'],
    ['Deux chemins vers Excel', 'Comment lancer l’import d’un classeur Excel ?', 'Accueil › Classeur Excel, ou Accueil › Obtenir les données › Classeur Excel.'],
    ['Feuille ou tableau ?', 'Quelle différence entre une feuille et un tableau structuré ?', 'La feuille est l’onglet entier, avec ses titres et ses cellules vides. Le tableau structuré est une zone nommée avec ses propres en-têtes : on le préfère quand il existe.'],
    ['Le Navigateur', 'Que permet le Navigateur ?', 'De parcourir les objets d’un fichier, d’afficher leur aperçu et de cocher ceux à importer.'],
    ['Charger', 'Que fait le bouton Charger ?', 'Il importe la sélection directement dans le modèle. Transformer les données ouvre d’abord Power Query pour la préparer.'],
    ['Le mode Importation', 'Le fichier source change. Que faire ?', 'En mode Importation, les données sont copiées dans le modèle : il faut actualiser pour récupérer les changements.'],
    ['Contrôler un import', 'Que vérifier après un chargement ?', 'Dans la vue Table : le nombre de lignes, le nombre de colonnes et la présence des colonnes attendues.'],
    ['Lignes et visiteurs', '20 lignes de vente, est-ce 20 visiteurs ?', 'Non. Une ligne peut contenir plusieurs billets, et un billet vendu ne prouve pas que la personne est entrée dans le parc.']
  ],
  suite: [
    { bg: 'bureau', p: 'oscar', t: 'Bonjour ! J’ai entendu dire que les données de la billetterie étaient disponibles. Mais il y a quelque chose que tu dois savoir.' },
    { p: 'oscar', t: 'Certains visiteurs achètent leurs billets plusieurs jours à l’avance. D’autres ne viennent finalement pas.' },
    { p: 'oscar', t: 'Si nous voulons connaître la fréquentation réelle du parc, nous devons consulter les données des portiques d’entrée.' },
    { p: 'pixel', t: 'C’est vrai ! Les ventes de billets ne représentent pas forcément les entrées effectives.' },
    { mail: { de: 'oscar', heure: '08:40', objet: 'Export des portiques', corps: ['Notre système de contrôle des entrées ne génère pas de fichier Excel. Il nous fournit un fichier CSV. Tu sais comment l’importer ?'], pj: { nom: 'Frequentation_Wonderland.csv', type: 'csv', info: 'Export des portiques d’entrée' } } },
    { p: 'pixel', t: 'Voilà une excellente occasion de découvrir un nouveau connecteur !' }
  ],
  accroche: 'Tu découvriras les connecteurs, l’importation d’un classeur Excel, le Navigateur et le chargement d’une table dans le modèle.',
  fin(P) { importBilletterie(P); P.dirty = false; P.saved = true; }
};
const ARROW = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M7 2v10M3.5 8.5L7 12l3.5-3.5"/></svg>';
window.PBQ.mission(def);
window.PBQ.importBilletterie = importBilletterie;
})();

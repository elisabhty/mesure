/* Mission 101 — Ton premier jour */
(function () {
'use strict';
const { h, esc, fr, $, $$, toast } = window.PBQ;

/* Projet d'entraînement de Pixel, isolé du projet Wonderland */
function demoProject() {
  return {
    id: 'demo', demo: true, name: 'Entrainement_Pixel', saved: true,
    pages: [{ id: 'demo_p1', name: 'Page 1', visuals: [
      { id: 'vis_demo_carte', type: 'card', x: 3, y: 30, w: 31, h: 40, display: '2 800', label: 'Entrées enregistrées' },
      { id: 'vis_demo_frequentation', type: 'column', x: 37, y: 5, w: 60, h: 90, title: 'Fréquentation du parc — Données d’entraînement', data: [['Lundi', 800], ['Mardi', 1200], ['Mercredi', 800]], max: 1500, ticks: [0, 500, 1000, 1500] }
    ] }],
    activePage: 'demo_p1', sources: [], queries: [],
    tables: [{ id: 'Entrees_Demo', name: 'Entrees_Demo', cols: [{ n: 'Jour', t: 'text' }, { n: 'Entrées', t: 'int' }], rows: [{ Jour: 'Lundi', 'Entrées': 800 }, { Jour: 'Mardi', 'Entrées': 1200 }, { Jour: 'Mercredi', 'Entrées': 800 }] }],
    relationships: [], measures: [], formats: {}, settings: {}
  };
}
const demoQueries = () => [{
  name: 'Entrees_Demo', kind: 'excel', file: 'Entrainement_Pixel.xlsx',
  cols: [{ n: 'Jour' }, { n: 'Entrées' }],
  rows: () => [{ Jour: 'Lundi', 'Entrées': 800 }, { Jour: 'Mardi', 'Entrées': 1200 }, { Jour: 'Mercredi', 'Entrées': 800 }],
  steps: [{ op: 'source', name: 'Source' }, { op: 'type', name: 'Type modifié', changes: [['Jour', 'text'], ['Entrées', 'int']] }]
}];
function demo(x, view) {
  const pbi = x.pbi;
  if (!pbi.P.demo) pbi.load(demoProject());
  if (view) pbi.st.view = view;
  pbi.render();
  x.app('pbi');
}
/* Nouveau rapport vierge : c'est le projet permanent de Wonderland */
function newBlank(pbi) {
  const P = pbi.real;
  P.pages = [{ id: 'page_001', name: 'Page 1', visuals: [] }];
  P.activePage = 'page_001'; P.name = null; P.saved = false; P.dirty = false;
  pbi.load(P); pbi.st.view = 'report'; pbi.st.tab = 'Accueil'; pbi.render();
}

const EX7 = P => {
  P.name = 'Wonderland_Pilotage'; P.saved = true; P.dirty = false;
  P.pages = [{ id: 'page_001', name: 'Vue générale', visuals: [] }];
  P.activePage = 'page_001';
};

const def = {
  id: 101,
  objectifs: ['Comprendre à quoi sert Power BI', 'Repérer les vues Rapport, Table et Modèle', 'Créer le projet Wonderland_Pilotage'],
  intro: [
    { bg: 'parc', n: 'Il y a quelques années, Wonderland était l’un des parcs les plus populaires du pays.' },
    { n: 'Aujourd’hui, les visiteurs se font plus rares, les dépenses augmentent et personne ne semble comprendre pourquoi.' },
    { n: 'La direction a décidé de recruter une nouvelle personne pour analyser la situation.' },
    { n: 'Cette personne, c’est toi.' },
    { clear: 1, bg: 'pilotage', p: 'victoria', t: 'Bienvenue à Wonderland ! Je suis ravie que tu sois enfin là. Nous avons besoin de ton aide.' },
    { p: 'victoria', t: 'Chaque service possède ses propres fichiers. La billetterie, les restaurants, la maintenance, le marketing…' },
    { p: 'victoria', t: 'Tout le monde nous transmet des chiffres, mais personne n’arrive à avoir une vision globale du parc.' },
    { card: { k: 'Les dossiers posés sur le bureau de Victoria', chips: ['Billetterie', 'Fréquentation', 'Attractions', 'Maintenance', 'Finances', 'Satisfaction'] } },
    { p: 'victoria', t: 'Dans 60 jours, le conseil d’administration décidera de l’avenir de Wonderland. Ta mission sera de nous aider à prendre les bonnes décisions grâce aux données.' },
    { btn: 'Accepter la mission' },
    { clear: 1, card: { k: 'Wonderland · Document interne', h: 'Ordre de mission', p: 'Poste de Data Analyst à la direction générale, pour une durée de 60 jours.', ul: ['Centraliser les données du parc.', 'Fiabiliser les informations.', 'Construire des indicateurs de performance.', 'Identifier les causes des difficultés.', 'Présenter des recommandations à la direction.'], sig: 'Victoria, direction générale' } },
    { clear: 1, bg: 'bureau', n: 'Un ordinateur, un carnet et une tasse t’attendent sur ton nouveau bureau.' },
    { p: 'pixel', t: 'Salut ! Moi, c’est Pixel. Je vais t’accompagner pendant toute cette aventure.' },
    { p: 'pixel', t: 'Tu n’as jamais utilisé Power BI ? Aucun problème, on va commencer par les bases.' },
    { btn: 'Allumer mon ordinateur' }
  ],
  leconTitre: 'Comprendre Power BI',
  debut(P, pbi) { pbi.real = P; if (!P.name) pbi.load(demoProject()); },

  async lecon(x) {
    const card = K.lesson('Première leçon', 'Des fichiers bruts aux décisions', `
      <div class="flow">
        <div class="flow-row" data-k="0"><div class="flow-box"><b>Excel</b><small>Classeurs</small></div><div class="flow-box"><b>CSV</b><small>Fichiers texte</small></div><div class="flow-box"><b>SQL</b><small>Bases de données</small></div></div>
        <div class="flow-arrow">${arrow}</div>
        <div class="flow-box" data-k="1"><b>Power Query</b><small>Importer et transformer</small></div>
        <div class="flow-arrow">${arrow}</div>
        <div class="flow-box" data-k="2"><b>Modèle de données et DAX</b><small>Relier les tables et calculer les indicateurs</small></div>
        <div class="flow-arrow">${arrow}</div>
        <div class="flow-box" data-k="3"><b>Rapports interactifs</b><small>Visualiser, explorer et comprendre</small></div>
        <div class="flow-arrow">${arrow}</div>
        <div class="flow-box" data-k="4"><b>Power BI Service</b><small>Publier, partager et actualiser</small></div>
      </div>`);
    x.app('lecon', card);
    const light = k => { $$('.flow-box', card).forEach(b => b.classList.remove('hot')); const row = $(`[data-k="${k}"]`, card); (row.classList.contains('flow-row') ? $$('.flow-box', row) : [row]).forEach(b => b.classList.add('on', 'hot')); };
    await x.pixel('Power BI est un outil d’analyse et de visualisation de données développé par Microsoft.');
    await x.pixel('Il permet de récupérer des données de différentes sources, de les transformer, de les relier et de créer des rapports interactifs.');
    light(0); await x.pixel('Tout commence par des fichiers bruts : des classeurs Excel, des fichiers CSV, des bases SQL.');
    light(1); await x.pixel('Power Query les importe et les nettoie.');
    light(2); await x.pixel('Le modèle relie les tables entre elles, et le langage DAX calcule les indicateurs.');
    light(3); await x.pixel('Les rapports permettent ensuite de visualiser et d’explorer les résultats.');
    light(4); await x.pixel('Enfin, Power BI Service sert à publier et partager le travail.');
    await K.jeu(x, { app: 'jeu101', pairs: true, title: 'De la source au rapport', btn: 'Vérifier', todo: 'Fais monter chaque outil dans la nacelle de son rôle.',
      rows: [['pq', 'Power Query', 'pq', 'Power Query intervient au début : il importe et nettoie les fichiers.'], ['dax', 'Modèle et DAX', 'dax', 'Le modèle relie les tables, et DAX calcule les indicateurs.'], ['rap', 'Rapports', 'rap', 'Les rapports servent à visualiser et à explorer les résultats.'], ['svc', 'Power BI Service', 'svc', 'Power BI Service arrive en dernier : il publie et partage le travail.']],
      options: [['rap', 'Visualiser et explorer'], ['svc', 'Publier et partager'], ['pq', 'Importer et nettoyer'], ['dax', 'Relier et calculer']] });
    await x.ok('Importer, relier et calculer, visualiser, puis partager : c’est tout le parcours.');
    x.app('lecon');
    $$('.flow-box', card).forEach(b => b.classList.remove('hot'));
    await x.pixel('Notre objectif n’est pas simplement de créer de beaux graphiques.');
    await x.pixel('Nous devons transformer les données en informations utiles pour prendre des décisions.');

    /* Visite de l'interface */
    demo(x, 'report');
    const pbi = x.pbi;
    await x.pixel('Voici Power BI Desktop, avec un petit projet d’entraînement que j’ai préparé.');
    const tour = [
      ['.ribbon', 'En haut, le ruban regroupe les commandes principales.'],
      ['.rail', 'À gauche, trois icônes : la vue Rapport, la vue Table et la vue Modèle.'],
      ['.canvas', 'Au centre, le canevas : on y organise les éléments du rapport.'],
      ['.pagetabs', 'Juste en dessous, les onglets servent à naviguer entre les pages.'],
      ['.panes', 'En bas, le volet Données donne accès aux tables et à leurs colonnes.'],
      ['[data-a="cmd:transform"]', 'Et ce bouton ouvre Power Query, l’éditeur qui prépare les données avant leur chargement.']
    ];
    for (const [sel, t] of tour) { pbi.mark(sel); await x.pixel(t); }
    pbi.mark();
    await x.pixel('Les données de ce projet sont indépendantes de Wonderland : tu peux explorer sans risque.');
    const seen = new Set();
    const marks = () => pbi.mark(['report', 'table', 'model'].filter(v => !seen.has(v)).map(v => `[data-a="view:${v}"]`));
    x.todo('Touche les trois icônes de gauche pour passer d’une vue à l’autre.');
    marks();
    await x.wait({
      view: v => { seen.add(v); marks(); if (seen.size === 3) return true; },
      '*': () => {}
    });
    pbi.mark();
    await x.ok('Parfait. Rapport pour les visuels, Table pour les lignes, Modèle pour la structure.');
    await x.pixel('À toi de jouer maintenant !');
  },

  exs: [
    /* 1 — Les données dispersées */
    { async run(x) {
      await x.pixel('Regarde ce que les différents services nous ont envoyé.');
      await x.pixel('Certains travaillent avec Excel, d’autres utilisent des fichiers CSV ou des bases de données. Avant de commencer, identifions ces sources.');
      const B = K.matching({ key: () => want,
        title: 'Les sources de Wonderland', intro: 'Chaque source monte dans la nacelle de son format.',
        rows: [
          { id: 'xlsx', label: 'Billetterie.xlsx', sub: 'Envoyé par la billetterie' },
          { id: 'csv', label: 'Frequentation.csv', sub: 'Export des portiques d’entrée' },
          { id: 'db', label: 'Maintenance_DB', sub: 'Serveur du service technique' },
          { id: 'pdf', label: 'Enquete_Satisfaction.pdf', sub: 'Rapport du service marketing' },
          { id: 'dir', label: 'Caisses_Restaurants', sub: 'Un fichier par restaurant, réunis au même endroit' },
          { id: 'web', label: 'meteo.wonderland.fr', sub: 'Prévisions publiées sur Internet' }
        ],
        options: [['excel', 'Excel'], ['csv', 'CSV'], ['sql', 'SQL Server'], ['pdf', 'PDF'], ['dir', 'Dossier'], ['web', 'Web']]
      });
      x.app('m1', B.el);
      x.todo('Fais monter chaque source dans la nacelle de son format.');
      const want = { xlsx: 'excel', csv: 'csv', db: 'sql', pdf: 'pdf', dir: 'dir', web: 'web' };
      await x.wait({
        'match.pick': () => { B.mark(); },
        'match.check': ({ values: v }) => {
          const bad = Object.keys(want).filter(k => v[k] && v[k] !== want[k]);
          B.mark(null, bad);
          if (v.xlsx === 'csv') return x.oops('Excel classé en CSV');
          if (v.csv === 'excel') return x.oops('CSV classé en Excel');
          if (v.db && v.db !== 'sql') return x.oops('SQL classé en fichier');
          if (v.pdf === 'excel') return x.oops('PDF classé en Excel');
          if (v.dir && v.dir !== 'dir') return x.oops('Dossier classé en fichier unique');
          if (v.web === 'sql') return x.oops('URL classée en base SQL');
          if (bad.length) return x.oops('Association incorrecte restante');
          if (Object.keys(want).some(k => !v[k])) return x.oops('Source oubliée');
          B.mark(Object.keys(want)); B.lock(); return true;
        }
      });
      await x.ok('Les six sources sont identifiées. Je range les dossiers dans l’armoire !');
    } },

    /* 2 — Le bon outil pour la bonne mission */
    { async run(x) {
      const D = K.desktop(['excel', 'word', 'ppt', 'pbi', 'files', 'web', 'calc', 'bin']);
      x.app('desk', D);
      await x.say('gabriel', 'J’ai besoin de comparer les recettes de nos restaurants.');
      await x.say('gabriel', 'J’aimerais pouvoir sélectionner un mois ou un restaurant et voir automatiquement les résultats correspondants.');
      await x.pixel('Quel environnement permettrait de répondre à son besoin en créant un rapport interactif ?');
      x.todo('Ouvre la bonne application sur le bureau.');
      x.guide(() => $('[data-app="pbi"]', D));
      const errs = { word: 'Word', ppt: 'PowerPoint', excel: 'Excel', bin: 'Corbeille', web: 'Navigateur', files: 'Explorateur', calc: 'Calculatrice' };
      await x.wait({ 'desk.open': ({ id }) => id === 'pbi' ? true : x.oops(errs[id]) });
      x.untarget();
      $('.splash', D).classList.add('on');
      await x.pause(1500, true);
      demo(x, 'model');
      await x.ok('Power BI Desktop est lancé, avec le projet d’entraînement de tout à l’heure.');
    } },

    /* 3 — Les premiers graphiques */
    { async run(x) {
      demo(x, x.pbi.P.demo ? null : 'model');
      await x.pixel('Avant de construire notre propre rapport, je vais te montrer un exemple.');
      x.todo('Va là où se créent les graphiques, puis sélectionne celui de la fréquentation.');
      x.guide('[data-a="view:report"]');
      const inReport = () => x.pbi.st.view === 'report';
      if (inReport()) x.guide('[data-a="vis:vis_demo_frequentation"]');
      await x.wait({
        view: v => {
          if (v === 'report') { x.guide('[data-a="vis:vis_demo_frequentation"]'); x.todo('C’est bien la vue Rapport. Sélectionne maintenant le graphique de fréquentation.'); return; }
          return x.oops(v === 'table' ? 'Vue Table' : 'Vue Modèle');
        },
        visual: id => id === 'vis_demo_frequentation' ? true : x.oops('', 'Ce visuel est une carte, qui affiche un seul nombre. Sélectionne le graphique en colonnes.'),
        canvas: () => x.oops('Canevas vide'),
        page: () => x.oops('Page du rapport'),
        cmd: c => c === 'transform' ? x.oops('Power Query') : undefined,
        'file.menu': () => x.oops('Fichier'),
        field: () => x.oops('Volet Données'),
        'table.select': () => x.oops(inReport() ? 'Volet Données' : 'Vue Table')
      });
      await x.ok('C’est ici que nous construirons les futurs rapports destinés à Victoria.');
    } },

    /* 4 — Derrière les graphiques */
    { async run(x) {
      demo(x);
      await x.say('oscar', 'Le graphique indique que nous avons enregistré 1 200 entrées mardi.');
      await x.say('oscar', 'Mais j’aimerais vérifier la valeur exacte dans les données. Où puis-je la retrouver ?');
      await x.pixel('Un graphique représente les données. Tu peux aussi consulter les valeurs chargées dans le modèle.');
      x.todo('Ouvre la vue Table, puis sélectionne la table Entrees_Demo.');
      x.guide('[data-a="view:table"]');
      const inTable = () => x.pbi.st.view === 'table';
      if (inTable()) x.guide('[data-a="tsel:Entrees_Demo"]');
      await x.wait({
        view: v => { if (v === 'table') { x.guide('[data-a="tsel:Entrees_Demo"]'); return; } return x.oops(v === 'report' ? 'Vue Rapport' : 'Vue Modèle'); },
        'table.select': () => inTable() ? true : x.oops('Vue Rapport'),
        cmd: c => c === 'transform' ? x.oops('Power Query') : undefined
      });
      x.guide();
      x.todo('Lis la valeur de la ligne Mardi et transmets-la à Oscar.');
      await x.inputs({
        lbl: 'Réponse pour Oscar', q: 'Combien d’entrées ont été enregistrées mardi ?', btn: 'Envoyer à Oscar',
        fields: [{ id: 'v', label: 'Entrées du mardi' }],
        check: ({ v }) => v === 1200 ? true : v === null ? 'Réponse vide' : v === 800 ? 'Réponse 800' : v === 2800 ? 'Réponse 2 800' : v === 3 ? 'Réponse 3' : ['', 'Ce n’est pas la valeur de la ligne Mardi. Relis la colonne Entrées.']
      });
      await x.say('oscar', '1 200, c’est noté dans mon carnet. Merci !');
    } },

    /* 5 — Les connexions invisibles */
    { async run(x) {
      demo(x);
      await x.pixel('Pour l’instant, notre démonstration ne contient qu’une table.');
      const illu = K.lesson('Illustration', 'Un futur modèle de données', `
        <div class="flow-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="flow-box"><b>Visiteurs</b><small>ID_Visiteur<br>Âge<br>Ville</small></div>
          <div class="flow-box"><b>Billets</b><small>ID_Billet<br>ID_Visiteur<br>Prix</small></div>
          <div class="flow-box"><b>Attractions</b><small>ID_Attraction<br>Nom<br>Passages</small></div>
        </div>
        <svg viewBox="0 0 300 40" style="width:100%; height:40px; margin-top:4px" fill="none" stroke="#B5BAD0" stroke-width="1.5" stroke-dasharray="4 4"><path d="M50 2v18h100V2M150 20h100V2"/></svg>
        <p class="lc-note">Illustration d’un futur modèle de données. Les relations seront enseignées dans le module 3.</p>`);
      x.app('illu', illu);
      await x.pixel('Mais à Wonderland, nous aurons bientôt des données sur les visiteurs, les billets, les attractions et les dépenses.');
      for (const b of $$('.flow-box', illu)) { b.classList.add('on'); await x.pause(350); }
      await x.pixel('Pour analyser plusieurs tables ensemble, il faut organiser leurs relations.');
      await x.pixel('Avant d’apprendre à les créer, retrouve simplement l’espace qui permet de les visualiser.');
      x.app('pbi');
      x.todo('Ouvre la vue Modèle et sélectionne la table Entrees_Demo.');
      x.guide('[data-a="view:model"]');
      const inModel = () => x.pbi.st.view === 'model';
      if (inModel()) x.guide('[data-a="mtable:Entrees_Demo"]');
      const cmdErr = { transform: 'Power Query', newmeasure: 'Nouvelle mesure', newtable: 'Nouvelle table', newcol: 'Nouvelle table', relations: 'Tentative de relation', filterpane: 'Volet Filtres' };
      await x.wait({
        view: v => { if (v === 'model') { x.guide('[data-a="mtable:Entrees_Demo"]'); return; } return x.oops(v === 'report' ? 'Vue Rapport' : 'Vue Table'); },
        'model.table': () => inModel() ? true : undefined,
        'model.tool': () => x.oops('Tentative de relation'),
        cmd: c => cmdErr[c] ? x.oops(cmdErr[c]) : undefined,
        pane: p => p === 'Filtres' ? x.oops('Volet Filtres') : undefined
      });
      await x.ok('Voici la vue Modèle. Une seule table pour l’instant : les relations viendront plus tard.');
    } },

    /* 6 — Le fichier qui pose problème */
    { async run(x) {
      demo(x);
      toast('lola', 'Nouveau message de Lola', 'Petit problème avec les données');
      await x.pause(1100);
      x.mail({ de: 'lola', heure: '09:42', objet: 'Petit problème avec les données', corps: ['Bonjour,', 'Les derniers fichiers contiennent des lignes vides et des dates incorrectes. Est-ce que Power BI permet de corriger tout ça avant de créer nos rapports ?', 'Merci ! Lola'] });
      await x.pause(2600);
      await x.pixel('Oui ! Power BI possède un éditeur appelé Power Query.');
      await x.pixel('Il permet de préparer les données avant de les exploiter.');
      x.closeAnswer();
      x.todo('Depuis le ruban Accueil, clique sur Transformer les données.');
      x.guide('[data-a="cmd:transform"]');
      const cmdErr = { get: 'Obtenir les données', excel: 'Obtenir les données', enter: 'Obtenir les données', refresh: 'Actualiser', newmeasure: 'Nouvelle mesure' };
      await x.wait({
        cmd: c => {
          if (c === 'transform') { x.pbi.openPQ(demoQueries()); return true; }
          return x.oops(cmdErr[c] || '', 'Cette commande ne sert pas ici. Cherche Transformer les données.');
        },
        view: v => v === 'table' ? x.oops('Vue Table') : undefined
      });
      x.guide();
      await x.pause(500, true);
      x.todo('Repère le panneau Étapes appliquées, en bas, et touche ses étapes.');
      x.pbi.mark('.pq-steps');
      let seen = false;
      const look = () => { if (!seen) { seen = true; x.pbi.mark('[data-q="x"]'); x.todo('Ferme maintenant l’éditeur avec la croix, sans rien modifier.'); } };
      const close = () => { if (!seen) return x.oops('Fermer sans repérer les étapes'); x.pbi.closePQ(); return true; };
      await x.wait({
        'pq.step': () => { look(); },
        'pq.steps': () => { look(); },
        'pq.close': close, 'pq.apply': close,
        'pq.cmd': c => x.oops(c === 'cols' || c === 'rows' ? 'Supprimer une colonne' : c === 'replace' ? 'Modifier une valeur' : '', 'Aucune nouvelle source n’est nécessaire ici.'),
        'pq.typeTry': () => x.oops('Modifier une valeur'),
        'pq.delstep': () => x.oops('', 'Garde les étapes intactes : nous observons seulement.'),
        'pq.replaceNoCol': () => x.oops('Modifier une valeur')
      });
      await x.ok('Chaque étape appliquée garde la trace d’une transformation, dans l’ordre.');
      await x.pixel('Nous reviendrons ici dans le deuxième module. Lola nous réserve beaucoup de travail !');
    } },

    /* 7 — Ton premier projet */
    { async run(x) {
      demo(x);
      const pbi = x.pbi;
      await x.say('victoria', 'Tu as découvert l’environnement. Il est temps de créer le véritable projet de Wonderland.');
      await x.say('victoria', 'Je veux que toutes nos futures analyses soient regroupées au même endroit.');
      x.todo('Crée un nouveau rapport depuis le menu Fichier.');
      x.guide(['[data-a="file"]', '[data-b="new"]']);
      let fresh = false;
      const R = () => pbi.P;
      const valid = () => { const P = R(); return fresh && P.name === 'Wonderland_Pilotage' && P.saved && !P.dirty && P.pages.length === 1 && P.pages[0].name === 'Vue générale' && !P.pages[0].visuals.length && !P.tables.length; };
      const next = () => {
        const P = R();
        if (P.pages[0].name !== 'Vue générale') { x.todo('Renomme la page « Page 1 » en « Vue générale » : touche son onglet.'); x.guide(['.ptab.on', '.menu button:first-child']); }
        else if (!P.name) { x.todo('Enregistre le projet sous le nom Wonderland_Pilotage.'); x.guide(['[data-a="file"]', '[data-b="saveas"]']); }
        else { x.todo('Enregistre à nouveau pour garder ce changement.'); x.guide('.pbi-save'); }
      };
      const openSaveAs = () => { pbi.closeBackstage(); pbi.saveAs({ name: R().name || 'Sans titre' }); };
      const doSave = () => {
        if (!fresh) return x.oops('Projet de démonstration conservé');
        if (!R().name) { openSaveAs(); return; }
        pbi.closeBackstage(); R().saved = true; R().dirty = false; pbi.render();
        if (valid()) return true; next();
      };
      await x.wait({
        'file.menu': () => {},
        file: k => {
          if (k === 'back') return;
          if (k === 'new') { pbi.closeBackstage(); if (!fresh) { fresh = true; newBlank(pbi); next(); } return; }
          if (k === 'saveas') { if (!fresh) return x.oops('Projet de démonstration conservé'); openSaveAs(); return; }
          if (k === 'save') return doSave();
          if (k === 'quit') return x.oops('Projet non enregistré');
          return x.oops('', fresh ? 'Cette commande n’est pas utile ici.' : 'Commence par créer un nouveau rapport avec Nouveau.');
        },
        save: () => doSave(),
        saveas: ({ name, ext }) => {
          if (ext !== 'pbix' || /\.xlsx$/i.test(name)) return x.oops('Extension .xlsx');
          if (!name || /^sans titre$/i.test(name)) return x.oops('Nom Sans titre');
          if (name !== 'Wonderland_Pilotage') return x.oops('Mauvais nom de projet');
          pbi.closeDialog();
          const P = R(); P.name = name; P.saved = true; P.dirty = false; pbi.render();
          if (valid()) return true;
          if (P.pages[0].name !== 'Vue générale') x.oops('Page 1 conservée');
          setTimeout(next, 2600);
        },
        'page.renameStart': () => fresh ? undefined : x.oops('Projet de démonstration conservé'),
        'page.rename': ({ name }) => {
          if (name === 'Vue générale') { setTimeout(next, 0); return; }
          if (K.norm(name) === K.norm('Vue générale')) return x.oops('', 'Presque : écris exactement « Vue générale », avec la majuscule et l’accent.');
          return x.oops('Page 1 conservée');
        },
        'page.dup': () => x.oops('Deux pages créées'), 'page.del': () => x.oops('Page supprimée'),
        page: () => fresh ? undefined : x.oops('Projet de démonstration conservé'),
        cmd: c => c === 'newpage' ? x.oops(fresh ? 'Deux pages créées' : 'Projet de démonstration conservé') : ['get', 'excel', 'enter'].includes(c) ? x.oops('', 'Pas de données pour l’instant : le projet doit rester vide.') : undefined,
        'dialog.cancel': () => {}
      });
      x.guide();
      await x.ok('Le projet Wonderland_Pilotage est créé et enregistré. Il nous suivra pendant tout le parcours.');
    }, avance: EX7 },

    /* 8 — Prêt à devenir Data Analyst ? */
    { async run(x) {
      await x.say('victoria', 'Avant de te confier les données de la billetterie, explique-moi comment tu comptes transformer nos fichiers en informations utiles.');
      const B = K.ordering({ key: () => want,
        title: 'Le processus d’analyse', intro: 'Pose chaque gare du trajet, de la première à la dernière.', btn: 'Valider le processus',
        items: [['report', 'Créer les rapports'], ['clean', 'Nettoyer les données'], ['publish', 'Publier et partager'], ['connect', 'Se connecter aux sources'], ['calc', 'Calculer les indicateurs'], ['model', 'Organiser le modèle']]
      });
      x.app('m8', B.el);
      x.todo('Pose les étapes du processus d’analyse dans l’ordre.');
      const want = ['connect', 'clean', 'model', 'calc', 'report', 'publish'];
      await x.wait({
        'order.change': () => { B.flag(); },
        'order.check': ({ order: o }) => {
          const ix = id => o.includes(id) ? o.indexOf(id) : 99;
          const wrong = () => B.flag(o.map((id, k) => id !== want[k] ? k : -1).filter(k => k >= 0));
          if (o.length < 6) return x.oops('Une étape manquante');
          wrong();
          if (o[0] === 'publish') return x.oops('Publication en première position');
          if (ix('clean') < ix('connect')) return x.oops('Nettoyage avant connexion');
          if (ix('model') < ix('connect')) return x.oops('Modélisation avant connexion');
          if (ix('report') < ix('clean')) return x.oops('Rapport avant préparation');
          if (ix('calc') < ix('model')) return x.oops('Calcul avant organisation du modèle');
          if (ix('publish') < ix('report')) return x.oops('Publication avant rapport');
          if (o.join() !== want.join()) return x.oops('Ordre global incorrect');
          B.flag(); B.lock(); return true;
        }
      });
      await x.ok('C’est exactement ça : les sources, le nettoyage, le modèle, les indicateurs, les rapports, puis le partage.');
      await x.pixel('Dans un vrai projet, on fait souvent des allers-retours : on revient sur une transformation ou un calcul après avoir créé un visuel.');
    } }
  ],

  outro: [
    { bg: 'bureau', n: 'Victoria regarde l’écran. Le projet Wonderland est encore vide, mais ses fondations sont prêtes.' },
    { p: 'victoria', t: 'Très bien ! Demain, nous commencerons avec les données de la billetterie.' },
    { p: 'victoria', t: 'J’aimerais savoir combien de visiteurs entrent réellement dans le parc et combien ils dépensent.' },
    { p: 'pixel', t: 'Ton premier jour est terminé ! Tu n’as pas encore créé de graphique, mais tu sais maintenant où travailler et comment organiser ton projet.' },
    { clear: 1, bg: 'parc', n: 'Le soleil se couche derrière la grande roue. Une lumière s’allume dans le bâtiment de la billetterie.' },
    { wait: 900 }
  ],
  recompense: { titre: 'Premier jour réussi !', sous: 'Tu fais officiellement partie de Wonderland.', badge: 'b101', badgeNom: 'Agent Data — Niveau 1', objet: 'plante' },
  fiches: [
    ['Power BI', 'À quoi sert Power BI ?', 'À récupérer des données de plusieurs sources, les transformer, les relier puis les présenter dans des rapports interactifs.'],
    ['Les formats de sources', 'Comment reconnaître le format d’une source ?', 'Par son extension ou sa nature : .xlsx pour Excel, .csv pour un fichier texte structuré, une base SQL, un PDF, un dossier, une adresse Web.'],
    ['Vue Rapport', 'Dans quelle vue crée-t-on les graphiques ?', 'Dans la vue Rapport : on y place les visuels sur les pages du canevas.'],
    ['Vue Table', 'Où vérifier la valeur exacte d’une donnée chargée ?', 'Dans la vue Table, qui affiche les lignes et les colonnes de chaque table du modèle.'],
    ['Vue Modèle', 'Quelle vue montre les tables et leurs relations ?', 'La vue Modèle : elle présente la structure, c’est-à-dire les tables, leurs colonnes et les liens entre elles.'],
    ['Power Query', 'Où prépare-t-on les données avant de les charger ?', 'Dans l’éditeur Power Query, ouvert avec Accueil › Transformer les données. Chaque transformation devient une étape appliquée.'],
    ['Le fichier .pbix', 'Quelle extension porte un projet Power BI Desktop ?', '.pbix. Ce fichier regroupe les requêtes, le modèle de données et les pages du rapport.'],
    ['Le processus d’analyse', 'Dans quel ordre travaille un analyste ?', 'Se connecter aux sources, nettoyer, organiser le modèle, calculer les indicateurs, créer les rapports, puis publier et partager.']
  ],
  suite: [
    { bg: 'bureau', mail: { de: 'lola', heure: '08:30', objet: 'Les ventes de billets', corps: ['Bonjour ! J’ai récupéré le fichier Excel de la billetterie. Il contient toutes les ventes de billets des premiers jours du mois.', 'Je te l’envoie, Victoria attend les premiers chiffres !'], pj: { nom: 'Billetterie_Wonderland.xlsx', type: 'xlsx', info: 'Nouveau fichier disponible' } } },
    { p: 'pixel', t: 'Notre première véritable source de données ! Aujourd’hui, nous allons apprendre à l’importer dans Power BI.' }
  ],
  fin(P) { EX7(P); }
};
const arrow = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M7 2v10M3.5 8.5L7 12l3.5-3.5"/></svg>';
window.PBQ.mission(def);
})();

/* Mission 103 — Le registre des visiteurs */
(function () {
'use strict';
const { h, esc, fr, $, $$, clone, D, toast } = window.PBQ;
const SRC = 'src_frequentation_20260606_v1';
const COLS = [['ID_Entree', 'text'], ['ID_Billet', 'text'], ['ID_Vente', 'text'], ['Date_Entree', 'date'], ['Heure_Entree', 'text'], ['Portique', 'text'], ['Zone_Entree', 'text']].map(([n, t]) => ({ n, t }));

function importFrequentation(P) {
  if (P.tables.some(t => t.id === 'tbl_frequentation')) return;
  P.sources.push({ id: SRC, fileName: 'Frequentation_Wonderland.csv', connector: 'Csv.Document', version: 1, service: 'Fréquentation', delimiter: ';', encoding: 65001 });
  P.connections = (P.connections || []).concat({ id: 'conn_frequentation_001', sourceId: SRC, status: 'connected' });
  P.queries.push({ id: 'qry_frequentation', name: 'Frequentation_Wonderland', tableId: 'tbl_frequentation', sourceId: SRC, loadEnabled: true, kind: 'csv', file: 'Frequentation_Wonderland.csv', delim: ';', enc: 65001,
    cols: COLS.map(c => ({ n: c.n, t: 'text' })), data: D.entrees,
    steps: [{ op: 'source', name: 'Source' }, { op: 'promote', name: 'En-têtes promus' }, { op: 'type', name: 'Type modifié', auto: true, changes: COLS.map(c => [c.n, c.t]) }] });
  P.tables.push({ id: 'tbl_frequentation', name: 'Frequentation_Wonderland', queryId: 'qry_frequentation', sourceId: SRC, loadStatus: 'completed', cols: clone(COLS), rows: clone(D.entrees) });
}

const FILES = [
  { id: SRC, nom: 'Frequentation_Wonderland.csv', type: 'csv', date: '06/06/2026' },
  { id: 'f_billet', nom: 'Billetterie_Wonderland.xlsx', type: 'xlsx', date: '06/06/2026', err: 'Sélection de Billetterie_Wonderland.xlsx' },
  { id: 'f_archive', nom: 'Frequentation_Mai_2026.csv', type: 'csv', date: '31/05/2026', err: 'Sélection d’une archive de fréquentation' },
  { id: 'f_budget', nom: 'Budget_Wonderland.xlsx', type: 'xlsx', date: '01/06/2026', fb: 'Ce fichier contient des prévisions budgétaires, pas les passages aux portiques.' },
  { id: 'f_marketing', nom: 'Rapport_Marketing.pdf', type: 'pdf', date: '04/06/2026', fb: 'Ce rapport n’est pas l’export des portiques.' },
  { id: 'f_maint', nom: 'Maintenance.xlsx', type: 'xlsx', date: '03/06/2026', fb: 'Ce fichier concerne les incidents techniques.' }
];
const DELIM_ERR = { ',': 'Virgule', '\t': 'Tabulation', ' ': 'Espace', ':': 'Deux-points', '-': 'Tiret personnalisé', '|': 'Séparateur personnalisé', '': 'Aucun séparateur' };
const ENC_ERR = { 1252: 'Windows-1252', 20127: 'ASCII', 28591: 'ISO-8859-1', 1200: 'UTF-16 LE', 1201: 'UTF-16 BE' };

function ensureCsv(x, st = {}) {
  const pbi = x.pbi;
  if (pbi.dlgKind !== 'csv') { pbi.csvDialog({ file: 'Frequentation_Wonderland.csv', text: D.entreesCsv, enc: st.enc || 1252, delim: st.delim || ',' }); }
  x.app('pbi');
  return pbi.csvState;
}
const csvOk = st => st.delim === ';' && st.enc === 65001;

const def = {
  id: 103,
  objectifs: ['Importer un fichier Texte/CSV', 'Corriger le délimiteur et l’encodage', 'Distinguer les ventes et les entrées réelles'],
  intro: [
    { bg: 'portiques', n: 'Une famille présente ses billets. Chaque billet est scanné, le portique s’ouvre, et une ligne s’ajoute dans le système.' },
    { n: 'Plus loin, un billet acheté en ligne reste inutilisé.' },
    { card: { k: 'Un billet acheté en ligne', ul: ['Achat enregistré : 1 billet vendu.', 'Entrée enregistrée : aucune, le billet n’a pas servi.'] } },
    { n: 'Acheter un billet ne signifie pas forcément entrer dans le parc. Pour comprendre la fréquentation, il faut examiner les données des portiques.' },
    { clear: 1, bg: 'conseil', p: 'gabriel', t: 'Nous avons enregistré quarante billets vendus pendant les cinq premiers jours de juin.' },
    { p: 'victoria', t: 'Quarante visiteurs ? C’est donc notre fréquentation sur cette période ?' },
    { p: 'oscar', t: 'Pas exactement. Certains billets concernent des visites prévues après le 5 juin. Et certains visiteurs ne se sont pas présentés.' },
    { p: 'victoria', t: 'Dans ce cas, comment savoir combien de personnes sont réellement venues ?' },
    { p: 'oscar', t: 'Nos portiques enregistrent chaque première entrée validée. Nous devons intégrer ces données à Power BI.' },
    { clear: 1, bg: 'bureau', mail: { de: 'oscar', a: 'Direction Data', heure: '08:45', objet: 'Export des entrées du parc', corps: ['Bonjour, voici les entrées enregistrées par nos portiques entre le 1er et le 5 juin.', 'Attention, notre système produit un fichier CSV. Le fournisseur indique qu’il utilise le point-virgule comme séparateur et l’encodage UTF-8.', 'Peux-tu l’intégrer à notre projet Power BI ? Merci ! Oscar'], pj: { nom: 'Frequentation_Wonderland.csv', type: 'csv', info: 'Export des portiques d’entrée' } } },
    { p: 'pixel', t: 'Un CSV ? C’est différent du fichier Excel d’hier. Mais ne t’inquiète pas, Power BI sait aussi lire ce type de fichier.' },
    { btn: 'Récupérer le registre des visiteurs' }
  ],
  leconTitre: 'Comprendre le format CSV',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Un classeur, un fichier texte', `
      <div class="flow-row" style="grid-template-columns:1fr 1fr">
        <div class="flow-box on"><b>Classeur Excel</b><small>Feuilles, tableaux, formules, styles et formats.</small></div>
        <div class="flow-box on"><b>Fichier CSV</b><small>Du texte, et des valeurs séparées par un délimiteur.</small></div>
      </div>
      <div class="mono" style="margin-top:10px">ID;Billets
B001;2
B002;1
B003;1</div>
      <div data-lab="delim" style="display:none">
        <div class="lc-k" style="margin-top:14px">Expérience · Le délimiteur</div>
        <div class="seg" data-g="d"><button data-v=",">Virgule</button><button data-v=";">Point-virgule</button><button data-v="\t">Tabulation</button></div>
        <div class="lab-out" data-o="d"></div>
      </div>
      <div data-lab="enc" style="display:none">
        <div class="lc-k" style="margin-top:14px">Expérience · L’encodage</div>
        <div class="seg" data-g="e"><button data-v="1252">1252 : Windows</button><button data-v="65001">65001 : UTF-8</button></div>
        <div class="lab-out" data-o="e"></div>
      </div>`);
    x.app('lecon', card);
    const sample = 'ID_Entree;Portique;Zone_Entree\nE001;P01;Entrée Nord\nE002;P02;Entrée Sud';
    const tbl = (rows) => `<table class="tbl" style="margin-top:2px"><thead><tr>${rows[0].map(c => `<th><span class="thc">${esc(c)}</span></th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const drawD = d => { const rows = sample.split('\n').map(l => l.split(d)); $('[data-o="d"]', card).innerHTML = tbl(rows) + `<p class="lc-note">${rows[0].length === 1 ? 'Une seule colonne : le séparateur choisi ne correspond pas au fichier.' : 'Trois colonnes : le séparateur correspond au fichier.'}</p>`; $$('[data-g="d"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === d)); };
    const drawE = e => { const fix = s => e === '65001' ? s : s.replace(/é/g, 'Ã©'); const rows = [['Portique', 'Zone_Entree'], ['P01', fix('Entrée Nord')], ['P02', fix('Entrée Sud')], ['P03', fix('Entrée Est')]]; $('[data-o="e"]', card).innerHTML = tbl(rows) + `<p class="lc-note">${e === '65001' ? 'Les accents sont lus correctement.' : 'Les octets UTF-8 sont interprétés avec le mauvais encodage.'}</p>`; $$('[data-g="e"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === e)); };
    $$('[data-g] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.' + b.parentElement.dataset.g, b.dataset.v)));
    await x.pixel('Un CSV est un fichier texte qui représente des données en tableau.');
    await x.pixel('Chaque ligne est un enregistrement, et les valeurs sont séparées par un caractère : le délimiteur.');
    await x.pixel('Pas de feuilles ni de types déclarés : Power BI doit interpréter les valeurs lui-même.');
    $('[data-lab="delim"]', card).style.display = ''; drawD(',');
    card.firstElementChild.scrollTo({ top: 9999, behavior: 'smooth' });
    await x.pixel('Comment Power BI sait-il où commence et où se termine chaque colonne ? Grâce au séparateur !');
    x.todo('Essaie les séparateurs jusqu’à obtenir trois colonnes.');
    x.target($$('[data-g="d"] button', card));
    await x.wait({ 'lab.d': v => { drawD(v); if (v === ';') return true; }, 'lab.e': () => {} });
    x.untarget();
    await x.ok('Le point-virgule est fréquent dans les fichiers francophones. Mais vérifie toujours la structure réelle de la source.');
    $('[data-lab="enc"]', card).style.display = ''; drawE('1252');
    card.firstElementChild.scrollTo({ top: 9999, behavior: 'smooth' });
    await x.pixel('L’encodage indique comment les caractères sont écrits dans le fichier.');
    await x.pixel('Si on l’interprète mal, les accents deviennent illisibles.');
    x.todo('Choisis l’encodage qui rend les accents lisibles.');
    x.target($$('[data-g="e"] button', card));
    await x.wait({ 'lab.e': v => { drawE(v); if (v === '65001') return true; }, 'lab.d': v => { drawD(v); } });
    x.untarget();
    await x.ok('Avec UTF-8, « Entrée » retrouve son accent.');
    await x.pixel('Dans Power BI, le connecteur Texte/CSV permet de régler l’origine du fichier, le délimiteur et la détection des types.');
  },

  exs: [
    /* 1 — Une nouvelle source de données */
    { async run(x) {
      const pbi = x.pbi; x.app('pbi'); pbi.closeDialog(true); pbi.st.view = 'report'; pbi.render();
      await x.pixel('Notre table de billetterie est toujours là. Nous devons ajouter les entrées du parc, sans supprimer ce qui est déjà chargé.');
      x.todo('Ouvre le fichier Frequentation_Wonderland.csv avec le bon connecteur.');
      x.guide('[data-a="cmd:get"]');
      const CONN = { excel: 'Connecteur Excel', sql: 'Connecteur SQL Server', web: 'Connecteur Web', folder: 'Connecteur Dossier', pdf: 'Connecteur PDF' };
      await x.wait({
        cmd: c => {
          if (c === 'get') { pbi.getData(); x.guide(['[data-c="csv"]', '[data-d="connect"]']); return; }
          if (c === 'excel') return x.oops('Connecteur Excel');
          return x.oops('', 'Cherche le connecteur dans Obtenir les données.');
        },
        'connector.pick': () => {},
        connector: c => {
          if (!c) return x.oops('', 'Sélectionne d’abord un connecteur.');
          if (c === 'csv') { pbi.filePicker(FILES); x.guide([`[data-f="${SRC}"]`, '[data-d="open"]']); return; }
          return x.oops(CONN[c] || '', 'Ce connecteur ne lit pas les fichiers texte.');
        },
        'file.pick': () => {},
        'file.open': id => {
          if (!id) return x.oops('', 'Sélectionne d’abord un fichier.');
          const f = FILES.find(f => f.id === id);
          if (f.err || f.fb) return x.oops(f.err || '', f.fb);
          ensureCsv(x); return true;
        },
        'dialog.cancel': () => { x.guide('[data-a="cmd:get"]'); },
        'file.menu': () => {}, file: k => k === 'new' ? x.oops('Nouveau rapport') : k === 'back' ? undefined : x.oops('', 'Reste dans le projet Wonderland_Pilotage.')
      });
      x.guide();
      await x.ok('Le fichier est ouvert. Un nouveau dossier rejoint celui de la billetterie dans l’armoire.');
    } },

    /* 2 — Toutes les données dans une seule colonne ! */
    { async run(x) {
      const st = ensureCsv(x);
      await x.pixel('Oups ! Le fichier contient sept informations différentes, mais l’aperçu les affiche toutes dans une seule colonne.');
      await x.pixel('Le séparateur choisi ne doit pas être le bon.');
      x.todo('Choisis le délimiteur qui répartit les valeurs en sept colonnes.');
      x.guide(['[data-x="delim"]', '.menu button:nth-child(2)']);
      if (st.delim === ';') { await x.pause(300); }
      else await x.wait({
        'csv.delim': ({ value }) => { if (value === ';') return true; x.oops(DELIM_ERR[value] || '', 'Ce caractère ne sépare pas nos colonnes.'); },
        'csv.enc': () => {}, 'csv.detect': () => {}, 'csv.row': () => {},
        'csv.load': () => x.oops('Charger avant correction'), 'csv.transform': () => x.oops('Charger avant correction'),
        'csv.cancel': () => x.oops('', 'Garde la fenêtre ouverte : on corrige l’aperçu.'), 'csv.close': () => x.oops('', 'Garde la fenêtre ouverte : on corrige l’aperçu.')
      });
      x.guide();
      await x.ok('Sept colonnes bien séparées : ID_Entree, ID_Billet, ID_Vente, Date_Entree, Heure_Entree, Portique, Zone_Entree.');
    } },

    /* 3 — Le mystère des accents disparus */
    { async run(x) {
      const st = ensureCsv(x, { delim: ';' });
      const pv = $('.dlg .nav-prev', x.pbi.el); if (pv) pv.scrollTo({ left: pv.scrollWidth, behavior: 'smooth' });
      await x.say('oscar', 'Attends… pourquoi est-il écrit EntrÃ©e Nord ? Nos portiques ne s’appellent pas comme ça !');
      await x.pixel('Le fichier utilise UTF-8, mais il est lu avec un autre encodage. Corrigeons son origine.');
      x.todo('Règle l’origine du fichier sur l’encodage indiqué par Oscar.');
      x.guide(['[data-x="enc"]', '.menu button:nth-child(2)']);
      const done = () => csvOk(st);
      if (done()) await x.pause(300);
      else await x.wait({
        'csv.enc': ({ value }) => { if (value === 65001) { if (done()) return true; x.oops('', 'L’encodage est bon. Remets le point-virgule comme délimiteur.'); return; } x.oops(ENC_ERR[value] || '', 'Ce n’est pas l’encodage du fichier.'); },
        'csv.delim': ({ value }) => { if (value !== ';') { x.oops('Changer le délimiteur'); return; } if (done()) return true; },
        'csv.detect': () => {}, 'csv.row': () => {},
        'csv.load': () => x.oops('Charger les caractères corrompus'), 'csv.transform': () => x.oops('Charger les caractères corrompus'),
        'csv.cancel': () => x.oops('', 'Garde la fenêtre ouverte.'), 'csv.close': () => x.oops('', 'Garde la fenêtre ouverte.')
      });
      x.guide();
      await x.say('oscar', 'Voilà ! Je reconnais enfin les noms de mes portiques.');
    } },

    /* 4 — Retrouver une entrée précise */
    { async run(x) {
      const st = ensureCsv(x, { delim: ';', enc: 65001 });
      await x.say('oscar', 'Peux-tu retrouver l’entrée E021 ? Je voudrais connaître le billet utilisé et le portique par lequel il est passé.');
      await x.pixel('La première ligne du fichier fournit les en-têtes : sept colonnes. Cherche E021 dans ID_Entree.');
      x.todo('Retrouve l’entrée E021 dans l’aperçu et touche sa ligne.');
      x.guide(() => $$('.dlg tbody tr', x.pbi.el)[20]);
      let row = null;
      await x.wait({
        'csv.row': ({ row: r }) => {
          const id = r && r.ID_Entree; row = id;
          if (!csvOk(st)) return x.oops('', 'Remets d’abord le point-virgule et UTF-8.');
          if (id === 'E021') return true;
          if (id === 'E020') return x.oops('Ligne E020');
          if (id === 'E022') return x.oops('Ligne E022');
          x.oops('', `Tu as touché l’entrée ${id}. Oscar cherche E021.`);
        },
        'csv.delim': () => {}, 'csv.enc': () => {}, 'csv.detect': () => {},
        'csv.load': () => x.oops('', 'Vérifie d’abord l’entrée E021.'), 'csv.cancel': () => x.oops('', 'Garde la fenêtre ouverte.'), 'csv.close': () => x.oops('', 'Garde la fenêtre ouverte.')
      });
      x.guide();
      st.compact = true; x.pbi.csvDraw();
      x.todo('Relève le billet utilisé et le portique de l’entrée E021.');
      await x.inputs({
        lbl: 'Réponse pour Oscar', q: 'Entrée E021 : quel billet, quel portique ?', btn: 'Envoyer à Oscar',
        fields: [{ id: 'b', label: 'Identifiant du billet', text: true }, { id: 'p', label: 'Portique', text: true }],
        check: ({ b, p }) => {
          const B = b.toUpperCase().replace(/\s/g, ''), Pq = p.toUpperCase().replace(/\s/g, '');
          if (!B || !Pq) return 'Réponse incomplète';
          if (B === 'B010') return 'Réponse B010';
          if (B === 'E021') return 'Réponse E021';
          if (B === 'B010-02') return 'Réponse B010-02';
          if (B !== 'B010-01') return ['', 'Relis la colonne ID_Billet sur la ligne E021.'];
          if (Pq === 'P01') return 'Portique P01';
          if (Pq !== 'P02') return ['', 'Relis la colonne Portique sur la ligne E021.'];
          return true;
        }
      });
      st.compact = false; x.pbi.csvDraw();
      await x.say('oscar', 'B010-01 par le portique P02, l’entrée Sud. Parfait, merci !');
    } },

    /* 5 — Connecter les portiques à Power BI */
    { async run(x) {
      const st = ensureCsv(x, { delim: ';', enc: 65001 });
      st.compact = false; x.pbi.csvDraw();
      await x.pixel('Séparateur identifié, encodage corrigé, contenu vérifié : notre deuxième source est prête.');
      x.todo('Ajoute ces données au modèle.');
      x.guide('[data-d="load"]');
      await x.wait({
        'csv.load': () => {
          if (st.delim !== ';') return x.oops('Charger avec un mauvais délimiteur');
          if (st.enc !== 65001) return x.oops('Charger avec un mauvais encodage');
          x.pbi.loading('Chargement de Frequentation_Wonderland dans le modèle…', 27); return true;
        },
        'csv.transform': () => x.oops('Transformer les données'),
        'csv.delim': () => {}, 'csv.enc': () => {}, 'csv.detect': () => {}, 'csv.row': () => {},
        'csv.cancel': () => x.oops('', 'Garde la fenêtre ouverte : il reste à charger.'), 'csv.close': () => x.oops('', 'Garde la fenêtre ouverte : il reste à charger.')
      });
      x.guide();
      await x.wait({ 'load.done': () => true, 'load.cancel': () => x.oops('Interrompre le chargement') });
      const P = x.pbi.P; importFrequentation(P); P.dirty = true; x.pbi.st.pane = 'Données'; x.pbi.render();
      x.pbi.mark('.panes');
      await x.ok('Une deuxième table rejoint le modèle, à côté de tBilletterie. Les deux sources restent séparées.');
      x.pbi.mark();
    }, avance: P => { importFrequentation(P); P.dirty = true; } },

    /* 6 — Les données sont-elles bien arrivées ? */
    { async run(x) {
      const pbi = x.pbi; x.app('pbi'); pbi.closeDialog(true);
      await x.pixel('Avant d’utiliser ces données, vérifions que l’importation est complète. Une petite erreur fausserait toutes nos analyses.');
      x.todo('Ouvre la vue Table et sélectionne Frequentation_Wonderland.');
      x.guide('[data-a="view:table"]');
      const inTable = () => pbi.st.view === 'table';
      if (inTable()) x.guide('[data-a="tsel:tbl_frequentation"]');
      await x.wait({
        view: v => { if (v === 'table') { x.guide('[data-a="tsel:tbl_frequentation"]'); return; } if (v === 'model') return x.oops('', 'Commence par la vue Table : on vérifie les valeurs.'); },
        'table.select': id => { if (!inTable()) return x.oops('', 'Ouvre d’abord la vue Table.'); if (id === 'tbl_billetterie') { x.oops('Table de billetterie sélectionnée'); return; } return true; }
      });
      x.guide();
      x.todo('Remplis la fiche de contrôle du registre.');
      await x.inputs({
        lbl: 'Fiche de contrôle', q: 'Que contient Frequentation_Wonderland ?', btn: 'Valider les comptes',
        fields: [{ id: 'l', label: 'Nombre de lignes' }, { id: 'c', label: 'Nombre de colonnes' }],
        check: ({ l, c }) => {
          if (l === null || c === null) return ['', 'Renseigne les deux nombres.'];
          if (l === 40) return '40 lignes'; if (l === 20) return '20 lignes'; if (l === 28) return '28 lignes';
          if (l !== 27) return ['', 'Regarde le nombre de lignes indiqué au-dessus de la table.'];
          if (c === 1) return 'Une colonne'; if (c === 8) return 'Huit colonnes';
          if (c !== 7) return ['', 'Compte les en-têtes, de ID_Entree à Zone_Entree.'];
          return true;
        }
      });
      await x.ask('Quel libellé de zone figure maintenant dans la table ?', [
        { t: 'EntrÃ©e Nord', err: 'EntrÃ©e Nord' },
        { t: 'Entrée Nord', ok: true },
        { t: 'Entree Nord', msg: 'Les accents ont bien été conservés. Relis la colonne Zone_Entree.' }
      ]);
      x.todo('Ouvre la vue Modèle pour voir les tables du projet.');
      x.guide('[data-a="view:model"]');
      await x.wait({ view: v => v === 'model' ? true : undefined, 'table.select': () => {} });
      x.guide();
      await x.ok('Deux tables distinctes dans le modèle : les ventes et les entrées. Aucune relation pour l’instant.');
    } },

    /* 7 — Le piège de Victoria */
    { async run(x) {
      await x.say('victoria', 'Alors, nous avons vendu quarante billets, mais enregistré seulement vingt-sept entrées.');
      await x.say('victoria', 'Cela veut dire que treize visiteurs ne sont pas venus ?');
      await x.pixel('Avant de répondre, observe les dates de visite prévues. Les billets vendus ne concernent pas tous la même période !');
      const board = K.lesson('Tableau d’enquête', '40 billets vendus du 1er au 5 juin', `
        <p class="lc-note" style="margin:0 0 10px">Le registre des portiques s’arrête au 5 juin et contient 27 entrées.</p>
        <table class="tbl" style="width:100%"><thead><tr><th><span class="thc">Date de visite prévue</span></th><th class="r"><span class="thc">Billets</span></th></tr></thead><tbody>
        ${[['01/06/2026', 3], ['02/06/2026', 6], ['03/06/2026', 4], ['04/06/2026', 8], ['05/06/2026', 10], ['06/06/2026', 5], ['07/06/2026', 4]].map(r => `<tr><td>${r[0]}</td><td class="r">${r[1]}</td></tr>`).join('')}
        <tr><td><b>Total</b></td><td class="r"><b>40</b></td></tr></tbody></table>
        <div class="lc-big" style="margin-top:12px"><b class="num" data-tot>0</b><span>billets répartis sur 40</span></div>
        <p class="lc-note">Support précalculé pour l’enquête : rien n’est ajouté au projet.</p>`);
      x.app('enquete', board);
      x.todo('Aide Victoria à répartir les 40 billets.');
      await x.inputs({
        lbl: 'Répartition des 40 billets', btn: 'Présenter mes résultats',
        fields: [{ id: 'e', label: 'Entrées enregistrées' }, { id: 'u', label: 'Billets inutilisés à échéance' }, { id: 'f', label: 'Visites futures' }],
        live: ({ e, u, f }) => { $('[data-tot]', board).textContent = (e || 0) + (u || 0) + (f || 0); },
        check: ({ e, u, f }) => {
          if (e === null || u === null || f === null) return ['', 'Renseigne les trois catégories.'];
          if (e === 40) return '40 entrées'; if (e === 31) return '31 entrées'; if (e === 20) return '20 visiteurs';
          if (u === 13) return '13 absences'; if (u === 9) return '9 absences'; if (u === 0) return '0 absence';
          if (e + u + f !== 40) return 'Total différent de 40';
          if (e !== 27) return ['', 'Le registre des portiques donne le nombre d’entrées enregistrées.'];
          if (f !== 9) return ['', 'Compte les billets prévus après le 5 juin.'];
          return true;
        }
      });
      await x.ask('Peut-on dire que 27 personnes différentes sont venues au parc ?', [
        { t: 'Oui, 27 personnes différentes', err: '27 personnes uniques' },
        { t: 'Non : 27 entrées, une par billet, sans identifiant de personne', ok: true }
      ]);
      await x.say('victoria', 'C’est exactement pour cette raison que nous avons besoin d’un Data Analyst. Un chiffre mal interprété peut nous conduire à une mauvaise décision.');
    } },

    /* 8 — Deux sources, un seul projet */
    { async run(x) {
      const pbi = x.pbi; x.app('pbi'); pbi.closeDialog(true);
      const P = () => pbi.P;
      await x.pixel('Nous avons maintenant deux tables. Demain, nous vérifierons leurs types de données avant de commencer les analyses.');
      const valid = () => pbi.st.view === 'report' && !P().dirty && P().name === 'Wonderland_Pilotage' && P().tables.length === 2 && P().pages.length === 1 && !P().pages[0].visuals.length && !P().relationships.length;
      const next = () => {
        if (pbi.st.view !== 'report') { x.todo('Reviens dans la vue Rapport, sur la page Vue générale.'); x.guide('[data-a="view:report"]'); }
        else { x.todo('Enregistre le projet Wonderland_Pilotage.'); x.guide('.pbi-save'); }
      };
      next();
      const save = () => { pbi.closeBackstage(); P().dirty = false; P().saved = true; pbi.render(); if (valid()) return true; next(); };
      await x.wait({
        view: v => { if (v === 'report') setTimeout(() => { if (valid()) PBQ.act('ok.state'); else next(); }, 0); },
        'ok.state': () => valid() ? true : undefined,
        save: () => save(),
        'file.menu': () => {},
        file: k => {
          if (k === 'back') return;
          if (k === 'save') return save();
          if (k === 'saveas') { pbi.closeBackstage(); pbi.saveAs({ name: 'Wonderland_Pilotage' }); return; }
          if (k === 'new') return x.oops('Nouveau projet');
          if (k === 'export') return x.oops('Exportation PDF');
          if (k === 'quit') return x.oops('Fermeture sans sauvegarde');
          return x.oops('', 'Cette commande ne sert pas à enregistrer.');
        },
        saveas: ({ name, ext }) => { if (name !== 'Wonderland_Pilotage' || ext !== 'pbix') return x.oops('Enregistrement sous un autre nom'); pbi.closeDialog(); return save(); },
        'dialog.cancel': () => {},
        'model.tool': () => x.oops('Création d’une relation'),
        cmd: c => c === 'relations' ? x.oops('Création d’une relation') : undefined
      });
      x.guide();
      await x.ok('Projet enregistré : deux sources, deux tables, et toujours une seule page.');
    }, avance: P => { P.dirty = false; P.saved = true; } }
  ],

  outro: [
    { bg: 'conseil', p: 'oscar', t: 'Nous savons désormais que 27 entrées ont été enregistrées. Nous avons une source distincte pour suivre la fréquentation réelle.' },
    { p: 'gabriel', t: 'Nos recettes et notre fréquentation ne racontent donc pas forcément la même histoire.' },
    { p: 'victoria', t: 'Très bien. À partir de maintenant, je veux que nos rapports distinguent systématiquement les ventes et les entrées du parc.' },
    { clear: 1, card: { k: 'Objectifs intermédiaires de Wonderland', ul: ['Préparer le projet Power BI : fait', 'Connecter la billetterie : fait', 'Connecter les portiques d’entrée : fait', 'Vérifier la qualité des données', 'Construire les premiers indicateurs', 'Présenter le premier rapport'] } },
    { p: 'victoria', t: 'C’est un excellent début. Mais avant d’utiliser ces chiffres, assure-toi que toutes nos données sont correctement interprétées.' },
    { clear: 1, bg: 'parc', n: 'Les portiques s’illuminent. Une nouvelle connexion rejoint le centre de données du parc.' },
    { card: { k: 'Réseau de données du parc', h: '2 services sur 6 connectés', chips: ['Billetterie', 'Fréquentation'] } },
    { wait: 800 }
  ],
  recompense: { titre: 'Les portes sont ouvertes !', sous: 'Tu viens de connecter une deuxième source de données.', badge: 'b103', badgeNom: 'Explorateur de données', objet: 'grande-roue' },
  fiches: [
    ['Fichier CSV', 'Qu’est-ce qu’un fichier CSV ?', 'Un fichier texte : chaque ligne est un enregistrement et les valeurs sont séparées par un délimiteur.'],
    ['Le délimiteur', 'À quoi sert le délimiteur ?', 'À indiquer où s’arrête chaque valeur. Avec le mauvais séparateur, tout reste dans une seule colonne.'],
    ['Le point-virgule', 'Pourquoi trouve-t-on souvent des points-virgules ?', 'Dans les environnements francophones, la virgule sert de séparateur décimal. Vérifie toujours la structure réelle du fichier.'],
    ['L’encodage', 'Pourquoi « EntrÃ©e » au lieu de « Entrée » ?', 'Le fichier est en UTF-8 mais il est lu avec un autre encodage, comme Windows-1252. On corrige l’origine du fichier.'],
    ['Origine du fichier', 'Quel réglage pour un fichier UTF-8 ?', '65001 : Unicode (UTF-8), dans la liste Origine du fichier du connecteur Texte/CSV.'],
    ['Les types d’un CSV', 'Un CSV déclare-t-il le type de ses colonnes ?', 'Non. Ce n’est que du texte : Power BI interprète les valeurs et peut détecter les types automatiquement.'],
    ['Ventes et entrées', '40 billets vendus, 27 entrées : 13 absents ?', 'Non. Neuf billets concernent des visites après le 5 juin. Seuls 4 billets prévus avant la clôture n’ont pas servi.'],
    ['Entrées et personnes', '27 entrées, est-ce 27 personnes différentes ?', 'Pas forcément : le registre compte une entrée par billet, sans identifiant de personne.']
  ],
  suite: [
    { bg: 'controle', n: 'Le lendemain, Pixel prépare une comparaison entre les dates de vente et les dates d’entrée. Des symboles apparaissent au-dessus des colonnes.' },
    { card: { k: 'Les types de données', chips: ['ABC Texte', '123 Nombre entier', '1,2 Nombre décimal', 'Date', '09:30 Heure', 'Vrai/Faux'] } },
    { p: 'pixel', t: 'Nous avons bien importé nos données. Mais sais-tu que Power BI peut lire un nombre comme du texte ? Ou une date comme une simple chaîne de caractères ?' },
    { p: 'gabriel', t: 'Avant de calculer nos recettes, vérifie que Power BI reconnaît correctement nos montants, nos dates et nos quantités.' },
    { p: 'pixel', t: 'Notre prochaine mission sera donc de vérifier les types de données de nos deux tables.' }
  ],
  accroche: 'Tu importeras l’export des portiques : format CSV, délimiteur, encodage, et une deuxième table dans le modèle.',
  fin(P) { importFrequentation(P); P.dirty = false; P.saved = true; }
};
window.PBQ.mission(def);
window.PBQ.importFrequentation = importFrequentation;
})();

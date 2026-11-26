/* Mission 201 — Le fichier catastrophe (diagnostic d'un fichier brut) */
(function () {
'use strict';
const { esc, fr, $, $$, h } = window.PBQ;
const PBI = window.PBI;
const FILE = 'Maintenance_Wonderland_Brut.xlsx', SHEET = 'Export_Maintenance', NAME = 'prep_Maintenance_Brut';

/* ───────── État canonique ───────── */
const imported = P => P.queries.find(q => q.m2 && q.steps[0] && q.steps[0].op === 'excel' && q.steps[0].file === FILE);
function EX1(P) { if (!imported(P)) { const q = PBI.excelQuery(P, FILE, SHEET, SHEET); q.id = 'q_brut'; P.queries.push(q); } }
function EX2(P) { const q = imported(P); q.name = NAME; q.load = false; q.group = 'Maintenance'; K2.grp(P, 'Maintenance'); }
function EX3(P) { const q = imported(P); q.steps = q.steps.filter(s => s.op === 'excel' || s.op === 'nav'); }
function EX7(P) { P.registre = K2.REG.map(r => ({ id: r.id, c: r.c, t: r.t, ids: r.ids.slice(), m: r.m, statut: r.cert ? 'Anomalie certaine' : 'À investiguer' })); }
function EX8(P) { P.name = 'Wonderland_Pilotage_M201'; P.saved = true; P.dirty = false; }

/* Lignes du fichier reçu, telles qu'Excel les numérote */
const XL = [[1, 'WONDERLAND — extrait maintenance mai 2026'], [2, 'Export manuel du 07/06/2026 — données fictives de formation'], [3, 'Note atelier : montants saisis depuis plusieurs postes…'], [4, 'Périmètre attendu : demandes et interventions de mai…'], [5, ''], [6, 'ID_Intervention · Attraction · Date_Demande · …'], [7, 'M0001 · Pirates · 02/05/2026 · …'], ['…', ''], [507, 'COMMENTAIRE ATELIER · Reprise de saisie…'], ['…', ''], [1108, 'TOTAL PROVISOIRE · 350 000 · 420 000'], [1109, 'FIN EXPORT']];
const xlRows = (hot) => XL.map(([n, t]) => `<span>${n}</span><span class="${hot && hot.includes(n) ? 'hot' : ''}" data-xl="${n}">${esc(fr(t)) || '&nbsp;'}</span>`).join('');

const def = {
  id: 201,
  objectifs: ['Ouvrir un fichier brut dans une requête isolée, sans toucher au rapport', 'Mesurer la qualité, la distribution et le profil des colonnes', 'Recenser les anomalies et distinguer le certain de l’incertain'],
  intro: [
    { bg: 'archives', n: 'Dimanche 7 juin, 10 h 20. Sous le bâtiment administratif, la porte métallique grince. Oscar allume les néons un par un.' },
    { p: 'oscar', t: 'Voici l’export de maintenance. Chaque technicien le complète à sa manière depuis des années.' },
    { p: 'oscar', t: 'Si nous comprenons ce fichier, nous comprendrons une bonne partie de nos pannes et de nos coûts.' },
    { p: 'gabriel', t: 'J’ai une seule question : peut-on additionner ces coûts ? Mais je ne veux pas de réponse avant un vrai diagnostic.' },
    { clear: 1, p: 'victoria', t: 'Une règle avant tout : le rapport présenté au conseil ne bouge pas. Ses trois tables et ses vingt-six objets restent intacts.' },
    { card: { k: FILE, h: 'Ta mission du jour', ul: ['Ouvrir le fichier dans une requête isolée', 'Mesurer sa qualité colonne par colonne', 'Recenser les anomalies sans les corriger', 'Préparer une stratégie de nettoyage reproductible'] } },
    { clear: 1, p: 'pixel', t: 'Aujourd’hui, on ne nettoie rien. On observe, on mesure et on note. Les corrections viendront ensuite, une par une.' },
    { p: 'pixel', t: 'Bienvenue dans Power Query.' },
    { btn: 'Comprendre Power Query' }
  ],
  leconTitre: 'Diagnostiquer avant de corriger',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Un atelier qui ne touche pas au fichier', `
      <div class="flow-row" style="grid-template-columns:1fr 1fr 1fr">
        <div class="flow-box on"><b>Fichier reçu</b><small>Il reste intact, tel qu’Oscar l’a exporté.</small></div>
        <div class="flow-box on hot"><b>Requête</b><small>Une suite d’étapes enregistrées et rejouées à chaque actualisation.</small></div>
        <div class="flow-box on"><b>Modèle</b><small>Seulement si la requête est chargée.</small></div>
      </div>
      <div data-sec="2" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · Le fichier tel qu’Excel le numérote</div>
        <div class="k2-xl">${xlRows()}</div>
        <p class="lc-note">Les numéros de gauche sont ceux des lignes Excel.</p>
      </div>
      <div data-sec="3" style="display:none">
        <div class="lc-k" style="margin-top:16px">Deux sortes d’anomalies</div>
        <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>Anomalie certaine</b><small>Le fichier seul suffit à la prouver : une date qui n’existe pas, un total mêlé aux interventions, du texte dans une colonne de montants.</small></div><div class="flow-box on"><b>Cas à investiguer</b><small>La valeur peut être légitime ou fausse : un identifiant répété, un technicien absent, un coût négatif. Seule une source métier tranche.</small></div></div>
      </div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    const show = k => { $(`[data-sec="${k}"]`, card).style.display = ''; requestAnimationFrame(() => sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' })); };
    await x.pixel('Power Query est l’atelier de préparation de Power BI. Il lit le fichier, puis applique des étapes, sans jamais le modifier.');
    await x.pixel('Chaque transformation devient une étape. À chaque actualisation, toutes les étapes sont rejouées sur le nouveau fichier.');
    await x.pixel('Et une requête n’entre dans le modèle que si son chargement est activé.');
    show(2);
    await x.pixel('Voici l’export d’Oscar, ligne par ligne. Les noms de colonnes ne sont pas en haut.');
    x.todo('Touche la ligne qui contient les vrais noms de colonnes.');
    $$('[data-xl]', card).forEach(e => e.addEventListener('click', () => PBQ.act('lab.xl', e.dataset.xl)));
    await x.wait({ 'lab.xl': v => { if (v === '6') { $('[data-xl="6"]', card).classList.add('hot'); return true; } return x.oops('', v === '1' ? 'Ligne 1, c’est le titre de l’export, pas un nom de colonne.' : v === '7' ? 'M0001 est la première intervention : les noms sont juste au-dessus.' : 'Cherche la ligne qui nomme les colonnes : ID_Intervention, Attraction…'); } });
    await x.ok('Ligne 6. Au-dessus : un titre, des notes et une ligne vide. Plus bas, un commentaire et un total se glissent parmi les interventions.');
    show(3);
    await x.pixel('Notre travail du jour : tout recenser, et ranger chaque problème dans la bonne case.');
    await K2.ask(x, 'Une date indique le 31 février 2026. C’est…', [{ t: 'Une anomalie certaine', ok: true }, { t: 'Un cas à investiguer', msg: 'Le 31 février n’existe pas : le fichier seul suffit à le prouver.' }]);
    await x.ok('Certaine : cette date n’existe pas. La bonne date, elle, reste à retrouver avec Oscar.');
  },
  exs: [
    /* 1 — Ouvrir sans rien charger */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      x.app('pbi'); pbi.render();
      await x.say('oscar', 'Le fichier est dans Documents › Wonderland › Maintenance. Je l’ai déposé ce matin.');
      await x.pixel('Si on l’importe depuis le rapport, Power BI créerait une quatrième table. Passons par l’éditeur Power Query : une nouvelle source y reste à l’écart du modèle.');
      await K2.work(x, {
        next: () => {
          if (imported(P())) return true;
          if (!pbi.q2El) return ['Ouvre l’éditeur Power Query : Accueil, Transformer les données.', ['[data-a="tab:Accueil"]', '[data-a="cmd:transform"]']];
          if (pbi.dlgKind === 'q2nav') return ['Coche Export_Maintenance, puis OK.', [`[data-chk="${SHEET}"]`, '[data-d="ok"]']];
          if (pbi.dlgKind === 'q2open') return [`Ouvre ${FILE}.`, [`[data-f="${FILE}"]`, '[data-d="open"]']];
          return ['Accueil › Nouvelle source › Classeur Excel.', ['[data-q="tab:Accueil"]', '[data-q="cmd:newsource"]', '.menu [data-k="excel"]']];
        },
        cmd: c => ['get', 'excel', 'csv', 'enter'].includes(c) ? x.oops('Charger au lieu de transformer') : undefined,
        tries: p => {
          if (p.kind !== 'newQuery') return;
          if (imported(P())) return x.oops('Seconde importation');
          if (p.how === 'excel') return p.query.steps[0].file === FILE ? true : x.oops('Mauvais fichier');
          if (p.how === 'blank') return x.oops('Requête vide');
          if (p.how === 'enter') return x.oops('Entrer des données');
          if (p.how === 'csv') return x.oops('Mauvais connecteur');
          return x.oops('', 'Pas de copie : ajoute la source Excel.');
        },
        on: {
          'q2.file': p => { if (p.fileKind === 'zip') return x.oops('Archive ZIP'); if (p.file !== FILE) return x.oops('Mauvais fichier'); if (p.kind === 'csv') return x.oops('Mauvais connecteur'); },
          'q2.navOk': p => { if (p.items.length !== 1 || p.items[0] !== SHEET) return x.oops('', `Coche seulement ${SHEET}.`); }
        },
        applyErr: 'Fermer et appliquer trop tôt', editor: false
      });
      await x.ok('La requête Export_Maintenance est créée. Rien n’est encore chargé dans le modèle.');
      await x.pixel('En bas, Étapes appliquées : Source, Navigation, puis deux étapes que Power Query a ajoutées tout seul. Nous allons les examiner.');
    }, avance: EX1 },

    /* 2 — Isoler la préparation */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, Q = () => imported(P());
      K2.open(x, Q().id);
      await x.say('victoria', 'Ce fichier ne doit jamais se mélanger au rapport. Je veux le reconnaître au premier coup d’œil.');
      await x.pixel('Trois réglages : un nom qui dit ce qu’il contient, aucun chargement dans le modèle, et un groupe pour ranger les préparations de maintenance.');
      await K2.work(x, {
        cur: () => Q().id,
        next: () => {
          const q = Q();
          if (q.name !== NAME) return [`Renomme la requête ${NAME} : touche son nom en haut de l’éditeur, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]']];
          if (q.load !== false) return ['Désactive son chargement : touche son nom, puis Activer le chargement pour le décocher.', ['.q2-qname', '.menu [data-k="load"]']];
          if (q.group !== 'Maintenance') return ['Touche son nom › Déplacer vers le groupe › Nouveau groupe : Maintenance.', ['.q2-qname', '.menu [data-k="grp"]', '.menu [data-k="g:+"]']];
          return true;
        },
        tries: p => {
          const q = Q();
          if (p.kind === 'renameQuery') { if (p.target !== q) return x.oops('Requête historique renommée'); return p.name === NAME ? true : x.oops('Nom imprécis'); }
          if (p.kind === 'newGroup' || p.kind === 'group') { if (p.target !== q) return x.oops('', 'Range seulement la préparation de maintenance.'); return !p.group || p.group === 'Maintenance' ? true : x.oops('Groupe mal nommé'); }
          if (p.kind === 'load') { if (p.target !== q) return x.oops('', 'Cette requête alimente le rapport : son chargement reste actif.'); return p.on ? x.oops('Chargement actif') : true; }
          if (p.kind === 'newQuery') return x.oops('Requête dupliquée');
          if (p.kind === 'delQuery') return x.oops('Requête supprimée');
          if (p.kind === 'refreshFlag') return x.oops('Actualisation désactivée');
        },
        applyErr: 'Fermer et appliquer avec chargement'
      });
      await x.ok(`${NAME} s’affiche en italique : elle ne sera pas chargée. Elle est rangée dans le groupe Maintenance.`);
    }, avance: EX2 },

    /* 3 — Revenir au fichier reçu */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, Q = () => imported(P());
      K2.open(x, Q().id);
      await x.say('oscar', 'Pourquoi la première colonne porte-t-elle le titre de mon export ?');
      await x.pixel('Power Query a supposé que la première ligne contenait les en-têtes. Ici, c’est le titre du fichier.');
      let seen = false;
      await K2.work(x, {
        cur: () => Q().id,
        next: () => {
          const q = Q(), i = q.steps.findIndex(s => s.op === 'promote');
          if (!seen && i >= 0) return ['Ouvre Étapes appliquées et touche En-têtes promus pour voir ce que cette étape a fait.', ['[data-q="steps"]', `[data-q="st:${i}"]`]];
          return true;
        },
        on: { 'q2.step': p => { if (p.step && p.step.op === 'promote') seen = true; } }
      });
      await K2.ask(x, 'Quel est le nom de la première colonne après En-têtes promus ?', [{ t: 'WONDERLAND — extrait maintenance mai 2026', ok: true }, { t: 'ID_Intervention', msg: 'ID_Intervention est en ligne 6 : la promotion a pris la ligne 1.' }, { t: 'Column1', msg: 'Column1 était le nom avant la promotion. Regarde l’en-tête de la première colonne.' }]);
      await x.pixel('Exact. Et Type modifié a ensuite choisi les types d’après ce faux en-tête. Ces deux étapes masquent le fichier tel qu’il est.');
      await K2.work(x, {
        cur: () => Q().id,
        edit: [NAME],
        next: () => {
          const q = Q(), ty = q.steps.findIndex(s => s.op === 'type'), pr = q.steps.findIndex(s => s.op === 'promote');
          if (ty >= 0) return [pr >= 0 ? 'Supprime l’étape Type modifié : touche sa croix dans Étapes appliquées.' : 'Type modifié cherche maintenant une colonne disparue : supprime-la aussi.', ['[data-q="steps"]', `[data-q="stx:${ty}"]`]];
          if (pr >= 0) return ['Supprime aussi l’étape En-têtes promus.', ['[data-q="steps"]', `[data-q="stx:${pr}"]`, '[data-d="del"]']];
          return true;
        },
        tries: p => {
          if (p.kind === 'del' || p.kind === 'delEnd') {
            const names = p.steps.map(s => s.op);
            if (names.includes('excel')) return x.oops('Suppression de Source');
            if (names.includes('nav')) return x.oops('Suppression de Navigation');
            return true;
          }
          if (p.kind === 'add') return x.oops(p.op === 'promote' ? 'Nouvelle promotion' : ['skip', 'removeBottom', 'filter', 'removeBlank', 'distinct', 'keepTop'].includes(p.op) ? 'Suppression de lignes' : p.op === 'replace' ? 'Remplacement de valeurs' : '', 'Aujourd’hui, on observe : aucune transformation n’est ajoutée.');
          if (p.kind === 'renameStep' || p.kind === 'moveStep' || p.kind === 'edit') return x.oops('', 'Garde les étapes Source et Navigation telles quelles.');
        }
      });
      const T = K2.T(x, NAME);
      await x.ok(`Il reste Source et Navigation : ${K2.n(T.rows.length)} lignes, ${T.cols.length} colonnes, de Column1 à Column12. C’est le fichier tel qu’il est arrivé.`);
    }, avance: EX3 },

    /* 4 — Mesurer la qualité */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K2.open(x, NAME);
      await x.say('gabriel', 'Combien de lignes contient ce fichier ? Et combien sont vides ou en erreur ?');
      await x.pixel('L’onglet Affichage contient trois outils de profilage. Attention : par défaut, ils ne lisent que les 1 000 premières lignes.');
      await K2.work(x, {
        cur: NAME,
        next: () => {
          const s = pbi.q2;
          if (!s) return ['Ouvre l’éditeur Power Query : Accueil, Transformer les données.', ['[data-a="tab:Accueil"]', '[data-a="cmd:transform"]']];
          if (!K2.shown(x, NAME)) return [`Affiche la requête ${NAME} : volet Requêtes.`, ['[data-q="qd"]', K2.qsel(x, K2.q(x, NAME))]];
          if (!s.quality) return ['Onglet Affichage : active Qualité de colonne.', ['[data-q="tab:Affichage"]', '[data-q="cmd:quality"]']];
          if (!s.dist) return ['Active aussi Distribution de colonne.', ['[data-q="tab:Affichage"]', '[data-q="cmd:dist"]']];
          if (s.scope !== 'all') return ['En bas, touche Profilage de colonne et choisis l’ensemble des données.', ['[data-q="scope"]', '.menu [data-k="all"]']];
          if (!(s.prof && s.sel.length === 1 && s.sel[0] === 'Column1')) return ['Sélectionne la colonne Column1, puis active Profil de colonne.', ['[data-q="hd:Column1"]', '[data-q="tab:Affichage"]', '[data-q="cmd:prof"]']];
          return true;
        }
      });
      await x.pixel('La barre d’état affiche 999+. Le profil de colonne, lui, donne le compte exact.');
      await K2.num(x, 'Combien de lignes compte le fichier reçu ?', [{ id: 'n', label: 'Lignes', unit: 'lignes' }], v => {
        if (v.n === 1109) return true;
        if (v.n === 999 || v.n === 1000) return ['Volume lu dans la barre d’état'];
        if (v.n === 1100) return ['Volume des seules interventions'];
        if (v.n === 1108 || v.n === 1104) return ['Ligne d’en-têtes oubliée'];
        return ['', 'Lis la ligne Nombre du profil de Column1.'];
      });
      await x.ok('1 109 lignes, toutes lues. Le haut des colonnes montre Valide, Erreur et Vide, la distribution compte les valeurs distinctes et uniques.');
    } },

    /* 5 — Lire la structure du fichier */
    { async run(x) {
      const pbi = x.pbi;
      K2.open(x, NAME);
      await x.say('oscar', 'Dans Column1, il n’y a pas que des numéros d’intervention. Je crois qu’on y a glissé des notes.');
      await x.pixel('Le menu de filtre d’une colonne liste ses valeurs distinctes. Parfait pour faire l’inventaire, sans rien filtrer.');
      let opened = false, more = false, shut = false;
      await K2.work(x, {
        cur: NAME,
        next: () => {
          if (!opened) return ['Ouvre le menu de filtre de Column1 : la flèche à droite de son en-tête.', ['[data-q="flt:Column1"]']];
          if (!more) return ['La liste s’arrête aux 1 000 premières lignes : touche Charger plus.', ['[data-more]']];
          if (!shut) return ['Parcours les valeurs qui ne commencent pas par M, puis ferme le filtre avec Annuler.', ['[data-d="cancel"]']];
          return true;
        },
        on: {
          'q2.filterOpen': p => { if (p.col === 'Column1') opened = true; else return x.oops('', 'Ouvre le filtre de Column1.'); },
          'q2.loadMore': () => { more = true; },
          'q2.cancel': () => { if (more) shut = true; else if (opened) opened = false; }
        },
        tries: p => p.kind === 'add' ? x.oops(p.op === 'filter' ? 'Filtre appliqué' : '', 'Aujourd’hui, on observe : ferme le filtre sans le valider.') : undefined
      });
      await x.ok('Le bas du fichier apparaît : TOTAL PROVISOIRE et FIN EXPORT. Sans Charger plus, ils restaient invisibles.');
      const B = K2.sorter({ title: 'Que contient chaque ligne ?', intro: 'Classe ces six lignes du fichier reçu.', btn: 'Vérifier mon classement',
        options: [['ctx', 'Contexte'], ['hdr', 'En-têtes'], ['int', 'Donnée'], ['par', 'Parasite']],
        rows: [{ id: 'l1', t: 'WONDERLAND — extrait maintenance mai 2026', sub: 'Ligne 1' }, { id: 'l5', t: '(ligne vide)', sub: 'Ligne 5' }, { id: 'l6', t: 'ID_Intervention · Attraction · Date_Demande…', sub: 'Ligne 6' },
          { id: 'l7', t: 'M0001 · Pirates · 02/05/2026…', sub: 'Ligne 7' }, { id: 'l507', t: 'COMMENTAIRE ATELIER', sub: 'Ligne 507' }, { id: 'l1108', t: 'TOTAL PROVISOIRE', sub: 'Ligne 1108' }] });
      x.app('tri201', B.el);
      const SOL = { l1: 'ctx', l5: 'ctx', l6: 'hdr', l7: 'int', l507: 'par', l1108: 'par' };
      const ERR = { l1: 'Titre pris pour un en-tête', l5: 'Ligne vide prise pour une donnée', l6: 'En-têtes pris pour une donnée', l7: 'Intervention écartée', l507: 'Commentaire pris pour une intervention', l1108: 'Total pris pour une intervention' };
      x.todo('Classe chaque ligne : contexte, en-têtes, donnée ou ligne parasite.');
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]);
        B.mark(bad);
        if (!bad.length) { B.lock(); return true; }
        if (bad.some(k => !values[k])) return x.oops('', 'Classe les six lignes avant de vérifier.');
        return x.oops(ERR[bad[0]]);
      } });
      await x.ok('Quatre lignes de contexte au-dessus des en-têtes, puis deux lignes parasites au milieu et à la fin. Tout le reste : des interventions candidates.');
      x.app('pbi');
    } },

    /* 6 — Repérer les valeurs suspectes */
    { async run(x) {
      const pbi = x.pbi;
      K2.open(x, NAME);
      await x.say('gabriel', 'Des identifiants en double ? Des coûts bizarres ? J’aimerais des faits, pas des impressions.');
      await x.pixel('Trois enquêtes rapides, colonne par colonne. On note, on ne corrige pas.');
      const s = () => pbi.q2;
      await K2.work(x, {
        cur: NAME,
        next: () => {
          if (!s()) return ['Ouvre l’éditeur Power Query : Accueil, Transformer les données.', ['[data-a="cmd:transform"]']];
          if (!s().dist) return ['Onglet Affichage : active Distribution de colonne.', ['[data-q="tab:Affichage"]', '[data-q="cmd:dist"]']];
          if (s().scope !== 'all') return ['Passe le profilage sur l’ensemble des données.', ['[data-q="scope"]', '.menu [data-k="all"]']];
          if (!(s().prof && s().sel[0] === 'Column1')) return ['Sélectionne Column1 et affiche son Profil de colonne.', ['[data-q="hd:Column1"]', '[data-q="tab:Affichage"]', '[data-q="cmd:prof"]']];
          return true;
        }
      });
      await K2.num(x, 'Column1 compte 1 107 valeurs distinctes et 1 105 uniques. Combien de valeurs apparaissent plusieurs fois ?', [{ id: 'n', label: 'Valeurs répétées' }], v => v.n === 2 ? true : ['Répétitions mal comptées']);
      await K2.ask(x, 'Lesquelles ? Regarde le haut de la distribution des valeurs.', [{ t: 'M0899 et M0949', ok: true }, { t: 'M0001 et M1100', err: 'Mauvais identifiants' }, { t: 'COMMENTAIRE ATELIER et FIN EXPORT', err: 'Mauvais identifiants', msg: 'Ces deux marqueurs n’apparaissent qu’une fois chacun.' }]);
      await x.pixel('Deux identifiants répétés. Un doublon ? Deux interventions différentes ? On ne le sait pas encore.');
      await K2.work(x, {
        cur: NAME,
        next: () => {
          if (!s()) return ['Ouvre l’éditeur Power Query.', ['[data-a="cmd:transform"]']];
          if (!s().ws) return ['Onglet Affichage : active Afficher les espaces blancs.', ['[data-q="tab:Affichage"]', '[data-q="cmd:ws"]']];
          if (!(s().prof && s().sel[0] === 'Column7')) return ['Sélectionne Column7, la colonne des techniciens, et lis son profil.', ['[data-q="hd:Column7"]']];
          return true;
        },
        on: { 'q2.view': p => { if (p.k === 'prof' && !p.on) return x.oops('', 'Garde le profil de colonne affiché.'); } }
      });
      await K2.ask(x, 'Que contient la valeur suspecte de Column7, à côté des quatre noms et des null ?', [{ t: 'Trois espaces, sans aucun nom', ok: true }, { t: 'Une erreur', err: 'Valeur d’espaces prise pour une erreur' }, { t: 'Un nom mal orthographié', err: 'Espaces non affichés' }]);
      let col9 = false, shut = false;
      await K2.work(x, {
        cur: NAME,
        next: () => {
          if (!col9) return ['Ouvre le filtre de Column9 (coûts HT) et repère ce qui n’est pas un nombre.', ['[data-q="flt:Column9"]']];
          if (!shut) return ['Parcours la liste, puis ferme le filtre avec Annuler.', ['[data-d="cancel"]']];
          return true;
        },
        on: { 'q2.filterOpen': p => { if (p.col === 'Column9') col9 = true; }, 'q2.loadMore': () => {}, 'q2.cancel': () => { if (col9) shut = true; } },
        tries: p => p.kind === 'add' ? x.oops('Correction immédiate') : undefined
      });
      await K2.ask(x, 'Qu’as-tu trouvé parmi les coûts HT ?', [{ t: 'N/A, à confirmer, et deux montants écrits en texte, avec € ou une virgule', ok: true }, { t: 'Seulement des nombres', err: 'Montants textuels oubliés' }, { t: 'Des erreurs à supprimer tout de suite', err: 'Correction immédiate' }]);
      await x.ok('Deux identifiants répétés, un technicien fait d’espaces, des coûts en texte. Tout est noté, rien n’est modifié.');
    } },

    /* 7 — Certain ou à investiguer */
    { async run(x) {
      const pbi = x.pbi;
      await x.say('victoria', 'Je veux une liste claire : ce qui est faux à coup sûr, et ce qu’il faudra vérifier avec les équipes.');
      await x.pixel('Voici le registre des anomalies. Pour chacune : est-elle prouvée par le fichier seul, ou faut-il enquêter ?');
      const B = K2.sorter({ title: 'Registre des anomalies', intro: 'Douze constats relevés dans l’export. Classe chacun.', btn: 'Vérifier le registre',
        options: [['cert', 'Anomalie certaine'], ['inv', 'À investiguer']],
        rows: K2.REG.map(r => ({ id: r.id, t: r.t, sub: r.ids.length ? r.ids.join(', ') : r.c })) });
      x.app('reg201', B.el);
      x.todo('Classe les douze constats du registre.');
      const why = r => r.c === 'Structure' ? 'Structure jugée incertaine' : r.c === 'Répétitions' ? 'Identifiant répété jugé certain' : r.c === 'Absences' ? 'Absence jugée certaine' : r.id === 'R08' ? 'Date impossible jugée incertaine' : r.c === 'Cohérence' ? 'Valeur incohérente jugée certaine' : 'Format jugé incertain';
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        if (K2.REG.some(r => !values[r.id])) return x.oops('', 'Classe les douze constats avant de vérifier.');
        const bad = K2.REG.filter(r => (values[r.id] === 'cert') !== r.cert);
        B.mark(bad.map(r => r.id));
        if (!bad.length) { B.lock(); return true; }
        return x.oops(why(bad[0]));
      } });
      EX7(pbi.P);
      await x.ok('Sept anomalies certaines, cinq cas à investiguer. Le registre est enregistré dans le projet.');
      await x.pixel('Dernière chose : dans quel ordre attaquer le nettoyage, pour qu’il soit reproductible ?');
      const O = K.ordering({ title: 'Stratégie de nettoyage', intro: 'Touche les étapes dans l’ordre.', btn: 'Valider la stratégie',
        items: [['iso', 'Isoler la préparation, sans la charger'], ['str', 'Retrouver la structure : en-têtes et lignes parasites'], ['dia', 'Diagnostiquer chaque colonne, sans corriger'], ['cor', 'Corriger seulement avec une règle ou une preuve']] });
      x.app('ordre201', O.el);
      x.todo('Ordonne les quatre étapes de la stratégie.');
      await x.wait({ 'order.change': () => {}, 'order.check': ({ order }) => {
        const want = ['iso', 'str', 'dia', 'cor'];
        if (order.length < 4) return x.oops('', 'Place les quatre étapes.');
        const k = order.findIndex((v, i) => v !== want[i]);
        if (k < 0) { O.lock(); return true; }
        O.flag([k]);
        return x.oops(order[0] !== 'iso' ? 'Préparation non isolée' : order.indexOf('cor') < order.indexOf('dia') ? 'Correction avant diagnostic' : '', 'La structure se règle avant d’examiner les valeurs : sans en-têtes, impossible de nommer les colonnes.');
      } });
      await x.ok('Isoler, structurer, diagnostiquer, puis corriger avec des preuves. C’est le programme des prochaines missions.');
      x.app('pbi');
    }, avance: EX7 },

    /* 8 — Sauvegarder le diagnostic */
    { async run(x) {
      const pbi = x.pbi;
      if (!pbi.P.registre) EX7(pbi.P);
      K2.open(x, NAME);
      await x.say('victoria', 'Avant de partir, enregistre ce diagnostic dans une copie de travail. Le fichier du conseil ne doit pas changer.');
      await x.pixel('Fermer et appliquer enregistre l’état des requêtes. Comme la préparation n’est pas chargée, le modèle ne reçoit rien.');
      await K2.final(x, { name: 'Wonderland_Pilotage_M201', cur: NAME, work: { loadErr: 'Chargement actif', overErr: 'Checkpoint écrasé', nameErr: 'Mauvais nom', extErr: 'Mauvais format', fileErr: 'Rapport modifié' } });
      await K2.num(x, 'Combien de tables contient maintenant le modèle ?', [{ id: 'n', label: 'Tables' }], v => v.n === 3 ? true : v.n === 4 ? ['Tables comptées à quatre'] : ['', 'Regarde la vue Table : les trois tables du module 1 sont toujours là.']);
      const c = K2.check110(pbi.P);
      x.app('ctl201', K.lesson('Contrôle', 'Le rapport du module 1 est intact', `${K2.card110(pbi.P)}<p class="lc-note">${esc(fr(`Wonderland_Pilotage_M201.pbix contient en plus la requête ${NAME}, non chargée, et le registre des anomalies.`))}</p>`));
      await x.ok(c.ok ? 'Trois tables, trois pages, vingt-six objets, aucune relation, aucune mesure DAX. Le diagnostic est enregistré à part.' : 'Copie de travail enregistrée.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'archives', n: 'Les néons bourdonnent. Sur l’écran, le registre affiche ses douze lignes.' },
    { p: 'oscar', t: 'Je n’avais jamais vu le fichier comme ça. Un titre, des notes, un total au milieu de nos interventions…' },
    { p: 'gabriel', t: 'Donc, non : on ne peut pas encore additionner ces coûts. Au moins, maintenant, je sais pourquoi.' },
    { p: 'pixel', t: 'Sept anomalies certaines, cinq cas à investiguer. Et une requête isolée, que l’on rejouera à chaque nouvel export.' },
    { p: 'victoria', t: 'C’est exactement la méthode que j’attendais. On ne corrige rien sans savoir ce qu’on corrige.' },
    { card: { k: 'Registre des anomalies', h: '12 constats, 0 correction', chips: ['Structure', 'Absences', 'Répétitions', 'Dates', 'Libellés', 'Montants', 'Cohérence'] } },
    { wait: 600 }
  ],
  recompense: { titre: 'Diagnostic posé !', sous: 'Tu as examiné le fichier catastrophe sans rien casser.', badge: 'b201', badgeNom: 'Explorateur des archives', objet: 'lampe-torche' },
  fiches: [
    ['Une source à l’écart', 'Comment étudier un fichier sans l’ajouter au modèle ?', 'Dans l’éditeur Power Query, Nouvelle source crée une requête. Tant qu’elle n’est pas chargée, le modèle ne reçoit aucune table.'],
    ['Désactiver le chargement', 'À quoi reconnaît-on une requête non chargée ?', 'Son nom s’affiche en italique. Elle reste disponible pour d’autres requêtes, sans devenir une table du modèle.'],
    ['Les étapes automatiques', 'Pourquoi vérifier En-têtes promus et Type modifié après un import ?', 'Power Query devine les en-têtes et les types. Sur un fichier mal structuré, il peut prendre un titre pour un en-tête et forcer des types faux.'],
    ['Profilage', 'Que montrent Qualité, Distribution et Profil de colonne ?', 'Les parts de valeurs valides, en erreur et vides, le nombre de valeurs distinctes et uniques, puis le détail d’une colonne. Par défaut, seulement sur les 1 000 premières lignes.'],
    ['Liste de filtre', 'Pourquoi toucher Charger plus dans un menu de filtre ?', 'La liste des valeurs s’arrête aux 1 000 premières lignes. Les valeurs du bas du fichier peuvent manquer.'],
    ['Distinct et unique', 'Que signifient 1 107 distinctes et 1 105 uniques ?', 'Distinct compte chaque valeur une fois ; unique compte celles qui n’apparaissent qu’une fois. L’écart révèle des valeurs répétées.'],
    ['Certain ou à investiguer', 'Comment classer une anomalie ?', 'Certaine si le fichier seul la prouve : date impossible, total mêlé aux données, texte dans un montant. À investiguer si la valeur peut être légitime : seule une source métier tranche.'],
    ['Stratégie reproductible', 'Dans quel ordre préparer un fichier brut ?', 'Isoler la préparation, retrouver la structure, diagnostiquer les colonnes, puis corriger seulement avec une règle ou une preuve.']
  ],
  suiteTitre: 'Dimanche, 10 h 50',
  suite: [
    { bg: 'tri', n: 'La lumière des archives techniques clignote. Sur l’écran d’Oscar, l’export ressemble toujours à une note d’atelier.' },
    { p: 'oscar', t: 'Nous comprenons les problèmes du fichier. Mais si chacun doit retrouver les bonnes lignes à la main, nous recommencerons à chaque export.' },
    { p: 'pixel', t: 'Alors construisons une suite d’étapes qui retrouve la structure toute seule. Le fichier original restera intact.' }
  ],
  accroche: 'Un export de maintenance plein de pièges : l’ouvrir sans rien charger, le mesurer et tout recenser avant de corriger.',
  fin(P) { EX1(P); EX2(P); EX3(P); EX7(P); EX8(P); }
};
window.PBQ.mission(def);
})();

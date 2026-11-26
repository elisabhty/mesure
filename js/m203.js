/* Mission 203 — Les visiteurs fantômes (valeurs nulles et informations manquantes) */
(function () {
'use strict';
const { esc, fr, $, $$, h } = window.PBQ;
const STRUCT = 'prep_Maintenance_Structure', NAME = 'prep_Maintenance_Nulls';

/* ───────── État canonique ───────── */
const SET = n => P => {
  let q = P.queries.find(x => x.id === 'q_nulls');
  if (!q) { q = K2.C.nulls(); P.queries.push(q); }
  q.steps = K2.C.nullsSteps().slice(0, n);
};
const EX1 = SET(1), EX3 = SET(2), EX4 = SET(3), EX5 = SET(4), EX6 = SET(7);
function EX8(P) { P.queries = P.queries.filter(q => !q.tmp203); P.name = 'Wonderland_Pilotage_M203'; P.saved = true; P.dirty = false; }
const row = (T, id) => T.rows.find(r => r.ID_Intervention === id) || {};
const nulls = (T, c) => T.rows.filter(r => r[c] === null).length;

const def = {
  id: 203,
  objectifs: ['Mesurer les valeurs manquantes sur tout le fichier', 'Normaliser un blanc visuel sans écraser la source', 'Signaler les absences au lieu d’inventer des valeurs', 'Construire une liste d’investigation et mesurer la complétude'],
  intro: [
    { bg: 'atelier', n: 'Dimanche 7 juin, 11 h 20. Atelier technique. Une imprimante termine son travail. Oscar compare plusieurs bons d’intervention avec le registre.' },
    { p: 'oscar', t: 'Cette intervention existe : un numéro, une date, un coût. Mais je ne sais pas qui l’a réalisée.' },
    { p: 'oscar', t: 'Et ici, une intervention sans attraction. Impossible de savoir quel équipement était concerné.' },
    { p: 'pixel', t: 'Ce sont nos premiers fantômes : des enregistrements présents, dont certaines informations ont disparu.' },
    { clear: 1, bg: 'calendrier', p: 'gabriel', t: 'Pour les coûts manquants, on pourrait mettre zéro ? Nous aurions au moins un total.' },
    { card: { k: 'Deux étiquettes', h: 'Coût inconnu ≠ coût confirmé à zéro', p: 'Un coût inconnu peut encore représenter une dépense. Le remplacer par zéro réduirait artificiellement l’estimation.' } },
    { p: 'gabriel', t: 'D’accord. Alors il faut rendre les informations manquantes visibles, sans fabriquer de réponses.' },
    { clear: 1, p: 'victoria', t: 'Je veux savoir quelles informations manquent, ce que cela empêche d’analyser et à qui demander les corrections.' },
    { p: 'pixel', t: 'Nous allons conserver les lignes, nettoyer les blancs inutiles et construire un diagnostic. Chaque décision devra préserver le sens des données.' },
    { btn: 'Que signifie une cellule vide ?' }
  ],
  leconTitre: 'Que signifie une cellule vide ?',
  async lecon(x) {
    const V = [['null', 'Absence de valeur', 'Conserver l’absence et rechercher sa cause'], ['""', 'Texte de longueur nulle', 'Peut devenir null selon une règle définie'], ['"···"', 'Texte fait d’espaces', 'Nettoyer les espaces, puis constater l’absence'], ['"N/A"', 'Texte explicite', 'Interpréter selon le contrat de la colonne'], ['0', 'Valeur numérique connue', 'Conserver si elle est justifiée']];
    const card = K.lesson('Leçon', 'Cinq cellules qui semblent vides', `
      <div class="lc-k">Expérience · Touche une cellule</div>
      <div class="seg" data-g="v">${V.map((v, i) => `<button data-v="${i}" class="${i === 0 ? 'on' : ''}"><span class="mono">${esc(v[0])}</span></button>`).join('')}</div>
      <div data-o="v"></div>`);
    x.app('lecon', card);
    const draw = i => { $$('[data-g="v"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === String(i))); $('[data-o="v"]', card).innerHTML = `<div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>Ce que c’est</b><small>${esc(fr(V[i][1]))}</small></div><div class="flow-box on hot"><b>Décision possible</b><small>${esc(fr(V[i][2]))}</small></div></div>`; };
    const seen = new Set([0]); draw(0);
    $$('[data-g="v"] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.v', +b.dataset.v)));
    await x.pixel('Une cellule qui semble vide n’est pas forcément un null. Et une valeur égale à zéro n’est pas une information manquante.');
    x.todo('Touche chacune des cinq cellules.');
    await x.wait({ 'lab.v': i => { draw(i); seen.add(i); if (seen.size === 5) return true; } });
    await x.say('oscar', 'Donc nous devons regarder ce que contient réellement la cellule, pas seulement son apparence.');
    await K2.ask(x, 'Un coût vaut 0 dans le fichier. C’est…', [{ t: 'Une valeur connue, à justifier', ok: true }, { t: 'Une information manquante', msg: 'Zéro est une valeur renseignée : elle peut être juste ou fausse, mais elle n’est pas absente.' }]);
    await x.ok('Une valeur connue. Aujourd’hui, on travaille sur les 1 100 interventions candidates de la mission 202.');
  },
  exs: [
    /* 1 — Ouvrir un atelier de traitement */
    { async run(x) {
      const pbi = x.pbi;
      x.app('pbi'); pbi.render();
      await x.say('victoria', 'Je veux pouvoir comparer chaque résultat avec la préparation précédente. Crée une étape de travail clairement identifiable.');
      await x.pixel('Notre requête de structure restera le témoin de départ.');
      await K2.branch(x, { src: STRUCT, name: NAME, deps: true, errs: { dup: '', imp: 'Nouvelle importation du classeur', edit: 'Transformation dans la requête brute', srcEdit: 'Transformation dans la structure', name: 'Mauvais nom de requête', load: 'Chargement activé', legacy: 'Référence à une table commerciale' } });
      K2.open(x, NAME);
      await K2.num(x, `Combien de lignes et de colonnes compte ${NAME} au départ ?`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 1100 && v.c === 13 ? true : v.l < 1100 ? ['Volume inférieur à 1100'] : v.c !== 13 ? ['Colonnes déjà supprimées au départ', 'Lis la barre d’état en bas de l’aperçu : colonnes et lignes.'] : ['', 'La barre d’état affiche 999+ : 1 100 interventions candidates.']);
      await x.ok('1 100 lignes, 13 colonnes : exactement le résultat de la mission 202. Les trois préparations sont non chargées.');
    }, avance: EX1 },

    /* 2 — Chercher les absences sur tout le fichier */
    { async run(x) {
      const pbi = x.pbi, Q = () => K2.q(x, NAME), s = () => pbi.q2;
      K2.open(x, NAME);
      await x.say('oscar', 'J’ai trouvé une ligne sans technicien. Peut-être qu’il n’y en a qu’une ?');
      await x.pixel('Vérifions jusqu’au bout. Un aperçu limité peut masquer une partie des absences.');
      await K2.work(x, {
        cur: NAME,
        next: () => {
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (!s().quality) return ['Onglet Affichage : active Qualité de colonne.', ['[data-q="tab:Affichage"]', '[data-q="cmd:quality"]']];
          if (s().scope !== 'all') return ['Passe le profilage sur l’ensemble des données, en bas de l’éditeur.', ['[data-q="scope"]', '.menu [data-k="all"]']];
          if (!(s().prof && s().sel.length === 1 && s().sel[0] === 'Technicien')) return ['Sélectionne Technicien et affiche son Profil de colonne.', ['[data-q="hd:Technicien"]', '[data-q="tab:Affichage"]', '[data-q="cmd:prof"]']];
          return true;
        },
        on: { 'q2.scope': p => { if (p.scope === 'top') return x.oops('Profilage limité aux premières lignes'); } }
      });
      await K2.num(x, 'Sur les 1 100 candidats, combien de null natifs compte chaque colonne ? Sélectionne-les une à une et lis la ligne Vide.', [{ id: 't', label: 'Technicien' }, { id: 'a', label: 'Attraction' }, { id: 'c', label: 'Cout_HT' }], v => {
        if (v.t === 2 && v.a === 1 && v.c === 1) return true;
        if (v.t === 3) return ['Trois null natifs annoncés dans Technicien'];
        if (v.t === 1) return ['Un seul technicien absent annoncé'];
        if (v.c === 2) return ['N/A compté comme null natif'];
        return ['', 'Profil de chaque colonne, ligne Vide, sur l’ensemble des données.'];
      });
      await x.pixel('Relevons les deux techniciens absents avec un filtre d’exploration. Il faudra le retirer ensuite.');
      let seen = false;
      await K2.work(x, {
        cur: NAME, edit: [NAME], ops: ['filter'],
        next: () => {
          const q = Q(), i = q.steps.findIndex(st => st.op === 'filter');
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (!seen && i < 0) return ['Filtre de Technicien : décoche Sélectionner tout, coche seulement (null), puis OK.', ['[data-q="flt:Technicien"]', '.q2-chk.all input', '[data-d="ok"]']];
          if (i >= 0 && !seen) { seen = true; return ['Note les identifiants affichés, puis supprime l’étape de filtre.', ['[data-q="steps"]', `[data-q="stx:${i}"]`]]; }
          if (i >= 0) return ['Note les identifiants, puis supprime l’étape de filtre : elle ne doit pas rester.', ['[data-q="steps"]', `[data-q="stx:${i}"]`]];
          return true;
        },
        tries: p => {
          if (p.kind === 'add' && p.op === 'filter') { const c = p.step.cond; if (c.col !== 'Technicien') return x.oops('', 'Filtre la colonne Technicien.'); const T = K2.simulate(x, Q(), p.step).table; return T && T.rows.length === 2 && T.rows.every(r => r.Technicien === null) ? true : x.oops('', 'Garde seulement (null) pour lister les techniciens absents.'); }
          if (p.kind === 'del' || p.kind === 'delEnd') return p.steps.every(st => st.op === 'filter') ? true : x.oops('', 'Supprime seulement l’étape de filtre.');
        },
        apply: false, applyErr: 'Filtre d’exploration conservé'
      });
      await K2.ask(x, 'Quels identifiants n’avaient pas de technicien ?', [{ t: 'M0012 et M1090', ok: true }, { t: 'M0012 seulement', err: 'Un seul technicien absent annoncé' }, { t: 'M0012, M0400 et M1090', err: 'Trois null natifs annoncés dans Technicien' }]);
      await K2.ask(x, 'Et M0400, dont la cellule paraît vide ?', [{ t: 'Un texte de trois espaces, pas un null natif', ok: true }, { t: 'Une erreur de conversion', err: 'Cellule vide assimilée à une erreur de conversion' }, { t: 'Un null comme les deux autres', err: 'Trois null natifs annoncés dans Technicien' }]);
      await x.ok('Deux techniciens absents, dont M1090 tout en bas du fichier, une attraction et un coût. M0400 cache trois espaces. Le filtre est retiré : 1 100 lignes.');
    } },

    /* 3 — Faire apparaître le blanc invisible */
    { async run(x) {
      const pbi = x.pbi, Q = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('oscar', 'La cellule de M0400 paraît vide. Pourtant, le profil ne la compte pas comme une valeur absente.');
      await x.pixel('Il y a trois espaces. Nous conservons la valeur source et produisons une version normalisée à côté.');
      await x.pixel('Text.Clean retire les caractères invisibles, Text.Trim les espaces aux extrémités. Un texte devenu vide est alors un null.');
      await K2.custom(x, { q: NAME, col: 'Technicien_Normalise', type: 'text', src: K2.F.tech, typeErr: 'Noms convertis en nombres',
        check: T => { const r4 = row(T, 'M0400'), r1 = row(T, 'M0001'); const n = nulls(T, 'Technicien_Normalise');
          if (r4.Technicien_Normalise !== null) return ['Espaces conservés dans la colonne normalisée'];
          if (n > 3) return ['Tous les noms mis à null'];
          return r1.Technicien_Normalise === 'L. Bernard' ? true : ['', 'Les noms renseignés doivent rester identiques.']; },
        tries: p => {
          if (p.kind !== 'add') return;
          if (p.op === 'fmt' || p.op === 'replace') { const cols = p.step.cols || []; return x.oops(p.op === 'replace' && String(p.step.to) === 'Inconnu' ? 'Remplacement par Inconnu dans la source' : cols.includes('Technicien') ? 'Colonne source écrasée' : '', 'Garde la colonne source et ajoute une colonne normalisée.'); }
          if (p.op === 'fill') return x.oops('Nom recopié depuis la ligne précédente');
          if (p.op === 'filter') return x.oops('Suppression de M0400');
          if (p.op === 'type') return x.oops('Noms convertis en nombres');
        } });
      await K2.num(x, 'Combien de null compte maintenant Technicien_Normalise ?', [{ id: 'n', label: 'Null' }], v => v.n === 3 ? true : v.n === 2 ? ['Deux null attendus après nettoyage'] : ['', 'Sélectionne Technicien_Normalise et lis la ligne Vide de son profil.']);
      await x.ok('Trois null : M0012, M0400 et M1090. Technicien garde ses deux null et les trois espaces de M0400. 14 colonnes, 1 100 lignes.');
    }, avance: EX3 },

    /* 4 — Refuser le faux zéro */
    { async run(x) {
      const pbi = x.pbi;
      K2.open(x, NAME);
      await x.say('gabriel', 'M0025 a un montant TTC, mais aucun coût HT. Peut-on retrouver le HT en divisant le TTC par 1,20 ?');
      await x.pixel('Ce serait une estimation sous conditions. Montants et taxe ne sont pas encore validés : aujourd’hui, on classe l’état du coût, sans rien reconstituer.');
      await K2.custom(x, { q: NAME, col: 'Etat_Cout_HT', type: 'text', src: K2.F.cout,
        check: T => {
          const e = id => row(T, id).Etat_Cout_HT;
          if (e('M0025') !== 'Absent') return ['', 'M0025 doit être classé Absent.'];
          if (e('M0450') !== 'Marqueur N/A') return ['', 'M0450 doit être classé Marqueur N/A.'];
          if (e('M1050') !== 'À confirmer') return ['M1050 ignoré'];
          if (e('M0070') === 'Absent') return ['Tout texte classé absent'];
          if (e('M0220') === 'Absent') return ['Montant négatif classé manquant'];
          return true;
        },
        tries: p => {
          if (p.kind === 'add' && p.op === 'custom' && /Cout_TTC/.test(p.step.src || '')) return x.oops('HT calculé depuis le TTC');
          if (p.kind !== 'add') return;
          if (p.op === 'replace') return x.oops(String(p.step.from).toUpperCase() === 'N/A' ? 'N/A remplacé par zéro' : 'Null remplacé par zéro');
          if (p.op === 'removeCols' || p.op === 'selectCols') return x.oops('Colonne source supprimée');
          if (p.op === 'type') return x.oops('', 'Pas de conversion globale : on classe l’état sans convertir.');
        } });
      await K2.ask(x, 'Quel état obtient M0070, dont le coût est « 1 250,50 € » ?', [{ t: 'Présent — contrôle de format requis', ok: true }, { t: 'Absent', err: 'Tout texte classé absent' }, { t: 'Présent numérique, donc fiable', err: 'Valeur numérique déclarée fiable' }]);
      await x.ok('Absent, Marqueur N/A, À confirmer : trois situations distinguées. Les montants textuels restent renseignés, et aucune valeur n’a été remplacée par zéro. 15 colonnes.');
    }, avance: EX4 },

    /* 5 — Ne pas propager une identité sans preuve */
    { async run(x) {
      const pbi = x.pbi;
      K2.open(x, NAME);
      await x.say('oscar', 'Les lignes voisines de M0350 concernent des attractions connues. On pourrait reprendre l’attraction juste au-dessus ?');
      await x.pixel('Remplir vers le bas fait exactement ça. Mais une question d’abord.');
      await K2.ask(x, 'La source indique-t-elle que les cellules vides héritent de la valeur précédente ?', [{ t: 'Non : chaque ligne est une intervention indépendante', ok: true }, { t: 'Oui, les lignes voisines se suivent', err: 'Remplir vers le bas' }]);
      await x.say('oscar', 'Non. Chaque ligne correspond à un enregistrement indépendant.');
      await x.pixel('Alors nous ne propageons rien : nous signalons l’attraction à renseigner.');
      await K2.custom(x, { q: NAME, col: 'Attraction_A_Renseigner', type: 'bool', src: K2.F.attr,
        check: T => { const n = T.rows.filter(r => r.Attraction_A_Renseigner === true); if (n.length !== 1 || n[0].ID_Intervention !== 'M0350') return ['', 'Seule M0350 doit être signalée.']; return row(T, 'M0150').Attraction_A_Renseigner === false ? true : ['M0150 classé absent']; },
        tries: p => {
          if (p.kind !== 'add') return;
          if (p.op === 'fill') return x.oops(p.step.dir === 'up' ? 'Remplir vers le haut' : 'Remplir vers le bas');
          if (p.op === 'replace') return x.oops('Étiquette Inconnue prise pour une attraction réelle');
          if (p.op === 'filter') return x.oops('M0350 supprimé');
        } });
      await K2.ask(x, 'M0150 a pour attraction « dragon », entouré d’espaces. Est-elle à renseigner ?', [{ t: 'Non : l’attraction est présente, son écriture se normalisera plus tard', ok: true }, { t: 'Oui, elle est mal écrite', err: 'M0150 classé absent' }]);
      await x.ok('Une seule attraction à renseigner : M0350. Aucun remplissage, aucune attraction devinée. 16 colonnes, 1 100 lignes.');
    }, avance: EX5 },

    /* 6 — Construire une liste d'investigation */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, Q = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('victoria', 'Nous avons trouvé les absences. Donne-moi une liste que les responsables pourront traiter.');
      await x.say('gabriel', 'Pour les coûts, je vérifierai les pièces fournisseurs. Oscar pourra examiner les bons d’intervention.');
      await x.pixel('Trois indicateurs Vrai/Faux, calculés depuis les valeurs. Pas de liste saisie à la main.');
      const man = { tries: p => p.kind === 'add' && p.op === 'custom' && /M0\d{3}/.test(p.step.src || '') ? x.oops('Indicateurs saisis manuellement par ID') : undefined };
      await K2.custom(x, Object.assign({ q: NAME, col: 'Technicien_A_Renseigner', type: 'bool', src: K2.F.techA, check: T => T.rows.filter(r => r.Technicien_A_Renseigner === true).length === 3 ? true : ['Liste ne contenant que les null natifs'] }, man));
      await K2.custom(x, Object.assign({ q: NAME, col: 'Cout_HT_A_Confirmer', type: 'bool', src: K2.F.coutA, check: T => T.rows.filter(r => r.Cout_HT_A_Confirmer === true).length === 3 ? true : ['', 'Trois coûts doivent être signalés : Absent, Marqueur N/A et À confirmer.'] }, man));
      await K2.custom(x, Object.assign({ q: NAME, col: 'Dossier_Incomplet', type: 'bool', src: K2.F.dossier, check: T => T.rows.filter(r => r.Dossier_Incomplet === true).length === 7 ? true : ['Toutes les anomalies incluses sans distinction'] }, man));
      await x.pixel('19 colonnes. Maintenant, la liste : dans une référence temporaire, pour que la préparation garde ses 1 100 lignes.');
      const tmp = () => P().queries.find(q => q.m2 && K2.isRef(q, Q().id));
      await K2.work(x, {
        cur: NAME, editNew: true, edit: [], ops: ['filter'],
        next: () => {
          const t = tmp();
          if (!t) return [`Volet Requêtes : ⋯ à côté de ${NAME}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, Q()), '.menu [data-k="ref"]']];
          if (t.load !== false) return ['Désactive le chargement de cette liste temporaire.', ['.q2-qname', '.menu [data-k="load"]']];
          if (!K2.shown(x, t.name)) return K2.showTodo(x, t.name);
          if (!t.steps.some(s => s.op === 'filter')) return ['Filtre Dossier_Incomplet : décoche FALSE, garde TRUE.', ['[data-q="flt:Dossier_Incomplet"]', '[data-d="ok"]']];
          return true;
        },
        newQuery: p => p.how === 'ref' && p.src === Q() ? true : x.oops('', `Crée une référence de ${NAME}.`),
        tries: p => {
          const t = tmp();
          if (p.kind === 'newQuery') { if (t) return x.oops('', 'La liste temporaire existe déjà.'); if (p.how !== 'ref' || p.src !== Q()) return x.oops('', `Crée une référence de ${NAME}.`); p.query.tmp203 = true; return true; }
          if (p.kind === 'load') { if (p.on) return x.oops('Liste chargée dans le modèle'); return p.target === t ? true : x.oops('', 'Règle seulement la liste temporaire.'); }
          if (p.kind === 'renameQuery') return p.target === t ? true : x.oops('', 'Garde le nom de cette requête.');
          if (p.kind === 'add' && p.op === 'filter') {
            const q = p.q; if (q && q.name === NAME) return x.oops('Préparation principale réduite à sept lignes');
            if (q !== t) return x.oops('', 'Filtre la liste temporaire.');
            const T = K2.simulate(x, t, p.step).table; return T && T.rows.length === 7 ? true : x.oops('', 'Garde seulement les lignes où Dossier_Incomplet vaut TRUE.');
          }
          if (p.kind === 'add' && p.q && p.q.name === NAME) return x.oops('Préparation principale réduite à sept lignes', 'La préparation principale ne change plus.');
          if (p.kind === 'add') return p.q === t ? undefined : x.oops('', 'Travaille dans la liste temporaire.');
        }
      });
      const t = tmp(); t.tmp203 = true;
      const N = K2.T(x, t.name).rows.length;
      const B = K2.sorter({ title: 'Qui peut résoudre chaque dossier ?', intro: `${N} dossiers incomplets. Choisis le responsable de chaque vérification.`, btn: 'Valider la liste',
        options: [['oscar', 'Oscar · bon d’intervention'], ['gabriel', 'Gabriel · pièce de coût']],
        rows: [['M0012', 'Technicien absent'], ['M0400', 'Technicien fait d’espaces'], ['M1090', 'Technicien absent'], ['M0350', 'Attraction absente'], ['M0025', 'Coût HT absent'], ['M0450', 'Marqueur N/A'], ['M1050', 'Coût à confirmer']].map(r => ({ id: r[0], t: r[0], sub: r[1] })) });
      x.app('liste203', B.el);
      const SOL = { M0012: 'oscar', M0400: 'oscar', M1090: 'oscar', M0350: 'oscar', M0025: 'gabriel', M0450: 'gabriel', M1050: 'gabriel' };
      x.todo('Attribue chaque dossier à Oscar ou à Gabriel.');
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        if (Object.keys(SOL).some(k => !values[k])) return x.oops('Responsable absent');
        const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
        if (!bad.length) { B.lock(); return true; }
        return x.oops('Justificatif non défini', `${bad[0]} : ${SOL[bad[0]] === 'oscar' ? 'le technicien ou l’attraction figure sur le bon d’intervention' : 'un coût se justifie avec une pièce de coût'}.`);
      } });
      x.app('pbi');
      await x.ok(`${N} dossiers, chacun avec un responsable et une preuve attendue. La préparation principale garde ses 1 100 lignes et ses 19 colonnes.`);
    }, avance: EX6 },

    /* 7 — Mesurer la complétude sans masquer les défauts */
    { async run(x) {
      const pbi = x.pbi;
      await x.say('victoria', 'Quelle proportion de notre fichier ces sept dossiers représentent-ils ?');
      await x.say('gabriel', 'Et peut-on dire que toutes les autres lignes sont fiables ?');
      await x.pixel('Nous pouvons mesurer leur complétude selon nos règles. Pas en déduire une qualité globale. Le dénominateur : les 1 100 candidats.');
      x.app('calc203', K.lesson('Dossier d’audit', 'Complétude selon nos règles', `${K2.facts([['1 100', 'interventions candidates'], [3, 'techniciens à renseigner'], [1, 'attraction à renseigner'], [3, 'coûts HT à confirmer'], [7, 'dossiers incomplets']])}<p class="lc-note">${esc(fr('Taux = lignes concernées ÷ 1 100, arrondi à deux décimales.'))}</p>`));
      await K2.num(x, 'Calcule les taux, en %, à deux décimales.', [{ id: 't', label: 'Technicien renseigné', unit: '%' }, { id: 'a', label: 'Attraction renseignée', unit: '%' }, { id: 'c', label: 'Coût sans absence ciblée', unit: '%' }, { id: 'd', label: 'Dossiers incomplets', unit: '%' }], v => {
        const near = (a, b) => a !== null && Math.abs(a - b) < 0.006;
        if (near(v.t, 99.73) && near(v.a, 99.91) && near(v.c, 99.73) && near(v.d, 0.64)) return true;
        if (near(v.t, 99.91) || near(v.d, 0.64 * 1100 / 1098)) return ['Dénominateur de 1098'];
        if (near(v.t, 0.27) || near(v.d, 99.36)) return ['', 'Taux de présence pour les trois colonnes, taux d’incomplets pour le dernier.'];
        return ['', 'Technicien : 1 097 ÷ 1 100. Attraction : 1 099 ÷ 1 100. Coût : 1 097 ÷ 1 100. Dossiers : 7 ÷ 1 100.'];
      });
      await K2.ask(x, 'Le coût HT est renseigné à 99,73 %. Peut-on dire que 99,73 % des coûts sont fiables ?', [{ t: 'Non : le taux mesure seulement l’absence des cas ciblés', ok: true }, { t: 'Oui', err: 'Coûts déclarés fiables à 99,73 %' }]);
      x.app('pbi');
      await x.ok('Sept enregistrements sur 1 100 sont incomplets selon les trois règles étudiées. Les autres peuvent encore cacher des dates impossibles, des doublons ou des montants incohérents.');
    } },

    /* 8 — Sauvegarder sans effacer l'inconnu */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K2.open(x, NAME);
      await x.say('gabriel', 'Nous avons une liste claire. Mais nous ne connaissons toujours pas les montants manquants.');
      await x.say('victoria', 'C’est une conclusion acceptable. Nous savons ce qu’il manque et comment obtenir les réponses.');
      await x.pixel('Il reste à vérifier que la préparation n’a rien fait disparaître, puis à ranger l’atelier.');
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M203', cur: NAME,
        work: { loadErr: 'Préparation chargée dans le modèle', overErr: 'Valeurs historiques modifiées', fileErr: 'Valeurs historiques modifiées', delErr: 'Lignes manquantes supprimées',
          delQuery: p => p.target.tmp203 || (!['prep_Maintenance_Brut', STRUCT, NAME].includes(p.target.name) && p.target.m2) ? true : false,
          tries: p => p.kind === 'add' ? x.oops(p.op === 'distinct' ? 'Doublons retirés' : p.op === 'replace' ? 'Dates impossibles corrigées' : p.op === 'removeCols' ? 'Colonnes sources remplacées par les colonnes de diagnostic' : '', 'La préparation est terminée : plus aucune transformation.') : undefined },
        pre: () => {
          const extra = P().queries.find(q => q.m2 && !['prep_Maintenance_Brut', STRUCT, NAME].includes(q.name));
          if (extra) { if (!pbi.q2El) return ['Rouvre l’éditeur Power Query pour ranger l’atelier.', ['[data-a="cmd:transform"]']]; return [`Supprime la requête temporaire ${extra.name} : ses preuves sont notées.`, ['[data-q="qd"]', K2.qmenu(x, extra), '.menu [data-k="del"]', '[data-d="ok"]', '[data-d="del"]']]; }
          return true;
        }
      });
      const T = pbi.engine().table(K2.q(x, NAME));
      x.app('ctl203', K.lesson('Contrôle final', 'Rien n’a disparu', `${K2.facts([[K2.n(T.rows.length), 'lignes candidates'], [T.cols.length, 'colonnes, dont 6 ajoutées'], [7, 'dossiers incomplets'], [0, 'intervention supprimée']])}${K2.card110(P())}`));
      await K2.ask(x, 'Victoria demande : peut-on calculer les dépenses de maintenance et comparer les attractions ?', [{ t: 'Pas encore : sept dossiers attendent des pièces, et doublons, dates et montants restent à contrôler', ok: true }, { t: 'Oui, en comptant les coûts manquants à zéro', err: 'Mission déclarée validée sans preuves', msg: 'Un coût inconnu n’est pas une dépense nulle.' }]);
      await x.ok('1 100 candidats, 19 colonnes, 7 dossiers ouverts. Le rapport du conseil est intact, et la copie M203 est enregistrée.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'atelier', n: 'Début d’après-midi. Oscar accroche les sept dossiers sur le tableau de suivi. Chaque fiche a un responsable et une pièce à rechercher.' },
    { p: 'oscar', t: 'Nous avons retrouvé les informations qui manquent. Je vais chercher les bons correspondants.' },
    { p: 'gabriel', t: 'Et nous n’avons pas transformé nos dépenses inconnues en dépenses nulles.' },
    { p: 'victoria', t: 'Je sais maintenant quelles analyses doivent attendre, et quelles questions poser aux équipes.' },
    { card: { k: NAME, h: '7 dossiers incomplets sur 1 100', chips: ['3 techniciens', '1 attraction', '3 coûts HT', '0 suppression'] } },
    { wait: 600 }
  ],
  recompense: { titre: 'Les fantômes sont démasqués !', sous: 'Tu as rendu l’inconnu visible, sans rien inventer.', badge: 'b203', badgeNom: 'Gardien des informations manquantes', objet: 'tableau-investigations' },
  fiches: [
    ['Préparation spécialisée', 'Pourquoi créer une nouvelle référence pour chaque traitement ?', 'Chaque préparation précédente reste un point de comparaison. On peut vérifier ce qu’une étape a changé.'],
    ['Profilage et périmètre', 'Pourquoi préciser le périmètre d’un profilage ?', 'Les résultats dépendent des lignes examinées et de l’étape choisie. Sur les 1 000 premières lignes, M1090 échappait au comptage.'],
    ['Blanc visuel', 'Comment traiter une cellule faite d’espaces ?', 'Conserver la colonne source, puis créer une colonne normalisée : Text.Clean et Text.Trim, et un texte vide devient null.'],
    ['Faux zéro', 'Pourquoi ne pas remplacer un coût absent par 0 ?', 'Un coût inconnu peut cacher une dépense réelle. Absent, N/A ou à confirmer : chaque situation demande un traitement différent.'],
    ['Remplir vers le bas', 'Quand peut-on remplir une cellule vide avec la valeur du dessus ?', 'Seulement si une convention de la source prévoit cet héritage entre lignes. Sinon, on signale l’absence.'],
    ['Liste d’investigation', 'Que doit contenir une liste de dossiers incomplets ?', 'Le problème observé, un responsable, la preuve attendue et une décision encore ouverte. Elle vit dans une référence temporaire non chargée.'],
    ['Complétude', 'Un taux de complétude de 99,73 % prouve-t-il la qualité ?', 'Non. Il mesure la présence d’informations selon une règle définie, pas leur exactitude ni leur cohérence.'],
    ['Conserver l’inconnu', 'Pourquoi garder une valeur inconnue au lieu de la deviner ?', 'La signaler est un traitement explicite. Inventer une réponse ferait perdre l’information sur l’incertitude.']
  ],
  suiteTitre: 'Dimanche, 14 h 10',
  suite: [
    { bg: 'dossiers', n: 'Bureau Data. Gabriel observe une autre partie du registre.' },
    { p: 'gabriel', t: 'Attendez… Pourquoi le numéro M0899 apparaît-il deux fois ?' },
    { p: 'oscar', t: 'Pour M0899, cela ressemble à une copie. Mais M0949 aussi apparaît deux fois, avec des contenus différents.' },
    { p: 'pixel', t: 'Même identifiant ne signifie pas toujours même enregistrement. Il va falloir enquêter avant de supprimer quoi que ce soit.' }
  ],
  accroche: 'Techniciens absents, coûts « à confirmer », attraction manquante : rendre l’inconnu visible sans rien inventer.',
  fin(P) { EX6(P); EX8(P); }
};
window.PBQ.mission(def);
})();

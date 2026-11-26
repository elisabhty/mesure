/* Mission 204 — Les billets en double (doublons, collisions d'identifiants, retrait justifié) */
(function () {
'use strict';
const { esc, fr, $, $$, h } = window.PBQ;
const NULLS = 'prep_Maintenance_Nulls', NAME = 'prep_Maintenance_Doublons';
const KEEP = ['prep_Maintenance_Brut', 'prep_Maintenance_Structure', NULLS, NAME];

/* ───────── État canonique ───────── */
const SET = n => P => {
  let q = P.queries.find(x => x.id === 'q_dbl');
  if (!q) { q = K2.C.dbl(); P.queries.push(q); }
  q.steps = K2.C.dblSteps().slice(0, n);
};
const EX1 = SET(1), EX6 = SET(2);
function EX5(P) { P.decisions = [{ piece: 'CONF-M204-01', groupe: 'M0899', decision: 'Conserver Ligne_Source 906, retirer la copie 907', statut: 'Résolu' }, { piece: 'CONF-M204-01', groupe: 'M0949', decision: 'Conserver 956 et 957, collision de clé à corriger séparément', statut: 'Ouvert' }]; }
function EX8(P) { P.queries = P.queries.filter(q => !q.tmp204); P.name = 'Wonderland_Pilotage_M204'; P.saved = true; P.dirty = false; }
const tmps = P => P.queries.filter(q => q.tmp204);

const def = {
  id: 204,
  objectifs: ['Distinguer doublon de contenu, collision d’identifiant et répétition légitime', 'Compter les groupes répétés par regroupement', 'Retirer une seule copie, justifiée par une pièce', 'Réconcilier les volumes avant et après'],
  intro: [
    { bg: 'dossiers', n: 'Dimanche 7 juin, 14 h 10. Bureau Data. Sur le tableau des investigations, sept dossiers attendent leurs justificatifs.' },
    { p: 'gabriel', t: 'M0899… et encore M0899. Même attraction, même date, même technicien, même montant. Avons-nous payé deux fois la même intervention ?' },
    { p: 'oscar', t: 'Peut-être. Mais cela peut aussi venir de l’export. Deux lignes dans un fichier ne prouvent pas deux paiements.' },
    { p: 'pixel', t: 'Avant de supprimer quoi que ce soit, déterminons ce qui est répété : la ligne, l’identifiant ou l’événement métier.' },
    { clear: 1, card: { k: 'M0949 · deux lignes', h: 'Même numéro, contenus différents', p: 'La seconde porte le commentaire : « Deuxième passage ? BT-0950 à rapprocher de BT-0949 ».' } },
    { p: 'oscar', t: 'Si nous supprimons une ligne parce que le numéro est répété, nous risquons d’effacer une vraie intervention.' },
    { p: 'gabriel', t: 'Donc le bouton Supprimer les doublons ne peut pas décider à notre place.' },
    { clear: 1, p: 'victoria', t: 'Je veux un traitement explicable. Pour chaque ligne retirée, nous devons savoir pourquoi, et comment la retrouver.' },
    { btn: 'Trois répétitions différentes' }
  ],
  leconTitre: 'Trois répétitions différentes',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Qu’est-ce qui se répète ?', `
      <div class="flow-row" style="grid-template-columns:1fr 1fr 1fr"><div class="flow-box on"><b>Doublon de contenu</b><small>Toutes les colonnes métier sont identiques.</small></div><div class="flow-box on"><b>Collision d’identifiant</b><small>Même identifiant, contenus différents.</small></div><div class="flow-box on"><b>Répétition légitime</b><small>Même attraction ou même date : deux événements.</small></div></div>
      <div data-sec="2" style="display:none">
        <div class="lc-k" style="margin-top:16px">Expérience · Supprimer les doublons, mais sur quelles colonnes ?</div>
        <div class="seg" data-g="c"><button data-v="id">ID seul</button><button data-v="src">12 colonnes sources</button><button data-v="all">Les 13 colonnes</button></div>
        <div data-o="c"><p class="lc-note">Choisis les colonnes comparées.</p></div>
      </div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    await x.pixel('Deux interventions sur Dragon le même jour peuvent être parfaitement légitimes.');
    await x.say('oscar', 'Une inspection le matin et une réparation l’après-midi, par exemple.');
    await K2.ask(x, 'M0949 apparaît deux fois, avec une autre attraction et un autre technicien. C’est…', [{ t: 'Une collision d’identifiant', ok: true }, { t: 'Un doublon de contenu', msg: 'Les contenus diffèrent : ce n’est pas une copie.' }, { t: 'Une répétition légitime', msg: 'Le même identifiant ne devrait désigner qu’une intervention : la clé est en cause.' }]);
    $('[data-sec="2"]', card).style.display = ''; requestAnimationFrame(() => sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }));
    const R = { id: ['1 098 lignes', 'Les deux groupes perdent une ligne : une intervention de M0949 disparaîtrait.'], src: ['1 099 lignes', 'Seule la copie de M0899, identique sur les 12 colonnes, est rapprochée.'], all: ['1 100 lignes', 'Ligne_Source diffère toujours : aucune ligne n’est reconnue comme identique.'] };
    const draw = v => { $$('[data-g="c"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === v)); $('[data-o="c"]', card).innerHTML = `<div class="flow-box on hot" style="margin-top:4px"><b>${esc(fr(R[v][0]))}</b><small>${esc(fr(R[v][1]))}</small></div>`; };
    $$('[data-g="c"] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.c', b.dataset.v)));
    await x.pixel('La commande Supprimer les doublons compare les colonnes que tu sélectionnes. Essaie les trois choix.');
    const seen = new Set(); x.todo('Touche les trois choix de colonnes.');
    await x.wait({ 'lab.c': v => { draw(v); seen.add(v); if (seen.size === 3) return true; } });
    await x.say('gabriel', 'Nous devons donc définir ce que signifie « identique » avant d’utiliser la commande.');
    await x.ok('Exactement. Et même deux lignes identiques demandent de comprendre leur origine avant une suppression définitive.');
  },
  exs: [
    /* 1 — Préparer une branche de traitement */
    { async run(x) {
      const pbi = x.pbi;
      x.app('pbi'); pbi.render();
      await x.say('victoria', 'Nous devons conserver la préparation précédente pour comparer les résultats. Crée une branche dédiée aux doublons.');
      await K2.branch(x, { src: NULLS, name: NAME, deps: false, errs: { imp: 'Nouvelle importation du classeur', edit: 'Travail dans la requête brute', srcEdit: 'Modification de la préparation Nulls', name: 'Nom de requête ambigu', load: 'Chargement activé', legacy: 'Utilisation d’une table commerciale' } });
      K2.open(x, NAME);
      await K2.num(x, 'Vérifie le volume de départ.', [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 1100 && v.c === 19 ? true : v.l < 1100 ? ['Volume déjà réduit'] : v.c < 19 ? ['Colonnes de diagnostic perdues'] : ['', 'Lis la barre d’état : 19 colonnes, 999+ lignes, soit les 1 100 candidats.']);
      await x.ok('1 100 lignes et 19 colonnes : l’état exact de la mission 203.');
    }, avance: EX1 },

    /* 2 — Trouver les identifiants répétés */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, D = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('gabriel', 'Combien de numéros sont répétés ? Et combien de lignes cela représente-t-il ?');
      await x.pixel('Ces deux questions n’ont pas la même réponse. Regroupons par identifiant, dans une référence temporaire.');
      const T1 = () => tmps(P()).find(q => q.steps.some(s => s.op === 'group')) || tmps(P()).find(q => q.kind204 === 'grp');
      await K2.work(x, {
        cur: NAME, edit: [], editNew: true, ops: ['group', 'filter'],
        next: () => {
          const t = T1();
          if (!t) return [`Volet Requêtes : ⋯ à côté de ${NAME}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, D()), '.menu [data-k="ref"]']];
          if (t.load !== false) return ['Désactive le chargement de cette référence temporaire.', ['.q2-qname', '.menu [data-k="load"]']];
          if (!K2.shown(x, t.name)) return K2.showTodo(x, t.name);
          if (!t.steps.some(s => s.op === 'group')) return ['Sélectionne ID_Intervention, puis Accueil › Regrouper par. Nouvelle colonne : Nombre_Lignes, opération Nombre de lignes.', ['[data-q="hd:ID_Intervention"]', '[data-q="tab:Accueil"]', '[data-q="cmd:group"]', '.q2-agg input', '[data-d="ok"]']];
          if (!t.steps.some(s => s.op === 'filter')) return ['Filtre Nombre_Lignes : Filtres numériques › est supérieur à 1.', ['[data-q="flt:Nombre_Lignes"]', '[data-f="adv"]', '[data-k="o1"]', '[data-k="v1"]', '[data-d="ok"]']];
          return true;
        },
        tries: p => {
          const t = T1();
          if (p.kind === 'newQuery') { if (t) return x.oops('', 'La référence temporaire existe déjà.'); if (p.how !== 'ref' || p.src !== D()) return x.oops('', `Crée une référence de ${NAME}.`); p.query.tmp204 = true; p.query.kind204 = 'grp'; return true; }
          if (p.kind === 'load') { if (p.on) return x.oops('', 'Cette vue temporaire reste non chargée.'); return p.target === t ? true : x.oops('', 'Règle seulement la référence temporaire.'); }
          if (p.kind === 'renameQuery') return p.target === t ? true : x.oops('', 'Garde le nom de cette requête.');
          if (p.kind === 'add' && p.q === D()) return x.oops(p.op === 'group' ? 'Regroupement conservé dans la préparation principale' : '', 'La préparation principale ne change pas : travaille dans la référence temporaire.');
          if (p.kind === 'add' && p.op === 'group') {
            const k = p.step.keys;
            if (k.length !== 1 || k[0] !== 'ID_Intervention') return x.oops(k.includes('Attraction') ? 'Regroupement par attraction' : k.some(c => /^Date/.test(c)) ? 'Regroupement par date seulement' : '', 'Regroupe seulement par ID_Intervention.');
            const a = p.step.aggs[0]; if (a.op !== 'count') return x.oops('', 'Choisis l’opération Nombre de lignes.');
            if (a.as !== 'Nombre_Lignes') return x.oops('', 'Nomme la nouvelle colonne Nombre_Lignes.');
            return true;
          }
          if (p.kind === 'add' && p.op === 'filter') { const T = K2.simulate(x, t, p.step).table; return T && T.rows.length === 2 ? true : x.oops('', 'Garde seulement les groupes dont Nombre_Lignes est supérieur à 1.'); }
        }
      });
      await K2.num(x, 'Lis le résultat, puis distingue les quatre nombres.', [{ id: 'g', label: 'Groupes répétés' }, { id: 'l', label: 'Lignes dans ces groupes' }, { id: 's', label: 'Occurrences en trop' }], v => {
        if (v.g === 2 && v.l === 4 && v.s === 2) return true;
        if (v.g === 4) return ['Quatre groupes annoncés'];
        return ['', 'Deux identifiants apparaissent chacun deux fois : combien de lignes, et combien en plus d’une ligne par identifiant ?'];
      });
      await K2.ask(x, 'Ces deux occurrences en trop sont-elles deux lignes à supprimer ?', [{ t: 'Pas forcément : il faut d’abord comprendre les deux dossiers', ok: true }, { t: 'Oui, une par groupe', err: 'Deux suppressions déjà décidées' }]);
      await x.ok('Deux groupes, M0899 et M0949, quatre lignes, deux occurrences en trop. Et toujours 1 098 identifiants distincts dans la préparation.');
    } },

    /* 3 — Comparer les lignes de M0899 */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, D = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('oscar', 'Les deux lignes de M0899 semblent identiques. Vérifions toutes les informations avant de conclure.');
      await x.pixel('Une seconde référence temporaire, avec Conserver les doublons sur ID_Intervention : les quatre lignes concernées, côte à côte.');
      const T2 = () => tmps(P()).find(q => q.kind204 === 'dup');
      await K2.work(x, {
        cur: NAME, edit: [], editNew: true, ops: ['keepDups'],
        next: () => {
          const t = T2();
          if (!t) return [`Volet Requêtes : ⋯ à côté de ${NAME}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, D()), '.menu [data-k="ref"]']];
          if (t.load !== false) return ['Désactive le chargement de cette référence.', ['.q2-qname', '.menu [data-k="load"]']];
          if (!K2.shown(x, t.name)) return K2.showTodo(x, t.name);
          if (!t.steps.some(s => s.op === 'keepDups')) return ['Sélectionne ID_Intervention, puis Accueil › Conserver les lignes › Conserver les doublons.', ['[data-q="hd:ID_Intervention"]', '[data-q="tab:Accueil"]', '[data-q="cmd:keeprows"]', '.menu [data-k="dups"]']];
          return true;
        },
        tries: p => {
          const t = T2();
          if (p.kind === 'newQuery') { if (t) return x.oops('', 'La référence existe déjà.'); if (p.how !== 'ref' || p.src !== D()) return x.oops('', `Crée une référence de ${NAME}.`); p.query.tmp204 = true; p.query.kind204 = 'dup'; return true; }
          if (p.kind === 'load') { if (p.on) return x.oops('', 'Cette vue reste non chargée.'); return p.target === t ? true : x.oops('', 'Règle seulement la nouvelle référence.'); }
          if (p.kind === 'add' && p.q !== t) return x.oops('Valeurs corrigées pendant la comparaison', 'Compare dans la nouvelle référence, sans modifier les autres requêtes.');
          if (p.kind === 'add' && p.op === 'keepDups') return p.step.cols.length === 1 && p.step.cols[0] === 'ID_Intervention' ? true : x.oops('Comparaison limitée à l’ID', 'Conserve les doublons sur ID_Intervention seulement.');
          if (p.kind === 'add' && (p.op === 'removeCols' || p.op === 'selectCols')) return x.oops('Traçabilité supprimée');
        }
      });
      await x.pixel('Quatre lignes. Fais défiler l’aperçu vers la droite pour comparer les deux M0899, colonne par colonne.');
      await K2.num(x, 'Quelles positions d’origine portent les deux lignes M0899 ?', [{ id: 'a', label: 'Première Ligne_Source' }, { id: 'b', label: 'Seconde Ligne_Source' }], v => v.a === 906 && v.b === 907 ? true : ['', 'Lis la colonne Ligne_Source, tout à droite de l’aperçu.']);
      await K2.ask(x, 'Entre ces deux lignes, quelles colonnes sources diffèrent ?', [{ t: 'Aucune : seule Ligne_Source change', ok: true }, { t: 'Ligne_Source : les lignes sont donc différentes', err: 'Lignes déclarées différentes à cause de l’index' }, { t: 'Le commentaire', err: 'Commentaire oublié', msg: 'Les deux lignes portent le même commentaire : Bon BT-0899.' }]);
      await K2.ask(x, 'Ces deux lignes prouvent-elles un double paiement de 630 € ?', [{ t: 'Non : elles montrent deux positions dans l’export, pas deux règlements', ok: true }, { t: 'Oui, 1 260 € ont été payés', err: 'Deux paiements annoncés' }]);
      await x.ok('Même contenu métier, deux positions dans l’export. L’origine de cette répétition doit être confirmée avant tout retrait.');
    } },

    /* 4 — Enquêter sur la collision M0949 */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      const t = tmps(P()).find(q => q.kind204 === 'dup');
      if (t) K2.open(x, t.name); else K2.open(x, NAME);
      await x.say('oscar', 'Ici, le numéro est le même, mais les informations changent.');
      await x.say('gabriel', 'Si nous conservons seulement la première ligne, nous risquons de perdre une dépense réelle.');
      await x.pixel('Les deux lignes M0949 sont les deux dernières de l’aperçu. Fais-le défiler vers la droite pour tout comparer.');
      const COLS = ['Attraction', 'Date_Demande', 'Date_Intervention', 'Type_Maintenance', 'Statut', 'Technicien', 'Duree_Heures', 'Cout_HT', 'TVA_Taux', 'Cout_TTC', 'Commentaire'], SAME = ['Statut', 'TVA_Taux'];
      const DIFF = COLS.filter(c => !SAME.includes(c));
      await x.multi('Coche tous les champs qui diffèrent entre les deux lignes M0949.', COLS.map(c => ({ t: c, v: c })), sel => {
        const miss = DIFF.filter(c => !sel.includes(c)), extra = sel.filter(c => SAME.includes(c));
        if (!miss.length && !extra.length) return true;
        if (extra.length) return ['', `${extra[0]} est identique sur les deux lignes.`];
        if (sel.length && sel.every(c => c === 'Cout_HT' || c === 'Cout_TTC')) return ['Comparaison limitée aux montants'];
        return ['', `Il manque des différences : regarde aussi ${miss[0]}.`];
      });
      await K2.ask(x, 'Quel cas représente M0949 ?', [{ t: 'Une collision d’identifiant : deux interventions possibles sous un même numéro', ok: true }, { t: 'Une copie à supprimer', err: 'Suppression de la seconde ligne' }, { t: 'Rien à signaler, puisque les lignes diffèrent', err: 'Collision ignorée parce que les lignes diffèrent' }, { t: 'Il suffit de renuméroter la seconde en M0950', err: 'Remplacement automatique par M0950' }]);
      await K2.ask(x, 'Le commentaire « Deuxième passage ? » prouve-t-il un deuxième passage ?', [{ t: 'Non : il formule encore une hypothèse', ok: true }, { t: 'Oui', err: 'Deuxième passage affirmé comme certain' }]);
      await x.ok('Les deux lignes diffèrent sur plusieurs champs : une suppression fondée sur l’identifiant seul serait injustifiée. Les deux restent, la question est inscrite au registre.');
    } },

    /* 5 — Lire le justificatif et autoriser une seule suppression */
    { async run(x) {
      const pbi = x.pbi;
      await x.say('oscar', 'J’ai retrouvé les éléments nécessaires pour ces deux groupes.');
      await x.mail({ de: 'oscar', lbl: 'Pièce pédagogique du scénario', heure: '15:02', objet: 'CONF-M204-01 · Bon de confirmation', corps: ['M0899 : le bon BT-0899 correspond à une seule intervention. Le journal d’export confirme que son enregistrement a été émis deux fois consécutivement.', 'M0949 : les bons BT-0949 et BT-0950 correspondent à deux interventions distinctes. L’identifiant a été recopié sur la seconde ligne. La correction de la clé doit être traitée séparément.'], btn: 'Prendre les décisions' });
      await x.say('oscar', 'Pour M0899, nous conservons la première occurrence de l’export et retirons la copie. Pour M0949, nous gardons les deux interventions.');
      const B = K2.sorter({ title: 'Décision par ligne', intro: 'Pièce utilisée : CONF-M204-01. Choisis le sort de chaque ligne.', btn: 'Valider les décisions',
        options: [['keep', 'Conserver'], ['drop', 'Retirer']],
        rows: [['906', 'M0899 · première occurrence'], ['907', 'M0899 · copie émise une seconde fois'], ['956', 'M0949 · BT-0949'], ['957', 'M0949 · BT-0950, clé recopiée']].map(r => ({ id: r[0], t: `Ligne_Source ${r[0]}`, sub: r[1] })) });
      x.app('dec204', B.el);
      const SOL = { 906: 'keep', 907: 'drop', 956: 'keep', 957: 'keep' };
      x.todo('Décide pour chacune des quatre lignes.');
      await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
        if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Décide pour les quatre lignes.');
        const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
        if (!bad.length) { B.lock(); return true; }
        if (values['906'] === 'drop' && values['907'] === 'keep') return x.oops('Retrait de la ligne 906 sans explication');
        if (values['957'] === 'drop' || values['956'] === 'drop') return x.oops(Object.values(values).filter(v => v === 'drop').length > 1 ? 'Deux suppressions autorisées' : 'Retrait étendu à d’autres groupes');
        return x.oops('', 'Relis la pièce : une seule copie est confirmée.');
      } });
      EX5(pbi.P);
      await K2.ask(x, 'Que vaut la pièce CONF-M204-01 ?', [{ t: 'Une pièce du scénario de formation, limitée à ces deux dossiers', ok: true }, { t: 'Une preuve réelle obtenue auprès du service maintenance', err: 'Pièce fictive présentée comme preuve réelle externe' }, { t: 'Une garantie sur tout le fichier', err: 'Justificatif confondu avec une garantie sur tout le fichier' }]);
      x.app('pbi');
      await x.ok('Une seule suppression autorisée : Ligne_Source 907. M0949 garde ses deux lignes, et la correction de sa clé reste une décision à part.');
    }, avance: EX5 },

    /* 6 — Retirer la copie sans choisir au hasard */
    { async run(x) {
      const pbi = x.pbi, D = () => K2.q(x, NAME);
      if (!pbi.P.decisions) EX5(pbi.P);
      K2.open(x, NAME);
      await x.say('gabriel', 'Nous savons quelle ligne retirer. Comment être sûrs que la transformation ne choisira pas une autre occurrence ?');
      await x.pixel('En visant la position source convenue : Ligne_Source 907. Pas le rang dans l’aperçu, pas un tri.');
      await K2.work(x, {
        cur: NAME, edit: [NAME], ops: ['filter'], offOp: '', offOpMsg: 'Exclus seulement Ligne_Source 907, avec le filtre de la colonne.',
        next: () => {
          const q = D(), i = q.steps.findIndex(s => s.op === 'filter');
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (i < 0) return ['Filtre de Ligne_Source : cherche 907, décoche-la, puis OK.', ['[data-q="flt:Ligne_Source"]', '.q2-search', '[data-d="ok"]']];
          if (q.steps[i].name !== 'Copie_Export_Confirmee_Retiree') return K2.stepTodo(q, i, 'Copie_Export_Confirmee_Retiree');
          return true;
        },
        tries: p => {
          const q = D();
          if (p.kind === 'add') {
            if (p.op === 'distinct') { const c = p.step.cols; return x.oops(c.length === 1 && c[0] === 'ID_Intervention' ? 'Supprimer les doublons sur ID seul' : c.length >= 19 ? 'Sélection des 19 colonnes' : '', 'Vise la ligne source confirmée plutôt qu’une règle de doublons.'); }
            if (p.op === 'sort') return x.oops('Tri présenté comme garantie suffisante du survivant');
            if (p.op === 'skip' || p.op === 'removeBottom' || p.op === 'keepTop') return x.oops('Retrait de la position courante 907');
            if (p.op === 'filter') {
              const c = p.step.cond;
              if (c.col === 'ID_Intervention') return x.oops(c.values && c.values.includes('M0949') ? 'M0949 réduit à une ligne' : 'Retrait de toutes les lignes M0899');
              if (c.col !== 'Ligne_Source' || c.kind !== 'values' || !c.exclude) return x.oops('', 'Exclus la valeur 907 de Ligne_Source.');
              if (c.values.length !== 1 || c.values[0] !== 907) return x.oops(c.values.length > 1 ? 'Volume final de 1098' : '', 'Exclus seulement 907.');
              return true;
            }
          }
          if (p.kind === 'renameStep') return K2.renameRule(x, p, [{ step: q.steps.find(s => s.op === 'filter'), name: 'Copie_Export_Confirmee_Retiree' }]);
        }
      });
      const T = K2.T(x, NAME), m99 = T.rows.filter(r => r.ID_Intervention === 'M0899'), m49 = T.rows.filter(r => r.ID_Intervention === 'M0949');
      await K2.num(x, 'Contrôle le résultat.', [{ id: 'l', label: 'Lignes' }, { id: 'm', label: 'Lignes M0949' }], v => v.l === T.rows.length && v.m === m49.length ? true : v.l === 1098 ? ['Volume final de 1098'] : v.m === 1 ? ['M0949 réduit à une ligne'] : ['', 'Lis la barre d’état, puis compte les lignes M0949.']);
      await x.ok(`${K2.n(T.rows.length)} lignes, 19 colonnes. M0899 garde la ligne ${m99.map(r => r.Ligne_Source).join(', ')} ; M0949 garde ${m49.map(r => r.Ligne_Source).join(' et ')}.`);
    }, avance: EX6 },

    /* 7 — Réconcilier les volumes et le retrait */
    { async run(x) {
      const pbi = x.pbi, s = () => pbi.q2;
      K2.open(x, NAME);
      await x.say('victoria', 'Une ligne a disparu. Montre-moi que c’est exactement la bonne, et que rien d’autre n’a changé.');
      await K2.work(x, {
        cur: NAME,
        next: () => {
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (s().scope !== 'all') return ['Passe le profilage sur l’ensemble des données.', ['[data-q="scope"]', '.menu [data-k="all"]']];
          if (!(s().prof && s().sel.length === 1 && s().sel[0] === 'ID_Intervention')) return ['Affiche le profil de ID_Intervention.', ['[data-q="hd:ID_Intervention"]', '[data-q="tab:Affichage"]', '[data-q="cmd:prof"]']];
          return true;
        },
        on: { 'q2.scope': p => { if (p.scope === 'top') return x.oops('', 'Garde l’ensemble des données.'); } }
      });
      await K2.num(x, 'Après le retrait, que donne le profil de ID_Intervention ?', [{ id: 'd', label: 'Identifiants distincts' }, { id: 'u', label: 'Présents une seule fois' }, { id: 'g', label: 'Groupes encore répétés' }], v => {
        if (v.d === 1098 && v.u === 1097 && v.g === 1) return true;
        if (v.d === 1097) return ['1097 identifiants distincts'];
        if (v.g === 0) return ['Zéro groupe répété attendu'];
        return ['', 'Distinct et Unique sont dans les statistiques ; M0949 apparaît toujours deux fois.'];
      });
      await K2.ask(x, 'La copie retirée portait 525 € HT et 630 € TTC. Que représentent ces montants ?', [{ t: 'Le contenu d’une copie de l’export, pas une économie', ok: true }, { t: '630 € d’économies réalisées', err: '630 € annoncés comme économie' }, { t: 'La preuve que le TTC global est réconcilié', err: 'TTC global présenté comme réconcilié' }]);
      await K2.ask(x, 'Combien de dossiers incomplets de la mission 203 reste-t-il ?', [{ t: 'Toujours 7 : aucun ne se trouvait sur la copie', ok: true }, { t: '6', err: 'Dossiers incomplets réduits' }]);
      await x.ok('1 099 lignes, 1 098 identifiants, 1 097 présents une seule fois, un groupe répété : M0949. Exactement une ligne retirée, aucune valeur modifiée.');
    } },

    /* 8 — Conserver la preuve et fermer l'enquête */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      if (!P().decisions) EX5(P());
      K2.open(x, NAME);
      await x.say('oscar', 'Le premier dossier est résolu. Le second reste ouvert pour corriger son identifiant.');
      await x.say('victoria', 'C’est cet état exact que je veux retrouver à la prochaine mission.');
      x.app('reg204', K.lesson('Registre de décision', 'CONF-M204-01', `<table class="tbl wrap" style="width:100%"><thead><tr><th><span class="thc">Groupe</span></th><th><span class="thc">Décision</span></th><th><span class="thc">Statut</span></th></tr></thead><tbody>${P().decisions.map(d => `<tr><td>${esc(d.groupe)}</td><td>${esc(fr(d.decision))}</td><td>${esc(d.statut)}</td></tr>`).join('')}</tbody></table><p class="lc-note">${esc(fr('Le registre est enregistré dans le projet. Les vues temporaires peuvent maintenant disparaître.'))}</p>`));
      await K2.ask(x, 'M0949 est-il résolu ?', [{ t: 'Non : sa collision de clé reste ouverte', ok: true }, { t: 'Oui, ses deux lignes sont conservées', err: 'M0949 marqué résolu' }]);
      x.app('pbi'); K2.open(x, NAME);
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M204', cur: NAME,
        work: { loadErr: 'Chargement d’une préparation activé', overErr: 'Checkpoint 110 écrasé', fileErr: 'Valeurs commerciales modifiées', delErr: 'Préparations précédentes supprimées',
          delQuery: p => p.target.tmp204 ? true : false },
        pre: () => {
          const t = tmps(P())[0];
          if (t) { if (!pbi.q2El) return ['Rouvre l’éditeur Power Query pour ranger les vues temporaires.', ['[data-a="cmd:transform"]']]; return [`Supprime la vue temporaire ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']]; }
          return true;
        }
      });
      x.app('ctl204', K.lesson('Contrôle final', 'Quatre préparations, une enquête à moitié close', `${K2.facts([['1 099', 'lignes dans les doublons'], [1, 'copie retirée, justifiée'], [1, 'collision ouverte'], [4, 'préparations non chargées']])}${K2.card110(P())}`));
      await x.ok('Copie M204 enregistrée. Le registre explique la ligne retirée et la collision conservée ; le rapport du conseil est intact.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'dossiers', n: 'Bureau Data, 15 h 35. Oscar classe le dossier M0899 dans l’armoire des preuves. M0949 reste ouvert, avec une étiquette : correction d’identifiant à confirmer.' },
    { p: 'gabriel', t: 'Une ligne retirée, une seule, et je sais exactement pourquoi.' },
    { p: 'victoria', t: 'C’est la traçabilité que j’attendais.' },
    { card: { k: NAME, h: '1 099 lignes · 1 retrait justifié', chips: ['M0899 résolu', 'M0949 ouvert', 'CONF-M204-01'] } },
    { wait: 600 }
  ],
  recompense: { titre: 'Doublons démêlés !', sous: 'Une seule copie retirée, et une collision gardée sous surveillance.', badge: 'b204', badgeNom: 'Enquêteur des doublons', objet: 'armoire-preuves' },
  fiches: [
    ['Partir d’un état connu', 'Pourquoi créer une branche dédiée au dédoublonnage ?', 'Elle part d’un état conservé : on mesure exactement l’effet du traitement en comparant avant et après.'],
    ['Identifiants répétés', 'Comment compter les identifiants répétés ?', 'Regrouper par identifiant avec Nombre de lignes, puis filtrer les groupes supérieurs à 1. Groupes, lignes concernées et suppressions sont trois nombres différents.'],
    ['Doublon de contenu', 'Comment savoir si deux lignes sont des copies ?', 'Comparer les colonnes métier une à une. Les colonnes de provenance, comme Ligne_Source, décrivent l’emplacement, pas le contenu.'],
    ['Collision d’identifiant', 'Deux lignes différentes partagent un identifiant : que faire ?', 'Les conserver toutes les deux et signaler la clé. Les supprimer pourrait effacer un événement légitime.'],
    ['Décision justifiée', 'Que doit contenir une décision de dédoublonnage ?', 'La pièce utilisée, les lignes concernées, la règle de conservation et le nombre de retraits autorisés, limité au cas examiné.'],
    ['Retrait déterminé', 'Pourquoi viser Ligne_Source plutôt que Supprimer les doublons ?', 'Sur l’ID seul, M0949 perdrait une ligne. Sur toutes les colonnes, rien ne serait retiré. La position confirmée donne un résultat déterminé.'],
    ['Réconcilier', 'Une copie retirée de 630 € est-elle une économie ?', 'Non. On explique l’écart de volume et de contenu : une baisse d’un total technique n’est pas une économie métier.'],
    ['Enquête à deux états', 'Une enquête peut-elle se terminer avec un dossier ouvert ?', 'Oui. La persistance doit conserver un dossier résolu et un dossier ouvert, sans les confondre.']
  ],
  suiteTitre: 'Dimanche, 15 h 45',
  suite: [
    { bg: 'calendrier', n: 'Gabriel sélectionne la demande M0040.' },
    { p: 'gabriel', t: 'Regardons maintenant la période des interventions… Le 31 février ?' },
    { p: 'oscar', t: 'Et ici, une intervention enregistrée avant sa demande…' },
    { p: 'pixel', t: 'Certaines dates sont impossibles. D’autres utilisent une autre convention. D’autres encore sont bien écrites, mais incohérentes dans le métier.' },
    { p: 'victoria', t: 'Alors notre prochaine enquête portera sur le temps.' }
  ],
  accroche: 'M0899 en double, M0949 en collision : distinguer copie, clé répétée et vraie répétition avant de retirer quoi que ce soit.',
  fin(P) { EX6(P); EX5(P); EX8(P); }
};
window.PBQ.mission(def);
})();

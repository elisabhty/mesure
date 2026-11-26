/* Mission 202 — Où sont les en-têtes ? (structure d'un export désorganisé) */
(function () {
'use strict';
const { esc, fr, $, $$, h } = window.PBQ;
const BRUT = 'prep_Maintenance_Brut', NAME = 'prep_Maintenance_Structure';

/* ───────── État canonique ───────── */
const SET = n => P => {
  let q = P.queries.find(x => x.id === 'q_struct');
  if (!q) { q = K2.C.struct(); P.queries.push(q); }
  q.steps = K2.C.structSteps().slice(0, n);
};
const EX1 = SET(1), EX2 = SET(3), EX3 = SET(4), EX4 = SET(6), EX5 = SET(7), EX6 = SET(8);
function EX8(P) { P.name = 'Wonderland_Pilotage_M202'; P.saved = true; P.dirty = false; }

const COLS = ['ID_Intervention', 'Attraction', 'Date_Demande', 'Date_Intervention', 'Type_Maintenance', 'Statut', 'Technicien', 'Duree_Heures', 'Cout_HT', 'TVA_Taux', 'Cout_TTC', 'Commentaire', 'Ligne_Source'];
const stepIdx = (q, f) => q ? q.steps.findIndex(f) : -1;
const isMarker = v => ['COMMENTAIRE ATELIER', 'TOTAL PROVISOIRE', 'FIN EXPORT'].includes(v);

const def = {
  id: 202,
  objectifs: ['Créer une requête de référence non chargée', 'Ajouter une colonne de traçabilité avant tout retrait', 'Retirer le contexte, promouvoir les en-têtes et écarter les lignes parasites', 'Prouver que les anomalies de contenu sont conservées'],
  intro: [
    { bg: 'tri', n: 'Dimanche 7 juin, 10 h 50. La lumière des archives techniques clignote. Sur l’écran d’Oscar, l’export ressemble davantage à une note d’atelier qu’à une base de données.' },
    { n: 'En haut, un titre occupe toute la largeur. Plus bas apparaissent des notes, une ligne vide, puis enfin les noms des colonnes.' },
    { p: 'oscar', t: 'Nous comprenons maintenant les problèmes du fichier. Mais si chaque personne doit retrouver les bonnes lignes à la main, nous recommencerons à chaque nouvel export.' },
    { p: 'pixel', t: 'Aujourd’hui, nous construisons une suite d’étapes reproductibles. Le fichier original restera intact.' },
    { clear: 1, p: 'victoria', t: 'Le rapport présenté au conseil doit conserver exactement les mêmes résultats. Cette préparation appartient encore à l’atelier.' },
    { card: { k: 'Le contrat de la mission', h: '1 100 interventions candidates, 13 colonnes', ul: ['prep_Maintenance_Brut reste inchangée', 'Nouvelle requête prep_Maintenance_Structure, non chargée', 'Une colonne de traçabilité : Ligne_Source', 'Les dates impossibles, montants textuels et valeurs nulles restent visibles'] } },
    { btn: 'Comprendre la structure' }
  ],
  leconTitre: 'Une structure, pas une correction',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Prolonger une requête sans la modifier', `
      <div class="lc-k">Expérience · Dupliquer ou référencer ?</div>
      <div class="seg" data-g="d"><button data-v="dup" class="on">Dupliquer</button><button data-v="ref">Référence</button></div>
      <div data-o="d"></div>
      <div data-sec="2" style="display:none">
        <div class="lc-k" style="margin-top:16px">L’ordre des étapes compte</div>
        <ol class="k2-steps"><li>Numéroter chaque ligne : Ligne_Source garde son adresse Excel.</li><li>Retirer les cinq lignes du haut.</li><li>Promouvoir la ligne d’en-têtes.</li><li>Écarter la note et le pied du fichier.</li></ol>
        <p class="lc-note">Numéroter après les retraits ferait perdre l’adresse d’origine : la ligne 7 deviendrait la ligne 1.</p>
      </div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    const draw = m => {
      $$('[data-g="d"] button', card).forEach(b => b.classList.toggle('on', b.dataset.v === m));
      $('[data-o="d"]', card).innerHTML = m === 'dup'
        ? `<div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>${BRUT}</b><small>Excel › Navigation</small></div><div class="flow-box on"><b>Copie</b><small>Excel › Navigation, une seconde lecture du fichier, indépendante.</small></div></div><p class="lc-note">${esc(fr('Deux lectures du même fichier : si l’une évolue, l’autre l’ignore.'))}</p>`
        : `<div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>${BRUT}</b><small>Excel › Navigation</small></div><div class="flow-box on hot"><b>${NAME}</b><small>Source = ${BRUT}, puis ses propres étapes.</small></div></div><p class="lc-note">${esc(fr('Une seule lecture du fichier. La nouvelle requête prolonge le résultat de la première.'))}</p>`;
    };
    $$('[data-g="d"] button', card).forEach(b => b.addEventListener('click', () => PBQ.act('lab.d', b.dataset.v)));
    draw('dup');
    await x.pixel('Pour travailler sans toucher à la préparation brute, deux options : la dupliquer, ou la référencer.');
    x.todo('Compare les deux : touche Référence.');
    x.target($('[data-g="d"] [data-v="ref"]', card));
    await x.wait({ 'lab.d': m => { draw(m); if (m === 'ref') return true; } });
    x.untarget();
    await x.ok('La référence prolonge la requête brute : une seule lecture du fichier, une dépendance visible.');
    $('[data-sec="2"]', card).style.display = ''; requestAnimationFrame(() => sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }));
    await x.pixel('Dans la référence, nous allons retrouver la structure. Et seulement la structure : les valeurs douteuses restent visibles.');
    await K2.ask(x, 'Quand ajouter la colonne Ligne_Source ?', [{ t: 'Avant de retirer la moindre ligne', ok: true }, { t: 'À la fin, une fois les lignes nettoyées', msg: 'Après les retraits, M0001 porterait le numéro 1 au lieu de 7 : l’adresse Excel serait perdue.' }]);
    await x.ok('Avant tout retrait : chaque intervention gardera son numéro de ligne dans le fichier reçu.');
  },
  exs: [
    /* 1 — Construire une branche de préparation */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P, brut = () => K2.q(x, BRUT);
      const S = () => P().queries.find(q => q.m2 && q !== brut() && K2.isRef(q, brut().id));
      x.app('pbi'); pbi.render();
      await x.say('victoria', 'Je veux pouvoir comparer la préparation avec ce que nous avons reçu. Conserve une version brute clairement identifiable.');
      await x.pixel('Crée une référence de la requête brute, puis règle-la comme une préparation d’atelier.');
      let deps = false, depsOpen = false;
      await K2.work(x, {
        cur: BRUT, editor: false,
        next: () => {
          const s = S();
          if (!pbi.q2El) return ['Ouvre l’éditeur Power Query : Accueil, Transformer les données.', ['[data-a="tab:Accueil"]', '[data-a="cmd:transform"]']];
          if (!s) return [`Volet Requêtes : touche ⋯ à côté de ${BRUT}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, brut()), '.menu [data-k="ref"]']];
          if (s.name !== NAME) return [`Renomme la nouvelle requête ${NAME} : touche son nom en haut, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']];
          if (s.load !== false) return ['Désactive son chargement : touche son nom, puis Activer le chargement.', ['.q2-qname', '.menu [data-k="load"]']];
          if (!deps && depsOpen) return ['Observe le schéma : la nouvelle requête part de la requête brute, qui lit le classeur. Ferme-le ensuite.', ['[data-d="close"]']];
          if (!deps) return ['Vérifie le lien entre les deux requêtes : Affichage › Dépendances de requête.', ['[data-q="tab:Affichage"]', '[data-q="cmd:deps"]']];
          return true;
        },
        wrongQuery: 'Modification de la requête brute', loadErr: 'Chargement de la nouvelle requête actif',
        tries: p => {
          const s = S(), b = brut();
          if (p.kind === 'newQuery') {
            if (s) return x.oops('', 'La référence existe déjà : poursuis avec elle.');
            if (p.how === 'ref') return p.src === b ? true : x.oops('', `Crée la référence à partir de ${BRUT}.`);
            if (p.how === 'dup') return x.oops('Utilisation de Dupliquer');
            if (p.how === 'excel' || p.how === 'csv') return x.oops('Nouvelle importation Excel');
            return x.oops('', 'Crée une référence de la requête brute.');
          }
          if (p.kind === 'renameQuery') {
            if (!p.target.m2) return x.oops('Requête historique renommée');
            if (p.target === b) return x.oops('Modification de la requête brute');
            return p.name === NAME ? true : x.oops('Nom imprécis comme Requête1');
          }
          if (p.kind === 'load') { if (p.target !== s) return x.oops('', 'Ne change pas le chargement de cette requête.'); return p.on ? x.oops('Chargement de la nouvelle requête actif') : true; }
          if (p.kind === 'delQuery') return x.oops(p.target === b ? 'Suppression de la préparation brute' : '', 'Garde cette requête.');
          if (p.kind === 'group' || p.kind === 'newGroup') return true;
        },
        on: { 'q2.deps': () => { depsOpen = true; }, 'q2.depsClose': () => { if (depsOpen) deps = true; } }
      });
      await K2.ask(x, `Que contient la première étape de ${NAME} ?`, [{ t: `Source = ${BRUT}`, ok: true }, { t: 'Source = Excel.Workbook(File.Contents(…))', err: 'Dépendance non vérifiée' }]);
      await x.ok('Une seule lecture du fichier : la structure se construit sur la requête brute, qui reste intacte. Les deux sont en italique, donc non chargées.');
    }, avance: EX1 },

    /* 2 — Conserver l'adresse de chaque ligne */
    { async run(x) {
      const pbi = x.pbi, Q = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('oscar', 'Si je dois retrouver une saisie dans le fichier Excel, il me faudra son emplacement d’origine.');
      await x.pixel('Une colonne d’index numérote les lignes. Ajoutée maintenant, elle reprend exactement les numéros d’Excel.');
      await K2.work(x, {
        cur: NAME, edit: [NAME], wrongQuery: 'Index ajouté au brut', ops: ['index', 'rename'],
        next: () => {
          const q = Q(), T = K2.T(x, NAME);
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (stepIdx(q, s => s.op === 'index') < 0) return ['Ajouter une colonne › Colonne d’index › À partir de 1.', ['[data-q="tab:Ajouter une colonne"]', '[data-q="cmd:index"]', '.menu [data-k="1"]']];
          if (!K2.cols(T).includes('Ligne_Source')) return K2.colTodo(K2.cols(T).find(c => /^Index/.test(c)) || 'Index', 'Ligne_Source');
          return true;
        },
        tries: p => {
          if (p.kind !== 'add') return;
          if (p.op === 'index') { const s = p.step; if (s.start === 0) return x.oops('Index commençant à zéro'); if (s.incr !== 1) return x.oops('Incrément différent de 1'); if (s.start !== 1) return x.oops('', 'Démarre l’index à 1 : la première ligne Excel porte le numéro 1.'); return true; }
          if (p.op === 'rename') { const pr = (p.step.pairs || []).slice(-1)[0] || []; if (pr[1] === 'ID_Intervention') return x.oops('Colonne nommée ID_Intervention'); return pr[1] === 'Ligne_Source' ? true : x.oops('Index pris pour une clé métier', 'Nomme cette colonne Ligne_Source : c’est une position dans le fichier.'); }
          if (p.op === 'sort') return x.oops('Index recalculé après tri');
          if (p.op === 'type') return x.oops('Type texte');
          if (['skip', 'filter', 'removeBottom', 'promote'].includes(p.op)) return x.oops('Index ajouté après suppression');
        }
      });
      const T = K2.T(x, NAME), last = T.rows[T.rows.length - 1].Ligne_Source;
      await K2.num(x, 'Quelle valeur porte la dernière ligne dans Ligne_Source ?', [{ id: 'n', label: 'Ligne_Source' }], v => v.n === last ? true : ['', 'Fais défiler jusqu’en bas de l’aperçu, ou lis le Max du profil de Ligne_Source.']);
      await x.ok(`De 1 à ${K2.n(last)}, sans répétition : chaque ligne garde son adresse dans le fichier reçu. ${K2.n(T.cols.length)} colonnes à ce stade.`);
    }, avance: EX2 },

    /* 3 — Retirer le contexte supérieur */
    { async run(x) {
      const pbi = x.pbi, Q = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('oscar', 'Les premières lignes sont utiles à lire, mais elles ne décrivent aucune intervention.');
      await K2.work(x, {
        cur: NAME, edit: [NAME], ops: ['skip'], offOp: '', offOpMsg: 'Retire seulement les lignes du haut : Supprimer les lignes › Supprimer les premières lignes.',
        next: () => {
          const q = Q(), i = stepIdx(q, s => s.op === 'skip');
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (i < 0) return ['Accueil › Supprimer les lignes › Supprimer les premières lignes. Combien de lignes avant les vrais en-têtes ?', ['[data-q="tab:Accueil"]', '[data-q="cmd:rmrows"]', '.menu [data-k="top"]']];
          if (q.steps[i].name !== 'Contexte_Retire') return K2.stepTodo(q, i, 'Contexte_Retire');
          return true;
        },
        tries: p => {
          const q = Q();
          if (p.kind === 'add') {
            if (p.op === 'skip') { const n = p.step.n; return n === 5 ? true : x.oops(n === 4 ? 'Retrait de quatre lignes' : n === 6 ? 'Retrait de six lignes' : n > 6 ? 'Perte de M0001' : '', 'Quatre lignes de contexte et une ligne vide : cinq lignes à retirer.'); }
            if (p.op === 'removeBottom') return x.oops('Retrait des dernières lignes');
            if (p.op === 'promote') return x.oops('Promotion des en-têtes avant retrait');
            if (p.op === 'filter' || p.op === 'removeBlank') return x.oops('Filtre sur les cellules non nulles seulement');
          }
          if (p.kind === 'renameStep') return K2.renameRule(x, p, [{ step: q.steps[stepIdx(q, s => s.op === 'skip')], name: 'Contexte_Retire' }]);
        }
      });
      await K2.num(x, 'Combien de lignes contient maintenant la préparation ?', [{ id: 'n', label: 'Lignes' }], v => v.n === 1104 ? true : ['Absence de contrôle du volume']);
      await x.ok('1 109 moins 5 : 1 104 lignes. La première contient les vrais en-têtes, et sa Ligne_Source vaut 6. M0001 suit juste en dessous.');
    }, avance: EX3 },

    /* 4 — Donner leur nom aux colonnes */
    { async run(x) {
      const pbi = x.pbi, Q = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.pixel('Ces cellules décrivent les champs. Elles doivent devenir les noms des colonnes.');
      await K2.work(x, {
        cur: NAME, edit: [NAME], ops: ['promote', 'rename'],
        next: () => {
          const q = Q(), T = K2.T(x, NAME), pi = stepIdx(q, s => s.op === 'promote'), ti = stepIdx(q, s => s.op === 'type');
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (pi < 0) return ['Accueil › Utiliser la première ligne pour les en-têtes.', ['[data-q="tab:Accueil"]', '[data-q="cmd:promote"]', '.menu [data-k="promote"]']];
          if (ti >= 0) return ['Power Query a ajouté une étape Type modifié. Les valeurs hétérogènes seront diagnostiquées plus tard : supprime cette étape.', ['[data-q="steps"]', `[data-q="stx:${ti}"]`, '[data-d="del"]']];
          if (K2.cols(T).includes('6')) return K2.colTodo('6', 'Ligne_Source');
          if (q.steps[pi].name !== 'Entetes_Promus') return K2.stepTodo(q, pi, 'Entetes_Promus');
          return true;
        },
        tries: p => {
          const q = Q();
          if (p.kind === 'add') {
            if (p.op === 'promote') return stepIdx(q, s => s.op === 'promote') >= 0 ? x.oops('Promotion exécutée deux fois') : true;
            if (p.op === 'rename') { const pr = (p.step.pairs || []).slice(-1)[0] || []; return pr[0] === '6' && pr[1] === 'Ligne_Source' ? true : x.oops(pr[0] === '6' ? 'Colonne technique laissée sous le nom 6' : 'Nom source modifié arbitrairement'); }
            if (p.op === 'removeCols' || p.op === 'selectCols') return x.oops('Colonne Commentaire supprimée', 'Garde toutes les colonnes : elles contiennent des informations métier.');
            if (p.op === 'type') return x.oops('Type modifié automatique conservé');
            if (p.op === 'enter') return x.oops('En-têtes saisis manuellement sans promotion');
          }
          if (p.kind === 'del' || p.kind === 'delEnd') { const ops = p.steps.map(s => s.op); return ops.every(o => o === 'type') ? true : x.oops('', 'Supprime seulement l’étape Type modifié.'); }
          if (p.kind === 'renameStep') return K2.renameRule(x, p, [{ step: q.steps[stepIdx(q, s => s.op === 'promote')], name: 'Entetes_Promus' }]);
        }
      });
      const T = K2.T(x, NAME);
      const ok = COLS.every((c, i) => T.cols[i] && T.cols[i].n === c);
      await K2.num(x, 'Quelle valeur de Ligne_Source porte M0001 ?', [{ id: 'n', label: 'Ligne_Source' }], v => v.n === 7 ? true : v.n === 1 ? ['M0001 absent', 'Ligne_Source garde l’adresse Excel : regarde la première ligne de données.'] : ['', 'Regarde la première ligne de l’aperçu, colonne Ligne_Source.']);
      await x.ok(`${ok ? 'Treize noms conformes, de ID_Intervention à Ligne_Source. ' : ''}${K2.n(T.rows.length)} lignes : la ligne d’en-têtes a quitté les données, et aucune conversion globale n’a été appliquée.`);
    }, avance: EX4 },

    /* 5 — Séparer les commentaires structurels */
    { async run(x) {
      const pbi = x.pbi, Q = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('oscar', 'COMMENTAIRE ATELIER explique l’interruption réseau. Ce n’est pas une intervention. Mais les commentaires des vraies interventions doivent rester.');
      await K2.work(x, {
        cur: NAME, edit: [NAME], ops: ['filter'],
        next: () => {
          const q = Q(), i = stepIdx(q, s => s.op === 'filter' && s.cond.values && s.cond.values.includes('COMMENTAIRE ATELIER'));
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (i < 0) return ['Ouvre le filtre de ID_Intervention et décoche seulement COMMENTAIRE ATELIER.', ['[data-q="flt:ID_Intervention"]', '[data-d="ok"]']];
          if (q.steps[i].name !== 'Commentaire_Structure_Retire') return K2.stepTodo(q, i, 'Commentaire_Structure_Retire');
          return true;
        },
        tries: p => {
          const q = Q();
          if (p.kind === 'add') {
            if (p.op === 'removeCols' || p.op === 'selectCols') return x.oops('Suppression de la colonne Commentaire');
            if (p.op === 'filter') {
              const c = p.step.cond;
              if (c.col === 'Commentaire') return x.oops('Suppression de tous les commentaires non vides');
              if (c.col !== 'ID_Intervention' || c.kind !== 'values' || !c.exclude) return x.oops('Filtre trop large sur le mot atelier');
              if (c.values.includes('M0750')) return x.oops('Suppression de M0750');
              if (c.values.length !== 1 || c.values[0] !== 'COMMENTAIRE ATELIER') return x.oops(c.values.includes('COMMENTAIRE ATELIER') ? 'Filtre trop large sur le mot atelier' : 'Marqueur conservé comme intervention', 'Exclus seulement COMMENTAIRE ATELIER.');
              return true;
            }
            if (p.op === 'replace') return x.oops('Remplacement du marqueur par un ID inventé');
            if (p.op === 'skip' || p.op === 'removeBottom') return x.oops('Suppression de la ligne 507 après renumérotation');
          }
          if (p.kind === 'renameStep') return K2.renameRule(x, p, [{ step: q.steps[stepIdx(q, s => s.op === 'filter')], name: 'Commentaire_Structure_Retire' }]);
        }
      });
      await K2.num(x, 'Combien de lignes reste-t-il ?', [{ id: 'n', label: 'Lignes' }], v => v.n === 1102 ? true : ['Volume non vérifié']);
      await x.ok('Une seule ligne a disparu : 1 102. La colonne Commentaire est intacte, et M0750 garde son commentaire sur le contrôle du freinage.');
    }, avance: EX5 },

    /* 6 — Écarter les totaux du détail */
    { async run(x) {
      const pbi = x.pbi, Q = () => K2.q(x, NAME);
      K2.open(x, NAME);
      await x.say('gabriel', 'Si nous additionnons ces valeurs avec les interventions, le total serait compté dans le détail. Et rien ne prouve que ce total provisoire soit juste.');
      await x.pixel('Les deux lignes de pied sont tout en bas, au-delà des 1 000 premières lignes. Pense à Charger plus.');
      await K2.work(x, {
        cur: NAME, edit: [NAME], ops: ['filter'],
        next: () => {
          const q = Q(), i = stepIdx(q, s => s.op === 'filter' && s.cond.values && s.cond.values.includes('FIN EXPORT'));
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (i < 0) return ['Filtre de ID_Intervention : touche Charger plus, cherche TOTAL puis FIN dans la zone Rechercher, et décoche les deux marqueurs.', ['[data-q="flt:ID_Intervention"]', '[data-more]', '.q2-search', '[data-d="ok"]']];
          if (q.steps[i].name !== 'Pied_Export_Retire') return K2.stepTodo(q, i, 'Pied_Export_Retire');
          return true;
        },
        tries: p => {
          const q = Q();
          if (p.kind === 'add') {
            if (p.op === 'filter') {
              const c = p.step.cond;
              if (c.col === 'Cout_HT' || c.col === 'Cout_TTC') return x.oops(c.kind === 'nonempty' ? 'Suppression de toute ligne à montant null' : 'Suppression des valeurs négatives');
              if (c.col !== 'ID_Intervention' || c.kind !== 'values' || !c.exclude) return x.oops('Retrait d’un nombre arbitraire de lignes', 'Exclus les deux marqueurs par leur valeur.');
              if (c.values.includes('M1100')) return x.oops('Suppression de M1100');
              const t = c.values.includes('TOTAL PROVISOIRE'), f = c.values.includes('FIN EXPORT');
              if (!t) return x.oops('Total provisoire conservé');
              if (!f) return x.oops('FIN EXPORT conservé');
              if (c.values.length !== 2) return x.oops('', 'Exclus seulement TOTAL PROVISOIRE et FIN EXPORT.');
              return true;
            }
            if (p.op === 'removeBottom' || p.op === 'keepTop') return x.oops('Retrait d’un nombre arbitraire de lignes');
            if (p.op === 'index') return x.oops('Index recréé de 1 à 1100');
          }
          if (p.kind === 'renameStep') return K2.renameRule(x, p, [{ step: q.steps.filter(s => s.op === 'filter').slice(-1)[0], name: 'Pied_Export_Retire' }]);
        }
      });
      await K2.num(x, 'M1100 est la dernière intervention. Quelle est sa Ligne_Source ?', [{ id: 'n', label: 'Ligne_Source' }], v => v.n === 1107 ? true : ['Suppression de M1100', 'Fais défiler jusqu’à la dernière ligne de l’aperçu.']);
      await K2.ask(x, 'Le total provisoire indiquait 420 000 € TTC. Que faire de ce montant ?', [{ t: 'Rien : recopié et non certifié, ce n’est pas une référence', ok: true }, { t: 'Ajuster les montants pour l’atteindre', err: 'Somme ajustée pour atteindre 420000' }]);
      await x.ok('1 100 candidats. M1100 garde sa Ligne_Source 1 107, et aucun total de maintenance n’est déclaré fiable.');
    }, avance: EX6 },

    /* 7 — Prouver que la structure conserve les anomalies */
    { async run(x) {
      const pbi = x.pbi;
      K2.open(x, NAME);
      await x.say('oscar', 'Le fichier paraît plus propre. Comment savoir que nous n’avons pas aussi fait disparaître les problèmes à traiter ?');
      await x.pixel('Mesurons ce que la structure a conservé. Profil sur l’ensemble des données, colonne ID_Intervention.');
      const s = () => pbi.q2;
      await K2.work(x, {
        cur: NAME,
        next: () => {
          if (!K2.shown(x, NAME)) return K2.showTodo(x, NAME);
          if (!s().dist) return ['Onglet Affichage : active Distribution de colonne.', ['[data-q="tab:Affichage"]', '[data-q="cmd:dist"]']];
          if (s().scope !== 'all') return ['Passe le profilage sur l’ensemble des données.', ['[data-q="scope"]', '.menu [data-k="all"]']];
          if (!(s().prof && s().sel.length === 1 && s().sel[0] === 'ID_Intervention')) return ['Sélectionne ID_Intervention et affiche son Profil de colonne.', ['[data-q="hd:ID_Intervention"]', '[data-q="tab:Affichage"]', '[data-q="cmd:prof"]']];
          return true;
        },
        on: { 'q2.scope': p => { if (p.scope === 'top') return x.oops('Profil limité à 1000 lignes'); } },
        tries: p => p.kind === 'add' ? x.oops(p.op === 'distinct' ? '1098 lignes obtenues' : p.op === 'fmt' ? 'Espaces automatiquement supprimés' : p.op === 'replace' ? 'Null remplacés par zéro' : p.op === 'filter' ? 'Montants négatifs supprimés' : '', 'Cette mission ne corrige aucune valeur : on vérifie ce qui est conservé.') : undefined
      });
      await K2.num(x, 'Que montre le profil de ID_Intervention ?', [{ id: 'l', label: 'Lignes' }, { id: 'd', label: 'Valeurs distinctes' }, { id: 'u', label: 'Valeurs uniques' }], v => {
        if (v.l === 1100 && v.d === 1098 && v.u === 1096) return true;
        if (v.l === 1098) return ['1098 lignes obtenues'];
        if (v.u === 1098) return ['1098 valeurs annoncées uniques'];
        return ['', 'Lis Nombre, Distinct et Unique dans les statistiques du profil.'];
      });
      await x.pixel('1 100 lignes, mais 1 098 identifiants : M0899 et M0949 apparaissent toujours deux fois. Vérifions deux valeurs douteuses dans l’aperçu.');
      await K2.ask(x, 'Quelle est la Date_Demande de M0040, 40e ligne de l’aperçu ?', [{ t: '31/02/2026, toujours là', ok: true }, { t: '28/02/2026', err: 'Dates impossibles remplacées' }, { t: 'null', err: 'Dates impossibles remplacées' }]);
      await K2.ask(x, 'Et le technicien de M0012, 12e ligne ?', [{ t: 'null, comme dans le fichier reçu', ok: true }, { t: '0', err: 'Null remplacés par zéro' }, { t: 'A. Martin', msg: 'Rien n’a été complété : regarde la colonne Technicien de M0012.' }]);
      await K2.ask(x, 'La colonne Date_Demande ne contient aucune erreur. Ses dates sont donc toutes valides ?', [{ t: 'Non : un texte lisible peut être une date impossible', ok: true }, { t: 'Oui, la qualité affiche 100 % valide', err: 'Qualité technique présentée comme validation métier' }]);
      await x.ok('La structure est propre, et toutes les anomalies de contenu sont encore là : dates impossibles, montants textuels, null, répétitions. Elles seront traitées une par une.');
    } },

    /* 8 — Verrouiller la préparation */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K2.open(x, NAME);
      await x.say('victoria', 'Nous avons une structure exploitable. Je veux maintenant la preuve que le rapport du conseil n’a pas changé.');
      await x.pixel('Les deux préparations restent non chargées. Fermer et appliquer, contrôle du modèle, puis copie de travail M202.');
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M202', cur: NAME,
        work: { loadErr: 'Table maintenance visible dans le modèle', overErr: 'Checkpoint 110 écrasé', nameErr: '', fileErr: 'Objets du rapport modifiés',
          tries: p => p.kind === 'refreshFlag' ? x.oops('Seule l’actualisation a été désactivée') : undefined },
        pre: () => {
          const extra = P().queries.filter(q => q.m2 && ![BRUT, NAME].includes(q.name));
          if (extra.length) return [`Supprime la requête temporaire ${extra[0].name} : ses preuves sont notées.`, ['[data-q="qd"]', `[data-q="qmenu:${extra[0].id}"]`, '.menu [data-k="del"]']];
          return true;
        }
      });
      const c = K2.check110(P());
      x.app('ctl202', K.lesson('Contrôle de persistance', 'Le checkpoint 110 est intact', `${K2.card110(P())}${K2.facts([[3, 'tables métier'], ['20', 'ventes · 40 billets'], ['1 310 €', 'chiffre d’affaires TTC'], [27, 'entrées historiques'], [50, 'passages']])}<p class="lc-note">${esc(fr(`${BRUT} et ${NAME} existent dans Power Query, sans table dans le modèle.`))}</p>`));
      await K2.ask(x, 'Le total des ventes est toujours de 1 310 €. Cela suffit-il à prouver que rien n’a changé ?', [{ t: 'Non : il faut aussi vérifier tables, pages, objets, relations et mesures', ok: true }, { t: 'Oui, un total identique prouve tout', err: 'Réussite déclarée sans contrôle' }]);
      await x.ok(c.ok ? 'Trois tables, trois pages, vingt-six objets, aucune relation, aucune mesure DAX. La structure est enregistrée dans la copie M202.' : 'Copie M202 enregistrée.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'tri', n: 'La caméra descend lentement dans la préparation. Les noms des colonnes sont lisibles, chaque intervention garde son adresse dans le fichier.' },
    { n: 'Mais une date impossible reste visible. Plus bas, un montant affiche encore « à confirmer ».' },
    { p: 'oscar', t: 'Nous savons désormais où commence chaque information. Les problèmes ne sont plus noyés dans la mise en page.' },
    { p: 'gabriel', t: 'Et nous n’avons toujours pas transformé un montant inconnu en zéro. C’est essentiel.' },
    { p: 'pixel', t: 'La structure est prête. Maintenant, il faut comprendre ce que les valeurs veulent dire.' },
    { card: { k: NAME, h: '1 100 candidats · 13 colonnes', chips: ['Contexte retiré', 'En-têtes promus', 'Note écartée', 'Pied écarté', 'Ligne_Source conservée'] } },
    { wait: 600 }
  ],
  recompense: { titre: 'Les en-têtes sont retrouvés !', sous: 'Une structure reproductible, sans toucher aux valeurs.', badge: 'b202', badgeNom: 'Architecte des colonnes', objet: 'etiqueteuse' },
  fiches: [
    ['Référence', 'Pourquoi référencer une requête plutôt que la dupliquer ?', 'Une référence prolonge le résultat d’une autre requête : une seule lecture du fichier et une dépendance visible. Une copie relit la source de façon indépendante.'],
    ['Traçabilité', 'Quand ajouter une colonne d’index de traçabilité ?', 'Avant toute opération qui retire ou déplace des lignes. Elle garde l’adresse d’origine de chaque enregistrement.'],
    ['Supprimer les premières lignes', 'Quand utiliser Supprimer les premières lignes ?', 'Pour un export dont la partie supérieure est connue : ici 4 lignes de contexte et 1 ligne vide. Si cette structure change, le contrôle des en-têtes doit le révéler.'],
    ['Promouvoir les en-têtes', 'Que vérifier après Utiliser la première ligne pour les en-têtes ?', 'Les noms obtenus, l’index devenu « 6 » à renommer, et l’étape Type modifié ajoutée automatiquement, à retirer si les valeurs restent à diagnostiquer.'],
    ['Note ou commentaire', 'Comment retirer une note structurelle sans perdre les commentaires ?', 'En excluant la valeur exacte du marqueur dans la colonne d’identifiant. La colonne Commentaire des interventions reste intacte.'],
    ['Lignes de total', 'Que faire d’une ligne de total dans un export ?', 'L’écarter du détail. Un total recopié n’est ni une intervention, ni une référence fiable de réconciliation.'],
    ['Ce que l’on conserve', 'Comment prouver qu’une transformation n’a rien effacé de trop ?', 'En comparant les volumes et les valeurs connues : 1 100 lignes, 1 098 identifiants distincts, dates impossibles, null et montants textuels toujours présents.'],
    ['Contrôle de persistance', 'Que vérifier après Fermer et appliquer ?', 'Le modèle, les pages, les objets, les relations, les mesures et les indicateurs historiques. Un total identique ne suffit pas.']
  ],
  suiteTitre: 'Dimanche, 11 h 20',
  suite: [
    { bg: 'atelier', n: 'Atelier technique. Une imprimante termine son travail. Oscar compare plusieurs bons d’intervention avec le registre.' },
    { p: 'oscar', t: 'Cette intervention existe : un numéro, une date, un coût. Mais je ne sais pas qui l’a réalisée.' },
    { p: 'pixel', t: 'Ce sont nos premiers fantômes : des enregistrements présents, dont certaines informations ont disparu.' }
  ],
  accroche: 'Retrouver les vrais en-têtes, numéroter chaque ligne et écarter notes et totaux, sans toucher aux valeurs.',
  fin(P) { EX6(P); EX8(P); }
};
window.PBQ.mission(def);
})();

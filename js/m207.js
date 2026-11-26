/* Mission 207 — Les tarifs désordonnés (clés de comparaison, nomenclatures, correspondances confirmées) */
(function () {
'use strict';
const { esc, fr, $ } = window.PBQ;
const PQE = window.PQE;
const DATES = 'prep_Maintenance_Dates', LIB = 'prep_Maintenance_Libelles', FN = 'fn_Normaliser', TEST = 'test_M207_Normalisation';
const ATTR = ['Dragon', 'Pirates', 'Wonder Wheel', 'Sky Tower'];

/* ───────── État canonique ───────── */
const SET = (n, v) => P => {
  let f = P.queries.find(q => q.id === 'q_fn207' || q.fn207);
  if (n > 1) { if (!f) { f = K2.C.fnNorm(v); P.queries.push(f); } else f.steps = K2.C.fnNorm(v).steps; }
  let q = P.queries.find(x => x.id === 'q_lib');
  if (!q) { q = K2.C.lib(); P.queries.push(q); }
  q.steps = K2.C.libSteps().slice(0, n);
};
const DECISION = { ref: 'NOM-M207-01', regle: 'Correctif → Corrective', champ: 'Type_Maintenance', perimetre: 'Export de maintenance de cet atelier', fictive: true };
const EX1 = SET(1, 1), EX3 = SET(2, 1), EX4 = SET(3, 1), EX6 = SET(5, 2);
function EX5(P) { SET(4, 2)(P); P.decisions207 = [DECISION]; }
const tmps = P => P.queries.filter(q => q.tmp207);
function EX8(P) { P.queries = P.queries.filter(q => !q.tmp207); P.name = 'Wonderland_Pilotage_M207'; P.saved = true; P.dirty = false; }
const fnQ = P => P.queries.find(q => q.id === 'q_fn207' || q.fn207);

const def = {
  id: 207,
  objectifs: ['Construire une clé de comparaison sans écraser la source', 'Retrouver les libellés officiels à partir d’une nomenclature', 'Ajouter une correspondance seulement après confirmation', 'Tester les cas qui doivent réussir et ceux qui doivent être refusés'],
  intro: [
    { bg: 'exploitation', n: 'Lundi 8 juin, 8 h 40. Les premières équipes rejoignent les attractions. Dans le bureau Data, Oscar examine une liste de valeurs.' },
    { card: { k: 'Attraction', h: 'Dragon', p: '« dragon », entouré d’espaces' } },
    { p: 'oscar', t: 'Pourquoi notre attraction apparaît-elle sous deux écritures ? Nous n’avons qu’un seul Dragon.' },
    { p: 'pixel', t: 'L’écriture diffère par les espaces et la casse. Une analyse pourrait les présenter comme deux catégories distinctes.' },
    { clear: 1, card: { k: 'Type_Maintenance', h: 'Corrective · Correctif' } },
    { p: 'gabriel', t: 'Ici aussi, nous pouvons simplement remplacer le mot.' },
    { p: 'oscar', t: 'Probablement. Mais selon les anciens outils, certains libellés avaient un sens particulier. Je préfère vérifier la nomenclature.' },
    { p: 'pixel', t: 'C’est la différence entre corriger une présentation et décider que deux termes désignent la même catégorie métier.' },
    { clear: 1, card: { k: 'Ancien catalogue tarifaire', h: 'Étudiant · ETUDIANT · Etud.' } },
    { p: 'victoria', t: 'Ce problème existe aussi dans nos tarifs. Si nous normalisons mal les libellés, nous pouvons regrouper des catégories qui ne devraient pas l’être.' },
    { p: 'victoria', t: 'Aujourd’hui, appliquez une méthode contrôlée au registre de maintenance. Chaque remplacement doit pouvoir être expliqué.' },
    { btn: 'Remplacer une écriture ou changer un fait ?' }
  ],
  leconTitre: 'Remplacer une écriture ou changer un fait ?',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Trois gestes très différents', `
      <div class="flow-row" style="grid-template-columns:1fr"><div class="flow-box on"><b>Nettoyage de présentation</b><small>« dragon » entouré d’espaces → « dragon » : on retire les espaces périphériques</small></div><div class="flow-box on"><b>Normalisation vers une nomenclature</b><small>« dragon » → « Dragon » : le libellé officiel vient d’un référentiel</small></div><div class="flow-box"><b>Modification d’un état métier</b><small>« Planifiée » → « Terminée » : un changement de fait, qui exige une preuve</small></div></div>
      <div data-sec="2" style="display:none; margin-top:14px"></div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    await x.pixel('Une normalisation peut rendre une valeur plus cohérente. Elle ne doit pas décider qu’une intervention est terminée.');
    await x.say('oscar', 'Même si sa date est ancienne ?');
    await x.pixel('Oui. Une date passée ne prouve pas l’exécution : l’intervention a pu être reportée, ou le statut mis à jour en retard. À toi de classer quatre changements.');
    const B = K2.sorter({ bare: true, title: 'Quel geste ?', btn: 'Vérifier', options: [['net', 'Nettoyage'], ['nom', 'Nomenclature'], ['fait', 'Fait métier']],
      rows: [['a', '« Wonder Wheel  » → « Wonder Wheel »', 'Espace final retiré'], ['b', '« terminee » → « Terminée »', 'Écriture officielle du statut'], ['c', '« Planifiée » → « Terminée »', 'La date est passée'], ['d', '« dragon » → « Dragon »', 'Libellé du référentiel']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
    const sec = $('[data-sec="2"]', card); sec.appendChild(B.el); sec.style.display = '';
    requestAnimationFrame(() => sc.scrollTo({ top: Math.max(0, sec.offsetTop - 14), behavior: 'smooth' }));
    const SOL = { a: 'net', b: 'nom', c: 'fait', d: 'nom' };
    x.todo('Classe les quatre changements.');
    await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
      if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Classe les quatre changements.');
      const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
      if (!bad.length) { B.lock(); return true; }
      if (bad.includes('c')) return x.oops('', 'Passer de Planifiée à Terminée change un fait : il faut une preuve d’exécution.');
      if (bad.includes('b') || bad.includes('d')) return x.oops('', 'Choisir l’écriture officielle, c’est appliquer une nomenclature.');
      return x.oops('', 'Retirer un espace en bout de texte ne change que la présentation.');
    } });
    await K2.ask(x, 'Remplacer les caractères « Correctif » partout dans les textes, est-ce une bonne règle ?', [{ t: 'Non : on compare des valeurs entières, sur le champ ciblé', ok: true }, { t: 'Oui, c’est plus rapide', msg: 'Un remplacement partiel modifierait aussi des phrases ou des catégories plus longues.' }]);
    await x.ok('La bonne écriture vient d’un référentiel défini, pas d’une majuscule automatique : Dragon, Wonder Wheel, Préventive, Terminée.');
  },
  exs: [
    /* 1 — Préparer les colonnes de normalisation */
    { async run(x) {
      const pbi = x.pbi;
      x.app('pbi'); pbi.render();
      await x.say('victoria', 'Je veux pouvoir lire le résultat tout en retrouvant exactement ce qui a été reçu.');
      await x.pixel('Nous conservons les champs sources et ajoutons leurs versions normalisées. Nouvelle branche, à partir de la préparation de la mission 205.');
      await K2.branch(x, { src: DATES, name: LIB, deps: false, errs: {
        wrongSrc: q => /^atelier_M206/.test(q.name) ? 'Référence à l’atelier M206' : '', imp: 'Nouvelle importation du fichier brut', edit: 'Modification directe de la préparation Dates', srcEdit: 'Modification directe de la préparation Dates',
        name: '', load: 'Chargement activé', legacy: '', legacyName: '' } });
      await x.pixel('Regarde ce que contient Attraction sur tout le fichier.');
      await K2.prof(x, LIB, 'Attraction');
      await K2.num(x, 'Lis le profil et la barre d’état.', [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }, { id: 'd', label: 'Valeurs distinctes · Attraction' }], v => {
        if (v.l === 1100) return ['Volume de 1100 lignes'];
        if (v.l === 1107) return ['Ajout des huit lignes d’atelier'];
        if (v.c < 25) return ['Colonnes temporelles supprimées'];
        return v.l === 1099 && v.c === 25 && v.d === 6 ? true : ['', 'Nombre et Distinct se lisent dans le profil ; les colonnes, dans la barre d’état.'];
      });
      await K2.ask(x, 'Combien d’attractions réelles derrière ces six valeurs ?', [{ t: 'Quatre, plus une absence : « dragon » et Dragon désignent le même équipement', ok: true }, { t: 'Six', msg: 'Regarde la distribution : une écriture de Dragon entourée d’espaces, et une valeur null.' }]);
      await K2.ask(x, 'Où ranger les libellés harmonisés ?', [{ t: 'Dans de nouvelles colonnes, à côté des sources', ok: true }, { t: 'En renommant les colonnes sources', err: 'Colonnes sources renommées en colonnes normalisées' }]);
      await x.ok('1 099 lignes, 25 colonnes : la mission 205 est intacte. Attraction, Statut et Type_Maintenance restent tels quels ; les versions normalisées viendront à côté.');
    }, avance: EX1 },

    /* 2 — Construire les clés de comparaison */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K2.open(x, LIB);
      await x.say('oscar', 'Je vois Dragon. Pourquoi Power Query peut-il le traiter différemment ?');
      await x.pixel('Le contenu de M0150 est « dragon » entouré d’espaces. Préparons une clé technique pour comparer les écritures, dans une vue temporaire : nettoyer, retirer les espaces aux extrémités, passer en minuscules.');
      await x.formula(K2.F.cle, 'Formule · Cle_Attraction');
      await K2.tmp(x, { src: LIB, flag: 'tmp207', kind: 'cle', ops: ['custom'],
        next: t => K2.cols(K2.T(x, t.name)).includes('Cle_Attraction') ? true : ['Ajouter une colonne › Colonne personnalisée. Nom : Cle_Attraction, type : Texte, puis touche Coller dans la formule.', ['[data-q="tab:Ajouter une colonne"]', '[data-q="cmd:custom"]', '[data-x="n"]', '[data-x="t"]', '[data-x="paste"]', '[data-d="ok"]']],
        tries: (p, t) => {
          if (p.kind === 'custom' && p.syntax === false) return x.oops('', 'La formule contient une erreur de syntaxe : touche Coller pour reprendre la formule.');
          if (p.kind === 'add' && p.op === 'fmt') return x.oops('Source écrasée');
          if (p.kind === 'add' && p.op === 'custom') {
            const src = p.step.src || '';
            if (p.step.col !== 'Cle_Attraction') return x.oops('', 'Nomme la colonne exactement Cle_Attraction.');
            if (/\[(Commentaire|Technicien)\]/.test(src)) return x.oops(/Technicien/.test(src) ? 'Noms de techniciens normalisés en minuscules pour l’affichage' : 'Nettoyage appliqué aux commentaires sans demande');
            if (p.step.type !== 'text') return x.oops('', 'Choisis le type Texte.');
            const R = K2.simulate(x, t, p.step);
            if (R.error || !R.table) return x.oops('', 'Cette formule produit une erreur : touche Coller pour reprendre la formule.');
            const g = id => R.table.rows.find(r => r.ID_Intervention === id).Cle_Attraction;
            if (g('M0350') === 'null') return x.oops('Null transformé en chaîne de caractères');
            if (R.table.rows.some(r => r.Cle_Attraction === 'wonderwheel')) return x.oops('Tous les espaces supprimés');
            return g('M0150') === 'dragon' && g('M0350') === null ? true : x.oops('', 'Vérifie la formule collée : M0150 doit donner dragon.');
          }
        } });
      const T1 = () => tmps(P()).find(q => q.tmp207 === 'cle');
      await K2.prof(x, T1().name, 'Cle_Attraction');
      await K2.num(x, 'Combien de valeurs distinctes dans Cle_Attraction ?', [{ id: 'd', label: 'Distinct' }], v => v.d === 5 ? true : v.d === 6 ? ['', 'Regarde bien : « dragon » et Dragon partagent maintenant la même clé.'] : ['', 'Lis Distinct dans le profil : quatre clés, plus null.']);
      await K2.ask(x, 'Cette clé peut-elle servir de libellé affiché ?', [{ t: 'Non : elle sert à comparer, le référentiel fournit l’écriture officielle', ok: true }, { t: 'Oui, « dragon » suffit', err: 'Clé utilisée comme libellé final' }]);
      await K2.ask(x, '« terminee » et « terminée » auront-elles la même clé ?', [{ t: 'Non : la règle ne retire pas les accents, il faudra une correspondance explicite', ok: true }, { t: 'Oui, les accents disparaissent', err: 'Accents supposés automatiquement supprimés' }]);
      await x.ok('Une clé de comparaison : « dragon » et Dragon se rejoignent, Wonder Wheel garde son espace interne, et null reste null. Cette clé ne sera jamais affichée.');
    } },

    /* 3 — Retrouver les noms officiels des attractions */
    { async run(x) {
      const pbi = x.pbi;
      K2.open(x, LIB);
      await x.say('oscar', 'Nos quatre noms officiels sont Dragon, Pirates, Wonder Wheel et Sky Tower.');
      await x.pixel('Une fonction réunit la clé et les référentiels officiels, champ par champ. Si la clé est connue, elle renvoie le libellé officiel ; sinon, la valeur reçue ressort telle quelle, pour rester visible.');
      await x.formula(K2.F.norm1, `Fonction · ${FN}`, 'Copier la fonction');
      await K2.blank(x, { name: FN, src: K2.F.norm1, flag: 'fn207', kind: 1, cur: LIB });
      await x.ok(`${FN} est prête. Pour Correctif, rien n’est prévu : sans confirmation, aucune correspondance.`);
      await x.pixel('Appelle-la dans une colonne personnalisée, en lui indiquant le champ : "Attraction".');
      await K2.custom(x, { q: LIB, col: 'Attraction_Normalisee', type: 'text', src: `${FN}([Attraction], "Attraction")`,
        check: T => {
          const g = id => T.rows.find(r => r.ID_Intervention === id).Attraction_Normalisee;
          if (g('M0350') === 'Dragon') return ['M0350 remplacé par Dragon'];
          if (g('M0350') === 'Inconnue') return ['Null remplacé par Inconnue comme attraction officielle'];
          if (T.rows.some(r => r.Attraction_Normalisee === 'Wonder wheel')) return ['Wonder Wheel transformé en Wonder wheel'];
          return g('M0150') === 'Dragon' && g('M0350') === null && T.rows.every(r => r.Attraction_Normalisee === null || ATTR.includes(r.Attraction_Normalisee)) ? true : ['', 'Vérifie la formule collée.'];
        },
        tries: p => {
          if (p.kind !== 'add') return;
          if (p.op === 'replace') return x.oops('Remplacement de sous-chaînes dans toutes les colonnes');
          if (p.op === 'filter' || p.op === 'rmrows') return x.oops('Ligne manquante retirée');
          if (p.op === 'removeCols' || p.op === 'selectCols') return x.oops('Colonne brute supprimée');
          if (p.op === 'fillDown' || p.op === 'fill') return x.oops('M0350 remplacé par Dragon');
        } });
      await K2.ask(x, 'Que devient M0150 ?', [{ t: 'Dragon dans Attraction_Normalisee ; « dragon » reste dans Attraction', ok: true }, { t: 'Dragon dans les deux colonnes', err: 'Colonne brute supprimée', msg: '' }]);
      await K2.ask(x, 'Et M0350, sans attraction ?', [{ t: 'Il reste null : aucune preuve ne permet de l’identifier', ok: true }, { t: 'Dragon, l’attraction la plus fréquente', err: 'M0350 remplacé par Dragon' }]);
      await K2.ask(x, 'Une valeur inconnue, « Dragon Jr », apparaît demain. Que fait la fonction ?', [{ t: 'Elle la laisse telle quelle, pour qu’elle soit signalée', ok: true }, { t: 'Elle la rapproche de Dragon', err: 'Valeur inconnue automatiquement rapprochée' }]);
      await x.ok('Une seule attraction change d’écriture, M0150. M0350 reste une information manquante, et les 1 099 lignes sont là.');
    }, avance: EX3 },

    /* 4 — Corriger une écriture sans changer le statut */
    { async run(x) {
      K2.open(x, LIB);
      await x.say('gabriel', 'Nous avons « terminee » sans accent pour M0180. Et Planifiée sur M0500, une intervention datée de mai. Ne faudrait-il pas aussi la passer à Terminée ?');
      await x.say('oscar', 'Pas sans vérifier son exécution.');
      await x.pixel(`${FN} connaît déjà les statuts officiels et leurs variantes sans accent. Champ : "Statut".`);
      await K2.custom(x, { q: LIB, col: 'Statut_Normalise', type: 'text', src: `${FN}([Statut], "Statut")`,
        check: T => {
          const g = id => T.rows.find(r => r.ID_Intervention === id).Statut_Normalise;
          if (g('M0500') === 'Terminée') return ['Planifiée remplacé par Terminée'];
          if (g('M0180') === 'Terminee') return ['Accent laissé incohérent dans le résultat'];
          return g('M0180') === 'Terminée' && g('M0500') === 'Planifiée' ? true : ['', 'Vérifie la formule collée.'];
        },
        tries: p => {
          if (p.kind !== 'add') return;
          const src = p.step.src || '';
          if (p.op === 'custom' && /Cout_TTC/.test(src)) return x.oops('Statut déduit de Cout_TTC');
          if (p.op === 'custom' && /Technicien/.test(src)) return x.oops('Statut déduit du nom du technicien');
          if (p.op === 'custom' && /Date_/.test(src)) return x.oops('Toutes les lignes passées mises à Terminée');
          if (p.op === 'replace') return x.oops('Source remplacée');
        } });
      await K2.ask(x, 'Quel statut normalisé pour M0500 ?', [{ t: 'Planifiée : une date passée ne prouve pas l’exécution', ok: true }, { t: 'Terminée, puisque mai est passé', err: 'Toutes les lignes passées mises à Terminée' }]);
      await K2.ask(x, 'M0500 est-il résolu ?', [{ t: 'Non : son libellé est conforme, son état réel reste à vérifier', ok: true }, { t: 'Oui, son statut est officiel', err: 'M0500 déclaré résolu' }]);
      await x.ok('Une seule différence de statut : M0180 devient Terminée. M0500 reste Planifiée, et son enquête métier reste ouverte.');
    }, avance: EX4 },

    /* 5 — Faire confirmer une correspondance métier */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K2.open(x, LIB);
      await x.pixel('Le type de maintenance, maintenant. Sans confirmation, la fonction ne connaît pas Correctif : ajoute la colonne et regarde M0700.');
      await K2.custom(x, { q: LIB, col: 'Type_Maintenance_Normalise', type: 'text', src: `${FN}([Type_Maintenance], "Type")`,
        check: T => {
          const v = T.rows.find(r => r.ID_Intervention === 'M0700').Type_Maintenance_Normalise;
          if (T.rows.some(r => r.Type_Maintenance === 'Inspection' && r.Type_Maintenance_Normalise === 'Préventive')) return ['Inspection assimilé à Préventive'];
          return v === 'Correctif' || v === 'Corrective' ? true : ['', 'Vérifie la formule collée.'];
        },
        tries: p => {
          if (p.kind !== 'add') return;
          if (p.op === 'replace') return x.oops(/Commentaire/.test(JSON.stringify(p.step)) ? 'Correctif remplacé dans les commentaires' : 'Remplacement décidé avant confirmation');
          if (p.op === 'custom' && /Text\.StartsWith/.test(p.step.src || '')) return x.oops('Toute valeur commençant par Correct rapprochée');
        } });
      await x.pixel('M0700 garde Correctif : sans règle, aucune correspondance n’est inventée.');
      await x.say('oscar', 'J’ai retrouvé la convention utilisée dans l’ancien registre.');
      await x.mail({ de: 'oscar', lbl: 'Pièce pédagogique du scénario', heure: '09:52', objet: 'NOM-M207-01 · Nomenclature des types', corps: ['Dans cet export d’entraînement, le libellé « Correctif » désigne la même catégorie de maintenance que « Corrective ».', 'Le libellé standard retenu est « Corrective ».'], btn: 'Appliquer la règle' });
      await K2.ask(x, 'Cette pièce est-elle une validation obtenue auprès d’un service réel ?', [{ t: 'Non : elle appartient au scénario de formation', ok: true }, { t: 'Oui', err: 'Pièce fictive présentée comme validation réelle' }]);
      await x.pixel(`Ajoute la correspondance dans ${FN}, avec sa référence en commentaire. La colonne se recalculera d’elle-même.`);
      await x.formula(K2.F.norm2, `Fonction · ${FN} mise à jour`, 'Copier la fonction');
      const norm = s => String(s || '').replace(/\s+/g, '');
      await K2.work(x, {
        cur: LIB, edit: [],
        next: () => {
          const f = fnQ(P()), T = K2.T(x, LIB), r = T && T.rows.find(z => z.ID_Intervention === 'M0700');
          if (r && r.Type_Maintenance_Normalise === 'Corrective') return true;
          if (pbi.dlgKind === 'q2adv') return ['Touche Coller, puis Terminé.', ['[data-x="paste"]', '[data-d="ok"]']];
          if (!K2.shown(x, f.name)) return K2.showTodo(x, f.name);
          return [`Ouvre l’éditeur avancé de ${FN} : Accueil › Éditeur avancé.`, ['[data-q="tab:Accueil"]', '[data-q="cmd:adv"]']];
        },
        tries: p => {
          const f = fnQ(P());
          if (p.kind === 'code') {
            if (p.target !== f) return x.oops('Type source écrasé', `La règle se met à jour dans ${FN}.`);
            if (p.syntax === false) return x.oops('', 'Le code contient une erreur : touche Coller pour reprendre la fonction fournie.');
            if (!/NOM-M207-01/.test(p.src)) return x.oops('Référence de décision oubliée');
            return norm(p.src) === norm(K2.F.norm2) ? true : x.oops('', 'Touche Coller : la fonction mise à jour doit être reprise telle quelle.');
          }
          if (p.kind === 'add' && p.op === 'replace') return x.oops('Type source écrasé');
        }
      });
      K2.open(x, LIB);
      P().decisions207 = [DECISION];
      await K2.ask(x, 'Que vaut maintenant Type_Maintenance_Normalise pour M0700 ?', [{ t: 'Corrective, selon NOM-M207-01', ok: true }, { t: 'Toujours Correctif', msg: 'La colonne appelle la fonction : elle a pris en compte la nouvelle correspondance.' }]);
      await K2.ask(x, 'Cette correspondance vaut-elle pour tous les logiciels de Wonderland ?', [{ t: 'Non : seulement pour cette source et cette nomenclature', ok: true }, { t: 'Oui, partout', err: 'Règle généralisée à tous les systèmes' }]);
      x.app('dec207', K.lesson('Dossier de décision', 'NOM-M207-01', `${K2.facts([['Correctif', 'devient Corrective'], [1, 'ligne concernée, M0700']])}<p class="lc-note">${esc(fr('Champ : Type_Maintenance. Périmètre : cet export de maintenance. Pièce pédagogique du scénario, référencée dans le code de la fonction.'))}</p>`));
      await x.ok('Une seule différence de type : M0700 passe à Corrective, avec sa justification. Inspection reste Inspection, et Type_Maintenance garde Correctif.');
      x.app('pbi');
    }, avance: EX5 },

    /* 6 — Contrôler les remplacements */
    { async run(x) {
      K2.open(x, LIB);
      await x.say('victoria', 'Je veux connaître les lignes réellement modifiées par vos règles.');
      await x.pixel('Une colonne de contrôle compare chaque source à son résultat. Ordre de priorité : valeur non reconnue, puis information absente, puis normalisation appliquée.');
      await K2.custom(x, { q: LIB, col: 'Controle_Normalisation', type: 'text', src: K2.F.ctlNorm,
        check: T => {
          const n = v => T.rows.filter(r => r.Controle_Normalisation === v).length;
          if (T.rows.find(r => r.ID_Intervention === 'M0350').Controle_Normalisation === 'Valeur non reconnue') return ['M0350 classé valeur non reconnue'];
          return n('Normalisation appliquée') === 3 && n('Information absente') === 1 && n('Valeur non reconnue') === 0 ? true : ['', 'Vérifie la formule collée.'];
        },
        tries: p => p.kind === 'add' && p.op === 'custom' && /M0\d{3}/.test(p.step.src || '') ? x.oops('Contrôle écrit selon les ID') : undefined });
      await K2.prof(x, LIB, 'Controle_Normalisation');
      await K2.num(x, 'Lis le profil de Controle_Normalisation.', [{ id: 'a', label: 'Normalisation appliquée' }, { id: 'b', label: 'Information absente' }, { id: 'c', label: 'Valeur non reconnue' }], v => {
        if (v.a === 1099) return ['Toutes les lignes déclarées modifiées'];
        if (v.c === 1 && v.b === 0) return ['M0350 classé valeur non reconnue'];
        return v.a === 3 && v.b === 1 && v.c === 0 ? true : ['', 'Un état absent du profil compte zéro ligne.'];
      });
      await K2.ask(x, 'Trois lignes normalisées : est-ce toujours trois remplacements ?', [{ t: 'Pas forcément : une même ligne pourrait cumuler plusieurs normalisations', ok: true }, { t: 'Oui, toujours', err: 'Nombre de remplacements confondu avec nombre de lignes' }]);
      await K2.ask(x, 'M0500 est classé Conforme sans changement. Son intervention est-elle validée ?', [{ t: 'Non : son écriture est conforme, son exécution reste à vérifier', ok: true }, { t: 'Oui', err: 'M0500 classé intervention validée' }]);
      await K2.ask(x, 'Peut-on annoncer zéro anomalie dans le registre ?', [{ t: 'Non : dates, coûts et clé M0949 restent des contrôles distincts', ok: true }, { t: 'Oui, plus aucune valeur non reconnue', err: 'Zéro anomalie globale annoncé' }]);
      await x.ok('Trois normalisations appliquées (M0150, M0180, M0700), une information absente (M0350), aucune valeur non reconnue.');
    }, avance: EX6 },

    /* 7 — Tester les limites de la règle */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K2.open(x, LIB);
      await x.say('gabriel', '« Dragon Junior » contient Dragon. Notre règle doit-elle la transformer en Dragon ?');
      await x.pixel('Non. Ce pourrait être une autre attraction ou un ancien nom. Vérifions-le avec une petite requête de test : des cas qui doivent réussir, d’autres qui doivent être refusés.');
      await x.formula(K2.F.test207, 'Code · cas de test', 'Copier le code');
      await K2.blank(x, { name: TEST, src: K2.F.test207, flag: 'tmp207', kind: 'test', cur: LIB, loadErr: 'Requête de test chargée',
        tries: p => p.kind === 'append' || p.kind === 'merge' ? x.oops('Tests ajoutés au registre principal') : undefined });
      await x.pixel(`Applique maintenant la vraie fonction à chaque cas : ${FN}([Valeur], [Champ]).`);
      await K2.custom(x, { q: TEST, col: 'Resultat', type: 'text', src: `${FN}([Valeur], [Champ])`,
        check: T => T.rows.map(r => r.Resultat).join('|') === 'Dragon|Dragon Junior||Terminée|Non terminée|Corrective|Correctif urgent' ? true : ['', 'Vérifie la formule collée.'],
        tries: p => p.kind === 'add' && p.op === 'custom' && /"(Dragon|Terminée|Corrective)"/.test(p.step.src || '') ? x.oops('Résultats attendus saisis comme résultats calculés') : undefined });
      const CASES = [['a', 'Attraction · « DRAGON »'], ['b', 'Attraction · « Dragon Junior »'], ['c', 'Statut · « TERMINEE »'], ['d', 'Statut · « Non terminée »'], ['e', 'Type · « Correctif »'], ['f', 'Type · « Correctif urgent »']];
      await x.multi('Coche les cas refusés : ceux qui ressortent tels quels.', CASES.map(c => ({ t: c[1], v: c[0] })), sel => {
        if (!sel.includes('b')) return ['Dragon Junior remplacé par Dragon'];
        if (!sel.includes('d')) return ['Non terminée remplacé par Terminée'];
        if (!sel.includes('f')) return ['Correctif urgent accepté sans règle'];
        return sel.length === 3 ? true : ['', 'DRAGON, TERMINEE et Correctif font partie des variantes autorisées.'];
      });
      await K2.ask(x, 'Et le cas sans valeur ?', [{ t: 'Il reste null : l’absence reste détectable', ok: true }, { t: 'Il devient une catégorie Inconnue', err: 'Null transformé en catégorie' }]);
      x.app('res207', K.lesson('Résultats des tests', 'Quatre réussites, trois refus', `${K2.facts([[4, 'variantes reconnues ou absence préservée'], [3, 'valeurs refusées, laissées telles quelles']])}<p class="lc-note">${esc(fr('Aucun remplacement partiel : Dragon Junior, Non terminée et Correctif urgent restent signalés.'))}</p>`));
      await x.pixel('Les résultats sont relevés. Supprime maintenant la requête de test : elle a rempli son rôle.');
      x.app('pbi');
      await K2.work(x, {
        cur: LIB,
        next: () => {
          const t = tmps(P()).find(q => q.tmp207 === 'test');
          if (!t) return true;
          return [`Supprime la requête ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']];
        },
        tries: p => { if (p.kind === 'delQuery') return p.target.tmp207 === 'test' ? true : x.oops('', 'Supprime seulement la requête de test.'); }
      });
      await x.ok('La règle reconnaît les variantes autorisées, préserve les absences et refuse les nouvelles catégories. Aucun remplacement partiel.');
    }, avance: EX6 },

    /* 8 — Vérifier la persistance complète */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K2.open(x, LIB);
      await x.say('victoria', 'Nous avons harmonisé les écritures. Montrez-moi maintenant que les faits et les résultats historiques sont conservés.');
      await K2.num(x, `État de ${LIB}.`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 1099 && v.c === 29 ? true : v.l !== 1099 ? ['Volume différent de 1099'] : ['', '25 colonnes héritées et 4 ajoutées.']);
      await K2.prof(x, LIB, 'A_Investiguer_Dates');
      await K2.num(x, 'Les dossiers temporels de la mission 205 sont-ils toujours signalés ?', [{ id: 'n', label: 'TRUE · A_Investiguer_Dates' }], v => v.n === 6 ? true : ['Contrôles de dates perdus']);
      await K2.prof(x, LIB, 'Dossier_Incomplet');
      await K2.num(x, 'Et les dossiers incomplets de la mission 203 ?', [{ id: 'n', label: 'TRUE · Dossier_Incomplet' }], v => v.n === 7 ? true : ['', 'Lis la ligne TRUE de la distribution.']);
      await K2.ask(x, 'Statut de M0500 dans la préparation ?', [{ t: 'Toujours Planifiée, dans la source comme dans le résultat', ok: true }, { t: 'Terminée', err: 'M0500 passé à Terminée' }]);
      await K2.ask(x, 'Victoria : « Étudiant, ETUDIANT et Etud. : pouvons-nous appliquer la même démarche à nos tarifs ? »', [{ t: 'Pour préparer et comparer, oui ; pour regrouper, seulement avec une nomenclature confirmée : Etud. pourrait désigner une autre catégorie', ok: true }, { t: 'Oui : tout en minuscules, et c’est réglé', msg: 'Une abréviation peut désigner une autre catégorie tarifaire. Et deux billets au même prix ne sont pas forcément la même catégorie.' }]);
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M207', cur: LIB,
        work: { loadErr: 'Préparation chargée', overErr: 'Checkpoint écrasé', fileErr: 'Valeurs commerciales modifiées', delErr: 'Colonnes sources modifiées',
          delQuery: p => p.target.tmp207 ? true : false },
        pre: () => {
          const t = tmps(P())[0];
          if (t) { if (!pbi.q2El) return ['Rouvre l’éditeur Power Query pour ranger la vue temporaire.', ['[data-a="cmd:transform"]']]; return [`Supprime la vue temporaire ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']]; }
          return true;
        }
      });
      x.app('ctl207', K.lesson('Contrôle final', 'Des écritures harmonisées, des faits inchangés', `${K2.facts([['1 099', 'lignes, aucune ajoutée ni retirée'], [29, 'colonnes, dont 4 normalisées ou de contrôle'], [3, 'lignes normalisées'], [0, 'valeur source écrasée']])}${K2.card110(P())}`));
      await x.ok('Copie M207 enregistrée. Trois libellés harmonisés, M0350 et M0500 inchangés dans leur sens, et le rapport du conseil intact.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'exploitation', n: 'Lundi 8 juin, 10 h 20. Les libellés officiels apparaissent dans les nouvelles colonnes. Les valeurs reçues restent visibles juste à côté.' },
    { card: { k: LIB, h: '3 libellés harmonisés', chips: ['M0150 · Dragon', 'M0180 · Terminée', 'M0700 · Corrective (NOM-M207-01)'] } },
    { p: 'gabriel', t: 'Et deux billets au même prix ne sont pas forcément la même catégorie.' },
    { p: 'pixel', t: 'Exactement. L’égalité du montant ne remplace pas la définition métier.' },
    { wait: 600 }
  ],
  recompense: { titre: 'Nomenclatures en ordre !', sous: 'Trois écritures harmonisées, aucun fait modifié.', badge: 'b207', badgeNom: 'Gardien des nomenclatures', objet: 'repertoire' },
  fiches: [
    ['Deux versions', 'Comment rendre une normalisation traçable ?', 'Conserver la valeur reçue et ajouter l’interprétation standardisée dans un champ distinct.'],
    ['Clé de comparaison', 'À quoi sert une clé de comparaison ?', 'À rapprocher des représentations techniques. Elle reste distincte du libellé officiel destiné à l’utilisateur.'],
    ['Nomenclature', 'D’où vient la bonne écriture d’une attraction ?', 'D’une nomenclature : elle fournit les écritures autorisées. Une valeur absente ou inconnue reste distinguée d’une valeur reconnue.'],
    ['Écriture ou fait', 'Normaliser un statut, est-ce le changer ?', 'Non. Normaliser corrige son écriture ; changer le statut modifie un fait métier et exige une preuve.'],
    ['Correspondance métier', 'Que faut-il pour décider que Correctif = Corrective ?', 'Une définition commune, confirmée, et une justification qui précise le périmètre où elle s’applique.'],
    ['Audit de normalisation', 'Que montre un contrôle de normalisation ?', 'Les valeurs reconnues, les changements réalisés et les exceptions. Il ne remplace pas les autres contrôles qualité.'],
    ['Tester une règle', 'Quels exemples pour tester une règle de correspondance ?', 'Des cas qui doivent réussir et d’autres qui doivent être refusés : les refus protègent le sens métier.'],
    ['Persistance', 'Qu’est-ce qu’une normalisation réussie ?', 'Elle modifie les représentations prévues, en conservant les faits, les sources et les contrôles déjà acquis.']
  ],
  suiteTitre: 'Lundi, 10 h 30',
  suite: [
    { bg: 'classeurs', n: 'Oscar entre avec une boîte d’archives. Il dépose douze dossiers sur le bureau : janvier, février, mars, avril…' },
    { p: 'oscar', t: 'Chaque mois possède son propre export. Jusqu’ici, quelqu’un les ouvrait un par un et copiait les lignes dans un fichier annuel.' },
    { p: 'gabriel', t: 'Et si un mois est oublié ou ajouté deux fois ?' },
    { p: 'pixel', t: 'Nous allons apprendre à ajouter des requêtes. Mais avant de les empiler, il faudra contrôler leurs colonnes, leurs périodes et leur provenance.' },
    { p: 'victoria', t: 'Je veux une préparation annuelle qui puisse être contrôlée. Chaque ligne devra conserver le mois et le fichier dont elle provient.' }
  ],
  accroche: '« dragon », « terminee », « Correctif » : harmoniser les écritures avec une nomenclature, sans jamais changer un fait.',
  fin(P) { EX6(P); P.decisions207 = [DECISION]; EX8(P); }
};
window.PBQ.mission(def);
})();

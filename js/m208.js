/* Mission 208 — Les douze fichiers mensuels (inventaire, schémas, provenance, ajout de requêtes, réconciliation) */
(function () {
'use strict';
const { esc, fr, $ } = window.PBQ;
const PQE = window.PQE;
const MM = i => String(i).padStart(2, '0');
const MONTHS = Array.from({ length: 12 }, (_, k) => 'm208_' + MM(k + 1));
const ANN = 'atelier_M208_Annuel', LIB = 'prep_Maintenance_Libelles', GRP = 'Archives 2025';
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const REF = [[1060, 1272], [1140, 1368], [1220, 1464], [1300, 1560], [1380, 1656], [1460, 1752], [1540, 1848], [1620, 1944], [1700, 2040], [1780, 2136], [1860, 2232], [1940, 2328]];
const STEPK = ['add', 'edit', 'del', 'delEnd', 'moveStep', 'renameStep', 'code', 'type', 'renameCol'];

/* ───────── État canonique ───────── */
const grp = P => { P.qgroups = P.qgroups || []; if (!P.qgroups.includes(GRP)) P.qgroups.push(GRP); };
/* Import de Gabriel : onze mois justes, et un m208_11 qui pointe vers le fichier d’octobre */
function START(P) {
  if (P.queries.some(q => /^m208_/.test(q.name))) return;
  grp(P);
  for (let i = 1; i <= 12; i++) P.queries.push(i === 11 ? K2.C.m208(11, 0, 'Maintenance_2025_10.csv') : K2.C.m208(i, 0));
}
const SETM = stage => P => {
  grp(P);
  P.queries = P.queries.filter(q => !(/^q_m208_/.test(q.id) || /^m208_/.test(q.name)));
  for (let i = 1; i <= 12; i++) P.queries.push(K2.C.m208(i, stage));
};
const EX1 = SETM(0), EX3 = SETM(1), EX4 = SETM(2);
function EX5(P) { EX4(P); if (!P.queries.some(q => q.id === 'q_a208' || q.a208)) P.queries.push(K2.C.a208(false)); }
function EX6(P) { EX4(P); P.queries = P.queries.filter(q => q.id !== 'q_a208' && !q.a208); P.queries.push(K2.C.a208(true)); }
const tmps = P => P.queries.filter(q => q.tmp208);
function EX8(P) { P.queries = P.queries.filter(q => !q.tmp208); P.name = 'Wonderland_Pilotage_M208'; P.saved = true; P.dirty = false; }
const annQ = P => P.queries.find(q => q.a208 || q.id === 'q_a208');
const srcFile = q => q && q.steps[0] && q.steps[0].op === 'csv' ? q.steps[0].file : null;
const euros = v => K2.n(Math.round(v));

const def = {
  id: 208,
  objectifs: ['Prouver la couverture des douze mois, pas seulement leur nombre', 'Harmoniser les schémas avant l’ajout', 'Conserver la provenance de chaque ligne', 'Réconcilier volumes, identifiants et montants par mois'],
  intro: [
    { bg: 'classeurs', n: 'Lundi 8 juin, 10 h 30. Bureau Data. Oscar dépose douze dossiers sur la table.' },
    { p: 'oscar', t: 'Voici les exports de maintenance de l’année 2025. Un fichier par mois.' },
    { p: 'gabriel', t: 'J’ai retrouvé l’ancienne synthèse annuelle. Elle ne contient que onze mois.' },
    { p: 'oscar', t: 'Novembre a peut-être été oublié. Ou enregistré ailleurs.' },
    { clear: 1, card: { k: 'Deux risques', h: 'Un fichier absent · Un fichier ajouté deux fois' } },
    { p: 'pixel', t: 'Une consolidation peut produire un tableau apparemment correct tout en oubliant un mois ou en répétant ses données. Nous allons contrôler les fichiers et leurs contributions.' },
    { clear: 1, card: { k: 'Septembre', h: 'CoutHT', p: 'Dans les autres fichiers : Cout_HT' } },
    { p: 'gabriel', t: 'En septembre, la colonne s’appelle CoutHT. Et en octobre, les colonnes ne sont pas dans le même ordre.' },
    { p: 'pixel', t: 'L’ajout de requêtes aligne les colonnes par leur nom. L’ordre peut varier, mais un nom différent crée un champ différent.' },
    { clear: 1, p: 'victoria', t: 'Je veux une préparation annuelle dont nous pouvons expliquer chaque ligne et chaque total.' },
    { p: 'oscar', t: 'Et nous conservons ces archives séparément du registre de mai 2026 ?' },
    { p: 'victoria', t: 'Oui. Ce sont deux périmètres différents.' },
    { btn: 'Ajouter n’est pas fusionner' }
  ],
  leconTitre: 'Ajouter n’est pas fusionner',
  async lecon(x) {
    const card = K.lesson('Leçon', 'Empiler ou rapprocher', `
      <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>Ajouter des requêtes</b><small>Janvier puis février forment une table plus longue : 8 lignes + 8 lignes = 16 lignes</small></div><div class="flow-box"><b>Fusionner des requêtes</b><small>Deux tables rapprochées par une clé, pour ramener des informations complémentaires</small></div></div>
      <div data-sec="2" style="display:none; margin-top:14px"></div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    await x.pixel('Aujourd’hui, nous empilons les événements mensuels. Nous ne cherchons pas de correspondance entre deux tables.');
    await x.say('gabriel', 'Les colonnes doivent donc décrire les mêmes informations.');
    await x.pixel('Oui. Et les noms doivent être harmonisés avant l’ajout. À toi : que produit chaque situation ?');
    const B = K2.sorter({ bare: true, title: 'Après l’ajout de janvier et février…', btn: 'Vérifier', options: [['ok', 'Aligné'], ['split', 'Deux colonnes'], ['null', 'Nulls ailleurs']],
      rows: [['a', 'Février a les mêmes colonnes, dans un autre ordre', 'Mêmes noms'], ['b', 'Février nomme son coût CoutHT', 'Janvier : Cout_HT'], ['c', 'Février a une colonne Note_Export en plus', 'Janvier n’en a pas']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
    const sec = $('[data-sec="2"]', card); sec.appendChild(B.el); sec.style.display = '';
    requestAnimationFrame(() => sc.scrollTo({ top: Math.max(0, sec.offsetTop - 14), behavior: 'smooth' }));
    const SOL = { a: 'ok', b: 'split', c: 'null' };
    x.todo('Choisis le résultat de chaque situation.');
    await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
      if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Choisis un résultat pour les trois situations.');
      const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
      if (!bad.length) { B.lock(); return true; }
      if (bad.includes('a')) return x.oops('', 'L’ajout aligne les colonnes par leur nom : l’ordre ne crée aucun décalage.');
      if (bad.includes('b')) return x.oops('', 'Deux noms différents donnent deux colonnes, à moitié vides chacune.');
      return x.oops('', 'Une colonne présente d’un seul côté est conservée, avec null pour les lignes de l’autre table.');
    } });
    await x.ok('Aligné par nom, séparé si les noms diffèrent, complété par null si une colonne manque. D’où l’harmonisation avant l’ajout.');
  },
  exs: [
    /* 1 — Recenser les douze sources */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      START(P());
      x.app('pbi'); pbi.render();
      await x.say('victoria', 'Avant de réunir les données, prouve que nous avons bien les douze mois.');
      await x.say('gabriel', 'J’ai importé les exports ce matin, un par mois. Les requêtes sont rangées dans le groupe Archives 2025.');
      await x.pixel('Douze requêtes ne prouvent pas douze mois. Regarde d’où vient chacune : Affichage › Dépendances de requête.');
      let seen = false;
      await K2.work(x, {
        cur: 'm208_01',
        next: () => seen ? true : pbi.dlgKind === 'q2deps' ? ['Repère les fichiers CSV et les requêtes qu’ils alimentent, puis ferme la vue.', ['[data-d="close"]']] : ['Affichage › Dépendances de requête.', ['[data-q="tab:Affichage"]', '[data-q="cmd:deps"]']],
        on: { 'q2.depsClose': () => { seen = true; } }
      });
      await K2.ask(x, 'Que montre le diagramme ?', [{ t: 'Maintenance_2025_10.csv alimente m208_10 et m208_11, et aucun fichier de novembre n’apparaît', ok: true }, { t: 'Douze requêtes, douze fichiers : tout est là', err: 'Douze fichiers avec un mois répété' }, { t: 'Il manque un fichier, mais on peut avancer', err: 'Onze fichiers seulement' }]);
      await x.pixel('m208_11 lit le fichier d’octobre. Supprime-la, puis importe le vrai fichier de novembre. Les autres mois restent tels quels.');
      const FILE = 'Maintenance_2025_11.csv', W = K2.dirWatch(x);
      const wrong = () => P().queries.find(q => q.name === 'm208_11' && srcFile(q) === 'Maintenance_2025_10.csv');
      const nov = () => P().queries.find(q => srcFile(q) === FILE);
      await K2.work(x, {
        cur: 'm208_11', edit: [], editNew: true,
        next: () => {
          if (wrong()) return ['Volet Requêtes : ⋯ à côté de m208_11, puis Supprimer.', ['[data-q="qd"]', K2.qmenu(x, wrong()), '.menu [data-k="del"]', '[data-d="del"]']];
          const n = nov();
          if (!n) {
            if (pbi.dlgKind === 'q2csv') return K2.csvTodo(x);
            if (pbi.dlgKind === 'q2open') return [`Ouvre Maintenance › Archives_2025, puis ${FILE}.`, W.nav('Maintenance/Archives_2025', FILE)];
            return ['Accueil › Nouvelle source › Texte/CSV.', ['[data-q="tab:Accueil"]', '[data-q="cmd:newsource"]', '.menu [data-k="csv"]']];
          }
          if (!K2.shown(x, n.name)) return K2.showTodo(x, n.name);
          if (n.name !== 'm208_11') return ['Renomme la requête m208_11 : touche son nom en haut, puis Renommer.', ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']];
          if (n.load !== false) return ['Désactive son chargement : touche son nom, puis Activer le chargement.', ['.q2-qname', '.menu [data-k="load"]']];
          return true;
        },
        tries: p => {
          if (p.kind === 'delQuery') return p.target === wrong() ? true : x.oops('', 'Garde cette requête : elle pointe vers le bon mois.');
          if (p.kind === 'newQuery') {
            if (p.how !== 'csv') return x.oops('', 'Passe par Nouvelle source › Texte/CSV.');
            const f = srcFile(p.query);
            if (f !== FILE) return x.oops(P().queries.some(q => srcFile(q) === f) ? 'Même fichier derrière deux requêtes' : '', `Importe ${FILE}.`);
            if (nov()) return x.oops('', 'Novembre est déjà importé.');
            p.query.group = GRP; return true;
          }
          if (p.kind === 'renameQuery') { if (p.target !== nov()) return x.oops('', 'Garde le nom de cette requête.'); return p.name === 'm208_11' ? (wrong() ? x.oops('', 'Supprime d’abord l’ancienne m208_11.') : true) : x.oops('', 'Écris exactement m208_11.'); }
          if (p.kind === 'load') { if (p.on) return x.oops('Chargement activé'); return p.target === nov() ? true : x.oops('', 'Règle seulement la nouvelle requête de novembre.'); }
          if (STEPK.includes(p.kind)) return x.oops('', 'Aucune transformation pour l’instant : on fait l’inventaire.');
        },
        on: Object.assign({}, W.on, {
          'q2.file': p => { if (p.fileKind === 'zip') return x.oops('Archive ZIP importée comme CSV'); if (p.file !== FILE) return x.oops(P().queries.some(q => srcFile(q) === p.file) ? 'Même fichier derrière deux requêtes' : '', `Ouvre ${FILE}.`); },
          'q2.csvOk': p => {
            if (p.enc !== 65001) return x.oops('Accents corrompus');
            if (p.delim !== ';') return x.oops('Mauvais séparateur');
            if (p.detect !== 'none') return x.oops('', 'Choisis Ne pas détecter les types de données : la conversion se fera à la fin, avec la convention du fichier.');
          }
        })
      });
      await K2.num(x, 'Inventaire des archives.', [{ id: 'q', label: 'Requêtes mensuelles' }, { id: 'm', label: 'Mois différents' }, { id: 'l', label: 'Lignes dans m208_11' }], v => {
        if (v.l === 9) return ['En-tête compté comme intervention'];
        if (v.m === 11) return ['Onze fichiers seulement'];
        return v.q === 12 && v.m === 12 && v.l === 8 ? true : ['', 'Douze requêtes, chacune sur son propre fichier : compte-les dans le volet Requêtes, puis lis la barre d’état de m208_11.'];
      });
      await x.ok('Douze requêtes, douze mois différents, huit lignes chacune. Le nombre ne suffisait pas : c’est la provenance qui a révélé le mois répété.');
    }, avance: EX1 },

    /* 2 — Comparer les schémas */
    { async run(x) {
      const only = { 'q2.query': p => { if (p.target && !/^m208_/.test(p.target.name)) return x.oops('Données d’un autre exercice incluses'); } };
      const still = p => {
        if (p.kind === 'add' && p.op === 'rename') return x.oops('Tous les champs renommés selon leur position');
        if (p.kind === 'add' && p.op === 'reorder') return x.oops('Réorganisation manuelle des valeurs');
        if (p.kind === 'add' && (p.op === 'removeCols' || p.op === 'selectCols') && (p.q || {}).name === 'm208_11') return x.oops('Note_Export supprimée');
        if (STEPK.includes(p.kind)) return x.oops('', 'On compare sans rien modifier : les cellules restent telles quelles.');
      };
      const look = m => K2.work(x, { cur: m, next: () => K2.shown(x, m) ? true : K2.showTodo(x, m), tries: still, on: only });
      await x.say('gabriel', 'Les montants semblent présents en janvier comme en septembre. Pourtant, les noms diffèrent.');
      await x.pixel('Si nous ajoutons les tables ainsi, Cout_HT et CoutHT deviendront deux colonnes. Janvier sert de contrat : compare-lui chaque mois particulier.');
      await look('m208_01');
      await x.pixel('Les huit champs de janvier : ID_Intervention, Date_Intervention, Attraction, Type_Maintenance, Duree_Heures, Cout_HT, TVA_Taux, Cout_TTC. Fais défiler les en-têtes vers la droite pour voir ceux de chaque mois.');
      await look('m208_09');
      await K2.ask(x, 'Septembre, comparé à janvier ?', [{ t: 'Huit colonnes aussi, mais le coût hors taxe s’appelle CoutHT', ok: true }, { t: 'Huit colonnes aussi : il est compatible', err: 'Comparaison limitée au nombre de colonnes' }, { t: 'CoutHT et Cout_HT, c’est déjà la même colonne', err: 'CoutHT considéré déjà identique à Cout_HT' }]);
      await look('m208_10');
      await K2.ask(x, 'Et octobre ?', [{ t: 'Les huit mêmes noms, dans un autre ordre', ok: true }, { t: 'Rien de particulier', err: 'Différence de schéma ignorée' }, { t: 'Ses colonnes sont mélangées : il est inexploitable', err: 'Octobre déclaré inexploitable' }]);
      await look('m208_11');
      await K2.ask(x, 'Et novembre ?', [{ t: 'Les huit champs, plus une colonne Note_Export', ok: true }, { t: 'Rien de particulier', err: 'Différence de schéma ignorée' }]);
      await K2.ask(x, 'Que faut-il faire pour octobre avant l’ajout ?', [{ t: 'Rien : l’ajout aligne les colonnes par leur nom', ok: true }, { t: 'Remettre ses valeurs dans l’ordre de janvier', err: 'Réorganisation manuelle des valeurs' }, { t: 'Renommer ses colonnes selon leur position', err: 'Tous les champs renommés selon leur position' }]);
      await x.ok('Septembre : un nom à harmoniser. Octobre : rien à faire, les noms suffisent. Novembre : une colonne optionnelle à préserver.');
    } },

    /* 3 — Harmoniser sans perdre la note */
    { async run(x) {
      await x.say('oscar', 'CoutHT contient bien le coût hors taxe dans l’export de septembre. C’est l’ancien nom du même champ.');
      await x.pixel('Cette équivalence est définie par le contrat du fichier : renomme la colonne dans m208_09.');
      await K2.work(x, {
        cur: 'm208_09', edit: ['m208_09'], ops: ['rename'],
        next: () => {
          if (!K2.shown(x, 'm208_09')) return K2.showTodo(x, 'm208_09');
          return K2.cols(K2.T(x, 'm208_09')).includes('CoutHT') ? K2.colTodo('CoutHT', 'Cout_HT') : true;
        },
        tries: p => {
          const q = p.target || p.q;
          if (q && q.name !== 'm208_09' && /^m208_/.test(q.name)) {
            if (q.name === 'm208_10') return x.oops('Valeurs d’octobre déplacées manuellement');
            if (q.name === 'm208_11') return x.oops(p.op === 'removeCols' || p.op === 'selectCols' ? 'Note de novembre remplacée par null' : '', 'Novembre garde ses neuf colonnes.');
            return x.oops('', 'Les autres mois portent déjà les bons noms.');
          }
          if (!q || q.name !== 'm208_09' || p.kind !== 'add') return;
          if (p.op === 'removeCols' || p.op === 'selectCols') return x.oops('CoutHT supprimé');
          if (p.op === 'filter' || p.op === 'skip' || p.op === 'removeBottom' || p.op === 'distinct') return x.oops('Nombre de lignes modifié');
          if (p.op === 'dup' || (p.op === 'custom' && p.step.col === 'Cout_HT')) return x.oops('Deux colonnes de coût conservées sans contrôle');
          if (p.op === 'custom') return x.oops('Champs obligatoires manquants remplacés silencieusement par null');
          if (p.op === 'rename') { const [from, to] = p.merge ? [p.col, p.name] : p.step.pairs[p.step.pairs.length - 1]; return from === 'CoutHT' && to === 'Cout_HT' ? true : x.oops('', 'Renomme seulement CoutHT, en Cout_HT : les sept autres champs portent déjà le nom du contrat.'); }
        }
      });
      await K2.ask(x, 'Que faire pour Note_Export dans les onze autres mois ?', [{ t: 'Rien : l’ajout la complétera par null', ok: true }, { t: 'Y recopier la note de novembre', err: 'Note de novembre propagée à tous les mois' }]);
      await x.ok('Septembre parle maintenant de Cout_HT, comme les autres mois. Aucun coût perdu, aucune ligne retirée, la note de novembre intacte.');
    }, avance: EX3 },

    /* 4 — Conserver la provenance */
    { async run(x) {
      const pbi = x.pbi;
      await x.say('victoria', 'Si je conteste un montant, comment retrouver son fichier d’origine ?');
      await x.pixel('On ajoute la provenance avant de réunir les tables : le nom exact du fichier, et le mois déclaré. Commençons par janvier.');
      const prov = (m, i) => ({
        tries: p => {
          if (p.kind !== 'add' || p.op !== 'custom' || (p.q || {}).name !== m) return;
          const src = p.step.src || '';
          if (/Date_Intervention|Date\./.test(src)) return x.oops('Mois_Source déduit uniquement de la date');
          if (/ID_Intervention/.test(src)) return x.oops('ID utilisé à la place du fichier');
          if (/2026/.test(src)) return x.oops('Mois 2026 utilisé');
          if (/^(""|null)$/.test(src.trim())) return x.oops('Provenance laissée vide');
          if (/Maintenance_2025_\d\d/.test(src) && !src.includes(`Maintenance_2025_${MM(i)}`)) return x.oops(i <= 2 ? 'Janvier et février inversés' : 'Même fichier indiqué pour toutes les lignes');
          if (/2025-\d\d/.test(src) && !src.includes(`2025-${MM(i)}`)) return x.oops(i <= 2 ? 'Janvier et février inversés' : '', `Le mois déclaré de ${m} est 2025-${MM(i)}.`);
          if (p.step.col === 'Fichier_Source' && !/\.csv/.test(src)) return x.oops('Chemin remplacé par une étiquette vague');
        }
      });
      for (const i of [1, 9]) {
        const m = 'm208_' + MM(i);
        if (i === 9) await x.pixel('Même chose pour septembre, le mois au nom harmonisé.');
        await K2.custom(x, Object.assign({ q: m, col: 'Fichier_Source', type: 'text', src: `"Maintenance_2025_${MM(i)}.csv"`, check: T => T.rows.every(r => r.Fichier_Source === `Maintenance_2025_${MM(i)}.csv`) ? true : ['', 'Vérifie la formule collée.'] }, prov(m, i)));
        await K2.custom(x, Object.assign({ q: m, col: 'Mois_Source', type: 'text', src: `"2025-${MM(i)}"`, check: T => T.rows.every(r => r.Mois_Source === `2025-${MM(i)}`) ? true : ['', 'Vérifie la formule collée.'] }, prov(m, i)));
      }
      await x.pixel('Même opération pour les dix autres mois : je reproduis tes deux étapes sur chacun, avec son propre fichier et son propre mois. À toi de contrôler le résultat.');
      for (let i = 1; i <= 12; i++) {
        if (i === 1 || i === 9) continue;
        const q = K2.q(x, 'm208_' + MM(i)); if (!q || K2.cols(K2.T(x, q.name)).includes('Fichier_Source')) continue;
        q.steps = q.steps.concat(K2.C.m208(i, 2).steps.slice(-2));
      }
      pbi.engine().touch(); if (pbi.q2) pbi.q2.dirty = true; if (pbi.q2El) pbi.q2render();
      await K2.work(x, { cur: 'm208_11', next: () => K2.shown(x, 'm208_11') ? true : K2.showTodo(x, 'm208_11') });
      await K2.ask(x, 'Que valent les deux colonnes de provenance de m208_11 ?', [{ t: 'Maintenance_2025_11.csv et 2025-11', ok: true }, { t: 'Maintenance_2025_01.csv et 2025-01', err: 'Même fichier indiqué pour toutes les lignes' }, { t: 'Rien encore : on les ajoutera après l’ajout', err: 'Provenance ajoutée seulement après l’ajout' }]);
      await x.ok('Chaque ligne porte désormais son fichier et son mois déclarés : douze couples différents, avant tout empilement.');
    }, avance: EX4 },

    /* 5 — Ajouter les douze requêtes */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('oscar', 'Les douze préparations sont prêtes. Nous pouvons maintenant les réunir ?');
      await x.pixel('Oui, dans une nouvelle requête annuelle : les préparations mensuelles restent intactes.');
      const ids = () => MONTHS.map(n => (K2.q(x, n) || {}).id);
      await K2.work(x, {
        cur: 'm208_01', edit: [], editNew: true,
        next: () => {
          const a = annQ(P());
          if (!a) {
            if (pbi.dlgKind === 'q2append') return pbi.dlg && pbi.dlg.querySelector('input[name="am"][value="many"]:checked') ? ['Ajoute les douze mois, de m208_01 à m208_12, puis OK.', ids().map(id => `[data-add="${id}"]`).concat(['[data-d="ok"]'])] : ['Choisis Trois tables ou plus.', ['input[name="am"][value="many"]']];
            return ['Accueil › Ajouter des requêtes › Ajouter des requêtes comme nouvelle.', ['[data-q="tab:Accueil"]', '[data-q="cmd:append"]', '.menu [data-k="new"]']];
          }
          if (!K2.shown(x, a.name)) return K2.showTodo(x, a.name);
          if (a.name !== ANN) return [`Renomme la requête ${ANN} : touche son nom en haut, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']];
          if (a.load !== false) return ['Désactive son chargement : touche son nom, puis Activer le chargement.', ['.q2-qname', '.menu [data-k="load"]']];
          return true;
        },
        tries: p => {
          if (p.kind === 'merge') return x.oops('Fusionner des requêtes utilisé');
          if (p.kind === 'append') {
            if (!p.asNew) return x.oops('', 'Choisis Ajouter des requêtes comme nouvelle : chaque mois reste une source distincte.');
            const want = ids(), list = p.list;
            const names = list.map(id => (P().queries.find(q => q.id === id) || {}).name || '');
            if (names.some(n => /^prep_Maintenance/.test(n))) return x.oops('Registre 2026 inclus');
            if (names.some(n => /^atelier_M206/.test(n))) return x.oops('Atelier M206 inclus');
            if (names.some(n => !/^m208_/.test(n))) return x.oops('', 'Ajoute seulement les douze mois de 2025.');
            if (new Set(list).size !== list.length) return x.oops('Mois ajouté deux fois');
            if (want.some(id => !list.includes(id))) return x.oops('Mois oublié');
            return true;
          }
          if (p.kind === 'newQuery') { if (annQ(P())) return x.oops('', 'La requête annuelle existe déjà.'); if (p.how !== 'append') return x.oops('', 'Passe par Ajouter des requêtes comme nouvelle.'); p.query.a208 = true; p.query.group = GRP; return true; }
          if (p.kind === 'renameQuery') { if (p.target !== annQ(P())) return x.oops('', 'Garde le nom de cette requête.'); return p.name === ANN ? true : x.oops('', `Écris exactement ${ANN}.`); }
          if (p.kind === 'load') { if (p.on) return x.oops('Résultat chargé'); return p.target === annQ(P()) ? true : x.oops('', 'Règle seulement la requête annuelle.'); }
          if (STEPK.includes(p.kind)) return x.oops('', 'Pas de transformation à cette étape : on empile.');
        }
      });
      await K2.num(x, `État de ${ANN}.`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 96 && v.c === 11 ? true : ['', 'Lis la barre d’état de la nouvelle requête.']);
      await K2.ask(x, '96 lignes : la consolidation est-elle validée ?', [{ t: 'Pas encore : un mois oublié et un mois répété pourraient se compenser', ok: true }, { t: 'Oui, 12 × 8 = 96', err: 'Total de 96 accepté sans contrôle des mois' }]);
      await x.ok('96 lignes, 11 colonnes : huit champs métier, la note de novembre et la provenance. Les douze sources restent intactes.');
    }, avance: EX5 },

    /* 6 — Définir les types selon le contrat */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('gabriel', 'Je vois 117.00. Notre poste affiche habituellement des virgules : ce fichier utilise-t-il une autre convention ?');
      await x.pixel('Oui : le point décimal. On le précise lors de la conversion, avec les paramètres régionaux Anglais (États-Unis). D’abord les six colonnes de texte.');
      const TEXT = ['ID_Intervention', 'Attraction', 'Type_Maintenance', 'Note_Export', 'Fichier_Source', 'Mois_Source'];
      const WANT = { Duree_Heures: 'dec', TVA_Taux: 'dec', Cout_HT: 'fixed', Cout_TTC: 'fixed', Date_Intervention: 'date' };
      TEXT.forEach(c => WANT[c] = 'text');
      const NOM = { text: 'Texte', dec: 'Nombre décimal', fixed: 'Nombre décimal fixe', date: 'Date' };
      const T = () => { const a = annQ(P()); return a ? K2.T(x, a.name) : null; };
      const ty = c => { const t = T(); const z = t && t.cols.find(k => k.n === c); return z ? z.t : null; };
      const hd = c => `[data-q="hd:${c}"]`, MULTI = ['[data-q="tab:Accueil"]', '[data-q="cmd:multi"]'];
      /* Sélection à obtenir : texte de consigne et cibles, selon l'état réel de la grille */
      const pick = (cols, multi, sel) => {
        if (cols.length === 1) {
          const c = cols[0];
          if (multi) return { say: `Désactive la sélection multiple (Accueil), puis touche ${c}`, t: MULTI.concat([hd(c)]) };
          return { say: `Touche l’en-tête de ${c}`, t: sel.length === 1 && sel[0] === c ? [] : [hd(c)] };
        }
        const extra = sel.filter(c => !cols.includes(c)), miss = cols.filter(c => !(multi && sel.includes(c)));
        const say = `${multi ? 'En sélection multiple' : 'Active la sélection multiple (Accueil)'}, touche ${cols.join(', ')}${extra.length ? `, et retire ${extra.join(', ')} de la sélection` : ''}`;
        return { say, t: (multi ? [] : MULTI).concat(extra.map(hd), miss.map(hd)) };
      };
      await K2.work(x, {
        cur: ANN, edit: [ANN], ops: [],
        next: () => {
          if (!K2.shown(x, ANN)) return K2.showTodo(x, ANN);
          const multi = pbi.q2.multi, sel = pbi.q2.sel || [];
          const txt = TEXT.filter(c => ty(c) !== 'text');
          if (txt.length) {
            const k = pick(txt, multi, sel);
            return [`${k.say}, puis Transformer › Type de données › Texte.`, k.t.concat(['[data-q="tab:Transformer"]', '[data-q="cmd:type"]', '.menu [data-k="text"]'])];
          }
          for (const [cols, kk] of [[['Duree_Heures', 'TVA_Taux'], 'dec'], [['Cout_HT', 'Cout_TTC'], 'fixed'], [['Date_Intervention'], 'date']]) {
            const left = cols.filter(c => ty(c) !== kk);
            if (!left.length) continue;
            const k = pick(left, multi, sel);
            return [`${k.say}, puis Transformer › Type de données › Utiliser les paramètres régionaux… : ${NOM[kk]}, Anglais (États-Unis).`, k.t.concat(['[data-q="tab:Transformer"]', '[data-q="cmd:type"]', '.menu [data-k="locale"]', '[data-x="t"]', `.menu [data-k="${kk}"]`, '[data-x="l"]', '.menu [data-k="en-US"]', '[data-d="ok"]'])];
          }
          return true;
        },
        tries: p => {
          if (p.kind === 'add' && (p.op === 'removeErrors' || p.op === 'replace')) return x.oops('Erreurs supprimées');
          if (p.kind !== 'type') return;
          for (const c of p.cols) {
            const w = WANT[c];
            if (c === 'ID_Intervention' && p.type !== 'text') return x.oops('ID convertis en nombres');
            if (c === 'Mois_Source' && p.type !== 'text') return x.oops('Mois_Source converti en date sans besoin');
            if (c === 'TVA_Taux' && p.type === 'int') return x.oops('TVA convertie en entier');
            if (c === 'TVA_Taux' && p.type === 'pct') return x.oops('0,20 interprété comme 0,20 %');
            if (['Cout_HT', 'Cout_TTC'].includes(c) && p.type === 'text') return x.oops('Montants laissés en texte');
            if (w !== p.type) return x.oops('', `${c} attend le type ${NOM[w]}.`);
            if (w !== 'text' && !p.loc) return x.oops('Conversion selon une culture implicite');
            if (w !== 'text' && p.loc !== 'en-US') return x.oops('', 'Le fichier utilise le point décimal et les dates ISO : paramètres régionaux Anglais (États-Unis).');
          }
          return true;
        },
        /* Après chaque conversion, on repart d'une sélection vide */
        done: p => { if (p.kind === 'type' && pbi.q2) { pbi.q2.sel = []; pbi.q2.multi = false; if (pbi.q2El) pbi.q2render(); } }
      });
      await K2.ask(x, 'TVA_Taux vaut 0,2. Que signifie ce taux ?', [{ t: '20 %', ok: true }, { t: '0,2 %', err: '0,20 interprété comme 0,20 %' }]);
      await x.ok('Aucune erreur de conversion : des montants lus avec le point décimal, des dates ISO, une TVA de 20 %, et la provenance gardée en texte.');
    }, avance: EX6 },

    /* 7 — Réconcilier chaque mois */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('victoria', 'Le total annuel est utile, mais je veux aussi voir la contribution de chaque mois.');
      await x.say('gabriel', 'Nous pourrons ainsi détecter une absence ou une répétition.');
      await x.pixel('Commençons par les identifiants.');
      await K2.prof(x, ANN, 'ID_Intervention');
      await K2.num(x, 'Profil de ID_Intervention.', [{ id: 'd', label: 'Distinct' }, { id: 'v', label: 'Vide' }], v => v.d === 96 && v.v === 0 ? true : ['', 'Lis Distinct et Vide dans le profil.']);
      await K2.prof(x, ANN, 'Note_Export');
      await K2.num(x, 'Combien de lignes portent une note Note_Export ?', [{ id: 'n', label: 'Notes renseignées' }], v => v.n === 8 ? true : v.n === 0 ? ['Note de novembre perdue'] : v.n === 88 ? ['', '88 lignes sont vides : compte celles qui portent une note.'] : ['', 'Lis le profil : nombre de lignes moins lignes vides.']);
      await x.pixel('Dans une vue temporaire, contrôlons chaque ligne : le TTC doit valoir HT × (1 + TVA) à un centime près, et la date doit tomber dans le mois déclaré.');
      await x.formula(K2.F.ctlLigne, 'Formule · Controle_Ligne');
      const V = () => tmps(P()).find(q => q.tmp208 === 'ctl');
      await K2.tmp(x, { src: ANN, flag: 'tmp208', kind: 'ctl', ops: ['custom'],
        next: t => t.steps.some(s => s.op === 'custom') ? true : K2.customTodo(x, 'Controle_Ligne', 'bool'),
        tries: (p, t) => {
          if (p.kind === 'custom' && p.syntax === false) return x.oops('', 'La formule contient une erreur de syntaxe : touche Effacer, puis Coller.');
          if (p.kind === 'add' && p.op === 'distinct') return x.oops('Doublons supprimés pour retrouver le volume');
          if (p.kind === 'add' && p.op === 'custom') {
            if (p.step.col !== 'Controle_Ligne') return x.oops('', 'Nomme la colonne exactement Controle_Ligne.');
            if (p.step.type !== 'bool') return x.oops('', 'Choisis le type Vrai/Faux.');
            if (/(1060|1272|18000|21600)/.test(p.step.src || '')) return x.oops('Valeurs attendues saisies manuellement');
            const R = K2.simulate(x, t, p.step);
            return R.table && R.table.rows.every(r => r.Controle_Ligne === true) ? true : x.oops('', 'Vérifie la formule collée.');
          }
        } });
      await K2.prof(x, V().name, 'Controle_Ligne');
      await K2.num(x, 'Combien de lignes passent le contrôle ?', [{ id: 'n', label: 'TRUE · Controle_Ligne' }], v => v.n === 96 ? true : ['', 'Lis la ligne TRUE de la distribution.']);
      await x.pixel('Regroupe maintenant cette vue par mois et par fichier : nombre de lignes, somme du HT, somme du TTC.');
      await K2.work(x, {
        cur: () => V().name, edit: [V().name], ops: ['group'],
        next: () => {
          if (!K2.shown(x, V().name)) return K2.showTodo(x, V().name);
          if (V().steps.some(s => s.op === 'group')) return true;
          return K2.groupTodo(x, { keys: ['Mois_Source', 'Fichier_Source'], aggs: [{ as: 'Lignes', op: 'count' }, { as: 'Cout_HT_Total', op: 'sum', col: 'Cout_HT' }, { as: 'Cout_TTC_Total', op: 'sum', col: 'Cout_TTC' }] });
        },
        tries: p => {
          if (p.kind === 'add' && p.op === 'distinct') return x.oops('Doublons supprimés pour retrouver le volume');
          if (p.kind !== 'add' || p.op !== 'group') return;
          const s = p.step, keys = s.keys.slice().sort().join();
          if (s.keys.includes('Date_Intervention')) return x.oops('Mois calculé depuis la date utilisé comme seule preuve de couverture');
          if (keys !== 'Fichier_Source,Mois_Source') return x.oops('', 'Regroupe par Mois_Source et Fichier_Source.');
          const ag = k => s.aggs.find(a => a.as === k);
          if (!ag('Lignes') || ag('Lignes').op !== 'count') return x.oops('', 'Ajoute Lignes : Nombre de lignes.');
          if (!ag('Cout_HT_Total') || ag('Cout_HT_Total').op !== 'sum' || ag('Cout_HT_Total').col !== 'Cout_HT') return x.oops('', 'Ajoute Cout_HT_Total : Somme de Cout_HT.');
          if (!ag('Cout_TTC_Total') || ag('Cout_TTC_Total').op !== 'sum' || ag('Cout_TTC_Total').col !== 'Cout_TTC') return x.oops('', 'Ajoute Cout_TTC_Total : Somme de Cout_TTC.');
          return true;
        }
      });
      await K2.num(x, 'Relève dans le regroupement la contribution de septembre.', [{ id: 'l', label: 'Lignes · 2025-09' }, { id: 'ht', label: 'Cout_HT_Total · 2025-09' }], v => v.l === 8 && v.ht === 1700 ? true : !v.ht ? ['Septembre sans coût accepté'] : ['', 'Lis la ligne 2025-09 du regroupement.']);
      /* Référentiel du jeu fourni, à côté des contributions calculées par le joueur */
      const G = K2.T(x, V().name), by = {};
      (G ? G.rows : []).forEach(r => { by[r.Mois_Source] = r; });
      const cell = (v, ref) => `<td style="text-align:right">${v === undefined || v === null ? '—' : esc(euros(v))}<small style="display:block;color:var(--gris)">réf. ${esc(K2.n(ref))}</small></td>`;
      const tot = k => Object.values(by).reduce((a, r) => a + (Number(r[k]) || 0), 0);
      x.app('ref208', K.lesson('Réconciliation', 'Tes contributions, face au référentiel du jeu 2025', `<table class="tbl" style="width:100%"><thead><tr><th><span class="thc">Mois</span></th><th style="text-align:right"><span class="thc">Lignes</span></th><th style="text-align:right"><span class="thc">HT (€)</span></th><th style="text-align:right"><span class="thc">TTC (€)</span></th></tr></thead><tbody>${REF.map((r, i) => { const g = by['2025-' + MM(i + 1)] || {}; return `<tr><td>${esc(MOIS[i])}</td>${cell(g.Lignes, 8)}${cell(g.Cout_HT_Total, r[0])}${cell(g.Cout_TTC_Total, r[1])}</tr>`; }).join('')}<tr><td><b>Année</b></td>${cell(tot('Lignes'), 96)}${cell(tot('Cout_HT_Total'), 18000)}${cell(tot('Cout_TTC_Total'), 21600)}</tr></tbody></table>`));
      await K2.ask(x, 'Les douze contributions concordent-elles avec le référentiel ?', [{ t: 'Oui : huit lignes et les mêmes montants pour chaque mois', ok: true }, { t: 'Le total annuel concorde, cela suffit', err: 'Total annuel seul vérifié' }]);
      await K2.ask(x, 'Un analyste obtient 96 lignes, mais a ajouté janvier deux fois et oublié février. Que montrerait ce regroupement ?', [{ t: 'Seize lignes pour janvier, aucune pour février, et des identifiants répétés', ok: true }, { t: 'Rien : 96 lignes, c’est le bon total', err: 'Total annuel seul vérifié' }]);
      x.app('pbi');
      await x.ok('Douze contributions conformes, 96 identifiants distincts, chaque TTC cohérent et chaque date dans son mois. Ces totaux contrôlent le jeu 2025, pas les coûts de mai 2026.');
    }, avance: EX6 },

    /* 8 — Sauvegarder sans mélanger les périmètres */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('oscar', 'Nous avons maintenant une préparation annuelle. Peut-on la laisser dans le projet pour les prochaines missions ?');
      await x.say('victoria', 'Oui, avec ses sources et ses contrôles. Mais le rapport historique reste inchangé.');
      await K2.work(x, { cur: LIB, next: () => K2.shown(x, LIB) ? true : K2.showTodo(x, LIB) });
      await K2.num(x, `État de ${LIB}, le registre de mai 2026.`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 1099 && v.c === 29 ? true : v.l === 1195 ? ['Registre principal remplacé par l’annuel'] : ['', 'Le registre n’a pas bougé depuis la mission 207 : lis sa barre d’état.']);
      await K2.ask(x, 'Victoria : « Qu’est-ce qui prouve que la consolidation est juste ? »', [{ t: 'Les contrôles recalculés : douze contributions de huit lignes, 96 identifiants, des totaux conformes', ok: true }, { t: 'Power Query n’affiche aucune erreur', err: 'Validation annoncée sans contrôle' }]);
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M208', cur: ANN,
        work: { loadErr: 'Consolidation chargée', overErr: 'Checkpoint écrasé', fileErr: 'Indicateurs historiques modifiés', delErr: 'Sources mensuelles supprimées sans réorganisation maîtrisée',
          delQuery: p => p.target.tmp208 ? true : false,
          tries: p => { if (p.kind === 'load' && p.on) return x.oops(/^m208_/.test(p.target.name) ? 'Requêtes mensuelles chargées' : 'Consolidation chargée'); } },
        pre: () => {
          const t = tmps(P())[0];
          if (t) { if (!pbi.q2El) return ['Rouvre l’éditeur Power Query pour ranger la vue temporaire.', ['[data-a="cmd:transform"]']]; return [`Les preuves sont relevées : supprime la vue temporaire ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']]; }
          return true;
        }
      });
      x.app('ctl208', K.lesson('Contrôle final', 'Une année reconstituée, à part du registre', `${K2.facts([[12, 'requêtes mensuelles, non chargées'], [96, 'lignes dans atelier_M208_Annuel, non chargée'], ['18 000 €', 'HT, soit 21 600 € TTC'], ['1 099', 'lignes au registre de mai, inchangé']])}${K2.card110(P())}`));
      await x.ok('Copie M208 enregistrée. Les archives 2025 vivent dans Power Query, avec leur provenance ; le registre de mai et le rapport du conseil sont intacts.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'classeurs', n: 'Lundi 8 juin, 12 h 05. Les douze contributions apparaissent dans la préparation annuelle. Chaque mois possède huit lignes. Les totaux concordent. La provenance reste visible.' },
    { card: { k: ANN, h: '96 lignes · 12 mois', chips: ['18 000 € HT', '21 600 € TTC', 'Provenance sur chaque ligne'] } },
    { p: 'gabriel', t: 'Un total correct peut masquer deux erreurs qui se compensent.' },
    { p: 'pixel', t: 'C’est pourquoi nous contrôlons les contributions, pas uniquement le résultat final.' },
    { wait: 600 }
  ],
  recompense: { titre: 'Année reconstituée !', sous: 'Douze mois, chacun une fois, chaque ligne avec sa provenance.', badge: 'b208', badgeNom: 'Assembleur des archives', objet: 'bibliotheque' },
  fiches: [
    ['Inventaire', 'Que vérifie un inventaire de consolidation ?', 'Les sources attendues, leur unicité et leur couverture temporelle : douze requêtes ne prouvent pas douze mois.'],
    ['Schéma', 'Sur quoi repose la compatibilité de deux tables à empiler ?', 'Sur les noms et la signification des champs. L’ordre visuel des colonnes est un contrôle distinct.'],
    ['Harmoniser', 'Faut-il traiter une colonne optionnelle comme une colonne obligatoire ?', 'Non : on renomme ce qui est validé, on préserve l’optionnel, et une colonne obligatoire manquante doit être signalée.'],
    ['Provenance', 'Pourquoi ajouter le fichier et le mois avant l’empilement ?', 'Pour relier chaque ligne à sa source et contrôler la contribution de chaque fichier.'],
    ['Ajouter', 'Que vérifier après un ajout de requêtes ?', 'Le résultat par source, même quand le total général paraît correct.'],
    ['Types et culture', 'Comment lire 117.00 sur un poste français ?', 'En précisant la convention du fichier lors de la conversion : paramètres régionaux Anglais (États-Unis), point décimal.'],
    ['Réconciliation', 'Que combine une réconciliation annuelle ?', 'Volumes, provenance, unicité des identifiants et contrôles numériques, mois par mois.'],
    ['Périmètres', 'Une consolidation peut-elle rester dans Power Query sans alimenter le modèle ?', 'Oui. La séparation des périmètres protège les analyses existantes.']
  ],
  suiteTitre: 'Lundi, 13 h 30',
  suite: [
    { bg: 'connexions', n: 'Oscar ouvre un autre dossier. Une table contient des codes d’équipements ; une seconde, leurs zones et leurs responsables.' },
    { p: 'oscar', t: 'Dans cet export, les interventions ne portent que le code de l’équipement. Les informations descriptives se trouvent dans un référentiel séparé.' },
    { p: 'gabriel', t: 'Si un code apparaît deux fois dans le référentiel, que deviendra une intervention après rapprochement ?' },
    { p: 'pixel', t: 'Nous allons devoir contrôler les clés avant de développer les résultats. Une fusion mal préparée peut multiplier les lignes.' }
  ],
  accroche: 'Douze exports, un mois répété, un nom de colonne qui change : empiler une année et prouver chaque contribution.',
  fin(P) { EX6(P); EX8(P); }
};
window.PBQ.mission(def);
})();

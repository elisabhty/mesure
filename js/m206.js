/* Mission 206 — Les colonnes mélangées (fractionner, extraire, fusionner sans perdre le sens) */
(function () {
'use strict';
const { esc, fr, $ } = window.PBQ;
const PQE = window.PQE;
const BRUT = 'atelier_M206_Brut', COLS = 'atelier_M206_Colonnes', FILE = 'Maintenance_Wonderland_Colonnes_M206.csv', MAIN = 'prep_Maintenance_Dates';
const CP = 'Equipement_Brut - Copier', PARTS = ['Attraction_Extraite', 'Zone_Extraite', 'Type_Extrait', 'Complement_Equipement'];
const SRC5 = ['ID_Ligne', 'Equipement_Brut', 'Technicien_Brut', 'Reference_Brute', 'Commentaire'];

/* Requêtes de l'atelier : créées par le joueur (drapeau a206) ou canoniques (ids q_a206b / q_a206c) */
const qa = (P, k) => P.queries.find(q => q.a206 === k || q.id === 'q_a206' + k);
const SET = n => P => {
  if (!qa(P, 'b')) P.queries.push(K2.C.a206b());
  let c = qa(P, 'c');
  if (!c) { c = K2.C.a206c(); P.queries.push(c); }
  c.steps = K2.C.a206cSteps().slice(0, n);
};
const EX1 = SET(1), EX2 = SET(2), EX3 = SET(7), EX4 = SET(9), EX5 = SET(10), EX6 = SET(13);
const tmps = P => P.queries.filter(q => q.tmp206);
function EX8(P) { P.queries = P.queries.filter(q => !q.tmp206); P.name = 'Wonderland_Pilotage_M206'; P.saved = true; P.dirty = false; }

/* Interdits communs : l'atelier ne touche jamais le registre principal */
const isMain = q => q && q.m2 && !q.a206 && !/^q_a206/.test(q.id) && !q.tmp206;

const def = {
  id: 206,
  objectifs: ['Importer un échantillon dans un atelier isolé', 'Compter les éléments avant de fractionner', 'Fractionner, extraire et fusionner sans écraser la source', 'Signaler les cellules qui ne respectent pas le contrat'],
  intro: [
    { bg: 'compartiments', n: 'Archives techniques · Dimanche 7 juin, 17 h 15. Oscar branche un ancien disque de sauvegarde. Un export apparaît à l’écran.' },
    { card: { k: 'Deux cellules', h: 'Dragon | Zone Nord | Corrective', p: 'Dupont, Jean-Pierre' } },
    { p: 'oscar', t: 'Notre ancien logiciel regroupait parfois plusieurs informations dans le même champ. Pour retrouver une attraction, nous devions lire toute la cellule.' },
    { p: 'gabriel', t: 'Nous pourrions séparer les mots avec les espaces.' },
    { clear: 1, card: { k: 'Deux valeurs', h: 'Wonder Wheel', p: 'Le Goff, Anne Marie' } },
    { p: 'pixel', t: 'Si nous coupons à chaque espace, nous détruirons les noms composés. Il faut identifier les séparateurs qui structurent réellement l’information.' },
    { clear: 1, card: { k: 'Une autre cellule', h: 'Wonder Wheel | Zone Est | Corrective | Urgence' } },
    { p: 'oscar', t: 'Celle-ci possède un élément supplémentaire.' },
    { p: 'pixel', t: 'Notre transformation doit le détecter. Elle ne doit pas l’abandonner silencieusement.' },
    { clear: 1, p: 'victoria', t: 'Travaillez sur cet échantillon séparément. Je veux comprendre votre méthode avant de l’utiliser sur d’autres exports.' },
    { btn: 'Fractionner, extraire ou fusionner ?' }
  ],
  leconTitre: 'Fractionner, extraire ou fusionner ?',
  async lecon(x) {
    const OPS = [['frac', 'Fractionner'], ['extr', 'Extraire'], ['fcol', 'Fusionner des colonnes'], ['freq', 'Fusionner des requêtes']];
    const card = K.lesson('Leçon', 'Quatre gestes, quatre effets', `
      <div class="flow-row" style="grid-template-columns:1fr 1fr"><div class="flow-box on"><b>Fractionner</b><small>Répartir un champ en plusieurs colonnes</small></div><div class="flow-box on"><b>Extraire</b><small>Récupérer une partie définie d’un texte</small></div><div class="flow-box on"><b>Fusionner des colonnes</b><small>Construire un texte à partir de plusieurs champs</small></div><div class="flow-box"><b>Fusionner des requêtes</b><small>Rapprocher deux tables : autre opération, hors sujet ici</small></div></div>
      <div data-sec="2" style="display:none; margin-top:14px"></div>`);
    x.app('lecon', card);
    const sc = card.firstElementChild;
    await x.pixel('Fractionner une cellule ne doit pas changer le nombre d’événements. Nous allons donc fractionner en colonnes.');
    await x.say('oscar', 'Et si nous choisissons « en lignes » ?');
    await x.pixel('Une cellule de trois éléments produirait alors trois lignes. Ce n’est pas notre objectif : chaque ligne d’entraînement doit rester une ligne. À toi : quel geste pour chaque besoin ?');
    const B = K2.sorter({ key: () => SOL, bare: true, title: 'Quel geste pour quel besoin ?', btn: 'Vérifier', options: OPS,
      rows: [['a', 'Équipement → attraction, zone, type', 'Une cellule, trois champs'], ['b', 'Le texte avant une virgule', 'Martin, Alice → Martin'], ['c', 'Prénom + espace + nom', 'Alice Martin'], ['d', 'Retrouver la zone d’un équipement dans une autre table', 'Deux tables, une clé commune']].map(r => ({ id: r[0], t: r[1], sub: r[2] })) });
    const sec = $('[data-sec="2"]', card); sec.appendChild(B.el); sec.style.display = '';
    requestAnimationFrame(() => sc.scrollTo({ top: Math.max(0, sec.offsetTop - 14), behavior: 'smooth' }));
    const SOL = { a: 'frac', b: 'extr', c: 'fcol', d: 'freq' };
    x.todo('Associe un geste à chacun des quatre besoins.');
    await x.wait({ 'k2.pick': () => {}, 'k2.check': ({ values }) => {
      if (Object.keys(SOL).some(k => !values[k])) return x.oops('', 'Choisis un geste pour les quatre besoins.');
      const bad = Object.keys(SOL).filter(k => values[k] !== SOL[k]); B.mark(bad);
      if (!bad.length) { B.lock(); return true; }
      if (bad.includes('d')) return x.oops('', 'Rapprocher deux tables, c’est fusionner des requêtes : une autre opération, pour plus tard.');
      if (bad.includes('c')) return x.oops('', 'Assembler deux champs en un texte, c’est fusionner des colonnes.');
      if (bad.includes('b')) return x.oops('', 'On ne garde qu’une partie définie du texte : c’est une extraction.');
      return x.oops('', 'Un champ réparti en plusieurs colonnes : c’est un fractionnement.');
    } });
    await x.ok('Aujourd’hui, on fractionne et on extrait pour lire la structure, puis on fusionne seulement pour présenter. Fusionner des requêtes viendra plus tard.');
  },
  exs: [
    /* 1 — Importer l'échantillon sans le mélanger au registre */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      x.app('pbi'); pbi.render();
      await x.say('oscar', 'Voici le fichier de l’ancien logiciel. Il sert à tester la méthode, pas à compléter automatiquement notre maintenance actuelle.');
      await x.pixel('On l’importe dans un atelier, à part du registre. Il est rangé dans Maintenance › Ancien_logiciel.');
      await K2.work(x, {
        cur: MAIN, edit: [], editNew: true,
        next: () => {
          const b = qa(P(), 'b'), c = qa(P(), 'c');
          if (!b) {
            if (pbi.dlgKind === 'q2csv') return ['Règle l’origine et le délimiteur jusqu’à un aperçu lisible, puis OK.', ['[data-x="enc"]', '.menu [data-k="65001"]', '[data-x="delim"]', '.menu [data-k=";"]', '[data-d="ok"]']];
            if (pbi.dlgKind === 'q2open') return [`Ouvre le dossier Ancien_logiciel, puis ${FILE}.`, ['[data-sub="Ancien_logiciel"]', `[data-f="${FILE}"]`, '[data-d="open"]']];
            return ['Accueil › Nouvelle source › Texte/CSV.', ['[data-q="tab:Accueil"]', '[data-q="cmd:newsource"]', '.menu [data-k="csv"]']];
          }
          if (b.name !== BRUT) { if (!K2.shown(x, b.name)) return K2.showTodo(x, b.name); return [`Renomme la requête ${BRUT} : touche son nom en haut, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']]; }
          if (b.load !== false) { if (!K2.shown(x, BRUT)) return K2.showTodo(x, BRUT); return ['Désactive son chargement : touche son nom, puis Activer le chargement.', ['.q2-qname', '.menu [data-k="load"]']]; }
          if (!c) return [`Volet Requêtes : ⋯ à côté de ${BRUT}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, b), '.menu [data-k="ref"]']];
          if (!K2.shown(x, c.name)) return K2.showTodo(x, c.name);
          if (c.name !== COLS) return [`Renomme la référence ${COLS}.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']];
          if (c.load !== false) return ['Désactive aussi son chargement.', ['.q2-qname', '.menu [data-k="load"]']];
          return true;
        },
        tries: p => {
          const b = qa(P(), 'b'), c = qa(P(), 'c');
          if (p.kind === 'append' || p.kind === 'merge') return x.oops('Ajout au registre principal');
          if (p.kind === 'newQuery') {
            if (p.how === 'csv') {
              if (b) return x.oops('', 'L’échantillon est déjà importé.');
              if (!p.query.steps[0] || p.query.steps[0].file !== FILE) return x.oops('', `Importe ${FILE}.`);
              p.query.a206 = 'b'; return true;
            }
            if (p.how === 'ref') {
              if (!b) return x.oops('', 'Importe d’abord le fichier.');
              if (c) return x.oops('', 'La référence existe déjà.');
              if (p.src !== b) return x.oops(isMain(p.src) ? 'Ajout au registre principal' : '', `Crée la référence à partir de ${BRUT}.`);
              p.query.a206 = 'c'; return true;
            }
            return x.oops('', p.how === 'dup' ? 'Crée une référence : la préparation doit dépendre du brut.' : 'Passe par Nouvelle source › Texte/CSV.');
          }
          if (p.kind === 'renameQuery') {
            if (p.target === b) return p.name === BRUT ? true : x.oops('', `Écris exactement ${BRUT}.`);
            if (p.target === c) return p.name === COLS ? true : x.oops('', `Écris exactement ${COLS}.`);
            return x.oops('', 'Garde le nom de cette requête.');
          }
          if (p.kind === 'load') { if (p.on) return x.oops('Chargement activé'); return p.target === b || p.target === c ? true : x.oops('', 'Règle seulement les requêtes de l’atelier.'); }
          if (['add', 'edit', 'del', 'delEnd', 'code', 'type'].includes(p.kind)) {
            const q = p.target || p.q;
            if (q && q === b) return x.oops('Modification du brut pendant les exercices');
            if (q && isMain(q)) return x.oops('Ajout au registre principal');
            return x.oops('', 'Les transformations commencent à l’exercice suivant.');
          }
        },
        on: {
          'q2.file': p => { if (p.file !== FILE) return x.oops('', `Ouvre ${FILE}, dans Maintenance › Ancien_logiciel.`); },
          'q2.csvOk': p => {
            if (p.enc !== 65001) return x.oops('Accents corrompus');
            if (p.delim === ',') return x.oops('Virgule choisie pour importer le CSV');
            if (p.delim === '|') return x.oops('Barre verticale choisie à l’importation');
            if (p.delim !== ';') return x.oops('Nombre de colonnes différent de cinq');
            if (p.detect === 'none') return x.oops('', 'Garde la détection des types : les cinq colonnes seront lues comme du texte.');
          }
        }
      });
      await x.pixel('Les en-têtes ont été promus et les cinq colonnes lues comme du texte : regarde les icônes ABC.');
      await K2.num(x, `État de ${COLS} au départ.`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 8 && v.c === 5 ? true : v.c !== 5 ? ['Nombre de colonnes différent de cinq'] : v.l === 9 ? ['Première ligne conservée comme donnée'] : ['', 'Lis la barre d’état en bas de l’aperçu.']);
      await K2.ask(x, 'Et le caractère | à l’intérieur des cellules ?', [{ t: 'On le traitera après l’importation, dans la référence', ok: true }, { t: 'Il fallait le choisir comme délimiteur du fichier', err: 'Barre verticale choisie à l’importation' }]);
      await x.ok('Huit lignes, cinq colonnes, des accents intacts. Le point-virgule découpe le fichier ; la barre verticale découpera plus tard l’intérieur des cellules.');
    }, avance: EX1 },

    /* 2 — Compter avant de couper */
    { async run(x) {
      K2.open(x, COLS);
      await x.pixel('Nous attendons trois éléments. Ces cellules respectent-elles toutes la même structure ?');
      await x.say('oscar', 'S001 oui. S006 en possède deux. S007 en possède quatre.');
      await x.pixel('Avant de couper, on compte. Text.Split découpe le texte à chaque barre verticale ; List.Count compte les morceaux obtenus.');
      await K2.custom(x, { q: COLS, col: 'Nb_Elements_Equipement', type: 'int', src: K2.F.nb,
        check: T => T.rows.map(r => r.Nb_Elements_Equipement).join() === '3,3,3,3,3,2,4,3' ? true : ['', 'S006 doit compter 2 éléments et S007 en compter 4 : vérifie la formule collée.'],
        tries: p => {
          if (p.kind === 'add' && p.op === 'custom' && /Text\.Split\(\[Equipement_Brut\],\s*" "\)/.test(p.step.src || '')) return x.oops('Espaces utilisés comme séparateurs');
          if (p.kind === 'add' && (p.op === 'filter' || p.op === 'rmrows' || p.op === 'keeprows')) return x.oops('S006 supprimé');
          if (p.kind === 'add' && p.op === 'split') return x.oops('', 'On compte d’abord, on coupera à l’exercice suivant.');
        } });
      await K2.num(x, 'Combien de lignes s’écartent des trois éléments attendus ?', [{ id: 'n', label: 'Lignes hors structure' }], v => v.n === 2 ? true : v.n === 0 ? ['Comptage réalisé uniquement sur la première ligne'] : ['', 'Compare chaque valeur de Nb_Elements_Equipement à 3.']);
      await K2.ask(x, 'S006 compte deux éléments. Que faire ?', [{ t: 'Le conserver et signaler le type absent', ok: true }, { t: 'Le déclarer complet', err: 'S006 déclaré complet' }, { t: 'Le supprimer de l’atelier', err: 'S006 supprimé' }]);
      await K2.ask(x, 'S007 en compte quatre. Que faire ?', [{ t: 'Conserver Urgence et signaler l’élément en plus', ok: true }, { t: 'Le déclarer conforme', err: 'S007 déclaré conforme' }, { t: 'Ne garder que les trois premiers', err: 'S007 tronqué' }]);
      await K2.ask(x, '« Dragon | | Corrective » compterait trois éléments. Est-il conforme ?', [{ t: 'Non : la zone est vide, il faut aussi contrôler le contenu', ok: true }, { t: 'Oui, le compte est bon', err: 'Éléments vides ignorés sans contrôle' }]);
      await x.ok('Six structures à trois éléments, S006 à deux, S007 à quatre. Le comptage décrit la structure ; il ne garantit pas que chaque élément est renseigné.');
    }, avance: EX2 },

    /* 3 — Séparer les informations d'équipement */
    { async run(x) {
      const T = () => K2.T(x, COLS), cols = () => K2.cols(T());
      const splitCols = () => cols().filter(c => c.startsWith(CP + '.'));
      const untrimmed = () => { const t = T(); return t ? PARTS.filter(c => t.rows.some(r => typeof r[c] === 'string' && r[c] !== r[c].trim())) : []; };
      K2.open(x, COLS);
      await x.say('oscar', 'Nous voulons pouvoir filtrer les attractions et les zones séparément.');
      await x.pixel('On fractionne une copie, pour garder Equipement_Brut intact. Quatre colonnes : S007 a besoin d’une place pour son élément en plus.');
      await K2.work(x, {
        cur: COLS, edit: [COLS], ops: ['dup', 'split', 'rename', 'fmt', 'type', 'replace'],
        offOpMsg: 'Cette transformation n’est pas demandée : duplique, fractionne, renomme, puis nettoie les espaces.',
        next: () => {
          if (!K2.shown(x, COLS)) return K2.showTodo(x, COLS);
          const c = cols(), sp = splitCols();
          if (!c.includes(CP) && !sp.length && !PARTS.some(p => c.includes(p))) return ['Sélectionne Equipement_Brut, puis Ajouter une colonne › Dupliquer la colonne.', ['[data-q="hd:Equipement_Brut"]', '[data-q="tab:Ajouter une colonne"]', '[data-q="cmd:dupcol"]']];
          if (c.includes(CP)) return x.pbi.dlgKind === 'q2split' ? ['Délimiteur personnalisé : |, à chaque occurrence, puis OK.', ['[data-x="d"]', '.menu [data-k="custom"]', '[data-x="c"]', '[data-d="ok"]']] : [`Sélectionne ${CP}, puis Transformer › Fractionner la colonne › Par délimiteur.`, [`[data-q="hd:${CP}"]`, '[data-q="tab:Transformer"]', '[data-q="cmd:split"]', '.menu [data-k="delim"]']];
          for (let i = 0; i < 4; i++) if (c.includes(`${CP}.${i + 1}`)) return K2.colTodo(`${CP}.${i + 1}`, PARTS[i]);
          const u = untrimmed(), multi = x.pbi.q2.multi, sel = x.pbi.q2.sel;
          if (u.length === 1) return [`Espaces dans ${u[0]} : sélectionne-la, puis Transformer › Format › Supprimer les espaces.`, [`[data-q="hd:${u[0]}"]`, '[data-q="tab:Transformer"]', '[data-q="cmd:format"]', '.menu [data-k="trim"]']];
          if (u.length) return [`En sélection multiple, les ${u.length === 4 ? 'quatre' : u.length} colonnes extraites, puis Transformer › Format › Supprimer les espaces.`, (multi ? [] : ['[data-q="tab:Accueil"]', '[data-q="cmd:multi"]']).concat(u.filter(c => !sel.includes(c)).map(c => `[data-q="hd:${c}"]`), ['[data-q="tab:Transformer"]', '[data-q="cmd:format"]', '.menu [data-k="trim"]'])];
          return true;
        },
        tries: p => {
          if (p.kind === 'type') {
            if (['int', 'dec', 'fixed', 'pct'].includes(p.type)) return x.oops('Toutes les colonnes converties en nombres');
            if (p.cols.some(c => SRC5.includes(c))) return x.oops('Source écrasée');
            return p.type === 'text' ? true : x.oops('', 'Ces informations restent du texte.');
          }
          if (p.kind !== 'add') return;
          const s = p.step;
          if (p.op === 'dup') return s.col === 'Equipement_Brut' ? (cols().includes(CP) || splitCols().length ? x.oops('', 'La copie existe déjà.') : true) : x.oops('', 'Duplique Equipement_Brut.');
          if (p.op === 'split') {
            if (s.col === 'Equipement_Brut') return x.oops('Source écrasée');
            if (s.col !== CP) return x.oops('', `Fractionne ${CP}.`);
            if (s.into === 'rows') return x.oops('Fractionnement en lignes');
            if (s.delim === ' ') return x.oops('Wonder Wheel coupé en deux');
            if (s.delim !== '|') return x.oops('', 'Utilise la barre verticale seule : les espaces seront nettoyés ensuite.');
            if (s.at !== 'each') return x.oops('', 'Coupe à chaque occurrence du délimiteur.');
            if (s.n < 4) return x.oops('Quatrième élément supprimé');
            return true;
          }
          if (p.op === 'rename') {
            const [from, to] = p.merge ? [p.col, p.name] : s.pairs[s.pairs.length - 1];
            if (SRC5.includes(from)) return x.oops('Source écrasée');
            const i = Number((from.match(/\.(\d)$/) || [])[1]) - 1;
            if (from.startsWith(CP + '.') && PARTS[i]) return to === PARTS[i] ? true : x.oops('Colonnes conservées sous des noms génériques', `Écris exactement ${PARTS[i]}.`);
            return x.oops('', 'Garde le nom de cette colonne.');
          }
          if (p.op === 'fmt') {
            if (s.cols.some(c => SRC5.includes(c))) return x.oops('Source écrasée');
            if (s.fn !== 'trim') return x.oops('', 'Garde l’écriture reçue : retire seulement les espaces aux extrémités.');
            if (s.as) return x.oops('', 'Nettoie les colonnes elles-mêmes : passe par l’onglet Transformer.');
            return s.cols.every(c => PARTS.includes(c)) ? true : x.oops('', 'Nettoie seulement les quatre colonnes extraites.');
          }
          if (p.op === 'replace') { const cl = s.cols || [s.col]; return cl.every(c => PARTS.includes(c)) && (s.to === null || s.to === undefined) ? true : x.oops('Type inventé pour S006'); }
        }
      });
      await K2.ask(x, 'Que vaut Type_Extrait pour S006 ?', [{ t: 'null : la source ne fournit pas ce type', ok: true }, { t: 'Il faudrait y mettre Corrective', err: 'Type inventé pour S006' }]);
      await x.ok('Quatre colonnes nettoyées, huit lignes, Equipement_Brut intact. Wonder Wheel et Sky Tower gardent leurs espaces internes, S006 garde son absence, S007 son complément.');
    }, avance: EX3 },

    /* 4 — Séparer les noms sans casser les noms composés */
    { async run(x) {
      K2.open(x, COLS);
      await x.say('oscar', 'Jean-Pierre Dupont et Anne Marie Le Goff. Les espaces et le trait d’union font partie de leurs noms.');
      await x.pixel('Le séparateur déclaré est la virgule : Nom, Prénom. La formule coupe à la virgule, nettoie les espaces, et n’accepte que deux morceaux non vides.');
      const tries = p => {
        if (p.kind !== 'add') return;
        if (p.op === 'custom') {
          const src = p.step.src || '';
          if (/Text\.Split\(\[Technicien_Brut\],\s*" "\)/.test(src)) return x.oops('Séparation à chaque espace');
          if (/Text\.Split\(\[Technicien_Brut\],\s*"-"\)/.test(src)) return x.oops('Trait d’union utilisé comme séparateur');
        }
        if (p.op === 'removeCols' || p.op === 'selectCols') return x.oops('Source supprimée après extraction');
        if (p.op === 'split' && p.step.col === 'Technicien_Brut') return x.oops('Source supprimée après extraction');
      };
      await K2.custom(x, { q: COLS, col: 'Nom_Extrait', type: 'text', src: K2.F.nom, tries,
        check: T => { const g = id => T.rows.find(r => r.ID_Ligne === id).Nom_Extrait; return g('S006') === 'Le Goff' && g('S005') === 'Dupont' && g('S008') === null ? true : g('S006') === 'Goff' ? ['Le Goff réduit à Goff'] : g('S008') !== null ? ['S008 interprété automatiquement'] : ['', 'Vérifie la formule collée.']; } });
      await x.pixel('Même règle pour le prénom : le second morceau.');
      await K2.custom(x, { q: COLS, col: 'Prenom_Extrait', type: 'text', src: K2.F.prenom, tries,
        check: T => { const g = id => T.rows.find(r => r.ID_Ligne === id).Prenom_Extrait; return g('S006') === 'Anne Marie' && g('S005') === 'Jean-Pierre' && g('S008') === null ? true : g('S006') === 'Anne' ? ['Anne Marie réduit à Anne'] : g('S005') === 'Dupont' ? ['Nom et prénom inversés'] : ['', 'Vérifie la formule collée.']; } });
      await K2.num(x, 'Combien de couples nom et prénom sont exploitables ?', [{ id: 'n', label: 'Couples exploitables' }], v => v.n === 7 ? true : v.n === 8 ? ['S008 interprété automatiquement'] : ['', 'Compte les lignes où Nom_Extrait n’est pas null.']);
      await x.say('oscar', 'Nous savons que Robert Nora ressemble à un nom complet. Pourquoi ne pas couper à l’espace ?');
      await K2.ask(x, 'Que répondre à Oscar ?', [{ t: 'Ce serait une seconde règle non documentée, qui échouerait sur d’autres noms : S008 reste à confirmer', ok: true }, { t: 'Coupons à l’espace pour cette seule ligne', err: 'S008 interprété automatiquement' }]);
      await x.ok('Sept couples exploitables : Le Goff, Anne Marie et Jean-Pierre gardent tous leurs caractères. S008 reste à null, sans interprétation, et Technicien_Brut est intact.');
    }, avance: EX4 },

    /* 5 — Fusionner pour présenter une identité */
    { async run(x) {
      K2.open(x, COLS);
      await x.say('victoria', 'Pour une liste destinée aux responsables, je préférerais lire Alice Martin. Mais les champs Nom et Prénom restent utiles séparément.');
      await x.pixel('On ajoute une colonne de présentation, sans remplacer les champs structurés. Text.Combine assemble les morceaux avec un espace, seulement quand les deux sont présents.');
      await K2.custom(x, { q: COLS, col: 'Technicien_Affichage', type: 'text', src: K2.F.aff,
        check: T => {
          const g = id => T.rows.find(r => r.ID_Ligne === id).Technicien_Affichage;
          if (g('S001') === 'Martin Alice') return ['Ordre Nom Prénom au lieu de Prénom Nom'];
          if (g('S001') === 'AliceMartin') return ['Aucun espace entre les éléments'];
          if (g('S008') === 'null') return ['Texte null affiché littéralement'];
          return g('S001') === 'Alice Martin' && g('S006') === 'Anne Marie Le Goff' && g('S008') === null ? true : ['', 'Vérifie la formule collée.'];
        },
        tries: p => {
          if (p.kind === 'merge') return x.oops('Fusion de requêtes lancée');
          if (p.kind === 'add' && (p.op === 'removeCols' || p.op === 'selectCols')) return x.oops('Colonnes Nom et Prénom supprimées');
          if (p.kind === 'add' && p.op === 'custom' && /"(Alice|Martin|Jean)/.test(p.step.src || '')) return x.oops('Résultats saisis manuellement');
        } });
      await K2.ask(x, 'Quel affichage pour S008 ?', [{ t: 'null : son extraction reste à confirmer', ok: true }, { t: 'Nora Robert', err: 'S008 affiché comme identité validée' }]);
      await x.ok('Alice Martin, Jean-Pierre Dupont, Anne Marie Le Goff : un affichage calculé, et les champs Nom et Prénom restent disponibles pour les contrôles.');
    }, avance: EX5 },

    /* 6 — Rendre les structures non conformes visibles */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      K2.open(x, COLS);
      await x.say('victoria', 'Quelles lignes demandent encore une intervention humaine ?');
      await x.say('oscar', 'Il manque le type sur une ligne, une autre possède un élément supplémentaire et une troisième n’a pas le séparateur du nom.');
      await x.pixel('Trois colonnes de contrôle, calculées depuis le contenu des cellules. D’abord l’équipement.');
      const noId = p => p.kind === 'add' && p.op === 'custom' && /S00\d/.test(p.step.src || '') ? x.oops('Indicateurs codés selon les ID') : p.kind === 'add' && p.op === 'filter' ? x.oops('Liste de revue confondue avec préparation principale') : undefined;
      const val = (T, id, c) => T.rows.find(r => r.ID_Ligne === id)[c];
      await K2.custom(x, { q: COLS, col: 'Controle_Equipement', type: 'text', src: K2.F.ctlE, tries: noId,
        check: T => val(T, 'S006', 'Controle_Equipement') === 'Incomplet' && val(T, 'S007', 'Controle_Equipement') === 'Élément supplémentaire' && T.rows.filter(r => r.Controle_Equipement === 'Conforme').length === 6 ? true : ['', 'Vérifie la formule collée.'] });
      await x.pixel('Puis le technicien.');
      await K2.custom(x, { q: COLS, col: 'Controle_Technicien', type: 'text', src: K2.F.ctlT, tries: noId,
        check: T => val(T, 'S008', 'Controle_Technicien') === 'Séparateur absent' && T.rows.filter(r => r.Controle_Technicien === 'Conforme').length === 7 ? true : ['S008 ignoré'] });
      await x.pixel('Enfin un indicateur global : Vrai dès qu’un des deux contrôles n’est pas conforme.');
      await K2.custom(x, { q: COLS, col: 'A_Revoir', type: 'bool', src: K2.F.rev, tries: noId,
        check: T => T.rows.filter(r => r.A_Revoir === true).map(r => r.ID_Ligne).join() === 'S006,S007,S008' ? true : ['', 'Vérifie la formule collée.'] });
      await x.pixel('La liste de revue vit dans une vue temporaire : la préparation garde ses huit lignes.');
      await K2.tmp(x, { src: COLS, flag: 'tmp206', kind: 'rev', loadErr: 'Liste de revue confondue avec préparation principale', mainErr: 'Liste de revue confondue avec préparation principale',
        next: t => t.steps.some(s => s.op === 'filter') ? true : ['Filtre A_Revoir : décoche FALSE, puis OK.', ['[data-q="flt:A_Revoir"]', '.q2-chk', '[data-d="ok"]']],
        tries: (p, t) => {
          if (p.kind === 'add' && p.op === 'filter') { const R = K2.simulate(x, t, p.step); return R.table && R.table.rows.length === 3 && R.table.rows.every(r => r.A_Revoir === true) ? true : x.oops('', 'Garde seulement les lignes où A_Revoir vaut TRUE.'); }
          if (p.kind === 'add' && (p.op === 'rmrows' || p.op === 'removeCols')) return x.oops('Trois lignes supprimées');
        } });
      await K2.ask(x, 'S007 : faut-il ranger Urgence comme type de maintenance ?', [{ t: 'Non : son troisième élément est déjà Corrective', ok: true }, { t: 'Oui, c’est plus précis', err: 'Urgence transformé automatiquement en type' }]);
      await x.ok('Trois lignes à revoir : S006 incomplet, S007 avec un élément en plus, S008 sans séparateur. Les huit lignes restent dans la préparation.');
    }, avance: EX6 },

    /* 7 — Vérifier que rien n'a disparu */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('gabriel', 'Nous avons davantage de colonnes. Comment prouver que nous n’avons perdu aucun morceau d’information ?');
      await x.pixel('Commençons par le témoin : la requête brute.');
      await K2.work(x, { cur: BRUT, next: () => K2.shown(x, BRUT) ? true : K2.showTodo(x, BRUT) });
      await K2.num(x, `État de ${BRUT}.`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 8 && v.c === 5 ? true : ['Colonne source nettoyée puis présentée comme originale', 'Le témoin garde ses huit lignes et ses cinq colonnes : lis sa barre d’état.']);
      await K2.prof(x, COLS, 'ID_Ligne');
      await K2.num(x, 'Profil de ID_Ligne dans la préparation.', [{ id: 'n', label: 'Nombre' }, { id: 'd', label: 'Distinct' }], v => v.n === 8 && v.d === 8 ? true : ['Contrôle limité au nombre de lignes', 'Lis Nombre et Distinct dans le profil.']);
      await x.pixel('Reconstruisons maintenant les équipements conformes, dans une vue temporaire : si la jonction des trois morceaux redonne le texte reçu, l’extraction est cohérente.');
      await x.formula(K2.F.recon, 'Formule · Reconstruction_OK');
      await K2.tmp(x, { src: COLS, flag: 'tmp206', kind: 'rec', ops: ['custom'],
        next: t => K2.cols(K2.T(x, t.name)).includes('Reconstruction_OK') ? true : K2.customTodo(x, 'Reconstruction_OK', 'bool'),
        tries: (p, t) => {
          if (p.kind === 'custom' && p.syntax === false) return x.oops('', 'La formule contient une erreur de syntaxe : touche Effacer, puis Coller.');
          if (p.kind === 'add' && p.op === 'custom') {
            if (p.step.col !== 'Reconstruction_OK') return x.oops('', 'Nomme la colonne exactement Reconstruction_OK.');
            if (p.step.type !== 'bool') return x.oops('', 'Choisis le type Vrai/Faux.');
            const R = K2.simulate(x, t, p.step);
            if (R.error || !R.table) return x.oops('', 'Cette formule produit une erreur : touche Effacer, puis Coller.');
            const ok = R.table.rows.filter(r => r.Reconstruction_OK === true).length;
            if (/=\s*\[Equipement_Brut\]\s*$/.test(p.step.src || '')) return x.oops('Comparaison exacte malgré espaces normalisés');
            return ok === 6 ? true : x.oops('', 'Six équipements conformes doivent se reconstruire : vérifie la formule collée.');
          }
        } });
      await K2.prof(x, (tmps(P()).find(q => q.tmp206 === 'rec') || {}).name || COLS, 'Reconstruction_OK');
      await K2.num(x, 'Combien d’équipements se reconstruisent à l’identique ?', [{ id: 'n', label: 'TRUE' }], v => v.n === 6 ? true : ['', 'Lis la ligne TRUE de la distribution.']);
      await K2.ask(x, 'S007 n’est pas reconstruit ici. Son contenu est-il perdu ?', [{ t: 'Non : Urgence est conservé dans Complement_Equipement', ok: true }, { t: 'La reconstruction prouve que tout est conservé', err: 'S007 reconstruit sans son complément puis déclaré intégralement conservé' }]);
      await K2.ask(x, 'La reconstruction certifie-t-elle que Dragon est le bon équipement ?', [{ t: 'Non : elle contrôle la transformation, pas la réalité', ok: true }, { t: 'Oui', err: 'Reconstruction assimilée à certification métier' }]);
      await x.ok('Huit lignes, huit identifiants, cinq colonnes sources intactes. Six équipements se reconstruisent ; S006 et S007 sont expliqués à part ; S008 garde son texte reçu.');
    }, avance: P => { EX6(P); } },

    /* 8 — Refermer l'atelier sans toucher au pilotage */
    { async run(x) {
      const pbi = x.pbi, P = () => pbi.P;
      await x.say('victoria', 'Nous avons une méthode et trois dossiers à clarifier. Le registre principal a-t-il changé ?');
      await x.pixel('Non. Cet exercice reste isolé. Vérifions-le avant de sauvegarder.');
      await K2.work(x, { cur: MAIN, next: () => K2.shown(x, MAIN) ? true : K2.showTodo(x, MAIN) });
      await K2.num(x, `État de ${MAIN}.`, [{ id: 'l', label: 'Lignes' }, { id: 'c', label: 'Colonnes' }], v => v.l === 1099 && v.c === 25 ? true : v.l === 1107 ? ['Échantillon ajouté au registre principal'] : ['Préparation principale modifiée', 'Rien n’a dû changer : 1 099 lignes et 25 colonnes depuis la mission 205.']);
      await K2.ask(x, 'Les trois exceptions de l’atelier sont-elles résolues ?', [{ t: 'Non : elles restent à confirmer', ok: true }, { t: 'Oui, elles sont signalées', err: 'Trois exceptions marquées résolues' }]);
      await K2.final(x, {
        name: 'Wonderland_Pilotage_M206', cur: COLS,
        work: { loadErr: 'Table d’atelier chargée', overErr: 'Checkpoint 110 écrasé', fileErr: '', delErr: 'Source d’atelier supprimée',
          delQuery: p => p.target.tmp206 ? true : false },
        pre: () => {
          const t = tmps(P())[0];
          if (t) { if (!pbi.q2El) return ['Rouvre l’éditeur Power Query pour ranger les vues temporaires.', ['[data-a="cmd:transform"]']]; return [`Supprime la vue temporaire ${t.name}.`, ['[data-q="qd"]', K2.qmenu(x, t), '.menu [data-k="del"]', '[data-d="del"]']]; }
          return true;
        }
      });
      x.app('ctl206', K.lesson('Contrôle final', 'Un atelier isolé, un registre intact', `${K2.facts([[8, 'lignes d’atelier conservées'], [16, 'colonnes, dont 11 ajoutées'], [3, 'lignes à revoir'], ['1 099', 'lignes au registre, inchangé']])}${K2.card110(P())}`));
      await x.ok('Copie M206 enregistrée. L’atelier reste dans Power Query, non chargé ; le registre de mai et le rapport du conseil n’ont pas bougé.');
      x.app('pbi');
    }, avance: EX8 }
  ],
  outro: [
    { bg: 'compartiments', n: 'Bureau Data · Fin de journée. Oscar ferme l’ancien export. Les trois lignes à revoir restent inscrites dans le dossier d’atelier.' },
    { card: { k: COLS, h: '8 lignes · 3 à revoir', chips: ['S006 · type absent', 'S007 · Urgence en plus', 'S008 · séparateur absent'] } },
    { p: 'victoria', t: 'Nous pouvons expliquer les résultats et leurs limites. C’est ce qui permettra de réutiliser la méthode.' },
    { wait: 600 }
  ],
  recompense: { titre: 'Cellules démêlées !', sous: 'Trois informations par cellule, aucune perdue en route.', badge: 'b206', badgeNom: 'Architecte des informations', objet: 'classeur-compartiments' },
  fiches: [
    ['Deux séparateurs', 'Quelle différence entre le délimiteur d’un fichier et un séparateur dans une cellule ?', 'Le délimiteur définit les colonnes du fichier. Un séparateur à l’intérieur d’une cellule définit une structure supplémentaire, à traiter ensuite.'],
    ['Compter avant de couper', 'Pourquoi compter les éléments avant de fractionner ?', 'Pour anticiper les pertes et les décalages : un élément en trop ou en moins doit rester visible.'],
    ['Fractionner en colonnes', 'Que vérifier après un fractionnement en colonnes ?', 'Le nombre de lignes, inchangé, et la conservation des éléments supplémentaires.'],
    ['Séparateur contractuel', 'Pourquoi couper Nom, Prénom à la virgule plutôt qu’aux espaces ?', 'Un séparateur explicite est plus fiable que l’apparence des mots : les noms composés gardent leurs espaces et leurs traits d’union.'],
    ['Colonne de présentation', 'Une colonne fusionnée remplace-t-elle les champs séparés ?', 'Non. Elle sert à la présentation ; les champs séparés restent nécessaires aux contrôles.'],
    ['Contrôle de structure', 'Que dit un contrôle de structure ?', 'Pourquoi une extraction est exploitable ou doit être revue. Il ne valide pas l’événement métier lui-même.'],
    ['Contrôle de conservation', 'Le nombre de lignes suffit-il à prouver la conservation ?', 'Non : une ligne conservée peut avoir perdu une partie de son texte. Il faut vérifier les valeurs et les exceptions.'],
    ['Atelier isolé', 'Un support d’entraînement peut-il rester dans Power Query ?', 'Oui, sans alimenter le modèle ni modifier les données du projet principal : chargement désactivé, aucun ajout au registre.']
  ],
  suiteTitre: 'Lundi, 8 h 40',
  suite: [
    { bg: 'exploitation', n: 'Pixel revient au registre principal de maintenance. Une attraction apparaît sous la forme « dragon », entourée d’espaces. Un statut affiche « terminee ». Un type porte le libellé « Correctif ».' },
    { p: 'gabriel', t: 'Ces valeurs ressemblent à celles que nous utilisons déjà. Nous pourrions toutes les remplacer par les bons libellés.' },
    { p: 'pixel', t: 'Certaines corrections sont simples. Pour d’autres, il faut confirmer que deux mots désignent réellement la même chose.' },
    { p: 'victoria', t: 'Demain, nous allons remettre de l’ordre dans les valeurs. Sans modifier leur sens.' }
  ],
  accroche: 'Trois informations dans une cellule, des noms composés et un élément en trop : fractionner, extraire et fusionner sans rien perdre.',
  fin(P) { EX6(P); EX8(P); }
};
window.PBQ.mission(def);
})();

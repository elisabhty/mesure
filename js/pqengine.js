/* Power BI Quest — moteur Power Query du module 2
   Valeurs, conversions selon les paramètres régionaux, interpréteur du langage M (colonnes personnalisées,
   étapes personnalisées), requêtes et références, étapes appliquées, formules M, profilage, dépendances.
   Fonctionne dans le navigateur (window.PQE) et sous Node (tests). */
(function (root) {
'use strict';

/* ═══════════════════════ Valeurs ═══════════════════════ */
class MDate {
  constructor(y, m, d) { this.y = y; this.m = m; this.d = d; }
  iso() { return `${String(this.y).padStart(4, '0')}-${String(this.m).padStart(2, '0')}-${String(this.d).padStart(2, '0')}`; }
  fr() { return `${String(this.d).padStart(2, '0')}/${String(this.m).padStart(2, '0')}/${this.y}`; }
  num() { return this.y * 10000 + this.m * 100 + this.d; }
  static ok(y, m, d) { if (!(m >= 1 && m <= 12 && d >= 1 && y >= 1)) return false; const dim = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; return d <= dim; }
  static iso(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? new MDate(+m[1], +m[2], +m[3]) : null; }
}
/* Erreur stockée dans une cellule */
class MErr { constructor(reason, message, detail) { this.reason = reason; this.message = message; this.detail = detail === undefined ? null : detail; } }
/* Erreur levée pendant une évaluation */
class MThrow extends Error { constructor(reason, message, detail) { super(message); this.reason = reason; this.mmsg = message; this.detail = detail === undefined ? null : detail; } }
class MTable { constructor(cols, rows) { this.cols = cols; this.rows = rows; } }
class MType { constructor(name, nullable) { this.name = name; this.nullable = !!nullable; } }
class MFn { constructor(params, body, env, name) { this.params = params; this.body = body; this.env = env; this.name = name || null; } }

const isRec = v => v !== null && typeof v === 'object' && (v.constructor === Object || Object.getPrototypeOf(v) === null);
const isTable = v => v instanceof MTable;
const isList = v => Array.isArray(v);
const isFn = v => v instanceof MFn || typeof v === 'function';
const isErr = v => v instanceof MErr;
const E = (reason, message, detail) => new MThrow(reason, message, detail);
const XE = (message, detail) => E('Expression.Error', message, detail);
const DF = (message, detail) => E('DataFormat.Error', message, detail);

/* Types de colonnes (mêmes clés que le simulateur du module 1) */
const TYPES = {
  dec: { nom: 'Nombre décimal', m: 'type number' }, fixed: { nom: 'Nombre décimal fixe', m: 'Currency.Type' }, int: { nom: 'Nombre entier', m: 'Int64.Type' },
  pct: { nom: 'Pourcentage', m: 'Percentage.Type' }, datetime: { nom: 'Date/Heure', m: 'type datetime' }, date: { nom: 'Date', m: 'type date' }, time: { nom: 'Heure', m: 'type time' },
  dtz: { nom: 'Date/Heure/Fuseau horaire', m: 'type datetimezone' }, dur: { nom: 'Durée', m: 'type duration' }, text: { nom: 'Texte', m: 'type text' }, bool: { nom: 'Vrai/Faux', m: 'type logical' },
  bin: { nom: 'Binaire', m: 'type binary' }, any: { nom: 'Tout', m: 'type any' }, table: { nom: 'Table', m: 'type table' }, record: { nom: 'Enregistrement', m: 'type record' }, list: { nom: 'Liste', m: 'type list' }
};
const MTYPE2KEY = { text: 'text', number: 'dec', date: 'date', logical: 'bool', any: 'any', table: 'table', record: 'record', list: 'list', datetime: 'datetime', time: 'time', duration: 'dur', binary: 'bin', 'Int64.Type': 'int', 'Currency.Type': 'fixed', 'Percentage.Type': 'pct', 'Number.Type': 'dec', 'Text.Type': 'text', 'Date.Type': 'date', 'Logical.Type': 'bool' };
const LOCALES = { 'fr-FR': 'Français (France)', 'en-US': 'Anglais (États-Unis)', 'en-GB': 'Anglais (Royaume-Uni)', 'de-DE': 'Allemand (Allemagne)' };
const MACHINE = 'fr-FR';

/* ═══════════════════════ Conversions ═══════════════════════ */
const WS = /[\s\u00A0\u202F]/g;
function numFromText(s, loc) {
  const t = String(s).trim();
  if (t === '') return null;
  let c = t.replace(WS, '');
  if (loc === 'en-US' || loc === 'en-GB') {
    if (!/^[-+]?(\d{1,3}(,\d{3})+|\d+)?(\.\d+)?$/.test(c) || !/\d/.test(c)) return undefined;
    return Number(c.replace(/,/g, ''));
  }
  if (loc === 'de-DE') {
    if (!/^[-+]?(\d{1,3}(\.\d{3})+|\d+)?(,\d+)?$/.test(c) || !/\d/.test(c)) return undefined;
    return Number(c.replace(/\./g, '').replace(',', '.'));
  }
  /* fr-FR : virgule décimale, espaces de milliers */
  if (!/^[-+]?\d*(,\d+)?$/.test(c) || !/\d/.test(c)) return undefined;
  return Number(c.replace(',', '.'));
}
function dateFromText(s, loc, format) {
  const t = String(s).trim();
  let y, m, d, mm;
  if (format) {
    const f = format;
    const re = new RegExp('^' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/yyyy/, '(\\d{4})').replace(/MM/, '(\\d{2})').replace(/dd/, '(\\d{2})').replace(/(?<![(\\d])M(?![M}])/, '(\\d{1,2})').replace(/(?<![(\\d])d(?![d}])/, '(\\d{1,2})') + '$');
    mm = re.exec(t); if (!mm) return undefined;
    const order = []; f.replace(/yyyy|MM|dd|M|d/g, k => { order.push(k[0]); return k; });
    order.forEach((k, i) => { const v = +mm[i + 1]; if (k === 'y') y = v; else if (k === 'M') m = v; else d = v; });
  } else if ((mm = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))) { y = +mm[1]; m = +mm[2]; d = +mm[3]; }
  else if ((mm = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t))) {
    if (loc === 'en-US') { m = +mm[1]; d = +mm[2]; } else { d = +mm[1]; m = +mm[2]; }
    y = +mm[3];
  } else return undefined;
  if (!MDate.ok(y, m, d)) return undefined;
  return new MDate(y, m, d);
}
const decFr = n => { if (!isFinite(n)) return String(n); const s = String(Math.round(n * 1e10) / 1e10); return s.replace('.', ','); };
function textFrom(v, loc) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return loc === 'en-US' || loc === 'en-GB' ? String(Math.round(v * 1e10) / 1e10) : decFr(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v instanceof MDate) return loc === 'en-US' ? `${v.m}/${v.d}/${v.y}` : v.fr();
  throw XE(`Impossible de convertir une valeur de type ${typeName(v)} en type Text.`);
}
function typeName(v) {
  if (v === null || v === undefined) return 'Null';
  if (typeof v === 'string') return 'Text'; if (typeof v === 'number') return 'Number'; if (typeof v === 'boolean') return 'Logical';
  if (v instanceof MDate) return 'Date'; if (isTable(v)) return 'Table'; if (isList(v)) return 'List'; if (isFn(v)) return 'Function'; if (v instanceof MType) return 'Type';
  if (isRec(v)) return 'Record'; return 'Any';
}
const NOMS = { text: 'Texte', dec: 'Nombre', fixed: 'Nombre', int: 'Nombre', pct: 'Nombre', date: 'Date', datetime: 'Date/Heure', time: 'Heure', bool: 'Logique' };
/* Conversion d'une valeur de cellule vers un type de colonne */
function convert(v, type, loc) {
  loc = loc || MACHINE;
  if (v === null || v === undefined || v instanceof MErr) return v === undefined ? null : v;
  const bad = () => new MErr('DataFormat.Error', `Nous n’avons pas pu convertir en ${NOMS[type] || 'ce type'}.`, String(v instanceof MDate ? v.fr() : v));
  switch (type) {
    case 'any': return v;
    case 'text': try { return textFrom(v, loc); } catch (e) { return bad(); }
    case 'dec': case 'pct': case 'fixed': case 'int': {
      let n;
      if (typeof v === 'number') n = v;
      else if (typeof v === 'boolean') n = v ? 1 : 0;
      else if (typeof v === 'string') { n = numFromText(v, loc); if (n === null) return null; if (n === undefined) return bad(); }
      else return bad();
      if (type === 'int') return Math.round(n);
      if (type === 'fixed') return Math.round(n * 1e4) / 1e4;
      return n;
    }
    case 'date': {
      if (v instanceof MDate) return v;
      if (typeof v === 'string') { const d = dateFromText(v, loc); return d === undefined ? bad() : d; }
      if (typeof v === 'number') { const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 864e5); return new MDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()); }
      return bad();
    }
    case 'bool': {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      const s = String(v).trim().toLowerCase();
      if (s === 'true' || s === 'vrai') return true; if (s === 'false' || s === 'faux') return false;
      return bad();
    }
    case 'time': case 'datetime': return typeof v === 'string' ? v : bad();
    default: return v;
  }
}
/* Détection automatique de type (étape « Type modifié » ajoutée par Power Query), sur les 200 premières lignes */
function detectType(values) {
  const vs = values.slice(0, 200).filter(v => v !== null && v !== undefined && v !== '');
  if (!vs.length) return 'any';
  if (vs.every(v => typeof v === 'boolean')) return 'bool';
  const asNum = v => typeof v === 'number' ? v : typeof v === 'string' ? numFromText(v, MACHINE) : undefined;
  if (vs.every(v => { const n = asNum(v); return typeof n === 'number' && !isNaN(n); })) return vs.every(v => Number.isInteger(asNum(v))) ? 'int' : 'dec';
  if (vs.every(v => v instanceof MDate || (typeof v === 'string' && /\d/.test(v) && /[/-]/.test(v) && dateFromText(v, MACHINE) !== undefined))) return 'date';
  if (vs.every(v => typeof v === 'string')) return 'text';
  if (vs.every(v => typeof v === 'string' || typeof v === 'number')) return 'text';
  return 'any';
}

/* ═══════════════════════ Égalité et comparaison ═══════════════════════ */
function eq(a, b) {
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (a instanceof MDate) return b instanceof MDate && a.num() === b.num();
  if (isList(a)) return isList(b) && a.length === b.length && a.every((x, i) => eq(x, b[i]));
  if (isRec(a)) { if (!isRec(b)) return false; const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(k => k in b && eq(a[k], b[k])); }
  if (isTable(a)) return isTable(b) && a.cols.length === b.cols.length && a.rows.length === b.rows.length && a.cols.every((c, i) => c.n === b.cols[i].n) && a.rows.every((r, i) => a.cols.every(c => eq(r[c.n], b.rows[i][c.n])));
  return a === b;
}
function cmp(a, b) {
  if (a === null || b === null || a === undefined || b === undefined) return null;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  if (a instanceof MDate && b instanceof MDate) return a.num() - b.num();
  if (typeof a === 'boolean' && typeof b === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
  throw XE(`Impossible d’appliquer l’opérateur de comparaison aux types ${typeName(a)} et ${typeName(b)}.`);
}
/* Tri : null en premier, puis valeurs du même type */
function sortCmp(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1; if (b === null || b === undefined) return 1;
  if (a instanceof MErr) return 1; if (b instanceof MErr) return -1;
  const ta = typeName(a), tb = typeName(b);
  if (ta !== tb) return ta < tb ? -1 : 1;
  try { return cmp(a, b); } catch (e) { return 0; }
}
const keyOf = v => v === null || v === undefined ? '\u0000null' : v instanceof MDate ? 'd' + v.iso() : v instanceof MErr ? '\u0000err' : typeof v === 'object' ? 'o' + JSON.stringify(v) : typeof v + ':' + v;

/* ═══════════════════════ Langage M : analyse lexicale ═══════════════════════ */
const KW = new Set(['and', 'as', 'each', 'else', 'error', 'false', 'if', 'in', 'is', 'let', 'meta', 'not', 'null', 'or', 'otherwise', 'section', 'shared', 'then', 'true', 'try', 'type']);
function syntax(msg, pos) { const e = E('Expression.SyntaxError', msg); e.pos = pos; return e; }
function lex(src) {
  const toks = []; let i = 0; const n = src.length;
  const idStart = c => /[A-Za-z_\u00C0-\u024F]/.test(c), idChar = c => /[A-Za-z0-9_\u00C0-\u024F]/.test(c);
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
    const s0 = i;
    if (c === '"' || c === '“' || c === '”') {
      let s = ''; i++;
      for (;;) {
        if (i >= n) throw syntax('Jeton de fin de texte manquant : un guillemet " n’est pas fermé.', s0);
        const ch = src[i];
        if (ch === '"' || ch === '”' || ch === '“') { if (src[i + 1] === '"') { s += '"'; i += 2; continue; } i++; break; }
        s += ch; i++;
      }
      toks.push({ t: 'str', v: s, s: s0, e: i }); continue;
    }
    if (c === '#') {
      if (src[i + 1] === '"') {
        let s = ''; i += 2;
        for (;;) {
          if (i >= n) throw syntax('Identificateur entre guillemets non fermé.', s0);
          if (src[i] === '"') { if (src[i + 1] === '"') { s += '"'; i += 2; continue; } i++; break; }
          s += src[i++];
        }
        toks.push({ t: 'id', v: s, q: true, s: s0, e: i }); continue;
      }
      let j = i + 1; while (j < n && /[a-z]/i.test(src[j])) j++;
      toks.push({ t: 'id', v: src.slice(i, j), s: s0, e: j }); i = j; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i;
      if (c === '0' && /[xX]/.test(src[i + 1] || '')) { j = i + 2; while (j < n && /[0-9a-f]/i.test(src[j])) j++; toks.push({ t: 'num', v: parseInt(src.slice(i + 2, j), 16), s: s0, e: j }); i = j; continue; }
      while (j < n && /[0-9]/.test(src[j])) j++;
      if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { j++; while (j < n && /[0-9]/.test(src[j])) j++; }
      if (/[eE]/.test(src[j] || '') && /[-+0-9]/.test(src[j + 1] || '')) { j++; if (/[-+]/.test(src[j])) j++; while (j < n && /[0-9]/.test(src[j])) j++; }
      toks.push({ t: 'num', v: Number(src.slice(i, j)), s: s0, e: j }); i = j; continue;
    }
    if (idStart(c)) {
      let j = i + 1;
      for (;;) {
        while (j < n && idChar(src[j])) j++;
        if (src[j] === '.' && idStart(src[j + 1] || '')) { j++; continue; }
        break;
      }
      const w = src.slice(i, j);
      toks.push(KW.has(w) ? { t: 'kw', v: w, s: s0, e: j } : { t: 'id', v: w, s: s0, e: j });
      i = j; continue;
    }
    const three = src.substr(i, 3), two = src.substr(i, 2);
    if (three === '...') { toks.push({ t: 'p', v: '...', s: s0, e: i + 3 }); i += 3; continue; }
    if (['=>', '<=', '>=', '<>', '..', '??'].includes(two)) { toks.push({ t: 'p', v: two, s: s0, e: i + 2 }); i += 2; continue; }
    if ('=<>+-*/&,;()[]{}?@!'.includes(c)) { toks.push({ t: 'p', v: c, s: s0, e: i + 1 }); i++; continue; }
    throw syntax(`Caractère inattendu « ${c} ».`, i);
  }
  toks.push({ t: 'eof', v: '', s: n, e: n });
  return toks;
}

/* ═══════════════════════ Langage M : analyse syntaxique ═══════════════════════ */
function parse(src) {
  const toks = lex(src);
  let p = 0;
  const peek = (k = 0) => toks[Math.min(p + k, toks.length - 1)];
  const next = () => toks[p++];
  const isP = (v, k = 0) => peek(k).t === 'p' && peek(k).v === v;
  const isK = (v, k = 0) => peek(k).t === 'kw' && peek(k).v === v;
  const want = v => { const t = next(); if (!((t.t === 'p' || t.t === 'kw') && t.v === v)) throw syntax(t.t === 'eof' ? `Jeton ${v === ')' ? 'parenthèse fermante' : v === ']' ? 'crochet fermant' : v === '}' ? 'accolade fermante' : v} attendu à la fin de la formule.` : `Jeton « ${v} » attendu, « ${t.v} » trouvé.`, t.s); return t; };
  function expression() {
    if (isK('let')) return letExpr();
    if (isK('if')) return ifExpr();
    if (isK('each')) { next(); return { k: 'each', body: expression() }; }
    if (isK('try')) { next(); const e = expression(); if (isK('otherwise')) { next(); return { k: 'try', e, o: expression() }; } return { k: 'try', e }; }
    if (isK('error')) { next(); return { k: 'err', e: expression() }; }
    if (isP('(') && fnAhead()) return fnExpr();
    return orExpr();
  }
  function letExpr() {
    next(); const binds = [];
    for (;;) {
      const t = next();
      if (t.t !== 'id') throw syntax('Nom de variable attendu après let.', t.s);
      want('='); binds.push([t.v, expression()]);
      if (isP(',')) { next(); continue; }
      break;
    }
    want('in');
    return { k: 'let', binds, body: expression() };
  }
  function ifExpr() { next(); const c = expression(); want('then'); const a = expression(); want('else'); const b = expression(); return { k: 'if', c, a, b }; }
  function fnAhead() {
    let d = 0, j = p;
    for (; j < toks.length; j++) { const t = toks[j]; if (t.t === 'p' && t.v === '(') d++; else if (t.t === 'p' && t.v === ')') { d--; if (d === 0) break; } else if (t.t === 'eof') return false; }
    let k = j + 1;
    if (toks[k] && toks[k].t === 'kw' && toks[k].v === 'as') { k++; if (toks[k] && toks[k].v === 'nullable') k++; k++; }
    return !!toks[k] && toks[k].t === 'p' && toks[k].v === '=>';
  }
  function fnExpr() {
    want('('); const params = [];
    while (!isP(')')) {
      let optional = false;
      if (peek().t === 'id' && peek().v === 'optional') { next(); optional = true; }
      const t = next(); if (t.t !== 'id') throw syntax('Nom de paramètre attendu.', t.s);
      if (isK('as')) { next(); typeRef(); }
      params.push({ name: t.v, optional });
      if (isP(',')) next(); else break;
    }
    want(')');
    if (isK('as')) { next(); typeRef(); }
    want('=>');
    return { k: 'fn', params, body: expression() };
  }
  function typeRef() {
    if (peek().t === 'id' && peek().v === 'nullable') next();
    const t = next();
    if (t.t === 'id' || t.t === 'kw') return t.v;
    throw syntax('Type attendu.', t.s);
  }
  function orExpr() { let a = andExpr(); while (isK('or')) { next(); a = { k: 'or', a, b: andExpr() }; } return a; }
  function andExpr() { let a = isExpr(); while (isK('and')) { next(); a = { k: 'and', a, b: isExpr() }; } return a; }
  function isExpr() {
    let a = eqExpr();
    for (;;) {
      if (isK('is')) { next(); a = { k: 'is', e: a, t: typeRef() }; continue; }
      if (isK('as')) { next(); a = { k: 'as', e: a, t: typeRef() }; continue; }
      return a;
    }
  }
  function eqExpr() { let a = relExpr(); while (isP('=') || isP('<>')) { const op = next().v; a = { k: 'bin', op, a, b: relExpr() }; } return a; }
  function relExpr() { let a = addExpr(); while (isP('<') || isP('>') || isP('<=') || isP('>=')) { const op = next().v; a = { k: 'bin', op, a, b: addExpr() }; } return a; }
  function addExpr() { let a = mulExpr(); while (isP('+') || isP('-') || isP('&')) { const op = next().v; a = { k: 'bin', op, a, b: mulExpr() }; } return a; }
  function mulExpr() { let a = unary(); while (isP('*') || isP('/')) { const op = next().v; a = { k: 'bin', op, a, b: unary() }; } return a; }
  function unary() {
    if (isK('not')) { next(); return { k: 'not', e: unary() }; }
    if (isP('-')) { next(); return { k: 'neg', e: unary() }; }
    if (isP('+')) { next(); return unary(); }
    if (isK('type')) { next(); const t = typeRef(); return { k: 'type', t }; }
    return postfix(primary());
  }
  function postfix(e) {
    for (;;) {
      if (isP('(')) {
        next(); const args = [];
        while (!isP(')')) { args.push(expression()); if (isP(',')) next(); else break; }
        want(')'); e = { k: 'call', f: e, args }; continue;
      }
      if (isP('[') ) {
        const r = bracket(true);
        if (r.k === 'field') { r.e = e; e = r; continue; }
        if (r.k === 'proj') { r.e = e; e = r; continue; }
        throw syntax('Accès à un champ attendu.', peek().s);
      }
      if (isP('{')) { next(); const idx = expression(); want('}'); let opt = false; if (isP('?')) { next(); opt = true; } e = { k: 'item', e, idx, opt }; continue; }
      return e;
    }
  }
  /* [Champ], [[A],[B]] (projection), [a = 1, b = 2] (enregistrement) — distingués en regardant jusqu'au « ] » */
  function bracket(afterExpr) {
    const open = next();
    if (isP(']')) { next(); if (afterExpr) throw syntax('Nom de champ attendu.', open.s); return { k: 'rec', fields: [] }; }
    if (afterExpr && isP('[')) {
      const names = [];
      while (isP('[')) { const f = bracket(false); names.push(f.name); if (isP(',')) next(); }
      want(']'); return { k: 'proj', names };
    }
    let d = 0, j = p, isRecord = false;
    for (; j < toks.length; j++) {
      const t = toks[j];
      if (t.t === 'eof') break;
      if (t.t === 'p' && (t.v === '[' || t.v === '(' || t.v === '{')) d++;
      else if (t.t === 'p' && (t.v === ']' || t.v === ')' || t.v === '}')) { if (d === 0) break; d--; }
      else if (d === 0 && t.t === 'p' && t.v === '=') { isRecord = true; break; }
    }
    if (!isRecord) {
      const close = toks[j];
      if (!close || close.t === 'eof') throw syntax('Jeton crochet fermant attendu.', open.s);
      let name;
      if (j === p + 1 && toks[p].t === 'id' && toks[p].q) name = toks[p].v;
      else if (j === p + 1 && toks[p].t === 'str') name = toks[p].v;
      else name = SRC.slice(open.e, close.s).trim();
      p = j + 1;
      let opt = false; if (isP('?')) { next(); opt = true; }
      return { k: 'field', e: null, name, opt };
    }
    const fields = [];
    for (;;) {
      const st = p; let q = p;
      while (!(toks[q].t === 'p' && toks[q].v === '=') && toks[q].t !== 'eof') q++;
      let name = q === st + 1 && toks[st].q ? toks[st].v : SRC.slice(toks[st].s, toks[q].s).trim();
      if (q === st + 1 && toks[st].t === 'id' && toks[st].q) name = toks[st].v;
      p = q; want('=');
      fields.push([name, expression()]);
      if (isP(',')) { next(); continue; }
      break;
    }
    want(']');
    return { k: 'rec', fields };
  }
  function primary() {
    const t = peek();
    if (t.t === 'num') { next(); return { k: 'lit', v: t.v }; }
    if (t.t === 'str') { next(); return { k: 'lit', v: t.v }; }
    if (t.t === 'kw') {
      if (t.v === 'null') { next(); return { k: 'lit', v: null }; }
      if (t.v === 'true') { next(); return { k: 'lit', v: true }; }
      if (t.v === 'false') { next(); return { k: 'lit', v: false }; }
      if (['let', 'if', 'each', 'try', 'error'].includes(t.v)) return expression();
      throw syntax(`Jeton « ${t.v} » inattendu.`, t.s);
    }
    if (t.t === 'id') { next(); return { k: 'id', v: t.v }; }
    if (isP('(')) {
      if (fnAhead()) return fnExpr();
      next(); const e = expression(); want(')'); return e;
    }
    if (isP('[')) return bracket(false);
    if (isP('{')) {
      next(); const items = [];
      while (!isP('}')) {
        const a = expression();
        if (isP('..')) { next(); items.push({ k: 'range', a, b: expression() }); } else items.push(a);
        if (isP(',')) next(); else break;
      }
      want('}'); return { k: 'list', items };
    }
    if (isP('...')) { next(); return { k: 'notimpl' }; }
    if (t.t === 'eof') throw syntax('Expression attendue.', t.s);
    throw syntax(`Jeton « ${t.v} » inattendu.`, t.s);
  }
  const SRC = src;
  const e = expression();
  if (peek().t !== 'eof') { const t = peek(); throw syntax(`Jeton « ${t.v} » inattendu : la formule semble terminée avant.`, t.s); }
  return e;
}

/* ═══════════════════════ Langage M : évaluation ═══════════════════════ */
class Env {
  constructor(parent) { this.p = parent || null; this.v = new Map(); }
  get(name) {
    for (let e = this; e; e = e.p) if (e.v.has(name)) { const b = e.v.get(name); return b.lazy ? force(b) : b.val; }
    if (name in STD) return STD[name];
    throw XE(`Le nom « ${name} » n’a pas été reconnu. Assurez-vous qu’il est orthographié correctement.`);
  }
  has(name) { for (let e = this; e; e = e.p) if (e.v.has(name)) return true; return name in STD; }
  set(name, val) { this.v.set(name, { val }); return this; }
  lazy(name, f) { this.v.set(name, { lazy: true, f, done: false }); return this; }
}
function force(b) {
  if (b.done) { if (b.err) throw b.err; return b.val; }
  if (b.busy) throw XE('Une référence cyclique a été rencontrée lors de l’évaluation.');
  b.busy = true;
  try { b.val = b.f(); b.done = true; return b.val; }
  catch (e) { b.err = e; b.done = true; throw e; }
  finally { b.busy = false; }
}
const asLogical = (v, what) => { if (v === true || v === false) return v; throw XE(`Nous ne pouvons pas convertir la valeur ${show1(v)} en type Logical.`, what); };
function show1(v) { if (v === null || v === undefined) return 'null'; if (typeof v === 'string') return `"${v}"`; if (v instanceof MDate) return v.fr(); if (typeof v === 'object') return typeName(v); return String(v); }
function cellRead(v) { if (v instanceof MErr) throw E(v.reason, v.message, v.detail); return v === undefined ? null : v; }
function field(target, name, opt) {
  if (target === null || target === undefined) { if (opt) return null; throw XE('Nous ne pouvons pas appliquer l’accès au champ au type Null.', name); }
  if (isTable(target)) {
    if (!target.cols.some(c => c.n === name)) { if (opt) return null; throw XE(`La colonne « ${name} » de la table est introuvable.`, name); }
    return target.rows.map(r => r[name] === undefined ? null : r[name]);
  }
  if (isRec(target)) {
    if (!Object.prototype.hasOwnProperty.call(target, name)) { if (opt) return null; throw XE(`Le champ « ${name} » de l’enregistrement est introuvable.`, name); }
    return cellRead(target[name]);
  }
  throw XE(`Nous ne pouvons pas appliquer l’accès au champ au type ${typeName(target)}.`, name);
}
function compile(n) {
  switch (n.k) {
    case 'lit': { const v = n.v; return () => v; }
    case 'id': { const name = n.v; return env => env.get(name); }
    case 'field': {
      const name = n.name, opt = n.opt;
      if (!n.e) return env => field(env.get('_'), name, opt);
      const e = compile(n.e); return env => field(e(env), name, opt);
    }
    case 'proj': {
      const e = compile(n.e), names = n.names;
      return env => { const r = e(env); if (isRec(r)) { const o = {}; names.forEach(k => o[k] = field(r, k)); return o; } if (isTable(r)) return selectCols(r, names); throw XE('Projection impossible.'); };
    }
    case 'item': {
      const e = compile(n.e), idx = compile(n.idx), opt = n.opt;
      return env => {
        const t = e(env), i = idx(env);
        if (isList(t)) { if (typeof i !== 'number') throw XE('L’index d’une liste doit être un nombre.'); if (i < 0 || i >= t.length) { if (opt) return null; throw XE('Il n’y a pas assez d’éléments dans l’énumération pour effectuer l’opération.'); } return cellRead(t[i]); }
        if (isTable(t)) {
          if (typeof i === 'number') { if (i < 0 || i >= t.rows.length) { if (opt) return null; throw XE('Il n’y a pas assez d’éléments dans l’énumération pour effectuer l’opération.'); } return rowRec(t, t.rows[i]); }
          if (isRec(i)) { const hits = t.rows.filter(r => Object.keys(i).every(k => eq(r[k], i[k]))); if (hits.length === 1) return rowRec(t, hits[0]); if (opt && !hits.length) return null; throw XE(hits.length ? 'La clé correspond à plusieurs lignes de la table.' : 'La clé ne correspond à aucune ligne de la table.'); }
        }
        throw XE(`Nous ne pouvons pas appliquer l’accès aux éléments au type ${typeName(t)}.`);
      };
    }
    case 'call': {
      const f = compile(n.f), args = n.args.map(compile);
      return env => {
        const fn = f(env);
        const vals = args.map(a => a(env));
        return invoke(fn, vals);
      };
    }
    case 'list': {
      const items = n.items.map(it => it.k === 'range' ? { range: true, a: compile(it.a), b: compile(it.b) } : compile(it));
      return env => { const out = []; for (const it of items) { if (typeof it === 'function') out.push(it(env)); else { const a = it.a(env), b = it.b(env); for (let k = a; k <= b; k++) out.push(k); } } return out; };
    }
    case 'rec': {
      const fields = n.fields.map(([k, e]) => [k, compile(e)]);
      return env => { const o = {}; const inner = new Env(env); for (const [k, e] of fields) inner.lazy(k, () => e(inner)); for (const [k] of fields) o[k] = inner.get(k); return o; };
    }
    case 'if': {
      const c = compile(n.c), a = compile(n.a), b = compile(n.b);
      return env => asLogical(c(env)) ? a(env) : b(env);
    }
    case 'let': {
      const binds = n.binds.map(([k, e]) => [k, compile(e)]), body = compile(n.body);
      return env => { const inner = new Env(env); for (const [k, e] of binds) inner.lazy(k, () => e(inner)); return body(inner); };
    }
    case 'each': { const body = compile(n.body); return env => new MFn([{ name: '_' }], body, env); }
    case 'fn': { const body = compile(n.body), params = n.params; return env => new MFn(params, body, env); }
    case 'try': {
      const e = compile(n.e), o = n.o ? compile(n.o) : null;
      return env => {
        try { const v = e(env); return o ? v : { HasError: false, Value: v }; }
        catch (err) { if (!(err instanceof MThrow)) throw err; return o ? o(env) : { HasError: true, Error: { Reason: err.reason, Message: err.mmsg, Detail: err.detail } }; }
      };
    }
    case 'err': {
      const e = compile(n.e);
      return env => { const v = e(env); if (isRec(v)) throw E(v.Reason || 'Expression.Error', v.Message || '', v.Detail); throw E('Expression.Error', textFrom(v) || ''); };
    }
    case 'and': { const a = compile(n.a), b = compile(n.b); return env => { const x = a(env); if (x === false) return false; if (x === true) { const y = b(env); if (y === null) return null; return asLogical(y); } if (x === null) { const y = b(env); if (y === false) return false; if (y === null || y === true) return null; asLogical(y); } return asLogical(x); }; }
    case 'or': { const a = compile(n.a), b = compile(n.b); return env => { const x = a(env); if (x === true) return true; if (x === false) { const y = b(env); if (y === null) return null; return asLogical(y); } if (x === null) { const y = b(env); if (y === true) return true; if (y === null || y === false) return null; asLogical(y); } return asLogical(x); }; }
    case 'not': { const e = compile(n.e); return env => { const v = e(env); if (v === null) return null; return !asLogical(v); }; }
    case 'neg': { const e = compile(n.e); return env => { const v = e(env); if (v === null) return null; if (typeof v !== 'number') throw XE(`L’opérateur - ne peut pas être appliqué au type ${typeName(v)}.`); return -v; }; }
    case 'type': { const t = n.t; return () => new MType(t); }
    case 'is': { const e = compile(n.e), t = n.t; return env => conforms(e(env), t); }
    case 'as': { const e = compile(n.e), t = n.t; return env => { const v = e(env); if (!conforms(v, t)) throw XE(`Nous ne pouvons pas convertir la valeur ${show1(v)} en type ${t}.`); return v; }; }
    case 'notimpl': return () => { throw E('Expression.Error', 'Pas encore implémenté.'); };
    case 'bin': {
      const a = compile(n.a), b = compile(n.b), op = n.op;
      switch (op) {
        case '=': return env => eq(a(env), b(env));
        case '<>': return env => !eq(a(env), b(env));
        case '<': return env => { const c = cmp(a(env), b(env)); return c === null ? null : c < 0; };
        case '>': return env => { const c = cmp(a(env), b(env)); return c === null ? null : c > 0; };
        case '<=': return env => { const c = cmp(a(env), b(env)); return c === null ? null : c <= 0; };
        case '>=': return env => { const c = cmp(a(env), b(env)); return c === null ? null : c >= 0; };
        case '&': return env => {
          const x = a(env), y = b(env);
          if (x === null || y === null) return null;
          if (typeof x === 'string' && typeof y === 'string') return x + y;
          if (isList(x) && isList(y)) return x.concat(y);
          if (isRec(x) && isRec(y)) return Object.assign({}, x, y);
          throw XE(`Nous ne pouvons pas appliquer l’opérateur & aux types ${typeName(x)} et ${typeName(y)}.`);
        };
        default: return env => {
          const x = a(env), y = b(env);
          if (x === null || y === null) return null;
          if (typeof x !== 'number' || typeof y !== 'number') throw XE(`Nous ne pouvons pas appliquer l’opérateur ${op} aux types ${typeName(x)} et ${typeName(y)}.`);
          if (op === '+') return x + y; if (op === '-') return x - y; if (op === '*') return x * y;
          return x / y;
        };
      }
    }
  }
  throw XE('Expression inconnue.');
}
function conforms(v, t) {
  switch (t) {
    case 'any': case 'anynonnull': return t === 'any' || v !== null;
    case 'null': return v === null;
    case 'text': return typeof v === 'string';
    case 'number': return typeof v === 'number';
    case 'logical': return typeof v === 'boolean';
    case 'date': return v instanceof MDate;
    case 'list': return isList(v);
    case 'record': return isRec(v);
    case 'table': return isTable(v);
    case 'function': return isFn(v);
    case 'type': return v instanceof MType;
    default: return v !== null;
  }
}
function invoke(fn, vals) {
  if (typeof fn === 'function') return fn(...vals);
  if (fn instanceof MFn) {
    const env = new Env(fn.env);
    fn.params.forEach((pr, i) => { if (i >= vals.length && !pr.optional) throw XE(`Le nombre d’arguments fournis ne correspond pas (${vals.length} au lieu de ${fn.params.length}).`); env.set(pr.name, i < vals.length ? vals[i] : null); });
    return fn.body(env);
  }
  throw XE(`Nous ne pouvons pas convertir une valeur de type ${typeName(fn)} en type Function.`);
}
const call1 = (f, x) => invoke(f, [x]);
function rowRec(t, r) { const o = {}; for (const c of t.cols) o[c.n] = r[c.n] === undefined ? null : r[c.n]; return o; }

/* ═══════════════════════ Bibliothèque standard (sous-ensemble) ═══════════════════════ */
const needText = (v, f) => { if (v === null) return null; if (typeof v !== 'string') throw XE(`Nous ne pouvons pas convertir la valeur ${show1(v)} en type Text.`, f); return v; };
const needNum = (v, f) => { if (typeof v !== 'number') throw XE(`Nous ne pouvons pas convertir la valeur ${show1(v)} en type Number.`, f); return v; };
const needList = (v, f) => { if (!isList(v)) throw XE(`Nous ne pouvons pas convertir une valeur de type ${typeName(v)} en type List.`, f); return v; };
const needTable = (v, f) => { if (!isTable(v)) throw XE(`Nous ne pouvons pas convertir une valeur de type ${typeName(v)} en type Table.`, f); return v; };
const optCulture = o => typeof o === 'string' ? o : isRec(o) && typeof o.Culture === 'string' ? o.Culture : MACHINE;
const ci = c => c === 'Comparer.OrdinalIgnoreCase' || (c && c.ignoreCase);
const STD = {
  'Text.From': (v, c) => v instanceof MErr ? cellRead(v) : textFrom(v, optCulture(c)),
  'Text.Trim': (t, chars) => { t = needText(t, 'Text.Trim'); if (t === null) return null; if (chars) { const cs = isList(chars) ? chars : [chars]; let a = 0, b = t.length; while (a < b && cs.includes(t[a])) a++; while (b > a && cs.includes(t[b - 1])) b--; return t.slice(a, b); } return t.replace(/^[\s\u00A0\u202F]+|[\s\u00A0\u202F]+$/g, ''); },
  'Text.TrimStart': t => { t = needText(t); return t === null ? null : t.replace(/^[\s\u00A0\u202F]+/, ''); },
  'Text.TrimEnd': t => { t = needText(t); return t === null ? null : t.replace(/[\s\u00A0\u202F]+$/, ''); },
  'Text.Clean': t => { t = needText(t, 'Text.Clean'); return t === null ? null : t.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); },
  'Text.Lower': (t, c) => { t = needText(t, 'Text.Lower'); return t === null ? null : t.toLocaleLowerCase(c || MACHINE); },
  'Text.Upper': (t, c) => { t = needText(t, 'Text.Upper'); return t === null ? null : t.toLocaleUpperCase(c || MACHINE); },
  'Text.Proper': t => { t = needText(t); return t === null ? null : t.toLocaleLowerCase('fr-FR').replace(/(^|[\s\-'’])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('fr-FR')); },
  'Text.Length': t => { t = needText(t, 'Text.Length'); return t === null ? null : [...t].length; },
  'Text.Middle': (t, s, n) => { t = needText(t, 'Text.Middle'); if (t === null) return null; const a = [...t]; return a.slice(s, n === undefined || n === null ? undefined : s + n).join(''); },
  'Text.Range': (t, s, n) => { t = needText(t); if (t === null) return null; const a = [...t]; if (s > a.length) throw XE('L’index est en dehors des limites du texte.'); return a.slice(s, n === undefined || n === null ? undefined : s + n).join(''); },
  'Text.Start': (t, n) => { t = needText(t); return t === null ? null : [...t].slice(0, n).join(''); },
  'Text.End': (t, n) => { t = needText(t); return t === null ? null : [...t].slice(Math.max(0, [...t].length - n)).join(''); },
  'Text.Split': (t, sep) => { t = needText(t, 'Text.Split'); if (t === null) throw XE('Nous ne pouvons pas convertir la valeur null en type Text.'); return t.split(sep); },
  'Text.Combine': (l, sep) => { needList(l, 'Text.Combine'); return l.filter(v => v !== null).map(v => needText(v, 'Text.Combine')).join(sep || ''); },
  'Text.Contains': (t, s, c) => { t = needText(t); if (t === null) return null; return ci(c) ? t.toLowerCase().includes(String(s).toLowerCase()) : t.includes(s); },
  'Text.StartsWith': (t, s, c) => { t = needText(t); if (t === null) return null; return ci(c) ? t.toLowerCase().startsWith(String(s).toLowerCase()) : t.startsWith(s); },
  'Text.EndsWith': (t, s, c) => { t = needText(t); if (t === null) return null; return ci(c) ? t.toLowerCase().endsWith(String(s).toLowerCase()) : t.endsWith(s); },
  'Text.Replace': (t, a, b) => { t = needText(t); return t === null ? null : t.split(a).join(b); },
  'Text.PositionOf': (t, s) => { t = needText(t); return t === null ? null : t.indexOf(s); },
  'Text.BeforeDelimiter': (t, d, idx) => { t = needText(t); if (t === null) return null; const i = nthIndex(t, d, idx); return i < 0 ? t : t.slice(0, i); },
  'Text.AfterDelimiter': (t, d, idx) => { t = needText(t); if (t === null) return null; const i = nthIndex(t, d, idx); return i < 0 ? '' : t.slice(i + d.length); },
  'Text.BetweenDelimiters': (t, a, b) => { t = needText(t); if (t === null) return null; const i = t.indexOf(a); if (i < 0) return ''; const rest = t.slice(i + a.length); const j = rest.indexOf(b); return j < 0 ? rest : rest.slice(0, j); },
  'Text.ToList': t => [...needText(t)],
  'Text.Repeat': (t, n) => needText(t).repeat(n),
  'Text.PadStart': (t, n, c) => needText(t).padStart(n, c || ' '),
  'Text.PadEnd': (t, n, c) => needText(t).padEnd(n, c || ' '),
  'Text.Select': (t, cs) => { t = needText(t); const l = isList(cs) ? cs : [cs]; return [...t].filter(ch => l.includes(ch)).join(''); },
  'Text.Remove': (t, cs) => { t = needText(t); const l = isList(cs) ? cs : [cs]; return [...t].filter(ch => !l.includes(ch)).join(''); },
  'Text.Reverse': t => [...needText(t)].reverse().join(''),
  'List.Count': l => needList(l, 'List.Count').length,
  'List.NonNullCount': l => needList(l).filter(v => v !== null).length,
  'List.Contains': (l, v, c) => needList(l, 'List.Contains').some(x => ci(c) && typeof x === 'string' && typeof v === 'string' ? x.toLowerCase() === v.toLowerCase() : eq(x, v)),
  'List.ContainsAny': (l, vs) => needList(l).some(x => vs.some(v => eq(x, v))),
  'List.ContainsAll': (l, vs) => vs.every(v => needList(l).some(x => eq(x, v))),
  'List.Transform': (l, f) => needList(l, 'List.Transform').map(x => call1(f, x)),
  'List.Select': (l, f) => needList(l, 'List.Select').filter(x => asLogical(call1(f, x))),
  'List.Sort': (l, o) => { const c = needList(l, 'List.Sort').slice().sort(sortCmp); return o === 1 || o === 'Order.Descending' ? c.reverse() : c; },
  'List.Distinct': l => { const seen = new Set(), out = []; for (const v of needList(l)) { const k = keyOf(v); if (!seen.has(k)) { seen.add(k); out.push(v); } } return out; },
  'List.Sum': l => { const v = needList(l).filter(x => x !== null); return v.length ? v.reduce((a, b) => a + needNum(b), 0) : null; },
  'List.Average': l => { const v = needList(l).filter(x => x !== null); return v.length ? v.reduce((a, b) => a + needNum(b), 0) / v.length : null; },
  'List.Min': l => { const v = needList(l).filter(x => x !== null); return v.length ? v.reduce((a, b) => cmp(a, b) <= 0 ? a : b) : null; },
  'List.Max': l => { const v = needList(l).filter(x => x !== null); return v.length ? v.reduce((a, b) => cmp(a, b) >= 0 ? a : b) : null; },
  'List.First': (l, d) => { needList(l); return l.length ? l[0] : (d === undefined ? null : d); },
  'List.Last': (l, d) => { needList(l); return l.length ? l[l.length - 1] : (d === undefined ? null : d); },
  'List.FirstN': (l, n) => needList(l).slice(0, n),
  'List.Skip': (l, n) => needList(l).slice(n === undefined ? 1 : n),
  'List.Difference': (a, b) => { const rest = needList(b).slice(); return needList(a).filter(x => { const i = rest.findIndex(y => eq(x, y)); if (i >= 0) { rest.splice(i, 1); return false; } return true; }); },
  'List.Intersect': ls => { const [a, ...o] = needList(ls); return a.filter(x => o.every(l => l.some(y => eq(x, y)))); },
  'List.Union': ls => { const out = []; for (const l of needList(ls)) for (const x of l) if (!out.some(y => eq(x, y))) out.push(x); return out; },
  'List.Combine': ls => [].concat(...needList(ls)),
  'List.RemoveNulls': l => needList(l).filter(x => x !== null),
  'List.IsEmpty': l => needList(l).length === 0,
  'List.PositionOf': (l, v) => needList(l).findIndex(x => eq(x, v)),
  'List.AnyTrue': l => needList(l).some(x => x === true),
  'List.AllTrue': l => needList(l).every(x => x === true),
  'List.Numbers': (s, n, inc) => Array.from({ length: n }, (_, i) => s + i * (inc === undefined ? 1 : inc)),
  'List.Reverse': l => needList(l).slice().reverse(),
  'List.Zip': ls => { const n = Math.max(...ls.map(l => l.length)); return Array.from({ length: n }, (_, i) => ls.map(l => l[i] === undefined ? null : l[i])); },
  'Table.RowCount': t => needTable(t, 'Table.RowCount').rows.length,
  'Table.ColumnCount': t => needTable(t).cols.length,
  'Table.ColumnNames': t => needTable(t, 'Table.ColumnNames').cols.map(c => c.n),
  'Table.HasColumns': (t, cs) => { needTable(t); return (isList(cs) ? cs : [cs]).every(c => t.cols.some(x => x.n === c)); },
  'Table.IsEmpty': t => needTable(t).rows.length === 0,
  'Table.Column': (t, c) => field(needTable(t), c),
  'Table.SelectRows': (t, f) => { needTable(t, 'Table.SelectRows'); return new MTable(t.cols, t.rows.filter(r => asLogical(call1(f, rowRec(t, r))))); },
  'Table.SelectColumns': (t, cs) => selectCols(needTable(t), isList(cs) ? cs : [cs]),
  'Table.RemoveColumns': (t, cs) => { needTable(t); const l = isList(cs) ? cs : [cs]; l.forEach(c => { if (!t.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); }); return new MTable(t.cols.filter(c => !l.includes(c.n)), t.rows); },
  'Table.Distinct': (t, cs) => distinctRows(needTable(t), cs ? (isList(cs) ? cs : [cs]) : null),
  'Table.FirstN': (t, n) => new MTable(needTable(t).cols, t.rows.slice(0, n)),
  'Table.LastN': (t, n) => new MTable(needTable(t).cols, t.rows.slice(Math.max(0, t.rows.length - n))),
  'Table.Skip': (t, n) => new MTable(needTable(t).cols, t.rows.slice(n === undefined ? 1 : n)),
  'Table.First': (t, d) => { needTable(t); return t.rows.length ? rowRec(t, t.rows[0]) : (d === undefined ? null : d); },
  'Table.Last': (t, d) => { needTable(t); return t.rows.length ? rowRec(t, t.rows[t.rows.length - 1]) : (d === undefined ? null : d); },
  'Table.ToRecords': t => needTable(t).rows.map(r => rowRec(t, r)),
  'Table.FromRecords': l => { needList(l); const names = []; l.forEach(r => Object.keys(r).forEach(k => { if (!names.includes(k)) names.push(k); })); return new MTable(names.map(n => ({ n, t: 'any' })), l.map(r => Object.assign({}, r))); },
  'Table.RenameColumns': (t, pairs) => renameCols(needTable(t), isList(pairs[0]) ? pairs : [pairs]),
  'Table.Combine': l => combine(needList(l, 'Table.Combine')),
  'Table.AddColumn': (t, name, f, ty) => { needTable(t); const k = ty instanceof MType ? MTYPE2KEY[ty.name] || 'any' : 'any'; return new MTable(t.cols.concat({ n: name, t: k }), t.rows.map(r => Object.assign({}, r, { [name]: safeCell(() => call1(f, rowRec(t, r))) }))); },
  'Table.TransformColumnTypes': (t, changes, cult) => { needTable(t); return typeChange(t, (isList(changes[0]) ? changes : [changes]).map(([c, ty]) => [c, ty instanceof MType ? MTYPE2KEY[ty.name] || 'any' : 'any', optCulture(cult)])); },
  'Table.Sort': (t, ks) => { needTable(t); const keys = (isList(ks) ? ks : [ks]).map(k => isList(k) ? [k[0], k[1] === 1 || k[1] === 'Order.Descending' ? 'desc' : 'asc'] : [k, 'asc']); return sortRows(t, keys); },
  'Table.Group': (t, keys, aggs) => { needTable(t); const ks = isList(keys) ? keys : [keys]; const groups = groupRows(t, ks); const as = isList(aggs[0]) ? aggs : [aggs]; return new MTable(ks.map(k => t.cols.find(c => c.n === k)).concat(as.map(a => ({ n: a[0], t: a[2] instanceof MType ? MTYPE2KEY[a[2].name] || 'any' : 'any' }))), groups.map(g => { const o = {}; ks.forEach(k => o[k] = g.rows[0][k]); as.forEach(a => { o[a[0]] = safeCell(() => call1(a[1], new MTable(t.cols, g.rows))); }); return o; })); },
  'Table.Contains': (t, r) => needTable(t).rows.some(x => Object.keys(r).every(k => eq(x[k], r[k]))),
  'Record.Field': (r, k) => field(r, k),
  'Record.FieldOrDefault': (r, k, d) => isRec(r) && Object.prototype.hasOwnProperty.call(r, k) ? r[k] : (d === undefined ? null : d),
  'Record.HasFields': (r, ks) => { if (!isRec(r)) throw XE(`Nous ne pouvons pas convertir une valeur de type ${typeName(r)} en type Record.`); return (isList(ks) ? ks : [ks]).every(k => Object.prototype.hasOwnProperty.call(r, k)); },
  'Record.FieldNames': r => Object.keys(r),
  'Record.FieldValues': r => Object.values(r),
  'Record.AddField': (r, k, v) => Object.assign({}, r, { [k]: v }),
  'Record.FieldCount': r => Object.keys(r).length,
  'Value.Is': (v, t) => conforms(v, t instanceof MType ? t.name : 'any'),
  'Value.Equals': (a, b) => eq(a, b),
  'Value.Type': v => new MType(typeName(v).toLowerCase()),
  'Number.FromText': (t, c) => { if (t === null) return null; const n = numFromText(needText(t), optCulture(c)); if (n === undefined || n === null) throw DF('Nous n’avons pas pu convertir en Number.', t); return n; },
  'Number.From': (v, c) => { if (v === null) return null; if (typeof v === 'number') return v; if (typeof v === 'boolean') return v ? 1 : 0; if (typeof v === 'string') { const n = numFromText(v, optCulture(c)); if (n === undefined || n === null) throw DF('Nous n’avons pas pu convertir en Number.', v); return n; } throw XE(`Nous ne pouvons pas convertir la valeur ${show1(v)} en type Number.`); },
  'Number.Round': (n, d) => n === null ? null : Math.round(needNum(n) * Math.pow(10, d || 0)) / Math.pow(10, d || 0),
  'Number.RoundDown': n => n === null ? null : Math.floor(needNum(n)),
  'Number.RoundUp': n => n === null ? null : Math.ceil(needNum(n)),
  'Number.Abs': n => n === null ? null : Math.abs(needNum(n)),
  'Number.ToText': (n, f, c) => n === null ? null : textFrom(needNum(n), optCulture(c)),
  'Number.IsEven': n => needNum(n) % 2 === 0, 'Number.IsOdd': n => Math.abs(needNum(n) % 2) === 1,
  'Number.Mod': (a, b) => needNum(a) % needNum(b),
  'Int64.From': (v, c) => { const n = STD['Number.From'](v, c); return n === null ? null : Math.round(n); },
  'Logical.From': v => v === null ? null : typeof v === 'boolean' ? v : typeof v === 'number' ? v !== 0 : (() => { const s = String(v).toLowerCase(); if (s === 'true') return true; if (s === 'false') return false; throw DF('Nous n’avons pas pu convertir en Logical.', v); })(),
  'Logical.FromText': v => STD['Logical.From'](v),
  'Date.FromText': (t, o) => {
    if (t === null) return null;
    needText(t, 'Date.FromText');
    const fmt = isRec(o) && typeof o.Format === 'string' ? o.Format : null, cult = optCulture(o);
    const d = dateFromText(t, cult, fmt);
    if (d === undefined) throw DF('Nous n’avons pas pu analyser l’entrée fournie en tant que valeur Date.', t);
    return d;
  },
  'Date.From': (v, c) => { if (v === null) return null; if (v instanceof MDate) return v; if (typeof v === 'string') return STD['Date.FromText'](v, c); const r = convert(v, 'date'); if (r instanceof MErr) throw DF(r.message, v); return r; },
  'Date.Year': d => d === null ? null : needDate(d).y, 'Date.Month': d => d === null ? null : needDate(d).m, 'Date.Day': d => d === null ? null : needDate(d).d,
  'Date.ToText': (d, f) => { if (d === null) return null; needDate(d); const fmt = isRec(f) ? f.Format : typeof f === 'string' ? f : null; if (fmt === 'yyyy-MM-dd') return d.iso(); return d.fr(); },
  'Date.AddDays': (d, n) => { needDate(d); const dt = new Date(Date.UTC(d.y, d.m - 1, d.d) + n * 864e5); return new MDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()); },
  'Date.IsInCurrentMonth': () => false,
  '#table': (cols, rows) => {
    const names = Array.isArray(cols) ? cols.map(c => String(c)) : cols && cols.cols ? cols.cols.map(c => c.n) : null;
    if (!names) throw XE('#table attend une liste de noms de colonnes.');
    needList(rows);
    return new MTable(names.map(n => ({ n, t: 'any' })), rows.map(r => { needList(r); const o = {}; names.forEach((n, i) => o[n] = i < r.length ? r[i] : null); return o; }));
  },
  '#date': (y, m, d) => { if (!MDate.ok(y, m, d)) throw XE('Les arguments ne permettent pas de construire une date valide.'); return new MDate(y, m, d); },
  'Duration.Days': () => 0,
  'Int64.Type': new MType('Int64.Type'), 'Currency.Type': new MType('Currency.Type'), 'Percentage.Type': new MType('Percentage.Type'), 'Number.Type': new MType('number'), 'Text.Type': new MType('text'), 'Date.Type': new MType('date'), 'Logical.Type': new MType('logical'),
  'Order.Ascending': 0, 'Order.Descending': 1, 'Comparer.OrdinalIgnoreCase': { ignoreCase: true }, 'Comparer.Ordinal': { ignoreCase: false },
  'JoinKind.LeftOuter': 1, 'JoinKind.Inner': 0, 'JoinKind.RightOuter': 2, 'JoinKind.FullOuter': 3, 'JoinKind.LeftAnti': 4, 'JoinKind.RightAnti': 5,
  'Culture.Current': MACHINE
};
const viaOp = (op, T, s) => OPS[op].apply(needTable(T, 'Table'), s, null);
Object.assign(STD, {
  'Table.PromoteHeaders': t => promote(needTable(t)),
  'Table.AddIndexColumn': (t, name, start, incr) => viaOp('index', t, { col: name, start: start === undefined ? 0 : start, incr: incr === undefined ? 1 : incr }),
  'Table.ExpandRecordColumn': (t, col, fields, names) => viaOp('expand', t, { col, fields, names: names || fields, record: true }),
  'Table.ExpandTableColumn': (t, col, fields, names) => viaOp('expand', t, { col, fields, names: names || fields }),
  'Table.ReorderColumns': (t, order) => { needTable(t); const rest = t.cols.map(c => c.n).filter(n => !order.includes(n)); const pos = []; let k = 0; const full = t.cols.map(c => order.includes(c.n) ? order[k++] : c.n); void rest; void pos; return selectCols(t, full); },
  'Table.DuplicateColumn': (t, col, as) => viaOp('dup', t, { col, as }),
  'Table.FillDown': (t, cols) => viaOp('fill', t, { cols, dir: 'down' }),
  'Table.FillUp': (t, cols) => viaOp('fill', t, { cols, dir: 'up' }),
  'Table.RowCount': t => needTable(t, 'Table.RowCount').rows.length,
  'Table.RemoveFirstN': (t, n) => new MTable(needTable(t).cols, t.rows.slice(n === undefined ? 1 : n)),
  'Table.RemoveLastN': (t, n) => new MTable(needTable(t).cols, t.rows.slice(0, Math.max(0, t.rows.length - (n === undefined ? 1 : n)))),
  'Table.RemoveRowsWithErrors': (t, cols) => viaOp('removeErrors', t, { cols }),
  'Table.SelectRowsWithErrors': (t, cols) => viaOp('keepErrors', t, { cols }),
  'Table.ReplaceValue': (t, a, b, rep, cols) => viaOp('replace', t, { from: a, to: b, whole: rep !== 'text', cols }),
  'Replacer.ReplaceValue': 'value', 'Replacer.ReplaceText': 'text',
  'Table.TransformColumns': (t, specs) => { needTable(t); const l = isList(specs[0]) ? specs : [specs]; const cols = t.cols.map(c => { const sp = l.find(x => x[0] === c.n); return sp && sp[2] instanceof MType ? { ...c, t: MTYPE2KEY[sp[2].name] || 'any' } : c; }); return new MTable(cols, t.rows.map(r => { const o = Object.assign({}, r); for (const [c, f] of l) o[c] = safeCell(() => call1(f, cellRead(o[c]))); return o; })); },
  'Table.NestedJoin': (a, ka, b, kb, name, kind) => { const K = { 0: 'inner', 1: 'leftouter', 2: 'rightouter', 3: 'fullouter', 4: 'leftanti', 5: 'rightanti' }; const ctx = { query: () => needTable(b), qname: () => name }; return OPS.merge.apply(needTable(a), { left: isList(ka) ? ka : [ka], right: isList(kb) ? kb : [kb], with: '_', as: name, kind: K[kind === undefined ? 1 : kind] }, ctx); },
  'Table.Join': (a, ka, b, kb, kind) => { const K = { 0: 'inner', 1: 'leftouter' }; const ctx = { query: () => needTable(b), qname: () => '__j' }; const m = OPS.merge.apply(needTable(a), { left: isList(ka) ? ka : [ka], right: isList(kb) ? kb : [kb], with: '_', as: '__j', kind: K[kind || 0] }, ctx); const extra = b.cols.map(c => c.n).filter(n => !a.cols.some(x => x.n === n)); return OPS.expand.apply(m, { col: '__j', fields: extra, names: extra }, null); },
  'Table.SplitColumn': (t, col, splitter, names) => { const d = splitter && splitter.delim; return viaOp('split', t, { col, delim: d, at: 'each', into: 'cols', n: isList(names) ? names.length : names || 2 }); },
  'Splitter.SplitTextByDelimiter': d => ({ delim: d }),
  'QuoteStyle.Csv': 1, 'QuoteStyle.None': 0,
  'File.Contents': path => ({ file: String(path).split(/[\\/]/).pop() }),
  'Excel.Workbook': f => { const file = FILEREG[f && f.file]; if (!file || file.kind !== 'xlsx') throw E('DataSource.Error', `Impossible de trouver le fichier « ${f && f.file} ».`); return OPS.excel.apply(null, { file: f.file }, { file: n => FILEREG[n] }); },
  'Csv.Document': (f, o) => { const file = FILEREG[f && f.file]; if (!file || file.kind !== 'csv') throw E('DataSource.Error', `Impossible de trouver le fichier « ${f && f.file} ».`); return OPS.csv.apply(null, { file: f.file, delim: isRec(o) && o.Delimiter !== undefined ? o.Delimiter : ',', enc: isRec(o) && o.Encoding || 65001, columns: isRec(o) && o.Columns }, { file: n => FILEREG[n] }); }
});
let FILEREG = {};
function needDate(d) { if (!(d instanceof MDate)) throw XE(`Nous ne pouvons pas convertir la valeur ${show1(d)} en type Date.`); return d; }
function nthIndex(t, d, idx) {
  let n = 0, from = false;
  if (isList(idx)) { n = idx[0] || 0; from = idx[1] === 1 || idx[1] === 'RelativePosition.FromEnd'; } else if (typeof idx === 'number') n = idx;
  if (from) { let i = t.length; for (let k = 0; k <= n; k++) { i = t.lastIndexOf(d, i - 1); if (i < 0) return -1; } return i; }
  let i = -1; for (let k = 0; k <= n; k++) { i = t.indexOf(d, i + 1); if (i < 0) return -1; } return i;
}
STD['RelativePosition.FromStart'] = 0; STD['RelativePosition.FromEnd'] = 1;
function safeCell(f) { try { const v = f(); return v === undefined ? null : v; } catch (e) { if (e instanceof MThrow) return new MErr(e.reason, e.mmsg, e.detail); throw e; } }

/* Découpe « let a = …, b = … in b » en [nom, code] en respectant parenthèses, crochets, accolades et let imbriqués */
function splitLet(src, toks) {
  const out = []; let i = 1, depth = 0, lets = 0;
  let name = null, start = -1;
  for (; i < toks.length; i++) {
    const t = toks[i];
    if (name === null) { if (t.t === 'id') { name = t.v; if (toks[i + 1] && toks[i + 1].v === '=') { i++; start = toks[i].e; } } continue; }
    if (t.t === 'p' && '([{'.includes(t.v)) depth++;
    else if (t.t === 'p' && ')]}'.includes(t.v)) depth--;
    else if (t.t === 'kw' && t.v === 'let') lets++;
    else if (t.t === 'kw' && t.v === 'in') { if (depth === 0 && lets === 0) { out.push([name, src.slice(start, t.s).trim()]); break; } lets--; }
    else if (t.t === 'p' && t.v === ',' && depth === 0 && lets === 0) { out.push([name, src.slice(start, t.s).trim()]); name = null; }
  }
  return out;
}

/* Compilation mise en cache d'une expression M */
const CACHE = new Map();
function compileSrc(src) {
  let c = CACHE.get(src);
  if (!c) {
    const clean = String(src).replace(/^\s*=\s*/, '');
    try { c = { fn: compile(parse(clean)) }; } catch (e) { if (!(e instanceof MThrow)) throw e; c = { err: e }; }
    if (CACHE.size > 400) CACHE.clear();
    CACHE.set(src, c);
  }
  return c;
}
function checkSyntax(src) { const c = compileSrc(src); return c.err ? { ok: false, msg: c.err.mmsg, pos: c.err.pos } : { ok: true }; }
/* Évaluation d'une expression avec un environnement de variables (étapes, requêtes) */
function evalExpr(src, vars, row) {
  const c = compileSrc(src);
  if (c.err) throw c.err;
  const env = new Env(null);
  if (vars) for (const k of Object.keys(vars)) { const v = vars[k]; if (typeof v === 'function' && v.lazy) env.lazy(k, v); else env.set(k, v); }
  if (row !== undefined) env.set('_', row);
  return c.fn(env);
}

/* ═══════════════════════ Opérations de table ═══════════════════════ */
function selectCols(t, names) {
  names.forEach(c => { if (!t.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
  return new MTable(names.map(n => t.cols.find(c => c.n === n)), t.rows);
}
function renameCols(t, pairs) {
  const map = new Map();
  for (const [a, b] of pairs) { if (!t.cols.some(c => c.n === a)) throw XE(`La colonne « ${a} » de la table est introuvable.`, a); map.set(a, b); }
  const cols = t.cols.map(c => map.has(c.n) ? { ...c, n: map.get(c.n) } : c);
  const names = cols.map(c => c.n);
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) throw XE(`La colonne « ${dup} » existe déjà dans la table.`, dup);
  const rows = t.rows.map(r => { const o = {}; for (const c of t.cols) o[map.has(c.n) ? map.get(c.n) : c.n] = r[c.n]; return o; });
  return new MTable(cols, rows);
}
function typeChange(t, changes) {
  const cols = t.cols.map(c => ({ ...c }));
  for (const [n] of changes) if (!cols.some(c => c.n === n)) throw XE(`La colonne « ${n} » de la table est introuvable.`, n);
  const rows = t.rows.map(r => { const o = Object.assign({}, r); for (const [n, ty, loc] of changes) o[n] = convert(o[n], ty, loc); return o; });
  for (const [n, ty] of changes) cols.find(c => c.n === n).t = ty;
  return new MTable(cols, rows);
}
function distinctRows(t, cols) {
  const keys = cols || t.cols.map(c => c.n);
  keys.forEach(c => { if (!t.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
  const seen = new Set();
  return new MTable(t.cols, t.rows.filter(r => { const k = keys.map(c => keyOf(r[c])).join('|'); if (seen.has(k)) return false; seen.add(k); return true; }));
}
function groupRows(t, keys) {
  keys.forEach(c => { if (!t.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
  const map = new Map(), out = [];
  for (const r of t.rows) { const k = keys.map(c => keyOf(r[c])).join('|'); let g = map.get(k); if (!g) { g = { rows: [] }; map.set(k, g); out.push(g); } g.rows.push(r); }
  return out;
}
function sortRows(t, keys) {
  keys.forEach(([c]) => { if (!t.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
  const rows = t.rows.map((r, i) => [r, i]).sort((a, b) => { for (const [c, d] of keys) { const v = sortCmp(a[0][c], b[0][c]); if (v) return d === 'desc' ? -v : v; } return a[1] - b[1]; }).map(x => x[0]);
  return new MTable(t.cols, rows);
}
function combine(tables) {
  const cols = [];
  for (const t of tables) { needTable(t, 'Table.Combine'); for (const c of t.cols) { const ex = cols.find(x => x.n === c.n); if (!ex) cols.push({ ...c }); else if (ex.t !== c.t) ex.t = 'any'; } }
  for (const c of cols) if (!tables.every(t => t.cols.some(x => x.n === c.n))) { /* colonne absente d'une table : valeurs null, type conservé si identique */ }
  const rows = [];
  for (const t of tables) for (const r of t.rows) { const o = {}; for (const c of cols) o[c.n] = r[c.n] === undefined ? null : r[c.n]; rows.push(o); }
  return new MTable(cols, rows);
}
function promote(t) {
  if (!t.rows.length) return new MTable(t.cols.map(c => ({ ...c, t: 'any' })), []);
  const first = t.rows[0];
  const used = new Map();
  const names = t.cols.map((c, i) => {
    let v = first[c.n];
    let n = v === null || v === undefined || v === '' ? `Column${i + 1}` : v instanceof MDate ? v.fr() : typeof v === 'number' ? textFrom(v, MACHINE) : String(v);
    if (used.has(n)) { let k = used.get(n); let m; do { m = `${n}_${k++}`; } while (used.has(m)); used.set(n, k); n = m; }
    used.set(n, used.get(n) || 1);
    return n;
  });
  const cols = names.map(n => ({ n, t: 'any' }));
  const rows = t.rows.slice(1).map(r => { const o = {}; t.cols.forEach((c, i) => o[names[i]] = r[c.n]); return o; });
  return new MTable(cols, rows);
}
function parseCsv(text, delim, quote) {
  const lines = text.split('\n');
  if (!delim) return lines.map(l => [l]);
  return lines.map(l => {
    if (quote === false || !l.includes('"')) return l.split(delim);
    const out = []; let cur = '', q = false;
    for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === delim) { out.push(cur); cur = ''; } else cur += c; }
    out.push(cur); return out;
  });
}
/* Mauvais encodage : le simulateur reproduit les caractères corrompus d'un UTF-8 lu en Windows-1252 */
function decodeAs(text, enc, bom) {
  if (enc === 65001) return text;
  if (enc === 1252 || enc === 28591) return (bom ? 'ï»¿' : '') + text.replace(/[\u0080-\uFFFF]/g, ch => { const b = Buffer_from(ch); return b; });
  if (enc === 20127) return text.replace(/[^\x00-\x7F]/g, '?');
  return text;
}
function Buffer_from(ch) {
  const bytes = unescape(encodeURIComponent(ch));
  const CP = { 0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8A: 'Š', 0x8B: '‹', 0x8C: 'Œ', 0x8E: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜', 0x99: '™', 0x9A: 'š', 0x9B: '›', 0x9C: 'œ', 0x9E: 'ž', 0x9F: 'Ÿ' };
  return [...bytes].map(b => { const c = b.charCodeAt(0); return CP[c] || (c >= 0xA0 ? String.fromCharCode(c) : '�'); }).join('');
}

/* ═══════════════════════ Étapes : définitions ═══════════════════════ */
const qid = n => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n) && !KW.has(n) ? n : `#"${String(n).replace(/"/g, '""')}"`;
const mstr = s => s === null || s === undefined ? 'null' : typeof s === 'number' ? String(s) : typeof s === 'boolean' ? String(s) : `"${String(s).replace(/"/g, '""')}"`;
const mlist = l => `{${l.map(mstr).join(', ')}}`;
const fieldRef = n => /^[A-Za-z_][A-Za-z0-9_ ]*$/.test(n) && !/^\s|\s$/.test(n) && !KW.has(n) ? `[${n}]` : `[#"${n.replace(/"/g, '""')}"]`;
const FILTER_OPS = {
  eq: ['est égal à', (v, x) => eq(v, x), (c, x) => `${fieldRef(c)} = ${mstr(x)}`],
  ne: ['n’est pas égal à', (v, x) => !eq(v, x), (c, x) => `${fieldRef(c)} <> ${mstr(x)}`],
  begins: ['commence par', (v, x) => typeof v === 'string' && v.startsWith(x), (c, x) => `Text.StartsWith(${fieldRef(c)}, ${mstr(x)})`],
  nbegins: ['ne commence pas par', (v, x) => !(typeof v === 'string' && v.startsWith(x)), (c, x) => `not Text.StartsWith(${fieldRef(c)}, ${mstr(x)})`],
  ends: ['se termine par', (v, x) => typeof v === 'string' && v.endsWith(x), (c, x) => `Text.EndsWith(${fieldRef(c)}, ${mstr(x)})`],
  nends: ['ne se termine pas par', (v, x) => !(typeof v === 'string' && v.endsWith(x)), (c, x) => `not Text.EndsWith(${fieldRef(c)}, ${mstr(x)})`],
  contains: ['contient', (v, x) => typeof v === 'string' && v.includes(x), (c, x) => `Text.Contains(${fieldRef(c)}, ${mstr(x)})`],
  ncontains: ['ne contient pas', (v, x) => !(typeof v === 'string' && v.includes(x)), (c, x) => `not Text.Contains(${fieldRef(c)}, ${mstr(x)})`],
  gt: ['est supérieur à', (v, x) => { const c = safeCmp(v, x); return c !== null && c > 0; }, (c, x) => `${fieldRef(c)} > ${mstr(x)}`],
  ge: ['est supérieur ou égal à', (v, x) => { const c = safeCmp(v, x); return c !== null && c >= 0; }, (c, x) => `${fieldRef(c)} >= ${mstr(x)}`],
  lt: ['est inférieur à', (v, x) => { const c = safeCmp(v, x); return c !== null && c < 0; }, (c, x) => `${fieldRef(c)} < ${mstr(x)}`],
  le: ['est inférieur ou égal à', (v, x) => { const c = safeCmp(v, x); return c !== null && c <= 0; }, (c, x) => `${fieldRef(c)} <= ${mstr(x)}`]
};
function safeCmp(a, b) { try { return cmp(a, b); } catch (e) { return null; } }
const JOINS = {
  leftouter: ['Externe gauche (tout de la première, correspondance de la deuxième)', 'JoinKind.LeftOuter'],
  rightouter: ['Externe droite (tout de la deuxième, correspondance de la première)', 'JoinKind.RightOuter'],
  fullouter: ['Externe entière (toutes les lignes des deux)', 'JoinKind.FullOuter'],
  inner: ['Interne (lignes correspondantes uniquement)', 'JoinKind.Inner'],
  leftanti: ['Anti gauche (lignes de la première uniquement)', 'JoinKind.LeftAnti'],
  rightanti: ['Anti droite (lignes de la deuxième uniquement)', 'JoinKind.RightAnti']
};
const AGGS = { count: 'Nombre de lignes', countd: 'Compter les lignes distinctes', sum: 'Somme', avg: 'Moyenne', min: 'Min', max: 'Max', all: 'Toutes les lignes' };
const FMT_FN = { lower: ['minuscules', 'Text.Lower', 'Texte en minuscules'], upper: ['MAJUSCULES', 'Text.Upper', 'Texte en majuscules'], proper: ['Majuscule à chaque mot', 'Text.Proper', 'Chaque mot en majuscule'], trim: ['Supprimer les espaces', 'Text.Trim', 'Texte découpé'], clean: ['Nettoyer', 'Text.Clean', 'Texte nettoyé'] };
const condHolds = (v, cl) => {
  const x = cl.val;
  if (x === null) return cl.op === 'eq' ? v === null : cl.op === 'ne' ? v !== null : false;
  const f = FILTER_OPS[cl.op]; return f ? f[1](v, x) : false;
};
const valOf = (spec, r) => spec && spec.col ? (r[spec.col] === undefined ? null : r[spec.col]) : spec ? spec.v : null;
function rowFilter(cond) {
  if (cond.kind === 'values') { const set = new Set(cond.values.map(keyOf)); return cond.exclude ? (r => !set.has(keyOf(r[cond.col]))) : (r => set.has(keyOf(r[cond.col]))); }
  if (cond.kind === 'nonempty') return r => r[cond.col] !== null && r[cond.col] !== undefined && r[cond.col] !== '';
  if (cond.kind === 'ops') {
    const tests = cond.clauses.map(cl => r => condHolds(r[cond.col], cl));
    return cond.join === 'or' ? (r => tests.some(t => t(r))) : (r => tests.every(t => t(r)));
  }
  return () => true;
}
function filterM(c) {
  if (c.kind === 'values') {
    if (c.exclude) return c.values.map(v => `${fieldRef(c.col)} <> ${mstr(v)}`).join(' and ');
    return c.values.map(v => `${fieldRef(c.col)} = ${mstr(v)}`).join(' or ');
  }
  if (c.kind === 'nonempty') return `${fieldRef(c.col)} <> null and ${fieldRef(c.col)} <> ""`;
  if (c.kind === 'ops') return c.clauses.map(cl => cl.val === null ? `${fieldRef(c.col)} ${cl.op === 'ne' ? '<>' : '='} null` : FILTER_OPS[cl.op][2](c.col, cl.val)).join(c.join === 'or' ? ' or ' : ' and ');
  return 'true';
}
function condM(s) {
  const out = o => o.col ? fieldRef(o.col) : mstr(o.v);
  let m = '';
  s.clauses.forEach((cl, i) => {
    const test = cl.val && cl.val.col ? (cl.op === 'ne' ? `${fieldRef(cl.col)} <> ${fieldRef(cl.val.col)}` : `${fieldRef(cl.col)} = ${fieldRef(cl.val.col)}`) : (cl.val.v === null ? `${fieldRef(cl.col)} ${cl.op === 'ne' ? '<>' : '='} null` : FILTER_OPS[cl.op][2](cl.col, cl.val.v));
    m += `${i ? ' else ' : ''}if ${test} then ${out(cl.out)}`;
  });
  return `${m} else ${out(s.else)}`;
}
const tyM = t => (TYPES[t] || TYPES.any).m;
/* Chaque opération : application, formule M, nom par défaut, paramètres modifiables (engrenage) */
const OPS = {
  excel: {
    name: 'Source', gear: true,
    apply(T, s, ctx) {
      const f = ctx.file(s.file);
      if (!f || f.kind !== 'xlsx') throw E('DataSource.Error', `Impossible de trouver le fichier « ${s.file} ».`, s.file);
      return new MTable([{ n: 'Name', t: 'text' }, { n: 'Data', t: 'table' }, { n: 'Item', t: 'text' }, { n: 'Kind', t: 'text' }, { n: 'Hidden', t: 'bool' }],
        f.sheets.map(sh => ({ Name: sh.name, Data: sheetTable(sh), Item: sh.name, Kind: 'Sheet', Hidden: false })));
    },
    m: s => `Excel.Workbook(File.Contents("C:\\Users\\toi\\Documents\\Wonderland\\${(ctxDir(s.file))}${s.file}"), null, true)`
  },
  nav: {
    name: 'Navigation', gear: true,
    apply(T, s) {
      const r = T.rows.find(x => x.Item === s.item);
      if (!r) throw XE(`La clé ne correspond à aucune ligne de la table : « ${s.item} ».`, s.item);
      return r.Data;
    },
    m: (s, prev) => `${prev}{[Item="${s.item}",Kind="Sheet"]}[Data]`
  },
  csv: {
    name: 'Source', gear: true,
    apply(T, s, ctx) {
      const f = ctx.file(s.file);
      if (!f || f.kind !== 'csv') throw E('DataSource.Error', `Impossible de trouver le fichier « ${s.file} ».`, s.file);
      const text = decodeAs(f.text, s.enc || 65001, f.bom);
      const lines = parseCsv(text, s.delim === undefined ? ';' : s.delim, s.quote);
      const n = s.columns || Math.max(...lines.map(l => l.length));
      const cols = Array.from({ length: n }, (_, i) => ({ n: `Column${i + 1}`, t: 'any' }));
      return new MTable(cols, lines.map(l => { const o = {}; cols.forEach((c, i) => o[c.n] = i < l.length ? l[i] : null); return o; }));
    },
    m: s => `Csv.Document(File.Contents("C:\\Users\\toi\\Documents\\Wonderland\\${ctxDir(s.file)}${s.file}"), [Delimiter="${s.delim === '\t' ? '#(tab)' : s.delim}", Columns=${s.columns || '…'}, Encoding=${s.enc || 65001}, QuoteStyle=QuoteStyle.None])`
  },
  ref: {
    name: 'Source',
    apply(T, s, ctx) { return ctx.query(s.of); },
    m: (s, prev, ctx) => qid(ctx.qname(s.of))
  },
  enter: {
    name: 'Source', gear: true,
    apply(T, s) { return new MTable(s.cols.map(n => ({ n, t: 'any' })), s.rows.map(r => { const o = {}; s.cols.forEach((n, i) => o[n] = r[i] === undefined || r[i] === '' ? null : r[i]); return o; })); },
    m: s => `Table.FromRows(Json.Document(Binary.Decompress(Binary.FromText("i45W…", BinaryEncoding.Base64), Compression.Deflate)), let _t = ((type nullable text) meta [Serialized.Text = true]) in type table [${s.cols.map(c => `${qid(c)} = _t`).join(', ')}])`
  },
  append: {
    name: 'Source',
    apply(T, s, ctx) { const list = (s.base ? [T] : []).concat(s.with.map(id => ctx.query(id))); return combine(list); },
    m: (s, prev, ctx) => `Table.Combine({${(s.base ? [prev] : []).concat(s.with.map(id => qid(ctx.qname(id)))).join(', ')}})`,
    label: s => s.base ? 'Requête ajoutée' : 'Source'
  },
  promote: {
    name: 'En-têtes promus',
    apply(T) { return promote(T); },
    m: (s, prev) => `Table.PromoteHeaders(${prev}, [PromoteAllScalars=true])`
  },
  type: {
    name: 'Type modifié',
    apply(T, s) { return typeChange(T, s.changes.map(([c, t, loc]) => [c, t, loc || s.loc || MACHINE])); },
    m: (s, prev) => { const loc = (s.changes.find(c => c[2]) || [])[2] || s.loc; return `Table.TransformColumnTypes(${prev}, {${s.changes.map(c => `{${mstr(c[0])}, ${tyM(c[1])}}`).join(', ')}}${loc ? `, ${mstr(loc)}` : ''})`; }
  },
  rename: {
    name: 'Colonnes renommées',
    apply(T, s) { return renameCols(T, s.pairs); },
    m: (s, prev) => `Table.RenameColumns(${prev}, {${s.pairs.map(p => `{${mstr(p[0])}, ${mstr(p[1])}}`).join(', ')}})`
  },
  index: {
    name: 'Index ajouté', gear: true,
    apply(T, s) { const name = s.col || 'Index'; if (T.cols.some(c => c.n === name)) throw XE(`La colonne « ${name} » existe déjà dans la table.`, name); return new MTable(T.cols.concat({ n: name, t: 'int' }), T.rows.map((r, i) => Object.assign({}, r, { [name]: s.start + i * s.incr }))); },
    m: (s, prev) => `Table.AddIndexColumn(${prev}, ${mstr(s.col || 'Index')}, ${s.start}, ${s.incr}, Int64.Type)`
  },
  skip: {
    name: 'Premières lignes supprimées', gear: true,
    apply(T, s) { return new MTable(T.cols, T.rows.slice(s.n)); },
    m: (s, prev) => `Table.Skip(${prev}, ${s.n})`
  },
  removeBottom: {
    name: 'Dernières lignes supprimées', gear: true,
    apply(T, s) { return new MTable(T.cols, T.rows.slice(0, Math.max(0, T.rows.length - s.n))); },
    m: (s, prev) => `Table.RemoveLastN(${prev}, ${s.n})`
  },
  keepTop: { name: 'Premières lignes conservées', gear: true, apply(T, s) { return new MTable(T.cols, T.rows.slice(0, s.n)); }, m: (s, prev) => `Table.FirstN(${prev}, ${s.n})` },
  keepBottom: { name: 'Dernières lignes conservées', gear: true, apply(T, s) { return new MTable(T.cols, T.rows.slice(Math.max(0, T.rows.length - s.n))); }, m: (s, prev) => `Table.LastN(${prev}, ${s.n})` },
  removeBlank: { name: 'Lignes vides supprimées', apply(T) { return new MTable(T.cols, T.rows.filter(r => T.cols.some(c => r[c.n] !== null && r[c.n] !== '' && r[c.n] !== undefined))); }, m: (s, prev) => `Table.SelectRows(${prev}, each not List.IsEmpty(List.RemoveMatchingItems(Record.FieldValues(_), {"", null})))` },
  removeErrors: { name: 'Erreurs supprimées', apply(T, s) { const cs = s.cols || T.cols.map(c => c.n); return new MTable(T.cols, T.rows.filter(r => !cs.some(c => r[c] instanceof MErr))); }, m: (s, prev) => `Table.RemoveRowsWithErrors(${prev}, ${mlist(s.cols)})` },
  keepErrors: { name: 'Erreurs conservées', apply(T, s) { const cs = s.cols || T.cols.map(c => c.n); return new MTable(T.cols, T.rows.filter(r => cs.some(c => r[c] instanceof MErr))); }, m: (s, prev) => `Table.SelectRowsWithErrors(${prev}, ${mlist(s.cols)})` },
  distinct: { name: 'Doublons supprimés', apply(T, s) { return distinctRows(T, s.cols); }, m: (s, prev) => `Table.Distinct(${prev}, ${mlist(s.cols)})` },
  keepDups: {
    name: 'Doublons conservés',
    apply(T, s) {
      s.cols.forEach(c => { if (!T.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
      const cnt = new Map(); const k = r => s.cols.map(c => keyOf(r[c])).join('|');
      T.rows.forEach(r => cnt.set(k(r), (cnt.get(k(r)) || 0) + 1));
      return new MTable(T.cols, T.rows.filter(r => cnt.get(k(r)) > 1));
    },
    m: (s, prev) => `let columnNames = ${mlist(s.cols)}, addCount = Table.Group(${prev}, columnNames, {{"Count", Table.RowCount, type number}}), selectDuplicates = Table.SelectRows(addCount, each [Count] > 1), removeCount = Table.RemoveColumns(selectDuplicates, "Count") in Table.Join(${prev}, columnNames, removeCount, columnNames, JoinKind.Inner)`
  },
  filter: {
    name: 'Lignes filtrées', gear: false,
    apply(T, s) { if (!T.cols.some(c => c.n === s.cond.col)) throw XE(`La colonne « ${s.cond.col} » de la table est introuvable.`, s.cond.col); const f = rowFilter(s.cond); return new MTable(T.cols, T.rows.filter(r => { const v = r[s.cond.col]; if (v instanceof MErr) return false; return f(r); })); },
    m: (s, prev) => `Table.SelectRows(${prev}, each ${filterM(s.cond)})`
  },
  sort: { name: 'Lignes triées', apply(T, s) { return sortRows(T, s.keys); }, m: (s, prev) => `Table.Sort(${prev}, {${s.keys.map(k => `{${mstr(k[0])}, ${k[1] === 'desc' ? 'Order.Descending' : 'Order.Ascending'}}`).join(', ')}})` },
  removeCols: { name: 'Colonnes supprimées', apply(T, s) { s.cols.forEach(c => { if (!T.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); }); return new MTable(T.cols.filter(c => !s.cols.includes(c.n)), T.rows); }, m: (s, prev) => `Table.RemoveColumns(${prev}, ${mlist(s.cols)})` },
  selectCols: { name: 'Autres colonnes supprimées', gear: true, apply(T, s) { return selectCols(T, s.cols); }, m: (s, prev) => `Table.SelectColumns(${prev}, ${mlist(s.cols)})` },
  reorder: { name: 'Colonnes permutées', apply(T, s) { return selectCols(T, s.order); }, m: (s, prev) => `Table.ReorderColumns(${prev}, ${mlist(s.order)})` },
  dup: {
    name: 'Colonne dupliquée',
    apply(T, s) { const c = T.cols.find(x => x.n === s.col); if (!c) throw XE(`La colonne « ${s.col} » de la table est introuvable.`, s.col); if (T.cols.some(x => x.n === s.as)) throw XE(`La colonne « ${s.as} » existe déjà dans la table.`, s.as); return new MTable(T.cols.concat({ n: s.as, t: c.t }), T.rows.map(r => Object.assign({}, r, { [s.as]: r[s.col] }))); },
    m: (s, prev) => `Table.DuplicateColumn(${prev}, ${mstr(s.col)}, ${mstr(s.as)})`
  },
  custom: {
    name: 'Personnalisée ajoutée', gear: true, label: s => s.invoke ? 'Fonction personnalisée appelée' : 'Personnalisée ajoutée',
    apply(T, s, ctx) {
      if (T.cols.some(c => c.n === s.col)) throw XE(`La colonne « ${s.col} » existe déjà dans la table.`, s.col);
      const c = compileSrc(s.src); if (c.err) throw c.err;
      const ty = s.type || 'any', base = ctx && ctx.env ? ctx.env() : null;
      const rows = T.rows.map(r => { const env = new Env(base).set('_', r); const v = safeCell(() => c.fn(env)); return Object.assign({}, r, { [s.col]: ty === 'any' || v instanceof MErr ? v : convertStrict(v, ty) }); });
      return new MTable(T.cols.concat({ n: s.col, t: ty }), rows);
    },
    m: (s, prev) => `Table.AddColumn(${prev}, ${mstr(s.col)}, each ${String(s.src).replace(/^\s*=\s*/, '').trim()}${s.type && s.type !== 'any' ? `, ${tyM(s.type)}` : ''})`
  },
  cond: {
    name: 'Colonne conditionnelle ajoutée', gear: true,
    apply(T, s) {
      if (T.cols.some(c => c.n === s.col)) throw XE(`La colonne « ${s.col} » existe déjà dans la table.`, s.col);
      for (const cl of s.clauses) if (!T.cols.some(c => c.n === cl.col)) throw XE(`La colonne « ${cl.col} » de la table est introuvable.`, cl.col);
      const rows = T.rows.map(r => {
        const v = safeCell(() => {
          for (const cl of s.clauses) {
            const x = cellRead(r[cl.col]);
            const cmpv = cl.val && cl.val.col ? cellRead(r[cl.val.col]) : cl.val ? cl.val.v : null;
            if (condHolds(x, { op: cl.op, val: cmpv })) return valOf(cl.out, r);
          }
          return valOf(s.else, r);
        });
        return Object.assign({}, r, { [s.col]: s.type && s.type !== 'any' && !(v instanceof MErr) ? convertStrict(v, s.type) : v });
      });
      return new MTable(T.cols.concat({ n: s.col, t: s.type || 'any' }), rows);
    },
    m: (s, prev) => `Table.AddColumn(${prev}, ${mstr(s.col)}, each ${condM(s)}${s.type && s.type !== 'any' ? `, ${tyM(s.type)}` : ''})`
  },
  fmt: {
    name: 'Texte découpé',
    apply(T, s) {
      const f = { lower: v => v.toLocaleLowerCase('fr-FR'), upper: v => v.toLocaleUpperCase('fr-FR'), proper: v => STD['Text.Proper'](v), trim: v => STD['Text.Trim'](v), clean: v => STD['Text.Clean'](v) }[s.fn];
      s.cols.forEach(c => { if (!T.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
      if (s.as) {
        const src = s.cols[0];
        return new MTable(T.cols.concat({ n: s.as, t: 'text' }), T.rows.map(r => Object.assign({}, r, { [s.as]: safeCell(() => { const v = cellRead(r[src]); return v === null ? null : typeof v === 'string' ? f(v) : f(textFrom(v)); }) })));
      }
      return new MTable(T.cols.map(c => s.cols.includes(c.n) ? { ...c, t: c.t === 'any' ? 'any' : 'text' } : c), T.rows.map(r => { const o = Object.assign({}, r); for (const c of s.cols) o[c] = o[c] instanceof MErr ? o[c] : safeCell(() => { const v = o[c]; return v === null || v === undefined ? null : typeof v === 'string' ? f(v) : (() => { throw XE(`Nous ne pouvons pas convertir la valeur ${show1(v)} en type Text.`, String(v)); })(); }); return o; }));
    },
    m: (s, prev) => s.as ? `Table.AddColumn(${prev}, ${mstr(s.as)}, each ${FMT_FN[s.fn][1]}(${fieldRef(s.cols[0])}), type text)` : `Table.TransformColumns(${prev}, {${s.cols.map(c => `{${mstr(c)}, ${FMT_FN[s.fn][1]}, type text}`).join(', ')}})`,
    label: s => s.as ? 'Texte inséré' : FMT_FN[s.fn][2]
  },
  replace: {
    name: 'Valeur remplacée', gear: true,
    apply(T, s) {
      s.cols.forEach(c => { if (!T.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
      const from = s.from, to = s.to;
      return new MTable(T.cols, T.rows.map(r => {
        const o = Object.assign({}, r);
        for (const c of s.cols) {
          const v = o[c];
          if (v instanceof MErr) continue;
          if (s.whole || from === null || typeof v !== 'string') { if (eq(v, from) || (from !== null && typeof v === 'number' && typeof from === 'string' && String(v) === from)) o[c] = to; }
          else if (from !== '' && v.includes(from)) o[c] = v.split(from).join(to === null ? '' : to);
        }
        return o;
      }));
    },
    m: (s, prev) => `Table.ReplaceValue(${prev}, ${mstr(s.from)}, ${mstr(s.to)}, ${s.whole || s.from === null ? 'Replacer.ReplaceValue' : 'Replacer.ReplaceText'}, ${mlist(s.cols)})`
  },
  fill: {
    name: 'Rempli vers le bas',
    apply(T, s) { const rows = T.rows.map(r => Object.assign({}, r)); for (const c of s.cols) { if (s.dir === 'up') { let last = null; for (let i = rows.length - 1; i >= 0; i--) { if (rows[i][c] === null || rows[i][c] === undefined) rows[i][c] = last; else last = rows[i][c]; } } else { let last = null; for (const r of rows) { if (r[c] === null || r[c] === undefined) r[c] = last; else last = r[c]; } } } return new MTable(T.cols, rows); },
    m: (s, prev) => `Table.Fill${s.dir === 'up' ? 'Up' : 'Down'}(${prev}, ${mlist(s.cols)})`,
    label: s => s.dir === 'up' ? 'Rempli vers le haut' : 'Rempli vers le bas'
  },
  split: {
    name: 'Fractionner la colonne par délimiteur', gear: true,
    apply(T, s) {
      const ci = T.cols.findIndex(c => c.n === s.col); if (ci < 0) throw XE(`La colonne « ${s.col} » de la table est introuvable.`, s.col);
      const parts = v => { if (v === null || v === undefined) return [null]; const t = typeof v === 'string' ? v : textFrom(v); if (s.at === 'left') { const i = t.indexOf(s.delim); return i < 0 ? [t] : [t.slice(0, i), t.slice(i + s.delim.length)]; } if (s.at === 'right') { const i = t.lastIndexOf(s.delim); return i < 0 ? [t] : [t.slice(0, i), t.slice(i + s.delim.length)]; } return t.split(s.delim); };
      if (s.into === 'rows') {
        const rows = []; for (const r of T.rows) for (const p of parts(r[s.col])) rows.push(Object.assign({}, r, { [s.col]: p }));
        return new MTable(T.cols.map(c => c.n === s.col ? { ...c, t: 'text' } : c), rows);
      }
      const n = s.n || 2;
      const names = Array.from({ length: n }, (_, i) => `${s.col}.${i + 1}`);
      const cols = T.cols.slice(0, ci).concat(names.map(n2 => ({ n: n2, t: 'text' })), T.cols.slice(ci + 1));
      return new MTable(cols, T.rows.map(r => { const ps = parts(r[s.col]); const o = {}; for (const c of T.cols) if (c.n !== s.col) o[c.n] = r[c.n]; names.forEach((n2, i) => o[n2] = i < ps.length ? ps[i] : null); return o; }));
    },
    m: (s, prev) => s.into === 'rows' ? `Table.ExpandListColumn(Table.TransformColumns(${prev}, {{${mstr(s.col)}, Splitter.SplitTextByDelimiter(${mstr(s.delim)}, QuoteStyle.Csv)}}), ${mstr(s.col)})` : `Table.SplitColumn(${prev}, ${mstr(s.col)}, Splitter.SplitTextByDelimiter(${mstr(s.delim)}, QuoteStyle.Csv), {${Array.from({ length: s.n || 2 }, (_, i) => mstr(`${s.col}.${i + 1}`)).join(', ')}})`
  },
  extract: {
    name: 'Texte extrait avant le délimiteur', gear: true,
    apply(T, s) {
      if (!T.cols.some(c => c.n === s.col)) throw XE(`La colonne « ${s.col} » de la table est introuvable.`, s.col);
      const f = v => v === null || v === undefined ? null : s.kind === 'after' ? STD['Text.AfterDelimiter'](String(v), s.delim) : s.kind === 'first' ? String(v).slice(0, s.n) : s.kind === 'last' ? String(v).slice(-s.n) : s.kind === 'length' ? String(v).length : STD['Text.BeforeDelimiter'](String(v), s.delim);
      if (s.as) return new MTable(T.cols.concat({ n: s.as, t: s.kind === 'length' ? 'int' : 'text' }), T.rows.map(r => Object.assign({}, r, { [s.as]: safeCell(() => f(cellRead(r[s.col]))) })));
      return new MTable(T.cols.map(c => c.n === s.col ? { ...c, t: s.kind === 'length' ? 'int' : 'text' } : c), T.rows.map(r => Object.assign({}, r, { [s.col]: r[s.col] instanceof MErr ? r[s.col] : safeCell(() => f(r[s.col])) })));
    },
    m: (s, prev) => { const fn = s.kind === 'after' ? `Text.AfterDelimiter(_, ${mstr(s.delim)})` : s.kind === 'first' ? `Text.Start(_, ${s.n})` : s.kind === 'last' ? `Text.End(_, ${s.n})` : s.kind === 'length' ? 'Text.Length(_)' : `Text.BeforeDelimiter(_, ${mstr(s.delim)})`; return s.as ? `Table.AddColumn(${prev}, ${mstr(s.as)}, each ${fn.replace(/\b_\b/, fieldRef(s.col))}, type text)` : `Table.TransformColumns(${prev}, {{${mstr(s.col)}, each ${fn}, type text}})`; },
    label: s => s.as ? 'Texte inséré avant le délimiteur' : s.kind === 'after' ? 'Texte extrait après le délimiteur' : 'Texte extrait avant le délimiteur'
  },
  group: {
    name: 'Lignes groupées', gear: true,
    apply(T, s) {
      const groups = groupRows(T, s.keys);
      const cols = s.keys.map(k => T.cols.find(c => c.n === k)).concat(s.aggs.map(a => ({ n: a.as, t: a.op === 'count' || a.op === 'countd' ? 'int' : a.op === 'all' ? 'table' : (T.cols.find(c => c.n === a.col) || {}).t || 'any' })));
      return new MTable(cols, groups.map(g => {
        const o = {}; s.keys.forEach(k => o[k] = g.rows[0][k]);
        s.aggs.forEach(a => {
          const vals = a.col ? g.rows.map(r => r[a.col]).filter(v => v !== null && v !== undefined) : [];
          o[a.as] = a.op === 'count' ? g.rows.length : a.op === 'countd' ? new Set(g.rows.map(r => T.cols.map(c => keyOf(r[c.n])).join('|'))).size : a.op === 'all' ? new MTable(T.cols, g.rows) :
            vals.some(v => v instanceof MErr) ? new MErr('Expression.Error', 'Une erreur est présente dans les valeurs regroupées.') :
            a.op === 'sum' ? (vals.length ? vals.reduce((x, y) => x + (typeof y === 'number' ? y : NaN), 0) : null) : a.op === 'avg' ? (vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null) : a.op === 'min' ? (vals.length ? vals.reduce((x, y) => sortCmp(x, y) <= 0 ? x : y) : null) : (vals.length ? vals.reduce((x, y) => sortCmp(x, y) >= 0 ? x : y) : null);
        });
        return o;
      }));
    },
    m: (s, prev) => `Table.Group(${prev}, ${mlist(s.keys)}, {${s.aggs.map(a => `{${mstr(a.as)}, ${a.op === 'count' ? 'each Table.RowCount(_), Int64.Type' : a.op === 'countd' ? 'each Table.RowCount(Table.Distinct(_)), Int64.Type' : a.op === 'all' ? 'each _, type table' : `each List.${{ sum: 'Sum', avg: 'Average', min: 'Min', max: 'Max' }[a.op]}([${a.col}]), type nullable number`}}`).join(', ')}})`
  },
  merge: {
    name: 'Requêtes fusionnées', gear: true,
    apply(T, s, ctx) {
      if (s.from) T = ctx.query(s.from);
      const R = ctx.query(s.with);
      s.left.forEach(c => { if (!T.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
      s.right.forEach(c => { if (!R.cols.some(x => x.n === c)) throw XE(`La colonne « ${c} » de la table est introuvable.`, c); });
      const kL = r => s.left.map(c => keyOf(r[c])).join('|'), kR = r => s.right.map(c => keyOf(r[c])).join('|');
      const nullKey = (r, cs) => cs.some(c => r[c] === null || r[c] === undefined);
      const idx = new Map();
      R.rows.forEach(r => { if (nullKey(r, s.right)) return; const k = kR(r); if (!idx.has(k)) idx.set(k, []); idx.get(k).push(r); });
      const name = s.as || ctx.qname(s.with);
      if (T.cols.some(c => c.n === name)) throw XE(`La colonne « ${name} » existe déjà dans la table.`, name);
      const out = [], used = new Set();
      const sub = list => new MTable(R.cols, list || []);
      for (const r of T.rows) {
        const hits = nullKey(r, s.left) ? [] : (idx.get(kL(r)) || []);
        hits.forEach(h => used.add(h));
        if (s.kind === 'inner' && !hits.length) continue;
        if (s.kind === 'leftanti' && hits.length) continue;
        if (s.kind === 'rightanti') continue;
        out.push(Object.assign({}, r, { [name]: sub(s.kind === 'leftanti' ? [] : hits) }));
      }
      if (s.kind === 'rightouter' || s.kind === 'fullouter' || s.kind === 'rightanti') {
        for (const rr of R.rows) if (!used.has(rr)) { const o = {}; T.cols.forEach(c => o[c.n] = null); o[name] = sub([rr]); out.push(o); }
        if (s.kind === 'rightouter') { /* les lignes de gauche sans correspondance sont retirées */ return new MTable(T.cols.concat({ n: name, t: 'table' }), out.filter(o => o[name].rows.length)); }
      }
      return new MTable(T.cols.concat({ n: name, t: 'table' }), out);
    },
    m: (s, prev, ctx) => `Table.NestedJoin(${s.from ? qid(ctx.qname(s.from)) : prev}, ${mlist(s.left)}, ${qid(ctx.qname(s.with))}, ${mlist(s.right)}, ${mstr(s.as || ctx.qname(s.with))}, ${JOINS[s.kind][1]})`
  },
  expand: {
    name: 'Développé', gear: true,
    apply(T, s) {
      const ci = T.cols.findIndex(c => c.n === s.col); if (ci < 0) throw XE(`La colonne « ${s.col} » de la table est introuvable.`, s.col);
      const names = s.fields.map((f, i) => (s.names && s.names[i]) || (s.prefix ? `${s.col}.${f}` : f));
      names.forEach(n => { if (T.cols.some(c => c.n === n && c.n !== s.col)) throw XE(`La colonne « ${n} » existe déjà dans la table.`, n); });
      const cols = T.cols.slice(0, ci).concat(names.map(n => ({ n, t: 'any' })), T.cols.slice(ci + 1));
      const rows = [];
      for (const r of T.rows) {
        const v = r[s.col];
        const base = {}; for (const c of T.cols) if (c.n !== s.col) base[c.n] = r[c.n];
        if (v instanceof MTable) {
          if (!v.rows.length) { const o = Object.assign({}, base); names.forEach(n => o[n] = null); rows.push(o); continue; }
          for (const rr of v.rows) { const o = Object.assign({}, base); s.fields.forEach((f, i) => o[names[i]] = rr[f] === undefined ? null : rr[f]); rows.push(o); }
        } else if (isRec(v)) { const o = Object.assign({}, base); s.fields.forEach((f, i) => o[names[i]] = v[f] === undefined ? null : v[f]); rows.push(o); }
        else { const o = Object.assign({}, base); names.forEach(n => o[n] = v instanceof MErr ? v : null); rows.push(o); }
      }
      return new MTable(cols, rows);
    },
    m: (s, prev) => `Table.Expand${s.record ? 'Record' : 'Table'}Column(${prev}, ${mstr(s.col)}, ${mlist(s.fields)}, ${mlist(s.fields.map((f, i) => (s.names && s.names[i]) || (s.prefix ? `${s.col}.${f}` : f)))})`,
    label: s => `${s.col} développé`
  },
  count: { name: 'Lignes comptées', apply(T) { return T.rows.length; }, m: (s, prev) => `Table.RowCount(${prev})` },
  mstep: {
    name: 'Personnalisé', edit: true,
    apply(T, s, ctx) { return ctx.expr(s.src); },
    m: s => String(s.src).replace(/^\s*=\s*/, '').trim()
  }
};
/* Conversion stricte d'une colonne personnalisée typée (un texte ne devient pas un nombre en silence) */
function convertStrict(v, ty) {
  if (v === null || v === undefined) return null;
  if (ty === 'text') return typeof v === 'string' ? v : v instanceof MDate ? v : convert(v, 'text');
  if (ty === 'bool') return typeof v === 'boolean' ? v : new MErr('Expression.Error', `Nous ne pouvons pas convertir la valeur ${show1(v)} en type Logical.`, String(v));
  if (ty === 'date') return v instanceof MDate ? v : new MErr('Expression.Error', `Nous ne pouvons pas convertir la valeur ${show1(v)} en type Date.`, String(v));
  if (['int', 'dec', 'fixed', 'pct'].includes(ty)) return typeof v === 'number' ? convert(v, ty) : new MErr('Expression.Error', `Nous ne pouvons pas convertir la valeur ${show1(v)} en type Number.`, String(v));
  return v;
}
let DIRS = {};
function ctxDir(file) { const d = DIRS[file]; return d ? d.replace(/\//g, '\\') + '\\' : ''; }
function sheetTable(sh) {
  if (sh._t) return sh._t;
  const n = Math.max(...sh.rows.map(r => r.length));
  const cols = Array.from({ length: n }, (_, i) => ({ n: `Column${i + 1}`, t: 'any' }));
  sh._t = new MTable(cols, sh.rows.map(r => { const o = {}; cols.forEach((c, i) => o[c.n] = r[i] === undefined ? null : r[i]); return o; }));
  return sh._t;
}
const stepLabel = s => (OPS[s.op] && OPS[s.op].label ? OPS[s.op].label(s) : (OPS[s.op] || {}).name) || 'Étape';

/* ═══════════════════════ Moteur : requêtes, références, cache ═══════════════════════ */
class Engine {
  constructor(P, files, legacyEval) {
    this.P = P; this.files = files || {}; this.legacy = legacyEval || null;
    this.rev = 0; this.cache = new Map();
    DIRS = {}; for (const [k, f] of Object.entries(this.files)) DIRS[k] = f.dir || '';
    FILEREG = this.files;
  }
  get queries() { return this.P.queries; }
  touch() { this.rev++; this.cache.clear(); }
  q(idOrName) { return this.queries.find(q => q.id === idOrName) || this.queries.find(q => q.name === idOrName) || null; }
  qname(id) { const q = this.q(id); return q ? q.name : String(id); }
  file(name) { return this.files[name] || null; }
  isLegacy(q) { return !!q && !q.m2; }
  /* Résultat d'une requête à une étape donnée : { table, error, stepError: index } */
  run(q, upto, stack) {
    if (typeof q === 'string') q = this.q(q);
    if (!q) return { error: XE('Requête introuvable.') };
    const last = q.steps.length - 1;
    const at = upto === undefined || upto === null ? last : Math.min(upto, last);
    const key = q.id + '@' + at;
    if (this.cache.has(key)) return this.cache.get(key);
    stack = stack || [];
    if (stack.includes(q.id)) { const r = { error: XE('Une référence cyclique a été rencontrée lors de l’évaluation.'), stepError: 0 }; return r; }
    let res;
    if (this.isLegacy(q)) {
      try { const T = this.legacy(q, at); res = { value: null, table: new MTable(T.cols.map(c => ({ n: c.n, t: c.t })), T.rows.map(r => { const o = {}; for (const c of T.cols) { const v = r[c.n]; o[c.n] = v && typeof v === 'object' && v.err ? new MErr(v.err, `Nous n’avons pas pu convertir en ${NOMS[v.type] || 'ce type'}.`, v.raw) : c.t === 'date' && typeof v === 'string' && MDate.iso(v) ? MDate.iso(v) : v; } return o; })) }; }
      catch (e) { res = { error: e instanceof MThrow ? e : XE(String(e.message || e)), stepError: at }; }
      if (res.table) res.value = res.table;
    } else {
      const prev = at > 0 ? this.run(q, at - 1, stack) : { table: null, value: null };
      if (prev.error) res = { error: prev.error, stepError: prev.stepError };
      else {
        const s = q.steps[at], op = OPS[s.op];
        const self = this, env = { vars: null };
        const ctx = {
          file: n => self.file(n),
          query: id => { const r = self.run(self.q(id) || id, undefined, stack.concat(q.id)); if (r.error) throw r.error.reason ? E(r.error.reason, r.error.mmsg, r.error.detail) : r.error; if (!(r.table instanceof MTable)) throw XE(`La requête « ${self.qname(id)} » ne renvoie pas une table.`); return r.table; },
          value: id => { const r = self.run(self.q(id) || id, undefined, stack.concat(q.id)); if (r.error) throw r.error.reason ? E(r.error.reason, r.error.mmsg, r.error.detail) : r.error; return r.value; },
          env: () => { if (env.vars) return env.vars; const e = new Env(null); for (const oq of self.queries) if (oq.id !== q.id) e.lazy(oq.name, () => ctx.value(oq.id)); env.vars = e; return e; },
          qname: id => self.qname(id),
          expr: src => {
            const vars = {};
            q.steps.slice(0, at).forEach((ps, i) => { const f = () => { const r = self.run(q, i, stack); if (r.error) throw r.error; return r.value === undefined ? r.table : r.value; }; f.lazy = true; vars[ps.name] = f; });
            for (const oq of self.queries) if (oq.id !== q.id && !(oq.name in vars)) { const f = () => ctx.value(oq.id); f.lazy = true; vars[oq.name] = f; }
            return evalExpr(src, vars);
          }
        };
        try {
          if (!op) throw XE(`Étape inconnue : ${s.op}.`);
          const V = op.apply(prev.value === undefined ? prev.table : prev.value, s, ctx);
          res = { value: V, table: V instanceof MTable ? V : null };
        } catch (e) {
          if (!(e instanceof MThrow)) { console.error(e); res = { error: XE(String(e.message || e)), stepError: at }; }
          else res = { error: e, stepError: at };
        }
      }
    }
    this.cache.set(key, res);
    return res;
  }
  table(q, upto) { const r = this.run(q, upto); return r.table instanceof MTable ? r.table : null; }
  value(q, upto) { const r = this.run(q, upto); return r.error ? undefined : r.value; }
  /* Code saisi dans l'éditeur avancé : un let…in devient une étape par variable, sinon une seule étape */
  setCode(q, src) {
    const clean = String(src).trim();
    const ast = parse(clean);
    let steps;
    if (ast.k === 'let' && ast.body.k === 'id' && ast.binds.some(b => b[0] === ast.body.v)) {
      const toks = lex(clean);
      steps = splitLet(clean, toks).map(([name, code]) => ({ name, op: 'mstep', src: code }));
      const last = ast.body.v; const k = steps.findIndex(x => x.name === last);
      if (k >= 0 && k !== steps.length - 1) steps.push({ name: 'Résultat', op: 'mstep', src: qid(last) });
    } else steps = [{ name: 'Source', op: 'mstep', src: clean }];
    q.steps = steps.map((x, i) => Object.assign({ id: 'm' + Date.now().toString(36) + i }, x));
    this.touch();
    return q.steps;
  }
  /* Formule M d'une étape (barre de formule) */
  formula(q, i) {
    const s = q.steps[i]; if (!s) return '';
    if (this.isLegacy(q)) return null;
    const op = OPS[s.op];
    const prev = i > 0 ? qid(q.steps[i - 1].name) : 'Source';
    return '= ' + (op ? op.m(s, prev, { qname: id => this.qname(id) }) : '…');
  }
  /* Code complet de la requête (éditeur avancé) */
  code(q) {
    if (this.isLegacy(q)) return null;
    const lines = q.steps.map((s, i) => `    ${qid(s.name)} = ${this.formula(q, i).slice(2)}${i < q.steps.length - 1 ? ',' : ''}`);
    return `let\n${lines.join('\n')}\nin\n    ${qid(q.steps[q.steps.length - 1].name)}`;
  }
  /* Sources directes d'une requête : fichiers et autres requêtes */
  deps(q) {
    const files = new Set(), qs = new Set();
    if (this.isLegacy(q)) { if (q.file) files.add(q.file); return { files: [...files], queries: [] }; }
    for (const s of q.steps) {
      if (s.op === 'excel' || s.op === 'csv') files.add(s.file);
      if (s.op === 'ref') qs.add(s.of);
      if (s.op === 'append') s.with.forEach(id => qs.add(id));
      if (s.op === 'merge') { qs.add(s.with); if (s.from) qs.add(s.from); }
      if (s.op === 'mstep') for (const oq of this.queries) if (oq.id !== q.id && new RegExp('(^|[^A-Za-z0-9_"])' + oq.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^A-Za-z0-9_"])').test(s.src)) qs.add(oq.id);
    }
    return { files: [...files], queries: [...qs].map(id => (this.q(id) || {}).id).filter(Boolean) };
  }
  /* Requêtes qui dépendent de q (directement) */
  dependents(id) { return this.queries.filter(o => o.id !== id && this.deps(o).queries.includes(id)); }
}

/* ═══════════════════════ Profilage ═══════════════════════ */
function profile(T, col, scope) {
  const rows = scope === 'all' ? T.rows : T.rows.slice(0, 1000);
  const vals = rows.map(r => r[col] === undefined ? null : r[col]);
  let errors = 0, empty = 0, valid = 0, emptyText = 0;
  const freq = new Map();
  for (const v of vals) {
    if (v instanceof MErr) { errors++; continue; }
    if (v === null || v === '') { empty++; if (v === '') emptyText++; } else valid++;
    const k = keyOf(v); const f = freq.get(k); if (f) f.n++; else freq.set(k, { v, n: 1 });
  }
  const list = [...freq.values()];
  const distinct = list.length, unique = list.filter(x => x.n === 1).length;
  const nums = vals.filter(v => typeof v === 'number');
  const ord = vals.filter(v => v !== null && !(v instanceof MErr) && (typeof v !== 'object' || v instanceof MDate));
  let min = null, max = null;
  if (ord.length) { min = ord.reduce((a, b) => sortCmp(a, b) <= 0 ? a : b); max = ord.reduce((a, b) => sortCmp(a, b) >= 0 ? a : b); }
  const top = list.slice().sort((a, b) => b.n - a.n || sortCmp(a.v, b.v)).slice(0, 12);
  return { count: vals.length, errors, empty, emptyText, valid, distinct, unique, min, max, nums: nums.length, sum: nums.reduce((a, b) => a + b, 0), avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null, zeros: nums.filter(n => n === 0).length, top, scope: scope === 'all' ? 'all' : 'top' };
}

/* Valeurs distinctes d'une colonne (liste du filtre, 1 000 valeurs au plus comme Power Query) */
function distinctValues(T, col, limit) {
  const seen = new Map();
  for (const r of T.rows) { const v = r[col] === undefined ? null : r[col]; if (v instanceof MErr) continue; const k = keyOf(v); if (!seen.has(k)) seen.set(k, v); if (limit && seen.size >= limit) break; }
  return [...seen.values()].sort(sortCmp);
}

const PQE = { splitLet, MDate, MErr, MThrow, MTable, MType, MFn, TYPES, LOCALES, JOINS, AGGS, FMT_FN, FILTER_OPS, OPS, STD, Engine, parse, lex, compileSrc, checkSyntax, evalExpr, convert, convertStrict, detectType, numFromText, dateFromText, textFrom, typeName, eq, keyOf, sortCmp, profile, distinctValues, qid, mstr, fieldRef, stepLabel, promote, combine, isTable, isRec, isList, rowRec, sheetTable, decodeAs, parseCsv, condM, filterM };
root.PQE = PQE;
if (typeof module !== 'undefined' && module.exports) module.exports = PQE;
})(typeof window !== 'undefined' ? window : globalThis);

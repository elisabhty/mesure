/* Power BI Quest — éditeur Power Query du module 2 : boîtes de dialogue des transformations, sources, dépendances */
(function () {
'use strict';
const PBI = window.PBI, P_ = PBI.prototype, PQE = window.PQE;
const { h, esc, fr, $, $$, clone, shake } = window.PBQ;
const I = PBI.I, TY = PQE.TYPES, QI = PBI.QI;
const NB = '\u00A0';
const files = () => (window.PBQ_DATA2 || { files: {} }).files;
const loadOf = PBI.loadOf, disp = PBI.q2disp;
let SEQ = 0;
const uid = p => (p || 'c') + Date.now().toString(36) + (++SEQ).toString(36);
const isNumT = t => ['dec', 'fixed', 'int', 'pct'].includes(t);
const clip = () => (window.PBQ && window.PBQ.clip) || '';
function uniqQName(P, base) { if (!P.queries.some(q => q.name === base)) return base; const m = /^(.*?)(\d+)$/.exec(base); let root = m ? m[1] : base, k = m ? +m[2] : 1; let n; do { k++; n = `${root}${k}`; } while (P.queries.some(q => q.name === n)); return n; }
function uniqCol(T, base) { if (!T || !T.cols.some(c => c.n === base)) return base; let k = 1; while (T.cols.some(c => c.n === `${base}.${k}`)) k++; return `${base}.${k}`; }
function parseVal(s, numeric) { const t = String(s); if (t.trim() === 'null') return null; if (numeric && /^\s*-?\d+([.,]\d+)?\s*$/.test(t)) return Number(t.trim().replace(',', '.')); return t; }
const valTxt = v => v === null ? 'null' : v === undefined ? '' : String(v);
const colIsNum = (T, c) => { const col = T && T.cols.find(x => x.n === c); if (!col) return false; if (isNumT(col.t)) return true; if (col.t !== 'any') return false; const vs = T.rows.slice(0, 50).map(r => r[c]).filter(v => v !== null && v !== undefined); return vs.length > 0 && vs.every(v => typeof v === 'number'); };

/* Boîte générique avec OK / Annuler */
P_.q2dlg = function (title, body, onOk, kind, opts = {}) {
  const cancel = () => { this.closeDialog(); this.q2emit('q2.cancel', { kind }); };
  this.dialog(title, body, [{ t: opts.ok || 'OK', pri: true, id: 'ok', fn: b => { const r = onOk(b); if (r === false) shake(b); } }, { t: 'Annuler', id: 'cancel', fn: cancel }], { kind: 'q2' + kind, tall: !!opts.tall, onX: cancel });
  this.q2emit('q2.dialog', { kind });
};
/* Liste déroulante (bouton + menu) */
P_.q2sel = function (btn, options, value, onChange) {
  const label = () => { const o = options().find(x => x[0] === value); btn.textContent = o ? o[1] : '—'; };
  btn.addEventListener('click', e => { e.preventDefault(); this.menu(btn, options().map(o => [o[0], o[1], o[0] === value]), k => { value = k; label(); onChange(k); }, { host: this.el }); });
  label();
  return { get: () => value, set: v => { value = v; label(); } };
};
const tableOf = (pbi, T0) => T0 || pbi.q2table();

/* ───────── Nombre de lignes : supprimer / conserver ───────── */
const COUNT_T = { skip: ['Supprimer les premières lignes', 'Spécifie le nombre de lignes à supprimer en haut de la table.'], removeBottom: ['Supprimer les dernières lignes', 'Spécifie le nombre de lignes à supprimer en bas de la table.'], keepTop: ['Conserver les premières lignes', 'Spécifie le nombre de lignes à conserver en haut de la table.'], keepBottom: ['Conserver les dernières lignes', 'Spécifie le nombre de lignes à conserver en bas de la table.'] };
P_.q2countDialog = function (op, step, edit) {
  const body = h(`<div class="q2-form"><p class="q2-msg">${esc(fr(COUNT_T[op][1]))}</p><label>Nombre de lignes<input inputmode="numeric" value="${step ? step.n : ''}" autocomplete="off"></label></div>`);
  const inp = $('input', body);
  this.q2dlg(COUNT_T[op][0], body, () => {
    const n = Number(inp.value.trim()); if (!Number.isInteger(n) || n < 0 || inp.value.trim() === '') { shake(inp); return false; }
    this.closeDialog();
    if (edit) edit({ n }); else this.q2addStep({ op, n });
  }, 'count:' + op);
  setTimeout(() => inp.focus(), 60);
};
/* ───────── Colonne d'index personnalisée ───────── */
P_.q2indexDialog = function (step, edit) {
  const T = this.q2table();
  const body = h(`<div class="q2-form"><p class="q2-msg">Ajoute une colonne d’index avec une valeur de départ et un incrément.</p><label>Valeur de départ<input data-x="s" inputmode="numeric" value="${step ? step.start : 0}"></label><label>Incrément<input data-x="i" inputmode="numeric" value="${step ? step.incr : 1}"></label></div>`);
  this.q2dlg('Ajouter une colonne d’index', body, () => {
    const s = Number($('[data-x="s"]', body).value.replace(',', '.')), i = Number($('[data-x="i"]', body).value.replace(',', '.'));
    if (!isFinite(s) || !isFinite(i) || $('[data-x="i"]', body).value.trim() === '') return false;
    this.closeDialog();
    if (edit) edit({ start: s, incr: i }); else { const col = uniqCol(T, 'Index'); this.q2addStep({ op: 'index', col, start: s, incr: i }, { sel: [col] }); }
  }, 'index');
};

/* ───────── Colonne personnalisée ───────── */
const TOKENS = ['if', 'then', 'else', 'null', '=', '<>', 'and', 'or', 'not', '(', ')', '[', ']', '{', '}', '"', ',', 'let', 'in', 'try', 'otherwise'];
function insertAt(ta, text) {
  const a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a;
  const pre = ta.value.slice(0, a), post = ta.value.slice(b);
  const sp = /[\w\])"]$/.test(pre) && /^[\w[("]/.test(text) ? ' ' : '';
  ta.value = pre + sp + text + post;
  const p = a + sp.length + text.length; ta.setSelectionRange(p, p); ta.focus();
}
P_.q2formulaBox = function (T, src, onChange) {
  const box = h(`<div class="q2-fbox"><div class="q2-feq"><span>=</span><textarea class="q2-code" rows="5" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></div><p class="q2-syn"></p>
    <div class="q2-tools"><button class="chipb pri" data-x="paste" ${clip() ? '' : 'disabled'}>Coller</button>${TOKENS.map(t => `<button class="chipb mono" data-t="${esc(t)}">${esc(t)}</button>`).join('')}<button class="chipb" data-x="clear">Effacer</button></div>
    ${T ? `<small class="q2-lbl">Colonnes disponibles</small><div class="q2-cols">${T.cols.map(c => `<button class="chipb" data-c="${esc(c.n)}">${esc(c.n)}</button>`).join('')}</div>` : ''}</div>`);
  const ta = $('textarea', box), syn = $('.q2-syn', box);
  ta.value = (src || '').replace(/^\s*=\s*/, '');
  const check = () => { const v = ta.value.trim(); if (!v) { syn.className = 'q2-syn'; syn.textContent = ''; onChange && onChange(null); return false; } const r = PQE.checkSyntax(v); syn.className = 'q2-syn ' + (r.ok ? 'ok' : 'ko'); syn.textContent = r.ok ? '✓ Aucune erreur de syntaxe n’a été détectée.' : '✕ ' + fr(r.msg); onChange && onChange(r.ok ? v : null); return r.ok; };
  ta.addEventListener('input', check);
  box.addEventListener('click', e => {
    const t = e.target.closest('[data-t]'), c = e.target.closest('[data-c]'), x = e.target.closest('[data-x]');
    if (t) { e.preventDefault(); insertAt(ta, t.dataset.t === '"' ? '""' : t.dataset.t); if (t.dataset.t === '"') ta.setSelectionRange(ta.selectionStart - 1, ta.selectionStart - 1); check(); }
    else if (c) { e.preventDefault(); insertAt(ta, PQE.fieldRef(c.dataset.c)); check(); }
    else if (x && x.dataset.x === 'paste') { e.preventDefault(); ta.value = clip().replace(/^\s*=\s*/, ''); check(); this.q2emit('q2.paste', { where: 'formula' }); }
    else if (x && x.dataset.x === 'clear') { e.preventDefault(); ta.value = ''; check(); }
  });
  check();
  return { el: box, ta, check, value: () => ta.value.trim() };
};
P_.q2customDialog = function (step, edit, T0) {
  const T = tableOf(this, T0);
  let type = step ? step.type || 'any' : 'any';
  const body = h(`<div class="q2-form"><label>Nouveau nom de colonne<input data-x="n" value="${esc(step ? step.col : uniqCol(T, 'Personnalisé'))}" spellcheck="false" autocapitalize="off" autocomplete="off"></label>
    <label>Type de données<button class="sel-box" data-x="t"></button></label><small class="q2-lbl">Formule de colonne personnalisée</small></div>`);
  const fb = this.q2formulaBox(T, step ? step.src : '');
  body.appendChild(fb.el);
  const prev = h(`<div class="q2-prev"></div>`); body.appendChild(prev);
  const preview = () => {
    prev.innerHTML = ''; const v = fb.value(); if (!v || !fb.check() || !T) return;
    const rows = T.rows.slice(0, 3); const out = [];
    for (const r of rows) { let val; try { val = PQE.evalExpr(v, null, r); } catch (e) { val = new PQE.MErr(e.reason || 'Expression.Error', e.mmsg || String(e.message || e)); } out.push(val); }
    prev.appendChild(h(`<small class="q2-lbl">Aperçu sur les trois premières lignes</small>`));
    prev.appendChild(h(`<div class="q2-pv">${out.map(v2 => { const d = disp(v2); return `<span class="${d.c}">${esc(d.c === 'err' ? 'Error : ' + fr(v2.message) : d.s === '' ? '(texte vide)' : d.s)}</span>`; }).join('')}</div>`));
  };
  fb.ta.addEventListener('input', () => { clearTimeout(fb._t); fb._t = setTimeout(preview, 250); });
  const ty = this.q2sel($('[data-x="t"]', body), () => [['any', 'Tout'], ['text', 'Texte'], ['int', 'Nombre entier'], ['dec', 'Nombre décimal'], ['fixed', 'Nombre décimal fixe'], ['date', 'Date'], ['bool', 'Vrai/Faux']], type, k => type = k);
  preview();
  this.q2dlg('Colonne personnalisée', body, () => {
    const name = $('[data-x="n"]', body).value.trim(), src = fb.value();
    if (!name) { shake($('[data-x="n"]', body)); return false; }
    if (!src || !fb.check()) { shake(fb.ta); this.q2emit('q2.try', { kind: 'custom', syntax: false, col: name, src }); return false; }
    if ((!step || step.col !== name) && T && T.cols.some(c => c.n === name)) { shake($('[data-x="n"]', body)); this.message('Colonne personnalisée', `Une colonne nommée « ${name} » existe déjà. Choisis un autre nom.`, [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]); return null; }
    this.closeDialog();
    if (edit) edit({ col: name, src, type: ty.get() }); else this.q2addStep({ op: 'custom', col: name, src, type: ty.get() }, { sel: [name] });
  }, 'custom', { tall: true });
};
/* ───────── Appeler une fonction personnalisée ───────── */
P_.q2invokeDialog = function () {
  const eng = this.engine(), T = this.q2table();
  const fns = this.P.queries.filter(q => q.id !== this.q2.cur && eng.value(q) instanceof PQE.MFn);
  if (!fns.length) { this.message('Appeler une fonction personnalisée', 'Aucune requête de fonction n’existe encore. Crée d’abord une fonction (Nouvelle source › Requête vide, puis Éditeur avancé).', [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]); this.q2emit('q2.try', { kind: 'invoke', none: true }); return; }
  let fn = fns[0].id;
  const body = h(`<div class="q2-form"><label>Nouveau nom de colonne<input data-x="n" value="${esc(fns[0].name)}" spellcheck="false" autocapitalize="off" autocomplete="off"></label><label>Requête de fonction<button class="sel-box" data-x="f"></button></label><div class="q2-params"></div></div>`);
  const params = $('.q2-params', body); const args = [];
  const drawParams = () => {
    params.innerHTML = ''; args.length = 0;
    const F = eng.value(fn);
    F.params.forEach((p, i) => {
      const row = h(`<label>${esc(p.name)}${p.optional ? ' (facultatif)' : ''}<button class="sel-box" data-p="${i}"></button></label>`);
      params.appendChild(row);
      args.push(this.q2sel($('button', row), () => [['', '—']].concat(T.cols.map(c => ['c:' + c.n, 'Colonne : ' + c.n])), '', () => {}));
    });
  };
  this.q2sel($('[data-x="f"]', body), () => fns.map(q => [q.id, q.name]), fn, k => { fn = k; $('[data-x="n"]', body).value = eng.q(k).name; drawParams(); });
  drawParams();
  this.q2dlg('Appeler une fonction personnalisée', body, () => {
    const name = $('[data-x="n"]', body).value.trim(); if (!name || T.cols.some(c => c.n === name)) { shake($('[data-x="n"]', body)); return false; }
    const F = eng.value(fn); const list = args.map(a => a.get());
    if (F.params.some((p, i) => !p.optional && !list[i])) return false;
    const src = `${PQE.qid(eng.q(fn).name)}(${list.filter(Boolean).map(a => PQE.fieldRef(a.slice(2))).join(', ')})`;
    this.closeDialog();
    this.q2addStep({ op: 'custom', col: name, src, type: 'any', invoke: true }, { sel: [name] });
  }, 'invoke');
};
/* ───────── Colonne conditionnelle ───────── */
const OPS_TXT = [['eq', 'est égal à'], ['ne', 'n’est pas égal à'], ['begins', 'commence par'], ['nbegins', 'ne commence pas par'], ['contains', 'contient'], ['ncontains', 'ne contient pas'], ['ends', 'se termine par'], ['nends', 'ne se termine pas par']];
const OPS_NUM = [['eq', 'est égal à'], ['ne', 'n’est pas égal à'], ['gt', 'est supérieur à'], ['ge', 'est supérieur ou égal à'], ['lt', 'est inférieur à'], ['le', 'est inférieur ou égal à']];
P_.q2condDialog = function (step, edit, T0) {
  const T = tableOf(this, T0);
  const clauses = step ? clone(step.clauses).map(c => ({ col: c.col, op: c.op, val: c.val, out: c.out })) : [{ col: T.cols[0].n, op: 'eq', val: { v: '' }, out: { v: '' } }];
  let els = step ? clone(step.else) : { v: '' };
  const body = h(`<div class="q2-form"><label>Nouveau nom de colonne<input data-x="n" value="${esc(step ? step.col : uniqCol(T, 'Personnalisé'))}" spellcheck="false" autocapitalize="off" autocomplete="off"></label><div class="q2-cls"></div><button class="chipb" data-x="add">+ Ajouter une clause</button><div class="q2-else"></div><p class="lc-note">${esc(fr('Saisis null pour comparer à une valeur absente. Le résultat reste de type Tout : modifie son type ensuite.'))}</p></div>`);
  const cls = $('.q2-cls', body);
  const valWidget = (spec, onSet, numeric) => {
    const w = h(`<div class="q2-vw"><button class="q2-vk" aria-label="Valeur ou colonne">${spec.col ? QI.cols.replace('<svg', '<svg width="14" height="14"') : 'ABC'}</button>${spec.col ? '<button class="sel-box"></button>' : `<input value="${esc(valTxt(spec.v))}" spellcheck="false" autocapitalize="off" autocomplete="off">`}</div>`);
    $('.q2-vk', w).addEventListener('click', e => { e.preventDefault(); this.menu(e.currentTarget, [['v', 'Entrer une valeur', !spec.col], ['c', 'Sélectionner une colonne', !!spec.col]], k => { onSet(k === 'c' ? { col: T.cols[0].n } : { v: '' }); draw(); }, { host: this.el }); });
    if (spec.col) this.q2sel($('.sel-box', w), () => T.cols.map(c => [c.n, c.n]), spec.col, k => onSet({ col: k }));
    else $('input', w).addEventListener('input', e => onSet({ v: parseVal(e.target.value, numeric()) }));
    return w;
  };
  const draw = () => {
    cls.innerHTML = '';
    clauses.forEach((c, i) => {
      const row = h(`<div class="q2-cl"><div class="q2-clh"><b>${i ? 'Sinon si' : 'Si'}</b>${clauses.length > 1 ? `<button class="q2-clx" aria-label="Supprimer la clause">${I.close.replace('<svg', '<svg width="12" height="12"')}</button>` : ''}</div><label>Nom de colonne<button class="sel-box" data-k="col"></button></label><label>Opérateur<button class="sel-box" data-k="op"></button></label><label>Valeur</label><div data-k="val"></div><label>Alors</label><div data-k="out"></div></div>`);
      const num = () => colIsNum(T, c.col);
      this.q2sel($('[data-k="col"]', row), () => T.cols.map(x => [x.n, x.n]), c.col, k => { c.col = k; if (!(num() ? OPS_NUM : OPS_TXT).some(o => o[0] === c.op)) c.op = 'eq'; draw(); });
      this.q2sel($('[data-k="op"]', row), () => num() ? OPS_NUM : OPS_TXT, c.op, k => c.op = k);
      $('[data-k="val"]', row).appendChild(valWidget(c.val, v => c.val = v, num));
      $('[data-k="out"]', row).appendChild(valWidget(c.out, v => c.out = v, () => false));
      const x = $('.q2-clx', row); if (x) x.addEventListener('click', e => { e.preventDefault(); clauses.splice(i, 1); draw(); });
      cls.appendChild(row);
    });
    const el = $('.q2-else', body); el.innerHTML = '<label>Sinon</label>'; el.appendChild(valWidget(els, v => els = v, () => false));
  };
  $('[data-x="add"]', body).addEventListener('click', e => { e.preventDefault(); clauses.push({ col: T.cols[0].n, op: 'eq', val: { v: '' }, out: { v: '' } }); draw(); });
  draw();
  this.q2dlg('Ajouter une colonne conditionnelle', body, () => {
    const name = $('[data-x="n"]', body).value.trim();
    if (!name || ((!step || step.col !== name) && T.cols.some(c => c.n === name))) { shake($('[data-x="n"]', body)); return false; }
    const fix = o => o.col ? { col: o.col } : { v: o.v === '' ? '' : o.v };
    const out = { col: name, clauses: clauses.map(c => ({ col: c.col, op: c.op, val: c.val.col ? { col: c.val.col } : { v: c.val.v === undefined ? '' : c.val.v }, out: fix(c.out) })), else: fix(els), type: 'any' };
    this.closeDialog();
    if (edit) edit(out); else this.q2addStep(Object.assign({ op: 'cond' }, out), { sel: [name] });
  }, 'cond', { tall: true });
};
/* ───────── Remplacer les valeurs ───────── */
P_.q2replaceDialog = function (step, edit) {
  const q2 = this.q2, T = this.q2table(), cols = step ? step.cols : q2.sel.slice();
  const numeric = cols.every(c => colIsNum(T, c));
  const body = h(`<div class="q2-form"><p class="q2-msg">${esc(fr(`Remplace une valeur par une autre dans ${cols.length > 1 ? 'les colonnes sélectionnées' : `la colonne ${cols[0]}`}.`))}</p>
    <label>Valeur à rechercher<input data-x="from" value="${step ? esc(valTxt(step.from)) : ''}" spellcheck="false" autocapitalize="off" autocomplete="off"></label>
    <label>Remplacer par<input data-x="to" value="${step ? esc(valTxt(step.to)) : ''}" spellcheck="false" autocapitalize="off" autocomplete="off"></label>
    ${numeric ? '' : `<details ${step && step.whole ? 'open' : ''}><summary>Options avancées</summary><label class="q2-chk"><input type="checkbox" data-x="whole" ${step && step.whole ? 'checked' : ''}> Faire correspondre le contenu entier de la cellule</label></details>`}</div>`);
  this.q2dlg('Remplacer les valeurs', body, () => {
    const fromRaw = $('[data-x="from"]', body).value, toRaw = $('[data-x="to"]', body).value;
    const from = parseVal(fromRaw, numeric), to = parseVal(toRaw, numeric);
    const whole = numeric || from === null || !!($('[data-x="whole"]', body) || {}).checked;
    if (fromRaw === '' && !whole) { shake($('[data-x="from"]', body)); return false; }
    this.closeDialog();
    const patch = { cols, from, to, whole };
    if (edit) edit(patch); else this.q2addStep(Object.assign({ op: 'replace' }, patch));
  }, 'replace');
  setTimeout(() => { const i = $('[data-x="from"]', body); if (i) i.focus(); }, 60);
};
/* ───────── Regrouper par ───────── */
P_.q2groupDialog = function (step, edit, T0, col) {
  const T = tableOf(this, T0);
  let adv = !!(step && (step.keys.length > 1 || step.aggs.length > 1));
  const keys = step ? step.keys.slice() : [col || this.q2.sel[0] || T.cols[0].n];
  const aggs = step ? clone(step.aggs) : [{ as: 'Nombre', op: 'count', col: null }];
  const body = h(`<div class="q2-form"><div class="q2-radio"><label><input type="radio" name="gm" value="b" ${adv ? '' : 'checked'}> De base</label><label><input type="radio" name="gm" value="a" ${adv ? 'checked' : ''}> Avancé</label></div><div class="q2-gk"></div><div class="q2-ga"></div></div>`);
  const draw = () => {
    const gk = $('.q2-gk', body); gk.innerHTML = '<small class="q2-lbl">Regrouper par</small>';
    keys.forEach((k, i) => { const r = h(`<div class="q2-row"><button class="sel-box"></button>${adv && keys.length > 1 ? `<button class="q2-clx">${I.close.replace('<svg', '<svg width="12" height="12"')}</button>` : ''}</div>`); this.q2sel($('.sel-box', r), () => T.cols.map(c => [c.n, c.n]), k, v => keys[i] = v); const x = $('.q2-clx', r); if (x) x.addEventListener('click', e => { e.preventDefault(); keys.splice(i, 1); draw(); }); gk.appendChild(r); });
    if (adv) { const add = h(`<button class="chipb">+ Ajouter un regroupement</button>`); add.addEventListener('click', e => { e.preventDefault(); keys.push(T.cols[0].n); draw(); }); gk.appendChild(add); }
    const ga = $('.q2-ga', body); ga.innerHTML = '';
    (adv ? aggs : aggs.slice(0, 1)).forEach((a, i) => {
      const r = h(`<div class="q2-agg"><label>Nouveau nom de colonne<input value="${esc(a.as)}" spellcheck="false" autocapitalize="off" autocomplete="off"></label><label>Opération<button class="sel-box" data-k="op"></button></label><label>Colonne<button class="sel-box" data-k="col"></button></label></div>`);
      $('input', r).addEventListener('input', e => a.as = e.target.value);
      this.q2sel($('[data-k="op"]', r), () => Object.entries(PQE.AGGS), a.op, v => { a.op = v; draw(); });
      const cb = $('[data-k="col"]', r);
      if (['count', 'countd', 'all'].includes(a.op)) { cb.disabled = true; cb.textContent = '—'; a.col = null; }
      else { if (!a.col) a.col = T.cols[0].n; this.q2sel(cb, () => T.cols.map(c => [c.n, c.n]), a.col, v => a.col = v); }
      ga.appendChild(r);
    });
    if (adv) { const add = h(`<button class="chipb">+ Ajouter une agrégation</button>`); add.addEventListener('click', e => { e.preventDefault(); aggs.push({ as: 'Nombre' + (aggs.length + 1), op: 'count', col: null }); draw(); }); ga.appendChild(add); }
  };
  $$('[name="gm"]', body).forEach(r => r.addEventListener('change', () => { adv = r.value === 'a' && r.checked ? true : r.value === 'b' && r.checked ? false : adv; if (!adv) { keys.splice(1); aggs.splice(1); } draw(); }));
  draw();
  this.q2dlg('Regrouper par', body, () => {
    const list = (adv ? aggs : aggs.slice(0, 1)).map(a => ({ as: (a.as || '').trim(), op: a.op, col: a.col }));
    if (list.some(a => !a.as) || new Set(keys).size !== keys.length) return false;
    this.closeDialog();
    const patch = { keys: keys.slice(), aggs: list };
    if (edit) edit(patch); else this.q2addStep(Object.assign({ op: 'group' }, patch), { sel: [], reveal: patch.keys[0] });
  }, 'group', { tall: adv });
};
/* ───────── Fractionner la colonne par délimiteur ───────── */
const DELIMS = [[':', 'Deux-points'], [',', 'Virgule'], ['=', 'Signe égal'], [';', 'Point-virgule'], [' ', 'Espace'], ['\t', 'Tabulation'], ['custom', '--Personnalisé--']];
P_.q2splitDialog = function (col, step, edit, T0) {
  const T = tableOf(this, T0);
  let d = step ? (DELIMS.some(x => x[0] === step.delim) ? step.delim : 'custom') : ',', custom = step && !DELIMS.some(x => x[0] === step.delim) ? step.delim : '';
  let at = step ? step.at : 'each', into = step ? step.into : 'cols';
  const delim = () => d === 'custom' ? custom : d;
  const maxParts = () => { const dl = delim(); if (!dl) return 1; let m = 1; for (const r of T.rows) { const v = r[col]; if (typeof v === 'string') m = Math.max(m, v.split(dl).length); } return at === 'each' ? m : 2; };
  const body = h(`<div class="q2-form"><p class="q2-msg">${esc(fr(`Fractionne la colonne ${col} selon un délimiteur.`))}</p><label>Sélectionner ou entrer un délimiteur<button class="sel-box" data-x="d"></button></label><input data-x="c" placeholder="Délimiteur personnalisé" value="${esc(custom)}" spellcheck="false" autocapitalize="off" autocomplete="off">
    <small class="q2-lbl">Fractionner à</small><div class="q2-radio v">${[['left', 'Délimiteur le plus à gauche'], ['right', 'Délimiteur le plus à droite'], ['each', 'Chaque occurrence du délimiteur']].map(o => `<label><input type="radio" name="sa" value="${o[0]}" ${o[0] === at ? 'checked' : ''}> ${o[1]}</label>`).join('')}</div>
    <details ${step ? 'open' : ''}><summary>Options avancées</summary><div class="q2-radio"><label><input type="radio" name="si" value="cols" ${into === 'cols' ? 'checked' : ''}> Colonnes</label><label><input type="radio" name="si" value="rows" ${into === 'rows' ? 'checked' : ''}> Lignes</label></div><label>Nombre de colonnes à fractionner<input data-x="n" inputmode="numeric"></label></details></div>`);
  const ci = $('[data-x="c"]', body), ni = $('[data-x="n"]', body);
  const sync = () => { ci.style.display = d === 'custom' ? '' : 'none'; if (!ni.dataset.touched) ni.value = step && step.n && !ni.dataset.init ? step.n : maxParts(); ni.dataset.init = '1'; };
  this.q2sel($('[data-x="d"]', body), () => DELIMS, d, k => { d = k; sync(); if (k === 'custom') setTimeout(() => ci.focus(), 30); });
  ci.addEventListener('input', () => { custom = ci.value; sync(); });
  ni.addEventListener('input', () => ni.dataset.touched = '1');
  $$('[name="sa"]', body).forEach(r => r.addEventListener('change', () => { if (r.checked) { at = r.value; ni.dataset.touched = ''; sync(); } }));
  $$('[name="si"]', body).forEach(r => r.addEventListener('change', () => { if (r.checked) into = r.value; }));
  sync();
  this.q2dlg('Fractionner la colonne par délimiteur', body, () => {
    const dl = delim(); if (!dl) { shake(ci); return false; }
    const n = Math.max(1, Math.round(Number(ni.value) || maxParts()));
    this.closeDialog();
    const patch = { col, delim: dl, at, into, n };
    if (edit) { edit(patch); return; }
    this.q2addStep(Object.assign({ op: 'split' }, patch), { auto: Tn => into === 'cols' && Tn ? { op: 'type', name: 'Type modifié', auto: true, changes: Array.from({ length: n }, (_, i) => [`${col}.${i + 1}`, 'text']).filter(c => Tn.cols.some(x => x.n === c[0])) } : null, sel: [] });
  }, 'split', { tall: true });
};
/* ───────── Extraire ───────── */
const EXT_T = { length: 'Longueur', first: 'Premiers caractères', last: 'Derniers caractères', before: 'Texte avant le délimiteur', after: 'Texte après le délimiteur' };
P_.q2extractDialog = function (kind, col, asNew, step, edit) {
  const T = this.q2table();
  const add = extra => {
    const s = Object.assign({ op: 'extract', kind, col }, extra);
    if (asNew) s.as = uniqCol(T, EXT_T[kind]);
    if (edit) { edit(extra); return; }
    this.q2addStep(s, { sel: asNew ? [s.as] : [col] });
  };
  if (kind === 'length') { add({}); return; }
  const isDel = kind === 'before' || kind === 'after';
  const body = h(`<div class="q2-form"><p class="q2-msg">${esc(fr(isDel ? `Extrait le texte ${kind === 'before' ? 'avant' : 'après'} un délimiteur dans ${col}.` : `Indique le nombre de caractères à conserver dans ${col}.`))}</p><label>${isDel ? 'Délimiteur' : 'Nombre'}<input value="${step ? esc(isDel ? step.delim : String(step.n)) : ''}" ${isDel ? '' : 'inputmode="numeric"'} spellcheck="false" autocapitalize="off" autocomplete="off"></label></div>`);
  const inp = $('input', body);
  this.q2dlg(EXT_T[kind], body, () => {
    const v = inp.value; if (!v) { shake(inp); return false; }
    if (!isDel && !(Number(v) > 0)) { shake(inp); return false; }
    this.closeDialog();
    add(isDel ? { delim: v } : { n: Number(v) });
  }, 'extract');
  setTimeout(() => inp.focus(), 60);
};
/* ───────── Choisir des colonnes ───────── */
P_.q2chooseCols = function (step, edit, T0) {
  const T = tableOf(this, T0); if (!T) return;
  const keep = new Set(step ? step.cols : T.cols.map(c => c.n));
  const body = h(`<div class="q2-form"><label class="q2-chk"><input type="checkbox" data-all ${keep.size === T.cols.length ? 'checked' : ''}> (Sélectionner toutes les colonnes)</label><div class="q2-chklist">${T.cols.map(c => `<label class="q2-chk"><input type="checkbox" data-c="${esc(c.n)}" ${keep.has(c.n) ? 'checked' : ''}> ${esc(c.n)}</label>`).join('')}</div></div>`);
  $('[data-all]', body).addEventListener('change', e => $$('[data-c]', body).forEach(i => i.checked = e.target.checked));
  this.q2dlg('Choisir des colonnes', body, () => {
    const cols = $$('[data-c]', body).filter(i => i.checked).map(i => i.dataset.c);
    if (!cols.length) return false;
    this.closeDialog();
    if (cols.length === T.cols.length && !edit) return;
    if (edit) edit({ cols }); else this.q2addStep({ op: 'selectCols', cols });
  }, 'choose', { tall: true });
};
/* ───────── Développer une colonne de tables ou d'enregistrements ───────── */
P_.q2expandDialog = function (col, b, step, edit, T0) {
  const T = tableOf(this, T0); if (!T) return;
  const names = [], isRec = T.rows.some(r => PQE.isRec(r[col]));
  for (const r of T.rows.slice(0, 1000)) { const v = r[col]; const ks = v instanceof PQE.MTable ? v.cols.map(c => c.n) : PQE.isRec(v) ? Object.keys(v) : []; ks.forEach(k => { if (!names.includes(k)) names.push(k); }); }
  const keep = new Set(step ? step.fields : names);
  const body = h(`<div class="q2-form"><p class="q2-msg">${esc(fr(`Développe les ${isRec ? 'enregistrements' : 'tables'} de la colonne ${col}.`))}</p><label class="q2-chk"><input type="checkbox" data-all checked> (Sélectionner toutes les colonnes)</label><div class="q2-chklist">${names.map(n => `<label class="q2-chk"><input type="checkbox" data-c="${esc(n)}" ${keep.has(n) ? 'checked' : ''}> ${esc(n)}</label>`).join('')}</div>
    <label class="q2-chk"><input type="checkbox" data-x="prefix" ${step ? (step.prefix ? 'checked' : '') : 'checked'}> Utiliser le nom de la colonne d’origine comme préfixe</label></div>`);
  $('[data-all]', body).addEventListener('change', e => $$('[data-c]', body).forEach(i => i.checked = e.target.checked));
  this.q2dlg('Développer', body, () => {
    const fields = $$('[data-c]', body).filter(i => i.checked).map(i => i.dataset.c); if (!fields.length) return false;
    const prefix = $('[data-x="prefix"]', body).checked;
    this.closeDialog();
    const patch = { col, fields, prefix, record: isRec, names: undefined };
    if (edit) edit(patch); else this.q2addStep(Object.assign({ op: 'expand' }, patch), { sel: [] });
  }, 'expand', { tall: names.length > 6 });
};

/* ───────── Filtre d'une colonne ───────── */
P_.q2filter = function (col, anchor) {
  const T = this.q2table(); if (!T) return;
  const c = T.cols.find(x => x.n === col), numeric = colIsNum(T, col) || c.t === 'date';
  let full = T.rows.length <= 1000;
  let vals = PQE.distinctValues(full ? T : { rows: T.rows.slice(0, 1000) }, col);
  const checked = new Set(vals.map((_, i) => i));
  const body = h(`<div class="q2-filter"><div class="q2-fbtns"><button class="chipb" data-f="asc">${QI.sortA.replace('width="20" height="20"', 'width="15" height="15"')} Trier par ordre croissant</button><button class="chipb" data-f="desc">${QI.sortZ.replace('width="20" height="20"', 'width="15" height="15"')} Trier par ordre décroissant</button><button class="chipb" data-f="empty">Supprimer les vides</button><button class="chipb" data-f="adv">${numeric ? (c.t === 'date' ? 'Filtres de date' : 'Filtres numériques') : 'Filtres textuels'} ›</button></div>
    <input class="q2-search" placeholder="Rechercher" spellcheck="false" autocapitalize="off" autocomplete="off"><div class="q2-vals"></div><p class="q2-more"></p></div>`);
  const list = $('.q2-vals', body), more = $('.q2-more', body);
  const draw = () => {
    const s = $('.q2-search', body).value.trim().toLowerCase();
    const shown = vals.map((v, i) => [v, i]).filter(([v]) => !s || String(v === null ? '(null)' : v).toLowerCase().includes(s));
    list.innerHTML = `<label class="q2-chk all"><input type="checkbox" data-all ${checked.size === vals.length ? 'checked' : ''}> (Sélectionner tout)</label>` + shown.slice(0, 1000).map(([v, i]) => `<label class="q2-chk"><input type="checkbox" data-i="${i}" ${checked.has(i) ? 'checked' : ''}> ${esc(v === null ? '(null)' : v === '' ? '(vide)' : disp(v, c.t).s)}</label>`).join('');
    more.innerHTML = full ? '' : `${QI.warn} La liste est peut-être incomplète. <button data-more>Charger plus</button>`;
  };
  body.addEventListener('change', e => {
    if (e.target.matches('[data-all]')) { if (e.target.checked) vals.forEach((_, i) => checked.add(i)); else checked.clear(); draw(); }
    else if (e.target.matches('[data-i]')) { const i = +e.target.dataset.i; e.target.checked ? checked.add(i) : checked.delete(i); const a = $('[data-all]', body); if (a) a.checked = checked.size === vals.length; }
  });
  $('.q2-search', body).addEventListener('input', draw);
  body.addEventListener('click', e => {
    const m = e.target.closest('[data-more]');
    if (m) { e.preventDefault(); const before = vals.slice(), keepV = new Set([...checked].map(i => PQE.keyOf(before[i]))); full = true; vals = PQE.distinctValues(T, col); checked.clear(); vals.forEach((v, i) => { if (keepV.has(PQE.keyOf(v)) || !before.some(b2 => PQE.keyOf(b2) === PQE.keyOf(v))) checked.add(i); }); draw(); this.q2emit('q2.loadMore', { col, n: vals.length }); return; }
    const f = e.target.closest('[data-f]'); if (!f) return; e.preventDefault();
    const k = f.dataset.f; this.closeDialog();
    if (k === 'asc' || k === 'desc') this.q2addStep({ op: 'sort', keys: [[col, k]] });
    else if (k === 'empty') this.q2addStep({ op: 'filter', cond: { kind: 'nonempty', col } });
    else this.q2advFilter(col);
  });
  draw();
  this.q2emit('q2.filterOpen', { col });
  this.q2dlg(`Filtrer · ${col}`, body, () => {
    if (checked.size === vals.length) { this.closeDialog(); this.q2emit('q2.cancel', { kind: 'filter', ok: true }); return; }
    if (!checked.size) return false;
    const keep = vals.filter((_, i) => checked.has(i)), drop = vals.filter((_, i) => !checked.has(i));
    /* Comme Power Query : peu de valeurs cochées → filtre positif ; sinon exclusion des valeurs décochées */
    const cond = drop.length <= keep.length ? { kind: 'values', col, exclude: true, values: drop } : { kind: 'values', col, exclude: false, values: keep };
    this.closeDialog();
    this.q2addStep({ op: 'filter', cond });
  }, 'filter', { tall: true });
};
P_.q2advFilter = function (col, preset) {
  const T = this.q2table(), c = T.cols.find(x => x.n === col), numeric = colIsNum(T, col);
  const OPS = numeric ? OPS_NUM : OPS_TXT;
  const cl = [{ op: (preset && preset.op) || (numeric ? 'eq' : 'eq'), v: '' }, { op: null, v: '' }];
  let join = 'and';
  const body = h(`<div class="q2-form"><p class="q2-msg">${esc(fr(`Conserver les lignes pour lesquelles « ${col} »`))}</p><div class="q2-row"><button class="sel-box" data-k="o1"></button><input data-k="v1" spellcheck="false" autocapitalize="off" autocomplete="off"></div>
    <div class="q2-radio"><label><input type="radio" name="fj" value="and" checked> Et</label><label><input type="radio" name="fj" value="or"> Ou</label></div><div class="q2-row"><button class="sel-box" data-k="o2"></button><input data-k="v2" spellcheck="false" autocapitalize="off" autocomplete="off"></div><p class="lc-note">${esc(fr('Saisis null pour cibler une valeur absente.'))}</p></div>`);
  this.q2sel($('[data-k="o1"]', body), () => OPS, cl[0].op, k => cl[0].op = k);
  this.q2sel($('[data-k="o2"]', body), () => [[null, '—']].concat(OPS), null, k => cl[1].op = k);
  $$('[name="fj"]', body).forEach(r => r.addEventListener('change', () => { if (r.checked) join = r.value; }));
  this.q2dlg('Filtrer les lignes', body, () => {
    const v1 = $('[data-k="v1"]', body).value, v2 = $('[data-k="v2"]', body).value;
    const clauses = [{ op: cl[0].op, val: parseVal(v1, numeric) }];
    if (cl[1].op) clauses.push({ op: cl[1].op, val: parseVal(v2, numeric) });
    this.closeDialog();
    this.q2addStep({ op: 'filter', cond: { kind: 'ops', col, clauses, join } });
  }, 'advFilter');
};

/* ───────── Fusionner des requêtes ───────── */
P_.q2mergeDialog = function (asNew, step, edit) {
  const eng = this.engine(), cur = this.q2q();
  const tables = this.P.queries.filter(q => eng.table(q));
  let left = step ? (step.from || cur.id) : cur.id, right = step ? step.with : (tables.find(q => q.id !== left) || {}).id;
  let lk = step ? step.left.slice() : [], rk = step ? step.right.slice() : [], kind = step ? step.kind : 'leftouter', fuzzy = false;
  const body = h(`<div class="q2-form q2-merge"><p class="q2-msg">Sélectionne une table et les colonnes correspondantes pour créer une table fusionnée.</p>${asNew ? '<button class="sel-box" data-k="l"></button>' : `<b class="q2-mt">${esc(cur.name)}</b>`}<div class="q2-mp" data-k="lp"></div>
    <button class="sel-box" data-k="r"></button><div class="q2-mp" data-k="rp"></div><label>Type de jointure<button class="sel-box" data-k="j"></button></label>
    <label class="q2-chk"><input type="checkbox" data-k="fz"> Utiliser la correspondance approximative pour effectuer la fusion</label><p class="q2-ms"></p></div>`);
  const prev = (id, keys, side) => {
    const T = eng.table(id); const box = $(`[data-k="${side}p"]`, body); box.innerHTML = '';
    if (!T) return;
    const tbl = h(`<div class="q2-mini"><table class="tbl"><thead><tr>${T.cols.map(c => `<th class="${keys.includes(c.n) ? 'csel' : ''}"><button data-mc="${side}|${esc(c.n)}">${keys.includes(c.n) ? `<b class="q2-kn">${keys.indexOf(c.n) + 1}</b>` : ''}${esc(c.n)}</button></th>`).join('')}</tr></thead><tbody>${T.rows.slice(0, 4).map(r => `<tr>${T.cols.map(c => { const d = disp(r[c.n], c.t); return `<td class="${keys.includes(c.n) ? 'csel' : ''} ${d.c === 'nul' ? 'null' : d.c}">${esc(d.s)}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`);
    box.appendChild(tbl);
  };
  const status = () => {
    const ms = $('.q2-ms', body);
    if (!lk.length || lk.length !== rk.length) { ms.textContent = lk.length || rk.length ? 'Sélectionne le même nombre de colonnes dans les deux tables.' : ''; ms.className = 'q2-ms'; return; }
    const L = eng.table(left), R = eng.table(right); if (!L || !R) return;
    const key = (r, ks) => ks.map(k => PQE.keyOf(r[k])).join('|');
    const set = new Set(R.rows.filter(r => rk.every(k => r[k] !== null && r[k] !== undefined)).map(r => key(r, rk)));
    const n = L.rows.filter(r => lk.every(k => r[k] !== null && r[k] !== undefined) && set.has(key(r, lk))).length;
    ms.className = 'q2-ms ok'; ms.textContent = fr(`La sélection correspond à ${n} ligne${n > 1 ? 's' : ''} sur ${L.rows.length} de la première table.`);
  };
  const draw = () => { prev(left, lk, 'l'); prev(right, rk, 'r'); status(); };
  if (asNew) this.q2sel($('[data-k="l"]', body), () => tables.map(q => [q.id, q.name]), left, k => { left = k; lk = []; draw(); });
  this.q2sel($('[data-k="r"]', body), () => tables.filter(q => asNew || q.id !== cur.id).map(q => [q.id, q.name]), right, k => { right = k; rk = []; draw(); this.q2emit('q2.mergeTable', { right: k }); });
  this.q2sel($('[data-k="j"]', body), () => Object.entries(PQE.JOINS).map(([k, v]) => [k, v[0]]), kind, k => { kind = k; this.q2emit('q2.mergeKind', { kind: k }); });
  $('[data-k="fz"]', body).addEventListener('change', e => { fuzzy = e.target.checked; this.q2emit('q2.mergeFuzzy', { on: fuzzy }); });
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-mc]'); if (!b) return; e.preventDefault();
    const [side, c] = [b.dataset.mc.slice(0, 1), b.dataset.mc.slice(2)];
    const arr = side === 'l' ? lk : rk;
    const i = arr.indexOf(c); if (i >= 0) arr.splice(i, 1); else if (e.ctrlKey || e.metaKey || arr.length === 0 || this.q2.multi) arr.push(c); else arr.splice(0, arr.length, c);
    draw(); this.q2emit('q2.mergeKey', { side, keys: arr.slice() });
  });
  draw();
  this.q2dlg(asNew ? 'Fusionner des requêtes comme nouvelle' : 'Fusionner', body, () => {
    if (!right || !lk.length || lk.length !== rk.length) return false;
    const spec = { with: right, left: lk.slice(), right: rk.slice(), kind, fuzzy, as: eng.qname(right) };
    if (this.q2emit('q2.try', { kind: 'merge', spec, from: left, asNew }) === 'no') return false;
    this.closeDialog();
    if (edit) { edit({ with: right, left: spec.left, right: spec.right, kind, fuzzy }); return; }
    if (fuzzy) spec.fuzzy = true;
    if (asNew) this.q2addQuery({ name: uniqQName(this.P, 'Fusionner1'), group: (eng.q(left) || {}).group || null, steps: [Object.assign({ id: uid(), name: 'Source', op: 'merge', from: left }, spec)] }, 'merge', eng.q(left));
    else this.q2addStep(Object.assign({ op: 'merge' }, spec));
  }, 'merge', { tall: true });
};
/* ───────── Ajouter des requêtes ───────── */
P_.q2appendDialog = function (asNew) {
  const eng = this.engine(), cur = this.q2q();
  const tables = this.P.queries.filter(q => eng.table(q));
  let mode = 'two', first = cur.id, second = (tables.find(q => q.id !== cur.id) || {}).id; const many = asNew ? [] : [cur.id];
  const body = h(`<div class="q2-form"><p class="q2-msg">Concatène les lignes de deux tables ou plus.</p><div class="q2-radio"><label><input type="radio" name="am" value="two" checked> Deux tables</label><label><input type="radio" name="am" value="many"> Trois tables ou plus</label></div><div class="q2-ap"></div></div>`);
  const ap = $('.q2-ap', body);
  const draw = () => {
    ap.innerHTML = '';
    if (mode === 'two') {
      const f = h(`<label>Première table${asNew ? '<button class="sel-box" data-k="f"></button>' : `<b class="q2-mt">${esc(cur.name)}</b>`}</label>`); ap.appendChild(f);
      if (asNew) this.q2sel($('[data-k="f"]', f), () => tables.map(q => [q.id, q.name]), first, k => first = k);
      const s = h(`<label>Deuxième table<button class="sel-box" data-k="s"></button></label>`); ap.appendChild(s);
      this.q2sel($('[data-k="s"]', s), () => tables.map(q => [q.id, q.name]), second, k => second = k);
    } else {
      const avail = h(`<div><small class="q2-lbl">Tables disponibles</small><div class="q2-alist">${tables.map(q => `<button class="chipb" data-add="${esc(q.id)}">${esc(q.name)}</button>`).join('')}</div></div>`);
      const chosen = h(`<div><small class="q2-lbl">Tables à ajouter (${many.length})</small><ol class="q2-olist">${many.map((id, i) => `<li><span>${esc(eng.qname(id))}</span><button data-up="${i}" aria-label="Monter">↑</button><button data-rm="${i}" aria-label="Retirer">${I.close.replace('<svg', '<svg width="11" height="11"')}</button></li>`).join('')}</ol></div>`);
      ap.appendChild(avail); ap.appendChild(chosen);
    }
  };
  ap.addEventListener('click', e => {
    const a = e.target.closest('[data-add]'), u = e.target.closest('[data-up]'), r = e.target.closest('[data-rm]');
    if (a) { e.preventDefault(); many.push(a.dataset.add); draw(); this.q2emit('q2.appendPick', { list: many.slice() }); }
    else if (u) { e.preventDefault(); const i = +u.dataset.up; if (i > 0) { const [x] = many.splice(i, 1); many.splice(i - 1, 0, x); draw(); } }
    else if (r) { e.preventDefault(); many.splice(+r.dataset.rm, 1); draw(); this.q2emit('q2.appendPick', { list: many.slice() }); }
  });
  $$('[name="am"]', body).forEach(r => r.addEventListener('change', () => { if (r.checked) { mode = r.value; draw(); } }));
  draw();
  this.q2dlg(asNew ? 'Ajouter des requêtes comme nouvelle' : 'Ajouter', body, () => {
    const list = mode === 'two' ? [asNew ? first : cur.id, second] : many.slice();
    if (list.length < 2 || list.some(x => !x)) return false;
    if (this.q2emit('q2.try', { kind: 'append', list, asNew }) === 'no') return false;
    this.closeDialog();
    if (asNew) this.q2addQuery({ name: uniqQName(this.P, 'Ajouter1'), steps: [{ id: uid(), name: 'Source', op: 'append', base: false, with: list }] }, 'append');
    else this.q2addStep({ op: 'append', base: true, with: list.slice(1) });
  }, 'append', { tall: true });
};

/* ───────── Nouvelles sources ───────── */
P_.q2blank = function () {
  const nq = this.q2addQuery({ name: uniqQName(this.P, 'Requête1'), blank: true, steps: [{ id: uid(), name: 'Source', op: 'mstep', src: '""' }] }, 'blank');
  if (nq) this.q2adv(nq);
};
const M1FILES = [{ nom: 'Billetterie_Wonderland.xlsx', dir: '', kind: 'xlsx', date: '06/06/2026 08:15', size: '18 Ko', m1: 'tBilletterie' }, { nom: 'Frequentation_Wonderland.csv', dir: '', kind: 'csv', date: '06/06/2026 08:20', size: '2 Ko', m1: 'Frequentation_Wonderland' }, { nom: 'Frequentation_Attractions.csv', dir: '', kind: 'csv', date: '06/06/2026 08:22', size: '1 Ko', m1: 'Frequentation_Attractions' }, { nom: 'Wonderland_M208_Douze_Fichiers_Mensuels.zip', dir: 'Maintenance/Archives_2025', kind: 'zip', date: '08/06/2026 09:58', size: '5 Ko' }];
P_.q2filePicker = function (kind, onPick) {
  const all = Object.entries(files()).map(([nom, f]) => ({ nom, dir: f.dir || '', kind: f.kind, date: f.date, size: f.size })).concat(M1FILES);
  let dir = this.q2dir || 'Maintenance', filter = kind === 'excel' ? 'xlsx' : 'csv', sel = null;
  const FILT = [['xlsx', 'Classeurs Excel (*.xlsx; *.xlsm; *.xls)'], ['csv', 'Fichiers texte (*.csv; *.txt)'], ['all', 'Tous les fichiers (*.*)']];
  const body = h(`<div><div class="crumbs q2-crumbs"></div><div class="flist q2-flist"></div><div class="fname"><span>Nom${NB}:</span><input readonly aria-label="Nom du fichier"></div><div class="fname"><span>Type${NB}:</span><button class="sel-box" data-x="f" style="flex:1"></button></div></div>`);
  const draw = () => {
    const crumbs = $('.q2-crumbs', body), list = $('.q2-flist', body);
    const parts = dir ? dir.split('/') : [];
    crumbs.innerHTML = `<button data-dir="">Documents › Wonderland</button>${parts.map((p, i) => ` › <button data-dir="${esc(parts.slice(0, i + 1).join('/'))}">${esc(p)}</button>`).join('')}`;
    const subs = [...new Set(all.map(f => f.dir).filter(d => d !== dir && d.startsWith(dir ? dir + '/' : '') && d).map(d => d.slice(dir ? dir.length + 1 : 0).split('/')[0]))];
    const fl = all.filter(f => f.dir === dir && (filter === 'all' || f.kind === filter));
    list.innerHTML = subs.map(s => `<button class="frow" data-sub="${esc(s)}"><span class="ficon dir"></span><span>${esc(s)}</span><time>Dossier</time></button>`).join('') + fl.map(f => `<button class="frow ${sel === f.nom ? 'sel' : ''}" data-f="${esc(f.nom)}"><span class="ficon ${f.kind}">${f.kind.toUpperCase()}</span><span>${esc(f.nom).replace(/_/g, '_<wbr>')}</span><time>${esc(f.date || '')}</time></button>`).join('') || '<p class="prev-empty">Aucun fichier de ce type dans ce dossier.</p>';
    $('input', body).value = sel || '';
    this.applyMarks();
  };
  this.q2sel($('[data-x="f"]', body), () => FILT, filter, k => { filter = k; draw(); });
  body.addEventListener('click', e => {
    const d = e.target.closest('[data-dir]'), s = e.target.closest('[data-sub]'), f = e.target.closest('[data-f]');
    if (d) { dir = d.dataset.dir; sel = null; draw(); this.q2emit('q2.dir', { dir }); }
    else if (s) { dir = (dir ? dir + '/' : '') + s.dataset.sub; sel = null; draw(); this.q2emit('q2.dir', { dir }); }
    else if (f) { sel = f.dataset.f; draw(); this.q2emit('q2.filePick', { file: sel }); }
  });
  draw();
  this.dialog('Ouvrir', body, [{ t: 'Ouvrir', pri: true, id: 'open', fn: b => {
    if (!sel) { shake(b); return; }
    const f = all.find(x => x.nom === sel);
    if (this.q2emit('q2.file', { file: sel, kind, fileKind: f.kind, m1: f.m1 || null }) === 'no') { shake(b); return; }
    this.q2dir = dir;
    if (onPick) { onPick(sel, f); return; }
    if (f.m1) { this.message('Source déjà connectée', `${sel} alimente déjà la requête « ${f.m1} » du rapport historique.`, [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]); return; }
    if (f.kind === 'zip') { this.message('Impossible d’ouvrir ce fichier', `${sel} est une archive compressée. Extrais ses fichiers, puis importe les CSV un par un.`, [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]); return; }
    if (kind === 'excel' && f.kind !== 'xlsx') { this.message('Format inattendu', `Le connecteur Classeur Excel ne peut pas lire ${sel}.`, [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]); return; }
    if (kind === 'csv' && f.kind !== 'csv') { this.message('Format inattendu', `Le connecteur Texte/CSV ne peut pas lire ${sel}.`, [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]); return; }
    if (f.kind === 'xlsx') this.q2navigator(sel); else this.q2csvDialog(sel);
  } }, { t: 'Annuler', id: 'cancel', fn: () => { this.closeDialog(); this.q2emit('q2.cancel', { kind: 'open' }); } }], { kind: 'q2open', tall: true });
  this.q2emit('q2.dialog', { kind: 'open', connector: kind });
};
P_.q2navigator = function (file, onDone) {
  const f = files()[file]; let focus = null; const checked = new Set();
  const body = h(`<div class="nav-split"><div class="nav-tree"></div><div class="nav-prev"></div></div>`);
  const draw = () => {
    const tree = $('.nav-tree', body), prev = $('.nav-prev', body);
    tree.innerHTML = `<div class="tree-t nav-root">${I.chev}${esc(file)} [${f.sheets.length}]</div>` + f.sheets.map(sh => `<div class="nav-obj ${focus === sh.name ? 'focus' : ''}" data-o="${esc(sh.name)}"><button class="cbx ${checked.has(sh.name) ? 'on' : ''}" data-chk="${esc(sh.name)}" aria-label="Sélectionner ${esc(sh.name)}"></button><span>${I.sheet}</span><span>${esc(sh.name)}</span><span class="kind">Feuille</span></div>`).join('');
    prev.innerHTML = '';
    const sh = f.sheets.find(s => s.name === focus);
    if (!sh) prev.appendChild(h(`<div class="prev-empty">Sélectionne un élément pour afficher son aperçu.</div>`));
    else { const T = PQE.sheetTable(sh); prev.appendChild(h(`<div class="np-h">${esc(sh.name)}</div>`)); prev.appendChild(this.q2mini({ cols: T.cols, rows: T.rows.slice(0, 14) }, 14)); }
    this.applyMarks();
  };
  body.addEventListener('click', e => {
    const c = e.target.closest('[data-chk]'), o = e.target.closest('[data-o]');
    if (c) { e.stopPropagation(); const n = c.dataset.chk; checked.has(n) ? checked.delete(n) : checked.add(n); focus = n; draw(); this.q2emit('q2.navCheck', { item: n, on: checked.has(n) }); return; }
    if (o) { focus = o.dataset.o; draw(); this.q2emit('q2.navFocus', { item: focus }); }
  });
  draw();
  this.dialog('Navigateur', body, [{ t: 'OK', pri: true, id: 'ok', fn: b => {
    if (!checked.size) { shake(b); return; }
    if (this.q2emit('q2.navOk', { file, items: [...checked] }) === 'no') { shake(b); return; }
    this.closeDialog();
    for (const item of checked) this.q2excelQuery(file, item, onDone);
  } }, { t: 'Annuler', id: 'cancel', fn: () => { this.closeDialog(); this.q2emit('q2.cancel', { kind: 'nav' }); } }], { kind: 'q2nav', tall: true });
  this.q2emit('q2.dialog', { kind: 'nav', file });
};
/* Requête créée par le connecteur Excel : Source, Navigation, puis les deux étapes automatiques */
PBI.excelQuery = function (P, file, item, name) {
  const steps = [{ id: uid(), name: 'Source', op: 'excel', file }, { id: uid(), name: 'Navigation', op: 'nav', item }, { id: uid(), name: 'En-têtes promus', op: 'promote', auto: true }];
  const q = { id: uid('q'), name: name || item, m2: true, load: true, refresh: true, steps };
  const tmp = { queries: P.queries.concat(q) };
  const eng = new PQE.Engine(tmp, files(), () => null);
  const T = eng.table(q);
  if (T) steps.push({ id: uid(), name: 'Type modifié', op: 'type', auto: true, changes: T.cols.map(c => { const d = PQE.detectType(T.rows.map(r => r[c.n])); return [c.n, d === 'any' ? 'text' : d]; }) });
  return q;
};
P_.q2excelQuery = function (file, item, onDone) {
  const q = PBI.excelQuery(this.P, file, item, uniqQName(this.P, item));
  const nq = this.q2addQuery(q, 'excel');
  if (nq && onDone) onDone(nq);
};
/* Requête créée par le connecteur Texte/CSV */
PBI.csvQuery = function (P, file, opts) {
  const f = files()[file];
  const head = PQE.parseCsv(PQE.decodeAs(f.text, opts.enc, f.bom), opts.delim)[0];
  const steps = [{ id: uid(), name: 'Source', op: 'csv', file, delim: opts.delim, enc: opts.enc, columns: head.length }, { id: uid(), name: 'En-têtes promus', op: 'promote', auto: true }];
  const q = { id: uid('q'), name: opts.name || file.replace(/\.[^.]+$/, ''), m2: true, load: true, refresh: true, steps };
  if (opts.detect !== 'none') {
    const eng = new PQE.Engine({ queries: P.queries.concat(q) }, files(), () => null);
    const T = eng.table(q);
    if (T) steps.push({ id: uid(), name: 'Type modifié', op: 'type', auto: true, changes: T.cols.map(c => { const vals = T.rows.map(r => r[c.n]); const d = PQE.detectType(opts.detect === 'all' ? vals : vals.slice(0, 200)); return [c.n, d === 'any' ? 'text' : d]; }) });
  }
  return q;
};
const ENC = [[65001, '65001 : Unicode (UTF-8)'], [1252, '1252 : Europe occidentale (Windows)'], [20127, '20127 : US-ASCII'], [28591, '28591 : Europe occidentale (ISO)']];
const DEL = [[',', 'Virgule'], [';', 'Point-virgule'], ['\t', 'Tabulation'], [' ', 'Espace'], [':', 'Deux-points'], ['|', 'Personnalisé : |']];
const DET = [['200', 'Selon les 200 premières lignes'], ['all', 'Selon le jeu de données entier'], ['none', 'Ne pas détecter les types de données']];
P_.q2csvDialog = function (file, step, edit, onDone) {
  const f = files()[file];
  const st = { enc: step ? step.enc : (f.bom ? 65001 : 1252), delim: step ? step.delim : ',', detect: '200' };
  const body = h(`<div class="csv-wrap"><div class="csv-opts"><div><label>Origine du fichier</label><button class="sel-box" data-x="enc"></button></div><div><label>Délimiteur</label><button class="sel-box" data-x="delim"></button></div>${step ? '' : '<div style="grid-column:1/-1"><label>Détection du type de données</label><button class="sel-box" data-x="detect"></button></div>'}</div><div class="nav-prev q2-csvp"></div></div>`);
  const draw = () => {
    const lines = PQE.parseCsv(PQE.decodeAs(f.text, st.enc, f.bom), st.delim);
    const n = Math.max(...lines.map(l => l.length));
    const cols = (n === lines[0].length ? lines[0] : Array.from({ length: n }, (_, i) => `Column${i + 1}`)).map((c, i) => ({ n: c || `Column${i + 1}`, t: 'text' }));
    const rows = lines.slice(n === lines[0].length ? 1 : 0, 21).map(l => { const o = {}; cols.forEach((c, i) => o[c.n] = l[i] === undefined ? null : l[i]); return o; });
    const p = $('.q2-csvp', body); p.innerHTML = ''; p.appendChild(this.q2mini({ cols, rows }, 20));
    this.applyMarks();
  };
  this.q2sel($('[data-x="enc"]', body), () => ENC, st.enc, k => { st.enc = Number(k); draw(); this.q2emit('q2.csvOpt', { k: 'enc', v: st.enc }); });
  this.q2sel($('[data-x="delim"]', body), () => DEL, st.delim, k => { st.delim = k; draw(); this.q2emit('q2.csvOpt', { k: 'delim', v: k }); });
  if (!step) this.q2sel($('[data-x="detect"]', body), () => DET, st.detect, k => { st.detect = k; this.q2emit('q2.csvOpt', { k: 'detect', v: k }); });
  draw();
  this.q2dlg(file, body, () => {
    if (this.q2emit('q2.csvOk', { file, enc: st.enc, delim: st.delim, detect: st.detect }) === 'no') return false;
    this.closeDialog();
    if (edit) { edit({ enc: st.enc, delim: st.delim, columns: Math.max(...PQE.parseCsv(PQE.decodeAs(f.text, st.enc, f.bom), st.delim).map(l => l.length)) }); return; }
    const q = PBI.csvQuery(this.P, file, { enc: st.enc, delim: st.delim, detect: st.detect, name: uniqQName(this.P, file.replace(/\.[^.]+$/, '')) });
    const nq = this.q2addQuery(q, 'csv');
    if (nq && onDone) onDone(nq);
  }, 'csv', { tall: true });
};
/* ───────── Entrer des données ───────── */
P_.q2enterData = function (step, edit) {
  let cols = step ? step.cols.slice() : ['Colonne1'], rows = step ? step.rows.map(r => r.slice()) : [['']];
  const body = h(`<div class="q2-form"><div class="q2-tools"><button class="chipb pri" data-x="paste" ${clip() ? '' : 'disabled'}>Coller</button><button class="chipb" data-x="col">+ Colonne</button><button class="chipb" data-x="row">+ Ligne</button></div><div class="q2-ent"></div>${step ? '' : '<label>Nom<input data-x="n" value="Table" spellcheck="false" autocapitalize="off" autocomplete="off"></label>'}</div>`);
  const draw = () => {
    const g = $('.q2-ent', body);
    g.innerHTML = `<table class="tbl"><thead><tr>${cols.map((c, j) => `<th><input data-h="${j}" value="${esc(c)}" spellcheck="false" autocapitalize="off"></th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr>${cols.map((_, j) => `<td><input data-r="${i}|${j}" value="${esc(r[j] === null || r[j] === undefined ? '' : String(r[j]))}" spellcheck="false" autocapitalize="off"></td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };
  body.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.h !== undefined) cols[+t.dataset.h] = t.value;
    else if (t.dataset.r) { const [i, j] = t.dataset.r.split('|').map(Number); rows[i][j] = t.value; }
  });
  body.addEventListener('click', e => {
    const x = e.target.closest('[data-x]'); if (!x || x.tagName === 'INPUT') return; e.preventDefault();
    if (x.dataset.x === 'col') { cols.push(`Colonne${cols.length + 1}`); rows.forEach(r => r.push('')); }
    else if (x.dataset.x === 'row') rows.push(cols.map(() => ''));
    else if (x.dataset.x === 'paste') {
      const lines = clip().split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
      const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
      cols = lines[0].split(sep).map(s => s.trim()); rows = lines.slice(1).map(l => l.split(sep).map(s => s === 'null' ? '' : s));
      this.q2emit('q2.paste', { where: 'enter' });
    }
    draw();
  });
  draw();
  this.q2dlg('Créer une table', body, () => {
    const name = step ? null : $('[data-x="n"]', body).value.trim();
    if (!step && !name) return false;
    if (cols.some(c => !c.trim()) || new Set(cols).size !== cols.length) return false;
    const data = rows.map(r => r.map(v => v === '' || v === 'null' ? null : v));
    this.closeDialog();
    if (edit) { edit({ cols: cols.slice(), rows: data }); return; }
    const q = { name: uniqQName(this.P, name), steps: [{ id: uid(), name: 'Source', op: 'enter', cols: cols.slice(), rows: data }] };
    const tmp = PQE.OPS.enter.apply(null, q.steps[0]);
    q.steps.push({ id: uid(), name: 'Type modifié', op: 'type', auto: true, changes: tmp.cols.map(c => [c.n, 'text']) });
    this.q2addQuery(q, 'enter');
  }, 'enter', { tall: true });
};

/* ───────── Formule d'étape (fx) ───────── */
P_.q2stepFormula = function (i, b) {
  const q = this.q2q(); if (!q || this.q2legacyGuard(q, 'mstep')) return;
  const at = this.q2at(), edit = i !== null && i !== undefined;
  const s = edit ? q.steps[i] : null;
  const body = h(`<div class="q2-form">${edit ? '' : `<label>Nom de l’étape<input data-x="n" value="${esc(PQE.qid ? 'Personnalisé' : '')}" spellcheck="false" autocapitalize="off" autocomplete="off"></label>`}<small class="q2-lbl">Formule</small></div>`);
  const fb = this.q2formulaBox(null, edit ? s.src : PQE.qid(q.steps[at].name));
  body.appendChild(fb.el);
  this.q2dlg(edit ? `Formule · ${s.name}` : 'Ajouter une étape', body, () => {
    const src = fb.value(); if (!src || !fb.check()) { shake(fb.ta); return false; }
    this.closeDialog();
    if (edit) this.q2editStep(i, { src });
    else { let name = ($('[data-x="n"]', body).value || 'Personnalisé').trim(); this.q2addStep({ op: 'mstep', name: q.steps.some(x => x.name === name) ? undefined : name, src }); }
  }, 'mstep', { tall: true });
};
P_.q2showFormula = function () {
  const q = this.q2q(), at = this.q2at(), eng = this.engine();
  const f = eng.formula(q, at) || (PBI.stepFormula ? '= ' + PBI.stepFormula(q, at) : '');
  const body = h(`<pre class="q2-code"></pre>`); body.textContent = f;
  this.dialog(`Formule · ${q.steps[at].name}`, body, [{ t: 'Fermer', pri: true, fn: () => this.closeDialog() }], { kind: 'q2formula' });
  this.q2emit('q2.formula', { i: at });
};

/* ───────── Dépendances de requête ───────── */
P_.q2deps = function () {
  const eng = this.engine(), P = this.P;
  const nodes = new Map();
  const add = (id, kind, label, extra) => { if (!nodes.has(id)) nodes.set(id, Object.assign({ id, kind, label, up: [], depth: 0 }, extra || {})); return nodes.get(id); };
  for (const q of P.queries) {
    const n = add('q:' + q.id, 'query', q.name, { q });
    const d = eng.deps(q);
    d.files.forEach(f => { add('f:' + f, 'file', f, { path: `C:\\…\\${(files()[f] || {}).dir ? files()[f].dir.replace(/\//g, '\\') + '\\' : ''}${f}` }); n.up.push('f:' + f); });
    d.queries.forEach(id => n.up.push('q:' + id));
    if (!eng.isLegacy(q) && q.steps.some(s => s.op === 'custom') ) for (const o of P.queries) if (o.id !== q.id && q.steps.some(s => s.op === 'custom' && s.src.includes(o.name)) && !n.up.includes('q:' + o.id)) n.up.push('q:' + o.id);
  }
  const depth = (n, seen = new Set()) => { if (seen.has(n.id)) return 0; seen.add(n.id); if (!n.up.length) return 0; return 1 + Math.max(...n.up.map(u => nodes.has(u) ? depth(nodes.get(u), seen) : 0)); };
  nodes.forEach(n => n.depth = depth(n));
  const layers = []; nodes.forEach(n => { (layers[n.depth] = layers[n.depth] || []).push(n); });
  const body = h(`<div class="q2-deps"><div class="q2-dg"></div><svg class="q2-dl"></svg><p class="lc-note">${esc(fr('Touche une requête pour mettre en évidence ses sources et les requêtes qui en dépendent.'))}</p></div>`);
  const dg = $('.q2-dg', body);
  layers.forEach(L => {
    const row = h(`<div class="q2-dr"></div>`);
    L.sort((a, b) => a.label.localeCompare(b.label)).forEach(n => row.appendChild(h(`<button class="q2-dn ${n.kind}" data-dn="${esc(n.id)}">${n.kind === 'file' ? `<i class="ficon ${n.label.endsWith('.csv') ? 'csv' : 'xlsx'}">${n.label.endsWith('.csv') ? 'CSV' : 'XLS'}</i>` : I.tbl}<span>${esc(n.label).replace(/_/g, '_<wbr>')}</span>${n.kind === 'query' ? `<small>${loadOf(n.q) ? (n.q.tableId ? 'Table du modèle' : 'Chargement activé') : 'Chargement désactivé'}</small>` : '<small>Fichier source</small>'}</button>`)));
    dg.appendChild(row);
  });
  const lines = () => {
    const svgEl = $('.q2-dl', body), r0 = body.getBoundingClientRect(); if (!r0.width) return;
    const k = r0.width / body.offsetWidth || 1;
    svgEl.setAttribute('width', body.scrollWidth); svgEl.setAttribute('height', body.scrollHeight);
    let s = '';
    nodes.forEach(n => n.up.forEach(u => {
      const a = $(`[data-dn="${CSS.escape(u)}"]`, body), b2 = $(`[data-dn="${CSS.escape(n.id)}"]`, body); if (!a || !b2) return;
      const ra = a.getBoundingClientRect(), rb = b2.getBoundingClientRect();
      const x1 = (ra.left + ra.width / 2 - r0.left) / k, y1 = (ra.bottom - r0.top) / k, x2 = (rb.left + rb.width / 2 - r0.left) / k, y2 = (rb.top - r0.top) / k;
      const hl = this._depHl && (this._depHl.has(u) && this._depHl.has(n.id));
      s += `<path d="M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}" class="${hl ? 'hl' : ''}"/>`;
    }));
    svgEl.innerHTML = s;
  };
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-dn]'); if (!b) return;
    const id = b.dataset.dn, set = new Set([id]);
    const upw = x => { const n = nodes.get(x); if (n) n.up.forEach(u => { if (!set.has(u)) { set.add(u); upw(u); } }); };
    const down = x => nodes.forEach(n => { if (n.up.includes(x) && !set.has(n.id)) { set.add(n.id); down(n.id); } });
    upw(id); down(id);
    this._depHl = this._depHl && this._depHl.has(id) && this._depSel === id ? null : set; this._depSel = this._depHl ? id : null;
    $$('[data-dn]', body).forEach(x => { x.classList.toggle('hl', !!this._depHl && this._depHl.has(x.dataset.dn)); x.classList.toggle('dim', !!this._depHl && !this._depHl.has(x.dataset.dn)); x.classList.toggle('sel', x.dataset.dn === this._depSel); });
    lines();
    this.q2emit('q2.depsNode', { id: id.slice(2), kind: id[0] === 'f' ? 'file' : 'query', name: (nodes.get(id) || {}).label, up: [...(nodes.get(id) || { up: [] }).up], hl: this._depHl ? [...this._depHl] : [] });
  });
  this._depHl = null; this._depSel = null;
  const shut = () => { this.closeDialog(); this.q2emit('q2.depsClose', {}); };
  this.dialog('Dépendances de requête', body, [{ t: 'Fermer', pri: true, id: 'close', fn: shut }], { kind: 'q2deps', tall: true, onX: shut });
  requestAnimationFrame(() => requestAnimationFrame(lines));
  $('.dlg-b', this.dlg) && $('.dlg-b', this.dlg).addEventListener('scroll', lines, { passive: true });
  this.q2emit('q2.deps', { nodes: [...nodes.values()].map(n => ({ id: n.id, label: n.label, up: n.up })) });
};

/* ───────── Fermer et appliquer : le modèle reçoit seulement les requêtes chargées ───────── */
const toModel = v => v instanceof PQE.MDate ? v.iso() : v instanceof PQE.MErr || v instanceof PQE.MTable || PQE.isRec(v) || Array.isArray(v) ? null : v;
P_.q2applyModel = function () {
  const eng = this.engine(), P = this.P, created = [], removed = [];
  for (const q of P.queries) {
    const legacy = eng.isLegacy(q);
    const t = legacy ? P.tables.find(x => x.id === q.tableId) : P.tables.find(x => x.queryId === q.id);
    if (!loadOf(q)) { if (t) { P.tables.splice(P.tables.indexOf(t), 1); removed.push(t.name); } continue; }
    if (legacy && t) continue;
    const T = eng.table(q); if (!T) continue;
    const cols = T.cols.map(c => ({ n: c.n, t: ['any', 'table', 'record', 'list'].includes(c.t) ? 'text' : c.t }));
    const rows = T.rows.map(r => { const o = {}; for (const c of T.cols) o[c.n] = toModel(r[c.n]); return o; });
    if (t) { t.cols = cols; t.rows = rows; }
    else { P.tables.push({ id: 'tbl_' + q.id, name: q.name, queryId: q.id, loadStatus: 'completed', cols, rows }); created.push(q.name); }
  }
  P.dirty = true;
  return { created, removed };
};
})();

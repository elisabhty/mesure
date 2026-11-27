/* Mini-jeux : trier des cartes, remettre des étapes dans l'ordre, relier des paires.
   Chaque jeu se joue au doigt (glisser) ou par simples touchers, et émet les mêmes événements que les anciennes planches. */
(() => {
const P = window.PBQ;
const { h, esc, fr, $, $$ } = P;
const quick = () => !!window.PBQ_FAST || matchMedia('(prefers-reduced-motion: reduce)').matches;
const later = (ms, f) => setTimeout(f, quick() ? 0 : ms);
const act = (type, payload) => P.act(type, payload);
const shake = el => P.shake(el);

/* Geste de glisser : il démarre après quelques pixels, un simple toucher reste un clic */
function draggable(el, o) {
  el.addEventListener('pointerdown', e => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || el.closest('.j-locked') || (o.can && !o.can(e))) return;
    const x0 = e.clientX, y0 = e.clientY, id = e.pointerId; let on = false;
    const mv = ev => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!on && Math.hypot(dx, dy) > 7) { on = true; o.start && o.start(ev); }
      if (on) { ev.preventDefault(); o.move && o.move(dx, dy, ev); }
    };
    const up = ev => {
      if (ev.pointerId !== id) return;
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (on) { el._dragged = performance.now(); o.end && o.end(ev, ev.type === 'pointercancel'); }
    };
    addEventListener('pointermove', mv, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
  /* Le clic qui suit un glisser ne compte pas comme un toucher */
  el.addEventListener('click', e => { if (el._dragged && performance.now() - el._dragged < 450) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
const inside = (x, y, el, pad = 8) => { const r = el.getBoundingClientRect(); return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad; };
/* Échelle d'affichage (le téléphone est réduit sur ordinateur) */
const scaleOf = el => { const r = el.getBoundingClientRect(); return el.offsetWidth ? r.width / el.offsetWidth : 1; };
/* Animation FLIP : les éléments glissent de leur ancienne place vers la nouvelle */
function flip(els, change) {
  const before = new Map(els.map(e => [e, e.getBoundingClientRect()]));
  change();
  if (quick()) return;
  els.forEach(e => {
    const a = before.get(e), b = e.getBoundingClientRect(), k = scaleOf(e) || 1;
    const dx = (a.left - b.left) / k, dy = (a.top - b.top) / k;
    if (!dx && !dy) return;
    e.style.transition = 'none'; e.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => { e.style.transition = ''; e.style.transform = ''; });
  });
}
const ARROW_L = '<svg class="j-ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_R = '<svg class="j-ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GRIP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5.5h10M3 8h10M3 10.5h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

/* ───────── Tri : une pile de cartes à ranger dans des cases ─────────
   spec : { title, intro, bare, options: [[v, libellé]], rows: [{ id, t, sub }], btn, ev: 'k2' | 'match', check(values) }
   Deux cases : on balaie la carte à gauche ou à droite. Trois ou quatre : on la glisse sur une case. Toucher une case range la carte du dessus. */
function tri(spec) {
  const n = spec.options.length, two = n === 2;
  const ev = spec.ev || 'k2';
  const el = h(`<div><div class="${spec.bare ? '' : 'board '}j-tri n${n}">${spec.title ? `<h3>${esc(fr(spec.title))}</h3>` : ''}${spec.intro ? `<p>${esc(fr(spec.intro))}</p>` : ''}
    <div class="j-stage"><div class="j-pile"></div><div class="j-done"><p>${esc(fr(spec.doneText || 'Toutes les cartes sont rangées.'))}</p><button class="cta dark j-go" type="button">${esc(fr(spec.btn || 'Vérifier'))}</button></div></div>
    <p class="j-help">${esc(fr(spec.help || (two ? 'Glisse la carte vers la bonne case, ou touche la case.' : 'Glisse la carte sur la bonne case, ou touche la case.')))}</p>
    <div class="j-zones"></div></div></div>`);
  const root = el.firstElementChild, stage = $('.j-stage', el), pile = $('.j-pile', el), zonesEl = $('.j-zones', el), go = $('.j-go', el);
  const rows = spec.rows.map(r => ({ id: String(r.id), t: r.t, sub: r.sub }));
  const row = id => rows.find(r => r.id === id);
  const vals = {}; const left = rows.map(r => r.id);
  let locked = false, busy = false;
  spec.options.forEach(([v, lab], i) => {
    const z = h(`<div class="j-zone" data-z="${esc(String(v))}"><button class="j-zt" type="button" data-v="${esc(String(v))}">${two && i === 0 ? ARROW_L : ''}<span class="j-zl">${esc(fr(lab))}</span><i>0</i>${two && i === 1 ? ARROW_R : ''}</button><div class="j-in"></div></div>`);
    $('.j-zt', z).addEventListener('click', () => { if (!busy && !locked && left.length) send(left[0], String(v)); });
    zonesEl.appendChild(z);
  });
  const zones = $$('.j-zone', zonesEl);
  const zoneOf = v => zones.find(z => z.dataset.z === v);
  const count = (v, bump) => { const z = zoneOf(v); if (!z) return; const i = $('.j-zt i', z); i.textContent = Object.values(vals).filter(x => x === v).length; if (bump && !quick()) { i.classList.remove('bump'); void i.offsetWidth; i.classList.add('bump'); } };
  const cardHtml = (r, k) => `<b>${esc(fr(r.t))}</b>${r.sub ? `<small>${esc(fr(r.sub))}</small>` : ''}<em class="j-k">${k}/${rows.length}</em>`;
  /* La pile garde la hauteur de la plus grande carte : rien ne saute d'une carte à l'autre */
  const measure = () => {
    if (!pile.offsetWidth) return;
    const m = h(`<div class="j-measure"></div>`); pile.appendChild(m);
    let max = 0; rows.forEach(r => { const c = h(`<div class="j-card">${cardHtml(r, rows.length)}</div>`); m.appendChild(c); max = Math.max(max, c.offsetHeight); });
    m.remove(); if (max) stage.style.setProperty('--jh', max + 'px');
  };
  let lastW = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { const w = pile.offsetWidth; if (w && w !== lastW) { lastW = w; measure(); } }).observe(stage);
  function draw(enter) {
    pile.innerHTML = '';
    stage.classList.toggle('fini', !left.length);
    if (!left.length) return;
    const r = row(left[0]);
    if (left.length > 2) pile.appendChild(h('<div class="j-ghost g2"></div>'));
    /* La carte suivante attend juste derrière : on la voit dès qu'on soulève celle du dessus */
    if (left.length > 1) pile.appendChild(h(`<div class="j-card j-ghost g1" aria-hidden="true">${cardHtml(row(left[1]), rows.length - left.length + 2)}</div>`));
    const c = h(`<div class="j-card${enter ? ' enter' : ''}" data-r="${esc(r.id)}" tabindex="0" role="group" aria-label="${esc(fr(r.t))}">${cardHtml(r, rows.length - left.length + 1)}</div>`);
    pile.appendChild(c);
    if (enter) requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove('enter')));
    let over = null;
    const hover = z => { if (over === z) return; if (over) over.classList.remove('over'); over = z; if (z) z.classList.add('over'); };
    draggable(c, {
      can: () => !busy && !locked,
      start: e => {
        /* La carte rétrécit autour du doigt : elle reste sous le pouce et laisse voir les cases */
        const k = scaleOf(root) || 1, rc = c.getBoundingClientRect();
        c.style.transformOrigin = `${((e.clientX - rc.left) / k).toFixed(1)}px ${((e.clientY - rc.top) / k).toFixed(1)}px`;
        c.classList.add('drag');
      },
      move: (dx, dy, e) => {
        const k = scaleOf(root) || 1;
        c._x = dx / k; c._y = dy / k;
        let z = zones.find(zz => inside(e.clientX, e.clientY, zz));
        if (!z && two && Math.abs(c._x) > 46) z = zones[c._x < 0 ? 0 : 1];
        hover(z || null);
        const sc = z ? .62 : Math.max(.7, 1 - Math.hypot(c._x, c._y) / 600);
        c.style.transform = `translate(${c._x}px, ${c._y}px) rotate(${(c._x * .05).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      },
      end: (e, cancel) => {
        const z = over; hover(null); c.classList.remove('drag');
        if (!cancel && z) { send(r.id, z.dataset.z, true); return; }
        c.style.transform = ''; c._x = c._y = 0; setTimeout(() => { if (!c.classList.contains('drag')) c.style.transformOrigin = ''; }, 450);
      }
    });
    c.addEventListener('keydown', e => {
      if (two && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); send(r.id, zones[e.key === 'ArrowLeft' ? 0 : 1].dataset.z); }
    });
    c.addEventListener('click', () => { if (!c._dragged && !quick()) { c.classList.remove('hintme'); void c.offsetWidth; c.classList.add('hintme'); } });
  }
  /* La carte rejoint sa case, puis la suivante monte */
  function send(id, v, dragged) {
    if (locked || busy || left[0] !== id) return;
    const c = $('.j-card:not(.j-ghost)', pile), z = zoneOf(v);
    const done = () => { busy = false; place(id, v); };
    if (!c || !z || quick()) return done();
    busy = true;
    const a = c.getBoundingClientRect(), b = $('.j-zt', z).getBoundingClientRect(), k = scaleOf(root) || 1;
    const tx = (c._x || 0) + (b.left + b.width / 2 - (a.left + a.width / 2)) / k, ty = (c._y || 0) + (b.top + b.height / 2 - (a.top + a.height / 2)) / k;
    c.classList.add('fly');
    c.style.transformOrigin = '50% 50%';
    c.style.transform = `translate(${tx}px, ${ty}px) scale(.3) rotate(${dragged ? (c._x || 0) * .05 : (two ? (zones.indexOf(z) ? 8 : -8) : 0)}deg)`;
    c.style.opacity = '0';
    z.classList.add('got'); setTimeout(() => z.classList.remove('got'), 420);
    setTimeout(done, 280);
  }
  function place(id, v) {
    const i = left.indexOf(id); if (i < 0) return;
    left.splice(i, 1); vals[id] = v;
    const chip = h(`<button class="j-chip new" type="button" data-r="${esc(id)}">${esc(fr(row(id).t))}</button>`);
    chip.addEventListener('click', () => unplace(id));
    $('.j-in', zoneOf(v)).appendChild(chip);
    setTimeout(() => chip.classList.remove('new'), 450);
    count(v, true); draw(true);
    if (spec.onPick) spec.onPick({ row: id, value: v }); else act(ev + '.pick', { row: id, value: v });
    if (!left.length && !quick()) requestAnimationFrame(() => { const sc = root.closest('.board, .lesson-card, .ans-card') || root; if (sc.scrollHeight > sc.clientHeight) { const r1 = stage.getBoundingClientRect(), r0 = sc.getBoundingClientRect(); if (r1.top < r0.top) sc.scrollBy({ top: r1.top - r0.top - 12, behavior: 'smooth' }); } });
  }
  /* Toucher une carte rangée la remet sur la pile */
  function unplace(id, silent) {
    if (locked || busy || vals[id] === undefined) return;
    const v = vals[id]; delete vals[id];
    const chip = $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl); if (chip) chip.remove();
    left.unshift(id); count(v); draw(true);
    /* Retour automatique après une vérification : silencieux, pour laisser l'explication affichée */
    if (silent) return;
    if (spec.onPick) spec.onPick({ row: id, value: null }); else act(ev + '.pick', { row: id, value: null });
  }
  go.addEventListener('click', () => {
    if (locked) return;
    const r = spec.check ? spec.check({ ...vals }) : act(ev + '.check', { values: { ...vals } });
    if (r === 'no' || r === false) shake(go);
  });
  const B = { el, vals };
  /* Marque les cartes : vertes si bien rangées ; les erreurs clignotent puis reviennent sur la pile */
  B.mark = (bad, ok) => {
    $$('.j-chip', zonesEl).forEach(c => c.classList.remove('ok', 'bad'));
    if (!bad && !ok) return;
    bad = (bad || []).map(String);
    ok = ok ? ok.map(String) : Object.keys(vals).filter(k => !bad.includes(k));
    const chip = id => $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl);
    ok.forEach(id => { const c = chip(id); if (c) c.classList.add('ok'); });
    bad.forEach(id => { const c = chip(id); if (c) c.classList.add('bad'); });
    if (bad.length) later(900, () => { if (locked) return; bad.slice().reverse().forEach(id => unplace(id, true)); });
  };
  B.lock = () => { locked = true; root.classList.add('j-locked'); $$('button', root).forEach(b => b.disabled = true); $$('.j-chip', zonesEl).forEach(c => { if (!c.classList.contains('bad')) c.classList.add('ok'); }); go.textContent = fr('C’est juste'); };
  B.reset = () => { Object.keys(vals).forEach(id => { const c = $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl); if (c) c.remove(); delete vals[id]; }); left.length = 0; rows.forEach(r => left.push(r.id)); spec.options.forEach(o => count(String(o[0]))); draw(); };
  draw();
  requestAnimationFrame(measure);
  return B;
}

/* ───────── Ordre : des cartes à faire glisser à leur place ─────────
   spec : { title, intro, items: [[id, libellé]], start: [ids], btn } — émet order.change et order.check { order } */
function order(spec) {
  const el = h(`<div><div class="board j-order">${spec.title ? `<h3>${esc(fr(spec.title))}</h3>` : ''}${spec.intro ? `<p>${esc(fr(spec.intro))}</p>` : ''}<div class="j-ord" role="list"></div><button class="cta dark j-go" type="button">${esc(fr(spec.btn || 'Valider'))}</button></div></div>`);
  const root = el.firstElementChild, list = $('.j-ord', el), go = $('.j-go', el);
  const label = id => spec.items.find(i => i[0] === id)[1];
  const ord = (spec.start || spec.items.map(i => i[0])).slice();
  let sel = null, locked = false;
  const items = () => $$('.j-oi', list);
  const renum = () => items().forEach((b, k) => { $('.j-n', b).textContent = k + 1; });
  const sync = () => { const now = items().map(b => b.dataset.id); ord.splice(0, ord.length, ...now); renum(); };
  const changed = () => { B.flag(); act('order.change', { order: [...ord] }); };
  const select = b => { if (sel) sel.classList.remove('sel'); sel = b; if (b) b.classList.add('sel'); };
  /* Déplacer une carte à la place d'une autre */
  const moveTo = (b, k) => {
    const all = items(), from = all.indexOf(b); if (from < 0 || k === from) return;
    flip(all, () => { const ref = all[k]; if (k > from) ref.after(b); else ref.before(b); sync(); });
    changed();
  };
  ord.forEach(id => {
    const b = h(`<button class="j-oi" type="button" role="listitem" data-id="${esc(id)}"><i class="j-n"></i><span class="j-ot">${esc(fr(label(id)))}</span><span class="j-hd">${GRIP}</span></button>`);
    b.addEventListener('click', () => {
      if (locked) return;
      if (!sel) return select(b);
      if (sel === b) return select(null);
      const s = sel; select(null); moveTo(s, items().indexOf(b));
    });
    let tops = null, ix = 0, to = 0, step = 0;
    draggable(b, {
      can: () => !locked,
      start: () => {
        select(null);
        const all = items(); ix = all.indexOf(b); to = ix;
        const k = scaleOf(root) || 1;
        tops = all.map(e => { const r = e.getBoundingClientRect(); return (r.top + r.height / 2) / k; });
        step = all.length > 1 ? (all[1].getBoundingClientRect().top - all[0].getBoundingClientRect().top) / k : b.offsetHeight + 6;
        b.classList.add('drag'); all.forEach(e => { if (e !== b) e.classList.add('shift'); });
      },
      move: (dx, dy) => {
        const k = scaleOf(root) || 1, y = dy / k, all = items();
        b.style.transform = `translateY(${y}px) scale(1.02)`;
        const c = tops[ix] + y;
        to = ix; for (let k2 = 0; k2 < tops.length; k2++) { if (k2 < ix && c < tops[k2] + 4) { to = k2; break; } }
        for (let k2 = tops.length - 1; k2 > ix; k2--) { if (c > tops[k2] - 4) { to = k2; break; } }
        all.forEach((e, k2) => { if (e === b) return; let s = 0; if (to > ix && k2 > ix && k2 <= to) s = -step; if (to < ix && k2 >= to && k2 < ix) s = step; e.style.transform = s ? `translateY(${s}px)` : ''; });
      },
      end: (e, cancel) => {
        const all = items();
        all.forEach(e2 => e2.classList.remove('shift'));
        b.classList.remove('drag');
        if (cancel || to === ix) { all.forEach(e2 => { e2.style.transform = ''; }); return; }
        const before = new Map(all.map(e => [e, e.getBoundingClientRect()]));
        all.forEach(e => { e.style.transition = 'none'; e.style.transform = ''; });
        const ref = all[to]; if (to > ix) ref.after(b); else ref.before(b); sync();
        if (!quick()) items().forEach(e => {
          const a = before.get(e), r = e.getBoundingClientRect(), k = scaleOf(root) || 1, d = (a.top - r.top) / k;
          e.style.transform = d ? `translateY(${d}px)` : ''; requestAnimationFrame(() => { e.style.transition = ''; e.style.transform = ''; });
        }); else items().forEach(e => { e.style.transition = ''; });
        changed();
      }
    });
    list.appendChild(b);
  });
  renum();
  go.addEventListener('click', () => { if (locked) return; select(null); if (act('order.check', { order: [...ord] }) === 'no') shake(go); });
  const B = { el, order: ord };
  B.flag = bad => items().forEach((b, k) => b.classList.toggle('bad', !!bad && bad.includes(k)));
  B.lock = () => { locked = true; select(null); root.classList.add('j-locked'); $$('button', root).forEach(b => b.disabled = true); go.textContent = fr('C’est juste'); };
  B.draw = () => {};
  return B;
}

/* ───────── Paires : relier chaque élément de gauche à son partenaire de droite ─────────
   spec : { title, intro, rows: [{ id, label, sub }], options: [[v, libellé]], btn } — émet match.pick et match.check { values } */
const TEINTES = ['#3E6FD8', '#E07A1F', '#16946C', '#C2418D', '#7B5CF0', '#B08A00', '#D2453B', '#0E8A9A'];
function pairs(spec) {
  const el = h(`<div><div class="board j-pairs">${spec.title ? `<h3>${esc(fr(spec.title))}</h3>` : ''}${spec.intro ? `<p>${esc(fr(spec.intro))}</p>` : ''}
    <p class="j-help">${esc(fr(spec.help || 'Glisse d’un élément à son partenaire, ou touche-les l’un après l’autre.'))}</p>
    <div class="j-pp"><svg class="j-lines" aria-hidden="true"></svg><div class="j-col l"></div><div class="j-col r"></div></div><button class="cta dark j-go" type="button">${esc(fr(spec.btn || 'Vérifier mes réponses'))}</button></div></div>`);
  const root = el.firstElementChild, pp = $('.j-pp', el), svg = $('.j-lines', el), colL = $('.j-col.l', el), colR = $('.j-col.r', el), go = $('.j-go', el);
  const vals = {}; const tint = {}; let sel = null, locked = false, marks = { ok: [], bad: [] }, temp = null;
  spec.rows.forEach((r, i) => {
    tint[r.id] = TEINTES[i % TEINTES.length];
    const b = h(`<button class="j-p" type="button" data-l="${esc(r.id)}"><span class="j-pt"><b>${esc(fr(r.label))}</b>${r.sub ? `<small>${esc(fr(r.sub))}</small>` : ''}</span><i class="j-dot"></i></button>`);
    colL.appendChild(b);
  });
  spec.options.forEach(([v, lab]) => colR.appendChild(h(`<button class="j-p" type="button" data-o="${esc(String(v))}"><i class="j-dot"></i><span class="j-pt"><b>${esc(fr(lab))}</b></span></button>`)));
  const L = id => $(`.j-p[data-l="${CSS.escape(id)}"]`, colL), R = v => $(`.j-p[data-o="${CSS.escape(v)}"]`, colR);
  const dotPos = (b, side) => {
    const k = scaleOf(pp) || 1, box = pp.getBoundingClientRect(), d = $('.j-dot', b).getBoundingClientRect();
    return { x: (d.left + d.width / 2 - box.left) / k, y: (d.top + d.height / 2 - box.top) / k };
  };
  const curve = (a, b) => { const m = Math.max(14, Math.abs(b.x - a.x) * .5); return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${(a.x + m).toFixed(1)} ${a.y.toFixed(1)} ${(b.x - m).toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`; };
  function draw() {
    let out = '';
    $$('.j-p', pp).forEach(b => { b.classList.remove('on', 'ok', 'bad'); b.style.removeProperty('--c'); });
    for (const id in vals) {
      const a = L(id), b = R(vals[id]); if (!a || !b) continue;
      const c = marks.bad.includes(id) ? 'var(--alerte)' : marks.ok.includes(id) ? 'var(--menthe)' : tint[id];
      [a, b].forEach(e => { e.classList.add('on'); e.style.setProperty('--c', c); });
      if (marks.bad.includes(id)) a.classList.add('bad'); else if (marks.ok.includes(id)) a.classList.add('ok');
      out += `<path d="${curve(dotPos(a), dotPos(b))}" stroke="${c}" class="${marks.bad.includes(id) ? 'bad' : ''}"/>`;
    }
    if (temp) out += `<path d="${temp}" stroke="${temp.c || 'var(--encre)'}" class="tmp"/>`;
    svg.innerHTML = out;
    $$('.j-p[data-l]', colL).forEach(e => { e.dataset.to = vals[e.dataset.l] || ''; });
  }
  const select = b => { if (sel) sel.classList.remove('sel'); sel = b; if (b) b.classList.add('sel'); };
  function link(id, v) {
    if (locked) return;
    /* Un partenaire peut recevoir plusieurs fils, sauf si le jeu demande des paires exclusives */
    if (spec.unique) for (const k in vals) if (vals[k] === v && k !== id) { delete vals[k]; marks.ok = marks.ok.filter(x => x !== k); marks.bad = marks.bad.filter(x => x !== k); }
    if (vals[id] === v) delete vals[id]; else vals[id] = v;
    marks.ok = marks.ok.filter(x => x !== id); marks.bad = marks.bad.filter(x => x !== id);
    draw();
    const a = L(id); if (a && vals[id] && !quick()) { a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop'); }
    act('match.pick', { row: id, value: vals[id] || null });
  }
  /* Toucher : un élément puis son partenaire */
  $$('.j-p', pp).forEach(b => {
    b.addEventListener('click', () => {
      if (locked) return;
      if (!sel) return select(b);
      if (sel === b) return select(null);
      const s = sel; select(null);
      const l = s.dataset.l || b.dataset.l, o = s.dataset.o || b.dataset.o;
      if (l && o) link(l, o); else select(b);
    });
    /* Glisser : un fil suit le doigt jusqu'au partenaire */
    let over = null;
    draggable(b, {
      can: () => !locked,
      start: () => { select(null); b.classList.add('sel'); },
      move: (dx, dy, e) => {
        const k = scaleOf(pp) || 1, box = pp.getBoundingClientRect(), a = dotPos(b), p = { x: (e.clientX - box.left) / k, y: (e.clientY - box.top) / k };
        temp = b.dataset.l ? curve(a, p) : curve(p, a); temp = Object.assign(new String(temp), { c: b.dataset.l ? tint[b.dataset.l] : 'var(--encre)' });
        const others = $$(b.dataset.l ? '.j-p[data-o]' : '.j-p[data-l]', pp);
        const z = others.find(o => inside(e.clientX, e.clientY, o, 4)) || null;
        if (z !== over) { if (over) over.classList.remove('over'); over = z; if (z) z.classList.add('over'); }
        draw();
      },
      end: (e, cancel) => {
        b.classList.remove('sel'); temp = null;
        const z = over; if (over) over.classList.remove('over'); over = null;
        if (!cancel && z) link(b.dataset.l || z.dataset.l, b.dataset.o || z.dataset.o); else draw();
      }
    });
  });
  go.addEventListener('click', () => { if (locked) return; select(null); if (act('match.check', { values: { ...vals } }) === 'no') shake(go); });
  if (window.ResizeObserver) new ResizeObserver(() => draw()).observe(pp);
  const B = { el, body: root, values: vals };
  B.mark = (ok, bad) => {
    marks = { ok: (ok || []).map(String), bad: (bad || []).map(String) };
    draw();
    marks.bad.forEach(id => { const a = L(id); if (a) shake(a); });
  };
  B.lock = () => { locked = true; select(null); root.classList.add('j-locked'); $$('button', root).forEach(b => b.disabled = true); go.textContent = fr('C’est juste'); draw(); };
  requestAnimationFrame(draw); setTimeout(draw, 420);
  return B;
}

window.J = { tri, order, pairs, draggable, flip };
})();

/* Mini-jeux : trier des cartes, remettre des étapes dans l'ordre, relier des paires.
   Chaque jeu se joue au doigt (glisser) ou par simples touchers, et émet les mêmes événements que les anciennes planches. */
(() => {
const P = window.PBQ;
const { h, esc, fr, $, $$ } = P;
/* fast : tests automatiques (tout est instantané) ; calm : mouvement réduit (rien ne se déplace, mais les délais de lecture restent) */
const fast = () => !!window.PBQ_FAST;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const quick = () => fast() || calm();
const later = (ms, f) => setTimeout(f, fast() ? 0 : ms);
const act = (type, payload) => P.act(type, payload);
/* Annonces pour VoiceOver (région polie du moteur) */
const announce = m => { if (P.announce) P.announce(m); };
const shake = el => P.shake(el);
const EASE = 'cubic-bezier(.22,.8,.24,1)';

/* Geste de glisser : il démarre après quelques pixels, un simple toucher reste un clic.
   end(ev, annulé, vitesse) reçoit la vitesse du doigt sur ses 100 dernières ms (px écran par ms). */
function draggable(el, o) {
  el.addEventListener('pointerdown', e => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || el.closest('.j-locked') || (o.can && !o.can(e))) return;
    const x0 = e.clientX, y0 = e.clientY, id = e.pointerId; let on = false;
    const pts = [[x0, y0, e.timeStamp]];
    const mv = ev => {
      if (ev.pointerId !== id) return;
      pts.push([ev.clientX, ev.clientY, ev.timeStamp]); if (pts.length > 8) pts.shift();
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!on && Math.hypot(dx, dy) > 7) { on = true; o.start && o.start(ev); }
      if (on) { ev.preventDefault(); o.move && o.move(dx, dy, ev); }
    };
    const up = ev => {
      if (ev.pointerId !== id) return;
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (!on) return;
      el._dragged = performance.now();
      /* Souris : le clic de fin de glisser vise l'ancêtre commun (plateau, dock) et relançait le dialogue ; on l'ignore */
      const kill = c => { if (c.target.contains(el)) { c.stopPropagation(); c.preventDefault(); } };
      addEventListener('click', kill, true); setTimeout(() => removeEventListener('click', kill, true), 450);
      const r = pts.filter(p => ev.timeStamp - p[2] < 100), a = r[0], b = r[r.length - 1];
      const v = r.length > 1 && b[2] > a[2] ? { x: (b[0] - a[0]) / (b[2] - a[2]), y: (b[1] - a[1]) / (b[2] - a[2]) } : { x: 0, y: 0 };
      o.end && o.end(ev, ev.type === 'pointercancel', v);
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
/* Une puce qui arrive ou repart change de hauteur en douceur : les cases voisines glissent au lieu de sauter */
function grow(el) {
  if (quick()) return;
  const cs = getComputedStyle(el), H = el.offsetHeight, m = el.previousElementSibling ? '-4px' : '-5px';
  el.style.overflow = 'hidden';
  el.animate([{ height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: m }, { height: H + 'px', paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, marginTop: '0px' }], { duration: 280, easing: EASE })
    .onfinish = () => { el.style.overflow = ''; };
}
function shrink(el) {
  el.removeAttribute('data-r'); el.disabled = true; el.classList.add('out');
  if (quick()) return el.remove();
  const solo = el.parentElement.children.length === 1, first = !el.previousElementSibling;
  el.style.overflow = 'hidden';
  el.animate([{ height: el.offsetHeight + 'px', opacity: 1 }, { height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: solo ? '-5px' : first ? '0px' : '-4px', marginBottom: !solo && first ? '-4px' : '0px', opacity: 0, transform: 'scale(.92)' }],
    { duration: 220, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).onfinish = () => el.remove();
}
/* Première rencontre avec un jeu : il montre son geste tout seul, une fois par appareil. Un toucher l'interrompt. */
function demo(kind, root, play) {
  if (quick()) return;
  let seen = []; try { seen = JSON.parse(localStorage.getItem('pbq-gestes') || '[]'); } catch (e) {}
  if (seen.includes(kind)) return;
  const D = { stop: false, over: false, anims: [], t: 0 };
  const cancel = () => { if (D.over) return; D.stop = true; clearTimeout(D.t); D.anims.forEach(a => a.cancel()); if (D.end) D.end(); };
  root.addEventListener('pointerdown', cancel, { once: true, capture: true });
  const tryPlay = () => {
    if (D.stop || !root.isConnected) return;
    if (root.closest('.app:not(.is-on), .answer:not(.on)') || !root.offsetWidth) { D.t = setTimeout(tryPlay, 500); return; }
    seen.push(kind); try { localStorage.setItem('pbq-gestes', JSON.stringify(seen)); } catch (e) {}
    play(D); setTimeout(() => { D.over = true; }, 1500);
  };
  D.t = setTimeout(tryPlay, 1100);
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
  let locked = false, busy = false, lifted = null;
  spec.options.forEach(([v, lab], i) => {
    const z = h(`<div class="j-zone" data-z="${esc(String(v))}"><button class="j-zt" type="button" data-v="${esc(String(v))}">${two && i === 0 ? ARROW_L : ''}<span class="j-zl">${esc(fr(lab))}</span><i>0</i>${two && i === 1 ? ARROW_R : ''}</button><div class="j-in"></div></div>`);
    $('.j-zt', z).addEventListener('click', () => { if (!busy && !locked && left.length) send(left[0], String(v)); });
    zonesEl.appendChild(z);
  });
  const zones = $$('.j-zone', zonesEl);
  const zoneOf = v => zones.find(z => z.dataset.z === v);
  const labOf = v => fr((spec.options.find(o => String(o[0]) === v) || [])[1] || '');
  const count = (v, bump) => { const z = zoneOf(v); if (!z) return; const i = $('.j-zt i', z); i.textContent = Object.values(vals).filter(x => x === v).length; $('.j-zt', z).setAttribute('aria-label', `Ranger dans « ${labOf(v)} » (${i.textContent})`); if (bump && !quick()) { i.classList.remove('bump'); void i.offsetWidth; i.classList.add('bump'); } };
  const cardHtml = (r, k) => `<b>${esc(fr(r.t))}</b>${r.sub ? `<small>${esc(fr(r.sub))}</small>` : ''}<em class="j-k">${k}/${rows.length}</em>`;
  const top = () => $('.j-pile > .j-card:not(.j-ghost)', root);
  /* La pile garde la hauteur de la plus grande carte : rien ne saute d'une carte à l'autre */
  const measure = () => {
    if (!pile.offsetWidth) return;
    const m = h(`<div class="j-measure"></div>`); pile.appendChild(m);
    let max = 0; rows.forEach(r => { const c = h(`<div class="j-card">${cardHtml(r, rows.length)}</div>`); m.appendChild(c); max = Math.max(max, c.offsetHeight); });
    m.remove(); if (max) stage.style.setProperty('--jh', max + 'px');
  };
  let lastW = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { const w = pile.offsetWidth; if (w && w !== lastW) { lastW = w; measure(); } }).observe(stage);
  /* Carte soulevée : pendant le geste, un double flotte au-dessus de tout l'écran. Aucun cadre (plateau, dock) ne la coupe. */
  function lift(c, e) {
    drop();
    const host = root.closest('.layer') || document.body, k = scaleOf(host) || 1, hr = host.getBoundingClientRect(), r = c.getBoundingClientRect();
    host.querySelectorAll(':scope > .j-lift').forEach(x => x.remove());
    const f = c.cloneNode(true);
    ['data-r', 'tabindex', 'role', 'aria-label'].forEach(a => f.removeAttribute(a)); f.setAttribute('aria-hidden', 'true');
    f.className = 'j-card j-lift';
    f.insertAdjacentHTML('beforeend', '<span class="j-stamp"></span>');
    Object.assign(f.style, { left: (r.left - hr.left) / k + 'px', top: (r.top - hr.top) / k + 'px', width: c.offsetWidth + 'px', height: c.offsetHeight + 'px',
      transformOrigin: `${((e.clientX - r.left) / k).toFixed(1)}px ${((e.clientY - r.top) / k).toFixed(1)}px` });
    host.appendChild(f);
    c.classList.remove('hintme'); c.classList.add('drag', 'lifted');
    return (lifted = f);
  }
  /* Retire le double et rend la vraie carte visible d'un coup (sans fondu) */
  function drop() {
    if (lifted) { lifted.remove(); lifted = null; }
    const c = top(); if (c && c.classList.contains('lifted')) { c.style.transition = 'none'; c.classList.remove('lifted', 'drag'); void c.offsetWidth; c.style.transition = ''; }
  }
  /* Retour en ressort sur la pile ; la carte reste saisissable pendant le retour */
  function home() {
    const f = lifted; if (!f) return;
    if (quick()) return drop();
    f.classList.add('home');
    f.style.translate = '0px 0px'; f.style.rotate = '0deg'; f.style.scale = '1';
    const fin = () => { clearTimeout(t); if (lifted === f) drop(); };
    const t = setTimeout(fin, 520);
    f.addEventListener('transitionend', e => { if (e.propertyName === 'translate') fin(); });
  }
  /* Lancer : un geste vif compte comme un dépôt, même si le doigt s'arrête avant la case */
  function thrown(e, v) {
    const sp = Math.hypot(v.x, v.y); if (sp < .45) return null;
    if (two) return Math.abs(v.x) > Math.abs(v.y) ? zones[v.x < 0 ? 0 : 1] : null;
    /* On suit la direction du lancer sur 420 px au plus : la première case rencontrée reçoit la carte */
    for (let d = 16; d <= 420; d += 16) {
      const x = e.clientX + v.x / sp * d, y = e.clientY + v.y / sp * d, hit = zones.filter(zz => inside(x, y, zz, 10));
      const dist = zz => { const r = zz.getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y); };
      if (hit.length) return hit.sort((p, q) => dist(p) - dist(q))[0];
    }
    return null;
  }
  function draw(how) {
    drop();
    pile.innerHTML = ''; pile.classList.remove('next');
    stage.classList.toggle('fini', !left.length);
    if (!left.length) return;
    const r = row(left[0]);
    if (left.length > 2) pile.appendChild(h('<div class="j-ghost g2"></div>'));
    /* La carte suivante attend juste derrière : on la voit dès qu'on soulève celle du dessus */
    if (left.length > 1) pile.appendChild(h(`<div class="j-card j-ghost g1" aria-hidden="true">${cardHtml(row(left[1]), rows.length - left.length + 2)}</div>`));
    const c = h(`<div class="j-card${how ? ' enter' : ''}${how === 'back' ? ' back' : ''}" data-r="${esc(r.id)}" tabindex="0" role="group" aria-label="${esc(fr(r.t))}">${cardHtml(r, rows.length - left.length + 1)}</div>`);
    pile.appendChild(c);
    if (how) requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove('enter', 'back')));
    let over = null;
    const hover = z => {
      if (over === z) return; if (over) over.classList.remove('over'); over = z; if (z) z.classList.add('over');
      if (lifted) { const i = z ? zones.indexOf(z) : -1; lifted.classList.toggle('to-l', two && i === 0); lifted.classList.toggle('to-r', two ? i === 1 : i >= 0); if (z) $('.j-stamp', lifted).textContent = $('.j-zl', z).textContent; }
    };
    draggable(c, {
      can: () => !busy && !locked,
      start: e => lift(c, e),
      move: (dx, dy, e) => {
        const f = lifted; if (!f) return;
        const k = scaleOf(root) || 1;
        c._x = dx / k; c._y = dy / k;
        const inZone = zones.find(zz => inside(e.clientX, e.clientY, zz));
        let z = inZone; if (!z && two && Math.abs(c._x) > 46) z = zones[c._x < 0 ? 0 : 1];
        hover(z || null);
        /* La carte suit le doigt sans délai ; seule sa taille s'anime (propriété scale, transition courte) */
        f.style.translate = `${c._x.toFixed(1)}px ${c._y.toFixed(1)}px`;
        f.style.rotate = `${(c._x * .05).toFixed(2)}deg`;
        const sc = inZone ? .62 : z ? .96 : Math.max(.7, 1 - Math.hypot(c._x, c._y) / 600);
        f.style.scale = sc.toFixed(3); f.style.setProperty('--k', (1 / sc).toFixed(3));
      },
      end: (e, cancel, v) => {
        let z = over; hover(null);
        if (!cancel && !z && v) z = thrown(e, v);
        if (!cancel && z) { send(r.id, z.dataset.z, true); return; }
        home();
      }
    });
    c.addEventListener('keydown', e => {
      if (two && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); send(r.id, zones[e.key === 'ArrowLeft' ? 0 : 1].dataset.z); }
    });
    c.addEventListener('click', () => { if (!c._dragged && !quick()) { c.classList.remove('hintme'); void c.offsetWidth; c.classList.add('hintme'); } });
  }
  /* La carte rejoint sa case pendant que la suivante monte à sa place */
  function send(id, v, dragged) {
    if (locked || busy || left[0] !== id) return;
    const z = zoneOf(v), c = lifted || top();
    const done = () => { busy = false; drop(); place(id, v); };
    if (!c || !z || quick()) return done();
    busy = true;
    pile.classList.add('next');
    const k = scaleOf(root) || 1, a = c.getBoundingClientRect(), b = $('.j-zt', z).getBoundingClientRect();
    /* Centre de la carte sans transformation : l'ancrage revient au centre sans faire sauter la carte */
    let ux = a.left + a.width / 2, uy = a.top + a.height / 2;
    if (c === lifted) { const hr = c.parentElement.getBoundingClientRect(); ux = hr.left + (parseFloat(c.style.left) + c.offsetWidth / 2) * k; uy = hr.top + (parseFloat(c.style.top) + c.offsetHeight / 2) * k; }
    c.classList.remove('home');
    c.style.transition = 'none'; c.style.transformOrigin = '50% 50%';
    c.style.translate = `${(a.left + a.width / 2 - ux) / k}px ${(a.top + a.height / 2 - uy) / k}px`;
    void c.offsetWidth; c.style.transition = '';
    c.classList.add('fly');
    c.style.translate = `${(b.left + b.width / 2 - ux) / k}px ${(b.top + b.height / 2 - uy) / k}px`;
    c.style.scale = '.3';
    c.style.rotate = `${dragged ? parseFloat(c.style.rotate) || 0 : two ? (zones.indexOf(z) ? 8 : -8) : 0}deg`;
    c.style.opacity = '0';
    setTimeout(done, 280);
  }
  function place(id, v) {
    const i = left.indexOf(id); if (i < 0) return;
    left.splice(i, 1); vals[id] = v;
    const z = zoneOf(v);
    const chip = h(`<button class="j-chip new" type="button" data-r="${esc(id)}" aria-label="${esc(fr(row(id).t))}, rangée dans « ${esc(labOf(v))} ». Toucher pour la reprendre">${esc(fr(row(id).t))}</button>`);
    chip.addEventListener('click', () => unplace(id));
    $('.j-in', z).appendChild(chip); grow(chip);
    setTimeout(() => chip.classList.remove('new'), 450);
    count(v, true); draw();
    announce(`Rangée dans « ${labOf(v)} ». ${left.length ? 'Carte suivante : ' + fr(row(left[0]).t) : 'Toutes les cartes sont rangées.'}`);
    /* La case « avale » la carte au moment où elle arrive (et non au lâcher) */
    if (!quick()) { z.classList.remove('got'); void z.offsetWidth; z.classList.add('got'); setTimeout(() => z.classList.remove('got'), 420); }
    if (spec.onPick) spec.onPick({ row: id, value: v }); else act(ev + '.pick', { row: id, value: v });
    if (!left.length && !quick()) requestAnimationFrame(() => { const sc = root.closest('.board, .lesson-card, .ans-card') || root; if (sc.scrollHeight > sc.clientHeight) { const r1 = stage.getBoundingClientRect(), r0 = sc.getBoundingClientRect(); if (r1.top < r0.top) sc.scrollBy({ top: r1.top - r0.top - 12, behavior: 'smooth' }); } });
  }
  /* Toucher une carte rangée la remet sur la pile : la puce se replie, la carte remonte depuis les cases */
  function unplace(id, silent) {
    if (locked || busy || vals[id] === undefined) return;
    const v = vals[id]; delete vals[id];
    const chip = $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl); if (chip) shrink(chip);
    left.unshift(id); count(v); draw('back');
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
  /* Marque les cartes : vertes si bien rangées ; les erreurs restent rouges le temps d'être lues, puis reviennent sur la pile */
  B.mark = (bad, ok) => {
    $$('.j-chip', zonesEl).forEach(c => c.classList.remove('ok', 'bad'));
    if (!bad && !ok) return;
    bad = (bad || []).map(String);
    ok = ok ? ok.map(String) : Object.keys(vals).filter(k => !bad.includes(k));
    const chip = id => $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl);
    ok.forEach(id => { const c = chip(id); if (c) c.classList.add('ok'); });
    bad.forEach(id => { const c = chip(id); if (c) c.classList.add('bad'); });
    if (bad.length) later(calm() ? 1400 : 900, () => { if (locked) return; bad.slice().reverse().forEach(id => unplace(id, true)); });
    announce(bad.length ? `${bad.length} carte${bad.length > 1 ? 's' : ''} à revoir, revenue${bad.length > 1 ? 's' : ''} sur la pile.` : 'Tout est bien rangé.');
  };
  B.lock = () => { locked = true; drop(); root.classList.add('j-locked'); $$('button', root).forEach(b => b.disabled = true); $$('.j-chip', zonesEl).forEach((c, i) => { if (!c.classList.contains('bad')) { c.style.setProperty('--i', i); c.classList.add('ok'); } }); go.textContent = fr('C’est juste'); };
  B.reset = () => { Object.keys(vals).forEach(id => { const c = $(`.j-chip[data-r="${CSS.escape(id)}"]`, zonesEl); if (c) c.remove(); delete vals[id]; }); left.length = 0; rows.forEach(r => left.push(r.id)); spec.options.forEach(o => count(String(o[0]))); draw(); };
  spec.options.forEach(o => count(String(o[0])));
  draw();
  requestAnimationFrame(measure);
  /* Démonstration : la carte esquisse le geste vers la première case, puis revient */
  demo(two ? 'tri2' : 'tri', root, D => {
    const c = top(), z = two ? zones[1] : zones[0]; if (!c) return;
    const to = two ? { translate: '58px 0px', rotate: '3deg' } : { translate: '0px 30px', rotate: '0deg' }, rest = { translate: '0px 0px', rotate: '0deg' };
    D.anims.push(c.animate([rest, { ...to, offset: .4 }, { ...to, offset: .62 }, rest], { duration: 1400, easing: 'cubic-bezier(.45,0,.25,1)' }));
    const t1 = setTimeout(() => z.classList.add('over'), 430), t2 = setTimeout(() => z.classList.remove('over'), 900);
    D.end = () => { clearTimeout(t1); clearTimeout(t2); z.classList.remove('over'); };
  });
  return B;
}

/* ───────── Ordre : des cartes à faire glisser à leur place ─────────
   spec : { title, intro, items: [[id, libellé]], start: [ids], btn } — émet order.change et order.check { order } */
function order(spec) {
  const el = h(`<div><div class="board j-order">${spec.title ? `<h3>${esc(fr(spec.title))}</h3>` : ''}${spec.intro ? `<p>${esc(fr(spec.intro))}</p>` : ''}<div class="j-ord"></div><button class="cta dark j-go" type="button">${esc(fr(spec.btn || 'Valider'))}</button></div></div>`);
  const root = el.firstElementChild, list = $('.j-ord', el), go = $('.j-go', el);
  const label = id => spec.items.find(i => i[0] === id)[1];
  const ord = (spec.start || spec.items.map(i => i[0])).slice();
  let sel = null, locked = false;
  const items = () => $$('.j-oi', list);
  const renum = () => { const all = items(); all.forEach((b, k) => { $('.j-n', b).textContent = k + 1; b.setAttribute('aria-label', `${k + 1} sur ${all.length} : ${fr(label(b.dataset.id))}`); }); };
  const sync = () => { const now = items().map(b => b.dataset.id); ord.splice(0, ord.length, ...now); renum(); };
  const changed = () => { B.flag(); act('order.change', { order: [...ord] }); };
  const select = b => { if (sel) { sel.classList.remove('sel'); sel.setAttribute('aria-pressed', 'false'); } sel = b; if (b) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); } };
  /* Plateau trop haut pour l'écran : au doigt, les rangées laissent défiler et on les déplace par la poignée */
  const scrolls = () => root.classList.toggle('j-scrolls', root.scrollHeight > root.clientHeight + 1);
  if (window.ResizeObserver) { const ro = new ResizeObserver(scrolls); ro.observe(root); ro.observe(list); }
  /* Déplacer une carte à la place d'une autre */
  const moveTo = (b, k) => {
    const all = items(), from = all.indexOf(b); if (from < 0 || k === from) return;
    flip(all, () => { const ref = all[k]; if (k > from) ref.after(b); else ref.before(b); sync(); });
    announce(`${fr(label(b.dataset.id))} : position ${k + 1} sur ${all.length}`);
    changed();
  };
  ord.forEach(id => {
    const b = h(`<button class="j-oi" type="button" aria-pressed="false" data-id="${esc(id)}"><i class="j-n"></i><span class="j-ot">${esc(fr(label(id)))}</span><span class="j-hd">${GRIP}</span></button>`);
    b.addEventListener('click', () => {
      if (locked) return;
      if (!sel) return select(b);
      if (sel === b) return select(null);
      const s = sel; select(null); moveTo(s, items().indexOf(b));
    });
    let tops = null, ix = 0, to = 0, step = 0;
    draggable(b, {
      can: e => !locked && (e.pointerType !== 'touch' || !root.classList.contains('j-scrolls') || !!e.target.closest('.j-hd')),
      start: () => {
        select(null);
        const all = items(); ix = all.indexOf(b); to = ix;
        const k = scaleOf(root) || 1;
        tops = all.map(e => { const r = e.getBoundingClientRect(); return (r.top + r.height / 2) / k; });
        /* Les voisines se décalent de la hauteur de la carte saisie (et non de celle de la première) */
        step = b.offsetHeight + (parseFloat(getComputedStyle(list).rowGap) || 6);
        b.classList.add('drag'); all.forEach(e => { if (e !== b) e.classList.add('shift'); });
      },
      move: (dx, dy) => {
        /* Élastique au-delà de la première et de la dernière place : la carte ne sort jamais du plateau */
        const k = scaleOf(root) || 1, lo = tops[0] - tops[ix] - 8, hi = tops[tops.length - 1] - tops[ix] + 8, y0 = dy / k, all = items();
        const y = y0 < lo ? lo - (lo - y0) * .25 : y0 > hi ? hi + (y0 - hi) * .25 : y0;
        b.style.transform = `translateY(${y}px) scale(1.02)`;
        const c = tops[ix] + y;
        to = ix; for (let k2 = 0; k2 < tops.length; k2++) { if (k2 < ix && c < tops[k2] + 4) { to = k2; break; } }
        for (let k2 = tops.length - 1; k2 > ix; k2--) { if (c > tops[k2] - 4) { to = k2; break; } }
        /* Les numéros suivent en direct : la carte saisie affiche déjà la place qu'elle prendra */
        all.forEach((e, k2) => {
          let s = 0, nn = k2;
          if (e === b) nn = to;
          else { if (to > ix && k2 > ix && k2 <= to) { s = -step; nn = k2 - 1; } if (to < ix && k2 >= to && k2 < ix) { s = step; nn = k2 + 1; } e.style.transform = s ? `translateY(${s}px)` : ''; }
          $('.j-n', e).textContent = nn + 1;
        });
      },
      end: (e, cancel) => {
        const all = items();
        all.forEach(e2 => e2.classList.remove('shift'));
        b.classList.remove('drag');
        if (cancel || to === ix) { all.forEach(e2 => { e2.style.transform = ''; }); renum(); return; }
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
  B.lock = () => { locked = true; select(null); root.classList.add('j-locked'); items().forEach((b, k) => b.style.setProperty('--i', k)); $$('button', root).forEach(b => b.disabled = true); go.textContent = fr('C’est juste'); };
  B.draw = () => {};
  /* Démonstration : la première carte descend d'un cran pendant que la deuxième lui laisse la place */
  demo('order', root, D => {
    const [a, b] = items(); if (!a || !b) return;
    const d = b.offsetTop - a.offsetTop, o = { duration: 1300, easing: 'cubic-bezier(.45,0,.25,1)' };
    D.anims.push(a.animate([{ transform: 'none' }, { transform: `translateY(${d * .55}px) scale(1.02)`, boxShadow: '0 0 0 .5px rgba(20,27,60,.08), 0 18px 40px rgba(20,27,60,.22)', offset: .4 }, { transform: `translateY(${d * .55}px) scale(1.02)`, offset: .62 }, { transform: 'none' }], o));
    D.anims.push(b.animate([{ transform: 'none' }, { transform: `translateY(${-d * .3}px)`, offset: .4 }, { transform: `translateY(${-d * .3}px)`, offset: .62 }, { transform: 'none' }], o));
  });
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
    const b = h(`<button class="j-p" type="button" aria-pressed="false" data-l="${esc(r.id)}"><span class="j-pt"><b>${esc(fr(r.label))}</b>${r.sub ? `<small>${esc(fr(r.sub))}</small>` : ''}</span><i class="j-dot"></i></button>`);
    colL.appendChild(b);
  });
  spec.options.forEach(([v, lab]) => colR.appendChild(h(`<button class="j-p" type="button" aria-pressed="false" data-o="${esc(String(v))}"><i class="j-dot"></i><span class="j-pt"><b>${esc(fr(lab))}</b></span></button>`)));
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
      out += `<path d="${curve(dotPos(a), dotPos(b))}" stroke="${c}" data-l="${esc(id)}" class="${marks.bad.includes(id) ? 'bad' : ''}"/>`;
    }
    if (temp) out += `<path d="${temp}" stroke="${temp.c || 'var(--encre)'}" class="tmp"/>`;
    svg.innerHTML = out;
    const nL = id => fr(spec.rows.find(r => r.id === id).label), nR = v => fr((spec.options.find(o => String(o[0]) === v) || [])[1] || '');
    $$('.j-p[data-l]', colL).forEach(e => { const id = e.dataset.l, v = vals[id]; e.dataset.to = v || ''; e.setAttribute('aria-label', nL(id) + (v ? ', relié à ' + nR(v) : ', pas encore relié') + (marks.ok.includes(id) ? ', juste' : marks.bad.includes(id) ? ', à revoir' : '')); });
    $$('.j-p[data-o]', colR).forEach(e => { const ls = Object.keys(vals).filter(k => vals[k] === e.dataset.o).map(nL); e.setAttribute('aria-label', nR(e.dataset.o) + (ls.length ? ', relié à ' + ls.join(', ') : '')); });
  }
  const select = b => { if (sel) { sel.classList.remove('sel'); sel.setAttribute('aria-pressed', 'false'); } sel = b; if (b) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); } };
  function link(id, v, dragged) {
    if (locked) return;
    /* Un partenaire peut recevoir plusieurs fils, sauf si le jeu demande des paires exclusives */
    if (spec.unique) for (const k in vals) if (vals[k] === v && k !== id) { delete vals[k]; marks.ok = marks.ok.filter(x => x !== k); marks.bad = marks.bad.filter(x => x !== k); }
    if (vals[id] === v) delete vals[id]; else vals[id] = v;
    marks.ok = marks.ok.filter(x => x !== id); marks.bad = marks.bad.filter(x => x !== id);
    draw();
    const a = L(id); if (a && vals[id] && !quick()) {
      a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop');
      /* Relié par deux touchers : le fil se trace de gauche à droite */
      const p = !dragged && $(`path[data-l="${CSS.escape(id)}"]`, svg);
      if (p) { const n = p.getTotalLength(); p.animate([{ strokeDasharray: `${n} ${n}`, strokeDashoffset: n }, { strokeDasharray: `${n} ${n}`, strokeDashoffset: 0 }], { duration: 260, easing: EASE }); }
    }
    announce(vals[id] ? `${fr(spec.rows.find(r => r.id === id).label)} relié à ${fr((spec.options.find(o => String(o[0]) === v) || [])[1] || '')}` : 'Lien retiré');
    act('match.pick', { row: id, value: vals[id] || null });
  }
  /* Plateau trop haut pour l'écran : un glissement vertical fait défiler au lieu de tirer un fil */
  const scrolls = () => root.classList.toggle('j-scrolls', root.scrollHeight > root.clientHeight + 1);
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
        if (!cancel && z) link(b.dataset.l || z.dataset.l, b.dataset.o || z.dataset.o, true); else draw();
      }
    });
  });
  go.addEventListener('click', () => { if (locked) return; select(null); if (act('match.check', { values: { ...vals } }) === 'no') shake(go); });
  if (window.ResizeObserver) new ResizeObserver(() => { draw(); scrolls(); }).observe(pp);
  const B = { el, body: root, values: vals };
  B.mark = (ok, bad) => {
    marks = { ok: (ok || []).map(String), bad: (bad || []).map(String) };
    draw();
    marks.bad.forEach(id => { const a = L(id); if (a) shake(a); });
  };
  B.lock = () => { locked = true; select(null); root.classList.add('j-locked'); $$('button', root).forEach(b => b.disabled = true); go.textContent = fr('C’est juste'); draw(); };
  requestAnimationFrame(draw); setTimeout(() => { draw(); scrolls(); }, 420);
  /* Démonstration : un fil part du premier élément vers la colonne de droite, puis se rétracte */
  demo('pairs', root, D => {
    const a = $('.j-p[data-l]', colL); if (!a) return;
    const k = scaleOf(pp) || 1, p0 = dotPos(a), x1 = (colR.getBoundingClientRect().left - pp.getBoundingClientRect().left) / k + 6, t0 = performance.now(), T = 1400;
    const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    D.end = () => { temp = null; a.classList.remove('sel'); draw(); };
    const f = now => {
      if (D.stop) return;
      const u = Math.min(1, (now - t0) / T), s = u < .4 ? ease(u / .4) : u < .62 ? 1 : 1 - ease((u - .62) / .38);
      temp = Object.assign(new String(curve(p0, { x: p0.x + (x1 - p0.x) * s, y: p0.y + 40 * s })), { c: tint[a.dataset.l] });
      a.classList.toggle('sel', s > .05); draw();
      if (u < 1) requestAnimationFrame(f); else D.end();
    };
    requestAnimationFrame(f);
  });
  return B;
}

window.J = { tri, order, pairs, draggable, flip };
})();

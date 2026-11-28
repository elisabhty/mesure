/* Power BI Quest — moteur de l'application */
(function () {
'use strict';
const D = window.PBQ_DATA, TX = window.PBQ_TEXTES;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NB = ' ', NNB = ' ';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Typographie française : espaces insécables avant ; : ! ? » et après «, dans les nombres */
const fr = s => String(s).replace(/`/g, '')
  .replace(/([A-Za-zÀ-ÿ])'([A-Za-zÀ-ÿ])/g, '$1’$2')
  .replace(/ ([?!:;»€%])/g, NB + '$1')
  .replace(/« /g, '«' + NB)
  .replace(/(\d) (?=\d{3}(?!\d))/g, '$1' + NB)
  .replace(/(\d) (h|min|XP|lignes|colonnes|billets|entrées|ventes)(?![a-zéèà])/g, '$1' + NB + '$2');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const eur = (n, d = 2) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/[   ]/g, NB) + NB + '€';
const nfmt = n => n.toLocaleString('fr-FR').replace(/[   ]/g, NB);
const dfr = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '';
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const clone = o => JSON.parse(JSON.stringify(o));
const person = id => D.people[id] || D.people.pixel;
const avatar = id => { const p = person(id); return p.img || 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#3D4782"/><text x="20" y="26" font-family="sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${(p.nom || '?')[0]}</text></svg>`); };

/* ───────── Cadre ───────── */
let Z = 1;
const wrap = $('#wrap'), phone = $('#phone');
const mqMobile = matchMedia('(max-width:480px)');
function fit() {
  if (mqMobile.matches) { Z = 1; wrap.style.width = wrap.style.height = ''; phone.style.transform = ''; return; }
  Z = clamp(Math.min((innerHeight - 24) / 864, (innerWidth - 24) / 410), .45, 1);
  phone.style.transform = `scale(${Z})`; wrap.style.width = 410 * Z + 'px'; wrap.style.height = 864 * Z + 'px';
}
addEventListener('resize', fit); fit();
const sbTime = () => { const d = new Date(); $('#sb-time').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
sbTime(); setInterval(sbTime, 15000);
/* iOS n'applique :active qu'avec un écouteur touchstart */
document.addEventListener('touchstart', () => {}, { passive: true });
/* Annonces VoiceOver : une région polie, invisible */
const srLive = document.body.appendChild(h('<div class="sr-only" role="status" aria-live="polite"></div>'));
let srQ = [], srT = 0;
function announce(msg) { srQ.push(msg); clearTimeout(srT); srT = setTimeout(() => { srLive.textContent = srQ.join(' ') + (srLive.textContent.endsWith('\u00A0') ? '' : '\u00A0'); srQ = []; }, 80); }

/* ───────── Progression ───────── */
const KEY = 'pbq-module1';
const store = {
  load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
  save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
};
let S = Object.assign({ xp: 0, ex: {}, done: [], badges: [], objets: [], fiches: [], resume: null, flips: {} }, store.load() || {});
const isDone = id => S.done.includes(id);
const ids = () => D.missions.map(m => m.id);
const prevOf = id => { const l = ids(), k = l.indexOf(id); return k > 0 ? l[k - 1] : null; };
const nextOf = id => { const l = ids(), k = l.indexOf(id); return k >= 0 && k < l.length - 1 ? l[k + 1] : null; };
const unlocked = id => { const p = prevOf(id); return p === null || isDone(p) || isDone(id); };
const modOf = id => Math.floor(id / 100);
const finale = id => id % 100 === 10;
const xpOf = id => ((D.missions.find(m => m.id === id) || {}).xp) || 200;
const xpEx = (id, i) => { const def = M[id]; return def && def.xpEx ? def.xpEx[i] : Math.round(xpOf(id) / 8); };
const doneIn = mod => S.done.filter(id => modOf(id) === mod).length;
const currentMission = () => (D.missions.find(m => !isDone(m.id)) || {}).id;

/* ───────── Missions ───────── */
const M = {};
function mission(def) { M[def.id] = def; }
const meta = id => D.missions.find(m => m.id === id);

/* Projet Wonderland : état canonique, reconstruit mission par mission */
function project0() {
  return { id: 'wonderland_main', name: null, saved: false, pages: [], activePage: null, sources: [], queries: [], tables: [], relationships: [], measures: [], formats: {}, settings: { autoDetectRelationships: false } };
}
function projectBefore(id, exIndex = 0) {
  let P = project0();
  for (const m of D.missions) {
    if (m.id >= id) break;
    const def = M[m.id]; if (def && def.fin) def.fin(P);
  }
  const def = M[id];
  if (def && def.exs) for (let i = 0; i < exIndex; i++) if (def.exs[i].avance) def.exs[i].avance(P);
  return P;
}
function projectNow() { const last = [...S.done].sort().pop(); return last ? projectBefore(last + 1) : project0(); }

/* ───────── Onglets ───────── */
const views = { parc: $('#v-parc'), bureau: $('#v-bureau'), memo: $('#v-memo') };
function showTab(t) {
  $$('.tabs > .tab').forEach(x => { const on = x.dataset.tab === t; x.classList.toggle('is-on', on); if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
  for (const k in views) { views[k].classList.toggle('is-on', k === t); views[k].inert = k !== t; }
  if (t === 'bureau') renderBureau(); if (t === 'memo') renderMemo();
}
$$('.tabs > .tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

/* Parc : une carte par module, empilées (le parcours monte du module 1 vers le module 2) */
/* Étiquette à droite ou à gauche de sa pastille, du côté où elle ne touche ni pastille ni autre étiquette */
function placeLabels(map) {
  const hit = (a, b, m = 3) => a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m;
  const pins = $$('.pin', map).map(p => p.getBoundingClientRect()), placed = [], mw = map.clientWidth;
  for (const l of $$('.pin-label', map)) {
    const x = parseFloat(l.parentElement.style.left) / 100 * mw;
    let best = 'r', score = Infinity;
    for (const side of x < mw / 2 ? ['r', 'l'] : ['l', 'r']) {
      l.classList.remove('l', 'r'); l.classList.add(side);
      /* Place disponible jusqu'au bord de la carte : le titre passe à la ligne plutôt que d'être coupé */
      l.style.maxWidth = Math.max(80, side === 'r' ? mw - x - 44 : x - 44) + 'px';
      const r = l.getBoundingClientRect(), sc = pins.filter(p => hit(r, p)).length * 2 + placed.filter(p => hit(r, p)).length;
      if (sc < score) { score = sc; best = side; }
      if (!sc) break;
    }
    l.classList.remove('l', 'r'); l.classList.add(best);
    l.style.maxWidth = Math.max(80, best === 'r' ? mw - x - 44 : x - 44) + 'px';
    placed.push(l.getBoundingClientRect());
  }
}
if (window.ResizeObserver) { let lastW = 0; new ResizeObserver(es => { const w = Math.round(es[0].contentRect.width); if (w && lastW && w !== lastW) $$('#maps .map').forEach(placeLabels); lastW = w || lastW; }).observe($('#maps')); }
/* Attractions : celle de chaque mission vient du registre (js/arcade.js) */
const ARC = () => window.PBQ_ARCADE || {};
const attrOf = id => { const a = ARC()[id]; return a ? a.kind : null; };
let newLitShown = false;
function renderPark(scrollToCurrent) {
  $('#xp-home').textContent = fr(S.xp + ' XP');
  newLitShown = false;
  const box = $('#maps'); box.innerHTML = '';
  const cur = currentMission();
  const mods = (D.modules || [{ n: 1, img: 'carte.webp' }]).slice().reverse();
  for (const md of mods) {
    const open = md.n === 1 || doneIn(md.n) > 0 || unlocked(md.n * 100 + 1);
    const map = h(`<div class="map ${open ? '' : 'shut'}" data-mod="${md.n}"><img src="img/${md.img}" alt="${esc(md.alt || '')}" width="640" height="1280"></div>`);
    /* Le parc est éteint ; chaque mission réussie rallume son attraction (un halo autour de sa pastille) */
    const ms = D.missions.filter(x => modOf(x.id) === md.n), lit = ms.filter(x => isDone(x.id));
    if (open && lit.length < ms.length) {
      const holes = lit.map(x => `radial-gradient(circle 128px at ${x.pin[0]}% ${x.pin[1]}%, transparent 48%, #000 100%)`).join(', ') || 'linear-gradient(#000, #000)';
      const nuit = h('<div class="nuit" aria-hidden="true"></div>'); nuit.style.setProperty('--holes', holes); map.appendChild(nuit);
    }
    if (S.newLit && lit.some(x => x.id === S.newLit)) {
      const x = lit.find(y => y.id === S.newLit);
      map.appendChild(h(`<span class="eclat" aria-hidden="true" style="left:${x.pin[0]}%; top:${x.pin[1]}%"></span>`));
      newLitShown = true;
    }
    for (const m of ms) {
      const st = isDone(m.id) ? 'done' : (m.id === cur ? 'current' : (unlocked(m.id) ? 'open' : 'locked'));
      const k = attrOf(m.id), ic = st === 'done' && k && window.J ? `<i class="pin-at">${window.J.icon(k)}</i>` : '';
      const b = h(`<button class="pin ${st}" style="left:${m.pin[0]}%; top:${m.pin[1]}%" data-m="${m.id}" aria-label="Mission ${m.id}, ${esc(m.titre)}, ${({ done: 'terminée', current: 'à faire', open: 'ouverte', locked: 'verrouillée' })[st]}">${m.id}<span class="pin-label ${st === 'locked' ? 'locked' : ''}" aria-hidden="true">${ic}${esc(fr(m.titre))}</span></button>`);
      b.addEventListener('click', () => openMissionSheet(m.id));
      map.appendChild(b);
    }
    box.appendChild(map); placeLabels(map);
    if (md.n > 1) {
      const n = doneIn(md.n);
      box.appendChild(h(`<div class="mod-band ${open ? '' : 'shut'}"><small>Module ${md.n}</small><b>${esc(fr(md.titre))}</b><span>${esc(fr(!open ? `Termine la mission ${prevOf(md.n * 100 + 1)} pour ouvrir ce module.` : n === 10 ? `Module terminé · ${md.fin || ''}` : `${md.sous} · ${n}/10`))}</span></div>`));
    }
  }
  const n1 = doneIn(1);
  $('#park-foot').textContent = fr(n1 === 10 ? 'Module 1 terminé. Tout le parc est rallumé.' : `Module 1 · ${n1} attraction${n1 > 1 ? 's' : ''} rallumée${n1 > 1 ? 's' : ''} sur 10`);
  /* L'éclat d'une attraction qui vient de se rallumer ne se joue qu'une fois */
  if (newLitShown) setTimeout(() => { if (S.newLit) { S.newLit = null; store.save(); } }, 2600);
  if (scrollToCurrent) {
    const sc = $('#park-scroll'), id = cur || D.missions[D.missions.length - 1].id;
    requestAnimationFrame(() => { const pin = $(`.pin[data-m="${id}"]`); if (!pin) return; const map = pin.closest('.map'); sc.scrollTop = Math.max(0, map.offsetTop + pin.offsetTop - sc.clientHeight * .55); });
  }
}
function openMissionSheet(id) {
  const m = meta(id), def = M[id], st = isDone(id) ? 'done' : (unlocked(id) ? 'open' : 'locked');
  const res = S.resume && S.resume.m === id && S.resume.i > 0 ? S.resume.i : 0;
  const sh = $('#sheet');
  sh.innerHTML = '';
  const goals = (def && def.objectifs || []).map(g => `<li>${esc(fr(g))}</li>`).join('');
  sh.appendChild(h(`<div>
    <div class="sheet-img"><img src="img/s-${m.scene}.webp" alt=""></div>
    <div class="kicker">Mission ${id} · ${esc(fr(m.lieu))}</div>
    <h2>${esc(fr(m.titre))}</h2>
    <div class="meta"><span>${esc(fr(m.duree))}</span><span>8 ${finale(id) ? 'défis' : 'exercices'}</span><span>${xpOf(id)}${NB}XP</span><span>${finale(id) ? 'Épreuve finale' : modOf(id) > 1 ? 'Intermédiaire' : 'Débutant'}</span></div>
    ${goals ? `<ul class="goals">${goals}</ul>` : ''}
    ${attrCard(id, st === 'done')}
  </div>`));
  if (st === 'locked') {
    sh.appendChild(h(`<p>Cette mission s’ouvre quand la mission ${prevOf(id)} est terminée.</p>`));
    sh.appendChild(btn('D’accord', 'cta dark', closeSheet));
  } else if (!def) {
    sh.appendChild(h(`<p>Cette mission arrive dans une prochaine version du parcours.</p>`));
    sh.appendChild(btn('D’accord', 'cta dark', closeSheet));
  } else {
    if (res) {
      sh.appendChild(btn(fr(`Reprendre à l’exercice ${res + 1}/8`), 'cta', () => { closeSheet(); runMission(id, { from: res }); }));
      sh.appendChild(btn('Recommencer la mission', 'btn-2', () => { closeSheet(); runMission(id, { from: 0 }); }));
    } else {
      if (st === 'done' && ARC()[id]) sh.appendChild(btn('Jouer à l’attraction', 'cta', () => { closeSheet(); runArcade(id); }));
      sh.appendChild(btn(st === 'done' ? 'Rejouer la mission' : 'Commencer la mission', st === 'done' && ARC()[id] ? 'btn-2' : 'cta', () => { closeSheet(); runMission(id, { from: 0 }); }));
      if (st === 'done') sh.appendChild(h(`<p class="lc-note" style="text-align:center">Les récompenses de cette mission sont déjà acquises.</p>`));
    }
  }
  openSheet();
}
/* Carte « attraction » d'une mission : rallumée (jouable) ou encore éteinte */
function attrCard(id, on) {
  const a = ARC()[id]; if (!a || !window.J) return '';
  return `<div class="sheet-attr ${on ? 'on' : ''}"><i>${window.J.icon(a.kind)}</i><div><small>${on ? 'Attraction rallumée' : 'Attraction à rallumer'}</small><b>${esc(fr(window.J.name(a.kind)))}${a.title ? ' · ' + esc(fr(a.title)) : ''}</b></div></div>`;
}
function btn(label, cls, fn) { const b = h(`<button class="${cls}">${esc(label)}</button>`); b.addEventListener('click', fn); return b; }

/* Bureau */
function renderBureau() {
  const P = projectNow();
  const rows = P.tables.reduce((a, t) => a + t.rows.length, 0);
  const vis = P.pages.reduce((a, p) => a + p.visuals.length, 0);
  const servicesOn = new Set(P.sources.map(s => s.service).filter(Boolean));
  const objs = D.missions.map(m => { const def = M[m.id]; return def && def.recompense ? { m: m.id, id: def.recompense.objet } : null; }).filter(Boolean);
  const bdg = D.missions.map(m => { const def = M[m.id]; return def && def.recompense ? { m: m.id, id: def.recompense.badge, nom: def.recompense.badgeNom } : null; }).filter(Boolean);
  const el = $('#bureau-scroll'); el.innerHTML = '';
  el.appendChild(h(`<div class="desk-hero"><img src="img/s-bureau.webp" alt=""><h1>Ton bureau</h1><p>${esc(fr(S.done.length ? `${S.done.length} mission${S.done.length > 1 ? 's' : ''} terminée${S.done.length > 1 ? 's' : ''} · ${S.xp} XP` : 'Ton premier jour commence à l’administration.'))}</p></div>`));
  el.appendChild(h(`<section class="desk-sec"><h2>Wonderland_Pilotage<span>${P.name ? 'Enregistré' : 'Pas encore créé'}</span></h2>
    <div class="proj"><div class="proj-h"><span class="pbi-ic"><svg width="18" height="18" viewBox="0 0 18 18" fill="#141B3C"><rect x="2" y="9" width="3.4" height="7" rx=".6"/><rect x="7.3" y="5" width="3.4" height="11" rx=".6"/><rect x="12.6" y="2" width="3.4" height="14" rx=".6"/></svg></span>
    <div><b>${P.name ? esc(P.name) + '.pbix' : 'Aucun projet'}</b><small>${esc(fr(P.pages.length ? `${P.pages.length} page${P.pages.length > 1 ? 's' : ''} : ${P.pages.map(p => p.name).join(', ')}` : 'Le projet sera créé pendant la mission 101.'))}</small></div></div>
    <div class="proj-stats"><div><b>${P.tables.length}</b><span>tables</span></div><div><b>${rows}</b><span>lignes</span></div><div><b>${vis}</b><span>visuels</span></div></div>
    <div class="net"><p>${esc(fr(`Réseau de données du parc : ${servicesOn.size}/6 services connectés`))}</p><ul>${D.services.map(s => `<li class="${servicesOn.has(s) ? 'on' : ''}"><i></i>${esc(s)}</li>`).join('')}</ul></div></div></section>`));
  const mods = [...new Set(objs.map(o => modOf(o.m)))];
  const sub = (list, md) => list.filter(o => modOf(o.m) === md);
  const modName = md => { const x = (D.modules || []).find(y => y.n === md); return x ? `Module ${md} · ${x.titre}` : `Module ${md}`; };
  el.appendChild(h(`<section class="desk-sec"><h2>Objets du bureau<span>${S.objets.length}/${objs.length}</span></h2>${mods.map(md => `${mods.length > 1 ? `<h3 class="desk-mod">${esc(fr(modName(md)))}</h3>` : ''}<div class="objs">${sub(objs, md).map(o => {
    const got = S.objets.includes(o.id);
    return `<div class="obj ${got ? '' : 'locked'}"><img src="img/o-${o.id}.webp" alt=""><b>${esc(fr(D.objets[o.id] || o.id))}</b><small>Mission ${o.m}</small></div>`; }).join('')}</div>`).join('')}</section>`));
  el.appendChild(h(`<section class="desk-sec"><h2>Badges<span>${S.badges.length}/${bdg.length}</span></h2>${mods.map(md => `${mods.length > 1 ? `<h3 class="desk-mod">${esc(fr(modName(md)))}</h3>` : ''}<div class="badges">${sub(bdg, md).map(b => {
    const got = S.badges.includes(b.id);
    return `<div class="badge-it ${got ? '' : 'locked'}"><img src="img/${b.id}.webp" alt=""><span>${esc(fr(b.nom))}</span></div>`; }).join('')}</div>`).join('')}</section>`));
  el.appendChild(h('<div class="desk-end"></div>'));
}

/* Mémo : fiches retournables */
function renderMemo() {
  const el = $('#memo-scroll'); el.innerHTML = '';
  const total = S.fiches.length * 8;
  el.appendChild(h(`<div class="memo-head"><h1>Fiches mémo</h1><p>${esc(fr(total ? `${total} fiches débloquées. Touche une fiche pour la retourner.` : 'Chaque mission terminée ajoute huit fiches, à relire en quelques secondes.'))}</p></div>`));
  if (!S.fiches.length) el.appendChild(h(`<div class="memo-empty">Termine la mission 101 pour débloquer tes huit premières fiches.</div>`));
  for (const id of [...S.fiches].sort().reverse()) {
    const def = M[id]; if (!def || !def.fiches) continue;
    const g = h(`<section class="memo-group"><h2><span>${id}</span>${esc(fr(meta(id).titre))}</h2><div class="cards"></div></section>`);
    def.fiches.forEach((f, i) => $('.cards', g).appendChild(ficheEl(id, i, f)));
    el.appendChild(g);
  }
  el.appendChild(h('<div class="memo-end"></div>'));
}
function ficheEl(id, i, f) {
  const c = h(`<button class="fiche" aria-pressed="false"><div class="fiche-in">
    <div class="fiche-f"><small>Fiche ${i + 1}/8 · Mission ${id}</small><b>${esc(fr(f[0]))}</b><p>${esc(fr(f[1]))}</p><em aria-hidden="true">Toucher pour retourner</em></div>
    <div class="fiche-b" aria-hidden="true"><small>${esc(fr(f[0]))}</small><p>${esc(fr(f[2]))}</p></div></div></button>`);
  c.addEventListener('click', () => {
    const on = c.classList.toggle('flip');
    c.setAttribute('aria-pressed', on); $('.fiche-f', c).setAttribute('aria-hidden', on); $('.fiche-b', c).setAttribute('aria-hidden', !on);
    if (on) announce(fr(f[2]));
  });
  return c;
}

/* ───────── Feuilles et notifications ───────── */
const scrim = $('#scrim');
let sheetOnClose = null, sheetFrom = null;
function openSheet(onClose) {
  const sh = $('#sheet'), t = $('h2', sh);
  const x = h('<button class="sheet-x" type="button" aria-label="Fermer"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg></button>');
  x.addEventListener('click', closeSheet); sh.prepend(x);
  sh.setAttribute('aria-modal', 'true');
  if (t) { t.id = 'sheet-t'; t.tabIndex = -1; sh.setAttribute('aria-labelledby', 'sheet-t'); } else sh.removeAttribute('aria-labelledby');
  sheetFrom = document.activeElement;
  for (const e of $$('.view, #tabbar')) if (!e.inert) { e.inert = true; e.dataset.sheetInert = '1'; }
  sh.classList.add('on'); scrim.classList.add('on'); sheetOnClose = onClose || null;
  requestAnimationFrame(() => (t || x).focus({ preventScroll: true }));
}
function closeSheet() {
  $('#sheet').classList.remove('on'); scrim.classList.remove('on');
  for (const e of $$('[data-sheet-inert]')) { e.inert = false; delete e.dataset.sheetInert; }
  if (sheetFrom && sheetFrom.isConnected && !sheetFrom.closest('[inert]')) sheetFrom.focus({ preventScroll: true });
  sheetFrom = null;
  const f = sheetOnClose; sheetOnClose = null; if (f) f();
}
addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet').classList.contains('on')) closeSheet(); });
scrim.addEventListener('click', () => { if (!$('#sheet').dataset.modal) closeSheet(); });
let toastT = 0;
function toast(who, title, text) {
  const t = $('#toast');
  t.innerHTML = `<img src="${avatar(who)}" alt=""><span><b>${esc(fr(title))}</b><span>${esc(fr(text))}</span></span>`;
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
}

/* ───────── Moteur : attentes, accélération, annulation ───────── */
class Cancel extends Error {}
let run = 0, pending = null, expectation = null, queued = null, skipUntil = 0;
function sleep(ms, t, firm) {
  if (window.PBQ_FAST) ms = Math.min(ms, 40);
  return new Promise((res, rej) => {
    if (t !== run) return rej(new Cancel());
    if (!firm && performance.now() < skipUntil) ms = Math.min(ms, 60);
    let id;
    const me = { firm, flush() { clearTimeout(id); if (pending === me) pending = null; t === run ? res() : rej(new Cancel()); } };
    id = setTimeout(me.flush, ms);
    pending = me;
  });
}
function hurry() { skipUntil = performance.now() + 450; if (pending && !pending.firm) pending.flush(); }
function expect(handlers, t) {
  return new Promise((resolve, reject) => {
    if (t !== run) return reject(new Cancel());
    expectation = { handlers, resolve, reject };
    const q = queued; queued = null;
    if (q && performance.now() - q.at < 900 && handlers[q.type]) setTimeout(() => { if (expectation && expectation.handlers === handlers) act(q.type, q.payload); }, 0);
  });
}
/* Toute action de la personne passe ici. Le gestionnaire renvoie true (étape réussie), false (mauvaise piste : action refusée) ou rien (action acceptée, étape pas finie). */
function act(type, payload) {
  stepBack();
  const e = expectation;
  if (e && e.handlers[type]) {
    let r;
    try { r = e.handlers[type](payload); } catch (err) { console.error(err); r = undefined; }
    if (r === true) { if (expectation === e) expectation = null; e.resolve({ type, payload }); return 'ok'; }
    if (r === false) return 'no';
    return 'ok';
  }
  if (e && e.handlers['*']) { const r = e.handlers['*']({ type, payload }); if (r === false) return 'no'; }
  queued = { type, payload, at: performance.now() };
  hurry();
  return 'queued';
}
/* Essai à blanc d'une attraction : le gestionnaire juge (et explique) un choix sans terminer l'étape */
function probe(type, payload) {
  const e = expectation; if (!e || !e.handlers[type]) return undefined;
  try { return e.handlers[type](payload); } catch (err) { console.error(err); return undefined; }
}
function cancelRun() {
  run++;
  const e = expectation; expectation = null; if (e) e.reject(new Cancel());
  const p = pending; pending = null; if (p) p.flush();
  queued = null;
}

/* ───────── Mission : couches ───────── */
const missionEl = $('#mission'), layers = { cine: $('#cine'), work: $('#work'), reward: $('#reward') };
const screenEl = $('#screen');
function showLayer(n) { for (const k in layers) { layers[k].classList.toggle('is-on', k === n); layers[k].inert = k !== n; } screenEl.classList.toggle('on-photo', n === 'cine'); if (n === 'work') requestAnimationFrame(() => fitTitle()); }

/* Cinématique */
const cineBg = $('#cine-bg'), cineStack = $('#cine-stack');
let cineSkip = null;
$('#cine-skip').addEventListener('click', () => { if (cineSkip) cineSkip(); });
$('#cine').addEventListener('click', e => { if (!e.target.closest('button')) hurry(); });
function setBg(name) {
  if (!name) return;
  const src = name === 'pixel' ? 'img/pixel.webp' : `img/s-${name}.webp`;
  const cur = $('img.on', cineBg);
  if (cur && cur.dataset.n === name) return;
  const img = h(`<img alt="" data-n="${name}" src="${src}">`);
  if (name === 'pixel') Object.assign(img.style, { objectFit: 'contain', objectPosition: '50% 18%', padding: '70px 40px 0', background: 'radial-gradient(70% 50% at 50% 30%, #3D4782, #141B3C)' });
  cineBg.appendChild(img);
  const go = () => { img.classList.add('on'); if (cur) { cur.classList.remove('on'); setTimeout(() => cur.remove(), 900); } };
  img.complete ? requestAnimationFrame(go) : (img.onload = go, img.onerror = go);
}
function cineItem(step) {
  if (step.n) return h(`<div class="c-item c-narr">${esc(fr(step.n))}</div>`);
  if (step.p) {
    const p = person(step.p);
    return h(`<div class="c-item c-say ${step.p}"><img src="${avatar(step.p)}" alt=""><div class="b"><small>${esc(p.nom)}${step.role !== false && p.role ? ' · ' + esc(fr(step.r || p.role)) : ''}</small>${esc(fr(step.t))}</div></div>`);
  }
  if (step.card) { const c = step.card; return h(`<div class="c-item c-card">${c.k ? `<div class="k">${esc(fr(c.k))}</div>` : ''}${c.h ? `<h3>${esc(fr(c.h))}</h3>` : ''}${c.p ? `<p>${esc(fr(c.p))}</p>` : ''}${c.ul ? `<ul>${c.ul.map(x => `<li>${esc(fr(x))}</li>`).join('')}</ul>` : ''}${c.chips ? `<div class="c-chips">${c.chips.map(x => `<span>${esc(fr(x))}</span>`).join('')}</div>` : ''}${c.sig ? `<div class="sig">${esc(fr(c.sig))}</div>` : ''}</div>`); }
  if (step.mail) return mailEl(step.mail, true);
  return null;
}
function mailEl(m, inCine) {
  const p = person(m.de);
  const el = h(`<div class="${inCine ? 'c-item ' : ''}mail"><div class="mail-h"><img src="${avatar(m.de)}" alt=""><div><b>${esc(p.nom)}</b><small>${esc(fr(m.role || p.role))}${m.a ? ' · À : ' + esc(m.a) : ''}</small></div><time>${esc(fr(m.heure || ''))}</time></div>
    <div class="mail-b">${m.objet ? `<span class="obj">${esc(fr('Objet : ' + m.objet))}</span>` : ''}${(m.corps || []).map(x => `<p>${esc(fr(x))}</p>`).join('')}</div></div>`);
  if (m.pj) el.appendChild(h(`<div class="att" role="note"><i class="${m.pj.type}">${m.pj.type.toUpperCase()}</i><span><b>${esc(m.pj.nom)}</b><small>${esc(fr(m.pj.info || ''))}</small></span></div>`));
  return el;
}
async function playCine(steps, t, opts = {}) {
  showLayer('cine');
  cineStack.innerHTML = ''; $('#cine-title').innerHTML = opts.title || '';
  let skipped = false;
  const skipP = new Promise(res => { cineSkip = () => { skipped = true; res(); }; });
  const body = (async () => {
    for (const s of steps) {
      if (skipped) return;
      if (s.bg) setBg(s.bg);
      if (s.scene) $('#cine-title').innerHTML = `${esc(fr(s.scene))}${opts.title ? '' : ''}`;
      if (s.clear) { $$('.c-item', cineStack).forEach(e => { e.classList.add('out'); setTimeout(() => e.remove(), 260); }); await sleep(280, t, true); }
      if (s.wait) await sleep(s.wait, t);
      const el = cineItem(s);
      if (el) {
        cineStack.appendChild(el);
        trimStack();
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
        const len = (s.t || s.n || (s.card && ((s.card.h || '') + (s.card.p || '') + (s.card.ul || []).join(' '))) || (s.mail && (s.mail.corps || []).join(' ')) || '').length;
        await sleep(clamp(900 + len * 42, 1800, 6500), t);
      }
      if (s.btn) {
        const b = btn(fr(s.btn), 'cta c-item c-btn', () => {});
        cineStack.appendChild(b); trimStack();
        requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('in')));
        await new Promise((res, rej) => { b.onclick = () => { b.disabled = true; res(); }; cineSkip = () => { skipped = true; res(); }; if (t !== run) rej(new Cancel()); });
        b.remove();
      }
    }
  })();
  await Promise.race([body, skipP]);
  cineSkip = null;
  if (t !== run) throw new Cancel();
}
function trimStack() {
  const items = $$('.c-item:not(.out)', cineStack);
  const max = cineStack.parentElement.clientHeight * .7;
  let total = items.reduce((a, e) => a + e.offsetHeight + 8, 0);
  for (const e of items) { if (total <= max || items.length < 2) break; total -= e.offsetHeight + 8; e.remove(); }
}

/* ───────── Espace de travail ───────── */
/* En bas, une seule zone : la dernière réplique, la consigne, puis la question. Elle pousse le logiciel vers le haut. */
const thread = $('#thread'), ws = $('#ws'), answer = $('#answer'), ansCard = $('#ans-card'), workEl = $('#work');
const consigne = $('#consigne'), consigneT = $('#consigne-t'), grab = $('#dock-grab');
let curTodo = null;
const readMs = text => clamp(700 + text.length * 30, 1300, 3800);
/* Une réplique longue devient plusieurs bulles courtes, coupées entre deux phrases */
function splitLine(text) {
  const t = String(text);
  if (t.length <= 130) return [t];
  const s = t.split(/(?<=[.!?…])\s+(?=[A-ZÀÂÉÈÊÎÔÛÇ«0-9])/);
  if (s.length < 2) return [t];
  const out = []; let cur = '';
  for (const x of s) { if (cur && (cur + ' ' + x).length > 120) { out.push(cur); cur = x; } else cur = cur ? cur + ' ' + x : x; }
  if (cur) out.push(cur);
  return out;
}
/* Changement de hauteur animé : la zone glisse au lieu de sauter */
function morph(el, change) {
  const h0 = el.offsetHeight;
  change();
  el.style.height = '';
  const h1 = el.offsetHeight;
  if (h0 === h1 || reduced) return;
  el.style.height = h0 + 'px'; void el.offsetHeight; el.style.height = h1 + 'px';
  clearTimeout(el._mt); el._mt = setTimeout(() => { el.style.height = ''; }, 380);
}
function showLine(el) {
  morph(thread, () => {
    const prev = $('.bub.cur', thread);
    if (prev && prev !== el) { prev.classList.remove('cur', 'in'); prev.classList.add('out'); setTimeout(() => prev.classList.remove('out'), 260); }
    if (el) el.classList.add('cur');
  });
  if (el) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  grab.classList.toggle('off', !thread.children.length);
}
function keepThread() { const all = $$('.bub', thread); for (let i = 0; i < all.length - 80; i++) if (!all[i].classList.contains('cur')) all[i].remove(); }
function bubble(who, text, kind = '') {
  const p = person(who), txt = fr(text);
  const el = h(`<div class="bub ${who} ${kind}" data-who="${who}" data-kind="${kind}"><img class="av" src="${avatar(who)}" alt=""><div class="t"></div></div>`);
  $('.t', el).innerHTML = (who !== 'pixel' ? `<small>${esc(p.nom)}</small>` : '') + esc(txt);
  el.dataset.txt = txt;
  thread.appendChild(el); keepThread();
  if (kind !== 'todo') showLine(el); else grab.classList.remove('off');
  return el;
}
/* Bulle de code : texte exact à copier (formules M), sans typographie française */
function codeBubble(text, label) {
  const el = h(`<div class="bub pixel code" data-who="pixel" data-kind="code"><img class="av" src="${avatar('pixel')}" alt=""><div class="t">${label ? `<small>${esc(fr(label))}</small>` : ''}<pre></pre><button class="copy" type="button">Copier</button></div></div>`);
  $('pre', el).textContent = text; el.dataset.txt = text;
  $('.copy', el).addEventListener('click', e => {
    e.stopPropagation(); window.PBQ.clip = text;
    try { if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {}); } catch (er) {}
    const b = e.currentTarget; b.textContent = 'Copié'; b.classList.add('done'); act('clip', { text });
  });
  thread.appendChild(el); keepThread(); showLine(el);
  return el;
}
/* Consigne : l'action à faire, toujours au même endroit, juste au-dessus du pouce */
function setConsigne(text) {
  if (!text) { consigne.classList.remove('on'); return; }
  const on = consigne.classList.contains('on');
  clearTimeout(consigneT._t);
  if (on && consigneT.textContent === text && !consigneT.classList.contains('swap')) return;
  /* Même consigne qui avance (compteur 3/15…) : mise à jour directe, sans fondu */
  const near = on && !consigneT.classList.contains('swap') && consigneT.textContent.slice(0, 18) === text.slice(0, 18);
  if (on && !reduced && !near) {
    consigneT.classList.add('swap');
    consigneT._t = setTimeout(() => { morph(consigne, () => { consigneT.textContent = text; }); consigneT.classList.remove('swap'); }, 150);
  } else if (on) { morph(consigne, () => { consigneT.textContent = text; }); consigneT.classList.remove('swap'); }
  else { consigneT.textContent = text; consigneT.classList.remove('swap'); }
  consigne.classList.add('on');
  if (consigne._said !== text) { consigne._said = text; announce(text); }
}
function endTodo() { curTodo = null; setConsigne(null); }
/* Pendant le travail, la réplique s'efface et laisse la place au logiciel ; elle reste dans l'historique */
function stepBack() {
  if (!curTodo || answer.classList.contains('on')) return;
  const cur = thread.querySelector('.bub.cur');
  if (cur && !/\b(code|hint)\b/.test(cur.className)) showLine(null);
}
thread.addEventListener('click', hurry);
function clearThread() { thread.innerHTML = ''; thread.style.height = ''; curTodo = null; clearTimeout(consigneT._t); setConsigne(null); grab.classList.add('off'); }
/* Historique de l'exercice : la poignée (ou un glissement vers le haut) ouvre toute la conversation */
function openHistory() {
  const items = $$('.bub', thread); if (!items.length) return;
  const sh = $('#sheet'); sh.innerHTML = '';
  sh.appendChild(h(`<h2 class="hist-t">Conversation</h2>`));
  const list = h('<div class="hist"></div>');
  items.forEach(b => {
    const who = b.dataset.who, kind = b.dataset.kind || '', p = person(who);
    const row = h(`<div class="hrow ${kind}"><img src="${avatar(who)}" alt=""><div class="hb"><b>${kind === 'todo' ? 'À faire' : kind === 'hint' ? 'Indice' : esc(p.nom)}${kind === '' && who !== 'pixel' && p.role ? `<small> · ${esc(fr(p.role))}</small>` : ''}</b><p></p></div></div>`);
    if (kind === 'code') { const pre = h('<pre></pre>'); pre.textContent = b.dataset.txt; $('p', row).replaceWith(pre); }
    else $('p', row).textContent = kind === 'hint' ? b.dataset.txt.replace(/^Indice \d+\/\d+ · /, '') : b.dataset.txt;
    list.appendChild(row);
  });
  sh.appendChild(list);
  sh.appendChild(btn('Revenir à l’exercice', 'cta dark', closeSheet));
  openSheet();
  requestAnimationFrame(() => { sh.scrollTop = sh.scrollHeight; });
}
grab.addEventListener('click', openHistory);
{
  let y0 = null;
  const dock = $('#dock');
  dock.addEventListener('pointerdown', e => { y0 = e.target.closest('.thread, .dock-grab, .consigne') ? e.clientY : null; });
  dock.addEventListener('pointermove', e => { if (y0 !== null && e.clientY - y0 < -26) { y0 = null; openHistory(); } });
  dock.addEventListener('pointerup', () => { y0 = null; }); dock.addEventListener('pointercancel', () => { y0 = null; });
}

/* Stand de tir : une fléchette file vers la cible de la réponse touchée (la cible est dessinée par le bouton lui-même) */
function dart(b) {
  if (reduced || window.PBQ_FAST) return;
  $$('.dart', b).forEach(d => d.remove());
  const d = h('<i class="dart" aria-hidden="true"></i>'); b.appendChild(d);
  d.animate([{ transform: 'translate(38px, 46px) rotate(50deg) scale(1.15)', opacity: 0 }, { opacity: 1, offset: .25 }, { transform: 'translate(0, 0) rotate(50deg) scale(1)', opacity: 1 }], { duration: 170, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
  setTimeout(() => { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }, 165);
  setTimeout(() => { d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }); setTimeout(() => d.remove(), 160); }, 560);
}

/* Cibles */
let targets = [];
function target(...els) { untarget(); targets = els.flat().filter(Boolean); targets.forEach(e => e.classList.add('is-target')); }
function untarget() { targets.forEach(e => e.classList.remove('is-target')); targets = []; if (active && active.pbi) active.pbi.mark(); }
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

/* Applications de l'espace de travail */
const apps = {};
function app(name, el) {
  if (el && !apps[name]) { apps[name] = el; el.classList.add('app'); ws.appendChild(el); if (!window.PBQ_FAST) void el.offsetWidth; }
  for (const k in apps) { apps[k].classList.toggle('is-on', k === name); apps[k].inert = k !== name; }
  return apps[name];
}
function resetApps() { for (const k in apps) { apps[k].remove(); delete apps[k]; } }

/* Panneau de réponse : dans la zone du bas, à la place de la consigne */
function openAnswer(el) {
  setConsigne(null);
  /* Deux questions de suite : la carte reste ouverte et change de hauteur en douceur au lieu de sauter */
  const open = answer.classList.contains('on') || performance.now() - (answer._shut || 0) < 50;
  const swap = () => { ansCard.innerHTML = ''; ansCard.appendChild(el); ansCard.scrollTop = 0; };
  if (open) morph(ansCard, swap); else swap();
  answer.classList.add('on');
  ws.classList.add('squeeze');
  const q = $('.q', el) || $('.lbl', el);
  if (q) { q.tabIndex = -1; requestAnimationFrame(() => { if (!answer.contains(document.activeElement)) q.focus({ preventScroll: true }); }); }
}
function closeAnswer() {
  if (answer.contains(document.activeElement)) { thread.tabIndex = -1; thread.focus({ preventScroll: true }); }
  if (answer.classList.contains('on')) answer._shut = performance.now();
  answer.classList.remove('on'); ws.classList.remove('squeeze');
  setTimeout(() => { if (curTodo && !answer.classList.contains('on')) setConsigne(fr(curTodo)); }, 0);
}
/* Clavier du téléphone : la zone du bas reste juste au-dessus */
function placeAnswer() {
  const vv = window.visualViewport;
  const off = vv && mqMobile.matches ? Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) : 0;
  workEl.style.setProperty('--kb', off > 40 ? off + 'px' : '0px');
  workEl.classList.toggle('kb', off > 40);
}
if (window.visualViewport) { visualViewport.addEventListener('resize', placeAnswer); visualViewport.addEventListener('scroll', placeAnswer); }

/* Titre d'exercice : jamais coupé, il se resserre puis passe sur deux lignes */
function overflows(e) {
  const r = e.getBoundingClientRect();
  if (!r.width || !e.offsetWidth) return false;
  const k = r.width / e.offsetWidth, cs = getComputedStyle(e);
  const inner = (e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) * k;
  /* Les points de suspension masquent le dépassement : on mesure le texte entier */
  const ell = cs.textOverflow === 'ellipsis' && cs.whiteSpace === 'nowrap', to = e.style.textOverflow; if (ell) e.style.textOverflow = 'clip';
  const rg = document.createRange(); rg.selectNodeContents(e);
  const res = rg.getBoundingClientRect().width > inner + (ell ? -1 : .75) || e.scrollWidth > e.clientWidth + 1;
  e.style.textOverflow = to;
  return res;
}
function fitTitle() {
  const b = $('#w-name'); b.classList.remove('fit1', 'fit2');
  /* Marge de sécurité : à quelques dixièmes de pixel près, le navigateur ajoute déjà des points de suspension */
  const tight = () => { if (!b.clientWidth) return false; const sp = document.createElement('span'); sp.textContent = b.textContent; sp.style.cssText = 'position:absolute;white-space:nowrap;visibility:hidden'; b.appendChild(sp); const w = sp.getBoundingClientRect().width / ((b.getBoundingClientRect().width / b.offsetWidth) || 1); sp.remove(); return w > b.clientWidth - 3; };
  if (tight()) { b.classList.add('fit1'); if (tight()) { b.classList.remove('fit1'); b.classList.add('fit2'); } }
}
if (document.fonts) document.fonts.ready.then(() => fitTitle());
/* Le titre se réajuste dès que sa place change (couche affichée, rotation, police chargée) */
if (window.ResizeObserver) { let lastW = 0; new ResizeObserver(es => { const w = Math.round(es[0].contentRect.width); if (w && w !== lastW) { lastW = w; fitTitle(); } }).observe($('.w-title')); }
/* XP et étapes */
function setXP(v, plus) {
  const x = $('#w-xp'), n = $('#w-xp-n'); cancelAnimationFrame(x._raf);
  n.textContent = fr(v + ' XP');
  if (!plus) return;
  const f = h(`<span class="xp-float">+${plus}</span>`); x.appendChild(f); setTimeout(() => f.remove(), 1400);
  if (reduced || window.PBQ_FAST) return;
  /* Le compteur roule de l'ancien au nouveau total pendant que « +N » s'envole, et la pastille réagit */
  x.classList.remove('gain'); void x.offsetWidth; x.classList.add('gain');
  const t0 = performance.now(), from = v - plus;
  const tick = now => { const p = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - p, 3); n.textContent = fr(Math.round(from + plus * e) + ' XP'); if (p < 1) x._raf = requestAnimationFrame(tick); };
  tick(t0);
}
function setSteps(i, lesson) {
  const ol = $('#w-steps'); ol.innerHTML = ''; ol.classList.toggle('lesson', !!lesson);
  for (let k = 0; k < 8; k++) ol.appendChild(h(`<li class="${lesson ? '' : k < i ? 'done' : k === i ? 'now' : ''}"></li>`));
}

/* ───────── Contexte d'exercice ───────── */
let X = null;           // contexte courant
function makeCtx(m, t, exIndex, pbi) {
  const tx = (TX[m.id] || [])[exIndex] || { i: [], e: [] };
  const ctx = {
    m, t, pbi, P: pbi ? pbi.P : null, i: exIndex, errors: 0, hintsUsed: 0, errSeen: {},
    async say(who, text) { endTodo(); for (const part of splitLine(text)) { bubble(who, part); await sleep(readMs(part), t); } },
    async says(who, list) { for (const s of list) await ctx.say(who, s); },
    pixel(text) { return ctx.say('pixel', text); },
    todo(text) {
      if (curTodo === text && consigne.classList.contains('on')) return;
      if (curTodo !== text) {
        curTodo = text; bubble('pixel', text, 'todo');
        const cur = $('.bub.cur', thread);
        if (cur && /\b(oops|hint)\b/.test(cur.className)) showLine(null);
      }
      if (!answer.classList.contains('on')) setConsigne(fr(text));
    },
    async ok(text) { endTodo(); for (const part of splitLine(text)) { bubble('pixel', part, 'ok'); await sleep(readMs(part), t); } },
    note(text) { bubble('pixel', text); },
    code(text, label) { endTodo(); codeBubble(text, label); return sleep(900, t); },
    /* Question à choix multiples : des pastilles à cocher, validées ensemble */
    multi(q, options, check, btnLabel) {
      /* Affirmations longues : une pile de cartes à balayer, à droite pour cocher, à gauche pour écarter */
      if (window.J && options.some(o => String(o.t).length > 26)) return new Promise((resolve, reject) => {
        const el = h(`<div>${window.J.tag('coaster')}${q ? `<p class="q">${esc(fr(q))}</p>` : ''}</div>`);
        const T = window.J.tri({ bare: true, mini: true, options: [['non', 'Écarter'], ['oui', 'Cocher']], rows: options.map(o => ({ id: String(o.v), t: o.t })), btn: btnLabel || 'Valider',
          help: 'Envoie chaque wagon : à droite pour le cocher, à gauche pour l’écarter.', onPick: () => {},
          check: vals => {
            if (t !== run) return;
            const sel = options.filter(o => vals[String(o.v)] === 'oui').map(o => o.v);
            const r = check(sel);
            if (r === true) { T.lock(); setTimeout(() => { if (t !== run) return; closeAnswer(); resolve(sel); }, window.PBQ_FAST ? 30 : 550); return true; }
            const bad = Array.isArray(r) ? r : [r]; ctx.oops(bad[0] || '', bad[1]); return false;
          } });
        el.appendChild(T.el);
        openAnswer(el);
        const guard = setInterval(() => { if (t !== run) { clearInterval(guard); closeAnswer(); reject(new Cancel()); } }, 300);
      });
      return new Promise((resolve, reject) => {
        const sel = new Set();
        const el = h(`<div>${window.J ? window.J.tag('taupe') : '<span class="lbl">À toi de répondre</span>'}${q ? `<p class="q">${esc(fr(q))}</p>` : ''}<div class="mchips moles"></div><button class="cta dark">${esc(btnLabel || 'Valider')}</button></div>`);
        options.forEach((o, i) => {
          const b = h(`<button class="mchip mole" style="--i:${i}" data-v="${esc(String(o.v))}" aria-pressed="false"><span>${esc(fr(o.t))}</span></button>`);
          b.addEventListener('click', () => {
            sel.has(o.v) ? sel.delete(o.v) : sel.add(o.v); const on = sel.has(o.v);
            b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
            /* Coup de maillet : la taupe touchée s'enfonce dans son trou */
            if (on && !reduced && !window.PBQ_FAST) { b.classList.remove('bonk'); void b.offsetWidth; b.classList.add('bonk'); if (window.J) window.J.fx.buzz('ok'); }
          });
          $('.mchips', el).appendChild(b);
        });
        $('.cta', el).addEventListener('click', () => {
          if (t !== run) return;
          const r = check([...sel]);
          if (r === true) { closeAnswer(); resolve([...sel]); return; }
          const bad = Array.isArray(r) ? r : [r]; ctx.oops(bad[0] || '', bad[1]); shake($('.mchips', el));
        });
        openAnswer(el);
        const guard = setInterval(() => { if (t !== run) { clearInterval(guard); closeAnswer(); reject(new Cancel()); } }, 300);
      });
    },
    /* Formule M à copier : panneau du bas, le bouton la place dans le presse-papiers de l'appli */
    formula(src, label, btnLabel) {
      return new Promise((resolve, reject) => {
        const el = h(`<div><span class="lbl">${esc(fr(label || 'Formule M'))}</span><pre class="k2-code ans-code"></pre><button class="cta dark">${esc(btnLabel || 'Copier la formule')}</button></div>`);
        $('pre', el).textContent = src;
        $('button', el).addEventListener('click', () => {
          if (t !== run) return;
          window.PBQ.clip = src; try { if (navigator.clipboard) navigator.clipboard.writeText(src).catch(() => {}); } catch (e) {}
          closeAnswer(); act('clip', { text: src }); resolve();
        });
        openAnswer(el);
        const guard = setInterval(() => { if (t !== run) { clearInterval(guard); closeAnswer(); reject(new Cancel()); } }, 300);
      });
    },
    /* Cible montrée seulement après deux erreurs ou le troisième indice */
    guide(g) { ctx._g = g; if (ctx._gOn) showGuide(); else if (pbi && !g) pbi.mark(); },
    oops(label, fallback) {
      ctx.errors++; ctx.streak = 0;
      if (ctx.errors >= 2 && !ctx._gOn) { ctx._gOn = true; showGuide(); }
      const e = findErr(tx.e, label);
      const msg = e ? e[1] : (fallback || label);
      bubble('pixel', msg, 'oops');
      return false;
    },
    wait(handlers) { return expect(handlers, t); },
    pause(ms, firm) { return sleep(ms, t, firm); },
    target, untarget, shake,
    app(name, el) { return app(name, el); },
    hints: tx.i, errs: tx.e,
    ask(q, options) {
      return new Promise((resolve, reject) => {
        const el = h(`<div class="tir">${window.J ? window.J.tag('tir') : '<span class="lbl">À toi de répondre</span>'}${q ? `<p class="q">${esc(fr(q))}</p>` : ''}<div class="choices"></div></div>`);
        options.forEach(o => {
          const b = h(`<button class="choice">${esc(fr(o.t))}</button>`);
          b.addEventListener('click', () => {
            if (t !== run || el.dataset.done) return;
            /* Stand de tir : la fléchette part vers la cible de la réponse choisie */
            const J = window.J && window.J.fx; if (J) J.buzz(o.ok ? 'ok' : 'no');
            dart(b);
            /* Bonne réponse : la cible tombe, la carte passe au vert, puis la question se referme */
            if (o.ok) { el.dataset.done = '1'; b.classList.add('yes'); announce('Bonne réponse.'); if (J) setTimeout(() => J.win($('.dart', b) || b), reduced ? 0 : 170); $$('.choice', el).forEach(c => { if (c !== b) c.classList.add('fade'); }); setTimeout(() => { if (t !== run) return; closeAnswer(); resolve(o); }, window.PBQ_FAST ? 30 : 760); return; }
            ctx.oops(o.err || '', o.msg); b.classList.add('no'); b.setAttribute('aria-label', fr(o.t) + ' : réponse fausse'); shake(b);
          });
          $('.choices', el).appendChild(b);
        });
        openAnswer(el);
        const guard = setInterval(() => { if (t !== run) { clearInterval(guard); closeAnswer(); reject(new Cancel()); } }, 300);
      });
    },
    inputs(spec) {
      return new Promise((resolve, reject) => {
        const el = h(`<form autocomplete="off"><span class="lbl">${esc(spec.lbl || 'À toi de répondre')}</span>${spec.q ? `<p class="q">${esc(fr(spec.q))}</p>` : ''}<div class="fields"></div><button class="cta dark" type="submit">${esc(spec.btn || 'Valider')}</button></form>`);
        spec.fields.forEach(f => {
          const fe = h(`<div class="field ${f.wide ? 'wide' : ''}"><label for="in-${f.id}">${esc(fr(f.label))}</label><div class="${f.unit ? 'unit' : ''}"><input id="in-${f.id}" name="${f.id}" inputmode="${f.text ? 'text' : 'decimal'}" enterkeyhint="done" autocomplete="off" autocapitalize="off" spellcheck="false">${f.unit ? `<em>${esc(f.unit)}</em>` : ''}</div></div>`);
          $('.fields', el).appendChild(fe);
        });
        const read = () => { const vals = {}; spec.fields.forEach(f => { const v = $(`[name="${f.id}"]`, el).value.trim(); vals[f.id] = f.text ? v : (v === '' ? null : Number(v.replace(/\s/g, '').replace(',', '.'))); }); return vals; };
        if (spec.live) el.addEventListener('input', () => spec.live(read()));
        el.addEventListener('submit', ev => {
          ev.preventDefault(); if (t !== run) return;
          const vals = {}; spec.fields.forEach(f => { const v = $(`[name="${f.id}"]`, el).value.trim(); vals[f.id] = f.text ? v : (v === '' ? null : Number(v.replace(/\s/g, '').replace(',', '.'))); });
          const r = spec.check(vals);
          if (r === true) { $$('input', el).forEach(i => i.blur()); closeAnswer(); resolve(vals); return; }
          const bad = Array.isArray(r) ? r : [r];
          if (bad[0] || bad[1]) ctx.oops(bad[0], bad[1]);
          shake($('.fields', el));
        });
        openAnswer(el);
        const guard = setInterval(() => { if (t !== run) { clearInterval(guard); closeAnswer(); reject(new Cancel()); } }, 300);
      });
    },
    mail(m) {
      return new Promise((resolve, reject) => {
        const el = h(`<div><span class="lbl">${esc(m.lbl || 'Nouveau message')}</span></div>`);
        const card = mailEl(m); card.style.boxShadow = '0 0 0 1px var(--ligne)'; el.appendChild(card);
        if (m.btn) { const b = btn(fr(m.btn), 'cta', () => { closeAnswer(); resolve(); }); el.appendChild(b); }
        openAnswer(el);
        if (!m.btn) resolve();
        const guard = setInterval(() => { if (t !== run) { clearInterval(guard); closeAnswer(); reject(new Cancel()); } }, 300);
      });
    },
    closeAnswer
  };
  return ctx;
}
function showGuide() {
  if (!X) return; X._gOn = true;
  const g = X._g;
  if (!g) { if (X.pbi) X.pbi.mark(); return; }
  if (typeof g === 'function') target(g());
  else if (X.pbi) X.pbi.mark(...[].concat(g));
}
function findErr(list, label) {
  if (!label || !list) return null;
  const n = norm(label);
  return list.find(e => norm(e[0]) === n) || list.find(e => norm(e[0]).startsWith(n)) || list.find(e => norm(e[0]).includes(n)) || null;
}

/* Indices */
let hintIdx = 0;
$('#w-hint').addEventListener('click', () => {
  if (!X || !X.hints || hintIdx >= X.hints.length) return;
  let txt = String(X.hints[hintIdx++]).trim(); X.hintsUsed++;
  txt = txt.charAt(0).toUpperCase() + txt.slice(1); if (!/[.!?…»)]$/.test(txt)) txt += '.';
  bubble('pixel', `Indice ${hintIdx}/${X.hints.length} · ${txt}`, 'hint');
  if (hintIdx >= X.hints.length && !X._gOn) showGuide();
  updateHint();
});
function updateHint() { const n = X && X.hints ? X.hints.length - hintIdx : 0; $('#w-hint-n').textContent = n; $('#w-hint').disabled = !n; }
$('#ws').addEventListener('click', e => { if (!e.target.closest('button, input, select, a, label, .tbl, [data-tap]')) hurry(); });

/* ───────── Déroulé d'une mission ───────── */
let active = null;
async function runMission(id, opts = {}) {
  const def = M[id]; if (!def) return;
  cancelRun();
  const t = ++run;
  active = { id, def, t, from: opts.from || 0, replay: isDone(id) };
  missionEl.classList.add('is-open'); missionEl.inert = false;
  for (const k in views) views[k].inert = true; $('#tabbar').inert = true;
  clearThread(); resetApps(); closeAnswer(); untarget();
  setXP(S.xp);
  try {
    const P = projectBefore(id, active.from);
    const pbi = window.PBI ? new window.PBI(P, { act, mission: id }) : null;
    active.pbi = pbi;
    if (pbi) app('pbi', pbi.el);
    if (def.debut) def.debut(P, pbi);
    if (active.from === 0 && def.intro && !opts.noIntro) await playCine(def.intro, t, { title: `<b>Mission ${id}</b>${esc(fr(def.lieu || meta(id).lieu))}` });
    showLayer('work');
    if (active.from === 0 && def.lecon && !opts.noLesson) {
      $('#w-kicker').textContent = fr(`Mission ${id} · Leçon`); $('#w-name').textContent = fr(def.leconTitre || 'Comprendre avant de pratiquer'); fitTitle();
      setSteps(0, true); hintIdx = 0; X = makeCtx(def, t, -1, pbi); X.hints = []; updateHint();
      await def.lecon(X);
      clearThread(); closeAnswer(); untarget();
    }
    for (let i = active.from; i < def.exs.length; i++) {
      const ex = def.exs[i];
      clearThread(); closeAnswer(); untarget();
      $('#w-kicker').textContent = fr(`${finale(id) ? 'Défi' : 'Exercice'} ${i + 1}/8`); $('#w-name').textContent = fr(ex.titre || (TX[id] && TX[id][i] ? TX[id][i].t : '')); fitTitle();
      setSteps(i); hintIdx = 0;
      X = makeCtx(def, t, i, pbi); updateHint();
      S.resume = { m: id, i }; store.save();
      await ex.run(X);
      untarget(); closeAnswer();
      const key = `${id}-${i + 1}`;
      if (!S.ex[key]) { const g = xpEx(id, i); S.ex[key] = 1; S.xp += g; setXP(S.xp, g); } else setXP(S.xp);
      S.resume = { m: id, i: i + 1 }; store.save();
      if (ex.apres) await ex.apres(X);
      await sleep(900, t);
    }
    S.resume = null; store.save();
    if (def.outro) await playCine(def.outro, t, { title: `<b>Mission ${id}</b>Fin de mission` });
    await showRewards(def, t);
  } catch (e) {
    if (!(e instanceof Cancel)) { console.error(e); }
  }
}
function closeMission() {
  cancelRun(); closeAnswer(); untarget(); closeSheet();
  missionEl.classList.remove('is-open'); missionEl.inert = true; screenEl.classList.remove('on-photo');
  $('#tabbar').inert = false;
  const t = $('.tab.is-on').dataset.tab; for (const k in views) views[k].inert = k !== t;
  active = null; X = null;
  renderPark(); if (t === 'bureau') renderBureau(); if (t === 'memo') renderMemo();
}
$('#w-quit').addEventListener('click', () => {
  if (!active) return;
  if (active.arcade) { closeMission(); return; }
  const sh = $('#sheet'); sh.innerHTML = '';
  const i = S.resume && S.resume.m === active.id ? S.resume.i : 0;
  sh.appendChild(h(`<div><h2>Quitter la mission ?</h2><p>${esc(fr(i > 0 ? `Ta progression est enregistrée : tu reprendras à l’exercice ${i + 1}/8.` : 'Tu reprendras la mission depuis le début.'))}</p></div>`));
  sh.appendChild(btn('Continuer la mission', 'cta', closeSheet));
  sh.appendChild(btn('Quitter', 'btn-2', closeMission));
  openSheet();
});

/* ───────── Rejouer une attraction rallumée (sans XP) ───────── */
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
async function playArcade(x, a) {
  const J = window.J;
  if (a.kind === 'train') {
    const name = id => fr((a.items.find(i => String(i[0]) === String(id)) || [])[1] || id);
    let start = shuffle(a.key); if (start.join() === a.key.join()) start = start.slice(1).concat(start[0]);
    const B = J.order({ title: a.title, items: a.items, start, key: a.key });
    x.app('arcade', B.el); x.todo('Pose les gares dans l’ordre du trajet.');
    await x.wait({ 'order.change': () => {}, 'order.check': ({ order }) => {
      const k = order.findIndex((id, i) => id !== a.key[i]); if (k < 0) { B.lock(); return true; }
      return x.oops('', (a.why && a.why[k]) || `Gare ${k + 1} : « ${name(a.key[k])} ».`);
    } });
    return;
  }
  const lab = v => fr((a.options.find(o => String(o[0]) === String(v)) || [])[1] || '');
  const B = J.tri({ title: a.title, intro: a.intro, options: a.options, rows: shuffle(a.rows), key: a.key, ev: 'arc' });
  x.app('arcade', B.el); x.todo(a.kind === 'coaster' ? 'Envoie chaque wagon sur la bonne voie.' : 'Fais monter chaque carte dans la bonne nacelle.');
  await x.wait({ 'arc.pick': () => {}, 'arc.check': ({ values }) => {
    const bad = Object.keys(a.key).filter(k => String(values[k]) !== String(a.key[k]));
    if (!bad.length) { B.lock(); return true; }
    const r = a.rows.find(y => y.id === bad[0]) || {};
    return x.oops('', (a.why && a.why[bad[0]]) || `« ${fr(r.t || '')} » va dans « ${lab(a.key[bad[0]])} ».`);
  } });
}
async function runArcade(id) {
  const a = ARC()[id]; if (!a || !M[id] || !window.J) return;
  cancelRun();
  const t = ++run;
  active = { id, def: M[id], t, from: 0, arcade: true };
  missionEl.classList.add('is-open'); missionEl.inert = false;
  for (const k in views) views[k].inert = true; $('#tabbar').inert = true;
  clearThread(); resetApps(); closeAnswer(); untarget(); setXP(S.xp);
  showLayer('work');
  $('#w-kicker').textContent = fr(`Attraction · Mission ${id}`); $('#w-name').textContent = fr(window.J.name(a.kind)); fitTitle();
  setSteps(0, true); hintIdx = 0; X = makeCtx(M[id], t, -1, null); X.hints = []; updateHint();
  try {
    await playArcade(X, a);
    const e = X.errors;
    await X.ok(e ? `Attraction terminée, avec ${e} erreur${e > 1 ? 's' : ''}.` : 'Sans faute !');
    const sh = $('#sheet'); sh.innerHTML = '';
    sh.appendChild(h(`<div><h2>${esc(fr(window.J.name(a.kind)))}</h2><p>${esc(fr(e ? 'Encore un tour pour la faire sans erreur ?' : 'Tu peux la rejouer quand tu veux depuis la carte du parc.'))}</p></div>`));
    sh.appendChild(btn('Rejouer', 'cta', () => { closeSheet(); runArcade(id); }));
    sh.appendChild(btn('Retour au parc', 'btn-2', () => { closeSheet(); closeMission(); }));
    openSheet();
  } catch (err) { if (!(err instanceof Cancel)) console.error(err); }
}

/* Récompenses, fiches et suite */
async function showRewards(def, t) {
  const first = !isDone(def.id);
  const r = def.recompense;
  if (first) {
    S.done.push(def.id); S.done.sort();
    if (r.badge && !S.badges.includes(r.badge)) S.badges.push(r.badge);
    if (r.objet && !S.objets.includes(r.objet)) S.objets.push(r.objet);
    if (def.fiches && !S.fiches.includes(def.id)) S.fiches.push(def.id);
    S.newLit = def.id;
    store.save();
  }
  const el = $('#reward'); el.innerHTML = '';
  const xpM = Object.keys(S.ex).filter(k => k.startsWith(def.id + '-')).reduce((a, k) => a + xpEx(def.id, Number(k.split('-')[1]) - 1), 0);
  const md = modOf(def.id);
  el.appendChild(h(`<div style="display:contents">
    <div class="rw-badge"><img src="img/${r.badge}.webp" alt=""></div>
    <h1>${esc(fr(r.titre))}</h1><p>${esc(fr(r.sous))}</p>
    <div class="rw-stats"><div><b>+${xpM}</b><span>XP</span></div><div><b>8/8</b><span>${finale(def.id) ? 'Défis' : 'Exercices'}</span></div><div><b>8</b><span>Fiches mémo</span></div></div>
    <div class="rw-list">
      <div class="rw-item"><img src="img/${r.badge}.webp" alt=""><div><small>${first ? 'Nouveau badge' : 'Badge déjà obtenu'}</small><b>${esc(fr(r.badgeNom))}</b></div></div>
      <div class="rw-item obj-it"><img src="img/o-${r.objet}.webp" alt=""><div><small>${first ? 'Nouvel objet pour ton bureau' : 'Objet déjà obtenu'}</small><b>${esc(fr(D.objets[r.objet]))}</b></div></div>
      ${ARC()[def.id] && window.J ? `<div class="rw-item attr-it"><i>${window.J.icon(ARC()[def.id].kind)}</i><div><small>${first ? 'Attraction rallumée sur la carte' : 'Attraction déjà rallumée'}</small><b>${esc(fr(window.J.name(ARC()[def.id].kind)))}</b></div></div>` : ''}
    </div>
    <p class="rw-prog">${esc(fr(`Module ${md} : ${doneIn(md) * 10} % terminé · ${S.xp} XP cumulés`))}</p>
    ${first ? '' : '<p class="rw-note">Mission rejouée : les récompenses n’ont pas été attribuées une deuxième fois.</p>'}
  </div>`));
  const zone = h('<div class="cta-zone"></div>');
  zone.appendChild(btn(def.bilan ? 'Voir mon bilan' : 'Voir mes nouvelles fiches', 'cta', () => def.bilan ? showBilan(def, t) : showFiches(def, t)));
  el.appendChild(zone);
  showLayer('reward');
  /* Le gain d'XP se compte au moment où sa case apparaît */
  if (!reduced && !window.PBQ_FAST) { const b = $('.rw-stats b', el), t0 = performance.now() + 520; const tick = now => { const p = Math.max(0, Math.min(1, (now - t0) / 650)); b.textContent = '+' + Math.round(xpM * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); }; tick(performance.now()); }
}
/* Bilan individuel de l'épreuve finale (mission 110) */
function showBilan(def, t) {
  const el = $('#reward'); el.innerHTML = '';
  el.appendChild(def.bilan());
  const zone = h('<div class="cta-zone"></div>');
  zone.appendChild(btn('Voir mes nouvelles fiches', 'cta', () => showFiches(def, t)));
  el.appendChild(zone);
  el.scrollTop = 0;
}
function showFiches(def, t) {
  const el = $('#reward'); el.innerHTML = '';
  el.appendChild(h(`<div style="display:contents"><h1 style="margin-top:4px">Huit fiches en plus</h1><p>Touche une fiche pour la retourner. Tu les retrouves dans l’onglet Mémo.</p></div>`));
  const list = h('<div class="cards" style="margin-top:16px"></div>');
  def.fiches.forEach((f, i) => list.appendChild(ficheEl(def.id, i, f)));
  el.appendChild(list);
  const zone = h('<div class="cta-zone"></div>');
  zone.appendChild(btn('Continuer', 'cta', () => showSuite(def, t)));
  el.appendChild(zone);
  el.scrollTop = 0;
}
async function showSuite(def, t) {
  const nid = nextOf(def.id), nx = nid ? meta(nid) : null;
  try {
    if (def.suite) await playCine(def.suite, t, { title: `<b>${esc(fr(def.suiteTitre || 'Le lendemain'))}</b>${nx ? (modOf(nx.id) !== modOf(def.id) ? 'Module ' + modOf(nx.id) : 'Mission ' + nx.id) : 'Module ' + (modOf(def.id) + 1)}` });
  } catch (e) { if (e instanceof Cancel) return; }
  const el = $('#reward'); el.innerHTML = '';
  const pill = s => `<span>${s}</span>`;
  if (nx) {
    const newMod = modOf(nx.id) !== modOf(def.id), md = (D.modules || []).find(x => x.n === modOf(nx.id));
    el.appendChild(h(`<div style="display:contents"><div class="sheet-img" style="margin:calc(-10px - var(--sat)) -22px 0; border-radius:0; height:240px"><img src="img/s-${nx.scene}.webp" alt=""></div>
      ${newMod && md ? `<p class="rw-next mod">${esc(fr(`Nouveau lieu débloqué · Module ${md.n} · ${md.titre}`))}</p>` : ''}
      <p class="rw-next">Prochaine mission · ${nx.id}</p>
      <h1 style="text-align:left; margin-top:4px">${esc(fr(nx.titre))}</h1><p style="text-align:left">${esc(fr((M[nx.id] && M[nx.id].accroche) || nx.lieu))}</p>
      <div class="meta" style="margin-top:12px">${pill(esc(fr(nx.duree)))}${pill(`8 ${finale(nx.id) ? 'défis' : 'exercices'}`)}${pill(`${xpOf(nx.id)}${NB}XP`)}</div></div>`));
    const zone = h('<div class="cta-zone"></div>');
    if (M[nx.id]) zone.appendChild(btn(`Commencer la mission ${nx.id}`, 'cta', () => runMission(nx.id, { from: 0 })));
    zone.appendChild(btn('Retour au parc', M[nx.id] ? 'btn-2' : 'cta', () => { closeMission(); showTab('parc'); renderPark(true); }));
    el.appendChild(zone);
  } else {
    const fin = def.finModule || { img: 'o-certificat.webp', titre: `Module ${modOf(def.id)} terminé`, texte: 'La suite du parcours arrive dans une prochaine version.' };
    el.appendChild(h(`<div style="display:contents"><div class="rw-badge"><img src="img/${fin.img}" alt=""></div><h1>${esc(fr(fin.titre))}</h1><p>${esc(fr(fin.texte))}</p>${fin.liste ? `<div class="rw-list">${fin.liste.map(x => `<div class="rw-item txt"><div><small>${esc(fr(x[0]))}</small><b>${esc(fr(x[1]))}</b></div></div>`).join('')}</div>` : ''}</div>`));
    const zone = h('<div class="cta-zone"></div>');
    zone.appendChild(btn('Retour au parc', 'cta', () => { closeMission(); showTab('parc'); renderPark(true); }));
    el.appendChild(zone);
  }
  showLayer('reward');
}

/* ───────── Contrôle automatique : rien de coupé, rien qui déborde ───────── */
function controle() {
  const pb = [];
  const hidden = e => getComputedStyle(e).visibility === 'hidden' || (e.closest('.app') && !e.closest('.app').classList.contains('is-on')) || (e.closest('.layer') && !e.closest('.layer').classList.contains('is-on')) || (!e.closest('.pq2, .dlg-wrap, .menu') && e.closest('.pbi') && !!e.closest('.pbi').querySelector(':scope > .pq2.on'));
  const cut = (e, nom) => { if (e.offsetWidth && !hidden(e) && overflows(e)) pb.push(`${nom} : texte coupé (« ${e.textContent.trim().slice(0, 40)} »)`); };
  $$('.tbl th, .tbl td').forEach(c => cut(c, 'cellule'));
  $$('.rb-cmd, .rb-tab, .ptab, .pane-tab, .conn, .frow span, .nav-obj, .sel-box, .fbtn, .w-title b, .v-title, .choice, .pick, .field label, .step, .tsel, .menu button, .mcard h4, .mcard li, .dicon, .q2-hn, .q2-qbtn, .q2-scope, .chipb, .q2-qual span, .q2-dist span').forEach(e => cut(e, e.className.split(' ')[0]));
  if (workEl.classList.contains('is-on')) {
    $$('.bub.cur.in .t').forEach(b => { const r = b.getBoundingClientRect(), tr = thread.getBoundingClientRect(); if (!thread.style.height && (r.top < tr.top - .5 || r.bottom > tr.bottom + .5)) pb.push(`réplique coupée (« ${b.textContent.slice(0, 40)} »)`); });
    if (ws.offsetHeight < 140) pb.push(`logiciel écrasé (${ws.offsetHeight} px)`);
  }
  $$('.vis').forEach(v => { const p = v.closest('.page'); if (!p) return; const a = v.getBoundingClientRect(), b = p.getBoundingClientRect(); if (a.width && (a.right > b.right + 1 || a.bottom > b.bottom + 1)) pb.push('visuel hors de la page'); });
  return pb;
}

/* ───────── Démarrage ───────── */
function start() {
  renderPark(true);
  if (!S.done.length && !S.resume) setTimeout(() => openMissionSheet(101), 700);
}

window.PBQ = {
  start, announce, mission, M, S, D, fr, esc, h, eur, nfmt, dfr, norm, clone, $, $$, sleep: (ms) => sleep(ms, run), act, probe, avatar, person, clip: '', prevOf, nextOf, modOf, xpOf, renderPark,
  target, untarget, shake, hurry, toast, bubble, controle, projectBefore, project0, runMission, runArcade, closeMission, store,
  get run() { return run; }, get X() { return X; }, get active() { return active; },
  reset() { localStorage.removeItem(KEY); location.reload(); }
};
})();

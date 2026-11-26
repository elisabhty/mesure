/* Power BI Quest — mise en page du rapport (missions 109 et suivantes) :
   canevas, taille et position, sélection multiple, alignement, thèmes, formes, zones de texte,
   navigateur de pages, presse-papiers, textes de remplacement et ordre de tabulation */
(function () {
'use strict';
const PBI = window.PBI, P_ = PBI.prototype;
const { h, esc, fr, $, $$, clone, shake } = window.PBQ;
P_.adv2 = function () { return ((this.opts && this.opts.mission) || 0) >= 109; };
const SIZE = pg => pg.size || [1280, 720];
const px = (pg, v) => { const [W, H] = SIZE(pg); return { x: Math.round(v.x * W / 100), y: Math.round(v.y * H / 100), w: Math.round(v.w * W / 100), h: Math.round(v.h * H / 100) }; };
const setPx = (pg, v, o) => { const [W, H] = SIZE(pg); if (o.x != null) v.x = o.x / W * 100; if (o.y != null) v.y = o.y / H * 100; if (o.w != null) v.w = o.w / W * 100; if (o.h != null) v.h = o.h / H * 100; };
PBI.px = px; PBI.setPx = setPx;
const DECO = ['text', 'shape', 'button', 'navigator'];
const ICO = {
  copy: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="7" y="6" width="9" height="11" rx="1"/><path d="M13 6V4H4v11h3"/></svg>',
  paste: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="4" y="4" width="12" height="13" rx="1"/><path d="M7.5 4V2.8h5V4M7 9h6M7 12h6"/></svg>',
  grid: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="14" height="14" rx="1"/><path d="M7.7 3v14M12.3 3v14M3 7.7h14M3 12.3h14"/></svg>',
  snap: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 3v14h14" stroke-dasharray="2 2"/><rect x="7" y="5" width="8" height="8" rx="1"/></svg>',
  sel: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 5h12M4 10h12M4 15h8" stroke-linecap="round"/></svg>',
  multi: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="8" height="6" rx="1" stroke-dasharray="2 1.5"/><rect x="9" y="11" width="8" height="6" rx="1" stroke-dasharray="2 1.5"/></svg>',
  align: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 3.5h14"/><rect x="4" y="6" width="5" height="10" rx=".8"/><rect x="11" y="6" width="5" height="6" rx=".8"/></svg>',
  narr: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M4 5h12M4 9h12M4 13h7"/><path d="M14.5 12.5l1 2 2 .4-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.4z" stroke-linejoin="round"/></svg>',
  arrange: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="9" height="9" rx="1"/><rect x="8" y="8" width="9" height="9" rx="1" fill="#fff"/></svg>'
};
const COLORS = [['#FFFFFF', 'Blanc'], ['#F3F5F7', 'Gris clair'], ['#E9EFF4', 'Bleu brume'], ['#243746', 'Bleu nuit'], ['#354C5D', 'Bleu acier'], ['#52616D', 'Gris ardoise'], ['#C8A12B', 'Or Wonderland'], ['#E4BD52', 'Or clair'], ['#1F1F1F', 'Anthracite'], ['#118DFF', 'Bleu vif']];
const SIZES = [['169', '16:9 (1280 × 720)', [1280, 720]], ['43', '4:3 (960 × 720)', [960, 720]], ['custom', 'Personnalisé (1280 × 880)', [1280, 880]], ['letter', 'Lettre (816 × 1056)', [816, 1056]]];
const THEMES = {
  defaut: null,
  wonderland: { id: 'wonderland', name: 'Wonderland — Direction', canvas: '#F3F5F7', surface: '#FFFFFF', ink: '#243746', ink2: '#52616D', accent: '#C8A12B', history: '#E9EFF4', font: 'Segoe UI', data: ['#c8a12b', '#397fa8', '#639d87', '#9378b6', '#243746', '#52616D'] },
  soleil: { id: 'soleil', name: 'Ensoleillé', canvas: '#FFFFFF', surface: '#FFFFFF', ink: '#C8A12B', ink2: '#E4BD52', accent: '#C8A12B', font: 'Segoe UI', data: ['#E4BD52', '#C8A12B', '#F2C811', '#D9B300'] },
  neige: { id: 'neige', name: 'Neige', canvas: '#FFFFFF', surface: '#FFFFFF', ink: '#FFFFFF', ink2: '#F3F5F7', accent: '#E9EFF4', font: 'Segoe UI', data: ['#E9EFF4', '#F3F5F7', '#DDE3E8', '#C9D2DA'] },
  nuit: { id: 'nuit', name: 'Nuit', canvas: '#1B1F2A', surface: '#2A3040', ink: '#FFFFFF', ink2: '#B8C0CC', accent: '#4FA3FF', font: 'Segoe UI', data: ['#4FA3FF', '#7FD1AE', '#F2C811', '#E66C37'] }
};
PBI.THEMES = THEMES; PBI.COLORS = COLORS;
const cname = c => (COLORS.find(x => x[0].toLowerCase() === String(c || '').toLowerCase()) || [c, c])[1];
const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

/* ───────── Aspect de la page : arrière-plan, transparence, thème, quadrillage ───────── */
P_.pageLook = function (pg, el) {
  const T = this.P.theme, a = 1 - (pg.alpha || 0) / 100, c = pg.bg || (T && T.canvas) || '#FFFFFF';
  el.style.background = a <= 0 ? 'transparent' : hexA(c, a);
  if (T) { el.classList.add('themed'); [['--t-surface', T.surface], ['--t-ink', T.ink], ['--t-ink2', T.ink2], ['--t-accent', T.accent], ['--t-history', T.history || T.surface]].forEach(([k, v]) => el.style.setProperty(k, v)); }
  if (this.P.viewOpts && this.P.viewOpts.grid) el.classList.add('pg-grid');
};

/* ───────── Canevas dense : le contenu de chaque visuel s'ajuste à sa boîte ─────────
   Sur un téléphone, une page de 1280 px s'affiche sur environ 330 px. Les cartes et les segments réduisent leur contenu
   jusqu'à tenir dans leur cadre ; les tableaux et les graphiques gagnent un peu de place pour leurs lignes et leurs barres. */
const FIXED = { column: ['.ch', .86], bar: ['.ch', .86], stacked: ['.ch', .86], stacked100: ['.ch', .86], line: ['.ch', .86] };
const FITS = { card: '.v-card', slicer: '.v-slicer', text: '.v-text' };
const scaleTo = (c, f) => Object.assign(c.style, { width: (100 / f).toFixed(3) + '%', height: (100 / f).toFixed(3) + '%', transform: `scale(${f.toFixed(4)})`, transformOrigin: '0 0', right: 'auto', bottom: 'auto' });
P_.fitVisuals = function (pageEl) {
  if (!pageEl || !pageEl.isConnected || !pageEl.clientWidth) return;
  for (const el of $$('.vis', pageEl)) {
    const type = (el.className.match(/\bvis-([a-z0-9]+)/) || [])[1];
    if (FIXED[type]) { const c = $(FIXED[type][0], el); if (c && !c.style.transform) scaleTo(c, FIXED[type][1]); continue; }
    if (type === 'table') {
      /* Les colonnes tiennent dans la largeur si possible (sans descendre sous 62 %), les lignes défilent */
      const c = $('.v-table', el), t = c && $('table', c); if (!c || !t) continue;
      let f = .8; scaleTo(c, f);
      for (let i = 0; i < 3; i++) { const W = el.clientWidth / f, k = W / Math.max(1, t.scrollWidth); if (k >= .995) break; const nf = Math.max(.62, f * k); if (Math.abs(nf - f) < .005) break; f = nf; scaleTo(c, f); }
      continue;
    }
    const c = FITS[type] && $(FITS[type], el); if (!c) continue;
    let f = 1;
    for (let i = 0; i < 3; i++) {
      const W = el.clientWidth / f, H = el.clientHeight / f, k = Math.min(1, W / Math.max(1, c.scrollWidth), H / Math.max(1, c.scrollHeight));
      if (k > .985) break;
      f = Math.max(.5, f * k); scaleTo(c, f);
      if (f === .5) break;
    }
  }
};
const baseRV = P_.reportView;
P_.reportView = function (main) {
  const r = baseRV.call(this, main);
  if (this.adv2()) {
    const pageEl = $('.page', main);
    if (pageEl) {
      if (!this._fitRO) this._fitRO = new ResizeObserver(es => es.forEach(e => this.fitVisuals(e.target)));
      this._fitRO.disconnect(); this._fitRO.observe(pageEl);
    }
  }
  return r;
};

/* ───────── Commandes supplémentaires du ruban ───────── */
P_.extraCmds = function (tab) {
  if (!this.adv2()) return [];
  const o = this.P.viewOpts || {};
  if (tab === 'Accueil') return ['|', ['copy', 'Copier', ICO.copy], ['paste', 'Coller', ICO.paste]];
  if (tab === 'Insertion') return [['narrative', 'Narration intelligente', ICO.narr]];
  if (tab === 'Affichage') return ['|', ['grid', 'Quadrillage', ICO.grid, o.grid ? 'on' : ''], ['snap', 'Aligner sur la grille', ICO.snap, o.snap ? 'on' : ''], ['selpane', 'Volet Sélection', ICO.sel, this.st.pane === 'Sélection' ? 'on' : '']];
  return [];
};
const baseFT = P_.formatTab;
P_.formatTab = function () {
  const a = baseFT.call(this);
  if (!this.adv2()) return a;
  return a.concat([['multisel', 'Sélection multiple', ICO.multi, this.st.multiMode ? 'on' : ''], ['align', 'Aligner', ICO.align], ['arrange', 'Organiser', ICO.arrange]]);
};
const selected = pb => { const st = pb.st, pg = pb.page(); const ids = st.multiMode && st.multi && st.multi.length ? st.multi : st.selVis ? [st.selVis] : []; return ids.map(id => pg.visuals.find(v => v.id === id)).filter(Boolean); };
const baseCA = P_.cmdAct;
P_.cmdAct = function (cmd, b) {
  baseCA.call(this, cmd, b);
  if (!this.adv2()) return;
  const st = this.st, P = this.P, pg = this.page();
  const done = what => { P.dirty = true; this.render(); this.emit('viz.change', { what }); };
  switch (cmd) {
    case 'grid': case 'snap': { const o = P.viewOpts || (P.viewOpts = {}); if (this.emit('view.opt', { key: cmd, value: !o[cmd] }) === 'no') return; o[cmd] = !o[cmd]; done('view'); return; }
    case 'selpane': st.pane = st.pane === 'Sélection' ? 'Visualisations' : 'Sélection'; this.render(); this.emit('pane', st.pane); return;
    case 'multisel': st.multiMode = !st.multiMode; st.multi = st.multiMode && st.selVis ? [st.selVis] : []; this.emit('multi.mode', { on: st.multiMode }); this.render(); return;
    case 'align': {
      const vs = selected(this);
      this.menu(b, [['top', 'Aligner en haut'], ['left', 'Aligner à gauche'], ['hdist', 'Distribuer horizontalement'], ['vdist', 'Distribuer verticalement']], k => {
        if (vs.length < 2) { this.emit('vis.align', { ids: vs.map(v => v.id), how: k, few: true }); shake(b); return; }
        if (this.emit('vis.align', { ids: vs.map(v => v.id), how: k }) === 'no') return;
        const G = vs.map(v => ({ v, g: px(pg, v) }));
        if (k === 'top') { const y = Math.min(...G.map(o => o.g.y)); G.forEach(o => setPx(pg, o.v, { y })); }
        if (k === 'left') { const x = Math.min(...G.map(o => o.g.x)); G.forEach(o => setPx(pg, o.v, { x })); }
        if (k === 'hdist' || k === 'vdist') {
          const X = k === 'hdist' ? 'x' : 'y', L = k === 'hdist' ? 'w' : 'h';
          G.sort((a, c) => a.g[X] - c.g[X]);
          const start = G[0].g[X], end = G[G.length - 1].g[X] + G[G.length - 1].g[L], sum = G.reduce((a, o) => a + o.g[L], 0);
          const gap = (end - start - sum) / (G.length - 1); let pos = start;
          G.forEach(o => { setPx(pg, o.v, { [X]: Math.round(pos) }); pos += o.g[L] + gap; });
        }
        done('align');
      });
      return;
    }
    case 'arrange': {
      const vs = selected(this);
      this.menu(b, [['front', 'Mettre au premier plan'], ['back', 'Envoyer à l’arrière-plan']], k => {
        if (!vs.length || this.emit('vis.order', { ids: vs.map(v => v.id), how: k }) === 'no') return;
        pg.visuals = k === 'back' ? vs.concat(pg.visuals.filter(v => !vs.includes(v))) : pg.visuals.filter(v => !vs.includes(v)).concat(vs);
        done('order');
      });
      return;
    }
    case 'copy': { const vs = selected(this).sort((a, c) => pg.visuals.indexOf(a) - pg.visuals.indexOf(c)); if (!vs.length) { shake(b); return; } if (this.emit('clip.copy', { ids: vs.map(v => v.id), types: vs.map(v => v.type) }) === 'no') { shake(b); return; } st.clip = vs.map(v => clone(v)); return; }
    case 'paste': {
      if (!st.clip || !st.clip.length) { shake(b); return; }
      if (this.emit('clip.paste', { page: pg.id, ids: st.clip.map(v => v.id), types: st.clip.map(v => v.type) }) === 'no') return;
      const fresh = st.clip.map(v => { let n = 1; while (P.pages.some(p => p.visuals.some(o => o.id === 'vis_new_' + n))) n++; const c = clone(v); c.id = 'vis_new_' + n; c.temp = true; c.from = v.id; pg.visuals.push(c); return c; });
      st.selVis = fresh[fresh.length - 1].id; st.multi = st.multiMode ? fresh.map(v => v.id) : [];
      done('paste');
      return;
    }
    case 'shapes': this.menu(b, [['rect', 'Rectangle'], ['oval', 'Ovale'], ['line', 'Ligne']], k => this.insertDeco('shape', [35, 35, 30, 20], { shape: k, fmt: { fill: '#118DFF', outline: true } })); return;
    case 'textbox': this.insertDeco('text', [30, 40, 40, 10], { text: '', fmt: { size: 12, color: '#243746' } }); return;
    case 'buttons': this.menu(b, [['back', 'Retour'], ['pagenav', 'Navigateur de pages'], ['booknav', 'Navigateur de signets'], ['blank', 'Vide']], k => {
      if (k !== 'pagenav') { this.emit('button.kind', { kind: k }); shake(b); return; }
      this.insertDeco('navigator', [55, 2, 43, 7], { fmt: { states: {} } });
    }); return;
    case 'narrative': shake(b); return;
    case 'themes': {
      const cur = P.theme ? P.theme.id : 'defaut';
      this.menu(b, ['Thèmes du rapport'].concat(Object.keys(THEMES).map(k => [k, k === 'defaut' ? 'Par défaut' : THEMES[k].name, k === cur])), k => {
        if (this.emit('theme.set', { id: k, theme: THEMES[k] }) === 'no') return;
        P.theme = THEMES[k] ? clone(THEMES[k]) : null; done('theme');
      });
      return;
    }
  }
};
P_.insertDeco = function (type, at, extra) {
  if (this.emit('viz.create', { type, kind: extra.shape }) === 'no') return null;
  const v = this.addVisual(type, at); Object.assign(v, extra); v.f = { values: [], axis: [], legend: [], cols: [] };
  this.st.pane = 'Visualisations'; this.st.vzTab = 'format'; this.render(); this.emit('viz.change', { what: 'create', vis: v.id, type });
  return v;
};

/* ───────── Sélection multiple et objets décoratifs ───────── */
const baseVE2 = P_.visualEl;
P_.visualEl = function (v) {
  const el = baseVE2.call(this, v), st = this.st;
  if (st.multiMode && (st.multi || []).includes(v.id)) el.classList.add('sel');
  if (v.alt) el.setAttribute('aria-label', v.alt);
  if (v.type === 'card' && v.fmt && v.fmt.bg) el.style.background = v.fmt.bg;
  return el;
};
PBI.prototype.renderers.shape = function (el, v) {
  const f = v.fmt || {};
  el.appendChild(h(`<div class="v-shape ${v.shape === 'oval' ? 'oval' : ''}" style="background:${f.fill || '#118DFF'}; ${f.outline === false ? '' : 'box-shadow:inset 0 0 0 1px rgba(0,0,0,.35);'}"></div>`));
};
PBI.prototype.renderers.text = function (el, v) {
  const f = v.fmt || {};
  const W = ((this.page() || {}).size || [1280])[0];
  el.appendChild(h(`<div class="v-text ${v.text ? '' : 'empty'}" style="font-size:max(${((f.size || 12) * 4 / 3 / W * 100).toFixed(3)}cqi, 5.2px); color:${f.color || 'var(--t-ink, #252423)'}; ${f.bold ? 'font-weight:650;' : ''}">${esc(fr(v.text || 'Saisis ton texte'))}</div>`));
};
const NAV_DEF = { normal: { bg: '#E1DFDD', fg: '#252423' }, selected: { bg: '#605E5C', fg: '#FFFFFF' } };
PBI.prototype.renderers.navigator = function (el, v) {
  const s = (v.fmt && v.fmt.states) || {};
  const st = k => ({ ...NAV_DEF[k === 'selected' ? 'selected' : 'normal'], ...(s[k] || {}) });
  const n = st('normal'), sel = st('selected');
  el.appendChild(h(`<div class="v-nav">${this.P.pages.filter(p => !p.temp).map(p => { const on = p.id === this.P.activePage, c = on ? sel : n; return `<span class="${on ? 'on' : ''}" style="background:${c.bg}; color:${c.fg}" data-a="navgo:${v.id}|${p.id}" role="link" ${on ? 'aria-current="page"' : ''}>${esc(p.name)}</span>`; }).join('')}</div>`));
};

/* ───────── Segment en liste déroulante ───────── */
const ERASER = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M9.5 3.2l3.3 3.3-6 6H3.6L2.4 11.3a1 1 0 010-1.4z"/><path d="M6.2 6.5l3.3 3.3M7 12.5h6.5"/></svg>';
const CHEV = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5L6 7.5 9 4.5"/></svg>';
const baseStyles = P_.slicerStyles;
P_.slicerStyles = function (v) {
  const s = baseStyles.call(this, v);
  if (!this.adv2() || s.length > 1) return s;
  return s.concat([['dropdown', 'Liste déroulante']]);
};
P_.slicerValues = function (vis) {
  const f = (vis.f.values || [])[0]; if (!f) return [];
  const T = this.P.tables.find(t => t.id === f.t), q = this.query(vis);
  const vals = [...new Set((q ? q.rows : T.rows).map(r => r[f.c]))].filter(x => x !== null && x !== undefined && x !== '');
  ((vis.sel && vis.sel.values) || []).forEach(x => { if (!vals.includes(x)) vals.push(x); });
  return vals.sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }));
};
const baseSlicerR = PBI.prototype.renderers.slicer;
PBI.prototype.renderers.slicer = function (el, v) {
  const f = (v.f.values || [])[0];
  if (v.mode !== 'dropdown' || !f) return baseSlicerR.call(this, el, v);
  const on = (v.sel && v.sel.values) || [];
  el.appendChild(h(`<div class="v-slicer dd"><div class="vs-h"><span>${esc(fr(v.title || f.c))}</span>${on.length ? `<button class="vs-clear" data-a="slclear:${v.id}" aria-label="Effacer les sélections">${ERASER}</button>` : ''}</div><button class="vs-dd" data-a="sldrop:${v.id}"><span>${esc(on.length ? on.join(', ') : 'Tout')}</span>${CHEV}</button></div>`));
};

/* ───────── Volet Visualisations : page, plusieurs objets, objets décoratifs ───────── */
const baseVP = P_.vizPane;
P_.vizPane = function () {
  if (!this.adv2()) return baseVP.call(this);
  const st = this.st, v = this.selVisual(), sv = st.multiMode ? selected(this) : [];
  if (sv.length > 1) {
    const box = h(`<div class="vz"><div class="vz-sub"><b>${sv.length} objets sélectionnés</b></div></div>`);
    box.appendChild(this.geoSection(sv));
    return box;
  }
  if (v && DECO.includes(v.type)) {
    const box = h(`<div class="vz"><div class="vz-sub"><b>${esc({ text: 'Zone de texte', shape: 'Forme', navigator: 'Navigateur de pages', button: 'Bouton' }[v.type])}</b></div></div>`);
    const f = h(`<div class="fmt"></div>`);
    f.appendChild(this.geoSection([v]));
    this.decoFormat(v, f);
    f.appendChild(this.altSection(v));
    box.appendChild(f);
    return box;
  }
  const box = baseVP.call(this);
  if (!v) box.appendChild(this.pageFormat());
  return box;
};
const baseFP = P_.formatPane;
P_.formatPane = function (v) {
  const box = baseFP.call(this, v);
  if (!this.adv2()) return box;
  box.prepend(this.geoSection([v]));
  if (v.type === 'card') row(box, 'Arrière-plan', h(`<button class="sel-box" data-a="decocol:bg"><span class="sw-dot" style="background:${(v.fmt || {}).bg || '#FFFFFF'}"></span>${esc(cname((v.fmt || {}).bg || '#FFFFFF'))}</button>`));
  box.appendChild(this.altSection(v));
  return box;
};
const row = (box, lab, ctl) => { const r = h(`<div class="fmt-r"><span>${esc(lab)}</span></div>`); r.appendChild(ctl); box.appendChild(r); return r; };
P_.geoSection = function (vs) {
  const pg = this.page(), G = vs.map(v => px(pg, v));
  const box = h(`<div class="fmt geo"><div class="fmt-sec">Taille et position (px)</div><div class="geo-g"></div></div>`);
  const g = $('.geo-g', box);
  [['x', 'X'], ['y', 'Y'], ['w', 'Largeur'], ['h', 'Hauteur']].forEach(([k, lab]) => {
    const same = G.every(o => o[k] === G[0][k]);
    const inp = h(`<label><span>${lab}</span><input class="fmt-in" data-geo="${k}" inputmode="numeric" value="${same ? G[0][k] : ''}" placeholder="${same ? '' : 'Plusieurs'}" spellcheck="false"></label>`);
    const i = $('input', inp);
    i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); i.blur(); } });
    i.addEventListener('change', () => {
      const n = Math.round(Number(String(i.value).replace(/\s/g, '').replace(',', '.')));
      if (!Number.isFinite(n) || i.value.trim() === '') { this.render(); return; }
      if (this.emit('vis.geo', { ids: vs.map(v => v.id), key: k, value: n }) === 'no') { this.render(); return; }
      vs.forEach(v => setPx(pg, v, { [k]: n })); this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'geo', key: k });
    });
    g.appendChild(inp);
  });
  return box;
};
P_.altSection = function (v) {
  const box = h(`<div class="fmt"></div>`);
  row(box, 'Texte de remplacement', h(`<button class="sel-box alt-box" data-a="altpick:${v.id}">${esc(v.alt ? fr(v.alt) : 'Aucun')}</button>`));
  return box;
};
P_.decoFormat = function (v, box) {
  const f = v.fmt || (v.fmt = {});
  const colorBtn = (key, cur) => h(`<button class="sel-box" data-a="decocol:${key}"><span class="sw-dot" style="background:${cur}"></span>${esc(cname(cur))}</button>`);
  if (v.type === 'shape') {
    row(box, 'Remplissage', colorBtn('fill', f.fill || '#118DFF'));
    row(box, 'Contour', h(`<button class="tog ${f.outline !== false ? 'on' : ''}" data-a="decotog:outline" role="switch"><i></i></button>`));
  }
  if (v.type === 'text') {
    const t = h(`<textarea class="fmt-in fmt-ta" data-f="text" rows="2" spellcheck="false" placeholder="Saisis ton texte">${esc(v.text || '')}</textarea>`);
    t.addEventListener('change', () => this.setDeco(v, 'text', t.value.trim()));
    row(box, 'Texte', t);
    row(box, 'Taille (pt)', h(`<button class="sel-box" data-a="decosel:size">${f.size || 12}</button>`));
    row(box, 'Couleur', colorBtn('color', f.color || '#243746'));
    row(box, 'Gras', h(`<button class="tog ${f.bold ? 'on' : ''}" data-a="decotog:bold" role="switch"><i></i></button>`));
  }
  if (v.type === 'navigator') {
    const k = this.st.navState || 'normal', s = (f.states || {})[k] || {}, d = NAV_DEF[k === 'selected' ? 'selected' : 'normal'];
    row(box, 'État', h(`<button class="sel-box" data-a="decosel:state">${esc({ normal: 'Par défaut', hover: 'Pointage', selected: 'Sélectionné', pressed: 'Appuyé' }[k])}</button>`));
    row(box, 'Arrière-plan', colorBtn('navbg', s.bg || d.bg));
    row(box, 'Couleur du texte', colorBtn('navfg', s.fg || d.fg));
  }
};
P_.setDeco = function (v, key, value) {
  if (this.emit('viz.fmt', { vis: v.id, key, value, v }) === 'no') { this.render(); return false; }
  if (key === 'text') v.text = value;
  else if (key === 'navbg' || key === 'navfg') { const k = this.st.navState || 'normal', S = v.fmt.states || (v.fmt.states = {}); S[k] = { ...(S[k] || {}), [key === 'navbg' ? 'bg' : 'fg']: value }; }
  else v.fmt[key] = value;
  this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'fmt', vis: v.id, key, value });
  return true;
};
P_.colorMenu = function (b, cur, title, onPick) {
  this.menu(b, [['x', title]], () => {});
  const m = this._menu; if (!m) return;
  m.innerHTML = ''; m.appendChild(h(`<div class="mh">${esc(title)}</div>`));
  const pal = h(`<div class="pal">${COLORS.map(([c, n]) => `<button data-c="${c}" class="${String(cur).toLowerCase() === c.toLowerCase() ? 'cur' : ''}"><i style="background:${c}"></i><span>${esc(n)}</span><small>${c}</small></button>`).join('')}</div>`);
  m.appendChild(pal); this.applyMarks();
  pal.addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (!c) return; this.closeMenu(); onPick(c.dataset.c); });
};
P_.pageFormat = function () {
  const pg = this.page(); const box = h(`<div class="fmt pg-fmt"><div class="fmt-sec">Format de la page</div></div>`);
  if (!pg) return box;
  const s = SIZE(pg), key = (SIZES.find(z => z[2][0] === s[0] && z[2][1] === s[1]) || SIZES[0])[0];
  row(box, 'Type de canevas', h(`<button class="sel-box" data-a="pgsel:size">${esc((SIZES.find(z => z[0] === key) || SIZES[0])[1])}</button>`));
  const bg = pg.bg || (this.P.theme && this.P.theme.canvas) || '#FFFFFF';
  row(box, 'Arrière-plan', h(`<button class="sel-box" data-a="pgsel:bg"><span class="sw-dot" style="background:${bg}"></span>${esc(cname(bg))}</button>`));
  row(box, 'Transparence', h(`<button class="sel-box" data-a="pgsel:alpha">${pg.alpha || 0} %</button>`));
  row(box, 'Affichage', h(`<button class="sel-box" data-a="pgsel:fit">${esc({ page: 'Ajuster à la page', width: 'Ajuster à la largeur', actual: 'Taille réelle' }[pg.fit || 'page'])}</button>`));
  return box;
};
P_.setPage = function (pg, key, value) {
  if (this.emit('page.fmt', { page: pg.id, key, value }) === 'no') { this.render(); return; }
  if (key === 'size') {
    const [W0, H0] = SIZE(pg), [W, H] = value;
    pg.visuals.forEach(v => { v.x = v.x * W0 / W; v.w = v.w * W0 / W; v.y = v.y * H0 / H; v.h = v.h * H0 / H; });
    pg.size = [W, H];
  } else pg[key] = value;
  this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'page', key });
};

/* ───────── Volet Sélection : couches et ordre de tabulation ───────── */
const vname = v => v.name || v.title || (v.type === 'text' ? (v.text ? fr(v.text) : 'Zone de texte') : v.type === 'shape' ? 'Forme' : v.type === 'navigator' ? 'Navigateur de pages' : (PBI.VNAME[v.type] || 'Visuel'));
PBI.vname = vname;
P_.selPane = function () {
  const pg = this.page(), st = this.st, box = h(`<div class="sp"></div>`);
  if (!pg) return box;
  const tab = st.spTab || 'layers';
  box.appendChild(h(`<div class="vz-sub"><b>Sélection</b><span class="vz-tabs"><button class="${tab === 'layers' ? 'on' : ''}" data-a="sptab:layers">Couches</button><button class="${tab === 'tab' ? 'on' : ''}" data-a="sptab:tab">Tabulation</button></span></div>`));
  if (tab === 'layers') {
    [...pg.visuals].reverse().forEach(v => box.appendChild(h(`<button class="sp-it ${st.selVis === v.id ? 'on' : ''}" data-a="vis:${v.id}"><span>${esc(vname(v))}</span></button>`)));
    return box;
  }
  const skip = pg.tabSkip || [], build = st.tabBuild && st.tabBuild.page === pg.id ? st.tabBuild.ids : null;
  const order = build || (pg.tabOrder || pg.visuals.map(v => v.id)).filter(id => pg.visuals.some(v => v.id === id) && !skip.includes(id));
  box.appendChild(h(`<p class="sp-note">${esc(fr(build ? 'Touche les objets dans l’ordre de lecture.' : 'Ordre suivi par la touche Tab.'))}</p>`));
  box.appendChild(h(`<div class="sp-acts"><button class="sp-btn" data-a="tabbuild:${build ? 'cancel' : 'start'}">${build ? 'Annuler' : 'Réorganiser'}</button></div>`));
  order.forEach((id, i) => { const v = pg.visuals.find(o => o.id === id); if (v) box.appendChild(h(`<div class="sp-it tab"><i>${i + 1}</i><span>${esc(vname(v))}</span><button class="sp-eye" data-a="tabskip:${id}" aria-label="Retirer de l’ordre de tabulation">${EYE}</button></div>`)); });
  pg.visuals.filter(v => !order.includes(v.id)).forEach(v => box.appendChild(h(`<div class="sp-it tab off ${build && !skip.includes(v.id) ? 'pick' : ''}" ${build && !skip.includes(v.id) ? `data-a="tabpick:${v.id}"` : ''}><i>${skip.includes(v.id) ? '–' : '·'}</i><span>${esc(vname(v))}</span><button class="sp-eye ${skip.includes(v.id) ? 'off' : ''}" data-a="tabskip:${v.id}" aria-label="${skip.includes(v.id) ? 'Remettre dans l’ordre de tabulation' : 'Retirer de l’ordre de tabulation'}">${EYE}</button></div>`)));
  return box;
};
const EYE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1.5 8s2.4-4.2 6.5-4.2S14.5 8 14.5 8 12.1 12.2 8 12.2 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>';
const basePanes = P_.panes;
P_.panes = function () {
  const el = basePanes.call(this);
  if (!this.adv2() || this.st.pane !== 'Sélection') return el;
  const tabs = $('.pane-tabs', el), body = $('.pane-body', el);
  $$('.pane-tab', tabs).forEach(t => t.classList.remove('on'));
  tabs.appendChild(h(`<button class="pane-tab on" data-a="pane:Sélection">Sélection</button>`));
  body.innerHTML = ''; body.appendChild(this.selPane());
  return el;
};

/* ───────── Clics ───────── */
const acts = {
  pgsel(k, b) {
    const pg = this.page(); if (!pg) return;
    if (k === 'bg') { this.colorMenu(b, pg.bg || '#FFFFFF', 'Arrière-plan de la page', c => this.setPage(pg, 'bg', c)); return; }
    const items = k === 'size' ? SIZES.map(z => [z[0], z[1]]) : k === 'alpha' ? [['0', '0 %'], ['50', '50 %'], ['100', '100 %']] : [['page', 'Ajuster à la page'], ['width', 'Ajuster à la largeur'], ['actual', 'Taille réelle']];
    this.menu(b, items, v => this.setPage(pg, k, k === 'size' ? SIZES.find(z => z[0] === v)[2] : k === 'alpha' ? +v : v));
  },
  decocol(k, b) { const v = this.selVisual(); if (!v) return; const f = v.fmt || {}, S = (f.states || {})[this.st.navState || 'normal'] || {}; const cur = k === 'navbg' ? S.bg : k === 'navfg' ? S.fg : f[k]; this.colorMenu(b, cur || '', { fill: 'Remplissage', color: 'Couleur du texte', navbg: 'Arrière-plan', navfg: 'Couleur du texte', bg: 'Arrière-plan du visuel' }[k], c => this.setDeco(v, k, c)); },
  decotog(k) { const v = this.selVisual(); if (!v) return; const cur = k === 'outline' ? v.fmt.outline !== false : !!v.fmt[k]; this.setDeco(v, k, !cur); },
  decosel(k, b) {
    const v = this.selVisual(); if (!v) return;
    if (k === 'size') { this.menu(b, [10, 11, 12, 14, 18, 24, 28].map(n => [String(n), n + ' pt', (v.fmt.size || 12) === n]), s => this.setDeco(v, 'size', +s)); return; }
    if (k === 'state') this.menu(b, [['normal', 'Par défaut'], ['hover', 'Pointage'], ['selected', 'Sélectionné'], ['pressed', 'Appuyé']], s => { this.st.navState = s; this.render(); this.emit('pane', 'Visualisations'); });
  },
  altpick(id, b) {
    const pg = this.page(), v = pg.visuals.find(o => o.id === id); if (!v) return;
    const list = this.altChoices ? this.altChoices(v) : [];
    if (!list.length) { shake(b); return; }
    this.menu(b, list.map((t, i) => [String(i), t, t === v.alt]), i => {
      const t = list[+i]; if (this.emit('vis.alt', { vis: id, text: t, v }) === 'no') return;
      v.alt = t; this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'alt', vis: id });
    });
  },
  sptab(k) { this.st.spTab = k; this.render(); this.emit('pane', 'Sélection'); },
  navgo(arg, b, e) {
    if (e) e.stopPropagation();
    const [vid, pid] = arg.split('|'), P = this.P;
    if (!P.pages.some(p => p.id === pid)) return;
    if (this.emit('nav.page', { vis: vid, page: pid, from: P.activePage }) === 'no') { shake(b); return; }
    if (pid !== P.activePage) { P.activePage = pid; this.st.selVis = null; this.st.xsel = null; this.st.multi = []; }
    this.render();
  },
  sldrop(id, b) {
    const pg = this.page(), vis = pg.visuals.find(v => v.id === id); if (!vis) return;
    const vals = this.slicerValues ? this.slicerValues(vis) : [], on = (vis.sel && vis.sel.values) || [];
    if (this.emit('visual', id) === 'no') { shake(b); return; }
    this.st.selVis = id;
    this.menu(b, [String(vis.title || 'Segment')].concat(vals.map(x => [String(x), String(x), on.includes(x)])), k => this.extraClick('slpick', id + '|' + k, b, { stopPropagation() {} }));
  },
  tabbuild(k) {
    const pg = this.page();
    if (k === 'cancel') { this.st.tabBuild = null; this.render(); this.emit('pane', 'Sélection'); return; }
    if (this.emit('tab.start', { page: pg.id }) === 'no') return;
    this.st.tabBuild = { page: pg.id, ids: [] }; this.render();
  },
  tabpick(id, b) {
    const pg = this.page(), tb = this.st.tabBuild; if (!tb || tb.page !== pg.id) return;
    if (this.emit('tab.pick', { page: pg.id, vis: id, pos: tb.ids.length + 1, ids: tb.ids.concat(id) }) === 'no') { shake(b); return; }
    tb.ids.push(id);
    const left = pg.visuals.filter(v => !tb.ids.includes(v.id) && !(pg.tabSkip || []).includes(v.id));
    if (!left.length) {
      const order = tb.ids.slice();
      if (this.emit('tab.order', { page: pg.id, order }) === 'no') { tb.ids = []; this.render(); return; }
      pg.tabOrder = order; this.st.tabBuild = null; this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'tab' }); return;
    }
    this.render();
  },
  tabskip(id, b) {
    const pg = this.page(), skip = pg.tabSkip || (pg.tabSkip = []), on = !skip.includes(id);
    if (this.emit('tab.skip', { page: pg.id, vis: id, skip: on }) === 'no') { shake(b); return; }
    if (on) skip.push(id); else skip.splice(skip.indexOf(id), 1);
    if (this.st.tabBuild) this.st.tabBuild.ids = this.st.tabBuild.ids.filter(x => x !== id);
    if (pg.tabOrder) pg.tabOrder = pg.tabOrder.filter(x => x !== id);
    this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'tab' });
  }
};
const baseClick = P_.extraClick;
P_.extraClick = function (a, v, b, e) {
  if (acts[a] && this.adv2()) return acts[a].call(this, v, b, e);
  return baseClick.call(this, a, v, b, e);
};
PBI.SIZES = SIZES;
})();

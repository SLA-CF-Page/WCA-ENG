/* main.js — 路由 / 多语言 / 实时刷新 */
import { telemetry, transit, dateStr } from './sim.js';
import { eraTime, snapshot as eraSnapshot, bannerHTML, modalHTML, ERA } from './era2047.js';
import { render, fmt, cd } from './pages.js';

const I18N = {
  zh: {
    'top.link': '链路', 'top.endurance': '自持', 'top.mode': '模式',
    'nav.overview': '总览', 'nav.axis': '世界之轴', 'nav.crown': '世界树之冠',
    'nav.transport': '运输计划', 'nav.maintenance': '维护计划', 'nav.events': '事件与告警', 'nav.about': '关于',
    'nav.unit': '工程与运维局', 'foot.fic': '本站为虚构世界观设定产物'
  },
  en: {
    'top.link': 'LINK', 'top.endurance': 'ENDUR', 'top.mode': 'MODE',
    'nav.overview': 'Overview', 'nav.axis': 'World Axis', 'nav.crown': 'World Tree Crown',
    'nav.transport': 'Transport', 'nav.maintenance': 'Maintenance', 'nav.events': 'Events', 'nav.about': 'About',
    'nav.unit': 'Engineering & Operations', 'foot.fic': 'Fictional-world artefact'
  }
};

const state = {
  lang: localStorage.getItem('eng-lang') || 'zh',
  t: eraTime(),
  delta: 0,
  data: null,
  path: '/',
  mapSpeed: 600,
  axisOrient: localStorage.getItem('eng-axis-orient') || 'v',
  mapSim: eraTime(),
  mapReal: Date.now()
};

const mapTime = () => state.mapSim + (Date.now() - state.mapReal) * state.mapSpeed;
function setSpeed(v) {
  if (v === state.mapSpeed) return;
  state.mapSim = mapTime();
  state.mapReal = Date.now();
  state.mapSpeed = v;
  document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', Number(b.dataset.speed) === v));
  const el = document.getElementById('map-speed');
  if (el) el.textContent = '×' + v;
}
const hms = (ms) => {
  const d = new Date(ms), p = n => String(n).padStart(2, '0');
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
};

const app = {
  get lang() { return state.lang; },
  L(zh, en) { return state.lang === 'zh' ? zh : en; },
  tr(key) { return (I18N[state.lang] || I18N.zh)[key] || key; },
  get t() { return state.t; },
  get data() { return state.data; },
  at(ms) { return telemetry(ms); },
  go(href) { location.hash = href; },
  get mapSpeed() { return state.mapSpeed; },
  get axisOrient() { return state.axisOrient; }
};

const main = document.getElementById('main');
const nav = document.getElementById('nav');

function parsePath() {
  const raw = (location.hash || '#/').slice(1);
  let p = raw.split('?')[0] || '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p;
}

function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = app.tr(el.getAttribute('data-i18n'));
    if (v) el.textContent = v;
  });
  document.documentElement.lang = state.lang === 'en' ? 'en' : 'zh';
}

function updateClock() {
  const d = new Date(state.t);
  const pad = n => String(n).padStart(2, '0');
  const hms = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  document.getElementById('clock').textContent = hms;
  document.getElementById('clock-date').textContent = `${dateStr(state.t)} UTC · 2047`;
  const ec = document.getElementById('era-clock');
  if (ec) ec.textContent = `${dateStr(state.t)} ${hms} UTC`;
}

const get = (o, path) => path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);

function paint() {
  const d = state.data;
  if (!d) return;
  document.querySelectorAll('[data-k]').forEach(el => {
    const v = get(d, el.dataset.k);
    if (v != null) el.textContent = fmt(v, el.dataset.f || '');
  });
  document.querySelectorAll('[data-w]').forEach(el => {
    const v = get(d, el.dataset.w);
    const max = Number(el.dataset.max) || 100;
    if (v != null) el.style.width = Math.max(0, Math.min(100, v / max * 100)) + '%';
  });
  document.querySelectorAll('[data-tag]').forEach(el => {
    const st = get(d, el.dataset.tag);
    if (st == null) return;
    const kind = st === 'warn' ? 'warn' : st === 'maint' ? 'cy' : 'ok';
    el.className = 'tag ' + kind;
    el.textContent = st === 'warn' ? app.L('注意', 'ADVISORY') : st === 'maint' ? app.L('维护', 'MAINT') : app.L('正常', 'NOMINAL');
  });
  if (Array.isArray(d.transit)) {
    document.querySelectorAll('[data-car-km]').forEach(el => {
      const c = d.transit.find(x => x.id === el.dataset.carKm);
      if (c) el.textContent = Math.round(c.km).toLocaleString('en-US');
    });
    document.querySelectorAll('[data-car-eta]').forEach(el => {
      const c = d.transit.find(x => x.id === el.dataset.carEta);
      if (c && c.state !== 'holding') el.textContent = cd(c.arrive - d.t);
    });
  }
  const layer = document.getElementById('axis-cars');
  if (layer) {
    const mt = mapTime();
    const cars = ERA === '2047' ? d.transit : transit(mt);
    const horiz = state.axisOrient === 'h';
    layer.innerHTML = cars.map(c => {
      const p = Math.max(0, Math.min(100, c.km / 39986 * 100));
      const up = c.dir === 'up';
      const pos = horiz
        ? `left:${p}%;top:calc(50% ${up ? '-' : '+'} 8px)`
        : `bottom:${p}%;left:calc(50% ${up ? '-' : '+'} 7px)`;
      return `<div class="axis-car" style="${pos};background:${up ? 'var(--cyan)' : 'var(--amber)'};box-shadow:0 0 8px ${up ? 'rgba(53,224,208,.8)' : 'rgba(255,180,84,.8)'}"></div>`;
    }).join('');
    const mc = document.getElementById('map-clock');
    if (mc) mc.textContent = hms(mt);
  }
}

document.addEventListener('click', (e) => {
  const sp = e.target.closest('[data-speed]');
  if (sp) { setSpeed(Number(sp.dataset.speed)); return; }
  const or = e.target.closest('[data-orient]');
  if (or) {
    state.axisOrient = or.dataset.orient;
    localStorage.setItem('eng-axis-orient', state.axisOrient);
    renderRoute(true);
    return;
  }
  const fs = e.target.closest('[data-fs]');
  if (fs) {
    const p = fs.closest('.panel');
    const isFull = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFull) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    else (p?.requestFullscreen || p?.webkitRequestFullscreen)?.call(p);
  }
});

function renderRoute(keepScroll) {
  const y = keepScroll ? main.scrollTop : 0;
  const path = parsePath();
  state.path = path;
  state.t = eraTime();
  state.data = eraSnapshot(state.t);

  main.innerHTML = render(app, path);
  main.scrollTop = y;

  nav.querySelectorAll('a[data-route]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-route') === path);
  });

  applyStaticI18n();
  updateClock();
  paint();

  const titles = {
    '/': ['运行总览', 'Operations Overview'], '/axis': ['世界之轴', 'World Axis'],
    '/crown': ['世界树之冠', 'World Tree Crown'], '/transport': ['运输计划', 'Transport Plan'],
    '/maintenance': ['维护计划', 'Maintenance Plan'], '/events': ['事件与告警', 'Events & Alerts'],
    '/about': ['关于本站', 'About']
  };
  const pair = titles[path] || titles['/'];
  const title = app.L(pair[0], pair[1]);
  document.title = `${title} · 冠轴运行中心 · 2047 应急`;
}

/* ---------- 2047 应急界面 ---------- */
function mountEraUI() {
  document.body.classList.add('era-alert');
  document.getElementById('era-banner')?.remove();
  document.getElementById('era-modal')?.remove();
  document.body.insertAdjacentHTML('afterbegin', bannerHTML(state.lang));
  document.body.insertAdjacentHTML('beforeend', modalHTML(state.lang));

  const modal = document.getElementById('era-modal');
  if (modal && !sessionStorage.getItem('era-ack') && !location.search.includes('ack=1')) modal.hidden = false;
  modal?.querySelector('[data-ack]')?.addEventListener('click', () => {
    sessionStorage.setItem('era-ack', '1');
    modal.hidden = true;
  });
  modal?.querySelector('[data-close]')?.addEventListener('click', () => { modal.hidden = true; });
  document.querySelector('[data-order]')?.addEventListener('click', () => { modal.hidden = false; });

  const endur = document.getElementById('top-endurance');
  const mode = document.getElementById('top-mode');
  const link = document.getElementById('top-link');
  if (link) link.textContent = 'DEGRADED';
  if (endur) endur.textContent = '72h';
  if (mode) mode.textContent = 'ALERT';
  document.querySelectorAll('.topstat .led').forEach(l => { l.className = 'led bad'; });
}

/* ---------- 启动 ---------- */
document.getElementById('lang-btn')?.addEventListener('click', () => {
  state.lang = state.lang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('eng-lang', state.lang);
  renderRoute(true);
  mountEraUI();
  updateClock();
});

window.addEventListener('hashchange', () => renderRoute(false));

function boot() {
  const qs = new URLSearchParams(location.search);
  const o = qs.get('axis');
  if (o === 'h' || o === 'v') state.axisOrient = o;
  const q = Number(qs.get('spd'));
  if ([1, 60, 600, 3600].includes(q)) {
    state.mapSpeed = q;
    state.mapSim = Date.now() + state.delta;
    state.mapReal = Date.now();
  }
  renderRoute(false);
  mountEraUI();
  updateClock();
  setInterval(() => {
    state.t = eraTime();
    state.data = eraSnapshot(state.t);
    updateClock();
    paint();
  }, 1000);
  // 表格 / 图表每 15 秒重建一次
  setInterval(() => renderRoute(true), 15000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderRoute(true);
  });
}

boot();

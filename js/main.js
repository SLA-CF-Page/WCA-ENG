/* main.js — 路由 / 多语言 / 实时刷新 */
import { snapshot, telemetry, fictionDelta, dateStr } from './sim.js';
import { render, fmt, cd } from './pages.js';

const I18N = {
  zh: {
    'top.link': '链路', 'top.eios': 'EIOS', 'top.mode': '模式',
    'nav.overview': '总览', 'nav.axis': '世界之轴', 'nav.crown': '世界树之冠',
    'nav.transport': '运输计划', 'nav.maintenance': '维护计划', 'nav.events': '事件与告警', 'nav.about': '关于',
    'nav.unit': '工程与运维局', 'foot.fic': '本站为虚构世界观设定产物'
  },
  en: {
    'top.link': 'LINK', 'top.eios': 'EIOS', 'top.mode': 'MODE',
    'nav.overview': 'Overview', 'nav.axis': 'World Axis', 'nav.crown': 'World Tree Crown',
    'nav.transport': 'Transport', 'nav.maintenance': 'Maintenance', 'nav.events': 'Events', 'nav.about': 'About',
    'nav.unit': 'Engineering & Operations', 'foot.fic': 'Fictional-world artefact'
  }
};

const state = {
  lang: localStorage.getItem('eng-lang') || 'zh',
  t: Date.now() + fictionDelta(),
  delta: fictionDelta(),
  data: null,
  path: '/'
};

const app = {
  get lang() { return state.lang; },
  L(zh, en) { return state.lang === 'zh' ? zh : en; },
  tr(key) { return (I18N[state.lang] || I18N.zh)[key] || key; },
  get t() { return state.t; },
  get data() { return state.data; },
  at(ms) { return telemetry(ms); },
  go(href) { location.hash = href; }
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
  document.getElementById('clock').textContent =
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  document.getElementById('clock-date').textContent =
    `${dateStr(state.t)} UTC`;
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
      if (c) el.textContent = cd(c.arrive - d.t);
    });
  }
  const layer = document.getElementById('axis-cars');
  if (layer && Array.isArray(d.transit)) {
    layer.innerHTML = d.transit.map(c => {
      const p = Math.max(0, Math.min(100, c.km / 39986 * 100));
      const up = c.dir === 'up';
      return `<div class="axis-car" style="bottom:${p}%;background:${up ? 'var(--cyan)' : 'var(--amber)'};box-shadow:0 0 8px ${up ? 'rgba(53,224,208,.8)' : 'rgba(255,180,84,.8)'}"></div>`;
    }).join('');
  }
}

function renderRoute(keepScroll) {
  const y = keepScroll ? main.scrollTop : 0;
  const path = parsePath();
  state.path = path;
  state.t = Date.now() + state.delta;
  state.data = snapshot(state.t);

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
  document.title = `${title} · 冠轴运行中心`;
}

/* ---------- 跨终端一致：服务端授时 ---------- */
async function syncTime() {
  try {
    const res = await fetch('api/telemetry', { cache: 'no-store' });
    if (!res.ok) return;
    const j = await res.json();
    if (j && typeof j.fictionNow === 'number' && typeof j.now === 'number') {
      state.delta = j.fictionNow - j.now;
      state.t = Date.now() + state.delta;
    }
  } catch { /* 离线：使用本地 2051 偏移 */ }
}

/* ---------- 启动 ---------- */
document.getElementById('lang-btn')?.addEventListener('click', () => {
  state.lang = state.lang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('eng-lang', state.lang);
  renderRoute(true);
});

window.addEventListener('hashchange', () => renderRoute(false));

function boot() {
  renderRoute(false);
  updateClock();
  setInterval(() => {
    state.t = Date.now() + state.delta;
    state.data = snapshot(state.t);
    updateClock();
    paint();
  }, 1000);
  // 表格 / 图表每 15 秒重建一次
  setInterval(() => renderRoute(true), 15000);
  syncTime();
  setInterval(syncTime, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { syncTime(); renderRoute(true); }
  });
}

boot();

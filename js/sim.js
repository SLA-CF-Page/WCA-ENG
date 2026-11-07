/* sim.js — 确定性运行模拟内核
   同一时刻的所有访客得到同一组数据；数值随真实时间平滑变化，无随机跳变。 */

export const CANON = {
  axisKm: 35786,
  counterKm: 4200,
  totalKm: 39986,
  speedPax: 1200,
  speedFreight: 600,
  hoursPax: 30,
  hoursFreight: 60,
  capUp: 800,
  capDown: 600,
  capPax: 500,
  axisPower: 500,
  crownPower: 500,
  reactors: 5,
  reactorMW: 120,
  population: 52000,
  waterReserve: 20000,
  nodes: 8,
  massAxis: 8000,
  massCrown: 320
};

const DAY = 86400000;
const H = 3600000;
const TAU = Math.PI * 2;

/* 现实时间 → 2051 年同一月日时刻 */
export function fictionDelta(now = Date.now()) {
  const d = new Date(now);
  const f = new Date(now);
  f.setFullYear(d.getFullYear() + 25);
  return f.getTime() - now;
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const w = (t, periodH, phase) => Math.sin((t / (periodH * H) + phase) * TAU);
const mix = (t, base, amp, p1, p2, ph1, ph2) =>
  base + amp * (0.62 * w(t, p1, ph1) + 0.38 * w(t, p2, ph2));

function hash(n) {
  n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4);
  n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967296;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const dayStart = (t) => Math.floor(t / DAY) * DAY;

/* ---------- 连续遥测 ---------- */
function rates(t) {
  return {
    up: clamp(mix(t, 33.3, 6.4, 7.3, 2.1, 0.12, 0.61), 18, 44),
    down: clamp(mix(t, 25.0, 6.0, 8.7, 2.7, 0.47, 0.19), 12, 36),
    pax: clamp(mix(t, 16.5, 5.2, 6.1, 1.7, 0.33, 0.72), 6, 28)
  };
}

export function todayTotals(t) {
  const start = dayStart(t);
  let up = 0, down = 0, pax = 0;
  const step = 20 * 60000;
  for (let s = start; s < t; s += step) {
    const r = rates(s + step / 2);
    const f = Math.min(step, t - s) / H;
    up += r.up * f; down += r.down * f; pax += r.pax * f;
  }
  return { up, down, pax };
}

export function telemetry(t) {
  const r = rates(t);
  const axisPower = mix(t, 438, 46, 5.7, 1.3, 0.21, 0.84);
  const crownPower = mix(t, 436, 34, 9.1, 2.3, 0.66, 0.27);
  const reactorOn = 4;
  const reactorMW = reactorOn * CANON.reactorMW * mix(t, 0.965, 0.025, 3.3, 1.1, 0.4, 0.9);
  const waterCycle = ((t % (7 * DAY)) / (7 * DAY));
  const water = 19960 - waterCycle * 640;
  const pop = Math.round(mix(t, 51980, 95, 11, 3.7, 0.5, 0.2));
  const tt = todayTotals(t);
  return {
    t,
    rates: r,
    axisPower, crownPower, reactorOn, reactorMW,
    totalPower: axisPower + crownPower,
    groundSupply: Math.max(0, axisPower + crownPower - reactorMW),
    upRate: r.up, downRate: r.down,
    upToday: tt.up, downToday: tt.down, paxToday: tt.pax,
    tension: mix(t, 99.05, 0.55, 13, 4.1, 0.35, 0.77),
    availability: clamp(mix(t, 99.55, 0.35, 17, 5.3, 0.2, 0.6), 98.9, 99.99),
    tempGround: mix(t, 30, 4, 6, 2, 0.1, 0.5),
    tempMid: mix(t, -12, 6, 8, 2.5, 0.3, 0.7),
    tempHigh: mix(t, -52, 7, 10, 3, 0.6, 0.4),
    water, waterPct: water / CANON.waterReserve * 100,
    food: clamp(mix(t, 65.4, 2.1, 19, 6.2, 0.44, 0.13), 60, 70),
    pop,
    o2: mix(t, 20.9, 0.12, 5, 1.6, 0.2, 0.8),
    cabinTemp: mix(t, 22, 0.9, 4, 1.2, 0.7, 0.3),
    humidity: mix(t, 45, 4, 7, 2.2, 0.9, 0.5),
    delay: clamp(mix(t, 0.8, 1.2, 5.5, 1.9, 0.2, 0.6), 0, 4.5),
    queue: Math.max(0, Math.round(mix(t, 3, 4, 4.4, 1.4, 0.1, 0.8)))
  };
}

/* ---------- 班次与在途 ---------- */
const DEP = {
  paxUp: [6, 18], paxDown: [8, 20],
  frUp: [0, 6, 12, 18], frDown: [3, 9, 15, 21]
};
const pad = (n) => String(n).padStart(2, '0');
export const hhmm = (ms) => { const d = new Date(ms); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
export const dateStr = (ms) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };

export function departures(t) {
  const out = [];
  const d0 = dayStart(t);
  for (let day = -2; day <= 1; day++) {
    const base = d0 + day * DAY;
    const push = (type, dir, hour, cars, cap) => {
      for (let i = 0; i < cars; i++) {
        const dep = base + hour * H;
        const dur = (type === 'pax' ? CANON.hoursPax : CANON.hoursFreight) * H;
        const arrive = dep + dur;
        const prog = (t - dep) / dur;
        if (prog > -0.05 && prog < 1.05) {
          const load = type === 'pax' ? 42 + i * 6 : 18 + i * 4;
          out.push({
            id: `${type === 'pax' ? 'P' : 'F'}-${dir === 'up' ? 'U' : 'D'}-${pad(hour)}${i + 1}`,
            type, dir, dep, arrive, dur, prog, cap, load,
            km: dir === 'up' ? Math.max(0, Math.min(1, prog)) * CANON.axisKm : (1 - Math.max(0, Math.min(1, prog))) * CANON.axisKm,
            state: prog < 0 ? 'boarding' : prog >= 1 ? 'arrived' : 'transit'
          });
        }
      }
    };
    push('pax', 'up', DEP.paxUp[0], 3, 50);
    push('pax', 'down', DEP.paxDown[0], 3, 50);
    for (const h of DEP.frUp) push('fr', 'up', h, 2, 20);
    for (const h of DEP.frDown) push('fr', 'down', h, 2, 20);
  }
  return out.sort((a, b) => a.dep - b.dep);
}

/* 在途：按周转池生成，数量受在役舱数约束（客运 12 / 货运 24） */
export function transit(t) {
  const out = [];
  const paxN = 8 + Math.round(1.5 * w(t, 3.1, 0.2) + 1.5);
  const frN = 16 + Math.round(3 * w(t, 4.3, 0.7));
  const mk = (type, i, n, dir) => {
    const dur = (type === 'pax' ? CANON.hoursPax : CANON.hoursFreight) * H;
    const ph = hash(i * 97 + (type === 'pax' ? 11 : 53));
    const prog = ((t / dur) + ph) % 1;
    const dep = t - prog * dur;
    return {
      id: `${type === 'pax' ? 'P' : 'F'}-${dir === 'up' ? 'U' : 'D'}-${String(i + 1).padStart(2, '0')}`,
      type, dir, prog, dep, arrive: dep + dur, dur,
      km: dir === 'up' ? prog * CANON.axisKm : (1 - prog) * CANON.axisKm,
      cap: type === 'pax' ? 50 : 20,
      load: type === 'pax' ? 42 + Math.round(hash(i * 31 + 7) * 34) : 18 + Math.round(hash(i * 29 + 5) * 20),
      state: 'transit'
    };
  };
  for (let i = 0; i < paxN; i++) out.push(mk('pax', i, paxN, i % 2 === 0 ? 'up' : 'down'));
  for (let i = 0; i < frN; i++) out.push(mk('fr', i, frN, i % 2 === 0 ? 'up' : 'down'));
  return out.sort((a, b) => b.prog - a.prog);
}

export function nextDepartures(t, n = 8) {
  const d0 = dayStart(t);
  const out = [];
  for (let day = 0; day <= 1; day++) {
    const base = d0 + day * DAY;
    const add = (type, dir, hour, cars) => {
      const dep = base + hour * H;
      if (dep > t) out.push({ type, dir, dep, cap: type === 'pax' ? 50 : 20, pods: cars, id: `${type === 'pax' ? 'P' : 'F'}-${dir === 'up' ? 'U' : 'D'}-${pad(hour)}` });
    };
    add('pax', 'up', DEP.paxUp[0], 3); add('pax', 'down', DEP.paxDown[0], 3);
    DEP.frUp.forEach(h => add('fr', 'up', h, 2));
    DEP.frDown.forEach(h => add('fr', 'down', h, 2));
  }
  return out.sort((a, b) => a.dep - b.dep).slice(0, n);
}

/* ---------- 事件 ---------- */
const EV = [
  ['A级巡检完成', 'Level-A inspection completed', 'ok'],
  ['中继节点 04 链路切换测试', 'Relay node 04 link switch test', 'ok'],
  ['攀爬舱制动系统例行校验', 'Climber brake system check', 'ok'],
  ['轨道碎片预警窗口', 'Orbital debris advisory window', 'warn'],
  ['索系张力微幅波动', 'Minor tether tension fluctuation', 'warn'],
  ['地面站电力负载调整', 'Ground station load adjustment', 'ok'],
  ['货运舱温控偏差已修正', 'Freight pod thermal deviation corrected', 'ok'],
  ['微陨石撞击传感器触发', 'Micrometeoroid sensor trigger', 'warn'],
  ['EIOS 季度切换演练', 'EIOS quarterly switch drill', 'ok'],
  ['客运班次因配载顺延', 'Passenger departure delayed for load balancing', 'warn']
];

export function events(t) {
  const list = [];
  for (const d0 of [dayStart(t) - DAY, dayStart(t)]) {
    const r = rng(Math.floor(d0 / DAY) * 2654435761 % 4294967296);
    const n = 6 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const e = EV[Math.floor(r() * EV.length)];
      list.push({
        t: d0 + Math.floor(r() * 24) * H + Math.floor(r() * 60) * 60000,
        zh: e[0], en: e[1], sev: e[2],
        id: `LOG-${String(i + 1).padStart(3, '0')}-${new Date(d0).getUTCDate()}`
      });
    }
    list.push({ t: d0 + 6 * H, zh: '世界之轴 A 级巡检完成', en: 'World Axis level-A inspection completed', sev: 'ok', id: `LOG-000-${new Date(d0).getUTCDate()}` });
  }
  return list.filter(e => e.t <= t && e.t > t - DAY).sort((a, b) => b.t - a.t);
}

/* ---------- 维护 ---------- */
const F_YEARS = [1988, 1993, 1998, 2003, 2008, 2013, 2018, 2023, 2028, 2033, 2038, 2043, 2048, 2053];
export function maintenance(t) {
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const nextF = F_YEARS.find(v => v > y) || 2053;
  const fDate = Date.UTC(nextF, 2, 1);
  const daysToF = Math.ceil((fDate - t) / DAY);
  const due = [
    { k: 'A', zh: '每日巡检', en: 'Daily inspection', cycle: '24H', next: dayStart(t) + DAY },
    { k: 'B', zh: '每周切换测试', en: 'Weekly switch test', cycle: '7D', next: dayStart(t) + DAY * 2 },
    { k: 'C', zh: '月度系统诊断', en: 'Monthly diagnostics', cycle: '30D', next: Date.UTC(y, d.getUTCMonth() + 1, 1) },
    { k: 'D', zh: '季度大修', en: 'Quarterly overhaul', cycle: '90D', next: Date.UTC(y, Math.floor(d.getUTCMonth() / 3) * 3 + 3, 1) },
    { k: 'E', zh: '年度全段大修', en: 'Annual full overhaul', cycle: '365D', next: Date.UTC(y + 1, 2, 1) },
    { k: 'F', zh: '五年深度大修', en: 'Five-year deep overhaul', cycle: '5Y', next: fDate }
  ];
  const r = rng(Math.floor(dayStart(t) / DAY) * 40503 % 4294967296);
  const systems = ['主索张力锚定', '攀爬轨道 02', '中继节点 06', '对接端口密封', '散热板阵列', '钍基熔盐堆 03', '水循环核心', '货运分拣中心'];
  const orders = Array.from({ length: 6 }, (_, i) => {
    const st = r();
    return {
      id: `WO-${y}-${String(100 + Math.floor(r() * 800))}`,
      sys: systems[Math.floor(r() * systems.length)],
      due: t + (Math.floor(r() * 72) - 12) * H,
      state: st < 0.32 ? 'active' : st < 0.62 ? 'queued' : 'done',
      crew: 2 + Math.floor(r() * 6)
    };
  }).sort((a, b) => a.due - b.due);
  return { due, daysToF, nextF, orders, robots: { total: 200, active: 150 + Math.floor(r() * 38) } };
}

/* ---------- 环段 ---------- */
export function rings(t) {
  const base = [
    { zh: '行政环', en: 'Administration', pop: 8000, load: 0.62 },
    { zh: '教育环', en: 'Education', pop: 15000, load: 0.78 },
    { zh: '医疗环', en: 'Medical', pop: 6000, load: 0.56 },
    { zh: '居住环', en: 'Habitation', pop: 18000, load: 0.71 },
    { zh: '工业环', en: 'Industrial', pop: 5000, load: 0.48 }
  ];
  return base.map((r, i) => ({
    ...r,
    load: clamp(r.load + 0.06 * w(t, 5 + i, i * 0.17), 0.2, 0.96)
  }));
}

export function snapshot(t) {
  return { ...telemetry(t), transit: transit(t), next: nextDepartures(t), events: events(t), maint: maintenance(t), rings: rings(t) };
}

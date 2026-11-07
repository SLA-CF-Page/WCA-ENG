/* era2047.js — 2047-09-12 安第斯地震应急态
 * 本分支专用：冻结在 2047 年地震窗口，EIOS 尚未部署。 */

import { snapshot as baseSnapshot } from './sim.js';

export const ERA = '2047';
const QUAKE = Date.UTC(2047, 8, 12, 2, 47, 0);   // 地震时刻
const START = Date.UTC(2047, 8, 12, 10, 30, 0); // 视图锚点：停运确认后
const WINDOW = 30 * 60000;                      // 10:30–11:00 震后窗口

export function eraTime(now = Date.now()) { return START + (now % WINDOW); }

const EVENTS = [
  [0, '安第斯地面站东南 85 km 发生 Mw7.9 地震', 'Mw7.9 earthquake 85 km SE of the Andes ground station', 'crit'],
  [5 * 60000, '会长令第2047-09号：最高等级应急状态', 'Presidential Order 2047-09: maximum emergency', 'crit'],
  [13 * 60000, '中央办公厅启动全员唤醒', 'CCO activates all-staff recall', 'ok'],
  [30 * 60000, '内阁与中央六部全员抵达中央控制塔', 'Cabinet and six ministries assemble at Central Control', 'ok'],
  [83 * 60000, '紧急侦察队登舱下行', 'Recon team boards for descent', 'ok'],
  [163 * 60000, '地面站应急通信恢复', 'Ground station emergency comms restored', 'ok'],
  [313 * 60000, '地面站应急修复专项启动', 'Ground station emergency repair task force launched', 'ok'],
  [373 * 60000, '中央医疗总部医疗队登舱', 'Central Medical HQ team boards', 'ok'],
  [420 * 60000, '中继塔 3–7 层结构评估：严重受损', 'Relay tower floors 3–7: severe damage', 'warn'],
  [463 * 60000, '世界之轴确认停运，上行运力归零', 'World Axis confirmed halted; upbound capacity zero', 'crit']
];

const ORDER_ZH = {
  title: '最高等级应急通告',
  meta: '会长令第 2047-09 号 · 内阁常会 / 最高军事统筹委员会联合命令',
  body: [
    '二〇四七年九月十二日二时四十七分（UTC），世界之轴地面站东南约八十五公里处发生 Mw7.9 地震，震源深度约十二公里。地面站锚定塔基座开裂，中继塔三层至七层承重结构受损，常规通信中断，世界之轴停运。',
    '空间站已切换自载钍基熔盐堆，当前仅能维持约 32% 负载，自持能力约 72 小时。协会尚无应急独立运行系统（EIOS）。',
    '经内阁常会与最高军事统筹委员会联合决定，自即日起进入最高等级应急状态：'
  ],
  items: [
    '站内无关人员立即撤离至指定安全区，服从疏散引导，不得返回作业区。',
    '全体会员、工程与运维局、中央医疗总部、世界管理部相关人员立即进入岗位，参加施救、抢修与转运。',
    '世界之轴停运期间，一切上行下行由联合指挥部统一调度，任何人不得擅自启用攀爬舱。',
    '各单位每三十分钟向中央控制塔报告一次；异常情况随时直报。'
  ],
  foot: '本命令自发布之时起生效，至应急状态解除为止。',
  sign: '世界儿童协会会长 沈瑾然',
  date: '二〇四七年九月十二日 · 中央控制塔'
};

const ORDER_EN = {
  title: 'MAXIMUM EMERGENCY NOTICE',
  meta: 'Presidential Order 2047-09 · Joint order of the Cabinet Standing Committee and the Supreme Military Coordination Commission',
  body: [
    'At 02:47 UTC on 12 September 2047, an Mw7.9 earthquake struck about 85 km south-east of the World Axis ground station, at a depth of roughly 12 km. The anchor tower base has cracked, relay tower floors 3–7 are structurally damaged, regular communications are down, and the Axis is halted.',
    'The station has switched to its onboard thorium molten-salt reactors: about 32% load, roughly 72 hours of endurance. The Association has no Emergency Independent Operation System (EIOS).',
    'The Cabinet Standing Committee and the Supreme Military Coordination Commission jointly order a maximum emergency state, effective immediately:'
  ],
  items: [
    'All non-essential personnel evacuate to designated safe zones and follow evacuation guidance. Do not return to work areas.',
    'All members, and the personnel of the Engineering & Operations Bureau, Central Medical HQ and World Management Department, report to posts for rescue, repair and transfer.',
    'While the Axis is halted, all upbound and downbound movement is dispatched solely by the Joint Command. No one may activate a climber independently.',
    'All units report to Central Control every 30 minutes; report anomalies immediately.'
  ],
  foot: 'This order takes effect immediately and remains in force until the emergency is lifted.',
  sign: 'Chair of the World Children Association, Shen Jinran',
  date: '12 September 2047 · Central Control Tower'
};

export function bannerHTML(lang = 'zh') {
  const zh = lang === 'zh';
  const tick = zh
    ? '无关人员立即撤离至安全区 · 会员与相关雇员按岗位就位，参加施救与抢修 · 一切上行下行由联合指挥部统一调度 · 每 30 分钟向中央控制塔报告'
    : 'Non-essential personnel evacuate immediately · Members and designated staff report to posts for rescue and repair · All movement dispatched by Joint Command · Report to Central Control every 30 minutes';
  return `<div id="era-banner" class="era-banner">
    <div class="era-row">
      <span class="era-tag">${zh ? '最高等级应急' : 'MAX EMERGENCY'}</span>
      <b>${zh ? '世界之轴地面站地震 · 世界之轴停运 · 自持仅 72 小时' : 'Andes earthquake · Axis halted · 72 h endurance only'}</b>
      <span class="era-clock" id="era-clock">2047-09-12 02:47 UTC</span>
      <button class="era-btn" data-order>${zh ? '查看命令' : 'View order'}</button>
    </div>
    <div class="era-ticker"><span>${tick}</span></div>
  </div>`;
}

export function modalHTML(lang = 'zh') {
  const o = lang === 'zh' ? ORDER_ZH : ORDER_EN;
  const zh = lang === 'zh';
  return `<div id="era-modal" class="era-modal" hidden>
    <div class="era-back" data-close></div>
    <article class="era-order" role="dialog" aria-modal="true" aria-label="${o.title}">
      <header>
        <div class="era-seal">✦</div>
        <div>
          <div class="era-order-kicker">${zh ? '世界儿童协会 · 中央控制塔' : 'World Children Association · Central Control'}</div>
          <h2>${o.title}</h2>
          <div class="era-order-meta">${o.meta}</div>
        </div>
      </header>
      <div class="era-order-body">
        ${o.body.map(p => `<p>${p}</p>`).join('')}
        <ol>${o.items.map(i => `<li>${i}</li>`).join('')}</ol>
        <p class="era-order-foot">${o.foot}</p>
      </div>
      <footer>
        <div class="era-sign">
          <span>${o.sign}</span>
          <small>${o.date}</small>
        </div>
        <button class="era-ack" data-ack>${zh ? '我已知悉 · 进入' : 'Acknowledged · Enter'}</button>
      </footer>
    </article>
  </div>`;
}

export function snapshot(t) {
  const s = baseSnapshot(t);
  const wave = (p, ph) => Math.sin((t / p + ph) * Math.PI * 2);
  return {
    ...s,
    era: ERA,
    mode: 'EMERGENCY',
    eios: false,
    axisPower: 0,
    crownPower: 158 + 5 * wave(600000, 0.2),
    reactorOn: 2,
    reactorMW: 160,
    groundSupply: 0,
    totalPower: 158 + 5 * wave(600000, 0.2),
    tension: 98.92 + 0.12 * wave(900000, 0.3),
    availability: 71.4 + 0.4 * wave(1200000, 0.6),
    delay: 186 + 6 * wave(1800000, 0.1),
    queue: 14,
    upRate: 0,
    downRate: 0,
    upToday: 92,
    downToday: 70,
    paxToday: 46,
    water: 19700,
    waterPct: 98.5,
    food: 61.2,
    transit: [
      { id: 'P-U-03', type: 'pax', dir: 'up', prog: 0.62, km: 22187, dep: t - 18 * 3600000, arrive: t + 12 * 3600000, dur: 30 * 3600000, cap: 50, load: 47, state: 'holding' },
      { id: 'F-D-07', type: 'fr', dir: 'down', prog: 0.38, km: 22187, dep: t - 22 * 3600000, arrive: t + 38 * 3600000, dur: 60 * 3600000, cap: 20, load: 18, state: 'holding' },
      { id: 'P-D-02', type: 'pax', dir: 'down', prog: 0.14, km: 30776, dep: t - 4 * 3600000, arrive: t + 26 * 3600000, dur: 30 * 3600000, cap: 50, load: 39, state: 'holding' }
    ],
    nodes: s.nodes.map((n, i) => ({
      ...n,
      load: n.load * 0.55,
      lat: n.lat + 2.4,
      temp: n.temp + 1.2,
      cars: i === 5 ? 0 : n.cars,
      state: i === 5 ? 'warn' : i === 2 ? 'maint' : 'ok',
      uptime: i === 5 ? 91.2 : 97.4 - i * 0.2
    })),
    events: EVENTS.map(([off, zh, en, sev], idx) => ({
      t: QUAKE + off, zh, en, sev, id: `LOG-2047-${String(idx + 1).padStart(3, '0')}`
    })).filter(e => e.t <= t + 60000).sort((a, b) => b.t - a.t),
    next: [],
    maint: { ...s.maint, suspended: true },
    rings: s.rings.map(r => ({ ...r, load: r.load * 0.62 }))
  };
}

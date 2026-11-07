/* pages.js — 7 个页面的渲染模板 */
import { CANON, hhmm, dateStr } from './sim.js';
import { chart, legend, ringMap } from './charts.js';

let APP = null;
const L = (zh, en) => APP.L(zh, en);
const T = (zh, en) => L(zh, en);

export function fmt(v, f) {
  if (v == null || Number.isNaN(v)) return '—';
  if (f === 'int') return Math.round(v).toLocaleString('en-US');
  if (f === 't') return Math.round(v).toLocaleString('en-US');
  if (f === '1') return Number(v).toFixed(1);
  if (f === '2') return Number(v).toFixed(2);
  if (f === 'pct') return Number(v).toFixed(1) + '%';
  if (f === '0') return Math.round(v).toLocaleString('en-US');
  return String(v);
}
const K = (k, f = '') => `<b data-k="${k}"${f ? ` data-f="${f}"` : ''}>—</b>`;
const pct = (v, max) => Math.max(0, Math.min(100, v / max * 100));
const panel = (title, body, meta = '', raw = false) =>
  `<section class="panel"><div class="panel-h"><b>${title}</b>${meta ? (raw ? meta : `<span class="tag">${meta}</span>`) : ''}</div><div class="panel-b">${body}</div></section>`;
const kv = (label, val, cls = '') => `<div class="stat-row"><span>${label}</span><b class="${cls}">${val}</b></div>`;
const tag = (txt, c = '') => `<span class="tag ${c}">${txt}</span>`;
export const cd = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
const arr = (dep, hours) => {
  const t = dep + hours * 3600000;
  const cross = Math.floor(t / 86400000) !== Math.floor(dep / 86400000);
  return hhmm(t) + (cross ? '+1' : '');
};

const head = (titleZh, titleEn, subZh, subEn) => `
<div class="page-head">
  <div><h1>${L(titleZh, titleEn)}</h1><div class="sub">${L(subZh, subEn)}</div></div>
  <div class="stamp">NODE <b>EOB-01</b> · ${dateStr(APP.t)}<br>${hhmm(APP.t)} UTC · WCA-ENG-2051</div>
</div>`;

const hist = (fn, mins = 60, step = 1) => {
  const a = [];
  for (let i = mins; i >= 0; i -= step) a.push(fn(APP.at(APP.t - i * 60000)));
  return a;
};

/* ================= 总览 ================= */
function overview() {
  const d = APP.data;
  return head('运行总览', 'Operations Overview',
    '世界之轴与世界树之冠的实时态势。数据由确定性模拟生成，同一时刻所有终端一致。',
    'Live status of the Axis and the Crown. Deterministic simulation, identical across all terminals.') + `
  <div class="grid g4">
    ${panel(T('今日上行','Upbound today'), `<div class="kpi cy"><div class="k-label"><span>UP · TONNES</span><span>${T('上限','cap')} ${CANON.capUp}</span></div><div class="k-val">${K('upToday','t')}<small>t</small></div><div class="bar"><i data-w="upToday" data-max="${CANON.capUp}"></i></div></div>`, 'LIVE')}
    ${panel(T('今日下行','Downbound today'), `<div class="kpi am"><div class="k-label"><span>DOWN · TONNES</span><span>${T('上限','cap')} ${CANON.capDown}</span></div><div class="k-val">${K('downToday','t')}<small>t</small></div><div class="bar am"><i data-w="downToday" data-max="${CANON.capDown}"></i></div></div>`, 'LIVE')}
    ${panel(T('在途攀爬舱','Climbers in transit'), `<div class="kpi"><div class="k-label"><span>IN TRANSIT</span><span>${T('全程','30h/60h')}</span></div><div class="k-val">${K('transit.length','int')}<small>${T('舱','pods')}</small></div><div class="k-foot"><span>${T('客运 30h','Pax 30h')}</span><span>${T('货运 60h','Freight 60h')}</span></div></div>`, '')}
    ${panel(T('系统总功耗','Total power draw'), `<div class="kpi bl"><div class="k-label"><span>POWER · MW</span><span>${T('含站体','incl. station')}</span></div><div class="k-val">${K('totalPower','0')}<small>MW</small></div><div class="bar"><i data-w="totalPower" data-max="1000"></i></div></div>`, 'GRID')}
  </div>

  <div class="grid g-2-1" style="margin-top:14px">
    ${panel(T('世界之轴 · 状态','World Axis · status'), `
      <div class="stat-list">
        ${kv(T('运行模式','Mode'), tag('NORMAL', 'ok'))}
        ${kv(T('上行速率','Upbound rate'), K('upRate','1') + ' t/h')}
        ${kv(T('下行速率','Downbound rate'), K('downRate','1') + ' t/h')}
        ${kv(T('索系张力','Tether tension'), K('tension','2') + ' %')}
        ${kv(T('系统可用率','Availability'), K('availability','2') + ' %')}
        ${kv(T('平均延误','Avg. delay'), K('delay','1') + ' min')}
      </div>`, 'AX-01')}
    ${panel(T('世界树之冠 · 状态','World Tree Crown · status'), `
      <div class="stat-list">
        ${kv(T('常驻人口','Residents'), K('pop','int'))}
        ${kv(T('自载堆输出','Reactor output'), K('reactorMW','0') + ' MW')}
        ${kv(T('地面传导','Ground feed'), K('groundSupply','0') + ' MW')}
        ${kv(T('水储备','Water reserve'), K('water','int') + ' t')}
        ${kv(T('食品自给','Food self-sufficiency'), K('food','1') + ' %')}
        ${kv(T('EIOS','EIOS'), tag('READY', 'ok'))}
      </div>`, 'CR-01')}
  </div>

  <div class="grid g2" style="margin-top:14px">
    ${panel(T('运力 · 近 60 分钟','Throughput · last 60 min'), `
      ${chart([
        { values: hist(x => x.upRate), color: '#35e0d0', fill: true },
        { values: hist(x => x.downRate), color: '#ffb454' }
      ], { h: 130, min: 30, max: 36 })}
      ${legend([{ label: T('上行 t/h','Up t/h'), color: '#35e0d0' }, { label: T('下行 t/h','Down t/h'), color: '#ffb454' }])}`, 't/h')}
    ${panel(T('功耗 · 近 60 分钟','Power · last 60 min'), `
      ${chart([
        { values: hist(x => x.axisPower), color: '#5aa9ff', fill: true },
        { values: hist(x => x.crownPower), color: '#35e0d0' }
      ], { h: 130, min: 400, max: 470 })}
      ${legend([{ label: T('世界之轴 MW','Axis MW'), color: '#5aa9ff' }, { label: T('树冠 MW','Crown MW'), color: '#35e0d0' }])}`, 'MW')}
  </div>

  <div class="grid g-2-1" style="margin-top:14px">
    ${panel(T('下一批班次','Next departures'), `
      <table class="tbl"><thead><tr><th>ID</th><th>${T('方向','Dir')}</th><th>${T('发车','Dep')}</th><th>${T('到达','Arr')}</th><th>${T('类型','Type')}</th></tr></thead><tbody>
      ${d.next.slice(0, 6).map(c => `<tr>
        <td class="num">${c.id}</td>
        <td>${c.dir === 'up' ? T('上行','UP') : T('下行','DOWN')}</td>
        <td class="num">${hhmm(c.dep)}</td>
        <td class="num">${arr(c.dep, c.type === 'pax' ? 30 : 60)}</td>
        <td>${c.type === 'pax' ? T('客运','Pax') : T('货运','Freight')} · ${c.pods} ${T('舱','pods')}</td></tr>`).join('')}
      </tbody></table>`, 'SCHED')}
    ${panel(T('实时事件','Live events'), `<div class="feed">
      ${d.events.slice(0, 7).map(e => `<div class="feed-item">
        <span class="t">${hhmm(e.t)}</span>
        <i class="led ${e.sev === 'warn' ? 'warn' : 'ok'} dot"></i>
        <div>${L(e.zh, e.en)}<div class="m">${e.id} · ${e.sev === 'warn' ? T('注意','ADVISORY') : T('正常','NOMINAL')}</div></div>
      </div>`).join('')}
    </div>`, 'LOG')}
  </div>`;
}

/* ================= 世界之轴 ================= */
function axis() {
  const d = APP.data;
  const pos = km => Math.max(0, Math.min(100, km / CANON.totalKm * 100));
  const nodes = Array.from({ length: 8 }, (_, i) => (i + 1) * 5000);
  const horiz = APP.axisOrient === 'h';
  const carLayer = d.transit.map(c => {
    const up = c.dir === 'up';
    const style = horiz
      ? `left:${pos(c.km)}%;top:calc(50% ${up ? '-' : '+'} 8px)`
      : `bottom:${pos(c.km)}%;left:calc(50% ${up ? '-' : '+'} 7px)`;
    return `<div class="axis-car" style="${style};background:${up ? 'var(--cyan)' : 'var(--amber)'};box-shadow:0 0 8px ${up ? 'rgba(53,224,208,.8)' : 'rgba(255,180,84,.8)'}"></div>`;
  }).join('');
  const nStyle = (km) => horiz ? `left:${pos(km)}%` : `bottom:${pos(km)}%`;
  const nCls = (i) => horiz ? (i % 2 ? 'h-down' : 'h-up') : (i % 2 ? 'left' : '');
  return head('世界之轴', 'World Axis',
    '轨道电梯全段运行监控：索系、节点、攀爬舱与能源链路。总长约 40,000 km。',
    'Full-segment monitoring: tether, relay nodes, climbers and power chain. ~40,000 km overall.') + `
  <div class="grid ${horiz ? '' : 'g-2-1'}">
    ${panel(T('全段剖面','Segment profile'), `
      <div class="axis-map${horiz ? ' h' : ''}">
        <div class="axis-hud"><span id="map-speed">×${APP.mapSpeed}</span><span id="map-clock">--:--:--</span><span class="hud-note">${T('仿真时间轴','SIM TIME')}</span></div>
        <div class="axis-line"></div>
        <div class="axis-node ${horiz ? 'h-up h-first' : ''}" style="${horiz ? 'left:18px' : 'bottom:0'}"><span class="mk"></span>${T('地面站 · 安第斯','Ground · Andes')} 0 km</div>
        ${nodes.map((km, i) => `<div class="axis-node ${nCls(i)}" style="${nStyle(km)}">
          <span class="mk"></span>N0${i + 1} · ${km.toLocaleString()} km</div>`).join('')}
        <div class="axis-node ${horiz ? 'h-down' : ''}" style="${nStyle(CANON.axisKm)}"><span class="mk"></span>${T('世界树之冠','Crown')} 35,786 km</div>
        <div class="axis-node ${horiz ? 'h-up h-last' : ''}" style="${horiz ? 'right:18px;left:auto' : nStyle(CANON.totalKm)}"><span class="mk"></span>${T('配重段','Counterweight')} 39,986 km</div>
        <div id="axis-cars">${carLayer}</div>
      </div>`,
      `<div class="map-ctl">
        <div class="seg">${[1, 60, 600, 3600].map(v => `<button data-speed="${v}" class="${APP.mapSpeed === v ? 'on' : ''}">${v}×</button>`).join('')}</div>
        <div class="seg">
          <button data-orient="v" class="${horiz ? '' : 'on'}" title="${T('纵向','Vertical')}">↕</button>
          <button data-orient="h" class="${horiz ? 'on' : ''}" title="${T('横向','Horizontal')}">↔</button>
        </div>
        <button class="icon" data-fs title="${T('全屏','Fullscreen')}" aria-label="fullscreen">⛶</button>
      </div>`, true)}
    ${panel(T('实时参数','Live parameters'), `
      <div class="stat-list">
        ${kv(T('上行速率','Upbound'), K('upRate','1') + ' t/h')}
        ${kv(T('下行速率','Downbound'), K('downRate','1') + ' t/h')}
        ${kv(T('索系张力','Tension'), K('tension','2') + ' %')}
        ${kv(T('可用率','Availability'), K('availability','2') + ' %')}
        ${kv(T('地面端温度','Ground temp'), K('tempGround','1') + ' °C')}
        ${kv(T('中段温度','Mid temp'), K('tempMid','1') + ' °C')}
        ${kv(T('高段温度','High temp'), K('tempHigh','1') + ' °C')}
        ${kv(T('待发队列','Queue'), K('queue','int') + ' ' + T('舱','pods'))}
      </div>`, 'TELEMETRY')}
  </div>

  <div class="grid g2" style="margin-top:14px">
    ${panel(T('运力曲线','Throughput'), chart([
      { values: hist(x => x.upRate), color: '#35e0d0', fill: true },
      { values: hist(x => x.downRate), color: '#ffb454' }
    ], { h: 140, min: 30, max: 36 }) + legend([{ label: T('上行','Up'), color: '#35e0d0' }, { label: T('下行','Down'), color: '#ffb454' }]), 't/h')}
    ${panel(T('索系张力','Tether tension'), chart([
      { values: hist(x => x.tension), color: '#5aa9ff', fill: true }
    ], { h: 140, min: 99.5, max: 100 }), '%')}
  </div>

  ${panel(T('索系温度 · 三测点','Tether temperature · 3 probes'), chart([
    { values: hist(x => x.tempGround), color: '#ffb454' },
    { values: hist(x => x.tempMid), color: '#35e0d0' },
    { values: hist(x => x.tempHigh), color: '#5aa9ff' }
  ], { h: 150, min: -70, max: 40 }) + legend([
    { label: T('地面端','Ground'), color: '#ffb454' },
    { label: T('中段','Mid'), color: '#35e0d0' },
    { label: T('高段','High'), color: '#5aa9ff' }
  ]), '°C')}` + `
  <div style="margin-top:14px">
    ${panel(T('中继节点','Relay nodes'), `
      <table class="tbl"><thead><tr>
        <th>${T('节点','Node')}</th><th>${T('里程 km','Km')}</th><th>${T('状态','Status')}</th>
        <th>${T('负载','Load')}</th><th>${T('时延 ms','Latency')}</th><th>${T('温度 °C','Temp')}</th>
        <th>${T('在段舱','Pods')}</th><th>${T('可用率','Uptime')}</th></tr></thead><tbody>
      ${d.nodes.map((n, i) => `<tr>
        <td class="num">${n.id}</td><td class="num">${n.km.toLocaleString()}</td>
        <td><span class="tag ${n.state === 'warn' ? 'warn' : n.state === 'maint' ? 'cy' : 'ok'}" data-tag="nodes.${i}.state">${n.state === 'warn' ? T('注意','ADVISORY') : n.state === 'maint' ? T('维护','MAINT') : T('正常','NOMINAL')}</span></td>
        <td style="min-width:110px"><div class="bar-row"><div class="bar"><i data-w="nodes.${i}.load" data-max="100" style="width:${n.load.toFixed(1)}%"></i></div>
          <span class="v" data-k="nodes.${i}.load" data-f="1">${fmt(n.load, '1')}</span></div></td>
        <td class="num" data-k="nodes.${i}.lat" data-f="1">${fmt(n.lat, '1')}</td>
        <td class="num" data-k="nodes.${i}.temp" data-f="1">${fmt(n.temp, '1')}</td>
        <td class="num" data-k="nodes.${i}.cars" data-f="int">${n.cars}</td>
        <td class="num"><span data-k="nodes.${i}.uptime" data-f="2">${fmt(n.uptime, '2')}</span>%</td>
      </tr>`).join('')}
      </tbody></table>`, '8 NODES')}
  </div>

  <div style="margin-top:14px">
    ${panel(T('在途攀爬舱','Climbers in transit'), `
      <table class="tbl"><thead><tr><th>ID</th><th>${T('方向','Dir')}</th><th>${T('位置 km','Km')}</th><th>${T('进度','Progress')}</th><th>${T('载员/载重','Load')}</th><th>${T('到达','ETA')}</th><th>${T('剩余','Remaining')}</th></tr></thead><tbody>
      ${d.transit.slice(0, 10).map(c => `<tr><td class="num">${c.id}</td>
        <td>${c.dir === 'up' ? T('上行','UP') : T('下行','DOWN')}</td>
        <td class="num" data-car-km="${c.id}">${Math.round(c.km).toLocaleString()}</td>
        <td><div class="bar" style="min-width:70px"><i style="width:${(c.prog * 100).toFixed(1)}%"></i></div></td>
        <td class="num">${c.load} ${c.type === 'pax' ? T('人','pax') : 't'}</td>
        <td class="num">${hhmm(c.arrive)}</td>
        <td class="num" data-car-eta="${c.id}">${cd(c.arrive - APP.t)}</td></tr>`).join('')}
      </tbody></table>`, 'TRANSIT')}
  </div>`;
}

/* ================= 世界树之冠 ================= */
function crown() {
  const d = APP.data;
  const rings = d.rings.map(r => ({ ...r, zh: L(r.zh, r.en) }));
  const popRows = [
    [T('会员','Members'), 31000, '#35e0d0'],
    [T('雇员','Employees'), 18000, '#5aa9ff'],
    [T('军事人员','Military'), 2000, '#ffb454'],
    [T('其他','Other'), 1000, '#6f8795']
  ];
  return head('世界树之冠', 'World Tree Crown',
    '总部空间站：五环舱段、能源、生保与应急独立运行系统（EIOS）。',
    'Headquarters station: five rings, power, life support and EIOS.') + `
  <div class="grid g-2-1">
    ${panel(T('环段剖视','Ring section'), `<div class="ring-wrap">
      <div>${ringMap(rings)}</div>
      <div>
        ${d.rings.map((r, i) => `<div class="ring-row">
          <span>${L(r.zh, r.en)}</span>
          <div class="bar"><i style="width:${(r.load * 100).toFixed(0)}%"></i></div>
          <span class="num">${Math.round(r.load * 100)}%</span>
        </div>`).join('')}
        <div class="stat-row" style="margin-top:10px"><span>${T('总常驻','Total residents')}</span><b class="cy">${K('pop','int')}</b></div>
        <div class="stat-row"><span>${T('主塔','Main tower')}</span><b>1,200 m · 0G</b></div>
        <div class="stat-row"><span>${T('树冠直径','Crown diameter')}</span><b>2,800 m</b></div>
      </div>
    </div>`, '5 RINGS')}
    ${panel(T('能源','Power'), `
      <div class="stat-list">
        ${kv(T('世界之轴传导','Axis feed'), K('axisPower','0') + ' MW')}
        ${kv(T('站体总负载','Station load'), K('crownPower','0') + ' MW')}
        ${kv(T('自载堆输出','Reactors'), K('reactorMW','0') + ' MW')}
        ${kv(T('地面补充','Ground supply'), K('groundSupply','0') + ' MW')}
        ${kv(T('堆组','Reactor set'), '5 × 120 MW · 4+1')}
        ${kv(T('应急电池','Battery'), '120 MWh · 72h')}
      </div>
      <div style="margin-top:12px">
        ${[1, 2, 3, 4, 5].map(i => `<div class="bar-row"><span>R${i}</span>
          <div class="bar ${i === 5 ? 'am' : ''}"><i style="width:${i === 5 ? 0 : (92 + (i * 3) % 7)}%"></i></div>
          <span class="v">${i === 5 ? T('备用','STBY') : (110 + i) + ' MW'}</span></div>`).join('')}
      </div>`, 'GRID')}
  </div>

  <div class="grid g3" style="margin-top:14px">
    ${panel(T('生命支持','Life support'), `
      <div class="stat-list">
        ${kv(T('水储备','Water'), K('water','int') + ' t')}
        ${kv(T('储备水平','Reserve level'), K('waterPct','1') + ' %')}
        ${kv(T('食品自给','Food'), K('food','1') + ' %')}
        ${kv(T('氧浓度','O₂'), K('o2','2') + ' %')}
        ${kv(T('舱温','Cabin temp'), K('cabinTemp','1') + ' °C')}
        ${kv(T('湿度','Humidity'), K('humidity','0') + ' %')}
      </div>`, 'ECLSS')}
    ${panel(T('常驻构成','Population'), `
      ${popRows.map(([label, n, c]) => `<div class="bar-row" style="margin-bottom:9px">
        <span style="width:52px;color:var(--dim)">${label}</span>
        <div class="bar"><i style="width:${(n / 31000 * 100).toFixed(1)}%;background:${c}"></i></div>
        <span class="v">${n.toLocaleString()}</span></div>`).join('')}
      <div class="stat-row" style="margin-top:6px"><span>${T('设计上限','Design limit')}</span><b>60,000</b></div>
      <div class="stat-row"><span>${T('在站率','Occupancy')}</span><b class="cy">${(d.pop / 60000 * 100).toFixed(1)}%</b></div>`, 'POP')}
    ${panel(T('应急独立运行','EIOS'), `
      <div class="stat-list">
        ${kv(T('状态','Status'), tag('READY', 'ok'))}
        ${kv(T('独立运行基线','Endurance'), '18 ' + T('个月','months'))}
        ${kv(T('上次演练','Last drill'), '2051-09-14')}
        ${kv(T('下次演练','Next drill'), '2051-12-14')}
        ${kv(T('切换时间','Switch time'), '< 90 s')}
        ${kv(T('覆盖负载','Coverage'), '85%')}
      </div>`, 'EIOS')}
  </div>

  <div class="grid g2" style="margin-top:14px">
    ${panel(T('站体负载 · 近 60 分钟','Station load · last 60 min'), chart([
      { values: hist(x => x.crownPower), color: '#35e0d0', fill: true }
    ], { h: 120, min: 380, max: 480 }), 'MW')}
    ${panel(T('水储备 · 七日周期','Water reserve · 7-day cycle'), `
      <div class="stat-row"><span>${T('当前','Current')}</span><b class="cy">${K('water','int')} t</b></div>
      <div class="bar" style="margin:8px 0"><i style="width:${d.waterPct.toFixed(1)}%"></i></div>
      <div class="stat-row"><span>${T('储备上限','Capacity')}</span><b>20,000 t</b></div>
      <div class="stat-row"><span>${T('日均损耗','Daily loss')}</span><b>~37 t</b></div>
      <div class="stat-row"><span>${T('可支撑','Endurance')}</span><b>~18 ${T('个月','months')}</b></div>`, 'H₂O')}
  </div>`;
}

/* ================= 运输计划 ================= */
function transport() {
  const d = APP.data;
  const paxLeft = Math.max(0, CANON.capPax - d.paxToday);
  const frLeft = Math.max(0, CANON.capUp - d.upToday);
  const fixed = [
    ['06:00', 'pax', 'up'], ['18:00', 'pax', 'down'],
    ['00:00', 'fr', 'up'], ['06:00', 'fr', 'up'], ['12:00', 'fr', 'up'], ['18:00', 'fr', 'up'],
    ['03:00', 'fr', 'down'], ['09:00', 'fr', 'down'], ['15:00', 'fr', 'down'], ['21:00', 'fr', 'down']
  ];
  return head('运输计划', 'Transport Plan',
    '客运与货运班次、在途状态、配载与余量。客运全程约 30 小时，货运约 60 小时。',
    'Passenger and freight departures, in-transit status, manifests and remaining capacity.') + `
  <div class="grid g4">
    ${panel(T('客运余量','Pax remaining'), `<div class="kpi cy"><div class="k-label"><span>PAX · TODAY</span><span>cap ${CANON.capPax}</span></div><div class="k-val">${Math.round(paxLeft)}<small>${T('人','pax')}</small></div><div class="bar"><i style="width:${pct(d.paxToday, CANON.capPax)}%"></i></div></div>`, 'PAX')}
    ${panel(T('货运余量','Freight remaining'), `<div class="kpi am"><div class="k-label"><span>UP · TONNES</span><span>cap ${CANON.capUp}</span></div><div class="k-val">${Math.round(frLeft)}<small>t</small></div><div class="bar am"><i style="width:${pct(d.upToday, CANON.capUp)}%"></i></div></div>`, 'FRT')}
    ${panel(T('今日在途','In transit'), `<div class="kpi"><div class="k-label"><span>PODS</span><span>${T('双向','both')}</span></div><div class="k-val">${K('transit.length','int')}<small>${T('舱','pods')}</small></div><div class="k-foot"><span>${T('平均延误','avg delay')}</span><span>${K('delay','1')} min</span></div></div>`, 'TRK')}
    ${panel(T('今日班次','Departures today'), `<div class="kpi bl"><div class="k-label"><span>SLOTS</span><span>10</span></div><div class="k-val">10<small>${T('班','sched')}</small></div><div class="k-foot"><span>${T('客运','pax')} 2</span><span>${T('货运','frt')} 8</span></div></div>`, 'SCHED')}
  </div>

  <div class="grid g2" style="margin-top:14px">
    ${panel(T('下一批班次','Next departures'), `
      <table class="tbl"><thead><tr><th>ID</th><th>${T('类型','Type')}</th><th>${T('方向','Dir')}</th><th>${T('发车','Dep')}</th><th>${T('到达','Arr')}</th><th>${T('余位/余载','Capacity')}</th></tr></thead><tbody>
      ${d.next.slice(0, 10).map(c => `<tr><td class="num">${c.id}</td>
        <td>${c.type === 'pax' ? T('客运','Pax') : T('货运','Freight')}</td>
        <td>${c.dir === 'up' ? T('上行','UP') : T('下行','DOWN')}</td>
        <td class="num">${hhmm(c.dep)}</td>
        <td class="num">${arr(c.dep, c.type === 'pax' ? 30 : 60)}</td>
        <td class="num">${c.pods} × ${c.cap} ${c.type === 'pax' ? T('人','pax') : 't'}</td></tr>`).join('')}
      </tbody></table>`, 'NEXT')}
    ${panel(T('固定时刻表','Fixed timetable'), `
      <table class="tbl"><thead><tr><th>UTC</th><th>${T('类型','Type')}</th><th>${T('方向','Dir')}</th><th>${T('状态','State')}</th></tr></thead><tbody>
      ${fixed.map(([t, type, dir]) => {
        const [h, m] = t.split(':').map(Number);
        const d0 = Math.floor(APP.t / 86400000) * 86400000;
        const dep = d0 + h * 3600000 + m * 60000;
        const st = dep < APP.t ? T('已发','DEPARTED') : T('待发','SCHEDULED');
        return `<tr><td class="num">${t}</td><td>${type === 'pax' ? T('客运','Pax') : T('货运','Freight')}</td>
          <td>${dir === 'up' ? T('上行','UP') : T('下行','DOWN')}</td>
          <td>${tag(st, dep < APP.t ? '' : 'cy')}</td></tr>`;
      }).join('')}
      </tbody></table>`, 'DAILY')}
  </div>

  ${panel(T('在途明细','In-transit detail'), `
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>ID</th><th>${T('类型','Type')}</th><th>${T('方向','Dir')}</th><th>${T('位置 km','Position km')}</th>
      <th>${T('进度','Progress')}</th><th>${T('载员/载重','Load')}</th><th>${T('预计到达','ETA')}</th><th>${T('剩余','Remaining')}</th></tr></thead><tbody>
    ${d.transit.map(c => `<tr><td class="num">${c.id}</td>
      <td>${c.type === 'pax' ? T('客运','Pax') : T('货运','Freight')}</td>
      <td>${c.dir === 'up' ? T('上行','UP') : T('下行','DOWN')}</td>
      <td class="num" data-car-km="${c.id}">${Math.round(c.km).toLocaleString()}</td>
      <td style="min-width:120px"><div class="bar"><i style="width:${(c.prog * 100).toFixed(1)}%"></i></div></td>
      <td class="num">${c.load} ${c.type === 'pax' ? T('人','pax') : 't'}</td>
      <td class="num">${hhmm(c.arrive)}</td>
      <td class="num" data-car-eta="${c.id}">${cd(c.arrive - APP.t)}</td></tr>`).join('') || `<tr><td colspan="8" class="dim">${T('当前无在途舱','No pods in transit')}</td></tr>`}
    </tbody></table></div>`, 'MANIFEST')}`;
}

/* ================= 维护计划 ================= */
function maintenance() {
  const d = APP.data, m = d.maint;
  const stateTag = s => s === 'active' ? tag(T('执行中','ACTIVE'), 'cy') : s === 'queued' ? tag(T('待执行','QUEUED'), 'warn') : tag(T('已完成','DONE'), 'ok');
  return head('维护计划', 'Maintenance Plan',
    '世界之轴与世界树之冠的 A–F 六级维护、工单与五年大修（F 级）倒计时。',
    'Tier A–F maintenance, work orders and the five-year deep overhaul countdown.') + `
  <div class="grid g4">
    ${panel(T('F 级大修倒计时','Next F overhaul'), `<div class="kpi am"><div class="k-label"><span>DEEP OVERHAUL</span><span>${m.nextF}</span></div><div class="k-val">${m.daysToF}<small>${T('天','days')}</small></div><div class="k-foot"><span>${T('上次','last')}</span><span>2048</span></div></div>`, 'F-CLASS')}
    ${panel(T('维护机器人','Maintenance robots'), `<div class="kpi cy"><div class="k-label"><span>ROBOTS</span><span>200</span></div><div class="k-val">${m.robots.active}<small>${T('在役','active')}</small></div><div class="bar"><i style="width:${m.robots.active / 2}%"></i></div></div>`, 'AUTO')}
    ${panel(T('开放工单','Open work orders'), `<div class="kpi"><div class="k-label"><span>WORK ORDERS</span><span>24H</span></div><div class="k-val">${m.orders.filter(o => o.state !== 'done').length}<small>${T('单','WO')}</small></div><div class="k-foot"><span>${T('今日完成','done today')}</span><span>${m.orders.filter(o => o.state === 'done').length}</span></div></div>`, 'WO')}
    ${panel(T('下次 A 级巡检','Next A inspection'), `<div class="kpi bl"><div class="k-label"><span>TIER A</span><span>24H</span></div><div class="k-val">06:00<small>UTC</small></div><div class="k-foot"><span>${T('自动','auto')}</span><span>RDY</span></div></div>`, 'TIER-A')}
  </div>

  <div class="grid g-2-1" style="margin-top:14px">
    ${panel(T('维护分级','Maintenance tiers'), `
      <table class="tbl"><thead><tr><th>${T('级别','Tier')}</th><th>${T('周期','Cycle')}</th><th>${T('范围','Scope')}</th><th>${T('下次','Next')}</th></tr></thead><tbody>
      ${m.due.map(x => `<tr><td class="num">${x.k}</td><td class="num">${x.cycle}</td>
        <td>${L(x.zh, x.en)}</td><td class="num">${dateStr(x.next)} ${hhmm(x.next)}</td></tr>`).join('')}
      </tbody></table>`, 'A–F')}
    ${panel(T('工单','Work orders'), `
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>${T('系统','System')}</th><th>${T('时限','Due')}</th><th>${T('状态','State')}</th></tr></thead><tbody>
      ${m.orders.map(o => `<tr><td class="num">${o.id}</td><td>${o.sys}</td><td class="num">${hhmm(o.due)}</td><td>${stateTag(o.state)}</td></tr>`).join('')}
      </tbody></table></div>`, 'WO')}
  </div>

  ${panel(T('F 级大修周期','F-class overhaul cycle'), `
    <div class="grid g4">
      ${[2018, 2023, 2028, 2033, 2038, 2043, 2048, 2053].map(y => {
        const done = y <= 2048, next = y === 2053;
        return `<div class="stat-row" style="border:1px solid var(--line);padding:10px 12px;border-bottom:1px solid var(--line)">
          <span>${y}</span><b class="${next ? 'am' : done ? 'cy' : ''}">${done ? T('已完成','DONE') : next ? T('计划中','NEXT') : T('计划','PLAN')}</b></div>`;
      }).join('')}
    </div>
    <div class="stat-row" style="margin-top:12px"><span>${T('2048 年大修新增','Added in 2048')}</span><b class="cy">EIOS · 5×120MW · 20,000t H₂O</b></div>`, 'CYCLE')}`;
}

/* ================= 事件 ================= */
function events() {
  const d = APP.data;
  const list = d.events;
  const warn = list.filter(e => e.sev === 'warn').length;
  return head('事件与告警', 'Events & Alerts',
    '当值事件流：巡检、切换测试、碎片预警与异常处置记录。',
    'Duty event stream: inspections, switch tests, debris advisories and exceptions.') + `
  <div class="grid g4">
    ${panel(T('近 24 小时','Last 24 h'), `<div class="kpi"><div class="k-label"><span>LOG</span><span>24H</span></div><div class="k-val">${list.length}</div><div class="k-foot"><span>${T('全部','all')}</span><span>LOG</span></div></div>`, '')}
    ${panel(T('注意级','Advisories'), `<div class="kpi am"><div class="k-label"><span>WARN</span><span>24H</span></div><div class="k-val">${warn}</div><div class="k-foot"><span>${T('待观察','watch')}</span><span>!</span></div></div>`, '')}
    ${panel(T('正常级','Nominal'), `<div class="kpi cy"><div class="k-label"><span>OK</span><span>24H</span></div><div class="k-val">${list.length - warn}</div><div class="k-foot"><span>${T('已闭环','closed')}</span><span>✓</span></div></div>`, '')}
    ${panel(T('最近事件','Latest'), `<div class="kpi bl"><div class="k-label"><span>LAST</span><span>UTC</span></div><div class="k-val">${list[0] ? hhmm(list[0].t) : '—'}</div><div class="k-foot"><span>${list[0] ? list[0].id : ''}</span><span>${list[0] ? (list[0].sev === 'warn' ? T('注意','WARN') : T('正常','OK')) : ''}</span></div></div>`, '')}
  </div>

  ${panel(T('事件流','Event stream'), `<div class="feed" style="max-height:520px">
    ${list.map(e => `<div class="feed-item">
      <span class="t">${hhmm(e.t)}</span>
      <i class="led ${e.sev === 'warn' ? 'warn' : 'ok'} dot"></i>
      <div>${L(e.zh, e.en)}<div class="m">${e.id} · ${e.sev === 'warn' ? T('注意','ADVISORY') : T('正常','NOMINAL')} · ${T('已记录','logged')}</div></div>
    </div>`).join('')}
  </div>`, 'STREAM')}`;
}

/* ================= 关于 ================= */
function about() {
  return head('关于本站', 'About',
    '中央办公厅工程与运维局的对外运行看板，覆盖世界之轴与世界树之冠两处重大基础设施。',
    'A public operations board of the Engineering & Operations Bureau, covering the Axis and the Crown.') + `
  <div class="grid g2">
    ${panel(T('机构','Bureau'), `
      <div class="stat-list">
        ${kv(T('名称','Name'), L('中央办公厅工程与运维局','Engineering & Operations Bureau, CCO'))}
        ${kv(T('代号','Code'), 'EOB / WCA-ENG')}
        ${kv(T('管辖','Assets'), L('世界之轴 · 世界树之冠','World Axis · World Tree Crown'))}
        ${kv(T('编制','Established'), '1986')}
        ${kv(T('文件编号','Doc no.'), 'WCA-ENG-2051-OPS')}
        ${kv(T('数据刷新','Refresh'), L('1 秒（本地插值）','1 s (local interpolation)'))}
      </div>`, 'ORG')}
    ${panel(T('数据口径','Data notes'), `
      <div class="stat-list">
        ${kv(T('世界之轴总长','Axis length'), '39,986 km')}
        ${kv(T('同步轨道','GEO'), '35,786 km')}
        ${kv(T('日运力','Daily capacity'), '800 t ↑ / 600 t ↓')}
        ${kv(T('客运/货运全程','Transit time'), '30 h / 60 h')}
        ${kv(T('输电/通信','Power / link'), '500 MW / 40 Tbps')}
        ${kv(T('树冠常驻','Crown residents'), '52,000')}
        ${kv(T('树冠自载堆','Reactors'), '5 × 120 MW (4+1)')}
        ${kv(T('EIOS 基线','EIOS endurance'), L('18 个月','18 months'))}
      </div>`, 'CANON')}
  </div>

  <div class="grid g2" style="margin-top:14px">
    ${panel(T('引用文件','Referenced documents'), `
      <div class="stat-list">
        ${kv('WCA-ENG-2051-STATION-001', L('世界树之冠总部空间站技术参数与例行维护','Crown station technical parameters'))}
        ${kv('WCA-ENG-2051-AXIS-001', L('世界之轴技术参数与运行规范','Axis technical parameters'))}
        ${kv('CCO-EMERG-2047-REPORT-001', L('2047 年安第斯地震应急处置通报','2047 Andes earthquake report'))}
        ${kv('WCA-ENG-2051-OPS', L('本看板运行规范','This board'))}
      </div>`, 'DOCS')}
    ${panel(T('声明','Notice'), `
      <p style="color:var(--dim);font-size:12px;line-height:1.9;margin:0">
        ${L('本站为虚构世界观（世界儿童协会）设定产物，全部数据、机构与事件均属虚构。看板数值由确定性模拟生成，不对应任何真实设施。',
            'This site is a fictional-world artefact of the World Children Association. All data, agencies and events are fictional. Values are generated by a deterministic simulation and correspond to no real facility.')}
      </p>
      <div class="stat-row" style="margin-top:14px"><span>${T('时区','Time zone')}</span><b>UTC · SYNC</b></div>
      <div class="stat-row"><span>${T('渲染','Rendering')}</span><b>Zero-build ESM</b></div>
      <div class="stat-row"><span>${T('跨终端一致','Cross-terminal')}</span><b class="cy">${T('是','YES')}</b></div>`, 'NOTICE')}
  </div>`;
}

export const PAGES = {
  '/': overview,
  '/axis': axis,
  '/crown': crown,
  '/transport': transport,
  '/maintenance': maintenance,
  '/events': events,
  '/about': about
};

export function render(app, path) {
  APP = app;
  const fn = PAGES[path] || overview;
  return fn(app);
}

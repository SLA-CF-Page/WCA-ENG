/* charts.js — 轻量 SVG 图表（无依赖） */

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function bounds(series) {
  let lo = Infinity, hi = -Infinity;
  for (const s of series) for (const v of s.values) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!isFinite(lo)) { lo = 0; hi = 1; }
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.12;
  return [lo - pad, hi + pad];
}

export function chart(series, opt = {}) {
  const w = opt.w || 600, h = opt.h || 140;
  const padL = 34, padR = 8, padT = 10, padB = 16;
  const iw = w - padL - padR, ih = h - padT - padB;
  const [lo, hi] = opt.min != null && opt.max != null ? [opt.min, opt.max] : bounds(series);
  const n = Math.max(...series.map(s => s.values.length), 2);
  const x = i => padL + (i / (n - 1)) * iw;
  const y = v => padT + (1 - (v - lo) / (hi - lo)) * ih;

  let grid = '';
  const rows = opt.grid || 4;
  for (let i = 0; i <= rows; i++) {
    const yy = padT + (i / rows) * ih;
    grid += `<line class="grid-l" x1="${padL}" y1="${yy.toFixed(1)}" x2="${w - padR}" y2="${yy.toFixed(1)}"/>`;
    const val = hi - (i / rows) * (hi - lo);
    grid += `<text x="${padL - 5}" y="${(yy + 3).toFixed(1)}" text-anchor="end">${fmtAxis(val)}</text>`;
  }

  let body = '';
  for (const s of series) {
    const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    if (s.fill) {
      body += `<polygon points="${padL},${padT + ih} ${pts} ${w - padR},${padT + ih}" fill="${s.color}" opacity=".07"/>`;
    }
    body += `<polyline class="ln ${s.cls || ''}" points="${pts}" style="stroke:${s.color}"/>`;
  }

  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">${grid}${body}</svg>`;
}

function fmtAxis(v) {
  const a = Math.abs(v);
  if (a >= 1000) return (v / 1000).toFixed(1) + 'k';
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

export function legend(items) {
  return `<div class="legend">${items.map(i => `<span><i style="background:${i.color}"></i>${esc(i.label)}</span>`).join('')}</div>`;
}

/* 同心环剖面 */
export function ringMap(rings) {
  const cx = 150, cy = 150;
  return `<svg class="chart" viewBox="0 0 300 300" style="max-height:280px">
    ${rings.map((r, i) => {
      const rad = 118 - i * 20;
      const c = ['#35e0d0', '#5aa9ff', '#ffb454', '#59d98a', '#c9a7ff'][i % 5];
      const dash = 2 * Math.PI * rad;
      return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="#1b2b38" stroke-width="14"/>
        <circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${c}" stroke-width="14"
          stroke-dasharray="${(dash * r.load).toFixed(1)} ${dash.toFixed(1)}" stroke-linecap="butt" transform="rotate(-90 ${cx} ${cy})"/>
        <text x="${cx}" y="${cy - rad + 4}" text-anchor="middle" style="fill:${c}">${esc(r.zh)}</text>`;
    }).join('')}
    <circle cx="${cx}" cy="${cy}" r="26" fill="#070b10" stroke="#24394a"/>
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" style="fill:#6f8795">CORE</text>
    <text x="${cx}" y="${cy + 8}" text-anchor="middle" style="fill:#35e0d0">HQ</text>
  </svg>`;
}

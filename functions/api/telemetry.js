/* functions/api/telemetry.js — 跨终端授时
 * 只返回服务器时间与“2051 时钟”，模拟内核在客户端运行：
 * 所有终端用同一个 delta，因此同一时刻看到同一组数据。 */

const YEAR_OFFSET = 25;

export async function onRequest() {
  const now = Date.now();
  const d = new Date(now);
  const f = new Date(now);
  f.setFullYear(d.getFullYear() + YEAR_OFFSET);
  const body = {
    now,
    fictionNow: f.getTime(),
    node: 'EOB-01',
    tz: 'UTC'
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

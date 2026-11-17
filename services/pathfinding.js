// 找路：從目的地往外擴散，算出每一格離目的地還有幾步（BFS 距離場）。
// NPC、追人者、時限計算都靠它。

import { W, H, grid, idx, solidT } from '../domain/campus.js';

export function bfs(tx, ty) {
  const f = new Int16Array(W * H).fill(-1), q = new Int32Array(W * H);
  let h = 0, t = 0; f[idx(tx, ty)] = 0; q[t++] = idx(tx, ty);
  while (h < t) {
    const c = q[h++], cx = c % W, cy = (c / W) | 0, d = f[c] + 1;
    if (cx > 0 && f[c - 1] < 0 && !solidT(grid[c - 1])) { f[c - 1] = d; q[t++] = c - 1; }
    if (cx < W - 1 && f[c + 1] < 0 && !solidT(grid[c + 1])) { f[c + 1] = d; q[t++] = c + 1; }
    if (cy > 0 && f[c - W] < 0 && !solidT(grid[c - W])) { f[c - W] = d; q[t++] = c - W; }
    if (cy < H - 1 && f[c + W] < 0 && !solidT(grid[c + W])) { f[c + W] = d; q[t++] = c + W; }
  }
  return f;
}

// 固定目的地（門口、站點）的距離場算一次就記起來。
const cache = new Map();
export function field(tx, ty) { const k = idx(tx, ty); let f = cache.get(k); if (!f) { f = bfs(tx, ty); cache.set(k, f); } return f; }

// 兩格之間要走幾步；走不到回傳 -1。
export const steps = (from, to) => field(to[0], to[1])[idx(from[0], from[1])];

// 讓一個角色沿著距離場往目的地走一小段。走到了回傳 true。
export function stepAgent(a, f, speed, dt) {
  let rem = speed * dt, guard = 8;
  while (rem > 0 && guard-- > 0) {
    if (a.tx == null) {
      const cx = Math.floor(a.x), cy = Math.floor(a.y), d = f[idx(cx, cy)];
      if (d < 0) return true;
      if (d === 0) { a.tx = cx; a.ty = cy; a.fin = true; }
      else {
        let bx = cx, by = cy, bd = d;
        for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + i, ny = cy + j; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const v = f[idx(nx, ny)]; if (v >= 0 && v < bd) { bd = v; bx = nx; by = ny; }
        }
        a.tx = bx; a.ty = by; a.fin = false;
      }
    }
    const dx = a.tx + 0.5 - a.x, dy = a.ty + 0.5 - a.y, dist = Math.hypot(dx, dy);
    if (dist > 1e-4) { a.dx = dx / dist; a.dy = dy / dist; }
    if (dist <= rem) { a.x = a.tx + 0.5; a.y = a.ty + 0.5; rem -= dist; a.tx = null; if (a.fin) { a.fin = false; return true; } }
    else { a.x += dx / dist * rem; a.y += dy / dist * rem; rem = 0; }
  }
  return false;
}

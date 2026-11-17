// 畫地圖：把遊戲目前的狀態畫到 canvas 上。只讀遊戲狀態，不改它。

import { DETECT, REACH, M_PER_TILE } from '../domain/config.js';
import { W, H, grid, idx, GRASS, ROAD, BLD, DOOR, WATER, TREE, STN, FIELD, ROADS, FIELDS, BUILDINGS, B, LAKE, GATE } from '../domain/campus.js';

const C = { grass: '#A8CF9A', grass2: '#A1C993', road: '#5F6877', line: 'rgba(240,244,248,.55)', water: '#74B9DD', tree: '#4C8B5A', tree2: '#63A46F', ink: '#1C2530', pad: '#DADFE3', bike: '#FFC629', player: '#22344F', hunter: '#D6334B', white: '#FFFFFF', door: '#3A4250', errand: '#4FD2F0', broken: '#9AA3AD' };

export function createRenderer(canvas, stage, game, input) {
  const ctx = canvas.getContext('2d');
  let cw = 0, ch = 0, dpr = 1, ts = 32, vw = 0, vh = 0; const cam = { x: 0, y: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); cw = stage.clientWidth; ch = stage.clientHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    ts = cw / (cw < 600 ? 13 : 24); vw = cw / ts; vh = ch / ts;                    // 手機一次看 13 格寬，電腦 24 格
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // 小地圖底圖只畫一次：一格一個像素。
  const mini = document.createElement('canvas'); mini.width = W; mini.height = H;
  { const m = mini.getContext('2d'); const col = { [GRASS]: '#8FBF84', [ROAD]: '#59616F', [BLD]: '#E8E4DA', [DOOR]: '#E8E4DA', [WATER]: '#74B9DD', [TREE]: '#7FB077', [STN]: '#8FBF84', [FIELD]: '#C9B98C' }; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { m.fillStyle = col[grid[idx(x, y)]]; m.fillRect(x, y, 1, 1); } }

  const SX = x => (x - cam.x) * ts, SY = y => (y - cam.y) * ts;                     // 格子座標 → 畫面座標

  function label(text, x, y, size, fillCol, strokeCol) {
    ctx.font = '700 ' + size + 'px "Noto Sans TC",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (strokeCol) { ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = strokeCol; ctx.strokeText(text, x, y); }
    ctx.fillStyle = fillCol; ctx.fillText(text, x, y);
  }

  function person(a, r, col, outline) {
    const x = SX(a.x), y = SY(a.y), dx = a.dx || 0, dy = a.dy == null ? 1 : a.dy;
    if (a.riding) {
      const o = ts * 0.34; ctx.lineWidth = Math.max(1.5, ts * 0.07); ctx.strokeStyle = C.ink; ctx.fillStyle = '#EEF1F4';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + dx * o * s, y + dy * o * s, ts * 0.16, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = a.broken ? C.broken : C.bike; ctx.lineWidth = Math.max(2, ts * 0.12); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - dx * o, y - dy * o); ctx.lineTo(x + dx * o, y + dy * o); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, y, ts * r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = outline === C.white ? Math.max(2, ts * 0.09) : 1.5; ctx.strokeStyle = outline; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + dx * ts * r * 0.55, y + dy * ts * r * 0.55, ts * r * 0.3, 0, 7); ctx.fillStyle = outline; ctx.fill();
  }

  function drawGround() {
    ctx.fillStyle = C.grass; ctx.fillRect(0, 0, cw, ch);
    const x0 = Math.max(0, Math.floor(cam.x)), x1 = Math.min(W - 1, Math.ceil(cam.x + vw)), y0 = Math.max(0, Math.floor(cam.y)), y1 = Math.min(H - 1, Math.ceil(cam.y + vh));
    const sz = Math.ceil(ts) + 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = grid[idx(x, y)];
      if ((x + y) & 1 && t !== ROAD && t !== WATER) { ctx.fillStyle = C.grass2; ctx.fillRect(Math.floor(SX(x)), Math.floor(SY(y)), sz, sz); }
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = grid[idx(x, y)], px = Math.floor(SX(x)), py = Math.floor(SY(y));
      if (t === ROAD) { ctx.fillStyle = C.road; ctx.fillRect(px, py, sz, sz); }
      else if (t === WATER) { ctx.fillStyle = C.water; ctx.fillRect(px, py, sz, sz); }
      else if (t === STN) { ctx.fillStyle = C.pad; ctx.fillRect(px, py, sz, sz); }
    }
    ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(1, ts * 0.06); ctx.setLineDash([ts * 0.45, ts * 0.45]); ctx.beginPath();
    ROADS.forEach(r => { if (r[2] > r[3]) { ctx.moveTo(SX(r[0]), SY(r[1] + 1)); ctx.lineTo(SX(r[0] + r[2]), SY(r[1] + 1)); } else { ctx.moveTo(SX(r[0] + 1), SY(r[1])); ctx.lineTo(SX(r[0] + 1), SY(r[1] + r[3])); } });
    ctx.stroke(); ctx.setLineDash([]);

    for (const f of FIELDS) {
      const x = SX(f.x), y = SY(f.y), w = f.w * ts, h = f.h * ts; if (x > cw || y > ch || x + w < 0 || y + h < 0) continue;
      if (f.kind === 'track') { ctx.fillStyle = '#D9765A'; ctx.beginPath(); ctx.roundRect(x, y, w, h, w / 2); ctx.fill(); ctx.fillStyle = '#7DBB6E'; ctx.beginPath(); ctx.roundRect(x + ts * 1.1, y + ts * 1.1, w - ts * 2.2, h - ts * 2.2, (w - ts * 2.2) / 2); ctx.fill(); }
      else { ctx.fillStyle = f.kind === 'dirt' ? '#DDB07A' : '#6FAE9A'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + ts * 0.3, y + ts * 0.3, w - ts * 0.6, h - ts * 0.6); ctx.beginPath(); ctx.moveTo(x + w / 2, y + ts * 0.3); ctx.lineTo(x + w / 2, y + h - ts * 0.3); ctx.stroke(); }
      label(f.name, x + w / 2, y + h / 2, Math.max(11, ts * 0.45), C.white, 'rgba(28,37,48,.75)');
    }
    label(LAKE.name, SX(LAKE.x + LAKE.w / 2), SY(LAKE.y + LAKE.h / 2), Math.max(12, ts * 0.55), C.white, '#3F86AD');
    label(GATE.name, SX(GATE.x), SY(GATE.y), Math.max(11, ts * 0.45), C.white, C.ink);

    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (grid[idx(x, y)] === TREE) {
      const cx = SX(x + 0.5), cy = SY(y + 0.5);
      ctx.fillStyle = C.tree; ctx.beginPath(); ctx.arc(cx, cy, ts * 0.42, 0, 7); ctx.fill();
      ctx.fillStyle = C.tree2; ctx.beginPath(); ctx.arc(cx - ts * 0.1, cy - ts * 0.1, ts * 0.22, 0, 7); ctx.fill();
    }
  }

  function drawBuildings(target, eb) {
    for (const b of BUILDINGS) {
      const x = SX(b.x), y = SY(b.y), w = b.w * ts, h = b.h * ts, isT = b === target;
      if (x > cw || y > ch || x + w < 0 || y + h < 0) continue;
      ctx.fillStyle = 'rgba(28,37,48,.22)'; ctx.fillRect(x + ts * 0.14, y + ts * 0.14, w, h);
      ctx.fillStyle = b.color; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.strokeStyle = 'rgba(28,37,48,.18)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + ts * 0.4, y + ts * 0.4, w - ts * 0.8, h - ts * 0.8);
      const dx = SX(b.door[0]), dy = SY(b.door[1]);
      if (b === eb) { ctx.strokeStyle = C.errand; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dx + ts / 2, dy + ts / 2, ts * 0.9, 0, 7); ctx.stroke(); }
      ctx.fillStyle = isT ? C.bike : b === eb ? C.errand : C.door; ctx.fillRect(dx + ts * 0.12, dy + ts * 0.12, ts * 0.76, ts * 0.76);
      label(b.name, x + w / 2, y + h / 2 - (b.door[1] === b.y ? -ts * 0.3 : ts * 0.3), Math.max(12, ts * 0.58), C.ink);
      if (isT) { const p = 0.5 + 0.5 * Math.sin(game.clock * 6); ctx.strokeStyle = C.bike; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dx + ts / 2, dy + ts / 2, ts * (0.75 + p * 0.45), 0, 7); ctx.stroke(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(dx + ts / 2, dy + ts / 2, ts * (0.75 + p * 0.45) + 2, 0, 7); ctx.stroke(); }
    }
  }

  function drawStations() {
    const near = game.state === 'play' ? game.nearStation() : null;
    for (const s of game.stations) {
      const cx = SX(s.x + 0.5), ty = SY(s.y);
      if (cx < -ts * 3 || cx > cw + ts * 3 || ty < -ts * 3 || ty > ch + ts * 3) continue;
      ctx.fillStyle = C.ink; ctx.fillRect(cx - ts * 0.1, ty + ts * 0.15, ts * 0.2, ts * 0.7);
      ctx.fillStyle = C.bike; ctx.fillRect(cx - ts * 0.24, ty + ts * 0.12, ts * 0.48, ts * 0.3);
      if (s === near) { ctx.strokeStyle = C.white; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, ty + ts / 2, ts * REACH, 0, 7); ctx.stroke(); }
      const u = Math.max(8, ts * 0.3), gap = 3, bw = s.cap * u + (s.cap - 1) * gap + 10, bx = cx - bw / 2, by = ty - u - 16;
      ctx.fillStyle = 'rgba(28,37,48,.9)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, u + 10, 5); ctx.fill();
      for (let i = 0; i < s.cap; i++) { const sx = bx + 5 + i * (u + gap); if (i < s.bikes) { ctx.fillStyle = C.bike; ctx.fillRect(sx, by + 5, u, u); } else { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.strokeRect(sx + 0.75, by + 5.75, u - 1.5, u - 1.5); } }
      label(s.name, cx, ty + ts * 1.32, Math.max(10, ts * 0.36), C.white, C.ink);
    }
  }

  function drawPeople() {
    const P = game.player;
    game.npcs.forEach(n => person(n, 0.22, n.color, C.ink));
    for (const h of game.hunters) {
      if (h.cool <= 0 || h.mode === 'chase') { ctx.fillStyle = h.mode === 'chase' ? 'rgba(214,51,75,.2)' : 'rgba(214,51,75,.1)'; ctx.beginPath(); ctx.arc(SX(h.x), SY(h.y), DETECT * ts, 0, 7); ctx.fill(); }
      person(h, 0.3, C.hunter, C.ink);
      ctx.fillStyle = C.white; ctx.fillRect(SX(h.x) - ts * 0.13, SY(h.y) - ts * 0.16, ts * 0.26, ts * 0.32);
      label(h.mode === 'chase' ? '同學等一下！' : h.tag, SX(h.x), SY(h.y) - ts * 0.72, Math.max(10, ts * 0.36), C.white, C.hunter);
    }
    person(P, 0.3, C.player, C.white);
    if (P.frozen > 0) label('填問卷中 ' + P.frozen.toFixed(1), SX(P.x), SY(P.y) - ts * 0.8, Math.max(11, ts * 0.4), C.white, C.ink);
  }

  // 教室不在畫面內時，在畫面邊緣畫箭頭和距離。
  function drawArrow(target) {
    const P = game.player, tx = SX(target.door[0] + 0.5), ty = SY(target.door[1] + 0.5), m = 34;
    if (!(tx < m || ty < m || tx > cw - m || ty > ch - m)) return;
    const px = SX(P.x), py = SY(P.y), ang = Math.atan2(ty - py, tx - px), vx = Math.cos(ang), vy = Math.sin(ang);
    let k = Infinity;
    if (vx > 0) k = Math.min(k, (cw - m - px) / vx); else if (vx < 0) k = Math.min(k, (m - px) / vx);
    if (vy > 0) k = Math.min(k, (ch - m - py) / vy); else if (vy < 0) k = Math.min(k, (m - py) / vy);
    const ax = px + vx * k, ay = py + vy * k;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); ctx.fillStyle = C.bike; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const dist = Math.round(Math.hypot(target.door[0] + 0.5 - P.x, target.door[1] + 0.5 - P.y) * M_PER_TILE);
    label(dist + ' m', ax - vx * 30, ay - vy * 30, 13, C.white, C.ink);
  }

  function drawRain() {
    ctx.fillStyle = 'rgba(40,70,110,.2)'; ctx.fillRect(0, 0, cw, ch); ctx.strokeStyle = 'rgba(235,245,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 80; i++) { const ry = (i * 71.3 + game.clock * 620) % (ch + 40) - 20, rx = (i * 137.5) % (cw + 200) - ry * 0.3; ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 15); }
    ctx.stroke();
  }

  function drawMinimap(target, eb) {
    const P = game.player, ms = cw < 600 ? 2 : 2.5, mw = W * ms, mh = H * ms, mx = cw - mw - 10, my = 10;
    ctx.fillStyle = 'rgba(28,37,48,.9)'; ctx.fillRect(mx - 3, my - 3, mw + 6, mh + 6);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(mini, mx, my, mw, mh); ctx.imageSmoothingEnabled = true;
    const dot = (x, y, r, col, ring) => { ctx.beginPath(); ctx.arc(mx + x * ms, my + y * ms, r, 0, 7); ctx.fillStyle = col; ctx.fill(); if (ring) { ctx.lineWidth = 1.5; ctx.strokeStyle = ring; ctx.stroke(); } };
    // 黃點 = 現在用得到的站：走路時是有車的站，騎車時是有空位的站
    for (const s of game.stations) { const useful = P.riding ? s.bikes < s.cap : s.bikes > 0; dot(s.x + 0.5, s.y + 0.5, 3, useful ? C.bike : '#6B7480', C.ink); }
    game.hunters.forEach(h => dot(h.x, h.y, 2.5, C.hunter));
    if (eb) dot(eb.door[0] + 0.5, eb.door[1] + 0.5, 3.5, C.errand, C.ink);
    if (target) { const p = 0.5 + 0.5 * Math.sin(game.clock * 6); ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx + (target.door[0] + 0.5) * ms, my + (target.door[1] + 0.5) * ms, 4 + p * 3, 0, 7); ctx.stroke(); }
    dot(P.x, P.y, 3.5, C.player, C.white);
  }

  function draw() {
    const P = game.player, playing = game.state === 'play';
    cam.x = vw >= W ? (W - vw) / 2 : Math.min(Math.max(P.x - vw / 2, 0), W - vw);   // 鏡頭跟著玩家，但不超出地圖
    cam.y = vh >= H ? (H - vh) / 2 : Math.min(Math.max(P.y - vh / 2, 0), H - vh);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = playing ? B[game.tgt] : null;
    const eb = playing && game.errand && !game.errand.done ? B[game.errand.b] : null;

    drawGround();
    drawBuildings(target, eb);
    drawStations();
    drawPeople();
    if (target) drawArrow(target);
    if (game.rain && playing) drawRain();
    drawMinimap(target, eb);

    const j = input.joy;
    if (j && j.on) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(j.ox, j.oy, 34, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(j.ox + j.dx * 34, j.oy + j.dy * 34, 14, 0, 7); ctx.fill(); }
  }

  return { draw, resize };
}

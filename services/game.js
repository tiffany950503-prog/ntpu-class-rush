// 遊戲流程：一場遊戲的所有狀態和規則都在這裡。
// 這個檔案不碰畫面，要通知畫面時呼叫 emit('toast' | 'change' | 'end')。

import { WALK, BIKE_ROAD, BIKE_GRASS, NPC_WALK, NPC_RIDE, H_PATROL, DETECT, LOSE, REACH, LEVELS, DEFAULT_LEVEL, ERRAND_SCORE, CLASS_SCORE, SECOND_SCORE } from '../domain/config.js';
import { grid, idx, ROAD, solid, BUILDINGS, B, STATION_DEF, WAYPOINTS, START } from '../domain/campus.js';
import { bfs, field, stepAgent } from './pathfinding.js';
import { buildSchedule } from './schedule.js';

const NPC_COLORS = ['#7C8FA6', '#9A8FB5', '#8FAF9C', '#B59A8F', '#8FA6B5', '#A6A08F', '#B58FA3', '#8FB5AE'];
const HUNTERS = [{ x: 45.5, y: 18.5, tag: '問卷' }, { x: 53.5, y: 27.5, tag: '社團招生' }, { x: 13.5, y: 18.5, tag: '推銷' }];

export function createGame({ rnd = Math.random, emit = () => {} } = {}) {
  const pick = a => a[(rnd() * a.length) | 0];
  const randStation = except => { let s; do { s = pick(g.stations); } while (s === except); return s; };
  const randDoor = () => { const b = pick(BUILDINGS); return { x: b.door[0], y: b.door[1] }; };
  let pField = null, pFieldT = 0, pFieldKey = -1, doorWarn = 0;

  const g = {
    state: 'menu',            // 'menu' | 'play' | 'end'
    level: LEVELS[DEFAULT_LEVEL],
    clock: 0,
    player: null, stations: [], npcs: [], hunters: [],
    schedule: [], cur: 0, tgt: null, timeLeft: 0, limit: 1,
    attended: [], score: 0, errand: null, move: null, rain: false, errandsDone: 0,
    reset, start, update, interact, nearStation,
  };

  function reset() {
    const D = g.level;
    g.stations = STATION_DEF.map(([name, x, y, cap, bikes]) => ({ name, x, y, cap, bikes: Math.max(0, Math.min(cap - 1, bikes + D.stock)) }));
    g.player = { x: START.x, y: START.y, dx: 0, dy: 1, riding: false, frozen: 0, broken: false, boost: 0 };
    g.npcs = [];
    for (let i = 0; i < D.npc; i++) { const d = randDoor(); g.npcs.push({ x: d.x + 0.5, y: d.y + 0.5, dx: 0, dy: 1, tx: null, fin: false, state: 'idle', wait: rnd() * 6, riding: false, goal: d, color: NPC_COLORS[i % NPC_COLORS.length] }); }
    g.hunters = HUNTERS.slice(0, D.hunters).map(h => ({ ...h, dx: 0, dy: 1, tx: null, fin: false, mode: 'patrol', goal: pick(WAYPOINTS), cool: 0, chaseT: 0 }));
    g.schedule = buildSchedule(rnd);
    g.attended = []; g.score = 0; g.cur = 0; g.tgt = g.schedule[0].b; g.timeLeft = 0; g.limit = 1;
    g.errand = null; g.move = null; g.rain = false; g.errandsDone = 0;
  }

  function start(levelKey) {
    g.level = LEVELS[levelKey] || LEVELS[DEFAULT_LEVEL];
    reset(); g.state = 'play'; startClass(0);
    emit('toast', '第一堂在' + B[g.tgt].name + '，先找車！');
  }

  function startClass(i) {
    const D = g.level, P = g.player, c = g.schedule[i], b = B[c.b];
    g.cur = i; g.tgt = c.b;
    g.errand = c.errand ? { ...c.errand, done: false } : null;
    g.move = D.move && c.move ? { ...c.move, done: false } : null;
    const wasRain = g.rain; g.rain = rnd() < D.rain;
    if (g.rain && !wasRain) g.stations.forEach(s => { if (s.bikes > 0 && rnd() < 0.6) s.bikes--; });   // 一下雨車就被搶
    const d = field(b.door[0], b.door[1])[idx(Math.floor(P.x), Math.floor(P.y))];
    g.limit = Math.max(10, (d < 0 ? 40 : d) / WALK * (c.k + D.k));                                     // 時限 = 走路秒數 × 倍率
    g.timeLeft = g.limit;
    emit('change');
  }

  function finishClass(ok) {
    g.attended[g.cur] = ok;
    if (ok) { const pts = CLASS_SCORE + Math.ceil(g.timeLeft) * SECOND_SCORE; g.score += pts; emit('toast', '準時進教室！+' + pts); }
    else emit('toast', '點名沒到…這堂記曠課');
    if (g.cur + 1 < g.schedule.length) startClass(g.cur + 1);
    else { g.state = 'end'; emit('change'); emit('end'); }
  }

  function nearStation() {
    const P = g.player; let best = null, bd = REACH;
    for (const s of g.stations) { const d = Math.hypot(s.x + 0.5 - P.x, s.y + 0.5 - P.y); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  function interact() {                                       // 借車或還車
    const P = g.player;
    if (g.state !== 'play' || P.frozen > 0) return;
    const s = nearStation();
    if (!s) { emit('toast', P.riding ? '要到站點才能還車' : '附近沒有站點'); return; }
    if (P.riding) {
      if (s.bikes < s.cap) { s.bikes++; P.riding = false; P.broken = false; emit('toast', '已還車：' + s.name); }
      else emit('toast', s.name + '車位滿了，換一站！');
    } else {
      if (s.bikes > 0) { s.bikes--; P.riding = true; P.broken = rnd() < g.level.broken; emit('toast', P.broken ? '這台掉鏈了，騎不快！可以回站換一台' : '借到車了'); }
      else emit('toast', s.name + '沒車了，換一站或用跑的');
    }
  }

  function blocked(x, y) { const r = 0.3; return solid(Math.floor(x - r), Math.floor(y - r)) || solid(Math.floor(x + r), Math.floor(y - r)) || solid(Math.floor(x - r), Math.floor(y + r)) || solid(Math.floor(x + r), Math.floor(y + r)); }

  function updatePlayer(dt, dir) {
    const P = g.player;
    if (P.frozen > 0) { P.frozen -= dt; return; }
    let mx = dir.x, my = dir.y;
    const m = Math.hypot(mx, my); if (m < 0.01) return;
    mx /= m; my /= m; P.dx = mx; P.dy = my;
    const t = grid[idx(Math.floor(P.x), Math.floor(P.y))];
    const sp = P.riding
      ? (t === ROAD ? BIKE_ROAD : BIKE_GRASS * (g.rain ? 0.8 : 1)) * (P.broken ? 0.6 : 1)
      : WALK * (g.rain ? 0.88 : 1) * (P.boost ? 1.15 : 1);
    const nx = P.x + mx * sp * dt, ny = P.y + my * sp * dt;
    if (!blocked(nx, P.y)) P.x = nx;
    if (!blocked(P.x, ny)) P.y = ny;
  }

  // 其他學生：走去站點借車 → 騎到另一站還車 → 走去某棟樓 → 發呆，一直循環。
  function updateNpc(n, dt) {
    if (n.state === 'idle') { n.wait -= dt; if (n.wait <= 0) { n.state = 'toStn'; n.goal = randStation(); n.tx = null; } return; }
    if (!stepAgent(n, field(n.goal.x, n.goal.y), n.riding ? NPC_RIDE : NPC_WALK, dt)) return;
    const s = n.goal;
    if (n.state === 'toStn') { if (s.bikes > 0) { s.bikes--; n.riding = true; n.state = 'ride'; } n.goal = randStation(s); }
    else if (n.state === 'ride') { if (s.bikes < s.cap) { s.bikes++; n.riding = false; n.state = 'toDoor'; n.goal = randDoor(); } else n.goal = randStation(s); }
    else { n.state = 'idle'; n.wait = 3 + rnd() * 6; }
  }

  function playerField() {
    const P = g.player, k = idx(Math.floor(P.x), Math.floor(P.y));
    if (!pField || (k !== pFieldKey && g.clock - pFieldT > 0.2)) { pField = bfs(Math.floor(P.x), Math.floor(P.y)); pFieldKey = k; pFieldT = g.clock; }
    return pField;
  }

  // 追人者：平常在路口間巡邏，玩家進到發現距離就追，追到會把玩家卡住幾秒。
  function updateHunter(h, dt) {
    const P = g.player, D = g.level;
    h.cool = Math.max(0, h.cool - dt);
    const d = Math.hypot(h.x - P.x, h.y - P.y), live = g.state === 'play';
    if (live && h.mode !== 'chase' && h.cool <= 0 && P.frozen <= 0 && d < DETECT) { h.mode = 'chase'; h.chaseT = 0; h.tx = null; }
    if (h.mode === 'chase') {
      h.chaseT += dt;
      if (!live || d > LOSE || h.chaseT > 9) { h.mode = 'patrol'; h.goal = pick(WAYPOINTS); h.tx = null; h.cool = 2; }
      else if (d < 0.75) { P.frozen = D.freeze; h.mode = 'patrol'; h.goal = pick(WAYPOINTS); h.tx = null; h.cool = 9; emit('toast', '被' + h.tag + '的學長姐攔下…卡 ' + D.freeze + ' 秒'); return; }
      else { stepAgent(h, playerField(), D.chase, dt); return; }
    }
    if (stepAgent(h, field(h.goal.x, h.goal.y), H_PATROL, dt)) h.goal = pick(WAYPOINTS);
  }

  // 每一幀呼叫一次。dir 是玩家想移動的方向 {x, y}。
  function update(dt, dir = { x: 0, y: 0 }) {
    g.clock += dt;
    g.npcs.forEach(n => updateNpc(n, dt));
    g.hunters.forEach(h => updateHunter(h, dt));
    if (g.state !== 'play') return;
    const P = g.player;
    updatePlayer(dt, dir);
    g.timeLeft -= dt;
    const ptx = Math.floor(P.x), pty = Math.floor(P.y);

    if (g.errand && !g.errand.done) {
      const e = B[g.errand.b];
      if (ptx === e.door[0] && pty === e.door[1]) {
        g.errand.done = true; g.errandsDone++; g.score += ERRAND_SCORE;
        if (g.errand.perk === 'boost') P.boost = 1;
        emit('toast', g.errand.perk === 'boost' ? '買到早餐，今天走路變快！+' + ERRAND_SCORE : '順路任務完成！+' + ERRAND_SCORE);
        emit('change');
      }
    }
    if (g.move && !g.move.done && g.timeLeft < g.limit * 0.55) {
      g.move.done = true; g.tgt = g.move.to; g.timeLeft += g.move.extra;
      emit('toast', '公告：臨時換教室，改到' + B[g.tgt].name + '！'); emit('change');
    }

    const b = B[g.tgt];
    if (ptx === b.door[0] && pty === b.door[1]) {
      if (!P.riding) { finishClass(true); return; }
      if (g.clock - doorWarn > 2) { doorWarn = g.clock; emit('toast', '車不能牽進教室，先去還車！'); }
    }
    if (g.timeLeft <= 0) finishClass(false);
  }

  reset();
  return g;
}

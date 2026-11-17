// 校園地圖資料：參考臺北大學三峽校區平面圖排出的格子地圖。
// 這裡只有「校園長什麼樣子」，沒有任何遊戲流程。

export const W = 64, H = 40;
export const GRASS = 0, ROAD = 1, BLD = 2, DOOR = 3, WATER = 4, TREE = 5, STN = 6, FIELD = 7;

export const grid = new Uint8Array(W * H);
export const idx = (x, y) => y * W + x;
const fill = (x, y, w, h, t) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) grid[idx(i, j)] = t; };

export const ROADS = [                                         // [x, y, 寬, 高]
  [0, 0, 64, 2], [0, 17, 64, 2], [0, 35, 64, 2], [36, 8, 26, 2], [12, 26, 50, 2],
  [1, 0, 2, 37], [12, 0, 2, 37], [22, 0, 2, 37], [36, 0, 2, 37], [44, 0, 2, 37], [52, 0, 2, 37], [60, 0, 2, 37],
];

export const FIELDS = [                                        // 可以走進去的球場
  { name: '田徑場', x: 4, y: 20, w: 7, h: 8, kind: 'track' },
  { name: '排球場', x: 4, y: 30, w: 7, h: 4, kind: 'court' },
  { name: '棒壘球場', x: 15, y: 20, w: 6, h: 5, kind: 'dirt' },
  { name: '籃球場', x: 46, y: 3, w: 6, h: 4, kind: 'court' },
];

export const BUILDINGS = [
  { id: 'dorm',  name: '學生宿舍',     x: 25, y: 29, w: 5, h: 4, door: [27, 29], color: '#E9C9A8' },
  { id: 'dorm2', name: '第二期宿舍',   x: 25, y: 20, w: 4, h: 4, door: [27, 23], color: '#EBD3B8' },
  { id: 'wood',  name: '木師基地',     x: 27, y: 6,  w: 5, h: 3, door: [29, 8],  color: '#D9C3A0' },
  { id: 'gym',   name: '綜合體育館',   x: 15, y: 29, w: 6, h: 5, door: [18, 29], color: '#F0D58A' },
  { id: 'topco', name: '崇越館',       x: 38, y: 3,  w: 5, h: 4, door: [40, 6],  color: '#C4CBD6' },
  { id: 'hum',   name: '人文大樓',     x: 54, y: 3,  w: 6, h: 4, door: [57, 6],  color: '#D9BFE3' },
  { id: 'soc',   name: '社會科學大樓', x: 38, y: 11, w: 6, h: 5, door: [41, 15], color: '#F2B8A8' },
  { id: 'admin', name: '行政大樓',     x: 46, y: 11, w: 6, h: 5, door: [49, 15], color: '#D8D2C4' },
  { id: 'biz',   name: '商學大樓',     x: 54, y: 11, w: 6, h: 5, door: [57, 15], color: '#E7A08C' },
  { id: 'lib',   name: '圖書資訊大樓', x: 38, y: 20, w: 6, h: 5, door: [41, 20], color: '#B9C6E8' },
  { id: 'eecs',  name: '電機資訊大樓', x: 38, y: 29, w: 6, h: 5, door: [41, 29], color: '#A9D6D2' },
  { id: 'pub',   name: '公共事務大樓', x: 46, y: 29, w: 6, h: 5, door: [49, 29], color: '#C9D8B0' },
  { id: 'law',   name: '法學大樓',     x: 54, y: 29, w: 6, h: 5, door: [57, 29], color: '#C8B8D8' },
];
export const B = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));

export const LAKE = { name: '心湖', x: 30, y: 20, w: 5, h: 5 };
export const GATE = { name: '大門', x: 63, y: 16.4 };

// [站名, x, y, 車位數, 一開始有幾台車]
export const STATION_DEF = [
  ['大門站', 62, 20, 6, 4], ['大學路站', 62, 12, 4, 2], ['人文站', 55, 7, 3, 2], ['社科站', 39, 16, 4, 2],
  ['圖資站', 43, 19, 5, 3], ['公事站', 51, 28, 4, 2], ['法學站', 59, 28, 3, 1], ['國際二街站', 35, 37, 5, 2],
  ['宿舍站', 32, 28, 6, 5], ['體育館站', 21, 28, 4, 3], ['恩主公站', 3, 34, 4, 2],
];

export const START = { x: 27.5, y: 28.5 };                     // 學生宿舍門口

// 追人者巡邏會經過的路口
export const WAYPOINTS = [];
[1, 12, 22, 36, 44, 52, 60].forEach(x => [[17, 0], [26, 12], [8, 36], [35, 0]].forEach(([y, minX]) => { if (x >= minX) WAYPOINTS.push({ x: x + 1, y: y + 1 }); }));

/* ---- 把上面的資料畫進格子 ---- */
ROADS.forEach(r => fill(r[0], r[1], r[2], r[3], ROAD));
FIELDS.forEach(f => fill(f.x, f.y, f.w, f.h, FIELD));
BUILDINGS.forEach(b => { fill(b.x, b.y, b.w, b.h, BLD); grid[idx(b.door[0], b.door[1])] = DOOR; });
fill(LAKE.x, LAKE.y, LAKE.w, LAKE.h, WATER);
STATION_DEF.forEach(s => { grid[idx(s[1], s[2])] = STN; });

// 樹用固定種子隨機種，而且只種在四周都是草地的格子，所以不會把路堵死。
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mapRng = mulberry(11);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (grid[idx(x, y)] !== GRASS) continue;
  let clear = true;
  for (let j = -1; j <= 1 && clear; j++) for (let i = -1; i <= 1; i++) {
    const nx = x + i, ny = y + j;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    if (grid[idx(nx, ny)] !== GRASS) { clear = false; break; }
  }
  if (clear && mapRng() < 0.13) grid[idx(x, y)] = TREE;
}

export const solidT = t => t === BLD || t === WATER || t === TREE;
export const solid = (x, y) => x < 0 || y < 0 || x >= W || y >= H || solidT(grid[idx(x, y)]);

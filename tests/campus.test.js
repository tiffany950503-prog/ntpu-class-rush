import test from 'node:test';
import assert from 'node:assert/strict';
import { W, H, grid, idx, DOOR, STN, BUILDINGS, STATION_DEF, WAYPOINTS, START, solid } from '../domain/campus.js';
import { bfs, steps } from '../services/pathfinding.js';

const startTile = [Math.floor(START.x), Math.floor(START.y)];

test('起點站得住人', () => {
  assert.equal(solid(...startTile), false);
});

test('每棟樓的門都在地圖內，而且從宿舍走得到', () => {
  for (const b of BUILDINGS) {
    const [x, y] = b.door;
    assert.ok(x >= 0 && y >= 0 && x < W && y < H, b.name);
    assert.equal(grid[idx(x, y)], DOOR, b.name + ' 的門被別的東西蓋掉了');
    assert.ok(steps(startTile, b.door) > 0, b.name + ' 走不到');
  }
});

test('每個站點都走得到，車數不超過車位數', () => {
  for (const [name, x, y, cap, bikes] of STATION_DEF) {
    assert.equal(grid[idx(x, y)], STN, name);
    assert.ok(steps(startTile, [x, y]) > 0, name + ' 走不到');
    assert.ok(bikes >= 0 && bikes <= cap, name + ' 的車數不合理');
  }
});

test('巡邏路口都在可以走的格子上', () => {
  for (const p of WAYPOINTS) assert.equal(solid(p.x, p.y), false, JSON.stringify(p));
});

test('地圖沒有被隔開的區域', () => {
  const f = bfs(...startTile);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!solid(x, y)) assert.ok(f[idx(x, y)] >= 0, `(${x}, ${y}) 走不到`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { B } from '../domain/campus.js';
import { CLASSROOMS, SLOTS, MOVE_SLOT } from '../domain/timetable.js';
import { buildSchedule } from '../services/schedule.js';

// 固定種子的亂數，測試每次跑結果都一樣
function seeded(a) { return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

test('排出五堂不同教室的課，課名對得上那棟樓', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const s = buildSchedule(seeded(seed));
    assert.equal(s.length, SLOTS.length);
    assert.equal(new Set(s.map(c => c.b)).size, s.length, '教室重複了');
    for (const c of s) assert.ok(CLASSROOMS[c.b].includes(c.course), c.course + ' 不是 ' + c.b + ' 的課');
  }
});

test('順路任務不會排在目標教室，換教室不會換回原教室', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const s = buildSchedule(seeded(seed));
    s.forEach((c, i) => {
      if (c.errand) { assert.ok(B[c.errand.b], '任務地點不存在'); assert.notEqual(c.errand.b, c.b); }
      if (c.move) { assert.equal(i, MOVE_SLOT); assert.ok(B[c.move.to]); assert.notEqual(c.move.to, c.b); }
    });
  }
});

test('不同種子會排出不同順序', () => {
  const orders = new Set();
  for (let seed = 1; seed <= 20; seed++) orders.add(buildSchedule(seeded(seed)).map(c => c.b).join());
  assert.ok(orders.size > 5);
});

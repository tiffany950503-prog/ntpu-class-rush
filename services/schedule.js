// 排課：每場遊戲隨機排出一天五堂課，連同順路任務和臨時換教室。

import { B } from '../domain/campus.js';
import { CLASSROOMS, SLOTS, ERRANDS, BREAKFAST, HOME, MIN_LEG, MOVE_SLOT, MOVE_EXTRA } from '../domain/timetable.js';
import { steps } from './pathfinding.js';

const doorDist = (a, b) => steps(B[b].door, B[a].door);

export function buildSchedule(rnd = Math.random) {
  const pick = a => a[(rnd() * a.length) | 0];
  const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // 抽五棟不重複的教室，相鄰兩堂要夠遠；抽不到合格的就用最後一次抽的。
  const ids = Object.keys(CLASSROOMS); let order = [];
  for (let tries = 0; tries < 200; tries++) {
    order = shuffled(ids).slice(0, SLOTS.length);
    let ok = doorDist(HOME, order[0]) >= MIN_LEG;
    for (let i = 1; i < order.length && ok; i++) ok = doorDist(order[i - 1], order[i]) >= MIN_LEG;
    if (ok) break;
  }

  const pool = shuffled(ERRANDS).map(e => ({ ...e }));
  return order.map((b, i) => {
    const c = { t: SLOTS[i][0], k: SLOTS[i][1], b, course: pick(CLASSROOMS[b]) }, prev = i ? order[i - 1] : HOME;
    if (i === 0) { if (b !== BREAKFAST.b) c.errand = { ...BREAKFAST }; }            // 第一堂前買早餐
    else if (i === MOVE_SLOT) {                                                      // 換到離原教室最近的另一棟
      const near = ids.filter(x => x !== b && x !== prev).sort((p, q) => doorDist(b, p) - doorDist(b, q))[0];
      c.move = { to: near, extra: MOVE_EXTRA };
    }
    else if (i !== SLOTS.length - 1) {                                               // 最後一堂不排任務
      const e = pool.find(e => e.b !== b && e.b !== prev && !e.used);
      if (e) { e.used = true; c.errand = { b: e.b, text: e.text }; }
    }
    return c;
  });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { B } from '../domain/campus.js';
import { LEVELS } from '../domain/config.js';
import { createGame } from '../services/game.js';
import { createSettingsRepository } from '../repositories/settingsRepository.js';

function seeded(a) { return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }
function newGame(level = 'easy') {
  const events = [];
  const game = createGame({ rnd: seeded(7), emit: (type, payload) => events.push([type, payload]) });
  game.start(level);
  return { game, events };
}
const standAt = (game, s) => { game.player.x = s.x + 0.5; game.player.y = s.y + 0.5; };

test('開始後是遊戲中狀態，時限是正的', () => {
  const { game } = newGame();
  assert.equal(game.state, 'play');
  assert.ok(game.timeLeft > 0);
  assert.equal(game.hunters.length, LEVELS.easy.hunters);
});

test('借車會讓站點少一台，還車會加回去', () => {
  const { game } = newGame();
  const s = game.stations.find(x => x.bikes > 0 && x.bikes < x.cap);
  standAt(game, s);
  const before = s.bikes;
  game.interact();
  assert.equal(game.player.riding, true);
  assert.equal(s.bikes, before - 1);
  game.interact();
  assert.equal(game.player.riding, false);
  assert.equal(s.bikes, before);
});

test('站點沒車借不到，車位滿了還不了', () => {
  const { game } = newGame();
  const s = game.stations[0];
  standAt(game, s);
  s.bikes = 0; game.interact();
  assert.equal(game.player.riding, false);
  game.player.riding = true; s.bikes = s.cap; game.interact();
  assert.equal(game.player.riding, true);
});

test('走到教室門口算出席；騎著車到門口不算', () => {
  const { game } = newGame();
  const door = B[game.tgt].door;
  game.player.x = door[0] + 0.5; game.player.y = door[1] + 0.5;
  game.player.riding = true;
  game.update(0.01);
  assert.equal(game.attended[0], undefined);
  game.player.riding = false;
  game.update(0.01);
  assert.equal(game.attended[0], true);
  assert.equal(game.cur, 1);
  assert.ok(game.score >= 100);
});

test('時間到沒進教室記曠課，五堂都過完遊戲結束', () => {
  const { game, events } = newGame();
  for (let i = 0; i < 5; i++) { game.timeLeft = 0.001; game.update(0.01); }
  assert.deepEqual(game.attended, [false, false, false, false, false]);
  assert.equal(game.state, 'end');
  assert.ok(events.some(([type]) => type === 'end'));
});

test('難度設定讀寫；儲存壞掉時用預設值', () => {
  const data = {};
  const repo = createSettingsRepository({ getItem: k => data[k] ?? null, setItem: (k, v) => { data[k] = v; } });
  assert.equal(repo.loadLevel(['easy', 'normal'], 'normal'), 'normal');
  repo.saveLevel('easy');
  assert.equal(repo.loadLevel(['easy', 'normal'], 'normal'), 'easy');
  const broken = createSettingsRepository(null);
  assert.equal(broken.loadLevel(['easy'], 'easy'), 'easy');
  broken.saveLevel('easy');
});

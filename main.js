// 進入點：把各個模組接起來，然後開始跑遊戲迴圈。

import { LEVELS, DEFAULT_LEVEL } from './domain/config.js';
import { createGame } from './services/game.js';
import { createSettingsRepository, browserStorage } from './repositories/settingsRepository.js';
import { createHud } from './ui/hud.js';
import { createInput } from './ui/input.js';
import { createRenderer } from './ui/renderer.js';

const settings = createSettingsRepository(browserStorage());
let levelKey = settings.loadLevel(Object.keys(LEVELS), DEFAULT_LEVEL);

// 遊戲只會說「發生了什麼事」，畫面要怎麼反應在這裡決定。
let hud;
const game = createGame({
  emit(type, payload) {
    if (type === 'toast') hud.toast(payload);
    else if (type === 'change') hud.renderClass();
    else if (type === 'end') hud.showResult();
  },
});

function startGame() { hud.hide(); game.start(levelKey); }

hud = createHud(game, {
  getLevel: () => levelKey,
  onLevel: key => { levelKey = key; settings.saveLevel(key); },
  onStart: startGame,
  onAction: () => game.interact(),
});

const canvas = document.getElementById('c');
const input = createInput(canvas, { isPlaying: () => game.state === 'play', onAction: () => game.interact(), onStart: startGame });
const renderer = createRenderer(canvas, document.getElementById('stage'), game, input);

hud.renderClass();
hud.showMenu();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  game.update(dt, input.dir());
  hud.tick();
  renderer.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

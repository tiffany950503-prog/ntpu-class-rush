// 輸入：鍵盤和觸控搖桿。只負責回報「玩家想往哪走」和「按了什麼」。

const MOVE = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);

export function createInput(canvas, { isPlaying, onAction, onStart }) {
  const keys = new Set();
  const input = { joy: null, dir };

  function dir() {
    if (input.joy && input.joy.on) return { x: input.joy.dx, y: input.joy.dy };
    let x = 0, y = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
    return { x, y };
  }

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!isPlaying()) { if (e.code === 'Enter') { e.preventDefault(); onStart(); } return; }
    if (MOVE.has(e.code)) { keys.add(e.code); e.preventDefault(); }
    else if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) onAction(); }
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  // 在地圖上按住拖曳 = 搖桿
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect();
    input.joy = { id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, dx: 0, dy: 0, on: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', e => {
    const j = input.joy; if (!j || j.id !== e.pointerId) return;
    const r = canvas.getBoundingClientRect(), dx = e.clientX - r.left - j.ox, dy = e.clientY - r.top - j.oy, d = Math.hypot(dx, dy);
    if (d > 8) { j.on = true; j.dx = dx / d; j.dy = dy / d; } else j.on = false;
  });
  const end = e => { if (input.joy && input.joy.id === e.pointerId) input.joy = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  return input;
}

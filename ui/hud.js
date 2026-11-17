// 地圖以外的畫面：上方計分列、提示訊息、開始和結算卡片、下方車位表。

import { LEVELS } from '../domain/config.js';
import { B } from '../domain/campus.js';

const $ = id => document.getElementById(id);

export function createHud(game, { getLevel, onLevel, onStart, onAction }) {
  const $overlay = $('overlay'), $card = $('card'), $course = $('course'), $place = $('place'), $time = $('time'), $bar = $('bar');
  const $mode = $('mode'), $pips = $('pips'), $act = $('act'), $toast = $('toast'), $list = $('stnList'), $side = $('side');
  let toastT = 0, listSig = '', hudT = 0;

  function levelPicker() {
    return '<div class="levels" role="radiogroup" aria-label="難度">' + Object.keys(LEVELS).map(k =>
      '<button type="button" class="lv" role="radio" data-lv="' + k + '" aria-checked="' + (k === getLevel()) + '"><b>' + LEVELS[k].name + '</b><small>' + LEVELS[k].desc + '</small></button>').join('') + '</div>';
  }

  function toast(msg) { $toast.textContent = msg; $toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => $toast.classList.remove('show'), 2000); }

  function renderPips() {
    $pips.innerHTML = game.schedule.map((c, i) => {
      const a = game.attended[i], cls = a === true ? 'ok' : a === false ? 'miss' : (i === game.cur && game.state === 'play' ? 'cur' : '');
      return '<li class="' + cls + '" title="' + c.course + '">' + (a === true ? '✓' : a === false ? '✕' : '') + '</li>';
    }).join('');
  }

  // 課程、教室、順路任務這些不常變的資訊，遊戲說「變了」才重畫。
  function renderClass() {
    renderPips();
    if (game.state === 'menu') return;
    const c = game.schedule[game.cur], parts = [];
    $course.textContent = c.course; $place.textContent = c.t + ' ' + B[game.tgt].name;
    if (game.rain) parts.push('雨天：走路變慢、草地打滑，車也被搶走一些');
    if (game.errand) parts.push(game.errand.done ? '順路任務完成' : '順路任務：' + game.errand.text + '（藍色門口）+150 分');
    if (game.player.boost) parts.push('吃過早餐：走路加速');
    $side.textContent = parts.join('　·　'); $side.hidden = !parts.length;
  }

  // 倒數、借還車按鈕、車位表，每一幀都看一下。
  function tick() {
    const P = game.player, playing = game.state === 'play';
    if (playing) {
      $time.textContent = Math.max(0, game.timeLeft).toFixed(1); $time.classList.toggle('low', game.timeLeft < 5);
      $bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, game.timeLeft / game.limit)) + ')';
    }
    const s = playing ? game.nearStation() : null;
    $mode.textContent = P.riding ? (P.broken ? '故障車' : '騎車中') : '步行'; $mode.classList.toggle('ride', P.riding);
    const label = P.riding ? '還車' : '借車';
    if ($act.textContent !== label) $act.textContent = label;
    $act.disabled = !(s && (P.riding ? s.bikes < s.cap : s.bikes > 0));
    if (game.clock - hudT < 0.2) return; hudT = game.clock;
    const sig = game.stations.map(x => x.bikes).join() + '|' + (s ? s.name : '');
    if (sig === listSig) return; listSig = sig;
    $list.innerHTML = game.stations.map(x => {
      let d = ''; for (let i = 0; i < x.cap; i++) d += '<i' + (i < x.bikes ? ' class="b"' : '') + '></i>';
      return '<li' + (x === s ? ' class="near"' : '') + '><span class="sn">' + x.name + '</span><span class="docks">' + d + '</span><span class="num">車 ' + x.bikes + '・空 ' + (x.cap - x.bikes) + '</span></li>';
    }).join('');
  }

  function showMenu() {
    $card.innerHTML = '<h2>下課只有二十幾秒，教室在校園另一頭</h2><ul><li>用走的很勉強，借 YouBike 才穩。</li><li>進教室前，車得還進<strong>有空位</strong>的站。</li><li>其他學生也在借車還車，車位隨時在變。</li><li>拿問卷的學長姐看到你會追上來，被攔下會卡住幾秒。</li><li>藍色門口是順路任務（買早餐、還書），繞過去有加分。</li></ul><p class="sub">一天 5 堂課，先選難度：</p>' + levelPicker() + '<button class="btn" id="go" type="button">開始第一堂課</button>';
    $overlay.hidden = false;
  }

  function showResult() {
    const n = game.attended.filter(Boolean).length;
    const verdict = n === 5 ? '全勤，教授記得你的臉了' : n === 4 ? '安全過關' : n === 3 ? '低空飛過，再曠就危險' : '出席率不足，這學期被當';
    $card.innerHTML = '<h2>' + verdict + '</h2><div class="big">' + n + ' / ' + game.schedule.length + ' 堂</div><p class="sub">總分 ' + game.score + '。難度「' + game.level.name + '」，完成 ' + game.errandsDone + ' 個順路任務。</p>' + levelPicker() + '<button class="btn" id="go" type="button">再跑一天</button>';
    $overlay.hidden = false; $('go').focus();
  }

  const hide = () => { $overlay.hidden = true; };

  $act.addEventListener('click', () => { onAction(); $act.blur(); });
  $overlay.addEventListener('click', e => {
    const lv = e.target.closest('.lv');
    if (lv) { onLevel(lv.dataset.lv); $card.querySelectorAll('.lv').forEach(x => x.setAttribute('aria-checked', String(x === lv))); return; }
    if (e.target.id === 'go') onStart();
  });

  return { toast, renderClass, tick, showMenu, showResult, hide };
}

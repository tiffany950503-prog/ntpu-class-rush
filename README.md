# 趕課大作戰

2D 俯視網頁遊戲。地圖參考臺北大學三峽校區，在限時內借還 YouBike、躲開問卷學長姐，趕上每天隨機排出的五堂課。

## 怎麼玩
- 移動：WASD 或方向鍵，手機在地圖上拖曳
- 借車／還車：E 或空白鍵，手機按右下角按鈕
- 進教室前要先把車還進有空位的站

## 資料夾各自負責什麼

| 位置 | 責任 | 裡面有什麼 |
|---|---|---|
| `domain/` | 遊戲世界的資料和數值，不含流程 | `campus.js` 校園地圖、`timetable.js` 課程和順路任務、`config.js` 速度和三種難度 |
| `services/` | 遊戲怎麼運作 | `game.js` 一場遊戲的狀態和規則、`schedule.js` 隨機排課、`pathfinding.js` 找路 |
| `repositories/` | 資料存在哪、怎麼讀寫 | `settingsRepository.js` 把上次選的難度存進瀏覽器 |
| `ui/` | 玩家看到和操作的東西 | `renderer.js` 畫地圖、`hud.js` 計分列和卡片、`input.js` 鍵盤和觸控、`style.css` 樣式 |
| `tests/` | 自動測試 | 地圖走不走得通、排課規則、借還車和出席判定 |
| `main.js` | 進入點 | 把上面的模組接起來，啟動遊戲迴圈 |
| `index.html` | 網頁骨架 | 載入 `ui/style.css` 和 `main.js` |

相依方向只有一種：`ui` → `services` → `domain`。`domain` 不知道其他資料夾存在，`services` 不碰畫面，要通知畫面時只送出事件（`toast`、`change`、`end`），由 `main.js` 決定畫面怎麼反應。

### 想改東西時去哪找
- 調難度、速度、分數：`domain/config.js`
- 搬建築、加站點、改站點車數：`domain/campus.js`
- 加課程或順路任務：`domain/timetable.js`
- 改規則（例如被攔下的處罰、下雨的效果）：`services/game.js`
- 改顏色和畫法：`ui/renderer.js`、`ui/style.css`

## 在自己電腦上跑
程式拆成多個檔案後，直接點兩下 `index.html` 會打不開（瀏覽器不讓本機檔案互相載入），要先開一個本機伺服器：

```bash
python3 -m http.server 8000
```

然後用瀏覽器開 `http://localhost:8000`。放在 GitHub Pages 上則不需要這一步。

## 跑測試
需要 Node.js 20 以上，不用安裝任何套件：

```bash
npm test
```

非官方作品，與國立臺北大學及 YouBike 無關。

// 遊戲規則的數值：速度、距離、三種難度。要調難度只改這個檔案。

export const WALK = 2.0, BIKE_ROAD = 6.4, BIKE_GRASS = 4.0;   // 每秒幾格
export const NPC_WALK = 1.8, NPC_RIDE = 4.6;
export const H_PATROL = 1.6, DETECT = 4.5, LOSE = 8;           // 追人者：巡邏速度、發現距離、放棄距離
export const REACH = 2.0;                                      // 離站點幾格內可以借還車
export const M_PER_TILE = 5;                                   // 畫面上顯示距離用：一格當 5 公尺
export const ERRAND_SCORE = 150, CLASS_SCORE = 100, SECOND_SCORE = 10;

export const LEVELS = {
  easy:   { name: '輕鬆', desc: '時間多、車多，只有一個人追你', k: 0.25,  npc: 3, hunters: 1, chase: 1.85, freeze: 1.5, stock: 1,  broken: 0,    rain: 0,    move: false },
  normal: { name: '普通', desc: '會下雨、會借到壞車、會換教室',   k: 0,     npc: 5, hunters: 2, chase: 1.95, freeze: 2,   stock: 0,  broken: 0.15, rain: 0.3,  move: true },
  hard:   { name: '地獄', desc: '時間緊、車少，三個人追你',       k: -0.2,  npc: 9, hunters: 3, chase: 2.2,  freeze: 3,   stock: -1, broken: 0.3,  rain: 0.5,  move: true },
};
export const DEFAULT_LEVEL = 'normal';

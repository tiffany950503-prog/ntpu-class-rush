// 課表的原料：哪棟樓開哪些課、一天有哪幾節、有哪些順路任務。
// 實際「排出一天的課表」在 services/schedule.js。

export const CLASSROOMS = {
  biz: ['會計學', '經濟學', '統計學'], hum: ['大一英文', '文學概論'], law: ['民法總則', '憲法'],
  pub: ['行政學', '都市計劃'], soc: ['社會學', '社會心理學'], eecs: ['程式設計', '微積分'],
  lib: ['資訊素養'], gym: ['體育'], wood: ['木工實作'],
};

// [上課時間, 時限倍率]：倍率乘上「用走的要幾秒」就是這堂課的時限，越後面越緊。
export const SLOTS = [['08:10', 1.30], ['09:10', 1.15], ['10:20', 1.10], ['13:20', 1.05], ['15:30', 1.00]];

export const BREAKFAST = { b: 'biz', text: '去商學大樓全家買早餐', perk: 'boost' };
export const ERRANDS = [
  { b: 'admin', text: '去行政大樓郵局寄信' }, { b: 'lib', text: '去圖資大樓還書' },
  { b: 'dorm', text: '回宿舍拿忘記帶的作業' }, { b: 'topco', text: '去崇越館還球具' },
  { b: 'dorm2', text: '去二期宿舍找同學拿筆記' },
];

export const HOME = 'dorm';        // 每天從宿舍出發
export const MIN_LEG = 22;         // 連續兩堂課至少隔幾格，太近就不用趕了
export const MOVE_SLOT = 2;        // 第幾堂會臨時換教室（從 0 算）
export const MOVE_EXTRA = 4;       // 換教室多給幾秒

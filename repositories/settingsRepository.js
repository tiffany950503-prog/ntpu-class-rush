// 存取玩家設定。目前只存「上次選的難度」，放在瀏覽器的 localStorage。
// 其他程式不直接碰 localStorage，都透過這裡，之後要換儲存方式只改這個檔案。

const LEVEL_KEY = 'rush-level';

// storage 傳 window.localStorage；測試時可以傳假的。讀不到或寫不進去都不會讓遊戲壞掉。
export function createSettingsRepository(storage) {
  return {
    loadLevel(validKeys, fallback) {
      try { const v = storage.getItem(LEVEL_KEY); return validKeys.includes(v) ? v : fallback; } catch (_) { return fallback; }
    },
    saveLevel(key) {
      try { storage.setItem(LEVEL_KEY, key); } catch (_) {}
    },
  };
}

// 無痕視窗之類的情況下，連讀取 localStorage 這個屬性都可能出錯。
export function browserStorage() {
  try { return window.localStorage; } catch (_) { return null; }
}

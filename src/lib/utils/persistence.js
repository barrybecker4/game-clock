const SETTINGS_KEY = 'game-clock-settings';
const GAME_KEY = 'game-clock-game';

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse stored value:', err);
    return null;
  }
}

export function loadSettings() {
  if (typeof localStorage === 'undefined') return null;
  return safeParse(localStorage.getItem(SETTINGS_KEY));
}

export function saveSettings(settings) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings:', err);
  }
}

export function loadGame() {
  if (typeof localStorage === 'undefined') return null;
  return safeParse(localStorage.getItem(GAME_KEY));
}

export function saveGame(state) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save game:', err);
  }
}

export function clearGame() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(GAME_KEY);
}

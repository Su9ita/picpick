import { Settings, DEFAULT_SETTINGS } from '../types/settings';

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings) {
        resolve({ ...DEFAULT_SETTINGS, ...result.settings });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}

export async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ settings }, () => {
      resolve();
    });
  });
}

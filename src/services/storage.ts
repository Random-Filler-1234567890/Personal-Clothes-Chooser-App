import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  items: 'clothes-chooser:items:v1',
  outfits: 'clothes-chooser:outfits:v1',
  settings: 'clothes-chooser:settings:v1',
  seeded: 'clothes-chooser:seeded:v1',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort local persistence; ignore write failures
  }
}

export const storage = {
  keys: KEYS,
  readJson,
  writeJson,
};

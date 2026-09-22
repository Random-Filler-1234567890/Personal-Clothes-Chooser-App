import { create } from 'zustand';

import { storage } from '@/src/services/storage';
import type { AppSettings } from '@/src/types';

const DEFAULTS: AppSettings = {
  preferPants: true,
  useAiEvaluation: true,
  sockPreference: 'random',
};

interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  loaded: false,

  load: async () => {
    const settings = await storage.readJson<AppSettings>(storage.keys.settings, DEFAULTS);
    set({ ...DEFAULTS, ...settings, loaded: true });
  },

  update: async (patch) => {
    const next: AppSettings = {
      preferPants: get().preferPants,
      useAiEvaluation: get().useAiEvaluation,
      geminiApiKey: get().geminiApiKey,
      sockPreference: get().sockPreference,
      ...patch,
    };
    set(next);
    await storage.writeJson(storage.keys.settings, next);
  },
}));

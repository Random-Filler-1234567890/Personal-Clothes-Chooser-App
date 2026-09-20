import { create } from 'zustand';

import { closetSeed } from '@/src/data/closetSeed';
import { deleteImage } from '@/src/services/imageStorage';
import { storage } from '@/src/services/storage';
import type { ClothingItem, NewClothingItem } from '@/src/types';
import { todayIso } from '@/src/utils/date';
import { generateId } from '@/src/utils/id';

interface ClosetState {
  items: ClothingItem[];
  loaded: boolean;
  load: () => Promise<void>;
  addItem: (item: NewClothingItem) => Promise<ClothingItem>;
  updateItem: (id: string, patch: Partial<ClothingItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  markWorn: (ids: string[], whenIso?: string) => Promise<void>;
  resetToSeed: () => Promise<void>;
}

function materializeSeed(): ClothingItem[] {
  return closetSeed.map((item) => ({
    ...item,
    id: generateId('itm_'),
    createdAt: todayIso(),
    wearCount: 0,
    favorite: false,
    archived: false,
  }));
}

async function persist(items: ClothingItem[]) {
  await storage.writeJson(storage.keys.items, items);
}

export const useClosetStore = create<ClosetState>((set, get) => ({
  items: [],
  loaded: false,

  load: async () => {
    const seeded = await storage.readJson<boolean>(storage.keys.seeded, false);
    if (!seeded) {
      const items = materializeSeed();
      await persist(items);
      await storage.writeJson(storage.keys.seeded, true);
      set({ items, loaded: true });
      return;
    }
    const items = await storage.readJson<ClothingItem[]>(storage.keys.items, []);
    set({ items, loaded: true });
  },

  addItem: async (newItem) => {
    const item: ClothingItem = {
      ...newItem,
      id: generateId('itm_'),
      createdAt: todayIso(),
      wearCount: 0,
      favorite: newItem.favorite ?? false,
      archived: newItem.archived ?? false,
    };
    const items = [item, ...get().items];
    set({ items });
    await persist(items);
    return item;
  },

  updateItem: async (id, patch) => {
    const items = get().items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    set({ items });
    await persist(items);
  },

  removeItem: async (id) => {
    const target = get().items.find((i) => i.id === id);
    if (target?.imageUri) deleteImage(target.imageUri);
    const items = get().items.filter((i) => i.id !== id);
    set({ items });
    await persist(items);
  },

  markWorn: async (ids, whenIso) => {
    const when = whenIso ?? todayIso();
    const items = get().items.map((i) =>
      ids.includes(i.id) ? { ...i, lastWornAt: when, wearCount: i.wearCount + 1 } : i
    );
    set({ items });
    await persist(items);
  },

  resetToSeed: async () => {
    const items = materializeSeed();
    await persist(items);
    await storage.writeJson(storage.keys.seeded, true);
    set({ items });
  },
}));

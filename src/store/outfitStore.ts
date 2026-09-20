import { create } from 'zustand';

import { deleteImage } from '@/src/services/imageStorage';
import { storage } from '@/src/services/storage';
import type { Outfit } from '@/src/types';
import { todayIso } from '@/src/utils/date';
import { generateId } from '@/src/utils/id';

interface OutfitState {
  outfits: Outfit[];
  loaded: boolean;
  load: () => Promise<void>;
  addOutfit: (outfit: Omit<Outfit, 'id' | 'createdAt'>) => Promise<Outfit>;
  updateOutfit: (id: string, patch: Partial<Outfit>) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
}

async function persist(outfits: Outfit[]) {
  await storage.writeJson(storage.keys.outfits, outfits);
}

export const useOutfitStore = create<OutfitState>((set, get) => ({
  outfits: [],
  loaded: false,

  load: async () => {
    const outfits = await storage.readJson<Outfit[]>(storage.keys.outfits, []);
    set({ outfits, loaded: true });
  },

  addOutfit: async (outfit) => {
    const record: Outfit = {
      ...outfit,
      id: generateId('out_'),
      createdAt: todayIso(),
    };
    const outfits = [record, ...get().outfits];
    set({ outfits });
    await persist(outfits);
    return record;
  },

  updateOutfit: async (id, patch) => {
    const outfits = get().outfits.map((o) => (o.id === id ? { ...o, ...patch } : o));
    set({ outfits });
    await persist(outfits);
  },

  removeOutfit: async (id) => {
    const target = get().outfits.find((o) => o.id === id);
    if (target?.photoUri) deleteImage(target.photoUri);
    const outfits = get().outfits.filter((o) => o.id !== id);
    set({ outfits });
    await persist(outfits);
  },
}));

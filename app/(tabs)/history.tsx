import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ClothingImage } from '@/src/components/ClothingImage';
import { EmptyState } from '@/src/components/EmptyState';
import { TierBadge } from '@/src/components/TierBadge';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import type { ClothingItem, Outfit } from '@/src/types';
import { formatDate } from '@/src/utils/date';

export default function HistoryScreen() {
  const router = useRouter();
  const outfits = useOutfitStore((s) => s.outfits);
  const items = useClosetStore((s) => s.items);

  const sorted = useMemo(
    () => [...outfits].sort((a, b) => (b.wornOn ?? b.createdAt).localeCompare(a.wornOn ?? a.createdAt)),
    [outfits]
  );

  function itemsFor(outfit: Outfit): ClothingItem[] {
    return outfit.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is ClothingItem => !!i);
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
      data={sorted}
      keyExtractor={(o) => o.id}
      ListEmptyComponent={
        <EmptyState icon="time-outline" title="No outfits logged yet" subtitle="Generate or evaluate an outfit to start tracking." />
      }
      renderItem={({ item: outfit }) => {
        const outfitItems = itemsFor(outfit);
        const thumbUri = outfit.photoUri ?? outfitItems[0]?.imageUri;
        return (
          <Pressable style={styles.row} onPress={() => router.push(`/outfit/${outfit.id}`)}>
            <ClothingImage
              uri={thumbUri}
              fallbackIcon={outfitItems[0] ? CATEGORY_ICON[outfitItems[0].category] : 'shirt-outline'}
              style={styles.rowThumb}
              iconSize={20}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowDate}>{formatDate(outfit.wornOn ?? outfit.createdAt)}</Text>
              <Text style={styles.rowItems} numberOfLines={1}>
                {outfitItems.map((i) => i.name).join(', ') || 'No items tagged'}
              </Text>
            </View>
            {outfit.tier ? <TierBadge tier={outfit.tier} size="sm" /> : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowThumb: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
  },
  rowDate: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowItems: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});

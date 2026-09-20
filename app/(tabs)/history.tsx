import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { TierBadge } from '@/src/components/TierBadge';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import type { ClothingItem, Outfit } from '@/src/types';
import { daysSince, formatDate, formatRelative } from '@/src/utils/date';

export default function HistoryScreen() {
  const router = useRouter();
  const outfits = useOutfitStore((s) => s.outfits);
  const items = useClosetStore((s) => s.items);

  const sorted = useMemo(
    () => [...outfits].sort((a, b) => (b.wornOn ?? b.createdAt).localeCompare(a.wornOn ?? a.createdAt)),
    [outfits]
  );

  const neglected = useMemo(
    () =>
      items
        .filter((i) => !i.archived)
        .map((i) => ({ item: i, days: daysSince(i.lastWornAt) }))
        .sort((a, b) => b.days - a.days)
        .slice(0, 6),
    [items]
  );

  function itemsFor(outfit: Outfit): ClothingItem[] {
    return outfit.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is ClothingItem => !!i);
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={sorted}
      keyExtractor={(o) => o.id}
      ListHeaderComponent={
        neglected.length ? (
          <View style={styles.neglectSection}>
            <Text style={styles.sectionTitle}>Due for a rewear</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {neglected.map(({ item, days }) => (
                <Pressable
                  key={item.id}
                  style={styles.neglectCard}
                  onPress={() => router.push({ pathname: '/(tabs)/generate', params: { itemId: item.id } })}
                >
                  <View style={styles.neglectThumb}>
                    {item.imageUri ? (
                      <Image source={{ uri: item.imageUri }} style={styles.neglectThumb} contentFit="cover" />
                    ) : (
                      <Icon name={CATEGORY_ICON[item.category]} size={20} color={colors.textMuted} />
                    )}
                  </View>
                  <Text numberOfLines={1} style={styles.neglectName}>
                    {item.name}
                  </Text>
                  <Text style={styles.neglectDays}>{Number.isFinite(days) ? formatRelative(item.lastWornAt) : 'Never worn'}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.sectionTitle}>Outfit log</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState icon="clock.fill" title="No outfits logged yet" subtitle="Generate or evaluate an outfit to start tracking." />
      }
      renderItem={({ item: outfit }) => {
        const outfitItems = itemsFor(outfit);
        return (
          <Pressable style={styles.row} onPress={() => router.push(`/outfit/${outfit.id}`)}>
            <View style={styles.rowThumb}>
              {outfit.photoUri ? (
                <Image source={{ uri: outfit.photoUri }} style={styles.rowThumb} contentFit="cover" />
              ) : outfitItems[0]?.imageUri ? (
                <Image source={{ uri: outfitItems[0].imageUri }} style={styles.rowThumb} contentFit="cover" />
              ) : (
                <Icon name="tshirt.fill" size={22} color={colors.textMuted} />
              )}
            </View>
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  neglectSection: { marginBottom: spacing.sm },
  neglectCard: { width: 90, marginRight: spacing.sm },
  neglectThumb: {
    width: 90,
    height: 90,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  neglectName: { fontSize: 11, fontWeight: '600', color: colors.text, marginTop: 4 },
  neglectDays: { fontSize: 10, color: colors.textMuted },
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
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowDate: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowItems: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});

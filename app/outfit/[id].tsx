import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/src/components/EmptyState';
import { OutfitItemList } from '@/src/components/OutfitItemRow';
import { TierBadge } from '@/src/components/TierBadge';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { formatDate, todayIso } from '@/src/utils/date';

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const outfits = useOutfitStore((s) => s.outfits);
  const updateOutfit = useOutfitStore((s) => s.updateOutfit);
  const removeOutfit = useOutfitStore((s) => s.removeOutfit);
  const items = useClosetStore((s) => s.items);
  const markWorn = useClosetStore((s) => s.markWorn);

  const outfit = outfits.find((o) => o.id === id);

  if (!outfit) {
    return <EmptyState icon="clock.fill" title="Outfit not found" subtitle="It may have been deleted." />;
  }

  const currentOutfit = outfit;

  const outfitItems = currentOutfit.itemIds
    .map((itemId) => items.find((i) => i.id === itemId))
    .filter((i): i is NonNullable<typeof i> => !!i);

  async function markAsWornToday() {
    await markWorn(currentOutfit.itemIds, todayIso());
    await updateOutfit(currentOutfit.id, { wornOn: todayIso() });
  }

  function confirmDelete() {
    Alert.alert('Delete outfit?', 'This removes it from your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeOutfit(currentOutfit.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      {outfit.photoUri ? <Image source={{ uri: outfit.photoUri }} style={styles.photo} contentFit="cover" /> : null}

      <View style={styles.headerCard}>
        {outfit.tier ? <TierBadge tier={outfit.tier} size="lg" /> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{formatDate(outfit.wornOn ?? outfit.createdAt)}</Text>
          <Text style={styles.source}>
            {outfit.source === 'photo' ? 'From a photo' : outfit.source === 'generated' ? 'Generated' : 'Manual'}
            {outfit.aiEvaluated ? ' · AI evaluated' : ''}
          </Text>
        </View>
      </View>

      {outfit.tierReasoning ? <Text style={styles.reasoning}>{outfit.tierReasoning}</Text> : null}

      <Text style={styles.sectionTitle}>Items</Text>
      {outfitItems.length ? (
        <OutfitItemList items={outfitItems} />
      ) : (
        <Text style={styles.helper}>No items were tagged for this outfit.</Text>
      )}

      {!outfit.wornOn ? (
        <Pressable style={styles.wearButton} onPress={markAsWornToday}>
          <Text style={styles.wearButtonText}>Mark as worn today</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.deleteButton} onPress={confirmDelete}>
        <Text style={styles.deleteButtonText}>Delete outfit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  photo: { width: '100%', height: 320, borderRadius: radii.lg, backgroundColor: colors.card, marginBottom: spacing.md },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  date: { fontSize: 18, fontWeight: '800', color: colors.text },
  source: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', fontWeight: '700' },
  reasoning: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  helper: { fontSize: 13, color: colors.textMuted },
  wearButton: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  wearButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  deleteButtonText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});

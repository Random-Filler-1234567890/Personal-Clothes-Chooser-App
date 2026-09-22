import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { ClothingImage } from '@/src/components/ClothingImage';
import { EmptyState } from '@/src/components/EmptyState';
import { OutfitItemList } from '@/src/components/OutfitItemRow';
import { ProsConsList } from '@/src/components/ProsConsList';
import { SectionHeader } from '@/src/components/SectionHeader';
import { TierBadge } from '@/src/components/TierBadge';
import { VibeTags } from '@/src/components/VibeTags';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { showAlert } from '@/src/utils/alert';
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
    return <EmptyState icon="time-outline" title="Outfit not found" subtitle="It may have been deleted." />;
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
    showAlert('Delete outfit?', 'This removes it from your history.', [
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
      {outfit.photoUri ? (
        <ClothingImage
          uri={outfit.photoUri}
          fallbackIcon={outfitItems[0] ? CATEGORY_ICON[outfitItems[0].category] : 'shirt-outline'}
          style={styles.photo}
          iconSize={32}
        />
      ) : null}

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

      {outfit.vibeTags?.length ? (
        <View style={{ marginBottom: spacing.lg }}>
          <VibeTags tags={outfit.vibeTags} />
        </View>
      ) : null}

      {outfit.tierPros?.length || outfit.tierCons?.length ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <ProsConsList pros={outfit.tierPros ?? []} cons={outfit.tierCons ?? []} />
        </Card>
      ) : outfit.tierReasoning ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={styles.reasoning}>{outfit.tierReasoning}</Text>
        </Card>
      ) : null}

      <SectionHeader title="Items" />
      {outfitItems.length ? (
        <OutfitItemList items={outfitItems} />
      ) : (
        <Text style={styles.helper}>No items were tagged for this outfit.</Text>
      )}

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {!outfit.wornOn ? <Button label="Mark as worn today" size="lg" onPress={markAsWornToday} fullWidth /> : null}
        <Button label="Delete outfit" variant="danger" onPress={confirmDelete} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  photo: { width: '100%', height: 320, borderRadius: radii.lg, marginBottom: spacing.md },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  date: { fontSize: 18, fontWeight: '800', color: colors.text },
  source: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', fontWeight: '700' },
  reasoning: { fontSize: 14, color: colors.text, lineHeight: 20 },
  helper: { fontSize: 13, color: colors.textMuted },
});

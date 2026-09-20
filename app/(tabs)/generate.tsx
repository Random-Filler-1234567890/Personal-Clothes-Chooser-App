import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { ItemPickerSheet } from '@/src/components/ItemPickerSheet';
import { OutfitResultCard } from '@/src/components/OutfitResultCard';
import { ALL_FORMALITIES, FORMALITY_LABEL } from '@/src/constants/categories';
import { colors, spacing } from '@/src/constants/theme';
import { generateOutfits } from '@/src/engine/outfitEngine';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import type { Category, Formality, GeneratedOutfit } from '@/src/types';
import { todayIso } from '@/src/utils/date';

type Quality = 'good' | 'random' | 'bad';

export default function GenerateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const items = useClosetStore((s) => s.items);
  const preferPants = useSettingsStore((s) => s.preferPants);
  const addOutfit = useOutfitStore((s) => s.addOutfit);
  const markWorn = useClosetStore((s) => s.markWorn);

  const [formality, setFormality] = useState<Formality | undefined>(undefined);
  const [quality, setQuality] = useState<Quality>('good');
  const [bottomColor, setBottomColor] = useState('');
  const [topColor, setTopColor] = useState('');
  const [unwornDays, setUnwornDays] = useState('');
  const [mustIncludeIds, setMustIncludeIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [results, setResults] = useState<GeneratedOutfit[]>([]);

  const mustIncludeItems = useMemo(
    () => items.filter((i) => mustIncludeIds.includes(i.id)),
    [items, mustIncludeIds]
  );

  useEffect(() => {
    if (params.itemId && !mustIncludeIds.includes(params.itemId)) {
      setMustIncludeIds((prev) => [...prev, params.itemId as string]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.itemId]);

  function handleGenerate() {
    const restrictCategory: Partial<Record<Category, string[]>> = {};
    if (bottomColor.trim()) {
      const colors = bottomColor.split(',').map((c) => c.trim()).filter(Boolean);
      restrictCategory.bottom = colors;
      restrictCategory.shorts = colors;
    }
    if (topColor.trim()) {
      restrictCategory.top = topColor.split(',').map((c) => c.trim()).filter(Boolean);
    }

    const outfits = generateOutfits(
      items,
      {
        formality,
        quality,
        count: 4,
        mustIncludeItemIds: mustIncludeIds,
        restrictCategory: Object.keys(restrictCategory).length ? restrictCategory : undefined,
        unwornForDays: unwornDays.trim() ? Number(unwornDays.trim()) : undefined,
      },
      preferPants
    );

    setResults(outfits);
    if (!outfits.length) {
      Alert.alert(
        "Couldn't build an outfit",
        'Try loosening your criteria — you may need more items in that formality, color, or category.'
      );
    }
  }

  async function handleWearToday(outfit: GeneratedOutfit) {
    await markWorn(outfit.itemIds, todayIso());
    const record = await addOutfit({
      itemIds: outfit.itemIds,
      tier: outfit.tier,
      score: outfit.score,
      tierReasoning: outfit.breakdown.join(' '),
      aiEvaluated: false,
      wornOn: todayIso(),
      source: 'generated',
    });
    router.push(`/outfit/${record.id}`);
  }

  async function handleSaveForLater(outfit: GeneratedOutfit) {
    await addOutfit({
      itemIds: outfit.itemIds,
      tier: outfit.tier,
      score: outfit.score,
      tierReasoning: outfit.breakdown.join(' '),
      aiEvaluated: false,
      source: 'generated',
    });
    Alert.alert('Saved', 'This outfit was saved to your history.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.sectionTitle}>Formality</Text>
      <View style={styles.chipRow}>
        <Chip label="Any" selected={!formality} onPress={() => setFormality(undefined)} />
        {ALL_FORMALITIES.map((f) => (
          <Chip key={f} label={FORMALITY_LABEL[f]} selected={formality === f} onPress={() => setFormality(f)} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Vibe</Text>
      <View style={styles.chipRow}>
        <Chip label="Good outfit" selected={quality === 'good'} onPress={() => setQuality('good')} />
        <Chip label="Surprise me" selected={quality === 'random'} onPress={() => setQuality('random')} />
        <Chip label="Terrible outfit" selected={quality === 'bad'} onPress={() => setQuality('bad')} />
      </View>

      <Text style={styles.sectionTitle}>Pants / shorts color (optional)</Text>
      <TextInput
        value={bottomColor}
        onChangeText={setBottomColor}
        placeholder="e.g. black, navy"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
      />

      <Text style={styles.sectionTitle}>Top color (optional)</Text>
      <TextInput
        value={topColor}
        onChangeText={setTopColor}
        placeholder="e.g. white"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
      />

      <Text style={styles.sectionTitle}>Hasn't been worn in at least (days, optional)</Text>
      <TextInput
        value={unwornDays}
        onChangeText={setUnwornDays}
        placeholder="e.g. 30"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        keyboardType="number-pad"
      />

      <Text style={styles.sectionTitle}>Must include a specific item</Text>
      <Pressable style={styles.pickButton} onPress={() => setPickerOpen(true)}>
        <Text style={styles.pickButtonText}>
          {mustIncludeItems.length ? mustIncludeItems.map((i) => i.name).join(', ') : 'Choose from closet (optional)'}
        </Text>
      </Pressable>

      <Pressable style={styles.generateButton} onPress={handleGenerate}>
        <Text style={styles.generateButtonText}>Generate outfits</Text>
      </Pressable>

      <View style={{ marginTop: spacing.xl }}>
        {results.length === 0 ? (
          <EmptyState icon="sparkles" title="No outfits yet" subtitle="Set your criteria above and tap Generate." />
        ) : (
          results.map((outfit, idx) => (
            <OutfitResultCard
              key={idx}
              outfit={outfit}
              items={outfit.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => !!i)}
              onWearToday={() => handleWearToday(outfit)}
              onSave={() => handleSaveForLater(outfit)}
            />
          ))
        )}
      </View>

      <ItemPickerSheet
        visible={pickerOpen}
        title="Include these items"
        items={items.filter((i) => !i.archived)}
        selectedIds={mustIncludeIds}
        onChange={setMustIncludeIds}
        onClose={() => setPickerOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
  },
  pickButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  pickButtonText: { fontSize: 14, color: colors.textMuted },
  generateButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  generateButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Chip } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { ItemPickerSheet } from '@/src/components/ItemPickerSheet';
import { OutfitResultCard } from '@/src/components/OutfitResultCard';
import { SectionHeader } from '@/src/components/SectionHeader';
import { ALL_FORMALITIES, FORMALITY_LABEL } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import { generateOutfits } from '@/src/engine/outfitEngine';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import type { Category, Formality, GeneratedOutfit } from '@/src/types';
import { todayIso } from '@/src/utils/date';

type Quality = 'good' | 'random' | 'bad';

const VIBES: { value: Quality; label: string; icon: 'thumbs-up-outline' | 'shuffle-outline' | 'skull-outline' }[] = [
  { value: 'good', label: 'Good outfit', icon: 'thumbs-up-outline' },
  { value: 'random', label: 'Surprise me', icon: 'shuffle-outline' },
  { value: 'bad', label: 'Terrible outfit', icon: 'skull-outline' },
];

export default function GenerateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const items = useClosetStore((s) => s.items);
  const preferPants = useSettingsStore((s) => s.preferPants);
  const addOutfit = useOutfitStore((s) => s.addOutfit);
  const markWorn = useClosetStore((s) => s.markWorn);

  const [formality, setFormality] = useState<Formality | undefined>(undefined);
  const [quality, setQuality] = useState<Quality>('good');
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  function handleMustIncludeChange(nextIds: string[]) {
    const added = nextIds.filter((id) => !mustIncludeIds.includes(id));
    const addedCategories = new Set(
      added.map((id) => items.find((i) => i.id === id)?.category).filter(Boolean)
    );
    // An outfit has one bottom-half slot, so a newly picked pants item drops any
    // previously picked shorts item as "must include" (and vice versa) rather than
    // silently losing one of them once outfits are generated.
    let resolved = nextIds;
    if (addedCategories.has('bottom')) {
      resolved = resolved.filter((id) => items.find((i) => i.id === id)?.category !== 'shorts');
    }
    if (addedCategories.has('shorts')) {
      resolved = resolved.filter((id) => items.find((i) => i.id === id)?.category !== 'bottom');
    }
    setMustIncludeIds(resolved);
  }

  useEffect(() => {
    if (params.itemId && !mustIncludeIds.includes(params.itemId)) {
      setMustIncludeIds((prev) => [...prev, params.itemId as string]);
      setShowAdvanced(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.itemId]);

  function buildCriteria(count: number) {
    const restrictCategory: Partial<Record<Category, string[]>> = {};
    if (bottomColor.trim()) {
      const cols = bottomColor.split(',').map((c) => c.trim()).filter(Boolean);
      restrictCategory.bottom = cols;
      restrictCategory.shorts = cols;
    }
    if (topColor.trim()) {
      restrictCategory.top = topColor.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return {
      formality,
      quality,
      count,
      mustIncludeItemIds: mustIncludeIds,
      restrictCategory: Object.keys(restrictCategory).length ? restrictCategory : undefined,
      unwornForDays: unwornDays.trim() ? Number(unwornDays.trim()) : undefined,
    };
  }

  function handleGenerate() {
    const outfits = generateOutfits(items, buildCriteria(4), preferPants);
    setResults(outfits);
    if (!outfits.length) {
      Alert.alert(
        "Couldn't build an outfit",
        'Try loosening your criteria — you may need more items in that formality, color, or category.'
      );
    }
  }

  function handleRegenerateOne(index: number) {
    const outfits = generateOutfits(items, buildCriteria(1), preferPants);
    if (!outfits.length) return;
    setResults((prev) => prev.map((o, i) => (i === index ? outfits[0] : o)));
  }

  async function handleWearToday(outfit: GeneratedOutfit) {
    const [, record] = await Promise.all([
      markWorn(outfit.itemIds, todayIso()),
      addOutfit({
        itemIds: outfit.itemIds,
        tier: outfit.tier,
        score: outfit.score,
        tierReasoning: outfit.breakdown.join(' '),
        aiEvaluated: false,
        wornOn: todayIso(),
        source: 'generated',
      }),
    ]);
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Card style={{ gap: spacing.md }}>
        <View>
          <SectionHeader title="Vibe" />
          <View style={styles.vibeRow}>
            {VIBES.map((v) => {
              const selected = quality === v.value;
              return (
                <Pressable
                  key={v.value}
                  onPress={() => setQuality(v.value)}
                  style={[styles.vibeButton, selected && styles.vibeButtonSelected]}
                >
                  <Icon name={v.icon} size={20} color={selected ? colors.accent : colors.textMuted} />
                  <Text style={[styles.vibeLabel, selected && styles.vibeLabelSelected]}>{v.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <SectionHeader title="Formality" />
          <View style={styles.chipRow}>
            <Chip label="Any" selected={!formality} onPress={() => setFormality(undefined)} />
            {ALL_FORMALITIES.map((f) => (
              <Chip key={f} label={FORMALITY_LABEL[f]} selected={formality === f} onPress={() => setFormality(f)} />
            ))}
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Pressable style={styles.advancedToggle} onPress={() => setShowAdvanced((s) => !s)}>
          <Text style={styles.advancedToggleText}>More criteria</Text>
          <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </Pressable>

        {showAdvanced ? (
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            <View>
              <SectionHeader title="Pants / shorts color" />
              <TextInput
                value={bottomColor}
                onChangeText={setBottomColor}
                placeholder="e.g. black, navy"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View>
              <SectionHeader title="Top color" />
              <TextInput
                value={topColor}
                onChangeText={setTopColor}
                placeholder="e.g. white"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View>
              <SectionHeader title="Hasn't been worn in at least (days)" />
              <TextInput
                value={unwornDays}
                onChangeText={setUnwornDays}
                placeholder="e.g. 30"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                keyboardType="number-pad"
              />
            </View>

            <View>
              <SectionHeader title="Must include" />
              <View style={styles.chipRow}>
                {mustIncludeItems.map((item) => (
                  <View key={item.id} style={styles.removableChip}>
                    <Text style={styles.removableChipLabel} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Pressable
                      onPress={() => handleMustIncludeChange(mustIncludeIds.filter((id) => id !== item.id))}
                      hitSlop={6}
                    >
                      <Icon name="close-circle" size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
                <Pressable style={styles.addChip} onPress={() => setPickerOpen(true)}>
                  <Icon name="add" size={14} color={colors.accent} />
                  <Text style={styles.addChipLabel}>Add item</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Generate outfits" size="lg" icon="sparkles" onPress={handleGenerate} fullWidth />
      </View>

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
              onRegenerate={() => handleRegenerateOne(idx)}
            />
          ))
        )}
      </View>

      <ItemPickerSheet
        visible={pickerOpen}
        title="Include these items"
        items={items.filter((i) => !i.archived)}
        selectedIds={mustIncludeIds}
        onChange={handleMustIncludeChange}
        onClose={() => setPickerOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
  },
  vibeRow: { flexDirection: 'row', gap: spacing.sm },
  vibeButton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  vibeButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  vibeLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  vibeLabelSelected: { color: colors.accent },
  advancedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  advancedToggleText: { fontSize: 14, fontWeight: '700', color: colors.text },
  removableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs + 2,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: 220,
  },
  removableChipLabel: { fontSize: 12.5, fontWeight: '700', color: colors.accent, flexShrink: 1 },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  addChipLabel: { fontSize: 12.5, fontWeight: '700', color: colors.accent },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Chip } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon, type IoniconName } from '@/src/components/Icon';
import { ItemPickerSheet } from '@/src/components/ItemPickerSheet';
import { OutfitResultCard } from '@/src/components/OutfitResultCard';
import { SectionHeader } from '@/src/components/SectionHeader';
import { ALL_FORMALITIES, FORMALITY_LABEL } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import { generateOutfits } from '@/src/engine/outfitEngine';
import { evaluateOutfitText, GeminiError, type OutfitNarrative } from '@/src/services/gemini';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import type { Category, Formality, GeneratedOutfit, Season } from '@/src/types';
import { showAlert } from '@/src/utils/alert';
import { todayIso } from '@/src/utils/date';

type Quality = 'good' | 'random' | 'bad';

const VIBES: { value: Quality; label: string; icon: 'thumbs-up-outline' | 'shuffle-outline' | 'skull-outline' }[] = [
  { value: 'good', label: 'Good outfit', icon: 'thumbs-up-outline' },
  { value: 'random', label: 'Surprise me', icon: 'shuffle-outline' },
  { value: 'bad', label: 'Terrible outfit', icon: 'skull-outline' },
];

interface OccasionPreset {
  key: string;
  label: string;
  icon: IoniconName;
  formality?: Formality;
  season: Season;
}

const OCCASIONS: OccasionPreset[] = [
  { key: 'everyday', label: 'Everyday', icon: 'sunny-outline', formality: 'casual', season: 'all' },
  { key: 'smart', label: 'Smart Casual', icon: 'shirt-outline', formality: 'smart-casual', season: 'all' },
  { key: 'formal', label: 'Formal Event', icon: 'ribbon-outline', formality: 'formal', season: 'all' },
  { key: 'gym', label: 'Gym', icon: 'fitness-outline', formality: 'athletic', season: 'all' },
  { key: 'summer', label: 'Summer', icon: 'sunny', season: 'warm' },
  { key: 'winter', label: 'Winter', icon: 'snow', season: 'cool' },
];

// Single-slot categories: at most one must-include item per group, since an
// outfit only has room for one of each. Bottom/shorts share a slot (you wear
// pants OR shorts, never both), everything else is its own group.
const SLOT_GROUPS: Category[][] = [
  ['bottom', 'shorts'],
  ['top'],
  ['shoes'],
  ['outerwear'],
  ['belt'],
  ['tie'],
  ['socks'],
];

export default function GenerateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const items = useClosetStore((s) => s.items);
  const preferPants = useSettingsStore((s) => s.preferPants);
  const sockPreference = useSettingsStore((s) => s.sockPreference);
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);
  const addOutfit = useOutfitStore((s) => s.addOutfit);
  const markWorn = useClosetStore((s) => s.markWorn);

  const [formality, setFormality] = useState<Formality | undefined>(undefined);
  const [season, setSeason] = useState<Season>('all');
  const [quality, setQuality] = useState<Quality>('good');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bottomColor, setBottomColor] = useState('');
  const [topColor, setTopColor] = useState('');
  const [unwornDays, setUnwornDays] = useState('');
  const [mustIncludeIds, setMustIncludeIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [results, setResults] = useState<GeneratedOutfit[]>([]);
  const [aiNarratives, setAiNarratives] = useState<Record<number, OutfitNarrative | null>>({});
  const [askingAiIndex, setAskingAiIndex] = useState<number | null>(null);

  const mustIncludeItems = useMemo(
    () => items.filter((i) => mustIncludeIds.includes(i.id)),
    [items, mustIncludeIds]
  );

  const activeOccasion = OCCASIONS.find((o) => o.formality === formality && o.season === season)?.key;

  function handleMustIncludeChange(nextIds: string[]) {
    const added = nextIds.filter((id) => !mustIncludeIds.includes(id));
    let resolved = nextIds;
    for (const addedId of added) {
      const addedItem = items.find((i) => i.id === addedId);
      if (!addedItem) continue;
      const group = SLOT_GROUPS.find((g) => g.includes(addedItem.category));
      if (!group) continue;
      resolved = resolved.filter((id) => {
        if (id === addedId) return true;
        const other = items.find((i) => i.id === id);
        return !other || !group.includes(other.category);
      });
    }
    setMustIncludeIds(resolved);
  }

  useEffect(() => {
    if (params.itemId && !mustIncludeIds.includes(params.itemId)) {
      handleMustIncludeChange([...mustIncludeIds, params.itemId as string]);
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
      season,
      quality,
      count,
      mustIncludeItemIds: mustIncludeIds,
      restrictCategory: Object.keys(restrictCategory).length ? restrictCategory : undefined,
      unwornForDays: unwornDays.trim() ? Number(unwornDays.trim()) : undefined,
    };
  }

  function handleGenerate() {
    const outfits = generateOutfits(items, buildCriteria(4), preferPants, sockPreference);
    setResults(outfits);
    setAiNarratives({});
    if (!outfits.length) {
      showAlert(
        "Couldn't build an outfit",
        'Try loosening your criteria — you may need more items in that formality, color, or category.'
      );
    }
  }

  function handleRegenerateOne(index: number) {
    const outfits = generateOutfits(items, buildCriteria(1), preferPants, sockPreference);
    if (!outfits.length) return;
    setResults((prev) => prev.map((o, i) => (i === index ? outfits[0] : o)));
    setAiNarratives((prev) => ({ ...prev, [index]: null }));
  }

  async function handleAskAi(index: number, outfit: GeneratedOutfit) {
    if (!geminiApiKey) return;
    const outfitItems = outfit.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => !!i);
    setAskingAiIndex(index);
    try {
      const narrative = await evaluateOutfitText(geminiApiKey, outfitItems, outfit.tier);
      setAiNarratives((prev) => ({ ...prev, [index]: narrative }));
    } catch (err) {
      const message = err instanceof GeminiError ? err.message : 'Could not get an AI opinion on this outfit.';
      showAlert('AI evaluation failed', message);
    } finally {
      setAskingAiIndex(null);
    }
  }

  async function handleWearToday(outfit: GeneratedOutfit) {
    const [, record] = await Promise.all([
      markWorn(outfit.itemIds, todayIso()),
      addOutfit({
        itemIds: outfit.itemIds,
        tier: outfit.tier,
        score: outfit.score,
        tierPros: outfit.pros,
        tierCons: outfit.cons,
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
      tierPros: outfit.pros,
      tierCons: outfit.cons,
      aiEvaluated: false,
      source: 'generated',
    });
    showAlert('Saved', 'This outfit was saved to your history.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Card style={{ gap: spacing.md }}>
        <View>
          <SectionHeader title="Occasion" />
          <View style={styles.occasionRow}>
            {OCCASIONS.map((o) => {
              const selected = activeOccasion === o.key;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    setFormality(o.formality);
                    setSeason(o.season);
                  }}
                  style={[styles.occasionChip, selected && styles.occasionChipSelected]}
                >
                  <Icon name={o.icon} size={14} color={selected ? '#FFFFFF' : colors.textMuted} />
                  <Text style={[styles.occasionLabel, selected && styles.occasionLabelSelected]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

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

        <View>
          <SectionHeader title="Weather" />
          <View style={styles.chipRow}>
            <Chip label="Any" selected={season === 'all'} onPress={() => setSeason('all')} />
            <Chip label="Warm" selected={season === 'warm'} onPress={() => setSeason('warm')} />
            <Chip label="Cool" selected={season === 'cool'} onPress={() => setSeason('cool')} />
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
              onAskAi={geminiApiKey ? () => handleAskAi(idx, outfit) : undefined}
              aiNarrative={aiNarratives[idx]}
              askingAi={askingAiIndex === idx}
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
  occasionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  occasionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  occasionChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  occasionLabel: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  occasionLabelSelected: { color: '#FFFFFF' },
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

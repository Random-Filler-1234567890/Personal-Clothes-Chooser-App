import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { ClothingImage } from '@/src/components/ClothingImage';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { OutfitResultCard } from '@/src/components/OutfitResultCard';
import { SectionHeader } from '@/src/components/SectionHeader';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, spacing } from '@/src/constants/theme';
import { generateOutfits } from '@/src/engine/outfitEngine';
import { evaluateOutfitText, GeminiError, type OutfitNarrative } from '@/src/services/gemini';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import type { GeneratedOutfit } from '@/src/types';
import { showAlert } from '@/src/utils/alert';
import { daysSince, formatRelative, todayIso } from '@/src/utils/date';

type Mood = 'good' | 'random' | 'bad';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const items = useClosetStore((s) => s.items);
  const markWorn = useClosetStore((s) => s.markWorn);
  const outfits = useOutfitStore((s) => s.outfits);
  const addOutfit = useOutfitStore((s) => s.addOutfit);
  const preferPants = useSettingsStore((s) => s.preferPants);
  const sockPreference = useSettingsStore((s) => s.sockPreference);
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);
  const boldness = useSettingsStore((s) => s.boldness);
  const styleLeaning = useSettingsStore((s) => s.styleLeaning);
  const colorUndertone = useSettingsStore((s) => s.colorUndertone);
  const styleProfile = useMemo(() => ({ boldness, styleLeaning, colorUndertone }), [boldness, styleLeaning, colorUndertone]);

  const [outfit, setOutfit] = useState<GeneratedOutfit | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [aiNarrative, setAiNarrative] = useState<OutfitNarrative | null>(null);
  const [askingAi, setAskingAi] = useState(false);

  const activeItems = useMemo(() => items.filter((i) => !i.archived), [items]);

  const dueForRewear = useMemo(
    () =>
      activeItems
        .map((i) => ({ item: i, days: daysSince(i.lastWornAt) }))
        .sort((a, b) => b.days - a.days)
        .slice(0, 6),
    [activeItems]
  );

  const outfitsThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return outfits.filter((o) => new Date(o.wornOn ?? o.createdAt).getTime() >= weekAgo).length;
  }, [outfits]);

  function roll(nextMood: Mood) {
    const results = generateOutfits(items, { quality: nextMood, count: 1 }, preferPants, sockPreference, styleProfile);
    setMood(nextMood);
    setOutfit(results[0] ?? null);
    setAiNarrative(null);
  }

  const outfitItems = outfit ? outfit.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => !!i) : [];

  async function handleAskAi() {
    if (!geminiApiKey || !outfit) return;
    setAskingAi(true);
    try {
      const narrative = await evaluateOutfitText(geminiApiKey, outfitItems, outfit.tier);
      setAiNarrative(narrative);
    } catch (err) {
      const message = err instanceof GeminiError ? err.message : 'Could not get an AI opinion on this outfit.';
      showAlert('AI evaluation failed', message);
    } finally {
      setAskingAi(false);
    }
  }

  async function handleWearToday() {
    if (!outfit) return;
    const [, record] = await Promise.all([
      markWorn(outfit.itemIds, todayIso()),
      addOutfit({
        itemIds: outfit.itemIds,
        tier: outfit.tier,
        score: outfit.score,
        tierPros: outfit.pros,
        tierCons: outfit.cons,
        vibeTags: outfit.vibeTags,
        aiEvaluated: false,
        wornOn: todayIso(),
        source: 'generated',
      }),
    ]);
    router.push(`/outfit/${record.id}`);
  }

  async function handleSaveForLater() {
    if (!outfit) return;
    await addOutfit({
      itemIds: outfit.itemIds,
      tier: outfit.tier,
      score: outfit.score,
      tierPros: outfit.pros,
      tierCons: outfit.cons,
      vibeTags: outfit.vibeTags,
      aiEvaluated: false,
      source: 'generated',
    });
    setOutfit(null);
    setMood(null);
    setAiNarrative(null);
  }

  const readyToRoll = activeItems.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={styles.greeting}>{greeting()}</Text>
      <Text style={styles.subGreeting}>
        {activeItems.length} pieces in your closet · {outfitsThisWeek} outfit{outfitsThisWeek === 1 ? '' : 's'} logged this week
      </Text>

      {!readyToRoll ? (
        <Card style={{ marginTop: spacing.lg }}>
          <EmptyState
            icon="shirt-outline"
            title="Your closet is empty"
            subtitle="Add a few items first, then come back here for instant outfit picks."
          />
        </Card>
      ) : !outfit ? (
        <Card elevated style={styles.heroCard}>
          <Icon name="sparkles" size={28} color={colors.accent} />
          <Text style={styles.heroTitle}>What should I wear?</Text>
          <Text style={styles.heroSubtitle}>One tap for a full outfit, picked from your own closet.</Text>
          <Button label="Get me an outfit" size="lg" icon="sparkles" onPress={() => roll('good')} fullWidth />
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Button label="Surprise me" variant="ghost" icon="shuffle-outline" onPress={() => roll('random')} fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Make it bad" variant="ghost" icon="skull-outline" onPress={() => roll('bad')} fullWidth />
            </View>
          </View>
        </Card>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          <OutfitResultCard
            outfit={outfit}
            items={outfitItems}
            onWearToday={handleWearToday}
            onSave={handleSaveForLater}
            onRegenerate={() => roll(mood ?? 'good')}
            onAskAi={geminiApiKey ? handleAskAi : undefined}
            aiNarrative={aiNarrative}
            askingAi={askingAi}
          />
          <Button
            label="Never mind, start over"
            variant="ghost"
            onPress={() => {
              setOutfit(null);
              setMood(null);
              setAiNarrative(null);
            }}
          />
        </View>
      )}

      {dueForRewear.length > 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Due for a rewear" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {dueForRewear.map(({ item, days }) => (
              <Pressable
                key={item.id}
                style={styles.rewearCard}
                onPress={() => router.push({ pathname: '/(tabs)/generate', params: { itemId: item.id } })}
              >
                <ClothingImage uri={item.imageUri} fallbackIcon={CATEGORY_ICON[item.category]} style={styles.rewearThumb} iconSize={22} />
                <Text numberOfLines={1} style={styles.rewearName}>
                  {item.name}
                </Text>
                <Text style={styles.rewearDays}>{Number.isFinite(days) ? formatRelative(item.lastWornAt) : 'Never worn'}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  greeting: { fontSize: 26, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  heroCard: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  heroTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  heroSubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  heroRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  rewearCard: { width: 92 },
  rewearThumb: { width: 92, height: 92, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  rewearName: { fontSize: 11.5, fontWeight: '600', color: colors.text, marginTop: 4 },
  rewearDays: { fontSize: 10.5, color: colors.textMuted },
});

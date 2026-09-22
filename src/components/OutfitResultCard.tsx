import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Icon } from '@/src/components/Icon';
import { OutfitItemRow, OutfitNameLine } from '@/src/components/OutfitItemRow';
import { ProsConsList } from '@/src/components/ProsConsList';
import { TierBadge } from '@/src/components/TierBadge';
import { VibeTags } from '@/src/components/VibeTags';
import { colors, spacing } from '@/src/constants/theme';
import type { OutfitNarrative } from '@/src/services/gemini';
import type { ClothingItem, GeneratedOutfit } from '@/src/types';

export function OutfitResultCard({
  outfit,
  items,
  onWearToday,
  onSave,
  onRegenerate,
  onAskAi,
  aiNarrative,
  askingAi,
}: {
  outfit: GeneratedOutfit;
  items: ClothingItem[];
  onWearToday: () => void;
  onSave: () => void;
  onRegenerate?: () => void;
  onAskAi?: () => void;
  aiNarrative?: OutfitNarrative | null;
  askingAi?: boolean;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <TierBadge tier={outfit.tier} size="md" />
        <Text style={styles.score}>{outfit.score}/100</Text>
        <View style={{ flex: 1 }} />
        {onRegenerate ? (
          <Pressable onPress={onRegenerate} hitSlop={8} style={styles.regenerateButton}>
            <Icon name="shuffle-outline" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <OutfitNameLine items={items} />
      <OutfitItemRow items={items} />
      <View style={{ marginTop: spacing.xs }}>
        <VibeTags tags={outfit.vibeTags} />
      </View>

      <View style={styles.breakdown}>
        <ProsConsList pros={outfit.pros} cons={outfit.cons} />
      </View>

      {onAskAi ? (
        aiNarrative ? (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Icon name="sparkles" size={13} color={colors.accent} />
              <Text style={styles.aiHeaderText}>AI's take</Text>
            </View>
            <Text style={styles.aiVerdict}>{aiNarrative.verdict}</Text>
            <ProsConsList pros={aiNarrative.pros} cons={aiNarrative.cons} />
          </View>
        ) : (
          <Pressable style={styles.askAiButton} onPress={onAskAi} disabled={askingAi}>
            {askingAi ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Icon name="sparkles-outline" size={14} color={colors.accent} />
                <Text style={styles.askAiText}>Ask AI about this outfit</Text>
              </>
            )}
          </Pressable>
        )
      ) : null}

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label="Save for later" variant="secondary" onPress={onSave} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Wear today" variant="primary" onPress={onWearToday} fullWidth />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  score: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  regenerateButton: {
    padding: spacing.xs,
  },
  breakdown: {
    marginTop: spacing.xs,
  },
  askAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  askAiText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.accent,
  },
  aiSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiHeaderText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.accent,
    textTransform: 'uppercase',
  },
  aiVerdict: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});

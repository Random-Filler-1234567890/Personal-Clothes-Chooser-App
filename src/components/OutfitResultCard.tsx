import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Icon } from '@/src/components/Icon';
import { OutfitItemRow, OutfitNameLine } from '@/src/components/OutfitItemRow';
import { TierBadge } from '@/src/components/TierBadge';
import { colors, spacing } from '@/src/constants/theme';
import type { ClothingItem, GeneratedOutfit } from '@/src/types';

export function OutfitResultCard({
  outfit,
  items,
  onWearToday,
  onSave,
  onRegenerate,
}: {
  outfit: GeneratedOutfit;
  items: ClothingItem[];
  onWearToday: () => void;
  onSave: () => void;
  onRegenerate?: () => void;
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

      <View style={styles.breakdown}>
        {outfit.breakdown.map((line, i) => (
          <Text key={i} style={styles.breakdownLine}>
            •  {line}
          </Text>
        ))}
      </View>

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
  breakdownLine: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});

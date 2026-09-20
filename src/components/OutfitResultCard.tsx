import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OutfitItemRow } from '@/src/components/OutfitItemRow';
import { TierBadge } from '@/src/components/TierBadge';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { ClothingItem, GeneratedOutfit } from '@/src/types';

export function OutfitResultCard({
  outfit,
  items,
  onWearToday,
  onSave,
}: {
  outfit: GeneratedOutfit;
  items: ClothingItem[];
  onWearToday: () => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TierBadge tier={outfit.tier} size="md" />
        <Text style={styles.score}>{outfit.score}/100</Text>
      </View>
      <OutfitItemRow items={items} />
      <View style={styles.breakdown}>
        {outfit.breakdown.map((line, i) => (
          <Text key={i} style={styles.breakdownLine}>
            •  {line}
          </Text>
        ))}
      </View>
      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={onSave}>
          <Text style={styles.buttonSecondaryText}>Save for later</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onWearToday}>
          <Text style={styles.buttonPrimaryText}>Wear today</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
  button: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonSecondary: {
    backgroundColor: colors.accentSoft,
  },
  buttonSecondaryText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});

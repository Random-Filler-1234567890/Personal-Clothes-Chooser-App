import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';

export function VibeTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <View style={styles.row}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
});

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ClothingImage } from '@/src/components/ClothingImage';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { ClothingItem } from '@/src/types';

export function OutfitItemRow({ items, size = 56 }: { items: ClothingItem[]; size?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
      {items.map((item) => (
        <ClothingImage
          key={item.id}
          uri={item.imageUri}
          fallbackIcon={CATEGORY_ICON[item.category]}
          iconSize={size * 0.4}
          style={{ width: size, height: size, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border }}
        />
      ))}
    </ScrollView>
  );
}

export function OutfitNameLine({ items }: { items: ClothingItem[] }) {
  return (
    <Text style={styles.nameLine}>
      {items.map((i) => i.name).join('  ·  ')}
    </Text>
  );
}

export function OutfitItemList({ items }: { items: ClothingItem[] }) {
  return (
    <View>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <ClothingImage
            uri={item.imageUri}
            fallbackIcon={CATEGORY_ICON[item.category]}
            iconSize={18}
            style={styles.rowThumb}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text style={styles.rowMeta}>{item.colors.join(', ')}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nameLine: {
    fontSize: 13.5,
    color: colors.text,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

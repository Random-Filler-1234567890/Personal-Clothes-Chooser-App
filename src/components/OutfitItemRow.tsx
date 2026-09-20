import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { ClothingItem } from '@/src/types';

export function OutfitItemRow({ items, size = 56 }: { items: ClothingItem[]; size?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
      {items.map((item) => (
        <View key={item.id} style={[styles.thumb, { width: size, height: size }]}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Icon name={CATEGORY_ICON[item.category]} size={size * 0.4} color={colors.textMuted} />
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

export function OutfitItemList({ items }: { items: ClothingItem[] }) {
  return (
    <View>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.rowThumb}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Icon name={CATEGORY_ICON[item.category]} size={20} color={colors.textMuted} />
              </View>
            )}
          </View>
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
  thumb: {
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
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

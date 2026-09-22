import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClothingImage } from '@/src/components/ClothingImage';
import { Icon } from '@/src/components/Icon';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { ClothingItem } from '@/src/types';
import { formatRelative } from '@/src/utils/date';

export function ItemCard({ item, onPress, width }: { item: ClothingItem; onPress: () => void; width: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
      <ClothingImage
        uri={item.imageUri}
        fallbackIcon={CATEGORY_ICON[item.category]}
        style={[styles.thumb, { width, height: width }]}
      />
      {item.favorite ? (
        <View style={styles.favoriteBadge}>
          <Icon name="star" size={11} color="#FFFFFF" />
        </View>
      ) : null}
      {item.quantity && item.quantity > 1 ? (
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>×{item.quantity}</Text>
        </View>
      ) : null}
      <Text numberOfLines={2} style={styles.name}>
        {item.name}
      </Text>
      <Text style={styles.meta}>{formatRelative(item.lastWornAt)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  thumb: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(33,29,24,0.75)',
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  name: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});

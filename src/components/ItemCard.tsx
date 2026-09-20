import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { ClothingItem } from '@/src/types';
import { formatRelative } from '@/src/utils/date';

export function ItemCard({ item, onPress, width }: { item: ClothingItem; onPress: () => void; width: number }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, { width }]}>
      <View style={[styles.thumb, { width, height: width }]}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Icon name={CATEGORY_ICON[item.category]} size={28} color={colors.textMuted} />
          </View>
        )}
        {item.favorite ? (
          <View style={styles.favoriteBadge}>
            <Icon name="star.fill" size={12} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
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
  thumb: {
    borderRadius: radii.md,
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
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
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

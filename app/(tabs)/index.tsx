import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { ItemCard } from '@/src/components/ItemCard';
import { ALL_CATEGORIES, CATEGORY_LABEL } from '@/src/constants/categories';
import { colors, spacing } from '@/src/constants/theme';
import { useClosetStore } from '@/src/store/closetStore';
import type { Category } from '@/src/types';

const GRID_GAP = spacing.md;
const H_PADDING = spacing.lg;

export default function ClosetScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const items = useClosetStore((s) => s.items);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const { width } = useWindowDimensions();

  const columns = 3;
  const cardWidth = (width - H_PADDING * 2 - GRID_GAP * (columns - 1)) / columns;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push('/item/new')} hitSlop={10} style={{ paddingHorizontal: 4 }}>
          <Icon name="plus.circle.fill" size={26} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => !i.archived)
      .filter((i) => category === 'all' || i.category === category)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.colors.some((c) => c.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, query, category]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your closet"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: H_PADDING }}
        style={styles.filterRow}
      >
        {(['all', ...ALL_CATEGORIES] as (Category | 'all')[]).map((c) => (
          <Chip
            key={c}
            label={c === 'all' ? `All (${items.filter((i) => !i.archived).length})` : CATEGORY_LABEL[c]}
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </ScrollView>
      {filtered.length === 0 ? (
        <EmptyState
          icon="tshirt.fill"
          title="No items here yet"
          subtitle="Tap the + button to add a photo of a clothing item."
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={columns}
          contentContainerStyle={{ padding: H_PADDING }}
          columnWrapperStyle={{ gap: GRID_GAP }}
          renderItem={({ item }) => (
            <ItemCard item={item} width={cardWidth} onPress={() => router.push(`/item/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { paddingHorizontal: H_PADDING, paddingTop: spacing.sm, flexShrink: 0 },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  filterRow: { marginTop: spacing.md, flexGrow: 0, flexShrink: 0 },
});

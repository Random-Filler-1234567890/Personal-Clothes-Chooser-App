import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { ItemCard } from '@/src/components/ItemCard';
import { ALL_CATEGORIES, ALL_FORMALITIES, CATEGORY_LABEL, FORMALITY_LABEL } from '@/src/constants/categories';
import { colors, spacing } from '@/src/constants/theme';
import { useClosetStore } from '@/src/store/closetStore';
import type { Category, Formality } from '@/src/types';

const GRID_GAP = spacing.md;
const H_PADDING = spacing.lg;

type CategoryFilter = Category | 'all' | 'favorites';

export default function ClosetScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const items = useClosetStore((s) => s.items);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [formalityFilter, setFormalityFilter] = useState<Formality | 'all'>('all');
  const { width } = useWindowDimensions();

  function selectCategory(next: CategoryFilter) {
    setCategory(next);
    setFormalityFilter('all');
  }

  const columns = 3;
  const cardWidth = (width - H_PADDING * 2 - GRID_GAP * (columns - 1)) / columns;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push('/item/new')} hitSlop={10} style={{ paddingHorizontal: 4 }}>
          <Icon name="add-circle" size={26} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const active = useMemo(() => items.filter((i) => !i.archived), [items]);

  const formalitiesInCategory = useMemo(() => {
    if (category === 'all' || category === 'favorites') return [];
    return ALL_FORMALITIES.filter((f) => active.some((i) => i.category === category && i.formality === f));
  }, [active, category]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active
      .filter((i) => category === 'all' || (category === 'favorites' ? i.favorite : i.category === category))
      .filter((i) => formalityFilter === 'all' || i.formality === formalityFilter)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.colors.some((c) => c.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [active, query, category, formalityFilter]);

  const favoriteCount = active.filter((i) => i.favorite).length;

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
        <Chip label={`All (${active.length})`} selected={category === 'all'} onPress={() => selectCategory('all')} />
        {favoriteCount > 0 ? (
          <Chip label={`★ Favorites (${favoriteCount})`} selected={category === 'favorites'} onPress={() => selectCategory('favorites')} />
        ) : null}
        {ALL_CATEGORIES.filter((c) => active.some((i) => i.category === c)).map((c) => (
          <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => selectCategory(c)} />
        ))}
      </ScrollView>
      {formalitiesInCategory.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: H_PADDING }}
          style={styles.subFilterRow}
        >
          <Chip label="All" selected={formalityFilter === 'all'} onPress={() => setFormalityFilter('all')} />
          {formalitiesInCategory.map((f) => (
            <Chip key={f} label={FORMALITY_LABEL[f]} selected={formalityFilter === f} onPress={() => setFormalityFilter(f)} />
          ))}
        </ScrollView>
      ) : null}
      {filtered.length === 0 ? (
        <EmptyState
          icon="shirt-outline"
          title={active.length === 0 ? 'No items here yet' : 'Nothing matches'}
          subtitle={
            active.length === 0
              ? 'Tap the + button to add a photo of a clothing item.'
              : 'Try a different search or filter.'
          }
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
  subFilterRow: { marginTop: spacing.sm, flexGrow: 0, flexShrink: 0 },
});

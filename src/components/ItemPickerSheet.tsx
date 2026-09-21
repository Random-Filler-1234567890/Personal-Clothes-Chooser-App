import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/src/components/Chip';
import { ClothingImage } from '@/src/components/ClothingImage';
import { Icon } from '@/src/components/Icon';
import { ALL_CATEGORIES, CATEGORY_ICON, CATEGORY_LABEL } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { Category, ClothingItem } from '@/src/types';

interface Props {
  visible: boolean;
  title?: string;
  items: ClothingItem[];
  selectedIds: string[];
  multiple?: boolean;
  onClose: () => void;
  onChange: (ids: string[]) => void;
}

export function ItemPickerSheet({ visible, title = 'Select items', items, selectedIds, multiple = true, onClose, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');

  const availableCategories = useMemo(
    () => ALL_CATEGORIES.filter((c) => items.some((i) => i.category === c)),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => category === 'all' || i.category === category)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.colors.some((c) => c.toLowerCase().includes(q)));
  }, [items, query, category]);

  function toggle(id: string) {
    if (multiple) {
      if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
      else onChange([...selectedIds, id]);
    } else {
      onChange(selectedIds.includes(id) ? [] : [id]);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or color"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
        />
        <View style={styles.filterWrap}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['all', ...availableCategories] as (Category | 'all')[]}
            keyExtractor={(c) => c}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingRight: spacing.lg }}
            renderItem={({ item: c }) => (
              <Chip
                label={c === 'all' ? 'All' : CATEGORY_LABEL[c]}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            )}
          />
        </View>
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            return (
              <Pressable style={[styles.row, selected && styles.rowSelected]} onPress={() => toggle(item.id)}>
                <ClothingImage uri={item.imageUri} fallbackIcon={CATEGORY_ICON[item.category]} iconSize={16} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{item.colors.join(', ')}</Text>
                </View>
                {selected ? <Icon name="checkmark-circle" size={22} color={colors.accent} /> : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  done: { fontSize: 16, fontWeight: '700', color: colors.accent },
  search: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  filterWrap: { marginTop: spacing.md, flexShrink: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
  },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
});

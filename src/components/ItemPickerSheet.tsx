import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/src/components/Icon';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { ClothingItem } from '@/src/types';

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.colors.some((c) => c.toLowerCase().includes(q))
    );
  }, [items, query]);

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
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            return (
              <Pressable style={[styles.row, selected && styles.rowSelected]} onPress={() => toggle(item.id)}>
                <View style={styles.thumb}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <View style={styles.placeholder}>
                      <Icon name={CATEGORY_ICON[item.category]} size={18} color={colors.textMuted} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{item.colors.join(', ')}</Text>
                </View>
                {selected ? <Icon name="checkmark.circle.fill" size={22} color={colors.accent} /> : null}
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
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
});

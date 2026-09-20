import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { ItemFormFields, type ItemDraft } from '@/src/components/ItemFormFields';
import { colors, radii, spacing } from '@/src/constants/theme';
import { persistImage } from '@/src/services/imageStorage';
import { useClosetStore } from '@/src/store/closetStore';
import type { ClothingItem } from '@/src/types';
import { formatDate, formatRelative } from '@/src/utils/date';

function toDraft(item: ClothingItem): ItemDraft {
  return {
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    colorsText: item.colors.join(', '),
    formality: item.formality,
    fit: item.fit,
    sleeve: item.sleeve,
    season: item.season,
    brand: item.brand,
    pattern: item.pattern,
    notes: item.notes,
  };
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const items = useClosetStore((s) => s.items);
  const updateItem = useClosetStore((s) => s.updateItem);
  const removeItem = useClosetStore((s) => s.removeItem);

  const item = items.find((i) => i.id === id);
  const [draft, setDraft] = useState<ItemDraft | null>(item ? toDraft(item) : null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (!item) return;
    navigation.setOptions({
      title: item.name,
      headerRight: () => (
        <Pressable onPress={() => updateItem(item.id, { favorite: !item.favorite })} hitSlop={10}>
          <Icon name={item.favorite ? 'star.fill' : 'star'} size={22} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, item, updateItem]);

  if (!item || !draft) {
    return <EmptyState icon="tshirt.fill" title="Item not found" subtitle="It may have been deleted." />;
  }

  const currentItem = item;

  function patchDraft(patch: Partial<ItemDraft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }

  async function changePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to continue.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;
    const persistedUri = await persistImage(pickerResult.assets[0].uri, 'clothes');
    await updateItem(currentItem.id, { imageUri: persistedUri });
  }

  async function handleSave() {
    if (!draft) return;
    const colors = draft.colorsText
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    setSaving(true);
    try {
      await updateItem(currentItem.id, {
        name: draft.name.trim() || currentItem.name,
        category: draft.category,
        subcategory: draft.subcategory,
        colors,
        formality: draft.formality,
        fit: draft.fit,
        sleeve: draft.sleeve,
        season: draft.season,
        brand: draft.brand?.trim() || undefined,
        pattern: draft.pattern?.trim() || undefined,
        notes: draft.notes?.trim() || undefined,
      });
      Alert.alert('Saved', 'Your changes were saved.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete item?', `Remove "${currentItem.name}" from your closet permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeItem(currentItem.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Pressable onPress={changePhoto}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Icon name="camera.fill" size={28} color={colors.textMuted} />
            <Text style={styles.placeholderText}>Add a photo</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.statsRow}>
        <Text style={styles.statText}>Worn {item.wearCount} time{item.wearCount === 1 ? '' : 's'}</Text>
        <Text style={styles.statText}>Last worn: {formatRelative(item.lastWornAt)}</Text>
        <Text style={styles.statText}>Added {formatDate(item.createdAt)}</Text>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <ItemFormFields draft={draft} onChange={patchDraft} />
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={confirmDelete}>
        <Text style={styles.deleteButtonText}>Delete item</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  photo: { width: '100%', height: 260, borderRadius: radii.lg, backgroundColor: colors.card },
  placeholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  placeholderText: { color: colors.textMuted, fontSize: 13 },
  statsRow: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
  },
  statText: { fontSize: 13, color: colors.textMuted },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  deleteButtonText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});

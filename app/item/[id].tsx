import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { ClothingImage } from '@/src/components/ClothingImage';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { ItemFormFields, type ItemDraft } from '@/src/components/ItemFormFields';
import { CATEGORY_ICON } from '@/src/constants/categories';
import { colors, radii, spacing } from '@/src/constants/theme';
import { deleteImage, persistImage } from '@/src/services/imageStorage';
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
          <Icon name={item.favorite ? 'star' : 'star-outline'} size={22} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, item, updateItem]);

  if (!item || !draft) {
    return <EmptyState icon="shirt-outline" title="Item not found" subtitle="It may have been deleted." />;
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
    const previousUri = currentItem.imageUri;
    await updateItem(currentItem.id, { imageUri: persistedUri });
    if (previousUri) deleteImage(previousUri);
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
        <ClothingImage uri={item.imageUri} fallbackIcon={CATEGORY_ICON[item.category]} style={styles.photo} iconSize={30} />
        <View style={styles.photoHint}>
          <Icon name="camera-outline" size={13} color={colors.textMuted} />
          <Text style={styles.photoHintText}>{item.imageUri ? 'Change photo' : 'Add a photo'}</Text>
        </View>
      </Pressable>

      <Card style={styles.statsRow} padded={false}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{item.wearCount}</Text>
          <Text style={styles.statLabel}>Times worn</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{formatRelative(item.lastWornAt)}</Text>
          <Text style={styles.statLabel}>Last worn</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.statLabel}>Added</Text>
        </View>
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <ItemFormFields draft={draft} onChange={patchDraft} />
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        <Button label="Save changes" size="lg" onPress={handleSave} loading={saving} fullWidth />
        <Button label="Delete item" variant="danger" onPress={confirmDelete} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  photo: { width: '100%', height: 260, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  photoHint: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', marginTop: spacing.sm },
  photoHintText: { color: colors.textMuted, fontSize: 12.5, fontWeight: '600' },
  statsRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue: { fontSize: 14, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});

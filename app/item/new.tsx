import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { ItemFormFields, type ItemDraft } from '@/src/components/ItemFormFields';
import { colors, radii, spacing } from '@/src/constants/theme';
import { GeminiError, identifyClothingItem } from '@/src/services/gemini';
import { persistImage } from '@/src/services/imageStorage';
import { useClosetStore } from '@/src/store/closetStore';
import { useSettingsStore } from '@/src/store/settingsStore';

const INITIAL_DRAFT: ItemDraft = {
  name: '',
  category: 'top',
  subcategory: 'tshirt',
  colorsText: '',
  formality: 'casual',
  season: 'all',
};

export default function NewItemScreen() {
  const router = useRouter();
  const addItem = useClosetStore((s) => s.addItem);
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);

  const [photo, setPhoto] = useState<{ uri: string; base64: string | null; mimeType: string } | null>(null);
  const [draft, setDraft] = useState<ItemDraft>(INITIAL_DRAFT);
  const [identifying, setIdentifying] = useState(false);
  const [saving, setSaving] = useState(false);

  function patchDraft(patch: Partial<ItemDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function pickPhoto(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', `Please allow ${fromCamera ? 'camera' : 'photo library'} access to continue.`);
      return;
    }
    const pickerResult = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;
    const asset = pickerResult.assets[0];
    setPhoto({ uri: asset.uri, base64: asset.base64 ?? null, mimeType: asset.mimeType ?? 'image/jpeg' });
  }

  async function handleIdentify() {
    if (!photo?.base64) return;
    if (!geminiApiKey) {
      Alert.alert('Add an API key', 'Add a Gemini API key in Settings to auto-identify clothing from photos.');
      return;
    }
    setIdentifying(true);
    try {
      const identified = await identifyClothingItem(geminiApiKey, { base64: photo.base64, mimeType: photo.mimeType });
      patchDraft({
        name: identified.name ?? draft.name,
        category: identified.category ?? draft.category,
        subcategory: identified.subcategory ?? draft.subcategory,
        colorsText: identified.colors?.join(', ') ?? draft.colorsText,
        formality: identified.formality ?? draft.formality,
        fit: identified.fit,
        sleeve: identified.sleeve,
        season: identified.season ?? draft.season,
        brand: identified.brand,
        pattern: identified.pattern,
      });
    } catch (err) {
      const message = err instanceof GeminiError ? err.message : 'Could not identify this item automatically.';
      Alert.alert('AI identification failed', message);
    } finally {
      setIdentifying(false);
    }
  }

  async function handleSave() {
    const colors = draft.colorsText
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    const name = draft.name.trim() || `${draft.category} item`;

    setSaving(true);
    try {
      const imageUri = photo ? await persistImage(photo.uri, 'clothes') : undefined;
      await addItem({
        name,
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
        imageUri,
      });
      router.back();
    } catch {
      Alert.alert('Something went wrong', 'Could not save this item. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      {photo ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
          <Pressable style={styles.retake} onPress={() => setPhoto(null)}>
            <Text style={styles.retakeText}>Change photo</Text>
          </Pressable>
          {geminiApiKey ? (
            <Pressable style={styles.identifyButton} onPress={handleIdentify} disabled={identifying}>
              {identifying ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <>
                  <Icon name="sparkles" size={16} color={colors.accent} />
                  <Text style={styles.identifyText}>Identify with AI</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.pickRow}>
          <Pressable style={styles.pickButton} onPress={() => pickPhoto(true)}>
            <Icon name="camera.fill" size={24} color={colors.accent} />
            <Text style={styles.pickButtonText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.pickButton} onPress={() => pickPhoto(false)}>
            <Icon name="photo.on.rectangle" size={24} color={colors.accent} />
            <Text style={styles.pickButtonText}>Choose Photo</Text>
          </Pressable>
        </View>
      )}

      <View style={{ marginTop: spacing.xl }}>
        <ItemFormFields draft={draft} onChange={patchDraft} />
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save item</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pickRow: { flexDirection: 'row', gap: spacing.md },
  pickButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickButtonText: { fontSize: 14, fontWeight: '700', color: colors.text },
  photoWrap: { alignItems: 'center' },
  photo: { width: '100%', height: 260, borderRadius: radii.lg, backgroundColor: colors.card },
  retake: { marginTop: spacing.sm },
  retakeText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  identifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  identifyText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});

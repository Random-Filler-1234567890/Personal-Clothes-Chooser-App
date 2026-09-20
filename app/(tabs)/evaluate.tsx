import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { ItemPickerSheet } from '@/src/components/ItemPickerSheet';
import { OutfitItemList } from '@/src/components/OutfitItemRow';
import { TierBadge } from '@/src/components/TierBadge';
import { colors, radii, spacing } from '@/src/constants/theme';
import { scoreCandidate } from '@/src/engine/outfitEngine';
import { scoreToTier } from '@/src/engine/tierEngine';
import { evaluateOutfitPhoto, GeminiError } from '@/src/services/gemini';
import { persistImage } from '@/src/services/imageStorage';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import type { Tier } from '@/src/types';
import { todayIso } from '@/src/utils/date';

interface EvalResult {
  tier: Tier;
  reasoning: string;
  aiEvaluated: boolean;
}

export default function EvaluateScreen() {
  const router = useRouter();
  const items = useClosetStore((s) => s.items);
  const markWorn = useClosetStore((s) => s.markWorn);
  const addOutfit = useOutfitStore((s) => s.addOutfit);
  const settings = useSettingsStore();

  const [photo, setPhoto] = useState<{ uri: string; base64: string | null; mimeType: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));

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
    setResult(null);
    setSelectedIds([]);
  }

  async function handleEvaluate() {
    if (!photo) return;
    setEvaluating(true);
    try {
      if (settings.useAiEvaluation && settings.geminiApiKey && photo.base64) {
        try {
          const ai = await evaluateOutfitPhoto(
            settings.geminiApiKey,
            { base64: photo.base64, mimeType: photo.mimeType },
            items
          );
          const matched = ai.matchedItemIds.filter((id) => items.some((i) => i.id === id));
          setSelectedIds(selectedIds.length ? selectedIds : matched);
          setResult({ tier: ai.tier, reasoning: ai.reasoning, aiEvaluated: true });
          return;
        } catch (err) {
          const message = err instanceof GeminiError ? err.message : 'AI evaluation failed, using local scoring instead.';
          Alert.alert('AI unavailable', message);
        }
      }
      if (!selectedItems.length) {
        Alert.alert('Tag your items', 'Select which closet items you are wearing so the app can score the fit.');
        return;
      }
      const { score, breakdown } = scoreCandidate(selectedItems, {});
      setResult({ tier: scoreToTier(score), reasoning: breakdown.join(' '), aiEvaluated: false });
    } finally {
      setEvaluating(false);
    }
  }

  async function handleSave() {
    if (!photo || !result) return;
    setSaving(true);
    try {
      const persistedUri = await persistImage(photo.uri, 'outfits');
      if (selectedIds.length) await markWorn(selectedIds, todayIso());
      const record = await addOutfit({
        itemIds: selectedIds,
        tier: result.tier,
        tierReasoning: result.reasoning,
        aiEvaluated: result.aiEvaluated,
        photoUri: persistedUri,
        wornOn: todayIso(),
        source: 'photo',
      });
      router.push(`/outfit/${record.id}`);
    } catch {
      Alert.alert('Something went wrong', 'Could not save this outfit. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {!photo ? (
        <View style={styles.pickRow}>
          <Pressable style={styles.pickButton} onPress={() => pickPhoto(true)}>
            <Icon name="camera.fill" size={26} color={colors.accent} />
            <Text style={styles.pickButtonText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.pickButton} onPress={() => pickPhoto(false)}>
            <Icon name="photo.on.rectangle" size={26} color={colors.accent} />
            <Text style={styles.pickButtonText}>Choose Photo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
          <Pressable style={styles.retake} onPress={() => setPhoto(null)}>
            <Text style={styles.retakeText}>Retake / choose a different photo</Text>
          </Pressable>

          <Pressable style={styles.tagButton} onPress={() => setPickerOpen(true)}>
            <Text style={styles.tagButtonText}>
              {selectedItems.length ? `Tagged: ${selectedItems.map((i) => i.name).join(', ')}` : 'Tag items you are wearing'}
            </Text>
          </Pressable>

          <Pressable style={styles.evaluateButton} onPress={handleEvaluate} disabled={evaluating}>
            {evaluating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.evaluateButtonText}>Evaluate outfit</Text>}
          </Pressable>

          {result ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <TierBadge tier={result.tier} size="lg" />
                <Text style={styles.resultSource}>{result.aiEvaluated ? 'AI evaluation' : 'Local scoring'}</Text>
              </View>
              <Text style={styles.reasoning}>{result.reasoning}</Text>
              {selectedItems.length ? <OutfitItemList items={selectedItems} /> : null}
              <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save to history</Text>}
              </Pressable>
            </View>
          ) : null}
        </>
      )}

      <ItemPickerSheet
        visible={pickerOpen}
        title="Items in this outfit"
        items={items.filter((i) => !i.archived)}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
        onClose={() => setPickerOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
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
  photo: { width: '100%', height: 380, borderRadius: radii.lg, backgroundColor: colors.card },
  retake: { alignItems: 'center', marginTop: spacing.sm },
  retakeText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  tagButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  tagButtonText: { fontSize: 14, color: colors.textMuted },
  evaluateButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  evaluateButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  resultCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resultSource: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  reasoning: { fontSize: 14, color: colors.text, lineHeight: 20 },
  saveButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});

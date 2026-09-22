import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Icon } from '@/src/components/Icon';
import { ItemPickerSheet } from '@/src/components/ItemPickerSheet';
import { OutfitItemList } from '@/src/components/OutfitItemRow';
import { ProsConsList } from '@/src/components/ProsConsList';
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
import { showAlert } from '@/src/utils/alert';
import { todayIso } from '@/src/utils/date';

interface EvalResult {
  tier: Tier;
  pros: string[];
  cons: string[];
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
      showAlert('Permission needed', `Please allow ${fromCamera ? 'camera' : 'photo library'} access to continue.`);
      return;
    }
    const pickerResult = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;
    const asset = pickerResult.assets[0];
    const picked = { uri: asset.uri, base64: asset.base64 ?? null, mimeType: asset.mimeType ?? 'image/jpeg' };
    setPhoto(picked);
    setResult(null);
    setSelectedIds([]);

    // Auto-evaluate right away when AI is available, so taking the photo is the
    // whole interaction — the manual button below is just for retrying/tagging.
    if (settings.useAiEvaluation && settings.geminiApiKey && picked.base64) {
      setEvaluating(true);
      runAiEvaluation(picked, []).finally(() => setEvaluating(false));
    }
  }

  async function runAiEvaluation(photoToUse: NonNullable<typeof photo>, currentSelectedIds: string[]): Promise<boolean> {
    if (!settings.geminiApiKey || !photoToUse.base64) return false;
    try {
      const ai = await evaluateOutfitPhoto(
        settings.geminiApiKey,
        { base64: photoToUse.base64, mimeType: photoToUse.mimeType },
        items
      );
      const matched = ai.matchedItemIds.filter((id) => items.some((i) => i.id === id));
      setSelectedIds(currentSelectedIds.length ? currentSelectedIds : matched);
      setResult({ tier: ai.tier, pros: ai.pros, cons: ai.cons, aiEvaluated: true });
      return true;
    } catch (err) {
      const message = err instanceof GeminiError ? err.message : 'AI evaluation failed, using local scoring instead.';
      showAlert('AI unavailable', message);
      return false;
    }
  }

  async function handleEvaluate() {
    if (!photo) return;
    setEvaluating(true);
    try {
      if (settings.useAiEvaluation && settings.geminiApiKey && photo.base64) {
        const ok = await runAiEvaluation(photo, selectedIds);
        if (ok) return;
      }
      if (!selectedItems.length) {
        showAlert('Tag your items', 'Select which closet items you are wearing so the app can score the fit.');
        return;
      }
      const { score, pros, cons } = scoreCandidate(selectedItems, {});
      setResult({ tier: scoreToTier(score), pros, cons, aiEvaluated: false });
    } finally {
      setEvaluating(false);
    }
  }

  async function handleSave() {
    if (!photo || !result) return;
    setSaving(true);
    try {
      const [persistedUri] = await Promise.all([
        persistImage(photo.uri, 'outfits'),
        selectedIds.length ? markWorn(selectedIds, todayIso()) : Promise.resolve(),
      ]);
      const record = await addOutfit({
        itemIds: selectedIds,
        tier: result.tier,
        tierPros: result.pros,
        tierCons: result.cons,
        aiEvaluated: result.aiEvaluated,
        photoUri: persistedUri,
        wornOn: todayIso(),
        source: 'photo',
      });
      router.push(`/outfit/${record.id}`);
    } catch {
      showAlert('Something went wrong', 'Could not save this outfit. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      {!photo ? (
        <View style={styles.pickRow}>
          <Pressable style={styles.pickButton} onPress={() => pickPhoto(true)}>
            <Icon name="camera-outline" size={26} color={colors.accent} />
            <Text style={styles.pickButtonText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.pickButton} onPress={() => pickPhoto(false)}>
            <Icon name="images-outline" size={26} color={colors.accent} />
            <Text style={styles.pickButtonText}>Choose Photo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
          </Card>
          <Pressable style={styles.retake} onPress={() => setPhoto(null)}>
            <Text style={styles.retakeText}>Retake / choose a different photo</Text>
          </Pressable>

          <Pressable style={styles.tagButton} onPress={() => setPickerOpen(true)}>
            <Icon name="pricetag-outline" size={16} color={colors.textMuted} />
            <Text style={styles.tagButtonText} numberOfLines={1}>
              {selectedItems.length ? selectedItems.map((i) => i.name).join(', ') : 'Tag items you are wearing (optional)'}
            </Text>
          </Pressable>

          <View style={{ marginTop: spacing.md }}>
            <Button
              label={result ? 'Re-evaluate' : 'Evaluate outfit'}
              size="lg"
              icon="sparkles"
              onPress={handleEvaluate}
              loading={evaluating}
              fullWidth
            />
          </View>

          {result ? (
            <Card style={styles.resultCard} elevated>
              <View style={styles.resultHeader}>
                <TierBadge tier={result.tier} size="lg" />
                <Text style={styles.resultSource}>{result.aiEvaluated ? 'AI evaluation' : 'Local scoring'}</Text>
              </View>
              <ProsConsList pros={result.pros} cons={result.cons} />
              {selectedItems.length ? <OutfitItemList items={selectedItems} /> : null}
              <Button label="Save to history" onPress={handleSave} loading={saving} fullWidth />
            </Card>
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
  photo: { width: '100%', height: 380, backgroundColor: colors.cardMuted },
  retake: { alignItems: 'center', marginTop: spacing.sm },
  retakeText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  tagButton: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  tagButtonText: { flex: 1, fontSize: 14, color: colors.textMuted },
  resultCard: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resultSource: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
});

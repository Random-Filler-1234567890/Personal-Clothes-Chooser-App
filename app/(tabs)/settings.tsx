import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { useSettingsStore } from '@/src/store/settingsStore';

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const items = useClosetStore((s) => s.items);
  const outfits = useOutfitStore((s) => s.outfits);
  const resetToSeed = useClosetStore((s) => s.resetToSeed);

  const [keyDraft, setKeyDraft] = useState(settings.geminiApiKey ?? '');

  function saveKey() {
    settings.update({ geminiApiKey: keyDraft.trim() || undefined });
    Alert.alert('Saved', 'Your Gemini API key has been saved on this device.');
  }

  function confirmReset() {
    Alert.alert(
      'Reset wardrobe?',
      'This replaces your current closet with the starter wardrobe list. Photos and edits you made will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetToSeed() },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.sectionTitle}>Google AI (Gemini)</Text>
      <Text style={styles.helper}>
        Add your own Gemini API key to auto-identify clothes from photos and get AI-generated S–F tier reviews of
        your outfit photos. Without a key, the app still works using its built-in styling engine.
      </Text>
      <TextInput
        value={keyDraft}
        onChangeText={setKeyDraft}
        placeholder="Paste your Gemini API key"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <View style={styles.row}>
        <Pressable style={styles.saveButton} onPress={saveKey}>
          <Text style={styles.saveButtonText}>Save key</Text>
        </Pressable>
        <Pressable style={styles.linkButton} onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}>
          <Text style={styles.linkButtonText}>Get a key</Text>
        </Pressable>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Use AI evaluation when available</Text>
        <Switch
          value={settings.useAiEvaluation}
          onValueChange={(v) => settings.update({ useAiEvaluation: v })}
          trackColor={{ true: colors.accent }}
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Preferences</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Prefer pants over shorts</Text>
        <Switch
          value={settings.preferPants}
          onValueChange={(v) => settings.update({ preferPants: v })}
          trackColor={{ true: colors.accent }}
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Stats</Text>
      <View style={styles.statsCard}>
        <Text style={styles.statLine}>{items.filter((i) => !i.archived).length} items in your closet</Text>
        <Text style={styles.statLine}>{outfits.length} outfits logged</Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl, color: colors.danger }]}>Danger zone</Text>
      <Pressable style={styles.dangerButton} onPress={confirmReset}>
        <Text style={styles.dangerButtonText}>Reset wardrobe to starter list</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  helper: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700' },
  linkButton: {
    flex: 1,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  linkButtonText: { color: colors.accent, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  switchLabel: { fontSize: 14, color: colors.text, fontWeight: '600', flex: 1, marginRight: spacing.sm },
  statsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
  },
  statLine: { fontSize: 14, color: colors.text },
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  dangerButtonText: { color: colors.danger, fontWeight: '700' },
});

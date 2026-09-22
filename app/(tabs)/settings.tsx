import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Chip } from '@/src/components/Chip';
import { Icon } from '@/src/components/Icon';
import { SectionHeader } from '@/src/components/SectionHeader';
import { colors, spacing } from '@/src/constants/theme';
import { useClosetStore } from '@/src/store/closetStore';
import { useOutfitStore } from '@/src/store/outfitStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import type { BoldnessPreference, ColorUndertone, SockPreference, StyleLeaning } from '@/src/types';
import { showAlert } from '@/src/utils/alert';

const SOCK_OPTIONS: { value: SockPreference; label: string }[] = [
  { value: 'random', label: 'Whatever matches' },
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
];

const STYLE_LEANING_OPTIONS: { value: StyleLeaning; label: string }[] = [
  { value: 'none', label: 'No preference' },
  { value: 'masculine', label: 'Masculine' },
  { value: 'feminine', label: 'Feminine' },
  { value: 'neutral', label: 'Neutral' },
];

const BOLDNESS_OPTIONS: { value: BoldnessPreference; label: string }[] = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'bold', label: 'Bold' },
];

const UNDERTONE_OPTIONS: { value: ColorUndertone; label: string }[] = [
  { value: 'unknown', label: "Not sure" },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'neutral', label: 'Neutral' },
];

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const items = useClosetStore((s) => s.items);
  const outfits = useOutfitStore((s) => s.outfits);
  const resetToSeed = useClosetStore((s) => s.resetToSeed);

  const [keyDraft, setKeyDraft] = useState(settings.geminiApiKey ?? '');
  const [showStyleProfile, setShowStyleProfile] = useState(false);

  function saveKey() {
    settings.update({ geminiApiKey: keyDraft.trim() || undefined });
    showAlert('Saved', 'Your Gemini API key has been saved on this device.');
  }

  function confirmReset() {
    showAlert(
      'Reset wardrobe?',
      'This replaces your current closet with the starter wardrobe list. Photos and edits you made will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetToSeed() },
      ]
    );
  }

  const activeCount = items.filter((i) => !i.archived).length;
  const favoriteCount = items.filter((i) => i.favorite && !i.archived).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }}>
      <Card>
        <SectionHeader title="Google AI (Gemini)" />
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
          <View style={{ flex: 1 }}>
            <Button label="Save key" onPress={saveKey} fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Get a key" variant="secondary" onPress={() => Linking.openURL('https://aistudio.google.com/apikey')} fullWidth />
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Use AI evaluation when available</Text>
          <Switch
            value={settings.useAiEvaluation}
            onValueChange={(v) => settings.update({ useAiEvaluation: v })}
            trackColor={{ true: colors.accent }}
          />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Preferences" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Prefer pants over shorts</Text>
          <Switch
            value={settings.preferPants}
            onValueChange={(v) => settings.update({ preferPants: v })}
            trackColor={{ true: colors.accent }}
          />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Text style={styles.switchLabel}>Socks</Text>
          <Text style={styles.helper}>
            Socks are a detail, not a decision — pick a default and outfits will just use it instead of rolling it
            randomly every time.
          </Text>
          <View style={styles.chipRow}>
            {SOCK_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={settings.sockPreference === opt.value}
                onPress={() => settings.update({ sockPreference: opt.value })}
              />
            ))}
          </View>
        </View>
      </Card>

      <Card>
        <Pressable onPress={() => setShowStyleProfile((s) => !s)}>
          <SectionHeader
            title="Style profile (optional)"
            action={<Icon name={showStyleProfile ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />}
          />
        </Pressable>
        <Text style={styles.helper}>
          Entirely optional — tells the feedback how to talk about a fit and nudges generation toward bolder or more
          subtle picks. Leave it as-is and nothing changes.
        </Text>

        {showStyleProfile ? (
          <View style={{ gap: spacing.lg }}>
            <View>
              <Text style={styles.switchLabel}>How should feedback describe your fits?</Text>
              <View style={styles.chipRow}>
                {STYLE_LEANING_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={settings.styleLeaning === opt.value}
                    onPress={() => settings.update({ styleLeaning: opt.value })}
                  />
                ))}
              </View>
            </View>

            <View>
              <Text style={styles.switchLabel}>Confidence / boldness</Text>
              <Text style={styles.helper}>Nudges generated outfits toward more statement pieces or safer, quieter ones.</Text>
              <View style={styles.chipRow}>
                {BOLDNESS_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={settings.boldness === opt.value}
                    onPress={() => settings.update({ boldness: opt.value })}
                  />
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 0 }}>
              <Text style={styles.switchLabel}>Color undertone</Text>
              <Text style={styles.helper}>
                If you know whether you lean warm or cool, feedback will occasionally note when a palette does or
                doesn't play well with it.
              </Text>
              <View style={styles.chipRow}>
                {UNDERTONE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={settings.colorUndertone === opt.value}
                    onPress={() => settings.update({ colorUndertone: opt.value })}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title="Stats" />
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{outfits.length}</Text>
            <Text style={styles.statLabel}>Outfits logged</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{favoriteCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Danger zone" />
        <Button label="Reset wardrobe to starter list" variant="danger" onPress={confirmReset} fullWidth />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  helper: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  switchLabel: { fontSize: 14, color: colors.text, fontWeight: '600', flex: 1, marginRight: spacing.sm },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});

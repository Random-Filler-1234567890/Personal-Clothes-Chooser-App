import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/src/components/Chip';
import {
  ALL_CATEGORIES,
  ALL_FORMALITIES,
  CATEGORY_LABEL,
  FIT_LABEL,
  SEASON_LABEL,
  SLEEVE_LABEL,
  SUBCATEGORIES_BY_CATEGORY,
  SUBCATEGORY_LABEL,
} from '@/src/constants/categories';
import { colors, spacing } from '@/src/constants/theme';
import type { Category, Fit, Formality, Season, Sleeve, Subcategory } from '@/src/types';

export interface ItemDraft {
  name: string;
  category: Category;
  subcategory: Subcategory;
  colorsText: string;
  formality: Formality;
  fit?: Fit;
  sleeve?: Sleeve;
  season: Season;
  brand?: string;
  pattern?: string;
  notes?: string;
}

const FITS: Fit[] = ['loose', 'regular', 'tight', 'relaxed'];
const SLEEVES: Sleeve[] = ['short', 'long', 'sleeveless', 'n/a'];
const SEASONS: Season[] = ['all', 'warm', 'cool'];

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  labels,
  onChange,
  clearable,
}: {
  options: T[];
  value?: T;
  labels: Record<string, string>;
  onChange: (v: T | undefined) => void;
  clearable?: boolean;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Chip
          key={opt}
          label={labels[opt] ?? opt}
          selected={value === opt}
          onPress={() => onChange(clearable && value === opt ? undefined : opt)}
        />
      ))}
    </View>
  );
}

export function ItemFormFields({ draft, onChange }: { draft: ItemDraft; onChange: (patch: Partial<ItemDraft>) => void }) {
  const subcats = SUBCATEGORIES_BY_CATEGORY[draft.category] ?? [];

  return (
    <View>
      <Section label="Name">
        <TextInput
          value={draft.name}
          onChangeText={(name) => onChange({ name })}
          placeholder="e.g. Black Batman graphic tee"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </Section>

      <Section label="Category">
        <ChipRow
          options={ALL_CATEGORIES}
          value={draft.category}
          labels={CATEGORY_LABEL}
          onChange={(v) => {
            if (!v) return;
            const nextSub = SUBCATEGORIES_BY_CATEGORY[v]?.[0];
            onChange({ category: v, subcategory: nextSub });
          }}
        />
      </Section>

      <Section label="Type">
        <ChipRow options={subcats} value={draft.subcategory} labels={SUBCATEGORY_LABEL} onChange={(v) => v && onChange({ subcategory: v })} />
      </Section>

      <Section label="Colors (comma separated)">
        <TextInput
          value={draft.colorsText}
          onChangeText={(colorsText) => onChange({ colorsText })}
          placeholder="e.g. black, white"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="none"
        />
      </Section>

      <Section label="Formality">
        <ChipRow options={ALL_FORMALITIES} value={draft.formality} labels={{ athletic: 'Athletic', casual: 'Casual', 'smart-casual': 'Smart Casual', formal: 'Formal' }} onChange={(v) => v && onChange({ formality: v })} />
      </Section>

      <Section label="Fit">
        <ChipRow options={FITS} value={draft.fit} labels={FIT_LABEL} onChange={(v) => onChange({ fit: v })} clearable />
      </Section>

      <Section label="Sleeve">
        <ChipRow options={SLEEVES} value={draft.sleeve} labels={SLEEVE_LABEL} onChange={(v) => onChange({ sleeve: v })} clearable />
      </Section>

      <Section label="Season">
        <ChipRow options={SEASONS} value={draft.season} labels={SEASON_LABEL} onChange={(v) => onChange({ season: v ?? 'all' })} />
      </Section>

      <Section label="Brand (optional)">
        <TextInput
          value={draft.brand ?? ''}
          onChangeText={(brand) => onChange({ brand })}
          placeholder="e.g. Calvin Klein"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </Section>

      <Section label="Pattern / graphic (optional)">
        <TextInput
          value={draft.pattern ?? ''}
          onChangeText={(pattern) => onChange({ pattern })}
          placeholder="e.g. Star Wars graphic"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </Section>

      <Section label="Notes (optional)">
        <TextInput
          value={draft.notes ?? ''}
          onChangeText={(notes) => onChange({ notes })}
          placeholder="Anything else worth remembering"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
          multiline
        />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
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
});

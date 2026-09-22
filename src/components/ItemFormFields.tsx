import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/src/components/Card';
import { Chip } from '@/src/components/Chip';
import { Icon } from '@/src/components/Icon';
import {
  ALL_CATEGORIES,
  ALL_FORMALITIES,
  CATEGORY_LABEL,
  FIT_LABEL,
  FORMALITY_LABEL,
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
  quantity: number;
}

const FITS: Fit[] = ['loose', 'regular', 'tight', 'relaxed'];
const SLEEVES: Sleeve[] = ['short', 'long', 'sleeveless', 'n/a'];
const SEASONS: Season[] = ['all', 'warm', 'cool'];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
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
  const [showMore, setShowMore] = useState(
    !!(draft.brand?.trim() || draft.pattern?.trim() || draft.notes?.trim())
  );

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Field label="Name">
          <TextInput
            value={draft.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="e.g. Black Batman graphic tee"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </Field>

        <Field label="Category">
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
        </Field>

        <Field label="Type">
          <ChipRow options={subcats} value={draft.subcategory} labels={SUBCATEGORY_LABEL} onChange={(v) => v && onChange({ subcategory: v })} />
        </Field>

        <Field label="Colors">
          <TextInput
            value={draft.colorsText}
            onChangeText={(colorsText) => onChange({ colorsText })}
            placeholder="e.g. black, white — comma separated"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
          />
        </Field>

        <View style={{ marginBottom: 0 }}>
          <Field label="How many identical ones do you own?">
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperButton}
                onPress={() => onChange({ quantity: Math.max(1, draft.quantity - 1) })}
              >
                <Icon name="remove" size={16} color={colors.text} />
              </Pressable>
              <Text style={styles.stepperValue}>{draft.quantity}</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => onChange({ quantity: Math.min(20, draft.quantity + 1) })}
              >
                <Icon name="add" size={16} color={colors.text} />
              </Pressable>
            </View>
          </Field>
        </View>
      </Card>

      <Card>
        <Field label="Formality">
          <ChipRow options={ALL_FORMALITIES} value={draft.formality} labels={FORMALITY_LABEL} onChange={(v) => v && onChange({ formality: v })} />
        </Field>

        <Field label="Fit">
          <ChipRow options={FITS} value={draft.fit} labels={FIT_LABEL} onChange={(v) => onChange({ fit: v })} clearable />
        </Field>

        <Field label="Sleeve">
          <ChipRow options={SLEEVES} value={draft.sleeve} labels={SLEEVE_LABEL} onChange={(v) => onChange({ sleeve: v })} clearable />
        </Field>

        <View style={{ marginBottom: 0 }}>
          <Field label="Season">
            <ChipRow options={SEASONS} value={draft.season} labels={SEASON_LABEL} onChange={(v) => onChange({ season: v ?? 'all' })} />
          </Field>
        </View>
      </Card>

      <Card>
        <Pressable style={styles.moreToggle} onPress={() => setShowMore((s) => !s)}>
          <Text style={styles.moreToggleText}>More details</Text>
          <Icon name={showMore ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </Pressable>

        {showMore ? (
          <View style={{ marginTop: spacing.md }}>
            <Field label="Brand (optional)">
              <TextInput
                value={draft.brand ?? ''}
                onChangeText={(brand) => onChange({ brand })}
                placeholder="e.g. Calvin Klein"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </Field>

            <Field label="Pattern / graphic (optional)">
              <TextInput
                value={draft.pattern ?? ''}
                onChangeText={(pattern) => onChange({ pattern })}
                placeholder="e.g. Star Wars graphic"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </Field>

            <View style={{ marginBottom: 0 }}>
              <Field label="Notes (optional)">
                <TextInput
                  value={draft.notes ?? ''}
                  onChangeText={(notes) => onChange({ notes })}
                  placeholder="Anything else worth remembering"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  multiline
                />
              </Field>
            </View>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
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
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moreToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    alignSelf: 'flex-start',
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
});

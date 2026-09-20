import { StyleSheet, Text, View } from 'react-native';

import { tierColors } from '@/src/constants/theme';
import type { Tier } from '@/src/types';

export function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' | 'lg' }) {
  const dimension = size === 'lg' ? 64 : size === 'md' ? 40 : 28;
  const fontSize = size === 'lg' ? 30 : size === 'md' ? 18 : 13;
  const color = tierColors[tier] ?? '#807869';
  return (
    <View
      style={[
        styles.badge,
        { width: dimension, height: dimension, borderRadius: dimension / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{tier}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

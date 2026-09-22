import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { colors, spacing } from '@/src/constants/theme';

export function ProsConsList({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {pros.map((line, i) => (
        <View key={`pro-${i}`} style={styles.row}>
          <Icon name="checkmark-circle" size={15} color={colors.success} />
          <Text style={styles.line}>{line}</Text>
        </View>
      ))}
      {cons.map((line, i) => (
        <View key={`con-${i}`} style={styles.row}>
          <Icon name="alert-circle" size={15} color={colors.danger} />
          <Text style={styles.line}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
  },
  line: {
    flex: 1,
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
  },
});

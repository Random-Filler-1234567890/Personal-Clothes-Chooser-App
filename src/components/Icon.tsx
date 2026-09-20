import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';
import { Platform, Text } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: ColorValue;
}

export function Icon({ name, size = 22, color = '#211D18' }: IconProps) {
  if (Platform.OS !== 'ios') {
    return <Text style={{ fontSize: size * 0.6, color }}>●</Text>;
  }
  return <SymbolView name={name as any} size={size} tintColor={color} />;
}

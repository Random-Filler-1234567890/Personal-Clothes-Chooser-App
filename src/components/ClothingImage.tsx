import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IoniconName } from '@/src/components/Icon';
import { colors } from '@/src/constants/theme';
import { useImageSource } from '@/src/hooks/useImageSource';

export function ClothingImage({
  uri,
  fallbackIcon,
  style,
  iconSize,
}: {
  uri?: string;
  fallbackIcon: IoniconName;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  const resolved = useImageSource(uri);

  return (
    <View style={[styles.container, style]}>
      {resolved ? (
        <Image source={{ uri: resolved }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Icon name={fallbackIcon} size={iconSize ?? 26} color={colors.textFaint} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.cardMuted,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

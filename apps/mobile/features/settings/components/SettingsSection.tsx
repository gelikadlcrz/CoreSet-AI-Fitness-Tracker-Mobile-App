import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { COLORS } from '../../../shared/theme';

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function SettingsSection({
  title,
  children,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>
        {title}
      </Text>

      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 28,
  },

  title: {
    color: COLORS.textMuted,

    fontSize: 20,
    fontWeight: '700',

    marginBottom: 12,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: COLORS.surface,

    borderRadius: 24,

    borderWidth: 1,
    borderColor: COLORS.border,

    padding: 18,
  },
});
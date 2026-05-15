import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../../shared/theme';

type Props = {
  title: string;
  subtitle?: string;
};

export default function SectionHeader({
  title,
  subtitle,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '900',
  },

  subtitle: {
    color: COLORS.textMuted,
    marginTop: 4,
    fontSize: 16,
  },
});
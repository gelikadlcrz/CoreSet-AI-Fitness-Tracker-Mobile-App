import { StyleSheet, Text, View } from 'react-native';

const UI = {
  text: '#FFFFFF',
  muted: '#8E8E93',
};

type Props = {
  title: string;
  subtitle: string;
};

export default function GreetingBlock({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  title: {
    color: UI.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 7,
  },
  subtitle: {
    color: UI.muted,
    fontSize: 13,
    fontWeight: '500',
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

const UI = {
  accentYellow: '#E0FB4A',
  accentOrange: '#FF5A36',
  text: '#FFFFFF',
  muted: '#8E8E93',
};

type Props = {
  onStart: () => void;
};

export default function QuickStartCard({ onStart }: Props) {
  return (
    <Pressable style={styles.card} onPress={onStart}>
      <View style={styles.copy}>
        <Text style={styles.label}>Quick Start</Text>
        <Text style={styles.title}>Start Empty Session</Text>
        <Text style={styles.description}>Jump in and start tracking your workout now.</Text>
      </View>

      <View style={styles.playButton}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderColor: UI.accentYellow,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    minHeight: 118,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  copy: {
    flex: 1,
    paddingRight: 18,
  },
  label: {
    color: UI.accentYellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: UI.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    color: UI.muted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    maxWidth: 205,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: UI.accentOrange,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  playIcon: {
    color: UI.text,
    fontSize: 22,
    fontWeight: '900',
    marginLeft: 3,
  },
});

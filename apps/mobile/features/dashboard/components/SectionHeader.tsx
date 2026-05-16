import { Pressable, StyleSheet, Text, View } from 'react-native';

const UI = {
  accentYellow: '#E0FB4A',
  accentOrange: '#FF5A36',
  text: '#FFFFFF',
};

type Props = {
  title: string;
  icon: 'routine' | 'activity';
  actionLabel: string;
  onPressAction: () => void;
};

export default function SectionHeader({ title, icon, actionLabel, onPressAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <Text style={styles.icon}>{icon === 'routine' ? '⌁H' : '⌁⌁'}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      <Pressable onPress={onPressAction} hitSlop={8}>
        <Text style={styles.action}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  titleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    color: UI.accentYellow,
    fontSize: 16,
    fontWeight: '900',
  },
  title: {
    color: UI.text,
    fontSize: 17,
    fontWeight: '800',
  },
  action: {
    color: UI.accentOrange,
    fontSize: 12,
    fontWeight: '700',
  },
});

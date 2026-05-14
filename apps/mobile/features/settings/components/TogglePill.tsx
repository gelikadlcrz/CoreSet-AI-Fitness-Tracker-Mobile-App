import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { COLORS } from '../../../shared/theme';

type Props = {
  leftLabel: string;
  rightLabel: string;

  selected: 'left' | 'right';

  onLeftPress: () => void;
  onRightPress: () => void;
};

export default function TogglePill({
  leftLabel,
  rightLabel,
  selected,
  onLeftPress,
  onRightPress,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.option,
          selected === 'left' &&
            styles.active,
        ]}
        onPress={onLeftPress}
      >
        <Text
          style={[
            styles.text,
            selected === 'left' &&
              styles.activeText,
          ]}
        >
          {leftLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          selected === 'right' &&
            styles.active,
        ]}
        onPress={onRightPress}
      >
        <Text
          style={[
            styles.text,
            selected === 'right' &&
              styles.activeText,
          ]}
        >
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',

    backgroundColor:
      COLORS.input,

    borderRadius: 999,

    padding: 4,

    gap: 6,
  },

  option: {
    minWidth: 70,

    alignItems: 'center',

    paddingVertical: 10,
    paddingHorizontal: 16,

    borderRadius: 999,
  },

  active: {
    backgroundColor:
      COLORS.accent,
  },

  text: {
    color: COLORS.textMuted,

    fontWeight: '700',
    fontSize: 16,
  },

  activeText: {
    color: '#000',
  },
});
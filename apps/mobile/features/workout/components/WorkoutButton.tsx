import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/shared/theme';

type Props = {
  title: string;
  variant?: 'primary' | 'danger';
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function WorkoutButton({
  title,
  variant = 'primary',
  small = false,
  style,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.button,
        variant === 'danger'
          ? styles.dangerButton
          : styles.primaryButton,
        small && styles.smallButton,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          small && styles.smallText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButton: {
    backgroundColor: COLORS.accent,
  },

  dangerButton: {
    backgroundColor: COLORS.danger,
  },

  smallButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 22,
  },

  text: {
    color: '#111',
    fontSize: 18,
    fontWeight: '600',
  },

  smallText: {
    fontSize: 17,
  },
});
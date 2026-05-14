import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { COLORS } from '../../../shared/theme';

type Props = {
  label: string;
  value?: string;

  children?: React.ReactNode;

  noBorder?: boolean;
};

export default function SettingsRow({
  label,
  value,
  children,
  noBorder,
}: Props) {
  return (
    <View
      style={[
        styles.row,
        noBorder && styles.noBorder,
      ]}
    >
      <Text style={styles.label}>
        {label}
      </Text>

      {children ? (
        <View style={styles.right}>
          {children}
        </View>
      ) : (
        <Text style={styles.value}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    paddingVertical: 18,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.divider,
  },

  noBorder: {
    borderBottomWidth: 0,
  },

  label: {
    color: COLORS.text,

    fontSize: 18,
  },

  value: {
    color: COLORS.accent,

    fontWeight: '700',
    fontSize: 18,
  },

  right: {
    alignItems: 'flex-end',
  },
});
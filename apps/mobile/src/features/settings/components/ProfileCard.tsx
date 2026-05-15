import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { COLORS } from '../../../../shared/theme';

export default function ProfileCard() {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.avatar} />

        <View style={styles.info}>
          <Text style={styles.name}>
            Renzo
          </Text>

          <Text style={styles.goal}>
            Hypertrophy Goal
          </Text>

          <Text style={styles.level}>
            Intermediate
          </Text>

          <Text style={styles.extra}>
            Male • 21 yrs old
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 82,
    height: 82,

    borderRadius: 999,

    backgroundColor:
      COLORS.surfaceSecondary,

    marginRight: 18,
  },

  info: {
    flex: 1,
  },

  name: {
    color: COLORS.text,

    fontSize: 28,
    fontWeight: '800',
  },

  goal: {
    marginTop: 4,

    color: COLORS.accent,

    fontWeight: '700',

    fontSize: 18,
  },

  level: {
    marginTop: 4,

    color: COLORS.textSecondary,

    fontSize: 16,
  },

  extra: {
    marginTop: 4,

    color: COLORS.textMuted,

    fontSize: 15,
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: COLORS.danger,

    borderRadius: 14,

    paddingVertical: 14,

    alignItems: 'center',
  },

  logoutText: {
    color: COLORS.danger,

    fontWeight: '800',
    fontSize: 16,
  },
});
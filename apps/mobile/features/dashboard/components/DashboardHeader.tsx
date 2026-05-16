import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { DashboardProfile } from '../types/dashboard.types';
import { getInitials } from '../utils/dashboardFormatters';

const logoSource = require('../../../assets/images/icon.png');

const UI = {
  accentYellow: '#E0FB4A',
  text: '#FFFFFF',
  muted: '#8E8E93',
  card: '#222222',
};

type Props = {
  profile: DashboardProfile | null;
  onPressProfile: () => void;
};

export default function DashboardHeader({ profile, onPressProfile }: Props) {
  const initials = profile ? getInitials(profile.firstName, profile.displayName) : 'U';

  return (
    <View style={styles.header}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />

      <Pressable style={styles.profileButton} onPress={onPressProfile}>
        {profile?.profilePhotoUrl ? (
          <Image source={{ uri: profile.profilePhotoUrl }} style={styles.profilePhoto} resizeMode="cover" />
        ) : (
          <View style={styles.profileFallback}>
            <View style={styles.profileHead} />
            <View style={styles.profileShoulders} />
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  logo: {
    height: 44,
    width: 44,
  },
  profileButton: {
    alignItems: 'center',
    borderColor: 'rgba(224, 251, 74, 0.45)',
    borderRadius: 23,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  profilePhoto: {
    borderRadius: 21,
    height: 42,
    width: 42,
  },
  profileFallback: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 42,
  },
  profileHead: {
    borderColor: 'rgba(224, 251, 74, 0.55)',
    borderRadius: 6,
    borderWidth: 1,
    height: 10,
    marginBottom: 3,
    width: 10,
  },
  profileShoulders: {
    borderColor: 'rgba(224, 251, 74, 0.55)',
    borderRadius: 18,
    borderTopWidth: 1,
    height: 14,
    width: 28,
  },
  initials: {
    color: UI.muted,
    fontSize: 0,
  },
});

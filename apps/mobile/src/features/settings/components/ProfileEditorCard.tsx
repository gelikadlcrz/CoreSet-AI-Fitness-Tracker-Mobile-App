import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../shared/theme';
import EditableField from './EditableField';
import type { SettingsForm } from '../hooks/useSettingsForm';

type Props = {
  form: SettingsForm;
  update: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
};

export default function ProfileEditorCard({ form, update }: Props) {
  const setDemoPhoto = () => {
    update('photoUri', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300');
  };

  return (
    <View>
      <View style={styles.profileTop}>
        <TouchableOpacity style={styles.avatar} onPress={setDemoPhoto} activeOpacity={0.85}>
          {form.photoUri ? (
            <Image source={{ uri: form.photoUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={42} color={COLORS.textMuted} />
          )}
        </TouchableOpacity>

        <View style={styles.profileCopy}>
          <Text style={styles.name}>{form.displayName || 'Guest User'}</Text>
          <Text style={styles.goal}>{form.goal || 'No goal set'}</Text>
          <Text style={styles.hint}>Tap avatar to set a demo profile photo</Text>
        </View>
      </View>

      <EditableField label="Name" value={form.displayName} onChangeText={value => update('displayName', value)} />
      <EditableField label="Email" value={form.email} onChangeText={value => update('email', value)} keyboardType="email-address" />
      <EditableField label="Goal" value={form.goal} onChangeText={value => update('goal', value)} />
      <EditableField label="Level" value={form.level} onChangeText={value => update('level', value)} />
      <View style={styles.twoColumns}>
        <View style={styles.column}>
          <EditableField label="Sex" value={form.sex} onChangeText={value => update('sex', value)} />
        </View>
        <View style={styles.column}>
          <EditableField label="Age" value={form.age} onChangeText={value => update('age', value)} keyboardType="numeric" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileCopy: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  goal: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  hint: {
    color: COLORS.textMuted,
    marginTop: 6,
    fontSize: 12,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
});

import { Text, TextInput, StyleSheet, View } from 'react-native';
import { COLORS } from '../../../../shared/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  suffix?: string;
};

export default function EditableField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  suffix,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
        />

        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 13,
  },
  suffix: {
    color: COLORS.accent,
    fontWeight: '800',
    marginLeft: 8,
  },
});

import { useState } from 'react';

import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../shared/theme';

type Props = {
  visible: boolean;

  onClose: () => void;

  onConfirm: () => void;
};

export default function DeleteConfirmationModal({
  visible,
  onClose,
  onConfirm,
}: Props) {
  const [input, setInput] =
    useState('');

  const canDelete =
    input === 'DELETE';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons
            name="warning-outline"
            size={72}
            color={COLORS.danger}
          />

          <Text style={styles.title}>
            Are you sure?
          </Text>

          <Text style={styles.description}>
            Are you absolutely certain?
            This action will
            permanently erase all
            logs, routines, and
            biometric data. Please
            type{' '}
            <Text
              style={styles.bold}
            >
              DELETE
            </Text>{' '}
            to confirm.
          </Text>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="DELETE"
            placeholderTextColor={
              COLORS.textMuted
            }
            autoCapitalize="characters"
            style={styles.input}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setInput('');
                onClose();
              }}
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!canDelete}
              style={[
                styles.confirmButton,
                !canDelete &&
                  styles.disabledButton,
              ]}
              onPress={() => {
                setInput('');
                onConfirm();
              }}
            >
              <Text
                style={
                  styles.confirmText
                }
              >
                Confirm Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    backgroundColor:
      'rgba(0,0,0,0.72)',

    justifyContent: 'center',

    paddingHorizontal: 20,
  },

  card: {
    backgroundColor:
      COLORS.surfaceSecondary,

    borderRadius: 28,

    paddingHorizontal: 24,
    paddingVertical: 28,

    alignItems: 'center',
  },

  title: {
    marginTop: 14,

    color: COLORS.danger,

    fontSize: 42,
    fontWeight: '800',
  },

  description: {
    marginTop: 18,

    color: COLORS.text,

    fontSize: 17,

    lineHeight: 34,

    textAlign: 'center',
  },

  bold: {
    fontWeight: '800',
  },

  input: {
    width: '100%',

    marginTop: 28,

    backgroundColor:
      COLORS.surfaceTertiary,

    borderWidth: 2,
    borderColor:
      COLORS.danger,

    borderRadius: 16,

    paddingHorizontal: 18,
    paddingVertical: 18,

    color: COLORS.text,

    fontSize: 24,
  },

  actions: {
    flexDirection: 'row',

    gap: 16,

    marginTop: 28,
  },

  cancelButton: {
    flex: 1,

    backgroundColor:
      COLORS.surface,

    borderRadius: 14,

    paddingVertical: 16,

    alignItems: 'center',
  },

  confirmButton: {
    flex: 1,

    backgroundColor:
      '#7A4444',

    borderWidth: 1,
    borderColor:
      COLORS.danger,

    borderRadius: 14,

    paddingVertical: 16,

    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.45,
  },

  cancelText: {
    color: COLORS.text,

    fontSize: 16,
  },

  confirmText: {
    color: COLORS.text,

    fontSize: 16,
    fontWeight: '700',
  },
});
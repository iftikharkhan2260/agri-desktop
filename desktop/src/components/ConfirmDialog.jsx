import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';

export default function ConfirmDialog({ visible, title, message, onConfirm, onCancel }) {
  const { t, fontFamily } = useLang();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[styles.title, { fontFamily: fontFamily('bold') }]}>
            {title || t('confirmDeleteTitle')}
          </Text>
          <Text style={[styles.message, { fontFamily: fontFamily('regular') }]}>
            {message || t('confirmDeleteMsg')}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={[styles.cancelText, { fontFamily: fontFamily('medium') }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={onConfirm}>
              <Text style={[styles.deleteText, { fontFamily: fontFamily('medium') }]}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,37,69,0.45)', justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: 17, color: colors.textPrimary, marginBottom: spacing.sm },
  message: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  cancelText: { color: colors.textSecondary },
  deleteBtn: {
    backgroundColor: colors.danger, borderRadius: radius.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg
  },
  deleteText: { color: '#fff' }
});

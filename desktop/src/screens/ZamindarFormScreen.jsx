import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';

export default function ZamindarFormScreen({ route, navigation }) {
  const { t, fontFamily, isRTL } = useLang();
  const existing = route.params?.zamindar;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [contact, setContact] = useState(existing?.contact || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName('');
    setContact('');
    setAddress('');
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('', t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/api/zamindars/${existing.id}`, { name, contact, address });
      } else {
        await api.post('/api/zamindars', { name, contact, address });
      }
      resetForm();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    resetForm();
    navigation.goBack();
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('name')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={name} onChangeText={setName} />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('contact')}</Text>
      <TextInput
        style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
        value={contact}
        onChangeText={setContact}
        keyboardType="phone-pad"
      />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('address')}</Text>
      <TextInput
        style={[styles.input, styles.multiline, { fontFamily: fontFamily('regular') }, align]}
        value={address}
        onChangeText={setAddress}
        multiline
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
          <Text style={[styles.cancelText, { fontFamily: fontFamily('medium') }]}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
          <Text style={[styles.submitText, { fontFamily: fontFamily('bold') }]}>{t('submit')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, backgroundColor: colors.card
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm,
    paddingVertical: spacing.md, alignItems: 'center'
  },
  cancelText: { color: colors.navy },
  submitBtn: {
    flex: 1, backgroundColor: colors.green, borderRadius: radius.sm,
    paddingVertical: spacing.md, alignItems: 'center'
  },
  submitText: { color: '#fff' }
});

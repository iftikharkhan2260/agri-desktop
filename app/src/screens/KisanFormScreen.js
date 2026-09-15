import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import SearchableDropdown from '../components/SearchableDropdown';

export default function KisanFormScreen({ route, navigation }) {
  const { t, fontFamily, isRTL } = useLang();
  const existing = route.params?.kisan;
  const isEdit = !!existing;

  // If opened via "+ Add Kisan" on a Zamindar card, that zamindar is preselected.
  const presetZamindarId = route.params?.zamindarId;
  const presetZamindarName = route.params?.zamindarName;

  const [markName, setMarkName] = useState(existing?.mark_name || '');
  const [fullName, setFullName] = useState(existing?.full_name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [address, setAddress] = useState(existing?.address || '');

  const [zamindars, setZamindars] = useState([]);
  const [guarantors, setGuarantors] = useState([]);

  const [zamindar, setZamindar] = useState(
    existing
      ? { id: existing.zamindar_id, label: existing.zamindar_name }
      : presetZamindarId
        ? { id: presetZamindarId, label: presetZamindarName }
        : null
  );
  const [guarantor, setGuarantor] = useState(
    existing ? { id: existing.guarantor_id, label: existing.guarantor_name } : null
  );

  const [saving, setSaving] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [z, g] = await Promise.all([api.get('/api/zamindars'), api.get('/api/guarantors')]);
      setZamindars(z.map((row) => ({ id: row.id, label: row.name })));
      setGuarantors(g.map((row) => ({ id: row.id, label: row.name })));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadOptions(); }, [loadOptions]));

  function resetForm() {
    setMarkName('');
    setFullName('');
    setPhone('');
    setAddress('');
    setZamindar(null);
    setGuarantor(null);
  }

  async function handleSubmit() {
    if (!markName.trim() || !fullName.trim()) {
      Alert.alert('', t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        mark_name: markName,
        full_name: fullName,
        phone,
        address,
        zamindar_id: zamindar?.id || null,
        guarantor_id: guarantor?.id || null
      };
      if (isEdit) {
        await api.put(`/api/kisans/${existing.id}`, payload);
      } else {
        await api.post('/api/kisans', payload);
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
      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('markName')}</Text>
      <TextInput
        style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
        value={markName}
        onChangeText={setMarkName}
        autoCapitalize="none"
      />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('fullName')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={fullName} onChangeText={setFullName} />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('phone')}</Text>
      <TextInput
        style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <SearchableDropdown
        label={t('zamindar')}
        value={zamindar}
        items={zamindars}
        onSelect={setZamindar}
        placeholder={t('selectZamindar')}
      />

      <SearchableDropdown
        label={t('guarantor')}
        value={guarantor}
        items={guarantors}
        onSelect={setGuarantor}
        placeholder={t('selectGuarantor')}
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
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.xl },
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

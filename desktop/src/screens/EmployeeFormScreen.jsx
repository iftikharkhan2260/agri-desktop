import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';

const ROLES = ['owner', 'manager', 'salesman', 'support_staff'];

export default function EmployeeFormScreen({ route, navigation }) {
  const { t, fontFamily, isRTL } = useLang();
  const existing = route.params?.employee;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [username, setUsername] = useState(existing?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(existing?.role || 'salesman');
  const [contact, setContact] = useState(existing?.contact || '');
  const [education, setEducation] = useState(existing?.education || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [salary, setSalary] = useState(existing?.salary ? String(existing.salary) : '');
  const [saving, setSaving] = useState(false);

  const roleLabels = { owner: t('owner'), manager: t('manager'), salesman: t('salesmanRole'), support_staff: t('supportStaff') };

  async function handleSubmit() {
    if (!name.trim() || (!isEdit && (!username.trim() || !password.trim()))) {
      Alert.alert('', t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/api/hr/employees/${existing.id}`, { name, role, contact, education, address, salary, password: password || undefined });
      } else {
        await api.post('/api/hr/employees', { name, username, password, role, contact, education, address, salary });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('name')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={name} onChangeText={setName} />

      {!isEdit && (
        <>
          <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('username')}</Text>
          <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={username} onChangeText={setUsername} autoCapitalize="none" />
        </>
      )}

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('password')}{isEdit ? ' (leave blank to keep)' : ''}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={password} onChangeText={setPassword} secureTextEntry />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('role')}</Text>
      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <TouchableOpacity key={r} style={[styles.roleChip, role === r && styles.roleChipActive]} onPress={() => setRole(r)}>
            <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive, { fontFamily: fontFamily('medium') }]}>{roleLabels[r]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('contact')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={contact} onChangeText={setContact} keyboardType="phone-pad" />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('education')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={education} onChangeText={setEducation} />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('address')}</Text>
      <TextInput style={[styles.input, styles.multiline, { fontFamily: fontFamily('regular') }, align]} value={address} onChangeText={setAddress} multiline />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('salary')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={salary} onChangeText={setSalary} keyboardType="numeric" />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
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
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.card },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleChip: { borderWidth: 1, borderColor: colors.navy, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  roleChipActive: { backgroundColor: colors.navy },
  roleChipText: { color: colors.navy, fontSize: 13 },
  roleChipTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.navy },
  submitBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  submitText: { color: '#fff' }
});

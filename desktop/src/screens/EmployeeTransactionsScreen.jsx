import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import { useAutoRefresh } from '../utils/useAutoRefresh';

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = { type: 'salary', amount: '', month: '', description: '', payment_date: today() };

export default function EmployeeTransactionsScreen({ route }) {
  const { t, fontFamily, isRTL } = useLang();
  const employee = route.params.employee;

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await api.get(`/api/hr/transactions?employee_id=${employee.id}`);
      setTransactions(rows);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, [employee.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useAutoRefresh(load);

  function startEdit(tx) {
    setEditingId(tx.id);
    setForm({
      type: tx.type,
      amount: String(tx.amount),
      month: tx.month || '',
      description: tx.description || '',
      payment_date: tx.payment_date || today()
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit() {
    if (!form.amount || Number(form.amount) <= 0) {
      Alert.alert('', t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/hr/transactions/${editingId}`, form);
      } else {
        await api.post('/api/hr/transactions', { ...form, employee_id: employee.id });
      }
      cancelEdit();
      load();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={[styles.name, { fontFamily: fontFamily('bold') }]}>{employee.name}</Text>
        {editingId ? <Text style={styles.editingBanner}>Editing record #{editingId}</Text> : null}

        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeChip, form.type === 'salary' && styles.typeChipActive]} onPress={() => setForm((f) => ({ ...f, type: 'salary' }))}>
            <Text style={[styles.typeText, form.type === 'salary' && styles.typeTextActive]}>{t('paySalary')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeChip, form.type === 'expense' && styles.typeChipActive]} onPress={() => setForm((f) => ({ ...f, type: 'expense' }))}>
            <Text style={[styles.typeText, form.type === 'expense' && styles.typeTextActive]}>{t('payExpense')}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
          placeholder={t('amount')}
          value={form.amount}
          onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
          keyboardType="numeric"
        />
        {form.type === 'salary' ? (
          <TextInput
            style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
            placeholder={t('month')}
            value={form.month}
            onChangeText={(v) => setForm((f) => ({ ...f, month: v }))}
          />
        ) : (
          <TextInput
            style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
            placeholder={t('description')}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          />
        )}
        <TextInput
          style={[styles.input, { fontFamily: fontFamily('regular') }]}
          placeholder="Date of payment (YYYY-MM-DD)"
          value={form.payment_date}
          onChangeText={(v) => setForm((f) => ({ ...f, payment_date: v }))}
        />

        <View style={styles.formActions}>
          {editingId ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
            <Text style={[styles.submitText, { fontFamily: fontFamily('bold') }]}>{editingId ? t('save') : t('submit')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(tx) => String(tx.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item: tx }) => (
          <View style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fontFamily('medium') }}>{tx.type === 'salary' ? t('paySalary') : t('payExpense')}</Text>
              <Text style={{ fontFamily: fontFamily('regular'), color: colors.textSecondary, fontSize: 12 }}>
                {tx.amount} — {tx.month || tx.description || '-'} — {tx.payment_date}
              </Text>
            </View>
            <TouchableOpacity style={styles.editIconBtn} onPress={() => startEdit(tx)}>
              <Text style={{ color: colors.navy, fontFamily: fontFamily('medium') }}>{t('edit')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { backgroundColor: colors.navy, padding: spacing.lg },
  name: { color: '#fff', fontSize: 16, marginBottom: spacing.md },
  editingBanner: { color: '#F5C518', fontSize: 12, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: { borderWidth: 1, borderColor: '#fff', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  typeChipActive: { backgroundColor: colors.green, borderColor: colors.green },
  typeText: { color: '#fff', fontSize: 13 },
  typeTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: radius.sm, padding: spacing.sm, backgroundColor: '#fff', marginBottom: spacing.sm },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#fff', borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  cancelText: { color: '#fff' },
  submitBtn: { flex: 2, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  submitText: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  editIconBtn: { borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md }
});

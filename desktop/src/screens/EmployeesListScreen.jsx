import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAutoRefresh } from '../utils/useAutoRefresh';

export default function EmployeesListScreen({ navigation }) {
  const { t, fontFamily } = useLang();
  const [employees, setEmployees] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const rows = await api.get('/api/hr/employees');
      setEmployees(rows);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useAutoRefresh(load);

  async function confirmDelete() {
    try {
      await api.del(`/api/hr/employees/${pendingDelete.id}`);
      setPendingDelete(null);
      load();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  const roleLabels = { owner: t('owner'), manager: t('manager'), salesman: t('salesmanRole'), support_staff: t('supportStaff') };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('EmployeeForm', {})}>
          <Text style={[styles.addBtnText, { fontFamily: fontFamily('bold') }]}>{t('addEmployee')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={employees}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item: e }) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <View style={styles.topRow}>
                <Text style={[styles.name, { fontFamily: fontFamily('bold') }]}>{e.name}</Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{roleLabels[e.role] || e.role}</Text>
                </View>
              </View>

              {/* Section 6: show all info on the card, not just name/role */}
              <View style={styles.infoGrid}>
                <InfoRow label={t('username')} value={e.username} fontFamily={fontFamily} />
                <InfoRow label={t('contact')} value={e.contact} fontFamily={fontFamily} />
                <InfoRow label={t('education')} value={e.education} fontFamily={fontFamily} />
                <InfoRow label={t('address')} value={e.address} fontFamily={fontFamily} />
                <InfoRow label={t('salary')} value={e.salary} fontFamily={fontFamily} />
              </View>

              <TouchableOpacity style={styles.transactionsBtn} onPress={() => navigation.navigate('EmployeeTransactions', { employee: e })}>
                <Text style={[styles.transactionsBtnText, { fontFamily: fontFamily('medium') }]}>Salary & Expenses</Text>
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('EmployeeForm', { employee: e })}>
                  <Text style={[styles.actionText, { fontFamily: fontFamily('medium') }]}>{t('edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnDanger} onPress={() => setPendingDelete(e)}>
                  <Text style={[styles.actionDangerText, { fontFamily: fontFamily('medium') }]}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <ConfirmDialog visible={!!pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />
    </View>
  );
}

function InfoRow({ label, value, fontFamily }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { fontFamily: fontFamily('regular') }]}>{label}</Text>
      <Text style={[styles.infoValue, { fontFamily: fontFamily('medium') }]}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { padding: spacing.lg, backgroundColor: colors.navy },
  addBtn: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  addBtnText: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardAccent: { width: 6, backgroundColor: colors.navy },
  cardBody: { flex: 1, padding: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  name: { fontSize: 16, color: colors.textPrimary },
  roleTag: { backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
  roleTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  infoGrid: { marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.textSecondary, fontSize: 12 },
  infoValue: { color: colors.textPrimary, fontSize: 12 },
  transactionsBtn: { borderWidth: 1, borderColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.xs, alignItems: 'center', marginBottom: spacing.sm },
  transactionsBtnText: { color: colors.green, fontSize: 13 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  actionText: { color: colors.navy, fontSize: 13 },
  actionBtnDanger: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  actionDangerText: { color: colors.danger, fontSize: 13 }
});

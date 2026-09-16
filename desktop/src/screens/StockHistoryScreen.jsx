import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import { useAutoRefresh } from '../utils/useAutoRefresh';

export default function StockHistoryScreen() {
  const { t, fontFamily, isRTL } = useLang();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ search, ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
      const data = await api.get(`/api/items/stock-history?${params}`);
      setRows(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, [search, from, to]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useAutoRefresh(load);

  const align = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <View style={styles.container}>
      <View style={styles.filterPanel}>
        <TextInput
          style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
          placeholder={t('search')}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={load}
        />
        <View style={styles.dateRow}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="From YYYY-MM-DD" value={from} onChangeText={setFrom} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="To YYYY-MM-DD" value={to} onChangeText={setTo} />
        </View>
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.applyBtn} onPress={load}>
            <Text style={[styles.applyText, { fontFamily: fontFamily('bold') }]}>{t('search')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setSearch(''); setFrom(''); setTo(''); load(); }}>
            <Text style={[styles.resetText, { fontFamily: fontFamily('medium') }]}>✕ Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item: r }) => (
          <View style={styles.row}>
            <Text style={{ fontFamily: fontFamily('bold') }}>{r.item_name} ({r.size_label})</Text>
            <Text style={{ fontFamily: fontFamily('regular'), color: colors.green, marginTop: 2 }}>+ {r.qty_added} units @ {r.price_at_time}</Text>
            <Text style={{ fontFamily: fontFamily('regular'), color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {r.created_at} · by {r.added_by_name}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterPanel: { backgroundColor: colors.navy, padding: spacing.lg },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, backgroundColor: '#fff', marginBottom: spacing.sm },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  filterActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  applyBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  applyText: { color: '#fff' },
  resetBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  resetText: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  row: { backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm }
});

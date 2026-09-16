import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useShopSettings } from '../context/ShopSettingsContext';
import { api } from '../api/client';
import { buildTableHtml, generatePdfAndShare, printHtml } from '../utils/print';
import { collectionReceiptHtml } from '../utils/receipts';
import { useAutoRefresh } from '../utils/useAutoRefresh';

export default function CollectionsScreen() {
  const { t, fontFamily, isRTL, lang } = useLang();
  const { settings } = useShopSettings();
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');

  const load = useCallback(async (q = '', d = '') => {
    try {
      const params = new URLSearchParams({ search: q, ...(d ? { date: d } : {}) }).toString();
      const rows = await api.get(`/api/collections?${params}`);
      setCollections(rows);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(search, date); }, [load]));
  useAutoRefresh(() => load(search, date));

  async function handleGetPdf() {
    const rows = collections.map((c) => ({
      id: c.collection_id, collected_by: c.collected_by_name, date: c.created_at, total: c.total_amount
    }));
    const html = buildTableHtml({
      title: t('collections'), settings, lang,
      columns: [
        { key: 'id', label: t('collectionId') }, { key: 'collected_by', label: t('collectedBy') },
        { key: 'date', label: t('date') }, { key: 'total', label: t('totalAmount') }
      ],
      rows
    });
    try { await generatePdfAndShare(html); } catch (err) { Alert.alert('Error', err.message); }
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          style={[styles.search, { fontFamily: fontFamily('regular') }, align]}
          placeholder={t('search')}
          value={search}
          onChangeText={(v) => { setSearch(v); load(v, date); }}
        />
        <TextInput
          style={[styles.dateInput, { fontFamily: fontFamily('regular') }]}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={(v) => { setDate(v); load(search, v); }}
        />
        {(search || date) ? (
          <TouchableOpacity style={styles.clearBtn} onPress={() => { setSearch(''); setDate(''); load('', ''); }}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.pdfBtn} onPress={handleGetPdf}>
          <Text style={[styles.pdfBtnText, { fontFamily: fontFamily('medium') }]}>{t('getPdf')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item: c }) => (
          <View style={styles.card}>
            <Text style={[styles.title, { fontFamily: fontFamily('bold') }]}>{c.collection_id}</Text>
            <Text style={[styles.metaHighlight, { fontFamily: fontFamily('medium') }]}>{t('collectedFrom')}: {c.collected_from_name}</Text>
            <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('collectedBy')}: {c.collected_by_name}</Text>
            <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('date')}: {c.created_at}</Text>
            {c.payments.map((p) => (
              <Text key={p.payment_id} style={[styles.line, { fontFamily: fontFamily('regular') }]}>{p.payment_no} — {p.amount.toFixed(2)}</Text>
            ))}
            <Text style={[styles.total, { fontFamily: fontFamily('bold') }]}>{t('totalAmount')}: {c.total_amount.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.printBtn}
              onPress={async () => { try { await printHtml(collectionReceiptHtml(c, settings, lang)); } catch (err) { Alert.alert('Error', err.message); } }}
            >
              <Text style={[styles.printBtnText, { fontFamily: fontFamily('medium') }]}>{t('printReceipt')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.navy },
  search: { flex: 2, backgroundColor: '#fff', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  dateInput: { flex: 1, backgroundColor: '#fff', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pdfBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  pdfBtnText: { color: '#fff' },
  clearBtn: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  title: { fontSize: 15, color: colors.textPrimary },
  meta: { color: colors.textSecondary, fontSize: 13 },
  metaHighlight: { color: colors.navy, fontSize: 14 },
  line: { color: colors.textPrimary, fontSize: 12, marginTop: 2 },
  total: { color: colors.green, fontSize: 16, textAlign: 'right', marginTop: spacing.sm },
  printBtn: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.xs, alignItems: 'center' },
  printBtnText: { color: colors.navy, fontSize: 13 }
});

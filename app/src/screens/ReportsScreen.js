import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useShopSettings } from '../context/ShopSettingsContext';
import { api } from '../api/client';
import SearchableDropdown from '../components/SearchableDropdown';
import { buildTableHtml, generatePdfAndShare } from '../utils/print';

export default function ReportsScreen() {
  const { t, fontFamily, isRTL, lang } = useLang();
  const { settings } = useShopSettings();
  const [orderType, setOrderType] = useState('all');
  const [category, setCategory] = useState(null);
  const [product, setProduct] = useState('');
  const [size, setSize] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalQty: 0, lineCount: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { product, size, from, to };
      if (orderType !== 'all') params.order_type = orderType;
      if (category) params.category_id = category.id;
      const qs = new URLSearchParams(params).toString();
      const data = await api.get(`/api/reports/sales?${qs}`);
      setRows(data.rows);
      setSummary(data.summary);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, [orderType, category, product, size, from, to]);

  useFocusEffect(useCallback(() => {
    load();
    (async () => {
      try {
        const cats = await api.get('/api/categories');
        setCategories(cats.map((c) => ({ id: c.id, label: c.name })));
      } catch (err) { Alert.alert('Error', err.message); }
    })();
  }, [load]));

  async function handleGetPdf() {
    const pdfRows = rows.map((r) => ({
      order: r.order_number, item: r.item_name, category: r.category_name || '', size: r.size_label,
      qty: r.quantity, price: r.unit_price, total: r.line_total, type: r.is_cash ? t('cash') : t('loan')
    }));
    const html = buildTableHtml({
      title: t('salesReportTitle'), settings, lang,
      columns: [
        { key: 'order', label: t('orderNumber') }, { key: 'item', label: t('itemName') }, { key: 'category', label: t('category') },
        { key: 'size', label: t('size') }, { key: 'qty', label: t('totalQty') }, { key: 'price', label: t('price') },
        { key: 'total', label: t('totalAmount') }, { key: 'type', label: t('orderType') }
      ],
      rows: pdfRows
    });
    try { await generatePdfAndShare(html); } catch (err) { Alert.alert('Error', err.message); }
  }

  function resetFilters() {
    setOrderType('all'); setCategory(null); setProduct(''); setSize(''); setFrom(''); setTo('');
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };
  const hasActiveFilters = orderType !== 'all' || category || product || size || from || to;

  return (
    <View style={styles.container}>
      {/* Compact header bar — filters live behind a button so the results
          list underneath keeps almost the whole screen (item C). */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Text style={styles.filterBtnText}>⚙ Filters</Text>
          {hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.pdfBtn} onPress={handleGetPdf}>
          <Text style={[styles.pdfBtnText, { fontFamily: fontFamily('medium') }]}>{t('getPdf')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { fontFamily: fontFamily('bold') }]}>{t('totalRevenue')}: {summary.totalRevenue.toFixed(2)}</Text>
        <Text style={[styles.summaryText, { fontFamily: fontFamily('regular') }]}>{t('totalQty')}: {summary.totalQty}</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item: r }) => (
          <View style={styles.row}>
            <Text style={{ fontFamily: fontFamily('medium') }}>{r.item_name} ({r.size_label})</Text>
            <Text style={{ fontFamily: fontFamily('regular'), color: colors.textSecondary, fontSize: 12 }}>
              {r.order_number} · {r.quantity} × {r.unit_price} = {r.line_total.toFixed(2)}
            </Text>
          </View>
        )}
      />

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { fontFamily: fontFamily('bold') }]}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.chipRow}>
                {['all', 'loan', 'cash'].map((v) => (
                  <TouchableOpacity key={v} style={[styles.chip, orderType === v && styles.chipActive]} onPress={() => setOrderType(v)}>
                    <Text style={[styles.chipText, orderType === v && styles.chipTextActive]}>{t(v)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <SearchableDropdown label={t('category')} value={category} items={categories} onSelect={setCategory} onClear={() => setCategory(null)} />
              <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('product')}</Text>
              <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={product} onChangeText={setProduct} />
              <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('size')}</Text>
              <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={size} onChangeText={setSize} />
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { fontFamily: fontFamily('medium') }]}>{t('from')}</Text>
                  <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }]} placeholder="YYYY-MM-DD" value={from} onChangeText={setFrom} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { fontFamily: fontFamily('medium') }]}>{t('to')}</Text>
                  <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }]} placeholder="YYYY-MM-DD" value={to} onChangeText={setTo} />
                </View>
              </View>
              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                  <Text style={[styles.resetText, { fontFamily: fontFamily('medium') }]}>✕ Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={() => { load(); setShowFilters(false); }}>
                  <Text style={[styles.applyText, { fontFamily: fontFamily('bold') }]}>Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.navy },
  filterBtn: { flexDirection: 'row', alignItems: 'center', flex: 1, borderWidth: 1, borderColor: '#fff', borderRadius: radius.sm, paddingVertical: spacing.sm, justifyContent: 'center' },
  filterBtnText: { color: '#fff', fontSize: 13 },
  filterActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green, marginLeft: spacing.xs },
  pdfBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  pdfBtnText: { color: '#fff' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.card },
  summaryText: { color: colors.textPrimary },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  row: { backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11,37,69,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 17, color: colors.textPrimary },
  modalClose: { fontSize: 18, color: colors.textSecondary, padding: spacing.xs },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.navy, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: 13 },
  chipTextActive: { color: '#fff' },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm, fontSize: 13 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, backgroundColor: '#fff' },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  filterActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  applyBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  applyText: { color: '#fff' },
  resetBtn: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  resetText: { color: colors.danger }
});

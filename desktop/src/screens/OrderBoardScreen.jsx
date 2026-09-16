import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import { api } from '../api/client';
import SearchableDropdown from '../components/SearchableDropdown';
import { buildTableHtml, generatePdfAndShare, printHtml } from '../utils/print';
import { orderReceiptHtml } from '../utils/receipts';
import { useAutoRefresh } from '../utils/useAutoRefresh';

const EDIT_WINDOW_MINUTES = 10; // section 4

function minutesSince(isoString) {
  // SQLite datetime('now') is stored as UTC without a 'Z' suffix — add one
  // so this doesn't get misread as local time on devices in other zones.
  const iso = isoString.includes('Z') ? isoString : isoString.replace(' ', 'T') + 'Z';
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

export default function OrderBoardScreen({ navigation }) {
  const { t, fontFamily, isRTL, lang } = useLang();
  const { permissions } = useAuth();
  const { settings } = useShopSettings();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [isCashFilter, setIsCashFilter] = useState('all');
  const [settledFilter, setSettledFilter] = useState('all'); // item 1: settled/non-settled filter
  const [from, setFrom] = useState(''); // item 1: date range filter
  const [to, setTo] = useState('');
  const [kisan, setKisan] = useState(null); // null = "All"
  const [kisans, setKisans] = useState([]);
  const [selected, setSelected] = useState({});

  // Section 2: only two filter dimensions now (is_cash, kisan), and every
  // filter change passes its value explicitly into load() rather than
  // relying on React state that may not have committed yet — that stale-
  // closure gap was the root cause of filters "giving different values".
  const load = useCallback(async (overrides = {}) => {
    const searchValue = overrides.search !== undefined ? overrides.search : search;
    const isCashValue = overrides.isCash !== undefined ? overrides.isCash : isCashFilter;
    const settledValue = overrides.settled !== undefined ? overrides.settled : settledFilter;
    const fromValue = overrides.from !== undefined ? overrides.from : from;
    const toValue = overrides.to !== undefined ? overrides.to : to;
    const kisanValue = overrides.kisan !== undefined ? overrides.kisan : kisan;

    const params = { search: searchValue };
    if (isCashValue !== 'all') params.is_cash = isCashValue;
    if (settledValue !== 'all') params.settled = settledValue;
    if (fromValue) params.from = fromValue;
    if (toValue) params.to = toValue;
    if (kisanValue) params.kisan_id = kisanValue.id;

    try {
      const rows = await api.get(`/api/orders?${new URLSearchParams(params).toString()}`);
      setOrders(rows);
      // Same fix as Payments: drop any selected order from the selection
      // if it's no longer selectable (now settled, or filtered out) so the
      // "Receive" count never shows a stale number.
      setSelected((prev) => {
        const stillValid = {};
        for (const row of rows) {
          if (prev[row.id] && !row.is_cash && !row.settled) stillValid[row.id] = row;
        }
        return stillValid;
      });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, [search, isCashFilter, settledFilter, from, to, kisan]);

  useFocusEffect(useCallback(() => {
    load();
    setSelected({}); // section 2c: don't carry a stale selection across visits
    (async () => {
      try {
        const k = await api.get('/api/kisans');
        setKisans(k.map((r) => ({ id: r.id, label: r.full_name })));
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  useAutoRefresh(() => load());

  function toggleSelect(order) {
    if (order.is_cash) return; // checkbox is only for non-cash orders
    setSelected((prev) => {
      const next = { ...prev };
      if (next[order.id]) delete next[order.id];
      else next[order.id] = order;
      return next;
    });
  }

  function handleReceive() {
    const chosen = Object.values(selected);
    if (chosen.length === 0) return;
    const kisanIds = new Set(chosen.map((o) => o.kisan_id));
    const guarantorIds = new Set(chosen.map((o) => o.guarantor_id));
    if (kisanIds.size > 1 || guarantorIds.size > 1) {
      Alert.alert('', 'Selected orders must have the same Kisan and same Guarantor.');
      return;
    }
    // Section 2c: the selection was "used" for this operation.
    setSelected({});
    navigation.navigate('SettlementForm', { orders: chosen });
  }

  async function handleGetPdf() {
    const rows = orders.map((o) => ({
      order_number: o.order_number, salesman: o.salesman_name, kisan: o.kisan_name || '',
      zamindar: o.zamindar_name || '', guarantor: o.guarantor_name || '',
      total: o.total_amount, status: o.is_cash ? t('cash') : (o.settled ? t('settled') : t('notSettled'))
    }));
    const grandTotal = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const html = buildTableHtml({
      title: t('orderBoard'), settings, lang,
      columns: [
        { key: 'order_number', label: t('orderNumber') }, { key: 'salesman', label: t('salesman') },
        { key: 'kisan', label: t('kisanName') }, { key: 'zamindar', label: t('zamindarName') },
        { key: 'guarantor', label: t('guarantorName') }, { key: 'total', label: t('totalAmount') }, { key: 'status', label: t('status') }
      ],
      rows,
      footerHtml: `<div class="grand-total">${t('grandTotal')}: ${grandTotal.toFixed(2)}</div>`
    });
    try { await generatePdfAndShare(html); } catch (err) { Alert.alert('Error', err.message); }
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };

  // Section 2b: totals respecting whatever is currently loaded (i.e. the
  // active filters), computed client-side from the same list the cards show.
  const settledTotal = orders.filter((o) => o.effectively_settled).reduce((sum, o) => sum + o.total_amount, 0);
  const nonSettledTotal = orders.filter((o) => !o.effectively_settled).reduce((sum, o) => sum + o.total_amount, 0);
  const selectedTotal = Object.values(selected).reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          style={[styles.search, { fontFamily: fontFamily('regular') }, align]}
          placeholder={t('search')}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load({ search })}
        />
        {search ? (
          <TouchableOpacity style={styles.clearSearchBtn} onPress={() => { setSearch(''); load({ search: '' }); }}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.pdfBtn} onPress={handleGetPdf}>
          <Text style={[styles.pdfBtnText, { fontFamily: fontFamily('medium') }]}>{t('getPdf')}</Text>
        </TouchableOpacity>
      </View>

      {/* Section: small filter buttons below the search field — no gear icon, no modal. */}
      <View style={styles.filterRow}>
        {['all', 'cash', 'loan'].map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.chip, isCashFilter === v && styles.chipActive]}
            onPress={() => { setIsCashFilter(v); load({ isCash: v }); }}
          >
            <Text style={[styles.chipText, isCashFilter === v && styles.chipTextActive]}>{t(v === 'all' ? 'all' : v)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: t('all') },
          { key: 'settled', label: t('settled') },
          { key: 'unsettled', label: t('notSettled') }
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, settledFilter === opt.key && styles.chipActive]}
            onPress={() => { setSettledFilter(opt.key); load({ settled: opt.key }); }}
          >
            <Text style={[styles.chipText, settledFilter === opt.key && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, !kisan && styles.chipActive]}
          onPress={() => { setKisan(null); load({ kisan: null }); }}
        >
          <Text style={[styles.chipText, !kisan && styles.chipTextActive]}>{t('all')} {t('kisanName')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.kisanDropdownRow}>
        <SearchableDropdown
          value={kisan}
          items={kisans}
          onSelect={(v) => { setKisan(v); load({ kisan: v }); }}
          onClear={() => { setKisan(null); load({ kisan: null }); }}
          placeholder={`${t('kisanName')}: ${t('all')}`}
        />
      </View>
      <View style={styles.dateFilterRow}>
        <TextInput
          style={[styles.dateInput, { fontFamily: fontFamily('regular') }]}
          placeholder={`${t('from')} YYYY-MM-DD`}
          value={from}
          onChangeText={setFrom}
          onSubmitEditing={() => load({ from })}
        />
        <TextInput
          style={[styles.dateInput, { fontFamily: fontFamily('regular') }]}
          placeholder={`${t('to')} YYYY-MM-DD`}
          value={to}
          onChangeText={setTo}
          onSubmitEditing={() => load({ to })}
        />
        {(from || to || isCashFilter !== 'all' || settledFilter !== 'all' || kisan) ? (
          <TouchableOpacity
            style={styles.dateClearBtn}
            onPress={() => {
              setFrom(''); setTo(''); setIsCashFilter('all'); setSettledFilter('all'); setKisan(null);
              load({ from: '', to: '', isCash: 'all', settled: 'all', kisan: null });
            }}
          >
            <Text style={styles.dateClearText}>✕ Reset</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Section 2b */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { fontFamily: fontFamily('regular') }]}>{t('settled')}</Text>
          <Text style={[styles.summaryValueGreen, { fontFamily: fontFamily('bold') }]}>{settledTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { fontFamily: fontFamily('regular') }]}>{t('notSettled')}</Text>
          <Text style={[styles.summaryValueRed, { fontFamily: fontFamily('bold') }]}>{nonSettledTotal.toFixed(2)}</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item: o }) => {
          const editable = minutesSince(o.created_at) <= EDIT_WINDOW_MINUTES && !o.settled;
          return (
            <View style={styles.card}>
              {o.is_cash ? <Text style={styles.watermark}>{t('cashOrder')}</Text> : null}
              <View style={styles.cardTopRow}>
                {!o.is_cash && (
                  <TouchableOpacity style={[styles.checkbox, selected[o.id] && styles.checkboxChecked]} onPress={() => toggleSelect(o)} />
                )}
                <Text style={[styles.orderNo, { fontFamily: fontFamily('bold') }]}>{o.order_number}</Text>
                <View style={[styles.tag, o.effectively_settled ? styles.tagSettled : styles.tagUnsettled]}>
                  <Text style={styles.tagText}>{o.effectively_settled ? t('settled') : t('notSettled')}</Text>
                </View>
              </View>
              <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('salesman')}: {o.salesman_name}</Text>
              {!!o.receiver_name && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('receiverName')}: {o.receiver_name}</Text>}
              {!!o.kisan_name && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('kisanName')}: {o.kisan_name}</Text>}
              {!!o.zamindar_name && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('zamindarName')}: {o.zamindar_name}</Text>}
              {!!o.guarantor_name && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('guarantorName')}: {o.guarantor_name}</Text>}

              {o.items.map((it) => (
                <Text key={it.id} style={[styles.itemLine, { fontFamily: fontFamily('regular') }]}>
                  {it.item_name} ({it.size_label}) — {it.unit_price} × {it.quantity} = {(it.unit_price * it.quantity).toFixed(2)}
                </Text>
              ))}
              <Text style={[styles.total, { fontFamily: fontFamily('bold') }]}>{t('totalAmount')}: {o.total_amount.toFixed(2)}</Text>

              <View style={styles.cardActions}>
                {editable && (
                  <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('OrderEdit', { order: o })}>
                    <Text style={[styles.editBtnText, { fontFamily: fontFamily('medium') }]}>{t('edit')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.printBtn}
                  onPress={async () => { try { await printHtml(orderReceiptHtml(o, settings, lang)); } catch (err) { Alert.alert('Error', err.message); } }}
                >
                  <Text style={[styles.printBtnText, { fontFamily: fontFamily('medium') }]}>{t('printReceipt')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {permissions.canAccessSettlement && Object.keys(selected).length > 0 && (
        <TouchableOpacity style={styles.receiveBar} onPress={handleReceive}>
          <Text style={[styles.receiveText, { fontFamily: fontFamily('bold') }]}>
            {t('receive')} ({Object.keys(selected).length}) — {t('totalSelected')}: {selectedTotal.toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.navy },
  search: { flex: 1, backgroundColor: '#fff', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  clearSearchBtn: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  clearSearchText: { color: '#fff', fontWeight: '700' },
  pdfBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  pdfBtnText: { color: '#fff' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.navy, borderRadius: 16, paddingVertical: 4, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  kisanDropdownRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  dateFilterRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingTop: spacing.xs, alignItems: 'center' },
  dateInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.xs, backgroundColor: colors.card, fontSize: 12 },
  dateClearBtn: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  dateClearText: { color: colors.danger, fontSize: 11, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: spacing.lg, marginTop: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  summaryLabel: { color: colors.textSecondary, fontSize: 11 },
  summaryValueGreen: { color: colors.green, fontSize: 15, marginTop: 2 },
  summaryValueRed: { color: colors.danger, fontSize: 15, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  watermark: { position: 'absolute', alignSelf: 'center', top: '35%', fontSize: 24, fontWeight: '800', color: colors.cashWatermark, zIndex: 0 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: colors.navy },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  orderNo: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  tag: { borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
  tagSettled: { backgroundColor: colors.green },
  tagUnsettled: { backgroundColor: colors.danger },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 13 },
  itemLine: { color: colors.textPrimary, fontSize: 12, marginTop: 2 },
  total: { color: colors.green, fontSize: 15, textAlign: 'right', marginTop: spacing.sm },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  editBtn: { flex: 1, borderWidth: 1, borderColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.xs, alignItems: 'center' },
  editBtnText: { color: colors.green, fontSize: 13 },
  printBtn: { flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.xs, alignItems: 'center' },
  printBtnText: { color: colors.navy, fontSize: 13 },
  receiveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.green, padding: spacing.lg, alignItems: 'center' },
  receiveText: { color: '#fff', fontSize: 15 }
});

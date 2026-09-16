import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useShopSettings } from '../context/ShopSettingsContext';
import { api } from '../api/client';
import { printHtml } from '../utils/print';
import { paymentReceiptHtml } from '../utils/receipts';
import { useAutoRefresh } from '../utils/useAutoRefresh';

export default function PaymentsScreen({ navigation }) {
  const { t, fontFamily, isRTL, lang } = useLang();
  const { settings } = useShopSettings();
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [isCashFilter, setIsCashFilter] = useState('all');
  const [collectedFilter, setCollectedFilter] = useState('all');
  const [selected, setSelected] = useState({});

  // Every filter passes its new value straight into load() instead of
  // relying on React state that may not have committed yet — the same
  // stale-closure bug fixed on Order Board applies here too.
  const load = useCallback(async (overrides = {}) => {
    const searchValue = overrides.search !== undefined ? overrides.search : search;
    const isCashValue = overrides.isCash !== undefined ? overrides.isCash : isCashFilter;
    const collectedValue = overrides.collected !== undefined ? overrides.collected : collectedFilter;

    const params = { search: searchValue };
    if (isCashValue !== 'all') params.is_cash = isCashValue;
    if (collectedValue !== 'all') params.collected = collectedValue === 'collected' ? 'yes' : 'no';

    try {
      const rows = await api.get(`/api/payments?${new URLSearchParams(params).toString()}`);
      setPayments(rows);
      // Section: fix for "still shows N selected after unselecting" — any
      // previously-selected payment that's now collected (by this device
      // or another) or no longer in the filtered results is dropped from
      // the selection automatically, so the count on screen always matches
      // what's actually still selectable.
      setSelected((prev) => {
        const stillValid = {};
        for (const row of rows) {
          if (prev[row.id] && !row.collected) stillValid[row.id] = row;
        }
        return stillValid;
      });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, [search, isCashFilter, collectedFilter]);

  useFocusEffect(useCallback(() => {
    load();
    setSelected({}); // unselected by default every time this screen is opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  useAutoRefresh(load);

  function toggleSelect(payment) {
    if (payment.collected) return; // any non-collected payment is selectable, cash or not
    setSelected((prev) => {
      const next = { ...prev };
      if (next[payment.id]) delete next[payment.id];
      else next[payment.id] = payment;
      return next;
    });
  }

  function handleCollect() {
    const chosen = Object.values(selected);
    if (chosen.length === 0) return;
    const receivers = new Set(chosen.map((p) => p.received_by));
    if (receivers.size > 1) {
      Alert.alert('', 'Selected payments must have been received by the same person.');
      return;
    }
    setSelected({}); // unselected after being acted on
    navigation.navigate('CollectionForm', { payments: chosen });
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };
  const selectedTotal = Object.values(selected).reduce((sum, p) => sum + p.total_amount, 0);

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
          <TouchableOpacity style={styles.clearBtn} onPress={() => { setSearch(''); load({ search: '' }); }}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

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
          { key: 'collected', label: t('collected') },
          { key: 'notCollected', label: t('notCollected') }
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, collectedFilter === opt.key && styles.chipActive]}
            onPress={() => { setCollectedFilter(opt.key); load({ collected: opt.key }); }}
          >
            <Text style={[styles.chipText, collectedFilter === opt.key && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={payments}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item: p }) => (
          <View style={styles.card}>
            {p.is_cash ? <Text style={styles.watermark}>{t('cashOrder')}</Text> : null}
            <View style={styles.topRow}>
              {!p.collected && (
                <TouchableOpacity style={[styles.checkbox, selected[p.id] && styles.checkboxChecked]} onPress={() => toggleSelect(p)} />
              )}
              <Text style={[styles.paymentNo, { fontFamily: fontFamily('bold') }]}>{p.payment_no}</Text>
              <View style={[styles.tag, p.collected ? styles.tagCollected : styles.tagPending]}>
                <Text style={styles.tagText}>{p.collected ? t('collected') : t('notCollected')}</Text>
              </View>
            </View>
            <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('date')}: {p.created_at}</Text>
            <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('receivedFrom')}: {p.received_from}</Text>
            <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('receivedBy')}: {p.received_by_name}</Text>
            {!!p.guarantor_name && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('guarantorName')}: {p.guarantor_name}</Text>}
            {!!p.kisan_name && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('kisanName')}: {p.kisan_name}</Text>}
            {p.orders.map((o) => (
              <Text key={o.order_id} style={[styles.orderLine, { fontFamily: fontFamily('regular') }]}>{o.order_number} — {o.amount.toFixed(2)}</Text>
            ))}
            <Text style={[styles.total, { fontFamily: fontFamily('bold') }]}>{t('totalAmount')}: {p.total_amount.toFixed(2)}</Text>

            <TouchableOpacity
              style={styles.printBtn}
              onPress={async () => { try { await printHtml(paymentReceiptHtml(p, settings, lang)); } catch (err) { Alert.alert('Error', err.message); } }}
            >
              <Text style={[styles.printBtnText, { fontFamily: fontFamily('medium') }]}>{t('printReceipt')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {Object.keys(selected).length > 0 && (
        <TouchableOpacity style={styles.collectBar} onPress={handleCollect}>
          <Text style={[styles.collectText, { fontFamily: fontFamily('bold') }]}>
            {t('collect')} ({Object.keys(selected).length}) — {t('totalSelected')}: {selectedTotal.toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.navy },
  search: { flex: 1, backgroundColor: '#fff', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  clearBtn: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#fff', fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.navy, borderRadius: 16, paddingVertical: 4, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  watermark: { position: 'absolute', alignSelf: 'center', top: '35%', fontSize: 24, fontWeight: '800', color: colors.cashWatermark },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: colors.navy },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  paymentNo: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  tag: { borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
  tagCollected: { backgroundColor: colors.green },
  tagPending: { backgroundColor: colors.warning },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 13 },
  orderLine: { color: colors.textPrimary, fontSize: 12, marginTop: 2 },
  total: { color: colors.green, fontSize: 18, textAlign: 'right', marginTop: spacing.sm },
  printBtn: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.xs, alignItems: 'center' },
  printBtnText: { color: colors.navy, fontSize: 13 },
  collectBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.green, padding: spacing.lg, alignItems: 'center' },
  collectText: { color: '#fff', fontSize: 15 }
});

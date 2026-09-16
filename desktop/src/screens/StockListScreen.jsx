import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useShopSettings } from '../context/ShopSettingsContext';
import { api } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { buildTableHtml, generatePdfAndShare } from '../utils/print';
import { useAutoRefresh } from '../utils/useAutoRefresh';

export default function StockListScreen({ navigation }) {
  const { t, fontFamily, isRTL, lang } = useLang();
  const { settings } = useShopSettings();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async (q = '', catId = null) => {
    try {
      const qs = new URLSearchParams({ search: q, ...(catId ? { category_id: catId } : {}) }).toString();
      const [rows, cats] = await Promise.all([
        api.get(`/api/items?${qs}`),
        api.get('/api/categories')
      ]);
      setItems(rows);
      setCategories(cats);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(search, categoryId); }, [load]));
  useAutoRefresh(() => load(search, categoryId));

  async function onRefresh() {
    setRefreshing(true);
    await load(search, categoryId);
    setRefreshing(false);
  }

  async function confirmDelete() {
    try {
      await api.del(`/api/items/${pendingDelete.id}`);
      setPendingDelete(null);
      load(search, categoryId);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleGetPdf() {
    const rows = [];
    items.forEach((item) => {
      item.sizes.forEach((s) => {
        rows.push({
          id: item.id, name: item.name, category: item.category_name || '',
          size: s.size_label, price: s.price, stock: s.stock_qty
        });
      });
    });
    const html = buildTableHtml({
      title: t('stock'),
      settings,
      lang,
      columns: [
        { key: 'id', label: t('itemId') }, { key: 'name', label: t('itemName') },
        { key: 'category', label: t('category') }, { key: 'size', label: t('size') },
        { key: 'price', label: t('price') }, { key: 'stock', label: t('stock') }
      ],
      rows
    });
    try {
      await generatePdfAndShare(html);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('StockForm', {})}>
          <Text style={[styles.addBtnText, { fontFamily: fontFamily('bold') }]}>{t('addItem')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('StockHistory')}>
          <Text style={[styles.historyBtnText, { fontFamily: fontFamily('medium') }]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pdfBtn} onPress={handleGetPdf}>
          <Text style={[styles.pdfBtnText, { fontFamily: fontFamily('medium') }]}>{t('getPdf')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={[styles.search, { fontFamily: fontFamily('regular'), textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('search')}
          value={search}
          onChangeText={(v) => { setSearch(v); load(v, categoryId); }}
        />
        {(search || categoryId) ? (
          <TouchableOpacity style={styles.clearFilterBtn} onPress={() => { setSearch(''); setCategoryId(null); load('', null); }}>
            <Text style={styles.clearFilterText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null, name: t('all') }, ...categories]}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.chip, categoryId === c.id && styles.chipActive]}
            onPress={() => { setCategoryId(c.id); load(search, c.id); }}
          >
            <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive, { fontFamily: fontFamily('medium') }]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <Text style={[styles.cardName, { fontFamily: fontFamily('bold') }]}>#{item.id} {item.name}</Text>
              <Text style={[styles.cardMeta, { fontFamily: fontFamily('regular') }]}>{item.category_name || '-'}</Text>
              <View style={styles.sizeRow}>
                {item.sizes.map((s) => (
                  <View key={s.id} style={styles.sizePill}>
                    <Text style={{ fontFamily: fontFamily('medium'), fontSize: 12 }}>
                      {s.size_label} · {s.price} · stock {s.stock_qty}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('StockForm', { item })}>
                  <Text style={[styles.actionText, { fontFamily: fontFamily('medium') }]}>{t('edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnDanger} onPress={() => setPendingDelete(item)}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.navy },
  addBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  addBtnText: { color: '#fff' },
  pdfBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  pdfBtnText: { color: '#fff' },
  historyBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  historyBtnText: { color: '#fff' },
  filterRow: { flexDirection: 'row', padding: spacing.lg, paddingBottom: 0, gap: spacing.sm },
  clearFilterBtn: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  clearFilterText: { color: colors.danger, fontWeight: '700' },
  search: { flex: 1, backgroundColor: colors.card, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.navy, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginRight: spacing.sm },
  chipActive: { backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: 13 },
  chipTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardAccent: { width: 6, backgroundColor: colors.navy },
  cardBody: { flex: 1, padding: spacing.md },
  cardName: { fontSize: 16, color: colors.textPrimary },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  sizePill: { backgroundColor: colors.background, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  actionText: { color: colors.navy, fontSize: 13 },
  actionBtnDanger: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  actionDangerText: { color: colors.danger, fontSize: 13 }
});

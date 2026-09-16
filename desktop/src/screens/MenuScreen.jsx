import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Image, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import SearchableDropdown from '../components/SearchableDropdown';
import { useAutoRefresh } from '../utils/useAutoRefresh';

const SMALL_SCREEN_BREAKPOINT = 420;

export default function MenuScreen({ navigation }) {
  const { t, fontFamily, isRTL } = useLang();
  const { addOne, count, total } = useCart();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(null);

  const load = useCallback(async (q = '', catId = null) => {
    try {
      const qs = new URLSearchParams({ search: q, ...(catId ? { category_id: catId } : {}) }).toString();
      const [rows, cats] = await Promise.all([api.get(`/api/items?${qs}`), api.get('/api/categories')]);
      setItems(rows); // server already sorts items with more sizes first (5b)
      setCategories(cats);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(search, categoryId); }, [load]));
  useAutoRefresh(() => load(search, categoryId));

  const categoryItems = [{ id: null, label: t('all') }, ...categories.map((c) => ({ id: c.id, label: c.name }))];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          style={[styles.search, { fontFamily: fontFamily('regular'), textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('search')}
          value={search}
          onChangeText={(v) => { setSearch(v); load(v, categoryId); }}
        />
      </View>

      {isSmallScreen ? (
        <View style={styles.dropdownWrap}>
          <SearchableDropdown
            value={categoryItems.find((c) => c.id === categoryId) || categoryItems[0]}
            items={categoryItems}
            onSelect={(c) => { setCategoryId(c.id); load(search, c.id); }}
            placeholder={t('filterByCategory')}
          />
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryItems}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={[styles.chip, categoryId === c.id && styles.chipActive]}
              onPress={() => { setCategoryId(c.id); load(search, c.id); }}
            >
              <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive, { fontFamily: fontFamily('medium') }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={[styles.itemName, { fontFamily: fontFamily('bold') }]}>{item.name}</Text>
            <View style={styles.sizeGrid}>
              {item.sizes.map((s, index) => {
                const dim = Math.max(40, 88 - index * 14); // first size biggest, shrinking after
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.sizeBtn}
                    onPress={() => addOne({
                      item_size_id: s.id, item_name: item.name, size_label: s.size_label, unit_price: s.price
                    })}
                  >
                    {item.image_path ? (
                      <Image source={{ uri: item.image_path }} style={{ width: dim, height: dim, borderRadius: radius.sm }} />
                    ) : (
                      <View style={[styles.sizeImagePlaceholder, { width: dim, height: dim }]} />
                    )}
                    <Text style={[styles.sizeLabel, { fontFamily: fontFamily('medium') }]}>{s.size_label}</Text>
                    <Text style={[styles.sizePrice, { fontFamily: fontFamily('bold') }]}>+ {s.price}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      />

      {count > 0 && (
        <TouchableOpacity style={styles.reviewBar} onPress={() => navigation.navigate('OrderReview')}>
          <Text style={[styles.reviewText, { fontFamily: fontFamily('bold') }]}>
            {count} items · {total.toFixed(2)} — {t('reviewOrder')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { padding: spacing.lg, backgroundColor: colors.navy },
  search: { backgroundColor: '#fff', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  dropdownWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.navy, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginRight: spacing.sm },
  chipActive: { backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: 13 },
  chipTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  itemName: { fontSize: 16, color: colors.textPrimary, marginBottom: spacing.sm },
  sizeGrid: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: spacing.sm },
  sizeBtn: { alignItems: 'center', minWidth: 60 },
  sizeImagePlaceholder: { backgroundColor: colors.background, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  sizeLabel: { fontSize: 12, color: colors.textPrimary, marginTop: spacing.xs },
  sizePrice: { fontSize: 13, color: colors.green, marginTop: 2 },
  reviewBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.green, padding: spacing.lg, alignItems: 'center' },
  reviewText: { color: '#fff', fontSize: 15 }
});

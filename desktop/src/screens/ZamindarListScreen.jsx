import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAutoRefresh } from '../utils/useAutoRefresh';

export default function ZamindarListScreen({ navigation }) {
  const { t, fontFamily, isRTL } = useLang();
  const [zamindars, setZamindars] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async (q = '') => {
    try {
      const rows = await api.get(`/api/zamindars?search=${encodeURIComponent(q)}`);
      setZamindars(rows);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(search); }, [load]));
  useAutoRefresh(() => load(search));

  async function onRefresh() {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  }

  async function confirmDelete() {
    try {
      await api.del(`/api/zamindars/${pendingDelete.id}`);
      setPendingDelete(null);
      load(search);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          style={[styles.search, { fontFamily: fontFamily('regular'), textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('search')}
          value={search}
          onChangeText={(v) => { setSearch(v); load(v); }}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ZamindarForm', {})}
        >
          <Text style={[styles.addBtnText, { fontFamily: fontFamily('bold') }]}>{t('addZamindar')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={zamindars}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <Text style={[styles.cardName, { fontFamily: fontFamily('bold') }]}>{item.name}</Text>
              {!!item.contact && (
                <Text style={[styles.cardMeta, { fontFamily: fontFamily('regular') }]}>{item.contact}</Text>
              )}
              {!!item.address && (
                <Text style={[styles.cardMeta, { fontFamily: fontFamily('regular') }]}>{item.address}</Text>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => navigation.navigate('KisanListForZamindar', { zamindarId: item.id, zamindarName: item.name })}
                >
                  <Text style={[styles.actionPrimaryText, { fontFamily: fontFamily('medium') }]}>
                    {t('addKisan')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('ZamindarForm', { zamindar: item })}
                >
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

      <ConfirmDialog
        visible={!!pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.navy },
  search: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm
  },
  addBtn: { backgroundColor: colors.green, borderRadius: radius.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  addBtnText: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  card: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, marginBottom: spacing.md,
    overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4
  },
  cardAccent: { width: 6, backgroundColor: colors.navy },
  cardBody: { flex: 1, padding: spacing.md },
  cardName: { fontSize: 16, color: colors.textPrimary },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  actionBtnPrimary: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  actionPrimaryText: { color: '#fff', fontSize: 13 },
  actionBtn: { borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  actionText: { color: colors.navy, fontSize: 13 },
  actionBtnDanger: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  actionDangerText: { color: colors.danger, fontSize: 13 }
});

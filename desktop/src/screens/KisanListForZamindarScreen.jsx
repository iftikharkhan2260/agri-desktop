import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import { useAutoRefresh } from '../utils/useAutoRefresh';

export default function KisanListForZamindarScreen({ route, navigation }) {
  const { t, fontFamily } = useLang();
  const { zamindarId, zamindarName } = route.params;
  const [kisans, setKisans] = useState([]);

  const load = useCallback(async () => {
    try {
      const rows = await api.get(`/api/kisans?zamindar_id=${zamindarId}`);
      setKisans(rows);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, [zamindarId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useAutoRefresh(load);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { fontFamily: fontFamily('bold') }]}>{zamindarName}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('KisanForm', { zamindarId, zamindarName })}
        >
          <Text style={[styles.addBtnText, { fontFamily: fontFamily('bold') }]}>{t('addKisan')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={kisans}
        keyExtractor={(k) => String(k.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>}
        renderItem={({ item: k }) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <Text style={[styles.name, { fontFamily: fontFamily('bold') }]}>{k.full_name} ({k.mark_name})</Text>
              {!!k.phone && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{k.phone}</Text>}
              {!!k.guarantor_name && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{t('guarantor')}: {k.guarantor_name}</Text>}
              {!!k.address && <Text style={[styles.meta, { fontFamily: fontFamily('regular') }]}>{k.address}</Text>}
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('KisanForm', { kisan: k, zamindarId, zamindarName })}
              >
                <Text style={[styles.editText, { fontFamily: fontFamily('medium') }]}>{t('edit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { padding: spacing.lg, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTitle: { color: '#fff', fontSize: 16, flex: 1 },
  addBtn: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  addBtnText: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardAccent: { width: 6, backgroundColor: colors.green },
  cardBody: { flex: 1, padding: spacing.md },
  name: { fontSize: 15, color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  editBtn: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  editText: { color: colors.navy, fontSize: 13 }
});

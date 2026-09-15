import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useShopSettings } from '../context/ShopSettingsContext';
import { api } from '../api/client';
import { printHtml } from '../utils/print';
import { collectionReceiptHtml } from '../utils/receipts';

export default function CollectionFormScreen({ route, navigation }) {
  const { t, fontFamily, lang } = useLang();
  const { settings } = useShopSettings();
  const payments = route.params?.payments || [];
  const [saving, setSaving] = useState(false);

  const total = payments.reduce((sum, p) => sum + p.total_amount, 0);

  async function handleConfirm() {
    setSaving(true);
    try {
      const collection = await api.post('/api/collections', { payment_ids: payments.map((p) => p.id) });
      navigation.goBack();
      try { await printHtml(collectionReceiptHtml(collection, settings, lang)); } catch { /* optional */ }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {payments.map((p) => (
        <View key={p.id} style={styles.row}>
          <Text style={{ fontFamily: fontFamily('medium') }}>{p.payment_no}</Text>
          <Text style={{ fontFamily: fontFamily('regular') }}>{p.total_amount.toFixed(2)}</Text>
        </View>
      ))}
      <Text style={[styles.total, { fontFamily: fontFamily('bold') }]}>{t('totalAmount')}: {total.toFixed(2)}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
          <Text style={[styles.cancelText, { fontFamily: fontFamily('medium') }]}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleConfirm} disabled={saving}>
          <Text style={[styles.submitText, { fontFamily: fontFamily('bold') }]}>{t('confirm')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.sm, marginBottom: spacing.sm },
  total: { fontSize: 18, color: colors.green, textAlign: 'right', marginVertical: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.navy },
  submitBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  submitText: { color: '#fff' }
});

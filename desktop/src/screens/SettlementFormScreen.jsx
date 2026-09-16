import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import { api } from '../api/client';
import { printHtml } from '../utils/print';
import { paymentReceiptHtml } from '../utils/receipts';

export default function SettlementFormScreen({ route, navigation }) {
  const { t, fontFamily, isRTL, lang } = useLang();
  const { user } = useAuth();
  const { settings } = useShopSettings();
  const orders = route.params?.orders || [];

  const [receivedFrom, setReceivedFrom] = useState('');
  const [saving, setSaving] = useState(false);

  const total = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const align = { textAlign: isRTL ? 'right' : 'left' };

  async function handleSubmit() {
    if (!receivedFrom.trim()) {
      Alert.alert('', t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      const payment = await api.post('/api/payments', {
        order_ids: orders.map((o) => o.id),
        received_from: receivedFrom
      });
      navigation.goBack();
      try { await printHtml(paymentReceiptHtml(payment, settings, lang)); } catch { /* optional */ }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {orders.map((o) => (
        <View key={o.id} style={styles.orderRow}>
          <Text style={{ fontFamily: fontFamily('medium') }}>{o.order_number}</Text>
          <Text style={{ fontFamily: fontFamily('regular') }}>{o.total_amount.toFixed(2)}</Text>
        </View>
      ))}
      <Text style={[styles.total, { fontFamily: fontFamily('bold') }]}>{t('totalAmount')}: {total.toFixed(2)}</Text>

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('receivedFrom')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={receivedFrom} onChangeText={setReceivedFrom} />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('receivedBy')}</Text>
      <View style={styles.readonly}><Text style={{ fontFamily: fontFamily('regular') }}>{user?.name}</Text></View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
          <Text style={[styles.cancelText, { fontFamily: fontFamily('medium') }]}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
          <Text style={[styles.submitText, { fontFamily: fontFamily('bold') }]}>{t('submit')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.sm, marginBottom: spacing.sm },
  total: { fontSize: 18, color: colors.green, textAlign: 'right', marginVertical: spacing.md },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.card },
  readonly: { padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.navy },
  submitBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  submitText: { color: '#fff' }
});

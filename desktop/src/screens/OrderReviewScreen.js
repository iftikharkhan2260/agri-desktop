import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import SearchableDropdown from '../components/SearchableDropdown';
import { printHtml } from '../utils/print';
import { orderReceiptHtml } from '../utils/receipts';

export default function OrderReviewScreen({ navigation }) {
  const { t, fontFamily, isRTL, lang } = useLang();
  const { settings } = useShopSettings();
  const { items, total, addOne, removeOne, clear } = useCart();

  const [isCash, setIsCash] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [kisan, setKisan] = useState(null);
  const [zamindar, setZamindar] = useState(null); // auto-fetched, read-only
  const [guarantor, setGuarantor] = useState(null); // auto-fetched but changeable
  const [kisans, setKisans] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const [k, g] = await Promise.all([api.get('/api/kisans'), api.get('/api/guarantors')]);
          setKisans(k);
          setGuarantors(g.map((row) => ({ id: row.id, label: row.name })));
        } catch (err) {
          Alert.alert('Error', err.message);
        }
      })();
    }, [])
  );

  function pickKisan(kisanRow) {
    setKisan({ id: kisanRow.id, label: `${kisanRow.full_name} (${kisanRow.mark_name})` });
    setZamindar(kisanRow.zamindar_id ? { id: kisanRow.zamindar_id, label: kisanRow.zamindar_name } : null);
    setGuarantor(kisanRow.guarantor_id ? { id: kisanRow.guarantor_id, label: kisanRow.guarantor_name } : null);
  }

  function resetForm() {
    setIsCash(false);
    setReceiverName('');
    setKisan(null);
    setZamindar(null);
    setGuarantor(null);
    clear();
  }

  async function handleSubmit() {
    if (items.length === 0) {
      Alert.alert('', t('emptyCart'));
      return;
    }
    if (!isCash && !kisan) {
      Alert.alert('', t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      const order = await api.post('/api/orders', {
        is_cash: isCash,
        receiver_name: receiverName,
        kisan_id: kisan?.id || null,
        zamindar_id: zamindar?.id || null,
        guarantor_id: guarantor?.id || null,
        items: items.map((l) => ({ item_size_id: l.item_size_id, quantity: l.quantity, unit_price: l.unit_price }))
      });
      resetForm();
      navigation.goBack();
      try { await printHtml(orderReceiptHtml(order, settings, lang)); } catch { /* printing is optional */ }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    resetForm();
    navigation.goBack();
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };
  const kisanItems = kisans.map((k) => ({ id: k.id, label: `${k.full_name} (${k.mark_name})`, raw: k }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {items.map((line) => (
        <View key={line.item_size_id} style={styles.lineRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.lineName, { fontFamily: fontFamily('medium') }]}>{line.item_name} ({line.size_label})</Text>
            <Text style={[styles.lineMeta, { fontFamily: fontFamily('regular') }]}>{line.unit_price} × {line.quantity} = {(line.unit_price * line.quantity).toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => removeOne(line.item_size_id)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { fontFamily: fontFamily('bold') }]}>{line.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => addOne(line)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.total, { fontFamily: fontFamily('bold') }]}>{t('totalAmount')}: {total.toFixed(2)}</Text>

      <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsCash((v) => !v)}>
        <View style={[styles.checkbox, isCash && styles.checkboxChecked]} />
        <Text style={[styles.checkboxLabel, { fontFamily: fontFamily('medium') }]}>{t('isCash')}</Text>
      </TouchableOpacity>

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('receiverName')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={receiverName} onChangeText={setReceiverName} />

      <SearchableDropdown
        label={t('kisanName')}
        value={kisan}
        items={kisanItems}
        onSelect={(item) => pickKisan(item.raw)}
        placeholder={t('kisanName')}
      />

      <SearchableDropdown
        label={t('zamindarName')}
        value={zamindar}
        items={zamindar ? [zamindar] : []}
        onSelect={() => {}}
        disabled
        placeholder="—"
      />

      <SearchableDropdown
        label={t('guarantorName')}
        value={guarantor}
        items={guarantors}
        onSelect={setGuarantor}
        placeholder={t('guarantorName')}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
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
  lineRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  lineName: { color: colors.textPrimary },
  lineMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  qtyBtnText: { color: '#fff', fontSize: 16 },
  qtyValue: { minWidth: 20, textAlign: 'center' },
  total: { fontSize: 18, color: colors.green, textAlign: 'right', marginVertical: spacing.md },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.navy, marginRight: spacing.sm },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  checkboxLabel: { color: colors.textPrimary },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.card },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.navy },
  submitBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  submitText: { color: '#fff' }
});

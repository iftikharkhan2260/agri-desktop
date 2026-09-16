import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import SearchableDropdown from '../components/SearchableDropdown';

const EDIT_WINDOW_MINUTES = 10;

function minutesSince(isoString) {
  const iso = isoString.includes('Z') ? isoString : isoString.replace(' ', 'T') + 'Z';
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

// Section 4: lets a salesman fix a mistake shortly after creating an order —
// adjust quantities on the items already in the order, or change who it's
// for. Adding a brand-new item to an existing order isn't supported yet;
// for that, cancel this order's items down to what's still correct and
// create a fresh order for the rest.
export default function OrderEditScreen({ route, navigation }) {
  const { t, fontFamily, isRTL } = useLang();
  const order = route.params.order;

  const [lines, setLines] = useState(
    order.items.map((it) => ({
      item_size_id: it.item_size_id, item_name: it.item_name, size_label: it.size_label,
      unit_price: it.unit_price, quantity: it.quantity
    }))
  );
  const [receiverName, setReceiverName] = useState(order.receiver_name || '');
  const [kisan, setKisan] = useState(order.kisan_id ? { id: order.kisan_id, label: order.kisan_name } : null);
  const [guarantor, setGuarantor] = useState(order.guarantor_id ? { id: order.guarantor_id, label: order.guarantor_name } : null);
  const [zamindar, setZamindar] = useState(order.zamindar_id ? { id: order.zamindar_id, label: order.zamindar_name } : null);
  const [kisans, setKisans] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [k, g] = await Promise.all([api.get('/api/kisans'), api.get('/api/guarantors')]);
        setKisans(k.map((row) => ({ id: row.id, label: `${row.full_name} (${row.mark_name})`, raw: row })));
        setGuarantors(g.map((row) => ({ id: row.id, label: row.name })));
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    })();
  }, []));

  const minutesLeft = Math.max(0, EDIT_WINDOW_MINUTES - minutesSince(order.created_at));
  const total = useMemo(() => lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0), [lines]);

  function changeQty(index, delta) {
    setLines((prev) => {
      const next = [...prev];
      const newQty = next[index].quantity + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...next[index], quantity: newQty };
      }
      return next;
    });
  }

  function pickKisan(item) {
    setKisan(item);
    const raw = item.raw;
    if (raw) {
      setZamindar(raw.zamindar_id ? { id: raw.zamindar_id, label: raw.zamindar_name } : null);
      setGuarantor(raw.guarantor_id ? { id: raw.guarantor_id, label: raw.guarantor_name } : null);
    }
  }

  async function handleSave() {
    if (lines.length === 0) {
      Alert.alert('', 'An order needs at least one item — delete the whole order flow isn\u2019t supported here.');
      return;
    }
    if (!order.is_cash && !kisan) {
      Alert.alert('', t('requiredField'));
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/orders/${order.id}`, {
        receiver_name: receiverName,
        kisan_id: kisan?.id || null,
        zamindar_id: zamindar?.id || null,
        guarantor_id: guarantor?.id || null,
        items: lines.map((l) => ({ item_size_id: l.item_size_id, quantity: l.quantity, unit_price: l.unit_price }))
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.timerNote}>
        Editable for about {Math.ceil(minutesLeft)} more minute{Math.ceil(minutesLeft) === 1 ? '' : 's'}.
      </Text>

      {lines.map((line, index) => (
        <View key={line.item_size_id} style={styles.lineRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.lineName, { fontFamily: fontFamily('medium') }]}>{line.item_name} ({line.size_label})</Text>
            <Text style={[styles.lineMeta, { fontFamily: fontFamily('regular') }]}>{line.unit_price} × {line.quantity} = {(line.unit_price * line.quantity).toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(index, -1)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { fontFamily: fontFamily('bold') }]}>{line.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(index, 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.total, { fontFamily: fontFamily('bold') }]}>{t('totalAmount')}: {total.toFixed(2)}</Text>

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('receiverName')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={receiverName} onChangeText={setReceiverName} />

      <SearchableDropdown
        label={t('kisanName')}
        value={kisan}
        items={kisans}
        onSelect={pickKisan}
        onClear={() => { setKisan(null); setZamindar(null); setGuarantor(null); }}
        placeholder={t('kisanName')}
      />

      <SearchableDropdown label={t('zamindarName')} value={zamindar} items={zamindar ? [zamindar] : []} onSelect={() => {}} disabled placeholder="—" />

      <SearchableDropdown
        label={t('guarantorName')}
        value={guarantor}
        items={guarantors}
        onSelect={setGuarantor}
        onClear={() => setGuarantor(null)}
        placeholder={t('guarantorName')}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
          <Text style={[styles.cancelText, { fontFamily: fontFamily('medium') }]}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={saving}>
          <Text style={[styles.submitText, { fontFamily: fontFamily('bold') }]}>{t('save')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  timerNote: { color: colors.danger, fontSize: 12, marginBottom: spacing.md, textAlign: 'center' },
  lineRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  lineName: { color: colors.textPrimary },
  lineMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  qtyBtnText: { color: '#fff', fontSize: 16 },
  qtyValue: { minWidth: 20, textAlign: 'center' },
  total: { fontSize: 18, color: colors.green, textAlign: 'right', marginVertical: spacing.md },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.card },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.navy },
  submitBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  submitText: { color: '#fff' }
});

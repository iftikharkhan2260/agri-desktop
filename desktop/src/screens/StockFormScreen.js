import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';
import SearchableDropdown from '../components/SearchableDropdown';

const EMPTY_SLOT = { id: null, size_label: '', price: '', add_stock: '' };
const SLOT_COUNT = 6;

function toSlots(existingSizes) {
  const slots = (existingSizes || []).map((s) => ({
    id: s.id, size_label: s.size_label, price: String(s.price), add_stock: ''
  }));
  while (slots.length < SLOT_COUNT) slots.push({ ...EMPTY_SLOT });
  return slots.slice(0, SLOT_COUNT);
}

export default function StockFormScreen({ route, navigation }) {
  const { t, fontFamily, isRTL } = useLang();
  const existing = route.params?.item;
  const isEdit = !!existing;

  const [itemName, setItemName] = useState(existing?.name ? { id: existing.id, label: existing.name } : null);
  const [typedName, setTypedName] = useState(existing?.name || '');
  const [showTypedName, setShowTypedName] = useState(false);

  const [category, setCategory] = useState(
    existing?.category_id ? { id: existing.category_id, label: existing.category_name } : null
  );
  const [typedCategory, setTypedCategory] = useState('');
  const [showTypedCategory, setShowTypedCategory] = useState(false);

  const [slots, setSlots] = useState(toSlots(existing?.sizes));
  const [imageDataUri, setImageDataUri] = useState(existing?.image_path || null);
  const [existingItems, setExistingItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [items, cats] = await Promise.all([api.get('/api/items'), api.get('/api/categories')]);
      setExistingItems(items.map((i) => ({ id: i.id, label: i.name })));
      setCategories(cats.map((c) => ({ id: c.id, label: c.name })));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadOptions(); }, [loadOptions]));

  function updateSlot(index, field, value) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function resetForm() {
    setItemName(null);
    setTypedName('');
    setShowTypedName(false);
    setCategory(null);
    setTypedCategory('');
    setShowTypedCategory(false);
    setSlots(toSlots(null));
    setImageDataUri(null);
  }

  async function pickExistingItem(item) {
    setItemName(item);
    setShowTypedName(false);
    try {
      const full = await api.get(`/api/items/${item.id}`);
      setSlots(toSlots(full.sizes));
      setImageDataUri(full.image_path || null);
      if (full.category_id) setCategory({ id: full.category_id, label: full.category_name });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function handlePickImage() {
    const dataUri = await window.desktopAPI.pickImage();
    if (dataUri) setImageDataUri(dataUri);
  }

  async function handleSubmit() {
    const finalName = showTypedName ? typedName.trim() : itemName?.label;
    if (!finalName) {
      Alert.alert('', t('requiredField'));
      return;
    }

    let categoryId = category?.id || null;
    setSaving(true);
    try {
      if (showTypedCategory && typedCategory.trim()) {
        const newCat = await api.post('/api/categories', { name: typedCategory.trim() });
        categoryId = newCat.id;
      }

      const sizePayload = slots
        .filter((s) => s.size_label.trim())
        .map((s) => ({
          id: s.id,
          size_label: s.size_label.trim(),
          price: Number(s.price) || 0,
          add_stock: Number(s.add_stock) || 0,
          stock_qty: Number(s.add_stock) || 0
        }));

      if (sizePayload.length === 0) {
        Alert.alert('', 'Enter at least one size and price.');
        setSaving(false);
        return;
      }

      const targetId = isEdit ? existing.id : (itemName && !showTypedName ? itemName.id : null);

      if (targetId) {
        await api.put(`/api/items/${targetId}`, { name: finalName, category_id: categoryId, image_path: imageDataUri, sizes: sizePayload });
      } else {
        await api.post('/api/items', { name: finalName, category_id: categoryId, image_path: imageDataUri, sizes: sizePayload });
      }

      resetForm();
      navigation.goBack();
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>Photo</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        {imageDataUri ? (
          <Image source={{ uri: imageDataUri }} style={styles.imagePreview} />
        ) : (
          <Text style={{ color: colors.textSecondary }}>Tap to add a picture</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('itemName')}</Text>
      {showTypedName ? (
        <TextInput
          style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
          value={typedName}
          onChangeText={setTypedName}
          autoFocus
        />
      ) : (
        <SearchableDropdown
          value={itemName}
          items={existingItems}
          onSelect={pickExistingItem}
          allowOther
          onOther={() => { setShowTypedName(true); setItemName(null); }}
          placeholder={t('itemName')}
        />
      )}

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('category')}</Text>
      {showTypedCategory ? (
        <TextInput
          style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
          value={typedCategory}
          onChangeText={setTypedCategory}
          autoFocus
        />
      ) : (
        <SearchableDropdown
          value={category}
          items={categories}
          onSelect={(c) => { setCategory(c); setShowTypedCategory(false); }}
          allowOther
          onOther={() => { setShowTypedCategory(true); setCategory(null); }}
          placeholder={t('category')}
        />
      )}

      <Text style={[styles.sectionTitle, { fontFamily: fontFamily('bold') }, align]}>Sizes & Prices</Text>
      {slots.map((slot, i) => (
        <View key={i} style={styles.sizeRow}>
          <TextInput
            style={[styles.sizeInput, { fontFamily: fontFamily('regular') }, align]}
            placeholder={t('size')}
            value={slot.size_label}
            onChangeText={(v) => updateSlot(i, 'size_label', v)}
          />
          <TextInput
            style={[styles.priceInput, { fontFamily: fontFamily('regular') }, align]}
            placeholder={t('price')}
            value={slot.price}
            onChangeText={(v) => updateSlot(i, 'price', v)}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.priceInput, { fontFamily: fontFamily('regular') }, align]}
            placeholder={t('addStock')}
            value={slot.add_stock}
            onChangeText={(v) => updateSlot(i, 'add_stock', v)}
            keyboardType="numeric"
          />
        </View>
      ))}

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
  label: { color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  sectionTitle: { color: colors.navy, fontSize: 15, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.card },
  imagePicker: { height: 160, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  sizeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  sizeInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, backgroundColor: colors.card },
  priceInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, backgroundColor: colors.card },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.xl },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.navy },
  submitBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  submitText: { color: '#fff' }
});

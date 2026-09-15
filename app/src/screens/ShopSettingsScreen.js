import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useShopSettings } from '../context/ShopSettingsContext';
import { api } from '../api/client';

export default function ShopSettingsScreen() {
  const { t, fontFamily, isRTL } = useLang();
  const { settings, refresh } = useShopSettings();

  const [shopName, setShopName] = useState(settings.shop_name || '');
  const [address, setAddress] = useState(settings.address || '');
  const [branchName, setBranchName] = useState(settings.branch_name || '');
  const [contact, setContact] = useState(settings.contact || '');
  const [logoDataUri, setLogoDataUri] = useState(settings.logo_path || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setShopName(settings.shop_name || '');
    setAddress(settings.address || '');
    setBranchName(settings.branch_name || '');
    setContact(settings.contact || '');
    setLogoDataUri(settings.logo_path || null);
  }, [settings]);

  async function handlePickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('', 'Photo library permission is needed to add a logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType || 'image/jpeg';
    setLogoDataUri(`data:${mime};base64,${asset.base64}`);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Section 7: shop name, logo, and contact are saved once here and
      // shown everywhere shop info appears (drawer header, receipts, PDFs)
      // via the shared ShopSettingsContext + receipt/PDF templates.
      await api.put('/api/settings', { shop_name: shopName, address, branch_name: branchName, contact, logo_path: logoDataUri });
      await refresh();
      Alert.alert('', t('save'));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const align = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>Logo</Text>
      <TouchableOpacity style={styles.logoPicker} onPress={handlePickLogo}>
        {logoDataUri ? (
          <Image source={{ uri: logoDataUri }} style={styles.logoPreview} />
        ) : (
          <Text style={{ color: colors.textSecondary }}>Tap to add a logo</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('shopName')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={shopName} onChangeText={setShopName} />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('branchName')}</Text>
      <TextInput style={[styles.input, { fontFamily: fontFamily('regular') }, align]} value={branchName} onChangeText={setBranchName} />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('contact')}</Text>
      <TextInput
        style={[styles.input, { fontFamily: fontFamily('regular') }, align]}
        value={contact}
        onChangeText={setContact}
        keyboardType="phone-pad"
        placeholder="Shown on every receipt and PDF"
      />

      <Text style={[styles.label, { fontFamily: fontFamily('medium') }, align]}>{t('address')}</Text>
      <TextInput style={[styles.input, styles.multiline, { fontFamily: fontFamily('regular') }, align]} value={address} onChangeText={setAddress} multiline />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={[styles.saveText, { fontFamily: fontFamily('bold') }]}>{t('save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.card },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  logoPicker: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoPreview: { width: '100%', height: '100%' },
  saveBtn: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl }
});

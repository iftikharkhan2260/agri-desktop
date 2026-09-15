import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import licenseService from '../license/licenseService';

export default function LicenseStatusScreen() {
  const [state, setState] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    licenseService.getCachedLicense().then(setState);
  }, []);

  async function handleReactivate() {
    if (!newKey.trim()) return;
    setChecking(true);
    try {
      const fresh = await licenseService.verifyLicenseOnline(newKey.trim());
      setState(fresh);
      if (fresh.valid) {
        setNewKey('');
        Alert.alert('', 'License updated.');
      } else {
        Alert.alert('Not valid', fresh.message || 'This key is not valid.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setChecking(false);
    }
  }

  async function handleClearBypass() {
    await licenseService.clearLicense();
    setState(null);
    Alert.alert('', 'Bypass removed. A real license key will be required on next launch.');
  }

  return (
    <View style={styles.container}>
      {state?.isBypass && (
        <View style={styles.bypassBanner}>
          <Text style={styles.bypassText}>⚠ Developer bypass is active — not a real license.</Text>
          <TouchableOpacity style={styles.bypassClearBtn} onPress={handleClearBypass}>
            <Text style={styles.bypassClearText}>Remove Bypass</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={[styles.value, { color: state?.valid ? colors.green : colors.danger }]}>
          {state?.valid ? 'Active' : 'Not Active'}
        </Text>

        <Text style={styles.label}>License Key</Text>
        <Text style={styles.value}>{state?.licenseKey || '-'}</Text>

        <Text style={styles.label}>Shop Name (from license)</Text>
        <Text style={styles.value}>{state?.shopName || '-'}</Text>

        <Text style={styles.label}>Expires</Text>
        <Text style={styles.value}>{state?.expiry || 'No expiry'}</Text>

        <Text style={styles.label}>Last Checked</Text>
        <Text style={styles.value}>{state?.lastCheckedAt ? new Date(state.lastCheckedAt).toLocaleString() : '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Enter a different license key</Text>
        <TextInput style={styles.input} value={newKey} onChangeText={setNewKey} autoCapitalize="characters" placeholder="New license key" />
        <TouchableOpacity style={styles.button} onPress={handleReactivate} disabled={checking}>
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update License</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  bypassBanner: { backgroundColor: '#FDF3D8', borderWidth: 1, borderColor: colors.warning, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  bypassText: { color: colors.warning, fontWeight: '600', marginBottom: spacing.sm },
  bypassClearBtn: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  bypassClearText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm },
  value: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, backgroundColor: '#fff', marginTop: spacing.xs, marginBottom: spacing.md },
  button: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' }
});

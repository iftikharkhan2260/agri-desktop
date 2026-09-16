import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';

export default function BackupScreen() {
  const { t, fontFamily } = useLang();
  const [working, setWorking] = useState(false);
  const [role, setRole] = useState('standalone');

  useEffect(() => { window.desktopAPI.getRole().then(setRole); }, []);

  async function handleBackup() {
    setWorking(true);
    try {
      const result = await window.desktopAPI.backupDatabase();
      if (result.ok) {
        Alert.alert('', `Backup saved to:\n${result.filePath}`);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setWorking(false);
    }
  }

  if (role === 'client') {
    return (
      <View style={styles.container}>
        <Text style={styles.description}>
          This computer is a Client, not a Host or Standalone device — it
          doesn't hold the actual database file, the device it's connected
          to does. Run a backup from that device instead.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        This saves a copy of the shop's live database to a location you
        choose (a USB drive, cloud-synced folder, etc). Do this regularly —
        it's your only way to recover data if this computer fails.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleBackup} disabled={working}>
        {working ? <ActivityIndicator color="#fff" /> : (
          <Text style={[styles.buttonText, { fontFamily: fontFamily('bold') }]}>{t('backup')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, maxWidth: 560, alignSelf: 'center', width: '100%' },
  description: { color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 20 },
  button: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff' }
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import networkService from '../net/networkService';

export default function BackupScreen() {
  const { t, fontFamily } = useLang();
  const [working, setWorking] = useState(false);
  const role = networkService.getRole();

  async function handleBackup() {
    setWorking(true);
    try {
      // The live database file only exists on whichever device is the Host —
      // that's the single source of truth in the peer-to-peer model (section 1a).
      const src = `${FileSystem.documentDirectory}SQLite/agri_shop.db`;
      const filename = `agri-shop-backup-${new Date().toISOString().slice(0, 10)}.db`;
      const dest = FileSystem.documentDirectory + filename;

      const info = await FileSystem.getInfoAsync(src);
      if (!info.exists) throw new Error('No database file found on this device yet.');

      await FileSystem.copyAsync({ from: src, to: dest });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dest);
      } else {
        Alert.alert('', `Saved to ${dest}`);
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
          This device is a Client, not a Host or Standalone device — it
          doesn't hold the actual database file, the device it's connected
          to does. Run a backup from that device instead (check Sync
          Settings in the drawer to see which one that is).
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        This copies the shop's live database on this device and opens the
        share sheet so you can send it to yourself or another number on
        WhatsApp. Do this regularly — it's your only way to recover data if
        this device is lost or damaged.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleBackup} disabled={working}>
        {working ? <ActivityIndicator color="#fff" /> : (
          <Text style={[styles.buttonText, { fontFamily: fontFamily('bold') }]}>{t('backupAndShare')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  description: { color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 20 },
  button: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff' }
});

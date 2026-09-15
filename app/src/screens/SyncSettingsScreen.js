import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Network from 'expo-network';
import { colors, spacing, radius } from '../theme/theme';
import networkService from '../net/networkService';

// Section A: this is the ONLY place hosting/syncing is ever mentioned.
// Reached from the drawer, never blocks login, and defaults to Standalone.
export default function SyncSettingsScreen({ navigation }) {
  const [role, setRole] = useState(networkService.getRole());
  const [ip, setIp] = useState('');
  const hostInfo = networkService.getHostInfo();

  const refresh = useCallback(() => setRole(networkService.getRole()), []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => {
    if (role === 'host') Network.getIpAddressAsync().then(setIp);
  }, [role]);

  async function handleStopHosting() {
    Alert.alert(
      'Stop hosting?',
      'Other phones will be disconnected. This device keeps all its data and goes back to working on its own.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop Hosting', style: 'destructive', onPress: async () => { await networkService.stopHosting(); refresh(); } }
      ]
    );
  }

  async function handleDisconnect() {
    Alert.alert(
      'Disconnect from Host?',
      'This device goes back to working on its own with whatever data it has locally.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: async () => { await networkService.disconnectClient(); refresh(); } }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Current Mode</Text>
        <Text style={styles.value}>
          {role === 'host' ? 'Host — other phones can join this one' : ''}
          {role === 'client' ? 'Client — connected to another device' : ''}
          {role === 'standalone' ? 'Standalone — working on its own' : ''}
        </Text>

        {role === 'host' && (
          <>
            <Text style={styles.label}>This Device's IP</Text>
            <Text style={styles.value}>{ip || '...'}</Text>
            <Text style={styles.label}>Port</Text>
            <Text style={styles.value}>{hostInfo.port}</Text>
            <Text style={styles.label}>Token</Text>
            <Text style={styles.valueBig}>{hostInfo.token}</Text>
          </>
        )}

        {role === 'client' && (
          <>
            <Text style={styles.label}>Connected To</Text>
            <Text style={styles.value}>{hostInfo.ip}:{hostInfo.port}</Text>
          </>
        )}

        {role === 'standalone' && (
          <Text style={styles.description}>
            This device is fully functional on its own — nothing here is
            required. Only set up hosting/joining if you want multiple
            phones sharing the same data.
          </Text>
        )}
      </View>

      {role === 'standalone' && (
        <>
          <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('BecomeHost')}>
            <Text style={styles.optionTitle}>Become Host</Text>
            <Text style={styles.optionDesc}>Let other phones connect to and share this device's data.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionCard} onPress={() => navigation.navigate('JoinClient')}>
            <Text style={styles.optionTitle}>Join as Client</Text>
            <Text style={styles.optionDesc}>Connect this device to another phone that's already the Host.</Text>
          </TouchableOpacity>
        </>
      )}

      {role === 'host' && (
        <TouchableOpacity style={styles.dangerBtn} onPress={handleStopHosting}>
          <Text style={styles.dangerText}>Stop Hosting</Text>
        </TouchableOpacity>
      )}

      {role === 'client' && (
        <TouchableOpacity style={styles.dangerBtn} onPress={handleDisconnect}>
          <Text style={styles.dangerText}>Disconnect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm },
  value: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  valueBig: { color: colors.green, fontSize: 24, fontWeight: '800', letterSpacing: 3 },
  description: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  optionCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  optionTitle: { color: colors.navy, fontSize: 16, fontWeight: '700', marginBottom: spacing.xs },
  optionDesc: { color: colors.textSecondary, fontSize: 13 },
  dangerBtn: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  dangerText: { color: colors.danger, fontWeight: '600' }
});

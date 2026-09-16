import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

const DEFAULT_PORT = 4050;

export default function JoinClientScreen({ navigation }) {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(String(DEFAULT_PORT));
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (!ip.trim() || !token.trim()) {
      Alert.alert('', 'Enter the Host IP address and token.');
      return;
    }
    setConnecting(true);
    try {
      await window.desktopAPI.joinAsClient(ip.trim(), token.trim().toUpperCase(), Number(port) || DEFAULT_PORT);
      Alert.alert('Connected', 'This computer is now a Client of that Host.', [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
    } catch (err) {
      Alert.alert('Could not connect', err.message);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join as Client</Text>
      <Text style={styles.subtitle}>Enter the details shown on the Host's screen.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Host IP Address</Text>
        <TextInput style={styles.input} value={ip} onChangeText={setIp} placeholder="e.g. 192.168.1.20" autoCapitalize="none" />

        <Text style={styles.label}>Port</Text>
        <TextInput style={styles.input} value={port} onChangeText={setPort} keyboardType="numeric" />

        <Text style={styles.label}>Token</Text>
        <TextInput style={styles.input} value={token} onChangeText={setToken} autoCapitalize="characters" />
      </View>

      <Text style={styles.hint}>
        Once connected, this computer uses the Host's shared data instead of
        whatever was on it before. Disconnect anytime from Sync Settings.
      </Text>

      <TouchableOpacity style={styles.connectBtn} onPress={handleConnect} disabled={connecting}>
        {connecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.connectText}>Connect</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center', maxWidth: 480, alignSelf: 'center', width: '100%' },
  title: { color: colors.navy, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, backgroundColor: '#fff' },
  hint: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 18 },
  connectBtn: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  connectText: { color: '#fff', fontWeight: '700' }
});

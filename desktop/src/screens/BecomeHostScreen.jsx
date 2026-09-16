import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

function randomToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function BecomeHostScreen({ navigation }) {
  const [starting, setStarting] = useState(true);
  const [ip, setIp] = useState('');
  const [token] = useState(randomToken());
  const [port, setPort] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const address = await window.desktopAPI.getLocalIp();
        setIp(address);
        const { port: p } = await window.desktopAPI.becomeHost(token);
        setPort(p);
      } catch (err) {
        setError(err.message);
      } finally {
        setStarting(false);
      }
    })();
  }, []);

  if (starting) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.navy} size="large" />
        <Text style={styles.loadingText}>Starting host...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Couldn't start hosting: {error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Computer is the Host</Text>
      <Text style={styles.subtitle}>Give these to every other phone or computer:</Text>

      <View style={styles.card}>
        <Text style={styles.label}>IP Address</Text>
        <Text style={styles.value}>{ip}</Text>
        <Text style={styles.label}>Port</Text>
        <Text style={styles.value}>{port}</Text>
        <Text style={styles.label}>Token</Text>
        <Text style={styles.valueBig}>{token}</Text>
      </View>

      <Text style={styles.hint}>
        Keep this computer on and connected to the same network the other
        devices will join. You can see this again anytime in Sync Settings.
      </Text>

      <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.popToTop()}>
        <Text style={styles.continueText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center', maxWidth: 480, alignSelf: 'center', width: '100%' },
  loadingText: { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md },
  errorText: { color: colors.danger, textAlign: 'center', marginBottom: spacing.lg },
  title: { color: colors.navy, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm },
  value: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  valueBig: { color: colors.green, fontSize: 28, fontWeight: '800', letterSpacing: 4 },
  hint: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 18 },
  continueBtn: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  continueText: { color: '#fff', fontWeight: '700' },
  backBtn: { alignItems: 'center', padding: spacing.md },
  backText: { color: colors.navy }
});

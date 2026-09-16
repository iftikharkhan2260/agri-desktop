import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

const BYPASS_TAPS_REQUIRED = 7;
const BYPASS_TAP_WINDOW_MS = 3000; // taps must land within this window or the count resets

export default function LicenseScreen({ status, error, onSubmit, onBypass }) {
  const [key, setKey] = useState('');
  const checking = status === 'checking';

  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  function handleBrandTap() {
    const now = Date.now();
    if (now - lastTapRef.current > BYPASS_TAP_WINDOW_MS) {
      tapCountRef.current = 0;
    }
    lastTapRef.current = now;
    tapCountRef.current += 1;

    if (tapCountRef.current >= BYPASS_TAPS_REQUIRED) {
      tapCountRef.current = 0;
      onBypass();
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={handleBrandTap}>
        <Text style={styles.brand}>Agri Shop</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>Enter your license key to continue.</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          value={key}
          onChangeText={setKey}
          placeholder="License key"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={() => key.trim() && onSubmit(key)}
          disabled={checking || !key.trim()}
        >
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Activate</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        This device needs internet the first time, and again roughly every
        few days after that, to confirm the license is still active. Once
        confirmed, day-to-day use works normally without internet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navyDark, padding: spacing.xl, justifyContent: 'center' },
  brand: { color: '#fff', fontSize: 28, textAlign: 'center', marginBottom: spacing.sm, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: '#fff', fontSize: 16, letterSpacing: 1 },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.md },
  button: { backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 }
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { t, fontFamily, lang, setLang } = useLang();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert('', t('requiredField'));
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.langSwitch}>
        <TouchableOpacity onPress={() => setLang('en')}>
          <Text style={[styles.langText, lang === 'en' && styles.langActive]}>EN</Text>
        </TouchableOpacity>
        <Text style={styles.langDivider}>|</Text>
        <TouchableOpacity onPress={() => setLang('ur')}>
          <Text style={[styles.langText, lang === 'ur' && styles.langActive]}>اردو</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.brand, { fontFamily: fontFamily('bold') }]}>Agri Shop</Text>

      <View style={styles.card}>
        <Text style={[styles.label, { fontFamily: fontFamily('medium') }]}>{t('username')}</Text>
        <TextInput
          style={[styles.input, { fontFamily: fontFamily('regular') }]}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { fontFamily: fontFamily('medium') }]}>{t('password')}</Text>
        <TextInput
          style={[styles.input, { fontFamily: fontFamily('regular') }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={[styles.buttonText, { fontFamily: fontFamily('bold') }]}>{t('login')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navyDark, justifyContent: 'center', padding: spacing.xl },
  langSwitch: { position: 'absolute', top: 60, right: spacing.xl, flexDirection: 'row', alignItems: 'center' },
  langText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, paddingHorizontal: spacing.xs },
  langActive: { color: '#fff', fontWeight: '700' },
  langDivider: { color: 'rgba(255,255,255,0.4)' },
  brand: { color: '#fff', fontSize: 28, textAlign: 'center', marginBottom: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, backgroundColor: '#fff'
  },
  button: {
    backgroundColor: colors.green, borderRadius: radius.sm, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.xl
  },
  buttonText: { color: '#fff', fontSize: 16 }
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { api } from '../api/client';

export default function MyProfileScreen() {
  const { t, fontFamily } = useLang();
  const [profile, setProfile] = useState(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        setProfile(await api.get('/api/hr/employees/me'));
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    })();
  }, []));

  if (!profile) return <View style={styles.container} />;

  const rows = [
    [t('name'), profile.name], [t('username'), profile.username], [t('role'), profile.role],
    [t('contact'), profile.contact], [t('education'), profile.education], [t('address'), profile.address],
    [t('salary'), profile.salary]
  ];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={[styles.label, { fontFamily: fontFamily('medium') }]}>{label}</Text>
            <Text style={[styles.value, { fontFamily: fontFamily('regular') }]}>{value || '-'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { color: colors.textSecondary },
  value: { color: colors.textPrimary }
});

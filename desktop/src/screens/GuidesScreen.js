import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

const SECTIONS = [
  {
    title: 'Networking',
    body:
      'This computer works fully on its own by default. Only set up Sync ' +
      '(in the drawer) if you want phones or other computers sharing the ' +
      'same data — Become Host on one device, Join as Client on the rest.'
  },
  {
    title: 'Backups',
    body:
      'Use Backup (in the drawer) regularly to save a copy of the shop ' +
      'database to a USB drive or cloud-synced folder. This is the only ' +
      'way to recover data if this computer is lost or damaged.'
  },
  {
    title: 'More documentation',
    body:
      'Full setup, build, and testing guides live in the project\u2019s README ' +
      'files: README.md (features), TERMUX_GUIDE.md (testing the backend ' +
      'logic), and BUILD_EXE_GUIDE.md (turning this into a Windows .exe).'
  }
];

export default function GuidesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, maxWidth: 640, alignSelf: 'center', width: '100%' }}>
      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.navy, fontSize: 16, marginBottom: spacing.sm, fontWeight: '700' },
  body: { color: colors.textPrimary, lineHeight: 20, fontSize: 13 }
});

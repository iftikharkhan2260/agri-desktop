import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';

const SECTIONS = [
  {
    title: 'Hosting Guide — no terminal needed',
    body:
      'The very first time you open the app, choose "Become Host" on ONE ' +
      'device (a phone or tablet that stays near the counter). It shows an ' +
      'IP address, a port, and a 6-character token.\n\n' +
      'On every other phone, choose "Join as Client" and type in that IP, ' +
      'port, and token. That\u2019s it — no computer, no commands. All devices ' +
      'must be on the same WiFi network or the same phone hotspot.\n\n' +
      'If the Host device restarts, it becomes the Host again automatically ' +
      'and keeps the same token. Client phones reconnect automatically too, ' +
      'as long as the Host is reachable on the network.\n\n' +
      'Bluetooth tethering also works as a "network" for this purpose, as ' +
      'long as the phones can reach each other\u2019s IP addresses over it.'
  },
  {
    title: 'Optional: a dedicated always-on relay',
    body:
      'Most shops don\u2019t need this — any phone can be the Host. If you\u2019d ' +
      'rather use one dedicated computer that\u2019s always on instead of a ' +
      'staff phone, the project includes an optional server/ folder. Run:\n' +
      'npm install\n' +
      'node server.js <TOKEN> [port]\n' +
      'Then every phone joins as a Client using that computer\u2019s IP and the ' +
      'token you chose. It speaks the exact same protocol as an in-app Host, ' +
      'so phones don\u2019t know or care which kind of Host they\u2019re talking to.'
  },
  {
    title: 'Building the app (one-time, for whoever sets this up)',
    body:
      'Because the app now runs its own networking and local database ' +
      'in-process, it needs a real build rather than Expo Go. Use EAS Build ' +
      '(eas build --profile development, or a full release build) to produce ' +
      'an APK, then install that APK on every phone. This is a one-time step ' +
      'per app update — staff never need to touch a terminal afterward.'
  },
  {
    title: 'Security Notes',
    body:
      'Passwords are hashed (bcrypt), never stored in plain text. Devices ' +
      'authenticate to the Host with the shared token before anything else ' +
      'is accepted, and each person still logs in with their own username ' +
      'and password on top of that. Settlement/Collection screens and ' +
      'employee management are restricted to the owner, enforced on the ' +
      'Host itself so it can\u2019t be bypassed from a Client device. Keep the ' +
      'token private — anyone with it and network access can connect.'
  }
];

export default function GuidesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
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
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  title: { color: colors.navy, fontSize: 16, marginBottom: spacing.sm, fontWeight: '700' },
  body: { color: colors.textPrimary, lineHeight: 20, fontSize: 13 }
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useShopSettings } from '../context/ShopSettingsContext';

// items: [{ key, label, component, visible? }]
export default function DesktopShell({ items }) {
  const visibleItems = items.filter((i) => i.visible !== false);
  const [activeKey, setActiveKey] = useState(visibleItems[0]?.key);
  const { t, lang, setLang, fontFamily } = useLang();
  const { user, logout } = useAuth();
  const { settings } = useShopSettings();

  const active = visibleItems.find((i) => i.key === activeKey) || visibleItems[0];
  const ActiveComponent = active?.component;

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.header}>
          <View style={styles.shopRow}>
            {settings.logo_path ? <Image source={{ uri: settings.logo_path }} style={styles.logo} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={[styles.shopName, { fontFamily: fontFamily('bold') }]} numberOfLines={1}>{settings.shop_name}</Text>
              {!!settings.contact && <Text style={styles.contact} numberOfLines={1}>{settings.contact}</Text>}
            </View>
          </View>
          <Text style={styles.userLine}>{user?.name} · {user?.role}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity onPress={() => setLang('en')}>
              <Text style={[styles.langText, lang === 'en' && styles.langActive]}>EN</Text>
            </TouchableOpacity>
            <Text style={styles.langDivider}>|</Text>
            <TouchableOpacity onPress={() => setLang('ur')}>
              <Text style={[styles.langText, lang === 'ur' && styles.langActive]}>اردو</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.itemList}>
          {visibleItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.item, item.key === active?.key && styles.itemActive]}
              onPress={() => setActiveKey(item.key)}
            >
              <Text style={[styles.itemText, item.key === active?.key && styles.itemTextActive, { fontFamily: fontFamily('medium') }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={[styles.logoutText, { fontFamily: fontFamily('bold') }]}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {ActiveComponent ? <ActiveComponent /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', height: '100%' },
  sidebar: { width: 250, backgroundColor: colors.navyDark, height: '100%' },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)' },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logo: { width: 36, height: 36, borderRadius: 8 },
  shopName: { color: '#fff', fontSize: 16 },
  contact: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  userLine: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  langRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  langText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, paddingHorizontal: spacing.xs },
  langActive: { color: '#fff', fontWeight: '700' },
  langDivider: { color: 'rgba(255,255,255,0.4)' },
  itemList: { flex: 1, paddingVertical: spacing.sm },
  item: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  itemActive: { backgroundColor: colors.green },
  itemText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  itemTextActive: { color: '#fff' },
  logoutBtn: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  logoutText: { color: '#F28B82' },
  content: { flex: 1, height: '100%', overflow: 'hidden' }
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { colors, spacing } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useShopSettings } from '../context/ShopSettingsContext';

export default function DrawerContent(props) {
  const { t, lang, setLang, fontFamily } = useLang();
  const { user, logout } = useAuth();
  const { settings } = useShopSettings();

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.shopRow}>
          {settings.logo_path ? (
            <Image source={{ uri: settings.logo_path }} style={styles.logo} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[styles.shopName, { fontFamily: fontFamily('bold') }]}>{settings.shop_name}</Text>
            {!!settings.contact && <Text style={[styles.contact, { fontFamily: fontFamily('regular') }]}>{settings.contact}</Text>}
          </View>
        </View>
        <Text style={[styles.userLine, { fontFamily: fontFamily('regular') }]}>{user?.name} · {user?.role}</Text>
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

      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={[styles.logoutText, { fontFamily: fontFamily('bold') }]}>{t('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navyDark, padding: spacing.lg, paddingTop: spacing.xl },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logo: { width: 40, height: 40, borderRadius: 8 },
  shopName: { color: '#fff', fontSize: 18 },
  contact: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  userLine: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  langRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  langText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, paddingHorizontal: spacing.xs },
  langActive: { color: '#fff', fontWeight: '700' },
  langDivider: { color: 'rgba(255,255,255,0.4)' },
  logoutBtn: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  logoutText: { color: colors.danger }
});


import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';

import { LangProvider } from './i18n/i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopSettingsProvider } from './context/ShopSettingsContext';
import { colors } from './theme/theme';
import LoginScreen from './screens/LoginScreen';
import AppNavigator from './navigation/AppNavigator';
import LicenseScreen from './screens/LicenseScreen';
import { useLicenseGate } from './license/useLicenseGate';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navyDark }}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <AppNavigator /> : <LoginScreen />;
}

export default function App() {
  const license = useLicenseGate();

  if (license.status === 'checking') {
    return <LoadingScreen />;
  }

  if (license.status === 'locked') {
    return <LicenseScreen status={license.status} error={license.error} onSubmit={license.submitKey} onBypass={license.bypass} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LangProvider>
        <AuthProvider>
          <ShopSettingsProvider>
            <NavigationContainer>
              <Gate />
            </NavigationContainer>
          </ShopSettingsProvider>
        </AuthProvider>
      </LangProvider>
    </GestureHandlerRootView>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';

import { LangProvider } from './src/i18n/i18n';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ShopSettingsProvider } from './src/context/ShopSettingsContext';
import { colors } from './src/theme/theme';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import LicenseScreen from './src/screens/LicenseScreen';
import { useLicenseGate } from './src/license/useLicenseGate';
import networkService from './src/net/networkService';

// Font files go in ./assets/fonts — see README for download links and
// exact filenames these keys must match.
function useAppFonts() {
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          'NotoSans-Regular': require('./assets/fonts/NotoSans-Regular.ttf'),
          'NotoSans-Medium': require('./assets/fonts/NotoSans-Medium.ttf'),
          'NotoSans-Bold': require('./assets/fonts/NotoSans-Bold.ttf'),
          'NotoNastaliqUrdu-Regular': require('./assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
          'NotoNastaliqUrdu-Bold': require('./assets/fonts/NotoNastaliqUrdu-Bold.ttf')
        });
      } catch (e) {
        console.warn('Font load failed — add font files per README, falling back to system font.', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);
  return loaded;
}

// Section A: the app is Standalone (fully local, zero networking) the
// instant it opens — no setup screen, no gate before Login. If this device
// was previously configured as a Host or Client, that resumes quietly in
// the background; either way Login appears immediately.
function useNetworkResume() {
  React.useEffect(() => {
    networkService.resume();
  }, []);
}

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
  const fontsLoaded = useAppFonts();
  useNetworkResume();
  const license = useLicenseGate();

  if (!fontsLoaded || license.status === 'checking') {
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
              <StatusBar style="light" />
              <Gate />
            </NavigationContainer>
          </ShopSettingsProvider>
        </AuthProvider>
      </LangProvider>
    </GestureHandlerRootView>
  );
}

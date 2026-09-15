import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import DrawerContent from './DrawerContent';

import ZamindarListScreen from '../screens/ZamindarListScreen';
import ZamindarFormScreen from '../screens/ZamindarFormScreen';
import KisanFormScreen from '../screens/KisanFormScreen';
import KisanListForZamindarScreen from '../screens/KisanListForZamindarScreen';
import GuarantorListScreen from '../screens/GuarantorListScreen';
import GuarantorFormScreen from '../screens/GuarantorFormScreen';
import StockListScreen from '../screens/StockListScreen';
import StockFormScreen from '../screens/StockFormScreen';
import StockHistoryScreen from '../screens/StockHistoryScreen';
import MenuScreen from '../screens/MenuScreen';
import OrderReviewScreen from '../screens/OrderReviewScreen';
import OrderBoardScreen from '../screens/OrderBoardScreen';
import OrderEditScreen from '../screens/OrderEditScreen';
import SettlementFormScreen from '../screens/SettlementFormScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import CollectionFormScreen from '../screens/CollectionFormScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import EmployeesListScreen from '../screens/EmployeesListScreen';
import EmployeeFormScreen from '../screens/EmployeeFormScreen';
import EmployeeTransactionsScreen from '../screens/EmployeeTransactionsScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import ShopSettingsScreen from '../screens/ShopSettingsScreen';
import BackupScreen from '../screens/BackupScreen';
import GuidesScreen from '../screens/GuidesScreen';
import SyncSettingsScreen from '../screens/SyncSettingsScreen';
import BecomeHostScreen from '../screens/BecomeHostScreen';
import JoinClientScreen from '../screens/JoinClientScreen';
import LicenseStatusScreen from '../screens/LicenseStatusScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' }
};

const simpleHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: '#fff'
};

function MenuStack() {
  const { t } = useLang();
  return (
    <CartProvider>
      <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen name="MenuHome" component={MenuScreen} options={{ title: t('menu') }} />
        <Stack.Screen name="OrderReview" component={OrderReviewScreen} options={{ title: t('reviewOrder') }} />
      </Stack.Navigator>
    </CartProvider>
  );
}

function ZamindarStack() {
  const { t } = useLang();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ZamindarList" component={ZamindarListScreen} options={{ title: t('zamindars') }} />
      <Stack.Screen name="ZamindarForm" component={ZamindarFormScreen} options={{ title: t('addZamindar') }} />
      <Stack.Screen name="KisanListForZamindar" component={KisanListForZamindarScreen} options={{ title: t('kisans') }} />
      <Stack.Screen name="KisanForm" component={KisanFormScreen} options={{ title: t('addKisan') }} />
    </Stack.Navigator>
  );
}

function GuarantorStack() {
  const { t } = useLang();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="GuarantorList" component={GuarantorListScreen} options={{ title: t('guarantors') }} />
      <Stack.Screen name="GuarantorForm" component={GuarantorFormScreen} options={{ title: t('addGuarantor') }} />
    </Stack.Navigator>
  );
}

function StockStack() {
  const { t } = useLang();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="StockList" component={StockListScreen} options={{ title: t('stock') }} />
      <Stack.Screen name="StockForm" component={StockFormScreen} options={{ title: t('addItem') }} />
      <Stack.Screen name="StockHistory" component={StockHistoryScreen} options={{ title: 'Stock History' }} />
    </Stack.Navigator>
  );
}

function OrderBoardStack() {
  const { t } = useLang();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="OrderBoardList" component={OrderBoardScreen} options={{ title: t('orderBoard') }} />
      <Stack.Screen name="OrderEdit" component={OrderEditScreen} options={{ title: t('edit') }} />
      <Stack.Screen name="SettlementForm" component={SettlementFormScreen} options={{ title: t('receive') }} />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  const { t } = useLang();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="PaymentsList" component={PaymentsScreen} options={{ title: t('payments') }} />
      <Stack.Screen name="CollectionForm" component={CollectionFormScreen} options={{ title: t('collect') }} />
    </Stack.Navigator>
  );
}

function HRStack() {
  const { t } = useLang();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="EmployeesList" component={EmployeesListScreen} options={{ title: t('hr') }} />
      <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} options={{ title: t('addEmployee') }} />
      <Stack.Screen name="EmployeeTransactions" component={EmployeeTransactionsScreen} options={{ title: t('hr') }} />
    </Stack.Navigator>
  );
}

function SyncStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="SyncSettings" component={SyncSettingsScreen} options={{ title: 'Sync Settings' }} />
      <Stack.Screen name="BecomeHost" component={BecomeHostScreen} options={{ title: 'Become Host' }} />
      <Stack.Screen name="JoinClient" component={JoinClientScreen} options={{ title: 'Join as Client' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { t, fontFamily } = useLang();
  const { permissions } = useAuth();

  return (
    <Drawer.Navigator
      initialRouteName="MenuStack"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: colors.green,
        drawerActiveTintColor: '#fff',
        drawerLabelStyle: { fontFamily: fontFamily('medium') }
      }}
    >
      <Drawer.Screen name="MenuStack" component={MenuStack} options={{ title: t('menu') }} />
      <Drawer.Screen name="ZamindarStack" component={ZamindarStack} options={{ title: t('zamindars') }} />
      <Drawer.Screen name="GuarantorStack" component={GuarantorStack} options={{ title: t('guarantors') }} />
      <Drawer.Screen name="StockStack" component={StockStack} options={{ title: t('stock') }} />
      <Drawer.Screen name="OrderBoardStack" component={OrderBoardStack} options={{ title: t('orderBoard') }} />

      {permissions.canAccessSettlement && (
        <Drawer.Screen name="PaymentsStack" component={PaymentsStack} options={{ title: t('payments') }} />
      )}
      {permissions.canAccessCollection && (
        <Drawer.Screen name="CollectionsScreen" component={CollectionsScreen} options={{ title: t('collections'), ...simpleHeader }} />
      )}

      <Drawer.Screen name="ReportsScreen" component={ReportsScreen} options={{ title: t('reports'), ...simpleHeader }} />

      {permissions.canManageEmployees ? (
        <Drawer.Screen name="HRStack" component={HRStack} options={{ title: t('hr') }} />
      ) : (
        <Drawer.Screen name="MyProfileScreen" component={MyProfileScreen} options={{ title: t('myProfile'), ...simpleHeader }} />
      )}

      {permissions.canManageEmployees && (
        <Drawer.Screen name="ShopSettingsScreen" component={ShopSettingsScreen} options={{ title: t('shopSettings'), ...simpleHeader }} />
      )}
      {permissions.canBackup && (
        <Drawer.Screen name="BackupScreen" component={BackupScreen} options={{ title: t('backup'), ...simpleHeader }} />
      )}

      <Drawer.Screen name="GuidesScreen" component={GuidesScreen} options={{ title: t('guides'), ...simpleHeader }} />
      <Drawer.Screen name="SyncStack" component={SyncStack} options={{ title: 'Sync Settings' }} />
      {permissions.canManageEmployees && (
        <Drawer.Screen name="LicenseStatusScreen" component={LicenseStatusScreen} options={{ title: 'License', ...simpleHeader }} />
      )}
    </Drawer.Navigator>
  );
}

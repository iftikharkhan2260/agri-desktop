import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme/theme';
import { useLang } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import DesktopShell from './DesktopShell';

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

const Stack = createStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' }
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
  const { t } = useLang();
  const { permissions } = useAuth();

  const items = [
    { key: 'menu', label: t('menu'), component: MenuStack },
    { key: 'zamindars', label: t('zamindars'), component: ZamindarStack },
    { key: 'guarantors', label: t('guarantors'), component: GuarantorStack },
    { key: 'stock', label: t('stock'), component: StockStack },
    { key: 'orderBoard', label: t('orderBoard'), component: OrderBoardStack },
    { key: 'payments', label: t('payments'), component: PaymentsStack, visible: permissions.canAccessSettlement },
    { key: 'collections', label: t('collections'), component: CollectionsScreen, visible: permissions.canAccessCollection },
    { key: 'reports', label: t('reports'), component: ReportsScreen },
    { key: 'hr', label: t('hr'), component: HRStack, visible: permissions.canManageEmployees },
    { key: 'myProfile', label: t('myProfile'), component: MyProfileScreen, visible: !permissions.canManageEmployees },
    { key: 'shopSettings', label: t('shopSettings'), component: ShopSettingsScreen, visible: permissions.canManageEmployees },
    { key: 'backup', label: t('backup'), component: BackupScreen, visible: permissions.canBackup },
    { key: 'guides', label: t('guides'), component: GuidesScreen },
    { key: 'sync', label: 'Sync Settings', component: SyncStack },
    { key: 'license', label: 'License', component: LicenseStatusScreen, visible: permissions.canManageEmployees }
  ];

  return <DesktopShell items={items} />;
}

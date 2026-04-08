import React from 'react';
import { ActivityIndicator, View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import TransactionScreen from '../screens/transactions/TransactionScreen';
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';
import WalletScreen from '../screens/wallets/WalletScreen';
import BudgetScreen from '../screens/budgets/BudgetScreen';
import ReportScreen from '../screens/reports/ReportScreen';
import ReportDetailScreen from '../screens/reports/ReportDetailScreen';
import MoreScreen from '../screens/more/MoreScreen';
import DebtScreen from '../screens/debts/DebtScreen';
import SavingGoalScreen from '../screens/savings/SavingGoalScreen';
import RecurringScreen from '../screens/recurring/RecurringScreen';
import EventScreen from '../screens/events/EventScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import BillScreen from '../screens/bills/BillScreen';
import CategoryScreen from '../screens/categories/CategoryScreen';
import CategoryFormScreen from '../screens/categories/CategoryFormScreen';
import SharedWalletScreen from '../screens/wallets/SharedWalletScreen';
import CategoryDetailScreen from '../screens/reports/CategoryDetailScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AccountStack = createNativeStackNavigator();
const TransactionStack = createNativeStackNavigator();

// Transaction tab nests transaction list + detail
function TransactionStackNavigator() {
  return (
    <TransactionStack.Navigator screenOptions={{ headerShown: false }}>
      <TransactionStack.Screen name="TransactionList" component={TransactionScreen} />
      <TransactionStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </TransactionStack.Navigator>
  );
}

// "Tài khoản" tab nests wallets, debts, savings, events, recurring, reports
function AccountStackNavigator() {
  return (
    <AccountStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountStack.Screen name="AccountHome" component={MoreScreen} />
      <AccountStack.Screen name="Wallets" component={WalletScreen} />
      <AccountStack.Screen name="Debts" component={DebtScreen} />
      <AccountStack.Screen name="SavingGoals" component={SavingGoalScreen} />
      <AccountStack.Screen name="Recurring" component={RecurringScreen} />
      <AccountStack.Screen name="Events" component={EventScreen} />
      <AccountStack.Screen name="EventDetail" component={EventDetailScreen} />
      <AccountStack.Screen name="Bills" component={BillScreen} />
      <AccountStack.Screen name="Reports" component={ReportDetailScreen} />
      <AccountStack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
      <AccountStack.Screen name="ReportLegacy" component={ReportScreen} />
      <AccountStack.Screen name="Categories" component={CategoryScreen} />
      <AccountStack.Screen name="CategoryForm" component={CategoryFormScreen} />
      <AccountStack.Screen name="SharedWallet" component={SharedWalletScreen} />
    </AccountStack.Navigator>
  );
}

// Dummy screen used as placeholder for center FAB tab
function DummyScreen() { return <View style={{ flex: 1, backgroundColor: COLORS.background }} />; }

// Custom center FAB button for the tab bar
function CenterFabButton({ onPress }) {
  const { colors } = useTheme();
  const C = colors || COLORS;
  return (
    <TouchableOpacity style={fabStyles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={[fabStyles.button, { backgroundColor: C.primary, shadowColor: C.primary }]}>
        <Ionicons name="add" size={32} color={C.white} />
      </View>
    </TouchableOpacity>
  );
}

const fabStyles = StyleSheet.create({
  container: { top: -20, justifyContent: 'center', alignItems: 'center' },
  button: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 8,
  },
});

function MainTabs() {
  const { colors } = useTheme();
  const C = colors || COLORS;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
            case 'Transactions': iconName = focused ? 'book' : 'book-outline'; break;
            case 'AddPlaceholder': iconName = 'add'; break;
            case 'Budgets': iconName = focused ? 'clipboard' : 'clipboard-outline'; break;
            case 'Account': iconName = focused ? 'person' : 'person-outline'; break;
            default: iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.gray,
        tabBarStyle: {
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Tổng quan' }} />
      <Tab.Screen name="Transactions" component={TransactionStackNavigator} options={{ tabBarLabel: 'Sổ giao dịch' }} />
      <Tab.Screen
        name="AddPlaceholder"
        component={DummyScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <CenterFabButton {...props} onPress={() => {
              props.onPress?.();
            }} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Navigate to Transactions and open the add-transaction modal
            navigation.navigate('Transactions', {
              screen: 'TransactionList',
              params: { openAddModal: true },
            });
          },
        })}
      />
      <Tab.Screen name="Budgets" component={BudgetScreen} options={{ tabBarLabel: 'Ngân sách' }} />
      <Tab.Screen
        name="Account"
        component={AccountStackNavigator}
        options={{ tabBarLabel: 'Tài khoản' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Reset AccountStack to AccountHome when tab is pressed
            navigation.navigate('Account', { screen: 'AccountHome' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

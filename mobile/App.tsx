import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/AuthContext';
import { colors } from './src/styles';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ChessboardScreen from './src/screens/ChessboardScreen';
import GuestsScreen from './src/screens/GuestsScreen';
import TasksScreen from './src/screens/TasksScreen';
import SosScreen from './src/screens/SosScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import MedicalScreen from './src/screens/MedicalScreen';
import UsersScreen from './src/screens/UsersScreen';
import type { TabKey } from './src/types';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  dashboard: '📊',
  chessboard: '🏨',
  tasks: '🧹',
  guests: '👤',
  finance: '💰',
  medical: '💊',
  sos: '🚨',
  users: '👥',
};

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Главная',
  chessboard: 'Номера',
  tasks: 'Задачи',
  guests: 'Гости',
  finance: 'Финансы',
  medical: 'Медицина',
  sos: 'SOS',
  users: 'Люди',
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  const { getVisibleTabs, user, logout } = useAuth();
  const tabs = getVisibleTabs();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200 },
      }}
    >
      {tabs.includes('dashboard') && (
        <Tab.Screen
          name="dashboard"
          component={DashboardScreen}
          options={{
            title: `Панель — ${user?.first_name || ''}`,
            tabBarLabel: 'Главная',
            tabBarIcon: ({ focused }) => <TabIcon label={TAB_ICONS.dashboard} focused={focused} />,
          }}
        />
      )}
      {tabs.includes('chessboard') && (
        <Tab.Screen
          name="chessboard"
          component={ChessboardScreen}
          options={{
            title: 'Номерной фонд',
            tabBarLabel: 'Номера',
            tabBarIcon: ({ focused }) => <TabIcon label={TAB_ICONS.chessboard} focused={focused} />,
          }}
        />
      )}
      {tabs.includes('guests') && (
        <Tab.Screen
          name="guests"
          component={GuestsScreen}
          options={{
            title: 'Постояльцы',
            tabBarLabel: 'Гости',
            tabBarIcon: ({ focused }) => <TabIcon label={TAB_ICONS.guests} focused={focused} />,
          }}
        />
      )}
      {tabs.includes('tasks') && (
        <Tab.Screen
          name="tasks"
          component={TasksScreen}
          options={{
            title: 'Задачи',
            tabBarLabel: 'Задачи',
            tabBarIcon: ({ focused }) => <TabIcon label={TAB_ICONS.tasks} focused={focused} />,
          }}
        />
      )}
      {tabs.includes('finance') && (
        <Tab.Screen
          name="finance"
          component={FinanceScreen}
          options={{
            title: 'Финансы',
            tabBarLabel: 'Финансы',
            tabBarIcon: ({ focused }) => <TabIcon label={TAB_ICONS.finance} focused={focused} />,
          }}
        />
      )}
      {tabs.includes('medical') && (
        <Tab.Screen
          name="medical"
          component={MedicalScreen}
          options={{
            title: 'Медицина',
            tabBarLabel: 'Медицина',
            tabBarIcon: ({ focused }) => <TabIcon label={TAB_ICONS.medical} focused={focused} />,
          }}
        />
      )}
      {tabs.includes('sos') && (
        <Tab.Screen
          name="sos"
          component={SosScreen}
          options={{
            title: 'SOS',
            tabBarLabel: 'SOS',
            tabBarIcon: ({ focused }) => <TabIcon label={TAB_ICONS.sos} focused={focused} />,
          }}
        />
      )}
      {tabs.includes('users') && (
        <Tab.Screen
          name="users"
          component={UsersScreen}
          options={{
            title: 'Сотрудники',
            tabBarLabel: 'Люди',
            tabBarIcon: ({ focused }) => <TabIcon label={TAB_ICONS.users} focused={focused} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <Text style={{ fontSize: 18, color: colors.gray500 }}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

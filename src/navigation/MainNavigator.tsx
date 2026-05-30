import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/theme';
import { useAlertsStore } from '../stores/alertsStore';

import DashboardScreen  from '../screens/dashboard/DashboardScreen';
import CallsNavigator   from './CallsNavigator';
import AgentsNavigator  from './AgentsNavigator';
import AnalisisScreen   from '../screens/analisis/AnalisisScreen';
import AlertsScreen     from '../screens/alerts/AlertsScreen';
import ReportesScreen   from '../screens/reportes/ReportesScreen';
import ProfileScreen    from '../screens/profile/ProfileScreen';
import DebugScreen      from '../screens/debug/DebugScreen';
import UsersListScreen  from '../screens/users/UsersListScreen';
import UserFormScreen   from '../screens/users/UserFormScreen';
import { AppUser }      from '../types';

export type MainTabParamList = {
  Dashboard:  undefined;
  Calls:      undefined;
  Agents:     undefined;
  Analisis:   undefined;
  Reportes:   undefined;
  Alerts:     undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color, focused, badge }: { name: IoniconName; color: string; focused: boolean; badge?: number }) {
  const iconName = (focused ? name : `${name}-outline`) as IoniconName;
  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name={iconName} size={23} color={color} />
      {badge && badge > 0 ? (
        <View style={{
          position: 'absolute', top: -4, right: -6,
          backgroundColor: Colors.error,
          borderRadius: 8, minWidth: 16, height: 16,
          justifyContent: 'center', alignItems: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function TabNavigator() {
  const { colors } = useTheme();
  const unreadCount = useAlertsStore(s => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor:  colors.border,
          borderTopWidth:  0.5,
          paddingBottom:   4,
          height:          60,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '500', marginBottom: 2 },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarLabel:'Dashboard', tabBarIcon:({color,focused}) => <TabIcon name="grid" color={color} focused={focused} /> }} />
      <Tab.Screen name="Calls"     component={CallsNavigator}
        options={{ tabBarLabel:'Llamadas',  tabBarIcon:({color,focused}) => <TabIcon name="call" color={color} focused={focused} /> }} />
      <Tab.Screen name="Agents"    component={AgentsNavigator}
        options={{ tabBarLabel:'Agentes',   tabBarIcon:({color,focused}) => <TabIcon name="people" color={color} focused={focused} /> }} />
      <Tab.Screen name="Analisis"  component={AnalisisScreen}
        options={{ tabBarLabel:'Análisis',  tabBarIcon:({color,focused}) => <TabIcon name="analytics" color={color} focused={focused} /> }} />
      <Tab.Screen name="Reportes"  component={ReportesScreen}
        options={{ tabBarLabel:'Reportes',  tabBarIcon:({color,focused}) => <TabIcon name="document-text" color={color} focused={focused} /> }} />
      <Tab.Screen name="Alerts"    component={AlertsScreen}
        options={{ tabBarLabel:'Alertas',   tabBarIcon:({color,focused}) => <TabIcon name="notifications" color={color} focused={focused} badge={unreadCount} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen}
        options={{ tabBarLabel:'Perfil',    tabBarIcon:({color,focused}) => <TabIcon name="person-circle" color={color} focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export type MainStackParamList = {
  Tabs:     undefined;
  Debug:    undefined;
  Users:    undefined;
  UserForm: { user?: AppUser } | undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"  component={TabNavigator} />
      <Stack.Screen name="Debug" component={DebugScreen}
        options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Users"    component={UsersListScreen} />
      <Stack.Screen name="UserForm" component={UserFormScreen}
        options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}

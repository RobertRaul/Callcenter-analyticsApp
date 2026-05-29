import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';

import queryClient from './src/lib/queryClient';
import { useAuthStore } from './src/stores/authStore';
import { sessionExpiredEmitter } from './src/lib/apiClient';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useNotifications } from './src/hooks/useNotifications';
import { useAlerts } from './src/hooks/useAlerts';
import { initNotificationHandler } from './src/services/notificationsService';

import AuthNavigator  from './src/navigation/AuthNavigator';
import MainNavigator  from './src/navigation/MainNavigator';
import SplashContent  from './src/components/SplashContent';

// Inicializar handler de notificaciones al cargar el módulo
initNotificationHandler();

const RootStack = createNativeStackNavigator();

function AppServices() {
  useNotifications();
  useAlerts();
  return null;
}

function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession, logout } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => { restoreSession(); }, []);

  useEffect(() => {
    const handle = () => { queryClient.clear(); logout(); };
    sessionExpiredEmitter.on(handle);
    return () => sessionExpiredEmitter.off(handle);
  }, [logout]);

  // Mostrar splash MACSA animado mientras carga
  if (isLoading) return <SplashContent />;

  return (
    <>
      {isAuthenticated && <AppServices />}
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated
          ? <RootStack.Screen name="Main" component={MainNavigator} />
          : <RootStack.Screen name="Auth" component={AuthNavigator} />
        }
      </RootStack.Navigator>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

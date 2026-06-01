import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';

import queryClient from './src/lib/queryClient';
import { useAuthStore } from './src/stores/authStore';
import { sessionExpiredEmitter } from './src/lib/apiClient';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useNotifications } from './src/hooks/useNotifications';
import { initNotificationHandler } from './src/services/notificationsService';

import AuthNavigator        from './src/navigation/AuthNavigator';
import MainNavigator        from './src/navigation/MainNavigator';
import SplashContent        from './src/components/SplashContent';
import ChangePasswordScreen from './src/screens/auth/ChangePasswordScreen';

// Inicializar handler de notificaciones al cargar el módulo
initNotificationHandler();

const RootStack = createNativeStackNavigator();

function AppServices() {
  useNotifications();
  return null;
}

function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession, logout, user } = useAuthStore();

  useEffect(() => { restoreSession(); }, []);

  useEffect(() => {
    const handle = () => { queryClient.clear(); logout(); };
    sessionExpiredEmitter.on(handle);
    return () => sessionExpiredEmitter.off(handle);
  }, [logout]);

  // Mostrar splash MACSA animado mientras carga
  if (isLoading) return <SplashContent />;

  // Tras login/restauración: si debe cambiar la contraseña temporal, se fuerza
  // esa pantalla antes de dar acceso al resto de la app.
  const mustChange = isAuthenticated && !!user?.must_change_password;

  return (
    <>
      {isAuthenticated && !mustChange && <AppServices />}
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : mustChange ? (
          <RootStack.Screen name="ForceChange" component={ChangePasswordScreen} initialParams={{ forced: true }} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
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

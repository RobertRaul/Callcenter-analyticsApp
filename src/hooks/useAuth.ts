import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/authApi';
import { LoginRequest } from '../types';
import logger from '../lib/logger';

interface UseAuthReturn {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const { setUser, logout: storeLogout } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoggingIn(true);
      setError(null);

      logger.info('Auth', `Intentando login con usuario: ${credentials.username}`);

      const response = await authApi.login(credentials);

      logger.info('Auth', `Login exitoso — usuario: ${response.user.username}, rol/permisos: ${JSON.stringify(response.user.permissions)}`);

      await setUser(response.user, response.access_token);

      logger.info('Auth', 'Token guardado en SecureStore correctamente');

    } catch (err: unknown) {
      const axiosError = err as any;
      const status  = axiosError?.response?.status;
      const detail  = axiosError?.response?.data?.detail;

      logger.error('Auth', `Login fallido — status: ${status}`, {
        status,
        detail,
        username: credentials.username,
      });

      let message = 'Error al iniciar sesión. Intenta de nuevo.';
      if (status === 401) message = 'Usuario o contraseña incorrectos.';
      else if (status === 422) message = 'Datos inválidos. Verifica el formulario.';
      else if (!axiosError?.response) {
        message = 'No se pudo conectar al servidor.\nVerifica que estés en la misma red (192.168.11.3).';
        logger.error('Auth', 'Error de red — el dispositivo no puede alcanzar 192.168.11.3');
      } else if (typeof detail === 'string') {
        message = detail;
      }

      setError(message);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    logger.info('Auth', 'Usuario cerrando sesión');
    await storeLogout();
    logger.info('Auth', 'Sesión cerrada — SecureStore limpiado');
  };

  const clearError = () => setError(null);

  return { login, logout, isLoggingIn, error, clearError };
}

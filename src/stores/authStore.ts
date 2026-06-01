import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '../lib/apiClient';
import { authApi } from '../services/authApi';
import { User } from '../types';
import logger from '../lib/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User, accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  clearMustChange: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user, accessToken) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      logger.info('AuthStore', `Usuario autenticado: ${user.username} (id: ${user.id})`);
    } catch (err: unknown) {
      logger.error('AuthStore', 'No se pudo guardar el token en SecureStore', err);
      throw err;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false });
      logger.info('AuthStore', 'SecureStore limpiado — usuario desautenticado');
    } catch (err: unknown) {
      logger.error('AuthStore', 'Error limpiando SecureStore', err);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  restoreSession: async () => {
    logger.debug('AuthStore', 'Verificando sesión guardada en SecureStore...');
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        logger.info('AuthStore', 'Sin token guardado — mostrando pantalla de login');
        set({ isLoading: false, isAuthenticated: false, user: null });
        return false;
      }
      // Validar el token y traer el usuario actual (incluye must_change_password / is_admin)
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
      logger.info('AuthStore', `Sesión restaurada: ${user.username}`);
      return true;
    } catch (err: unknown) {
      const status = (err as any)?.response?.status;
      if (status === 401) {
        logger.warn('AuthStore', 'Token inválido — cerrando sesión');
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
      // Sin respuesta del servidor (¿sin red?) u otro error: mantener sesión optimista
      logger.warn('AuthStore', 'No se pudo validar /me; se mantiene la sesión', { status });
      set({ isAuthenticated: true, isLoading: false });
      return true;
    }
  },

  clearMustChange: () =>
    set((s) => (s.user ? { user: { ...s.user, must_change_password: false } } : {})),
}));

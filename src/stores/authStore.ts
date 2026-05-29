import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '../lib/apiClient';
import { User } from '../types';
import logger from '../lib/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User, accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
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
        set({ isLoading: false });
        return false;
      }
      logger.info('AuthStore', 'Token encontrado — restaurando sesión');
      set({ isLoading: false, isAuthenticated: true });
      return true;
    } catch (err: unknown) {
      logger.error('AuthStore', 'Error leyendo SecureStore', err);
      set({ isLoading: false });
      return false;
    }
  },
}));

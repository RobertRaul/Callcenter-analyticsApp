import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import logger from './logger';

// URL base de la API — configurable vía app.config.ts (extra.apiUrl) o variable
// de entorno API_URL. Por defecto apunta a PRODUCCIÓN (HTTPS).
// Para probar contra la LAN, define API_URL=http://192.168.11.3/api en tu .env.
export const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'https://metricas.macsalud.com/api';

export const TOKEN_KEY = 'cc_access_token';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Interceptor REQUEST ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logger.debug(
      'API:Request',
      `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      {
        params:  config.params,
        hasAuth: !!token,
      }
    );

    return config;
  },
  (error) => {
    logger.error('API:Request', 'Error preparando la petición', error?.message);
    return Promise.reject(error);
  }
);

// ─── Interceptor RESPONSE ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.debug(
      'API:Response',
      `${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      { dataType: typeof response.data, isArray: Array.isArray(response.data) }
    );
    return response;
  },
  async (error) => {
    const status  = error.response?.status;
    const url     = error.config?.url ?? '?';
    const method  = error.config?.method?.toUpperCase() ?? '?';
    const detail  = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;

    logger.error(
      'API:Response',
      `${status ?? 'NETWORK_ERROR'} ${method} ${url} — ${detail}`,
      {
        status,
        url,
        responseData: error.response?.data,
        message: error.message,
      }
    );

    if (status === 401) {
      logger.warn('API:Auth', 'Token expirado o inválido — cerrando sesión');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      sessionExpiredEmitter.emit();
    }

    if (!error.response) {
      logger.error(
        'API:Network',
        `Sin respuesta del servidor — verifica que ${BASE_URL} es accesible desde el dispositivo`,
        { message: error.message }
      );
    }

    return Promise.reject(error);
  }
);

// ─── Emisor de sesión expirada ────────────────────────────────────────────────
type Listener = () => void;
export const sessionExpiredEmitter = {
  listeners: [] as Listener[],
  on(fn: Listener)  { this.listeners.push(fn); },
  off(fn: Listener) { this.listeners = this.listeners.filter(l => l !== fn); },
  emit()            {
    logger.warn('Auth', 'sessionExpiredEmitter disparado — redirigiendo a login');
    this.listeners.forEach(fn => fn());
  },
};

export default apiClient;

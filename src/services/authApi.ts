import apiClient from '../lib/apiClient';
import { AuthResponse, LoginRequest, User, ChangePasswordRequest } from '../types';

export const authApi = {
  // POST /api/auth/login
  // Body: { username, password }  ← NO "email"
  // Response: { access_token, token_type: "bearer", user: { id, username, email, full_name, permissions } }
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  // GET /api/auth/me — valida sesión activa y devuelve usuario actual
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  // POST /api/auth/change-password — cambia la propia contraseña
  // (también para el cambio obligatorio del primer ingreso). new ≥ 8 chars.
  changePassword: async (payload: ChangePasswordRequest): Promise<void> => {
    await apiClient.post('/auth/change-password', payload);
  },

  // POST /api/auth/forgot-password — autoservicio: envía una temporal al correo.
  // Respuesta genérica (no revela si el correo existe).
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  // Tu API no tiene endpoint de logout documentado.
  // Implementamos logout solo local (borra token de SecureStore).
  // Si en el futuro agregas POST /api/auth/logout al backend, descomenta:
  // logout: async (): Promise<void> => {
  //   await apiClient.post('/auth/logout');
  // },
};

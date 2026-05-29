import apiClient from '../lib/apiClient';
import { AuthResponse, LoginRequest, User } from '../types';

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

  // Tu API no tiene endpoint de logout documentado.
  // Implementamos logout solo local (borra token de SecureStore).
  // Si en el futuro agregas POST /api/auth/logout al backend, descomenta:
  // logout: async (): Promise<void> => {
  //   await apiClient.post('/auth/logout');
  // },
};

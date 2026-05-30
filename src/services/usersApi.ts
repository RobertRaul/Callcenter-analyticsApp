import apiClient from '../lib/apiClient';
import { unwrapResponse } from '../lib/apiHelpers';
import { AppUser, UserCreate, UserUpdate } from '../types';
import logger from '../lib/logger';

// Backend (src/routes/users_routes.py):
//  GET    /api/users/list             -> { success, data: AppUser[] }
//  POST   /api/users/create           -> { success, message, id }
//  PUT    /api/users/update/{id}      -> { success, message }   (campos parciales; password = reset)
//  DELETE /api/users/delete/{id}      -> { success, message }   (id=1 admin no se puede borrar)

export const usersApi = {
  list: async (): Promise<AppUser[]> => {
    const { data } = await apiClient.get('/users/list');
    const inner = unwrapResponse(data, 'usersApi.list');
    const arr = Array.isArray(inner) ? inner : [];
    logger.debug('usersApi', `list -> ${arr.length} usuarios`);
    return arr as AppUser[];
  },

  create: async (payload: UserCreate): Promise<{ id?: number }> => {
    const { data } = await apiClient.post('/users/create', payload);
    return { id: data?.id };
  },

  update: async (id: number, payload: UserUpdate): Promise<void> => {
    await apiClient.put(`/users/update/${id}`, payload);
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/delete/${id}`);
  },
};

import { create } from 'zustand';
import { AlertType } from '../services/notificationsService';

export interface AppAlert {
  id:        string;
  type:      AlertType;
  title:     string;
  message:   string;
  read:      boolean;
  createdAt: Date;
  data?:     Record<string, unknown>;
}

interface AlertsState {
  alerts:      AppAlert[];
  unreadCount: number;
  addAlert:    (alert: Omit<AppAlert, 'id' | 'read' | 'createdAt'>) => void;
  markRead:    (id: string) => void;
  markAllRead: () => void;
  clearAll:    () => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts:      [],
  unreadCount: 0,

  addAlert: (alert) => {
    const newAlert: AppAlert = {
      ...alert,
      id:        `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      read:      false,
      createdAt: new Date(),
    };
    set(state => ({
      alerts:      [newAlert, ...state.alerts].slice(0, 50), // máx 50
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: (id) => {
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a),
      unreadCount: Math.max(0, state.unreadCount - (state.alerts.find(a => a.id === id && !a.read) ? 1 : 0)),
    }));
  },

  markAllRead: () => {
    set(state => ({
      alerts:      state.alerts.map(a => ({ ...a, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => set({ alerts: [], unreadCount: 0 }),
}));

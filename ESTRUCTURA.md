CallCenterAnalytics/
│
├── App.tsx                          ← Punto de entrada, providers
├── app.config.ts                    ← Config Expo + variables de entorno
├── tsconfig.json                    ← TypeScript + path aliases
├── .env                             ← Variables locales (no commitear)
├── .env.example                     ← Plantilla para el equipo
│
├── assets/                          ← Imágenes, fuentes, splash
│
└── src/
    ├── lib/
    │   ├── apiClient.ts             ← Axios + interceptores JWT ✅
    │   └── queryClient.ts           ← TanStack Query config ✅
    │
    ├── stores/
    │   ├── authStore.ts             ← Sesión del usuario (Zustand) ✅
    │   ├── dashboardStore.ts        ← Estado UI del dashboard (Paso 3)
    │   └── alertsStore.ts           ← Alertas no leídas (Paso 6)
    │
    ├── navigation/
    │   ├── AuthNavigator.tsx        ← Login stack ✅
    │   └── MainNavigator.tsx        ← Bottom tabs ✅
    │
    ├── screens/
    │   ├── auth/
    │   │   └── LoginScreen.tsx      ← (Paso 2)
    │   ├── dashboard/
    │   │   └── DashboardScreen.tsx  ← (Paso 3)
    │   ├── calls/
    │   │   ├── CallsListScreen.tsx  ← (Paso 4)
    │   │   └── CallDetailScreen.tsx ← (Paso 4)
    │   ├── agents/
    │   │   ├── AgentsScreen.tsx     ← (Paso 5)
    │   │   └── AgentDetailScreen.tsx← (Paso 5)
    │   └── alerts/
    │       └── AlertsScreen.tsx     ← (Paso 6)
    │
    ├── components/
    │   ├── ui/                      ← Botones, inputs, cards reutilizables
    │   ├── dashboard/               ← KPICard, MetricChart, etc.
    │   ├── calls/                   ← CallItem, AudioPlayer, etc.
    │   └── agents/                  ← AgentCard, StatusBadge, etc.
    │
    ├── hooks/
    │   ├── useAuth.ts               ← (Paso 2)
    │   ├── useDashboard.ts          ← (Paso 3)
    │   ├── useCalls.ts              ← (Paso 4)
    │   └── useAgents.ts             ← (Paso 5)
    │
    └── types/
        └── index.ts                 ← Tipos TypeScript del dominio ✅

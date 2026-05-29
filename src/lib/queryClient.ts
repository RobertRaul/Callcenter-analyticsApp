import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos considerados frescos por 30 segundos por defecto
      staleTime:          30_000,
      // Mantener en caché 5 minutos aunque no haya observadores
      gcTime:             5 * 60_000,
      // Reintentar solo 1 vez en caso de error (evita loops de red)
      retry:              1,
      retryDelay:         (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      // No refetch automático al volver al foco de la app (evita
      // recargas innecesarias cuando el usuario vuelve de otra app)
      refetchOnWindowFocus: false,
      // Sí refetch cuando se recupera la conexión a internet
      refetchOnReconnect:   true,
      // No refetch al montar si los datos son recientes
      refetchOnMount:       true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;

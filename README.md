# MACSA Call Center Analytics

Aplicación móvil (React Native + Expo) para el monitoreo del call center de **MACSA Clínica de Salud**:
dashboard en tiempo real, llamadas, agentes, análisis avanzado, reportes exportables y alertas push.

## Stack

- **Expo SDK 55** · React Native 0.83 · React 19 · TypeScript
- **React Navigation** (stack de auth + bottom tabs)
- **Zustand** — estado global (sesión, alertas)
- **TanStack Query** — caché y sincronización de datos del servidor
- **Axios** — cliente HTTP con interceptores JWT
- **expo-secure-store** — almacenamiento seguro de tokens
- **expo-notifications** — alertas push / locales

## Módulos

| Módulo      | Descripción                                                        |
|-------------|--------------------------------------------------------------------|
| Auth        | Login con JWT, restauración de sesión, logout                      |
| Dashboard   | KPIs, service level, estado de agentes y colas en tiempo real      |
| Llamadas    | Listado con filtros, detalle y reproductor de grabaciones          |
| Agentes     | Listado y detalle con estadísticas por agente                      |
| Análisis    | Ranking, SLA, patrones, mapa de calor, abandono + recomendaciones  |
| Reportes    | Exportación Excel/PDF por rango de fechas y compartir              |
| Alertas     | Motor de alertas con umbrales y notificaciones                     |

## Configuración

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env   # y editar los valores

# 3. Iniciar en modo desarrollo
npx expo start         # escanear el QR con Expo Go o usar un dev build
```

> ⚠️ Los archivos `credentials.json`, `google-services.json` y el directorio `credentials/`
> contienen secretos y **no están versionados**. Solicítalos al responsable del proyecto
> o configúralos como *secrets* en EAS.

## Builds (EAS)

```bash
eas build --profile development --platform android   # APK de desarrollo
eas build --profile preview     --platform android   # APK interno de QA
eas build --profile production  --platform android   # AAB para Play Store
```

## Estructura

```
src/
├── lib/          # apiClient, queryClient, logger
├── stores/       # Zustand (auth, alerts)
├── navigation/   # navegadores
├── screens/      # pantallas por módulo
├── components/   # UI reutilizable
├── hooks/        # hooks de datos (TanStack Query)
├── services/     # llamadas a la API por dominio
├── theme/        # tema claro/oscuro
└── types/        # tipos del dominio
```

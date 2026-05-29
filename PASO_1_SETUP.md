# Paso 1 — Configuración del proyecto Call Center Analytics

## 1. Crear el proyecto con Expo

```bash
npx create-expo-app@latest CallCenterAnalytics --template blank-typescript
cd CallCenterAnalytics
```

## 2. Instalar todas las dependencias

```bash
# Navegación
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# Estado global
npm install zustand

# Datos del servidor (caché + sync)
npm install @tanstack/react-query

# HTTP cliente
npm install axios

# Formularios y validación
npm install react-hook-form zod @hookform/resolvers

# Almacenamiento seguro (tokens JWT)
npx expo install expo-secure-store

# Variables de entorno
npx expo install expo-constants

# Utilidades
npm install date-fns
```

## 3. Verificar instalación

```bash
npx expo start
# Presiona 'i' para iOS simulator o 'a' para Android emulator
```

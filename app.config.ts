import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name:    'MACSA Call Center',
  slug:    'callcenter-analytics',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',

  splash: {
    image:           './assets/splash.png',
    resizeMode:      'contain',
    backgroundColor: '#2196C9',
  },

  ios: {
    supportsTablet:   true,
    bundleIdentifier: 'com.macsalud.callcenter',
    buildNumber:      '1',
    // Para notificaciones push en iOS necesitas entitlements
    entitlements: {
      'aps-environment': 'production',
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2196C9',
    },
    package:            'com.macsalud.callcenter',
    versionCode:        1,
    googleServicesFile: './google-services.json',
    permissions: [
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'INTERNET',
      'ACCESS_NETWORK_STATE',
    ],
  },

  plugins: [
    'expo-secure-store',
    'expo-audio',
    [
      'expo-notifications',
      {
        icon:   './assets/notification-icon.png',
        color:  '#2196C9',
        sounds: [],
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
          compileSdkVersion:    36,
          targetSdkVersion:     36,
          minSdkVersion:        24,
        },
        ios: {
          deploymentTarget: '15.1',
        },
      },
    ],
  ],

  extra: {
    apiUrl:      process.env.API_URL      ?? 'http://192.168.11.3/api',
    apiVersion:  process.env.API_VERSION  ?? 'v1',
    wsUrl:       process.env.WS_URL       ?? 'ws://192.168.11.3',
    environment: process.env.APP_ENV      ?? 'development',
    fcmSenderId: '536689110655',
    eas: {
        "projectId": "3e95fa50-a898-4d6d-9c02-0a57a67b0bb2"
    },
  },
});

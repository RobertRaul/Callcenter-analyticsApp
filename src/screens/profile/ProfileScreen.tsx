import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authApi';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';
import Card from '../../components/ui/Card';
import { Divider } from '../../components/ui/misc';

type ThemeOption = { key: 'light' | 'dark' | 'system'; label: string; icon: string; desc: string };

const THEME_OPTIONS: ThemeOption[] = [
  { key:'light',  label:'Claro',   icon:'☀',  desc:'Fondo blanco, texto oscuro'   },
  { key:'dark',   label:'Oscuro',  icon:'☾',  desc:'Fondo oscuro, texto claro'    },
  { key:'system', label:'Sistema', icon:'◑',  desc:'Sigue la configuración del dispositivo' },
];

const PERM_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  calls:     'Llamadas',
  queues:    'Colas',
  agents:    'Agentes',
  reports:   'Reportes',
};

export default function ProfileScreen() {
  // ← useTheme DEBE ser la primera llamada — da el contexto correcto
  const { colors, isDark, mode, setMode } = useTheme();
  const { user }    = useAuthStore();
  const { logout }  = useAuth();
  const navigation  = useNavigation<any>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn:  authApi.me,
    initialData: user ?? undefined,
    staleTime: 5 * 60_000,
  });

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (isLoading && !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const initials = (profile?.full_name ?? profile?.username ?? '??')
    .split(' ').map((n: string) => n[0] ?? '').slice(0, 2).join('').toUpperCase();

  const permissions = profile?.permissions ?? {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mi perfil" subtitle="MACSA Clínica de Salud" showThemeToggle />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrap, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
            <Text style={[styles.avatarText, { color: Colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.fullName, { color: colors.text }]}>
            {profile?.full_name ?? '—'}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{profile?.username ?? '—'}
          </Text>
          {profile?.email && (
            <Text style={[styles.email, { color: colors.textTertiary }]}>
              {profile.email}
            </Text>
          )}
        </View>

        {/* Permisos */}
        <Text style={[styles.sLabel, { color: colors.textTertiary }]}>Permisos de acceso</Text>
        <Card>
          <View style={styles.permGrid}>
            {Object.entries(PERM_LABELS).map(([key, label]) => {
              const active = Boolean((permissions as any)[key]);
              return (
                <View key={key} style={[styles.permBadge, {
                  backgroundColor: active ? Colors.primary + '12' : colors.surfaceAlt,
                  borderColor:     active ? Colors.primary + '30' : colors.border,
                }]}>
                  <Text style={{ fontSize: 10, color: active ? Colors.primary : colors.textDisabled }}>
                    {active ? '✓' : '—'}
                  </Text>
                  <Text style={[styles.permText, {
                    color: active ? Colors.primary : colors.textDisabled,
                  }]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── Apariencia ─────────────────────────────────────────── */}
        <Text style={[styles.sLabel, { color: colors.textTertiary }]}>Apariencia</Text>
        <Card noPadding>
          {THEME_OPTIONS.map((opt, i) => {
            const isActive = mode === opt.key;
            return (
              <View key={opt.key}>
                <TouchableOpacity
                  style={[styles.themeRow, isActive && {
                    backgroundColor: Colors.primary + '08',
                  }]}
                  onPress={() => setMode(opt.key)}
                  activeOpacity={0.75}
                >
                  {/* Ícono con fondo */}
                  <View style={[styles.themeIconWrap, {
                    backgroundColor: isActive ? Colors.primary + '15' : colors.surfaceAlt,
                  }]}>
                    <Text style={[styles.themeIcon, { color: isActive ? Colors.primary : colors.textSecondary }]}>
                      {opt.icon}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.themeLabel, {
                      color: isActive ? Colors.primary : colors.text,
                      fontWeight: isActive ? '600' : '400',
                    }]}>{opt.label}</Text>
                    <Text style={[styles.themeDesc, { color: colors.textTertiary }]}>
                      {opt.desc}
                    </Text>
                  </View>

                  {/* Radio */}
                  <View style={[styles.radioOuter, {
                    borderColor: isActive ? Colors.primary : colors.borderStrong,
                  }]}>
                    {isActive && (
                      <View style={[styles.radioInner, { backgroundColor: Colors.primary }]} />
                    )}
                  </View>
                </TouchableOpacity>
                {i < THEME_OPTIONS.length - 1 && <Divider indent={60} />}
              </View>
            );
          })}
        </Card>

        {/* Vista previa del tema activo */}
        <View style={[styles.themePreview, {
          backgroundColor: isDark ? '#161B22' : '#F5F7FA',
          borderColor: colors.border,
        }]}>
          <View style={[styles.previewDot, { backgroundColor: Colors.primary }]} />
          <Text style={[styles.previewText, { color: colors.textSecondary }]}>
            Tema activo: <Text style={{ color: colors.text, fontWeight: '600' }}>
              {THEME_OPTIONS.find(o => o.key === mode)?.label}
            </Text>
            {' '}— {isDark ? 'modo oscuro' : 'modo claro'}
          </Text>
        </View>

        {/* Administración */}
        <Text style={[styles.sLabel, { color: colors.textTertiary }]}>Administración</Text>
        <Card noPadding>
          <TouchableOpacity
            style={styles.debugRow}
            onPress={() => navigation.navigate('Users')}
            activeOpacity={0.75}
          >
            <View style={[styles.themeIconWrap, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="people" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.themeLabel, { color: colors.text }]}>Gestión de usuarios</Text>
              <Text style={[styles.themeDesc, { color: colors.textTertiary }]}>
                Crear, editar y restablecer contraseñas
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Desarrollo */}
        {__DEV__ && (
          <>
            <Text style={[styles.sLabel, { color: colors.textTertiary }]}>Desarrollo</Text>
            <Card noPadding>
              <TouchableOpacity
                style={styles.debugRow}
                onPress={() => navigation.navigate('Debug')}
                activeOpacity={0.75}
              >
                <View style={[styles.themeIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={{ fontSize: 16 }}>⬛</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.themeLabel, { color: colors.text }]}>Consola de logs</Text>
                  <Text style={[styles.themeDesc, { color: colors.textTertiary }]}>
                    Ver errores y eventos en tiempo real
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, {
            backgroundColor: Colors.errorLight,
            borderColor: Colors.error + '30',
          }]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={[styles.logoutText, { color: Colors.error }]}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textDisabled }]}>
          MACSA Clínica de Salud{'\n'}
          Call Center Analytics v1.0.0{'\n'}
          metricas.macsalud.com · Issabel/Asterisk
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  content:         { padding: Spacing.lg, paddingBottom: 48 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Avatar
  avatarSection:   { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.sm },
  avatarWrap:      { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: Spacing.md },
  avatarText:      { fontSize: 28, fontWeight: Typography.bold },
  fullName:        { fontSize: Typography.xl, fontWeight: Typography.semibold, marginBottom: 4 },
  username:        { fontSize: Typography.sm, marginBottom: 2 },
  email:           { fontSize: Typography.xs },

  // Labels
  sLabel:          { fontSize: Typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.md },

  // Permisos
  permGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  permBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 0.5 },
  permText:        { fontSize: Typography.xs, fontWeight: Typography.medium },

  // Tema
  themeRow:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  themeIconWrap:   { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  themeIcon:       { fontSize: 18 },
  themeLabel:      { fontSize: Typography.base },
  themeDesc:       { fontSize: Typography.xs, marginTop: 2 },
  radioOuter:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioInner:      { width: 11, height: 11, borderRadius: 6 },

  // Preview del tema
  themePreview:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, borderWidth: 0.5, padding: Spacing.md, marginBottom: Spacing.sm },
  previewDot:      { width: 8, height: 8, borderRadius: 4 },
  previewText:     { fontSize: Typography.xs },

  // Debug
  debugRow:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  chevron:         { fontSize: 22 },

  // Logout
  logoutBtn:       { borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, marginTop: Spacing.lg, marginBottom: Spacing.xl },
  logoutText:      { fontSize: Typography.base, fontWeight: Typography.semibold },

  // Footer
  footer:          { fontSize: Typography.xs, textAlign: 'center', lineHeight: 20 },
});

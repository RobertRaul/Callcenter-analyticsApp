import React from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUsersList } from '../../hooks/useUsers';
import { AppUser } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';
import { Divider, EmptyState } from '../../components/ui/misc';
import { getInitials } from '../../lib/text';

const PERM_KEYS: { key: keyof AppUser; label: string }[] = [
  { key: 'access_dashboard', label: 'Dashboard' },
  { key: 'access_calls',     label: 'Llamadas'  },
  { key: 'access_queues',    label: 'Colas'     },
  { key: 'access_agents',    label: 'Agentes'   },
  { key: 'access_reports',   label: 'Reportes'  },
];

export default function UsersListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { data: users = [], isLoading, isRefetching, refetch, error } = useUsersList();

  const permCount = (u: AppUser) => PERM_KEYS.filter(p => Boolean(u[p.key])).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Usuarios"
        subtitle={`${users.length} registrados`}
        rightAction={
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: Colors.primary }]}
            onPress={() => navigation.navigate('UserForm', {})}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.newBtnText}>Nuevo</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: Colors.error, textAlign: 'center', paddingHorizontal: Spacing.xl }}>
            No se pudieron cargar los usuarios. Desliza para reintentar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          renderItem={({ item, index }) => (
            <View>
              <TouchableOpacity
                style={[styles.row, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('UserForm', { user: item })}
                activeOpacity={0.75}
              >
                <View style={[styles.avatar, { backgroundColor: Colors.primary + '15' }]}>
                  <Text style={[styles.avatarText, { color: Colors.primary }]}>
                    {getInitials(item.full_name || item.username)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                      {item.full_name || item.username}
                    </Text>
                    {item.is_admin && (
                      <View style={[styles.adminTag, { backgroundColor: Colors.secondary + '20' }]}>
                        <Text style={[styles.adminTagText, { color: Colors.secondary }]}>Admin</Text>
                      </View>
                    )}
                    <View style={[styles.statusDot, { backgroundColor: item.is_active ? Colors.success : colors.textDisabled }]} />
                  </View>
                  <Text style={[styles.sub, { color: colors.textTertiary }]} numberOfLines={1}>
                    @{item.username} · {item.email || 'sin correo'}
                  </Text>
                  <Text style={[styles.perm, { color: colors.textDisabled }]}>
                    {permCount(item)}/5 permisos · {item.is_active ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
              </TouchableOpacity>
              {index < users.length - 1 && <Divider indent={64} />}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="◎" title="Sin usuarios" subtitle="Crea el primero con el botón Nuevo" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  newBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  newBtnText:  { color: '#FFF', fontSize: Typography.xs, fontWeight: '600' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  avatar:      { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText:  { fontSize: Typography.base, fontWeight: '600' },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name:        { fontSize: Typography.base, fontWeight: '500', flexShrink: 1 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  adminTag:    { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.full },
  adminTagText:{ fontSize: 9, fontWeight: '700' },
  sub:         { fontSize: Typography.xs, marginTop: 2 },
  perm:        { fontSize: 10, marginTop: 2 },
});

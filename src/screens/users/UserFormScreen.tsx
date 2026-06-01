import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateUser, useUpdateUser, useDeleteUser, useResetPassword } from '../../hooks/useUsers';
import { AppUser, UserCreate, UserUpdate, UserPasswordActionResponse } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

const PERMISSIONS: { key: keyof Pick<AppUser, 'access_dashboard' | 'access_calls' | 'access_queues' | 'access_agents' | 'access_reports'>; label: string }[] = [
  { key: 'access_dashboard', label: 'Dashboard' },
  { key: 'access_calls',     label: 'Llamadas'  },
  { key: 'access_queues',    label: 'Colas'     },
  { key: 'access_agents',    label: 'Agentes'   },
  { key: 'access_reports',   label: 'Reportes'  },
];

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function errMsg(e: unknown, fallback: string): string {
  const detail = (e as any)?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return fallback;
}

// Mensaje según si el correo se envió o hay que entregar la temporal a mano.
function credentialMsg(res: UserPasswordActionResponse, email: string): string {
  if (res?.temp_password) {
    return `No se pudo enviar el correo.\nContraseña temporal: ${res.temp_password}\n\nEntrégala al usuario; deberá cambiarla en su primer ingreso.`;
  }
  return `Se envió una contraseña temporal a ${email}.\nEl usuario deberá cambiarla en su primer ingreso.`;
}

export default function UserFormScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editing: AppUser | undefined = route.params?.user;
  const isEdit = !!editing;

  const createM = useCreateUser();
  const updateM = useUpdateUser();
  const deleteM = useDeleteUser();
  const resetM  = useResetPassword();
  const busy = createM.isPending || updateM.isPending || deleteM.isPending || resetM.isPending;

  const [username, setUsername] = useState(editing?.username ?? '');
  const [fullName, setFullName] = useState(editing?.full_name ?? '');
  const [email, setEmail]       = useState(editing?.email ?? '');
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [isAdmin, setIsAdmin]   = useState(editing?.is_admin ?? false);
  const [perms, setPerms] = useState({
    access_dashboard: editing?.access_dashboard ?? true,
    access_calls:     editing?.access_calls ?? true,
    access_queues:    editing?.access_queues ?? true,
    access_agents:    editing?.access_agents ?? true,
    access_reports:   editing?.access_reports ?? true,
  });

  function validate(): string | null {
    if (!isEdit && !username.trim()) return 'El usuario es obligatorio';
    if (!fullName.trim()) return 'El nombre completo es obligatorio';
    if (!email.trim() || !emailOk(email.trim())) return 'Correo inválido';
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { Alert.alert('Revisa los datos', err); return; }

    try {
      if (isEdit && editing) {
        const payload: UserUpdate = {
          email: email.trim(),
          full_name: fullName.trim(),
          is_active: isActive,
          is_admin: isAdmin,
          ...perms,
        };
        await updateM.mutateAsync({ id: editing.id, payload });
        Alert.alert('Listo', 'Usuario actualizado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        const payload: UserCreate = {
          username: username.trim(),
          email: email.trim(),
          full_name: fullName.trim(),
          is_admin: isAdmin,
          ...perms,
        };
        const res = await createM.mutateAsync(payload);
        Alert.alert('Usuario creado', credentialMsg(res, email.trim()), [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      Alert.alert('Error', errMsg(e, 'No se pudo guardar el usuario'));
    }
  }

  function handleResetPassword() {
    if (!editing) return;
    Alert.alert(
      'Restablecer contraseña',
      `Se generará una nueva contraseña temporal para ${editing.full_name || editing.username} y se enviará a su correo. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          onPress: async () => {
            try {
              const res = await resetM.mutateAsync(editing.id);
              Alert.alert('Listo', credentialMsg(res, editing.email));
            } catch (e) {
              Alert.alert('Error', errMsg(e, 'No se pudo restablecer la contraseña'));
            }
          },
        },
      ]
    );
  }

  function handleDelete() {
    if (!editing) return;
    if (editing.id === 1) {
      Alert.alert('No permitido', 'El usuario administrador no se puede eliminar.');
      return;
    }
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a ${editing.full_name || editing.username}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await deleteM.mutateAsync(editing.id);
              Alert.alert('Listo', 'Usuario eliminado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } catch (e) {
              Alert.alert('Error', errMsg(e, 'No se pudo eliminar el usuario'));
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Datos */}
        <Text style={[styles.sLabel, { color: colors.textTertiary }]}>Datos</Text>

        {isEdit ? (
          <View style={[styles.readonly, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[styles.readonlyLabel, { color: colors.textTertiary }]}>Usuario</Text>
            <Text style={[styles.readonlyValue, { color: colors.textSecondary }]}>@{username}</Text>
          </View>
        ) : (
          <Field label="Usuario" value={username} onChangeText={setUsername}
            placeholder="ej. jperez" autoCapitalize="none" colors={colors} />
        )}

        <Field label="Nombre completo" value={fullName} onChangeText={setFullName}
          placeholder="ej. Juan Pérez" colors={colors} />
        <Field label="Correo" value={email} onChangeText={setEmail}
          placeholder="ej. jperez@macsalud.com" autoCapitalize="none" keyboardType="email-address" colors={colors} />

        {!isEdit && (
          <View style={[styles.notice, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '25' }]}>
            <Ionicons name="mail" size={16} color={Colors.primary} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Se generará una contraseña temporal y se enviará al correo. El usuario deberá cambiarla en su primer ingreso.
            </Text>
          </View>
        )}

        {/* Rol */}
        <Text style={[styles.sLabel, { color: colors.textTertiary }]}>Rol</Text>
        <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Administrador</Text>
            <Text style={[styles.switchSub, { color: colors.textTertiary }]}>
              Puede gestionar usuarios (crear, editar, restablecer)
            </Text>
          </View>
          <Switch value={isAdmin} onValueChange={setIsAdmin} trackColor={{ true: Colors.primary }} />
        </View>

        {/* Seguridad (solo edición) */}
        {isEdit && (
          <>
            <Text style={[styles.sLabel, { color: colors.textTertiary }]}>Seguridad</Text>
            <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: Spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Usuario activo</Text>
                <Text style={[styles.switchSub, { color: colors.textTertiary }]}>
                  Si está inactivo no podrá iniciar sesión
                </Text>
              </View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: Colors.primary }} />
            </View>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '10' }]}
              onPress={handleResetPassword}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Ionicons name="key-outline" size={16} color={Colors.primary} />
              <Text style={[styles.resetText, { color: Colors.primary }]}>Restablecer contraseña</Text>
            </TouchableOpacity>
            <Text style={[styles.hint, { color: colors.textDisabled }]}>
              Envía una nueva contraseña temporal al correo del usuario (para casos de olvido).
            </Text>
          </>
        )}

        {/* Permisos */}
        <Text style={[styles.sLabel, { color: colors.textTertiary }]}>Permisos de acceso</Text>
        <View style={[styles.permCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {PERMISSIONS.map((p, i) => (
            <View key={p.key}>
              <View style={styles.permRow}>
                <Text style={[styles.permLabel, { color: colors.text }]}>{p.label}</Text>
                <Switch
                  value={perms[p.key]}
                  onValueChange={(v) => setPerms(prev => ({ ...prev, [p.key]: v }))}
                  trackColor={{ true: Colors.primary }}
                />
              </View>
              {i < PERMISSIONS.length - 1 && (
                <View style={[styles.permDivider, { backgroundColor: colors.divider }]} />
              )}
            </View>
          ))}
        </View>

        {/* Guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.primary }, busy && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.saveText}>{isEdit ? 'Guardar cambios' : 'Crear usuario'}</Text>}
        </TouchableOpacity>

        {/* Eliminar (solo edición, no admin id=1) */}
        {isEdit && editing?.id !== 1 && (
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: Colors.error + '40', backgroundColor: Colors.errorLight }]}
            onPress={handleDelete}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={[styles.deleteText, { color: Colors.error }]}>Eliminar usuario</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, colors, ...props }: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  colors: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholderTextColor={colors.textDisabled}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.md, borderBottomWidth: 0.5 },
  backBtn:       { width: 32, height: 32, justifyContent: 'center' },
  headerTitle:   { fontSize: Typography.lg, fontWeight: '600' },
  content:       { padding: Spacing.lg, paddingBottom: 48 },
  sLabel:        { fontSize: Typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  field:         { marginBottom: Spacing.md },
  fieldLabel:    { fontSize: Typography.xs, fontWeight: '500', marginBottom: Spacing.xs },
  input:         { borderWidth: 0.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 11, fontSize: Typography.base },
  readonly:      { borderWidth: 0.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, marginBottom: Spacing.md },
  readonlyLabel: { fontSize: Typography.xs, marginBottom: 2 },
  readonlyValue: { fontSize: Typography.base, fontWeight: '500' },
  notice:        { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', borderWidth: 0.5, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.xs },
  noticeText:    { flex: 1, fontSize: Typography.xs, lineHeight: 16 },
  hint:          { fontSize: Typography.xs, marginTop: Spacing.xs, lineHeight: 16 },
  switchRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.md },
  switchLabel:   { fontSize: Typography.base, fontWeight: '500' },
  switchSub:     { fontSize: Typography.xs, marginTop: 2 },
  resetBtn:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderRadius: Radius.md, paddingVertical: 12, borderWidth: 0.5 },
  resetText:     { fontSize: Typography.base, fontWeight: '600' },
  permCard:      { borderWidth: 0.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  permRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  permLabel:     { fontSize: Typography.base },
  permDivider:   { height: 0.5 },
  saveBtn:       { borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xl },
  saveText:      { color: '#FFF', fontSize: Typography.base, fontWeight: '600' },
  deleteBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderRadius: Radius.md, paddingVertical: 13, borderWidth: 0.5, marginTop: Spacing.md },
  deleteText:    { fontSize: Typography.base, fontWeight: '600' },
});

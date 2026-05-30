import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../services/authApi';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

function errMsg(e: unknown, fallback: string): string {
  const detail = (e as any)?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return fallback;
}

export default function ChangePasswordScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const forced: boolean = route.params?.forced === true;

  const { clearMustChange, logout, user } = useAuthStore();

  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]       = useState(false);
  const [busy, setBusy]       = useState(false);

  function validate(): string | null {
    if (!current) return 'Ingresa tu contraseña actual';
    if (next.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres';
    if (next === current) return 'La nueva contraseña debe ser distinta a la actual';
    if (next !== confirm) return 'La confirmación no coincide';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { Alert.alert('Revisa los datos', err); return; }
    setBusy(true);
    try {
      await authApi.changePassword({ current_password: current, new_password: next });
      if (forced) {
        Alert.alert('Listo', 'Tu contraseña fue actualizada.', [{ text: 'Continuar', onPress: clearMustChange }]);
      } else {
        Alert.alert('Listo', 'Tu contraseña fue actualizada.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      Alert.alert('Error', errMsg(e, 'No se pudo cambiar la contraseña'));
    } finally {
      setBusy(false);
    }
  }

  const field = (label: string, value: string, setter: (t: string) => void, placeholder: string) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholderTextColor={colors.textDisabled}
        secureTextEntry={!show}
        autoCapitalize="none"
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {forced ? (
          <View style={{ width: 32 }} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cambiar contraseña</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {forced && (
          <View style={[styles.notice, { backgroundColor: Colors.primary + '12', borderColor: Colors.primary + '30' }]}>
            <Ionicons name="lock-closed" size={18} color={Colors.primary} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Por seguridad debes cambiar la contraseña temporal antes de continuar.
              {user?.username ? ` Sesión: @${user.username}.` : ''}
            </Text>
          </View>
        )}

        {field('Contraseña actual', current, setCurrent, forced ? 'La contraseña temporal del correo' : 'Tu contraseña actual')}
        {field('Nueva contraseña', next, setNext, 'Mínimo 8 caracteres')}
        {field('Confirmar nueva contraseña', confirm, setConfirm, 'Repite la nueva contraseña')}

        <TouchableOpacity onPress={() => setShow(v => !v)} style={styles.showRow}>
          <Ionicons name={show ? 'eye-off' : 'eye'} size={16} color={colors.textTertiary} />
          <Text style={[styles.showText, { color: colors.textTertiary }]}>
            {show ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.primary }, busy && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Actualizar contraseña</Text>}
        </TouchableOpacity>

        {forced && (
          <TouchableOpacity style={styles.logoutLink} onPress={logout} disabled={busy}>
            <Text style={[styles.logoutText, { color: colors.textTertiary }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.md, borderBottomWidth: 0.5 },
  backBtn:     { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: Typography.lg, fontWeight: '600' },
  content:     { padding: Spacing.lg, paddingBottom: 48 },
  notice:      { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', borderWidth: 0.5, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  noticeText:  { flex: 1, fontSize: Typography.sm, lineHeight: 18 },
  field:       { marginBottom: Spacing.md },
  fieldLabel:  { fontSize: Typography.xs, fontWeight: '500', marginBottom: Spacing.xs },
  input:       { borderWidth: 0.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 11, fontSize: Typography.base },
  showRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.xs, marginBottom: Spacing.md },
  showText:    { fontSize: Typography.xs },
  saveBtn:     { borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  saveText:    { color: '#FFF', fontSize: Typography.base, fontWeight: '600' },
  logoutLink:  { alignItems: 'center', paddingVertical: Spacing.lg, marginTop: Spacing.sm },
  logoutText:  { fontSize: Typography.sm, textDecorationLine: 'underline' },
});

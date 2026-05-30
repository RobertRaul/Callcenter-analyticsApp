import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Modal, Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/authApi';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login, isLoggingIn, error, clearError } = useAuth();
  const { colors, isDark, toggle } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen]     = useState(false);
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotBusy, setForgotBusy]     = useState(false);

  const handleForgot = async () => {
    if (!forgotEmail.trim()) { Alert.alert('Correo requerido', 'Ingresa tu correo.'); return; }
    setForgotBusy(true);
    try {
      await authApi.forgotPassword(forgotEmail.trim());
    } catch {
      // respuesta genérica de todos modos (no revelar si el correo existe)
    } finally {
      setForgotBusy(false);
      setForgotOpen(false);
      setForgotEmail('');
      Alert.alert('Revisa tu correo', 'Si el correo está registrado, se envió una contraseña temporal con instrucciones de acceso.');
    }
  };

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try { await login(data); } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#F5F7FA' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Botón de tema */}
        <TouchableOpacity style={styles.themeToggle} onPress={toggle}>
          <Text style={[styles.themeIcon, { color: colors.textTertiary }]}>
            {isDark ? '☀' : '☾'}
          </Text>
        </TouchableOpacity>

        {/* Logo MACSA */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrap}>
            {/* Cruz MACSA con colores del logo */}
            <View style={styles.logoGrid}>
              <View style={[styles.cell, styles.cellTL, { backgroundColor: Colors.primary + '30' }]} />
              <View style={[styles.cell, styles.cellV,  { backgroundColor: Colors.secondary }]} />
              <View style={[styles.cell, styles.cellTR, { backgroundColor: Colors.primary + '30' }]} />
              <View style={[styles.cell, styles.cellH,  { backgroundColor: Colors.primary }]} />
              <View style={[styles.cell, styles.cellCenter, { backgroundColor: isDark ? '#1C2333' : '#FFF' }]} />
              <View style={[styles.cell, styles.cellH,  { backgroundColor: Colors.primary }]} />
              <View style={[styles.cell, styles.cellBL, { backgroundColor: Colors.secondary + '80' }]} />
              <View style={[styles.cell, styles.cellV,  { backgroundColor: Colors.secondary }]} />
              <View style={[styles.cell, styles.cellBR, { backgroundColor: Colors.primary + '30' }]} />
            </View>
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>MACSA</Text>
          <Text style={[styles.brandSub, { color: colors.textSecondary }]}>Clínica de Salud</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.appName, { color: colors.textTertiary }]}>Call Center Analytics</Text>
        </View>

        {/* Formulario */}
        <View style={[styles.form, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Iniciar sesión</Text>
          <Text style={[styles.formSub, { color: colors.textTertiary }]}>
            Accede con tus credenciales del sistema
          </Text>

          {/* Error banner */}
          {error && (
            <TouchableOpacity
              style={[styles.errorBanner, { backgroundColor: Colors.errorLight, borderColor: Colors.error + '30' }]}
              onPress={clearError}
            >
              <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
            </TouchableOpacity>
          )}

          {/* Usuario */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Usuario</Text>
            <Controller
              control={control} name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, {
                    backgroundColor: isDark ? '#0D1117' : '#F8FAFC',
                    borderColor: errors.username ? Colors.error : colors.border,
                    color: colors.text,
                  }]}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor={colors.textDisabled}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={v => { onChange(v); clearError(); }}
                  value={value}
                />
              )}
            />
            {errors.username && (
              <Text style={[styles.fieldError, { color: Colors.error }]}>{errors.username.message}</Text>
            )}
          </View>

          {/* Contraseña */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Contraseña</Text>
            <View>
              <Controller
                control={control} name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.inputPassword, {
                      backgroundColor: isDark ? '#0D1117' : '#F8FAFC',
                      borderColor: errors.password ? Colors.error : colors.border,
                      color: colors.text,
                    }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textDisabled}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onBlur={onBlur}
                    onChangeText={v => { onChange(v); clearError(); }}
                    value={value}
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
                hitSlop={{ top:8,bottom:8,left:8,right:8 }}
              >
                <Text style={[styles.eyeIcon, { color: colors.textTertiary }]}>
                  {showPassword ? '○' : '●'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={[styles.fieldError, { color: Colors.error }]}>{errors.password.message}</Text>
            )}
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: Colors.primary }, isLoggingIn && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoggingIn}
            activeOpacity={0.85}
          >
            {isLoggingIn
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.submitText}>Iniciar sesión</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotLink} onPress={() => setForgotOpen(true)}>
            <Text style={[styles.forgotText, { color: Colors.primary }]}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.textDisabled }]}>
          metricas.macsalud.com · Issabel Call Center
        </Text>
      </ScrollView>

      {/* Modal recuperar contraseña */}
      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Recuperar contraseña</Text>
            <Text style={[styles.modalSub, { color: colors.textTertiary }]}>
              Ingresa tu correo y te enviaremos una contraseña temporal.
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: isDark ? '#0D1117' : '#F8FAFC',
                borderColor: colors.border, color: colors.text, marginBottom: Spacing.md,
              }]}
              placeholder="tu@correo.com"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="none"
              keyboardType="email-address"
              value={forgotEmail}
              onChangeText={setForgotEmail}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => setForgotOpen(false)}
                disabled={forgotBusy}
              >
                <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSend, { backgroundColor: Colors.primary }]}
                onPress={handleForgot}
                disabled={forgotBusy}
              >
                {forgotBusy
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={{ color: '#FFF', fontWeight: '600' }}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow:1, justifyContent:'center', paddingHorizontal: Spacing.xl, paddingVertical: 48 },
  themeToggle: { position:'absolute', top: 56, right: Spacing.xl, zIndex: 1 },
  themeIcon:   { fontSize: 20 },

  logoSection: { alignItems:'center', marginBottom: 32 },
  logoWrap:    { marginBottom: 14 },
  logoGrid:    { width: 60, height: 60, flexDirection:'row', flexWrap:'wrap' },
  cell:        { width: 20, height: 20 },
  cellTL:      {}, cellTR: {}, cellBL: {}, cellBR: {},
  cellH:       {}, cellV:  {}, cellCenter: {},

  brandName: { fontSize: Typography.xxl, fontWeight: Typography.bold, letterSpacing: 1.5, marginBottom: 2 },
  brandSub:  { fontSize: Typography.sm, letterSpacing: 0.5, marginBottom: 12 },
  divider:   { width: 40, height: 1, marginBottom: 10 },
  appName:   { fontSize: Typography.xs, letterSpacing: 1, textTransform:'uppercase' },

  form: {
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    padding: Spacing.xxl,
    marginBottom: 24,
  },
  formTitle: { fontSize: Typography.xl, fontWeight: Typography.semibold, marginBottom: 4 },
  formSub:   { fontSize: Typography.sm, marginBottom: Spacing.xl, lineHeight: 18 },

  errorBanner: {
    borderRadius: Radius.md, borderWidth: 0.5,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  errorText: { fontSize: Typography.sm, lineHeight: 18 },

  field:      { marginBottom: Spacing.lg },
  label:      { fontSize: Typography.sm, fontWeight: Typography.medium, marginBottom: Spacing.sm },
  input: {
    borderWidth: 0.5, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    fontSize: Typography.base,
  },
  inputPassword: { paddingRight: 48 },
  eyeBtn:     { position:'absolute', right: 14, top: 13 },
  eyeIcon:    { fontSize: 16 },
  fieldError: { fontSize: Typography.xs, marginTop: 5 },

  submitBtn: {
    borderRadius: Radius.md, paddingVertical: 14,
    alignItems:'center', marginTop: Spacing.sm,
  },
  btnDisabled: { opacity: 0.65 },
  submitText:  { color:'#FFF', fontSize: Typography.base, fontWeight: Typography.semibold },

  footer: { fontSize: Typography.xs, textAlign:'center' },

  forgotLink: { alignItems: 'center', marginTop: Spacing.md },
  forgotText: { fontSize: Typography.sm, fontWeight: Typography.medium },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: Spacing.xl },
  modalCard:    { width: '100%', maxWidth: 360, borderRadius: Radius.lg, borderWidth: 0.5, padding: Spacing.xl },
  modalTitle:   { fontSize: Typography.lg, fontWeight: Typography.semibold, marginBottom: 4 },
  modalSub:     { fontSize: Typography.sm, marginBottom: Spacing.lg, lineHeight: 18 },
  modalBtns:    { flexDirection: 'row', gap: Spacing.md },
  modalCancel:  { flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 0.5, alignItems: 'center' },
  modalSend:    { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center' },
});

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing } from '../../theme/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showThemeToggle?: boolean;
}

export default function AppHeader({
  title, subtitle, showBack, onBack, rightAction, showThemeToggle,
}: AppHeaderProps) {
  const { colors, isDark, toggle } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.header}
      />
      <View style={[styles.header, {
        backgroundColor: colors.header,
        borderBottomColor: colors.border,
      }]}>
        {/* Izquierda */}
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Text style={[styles.backIcon, { color: Colors.primary }]}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.logoMark}>
              <View style={[styles.logoBar, styles.logoBarH, { backgroundColor: Colors.primary }]} />
              <View style={[styles.logoBar, styles.logoBarV, { backgroundColor: Colors.secondary }]} />
            </View>
          )}
        </View>

        {/* Centro */}
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textTertiary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Derecha */}
        <View style={styles.right}>
          {showThemeToggle && (
            <TouchableOpacity onPress={toggle} style={styles.themeBtn} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Text style={[styles.themeIcon, { color: colors.textSecondary }]}>
                {isDark ? '☀' : '☾'}
              </Text>
            </TouchableOpacity>
          )}
          {rightAction}
        </View>
      </View>
    </>
  );
}

const HEADER_PT = Platform.OS === 'ios' ? 56 : 48;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: HEADER_PT,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 0.5,
    gap: Spacing.sm,
  },
  left: { width: 40, justifyContent: 'center' },
  center: { flex: 1 },
  right: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  backBtn: { justifyContent: 'center' },
  backIcon: { fontSize: 28, lineHeight: 32, fontWeight: '300' },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: Typography.xs,
    marginTop: 1,
  },
  themeBtn: { justifyContent: 'center', alignItems: 'center' },
  themeIcon: { fontSize: 18 },
  // Logo MACSA simplificado (cruz)
  logoMark: {
    width: 28, height: 28,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  logoBar: {
    position: 'absolute',
    borderRadius: 2,
  },
  logoBarH: { width: 20, height: 7 },
  logoBarV: { width: 7, height: 20 },
});

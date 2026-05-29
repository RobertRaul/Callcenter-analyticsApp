import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Radius, Spacing, Shadow } from '../../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  elevation?: 'none' | 'sm' | 'md';
}

export default function Card({ children, style, noPadding, elevation = 'sm' }: CardProps) {
  const { colors, isDark } = useTheme();
  const shadow = elevation !== 'none'
    ? (isDark ? Shadow.dark : Shadow.light)[elevation]
    : {};

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
      },
      shadow,
      !noPadding && styles.padding,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    marginBottom: Spacing.md,
  },
  padding: {
    padding: Spacing.lg,
  },
});

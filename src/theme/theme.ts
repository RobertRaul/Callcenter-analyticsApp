// ─── Sistema de diseño MACSA Clínica de Salud ────────────────────────────────
// Azul:   #2196C9  (color primario del logo)
// Dorado: #C9960A  (color secundario del logo)
// Gris:   #B8B8B8  (neutro del logo)

export const Colors = {
  // Marca
  primary:       '#2196C9',
  primaryLight:  '#E8F4FB',
  primaryDark:   '#1565A0',
  secondary:     '#C9960A',
  secondaryLight:'#FDF3DC',
  secondaryDark: '#9A6F00',

  // Semánticos
  success:       '#2E7D32',
  successLight:  '#E8F5E9',
  warning:       '#C9960A',
  warningLight:  '#FDF3DC',
  error:         '#C62828',
  errorLight:    '#FFEBEE',
  info:          '#2196C9',
  infoLight:     '#E8F4FB',

  // Modo claro
  light: {
    background:    '#F5F7FA',
    surface:       '#FFFFFF',
    surfaceAlt:    '#F0F4F8',
    border:        '#E2E8F0',
    borderStrong:  '#CBD5E0',
    text:          '#1A202C',
    textSecondary: '#4A5568',
    textTertiary:  '#718096',
    textDisabled:  '#A0AEC0',
    tabBar:        '#FFFFFF',
    header:        '#FFFFFF',
    card:          '#FFFFFF',
    divider:       '#EDF2F7',
  },

  // Modo oscuro
  dark: {
    background:    '#0D1117',
    surface:       '#161B22',
    surfaceAlt:    '#1C2333',
    border:        '#30363D',
    borderStrong:  '#484F58',
    text:          '#E6EDF3',
    textSecondary: '#8B949E',
    textTertiary:  '#6E7681',
    textDisabled:  '#484F58',
    tabBar:        '#161B22',
    header:        '#161B22',
    card:          '#1C2333',
    divider:       '#21262D',
  },
};

export const Typography = {
  // Tamaños
  xs:   11,
  sm:   12,
  base: 14,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 28,

  // Pesos
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
};

export const Radius = {
  sm:  6,
  md:  8,
  lg:  12,
  xl:  16,
  full:999,
};

export const Shadow = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 3,
    },
  },
};

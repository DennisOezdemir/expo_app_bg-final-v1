const colors = {
  zinc950: '#09090b',
  zinc900: '#18181b',
  zinc800: '#27272a',
  zinc700: '#3f3f46',
  zinc600: '#52525b',
  zinc500: '#71717a',
  zinc400: '#a1a1aa',
  zinc300: '#d4d4d8',
  zinc200: '#e4e4e7',
  zinc100: '#f4f4f5',
  white: '#fafafa',

  amber500: '#f59e0b',
  amber400: '#fbbf24',
  amber600: '#d97706',

  emerald500: '#10b981',
  emerald400: '#34d399',

  rose500: '#f43f5e',
  rose400: '#fb7185',

  transparent: 'transparent',
};

export default {
  dark: {
    background: colors.zinc950,
    card: colors.zinc900,
    border: colors.zinc800,
    text: colors.white,
    textSecondary: colors.zinc400,
    textMuted: colors.zinc500,
    tint: colors.amber500,
    tabIconDefault: colors.zinc500,
    tabIconSelected: colors.amber500,
    success: colors.emerald500,
    warning: colors.amber500,
    danger: colors.rose500,
    badgeBg: colors.rose500,
  },
  raw: colors,
};

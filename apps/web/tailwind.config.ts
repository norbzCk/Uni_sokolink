export const sokolinkThemeTokens = {
  colors: {
    canvas: '#FAF8F4',
    surface: '#F3EFE6',
    card: '#FFFFFF',
    ink: '#141413',
    muted: '#5C5A54',
    subtle: '#78756E',
    forest: '#0F533E',
    'forest-dark': '#0A3D2E',
    'forest-tint': '#EAF2EE',
    accent: '#D95D24',
    'accent-dark': '#BF4E1B',
    'accent-tint': '#FDF1EB',
    border: '#E4DFD3',
    'border-strong': '#CFC8B8',
  },
  fontFamily: {
    display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
  },
} as const;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: sokolinkThemeTokens,
  },
};

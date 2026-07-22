// src/styles/colors.ts  — AIMSL Design System (Light / White theme)
export const colors = {
  brand: {
    primary:     '#3D3BF3',   // Indigo-blue  — matches LeadAI screenshot
    primaryHover:'#2D2BD8',
    primaryLight:'#EEEEFF',
    accent:      '#00C896',   // Mint green  — gradient accent
    accentLight: '#E6FAF5',
  },
  neutral: {
    900: '#0F0F1A',
    800: '#1A1A2E',
    700: '#2D2D4A',
    600: '#4A4A6A',
    500: '#6B6B8E',
    400: '#9494B8',
    300: '#C4C4DC',
    200: '#E8E8F5',
    100: '#F4F4FA',
    50:  '#FAFAFF',
    white: '#FFFFFF',
  },
  semantic: {
    success:      '#10B981',
    successLight: '#D1FAE5',
    warning:      '#F59E0B',
    warningLight: '#FEF3C7',
    error:        '#EF4444',
    errorLight:   '#FEE2E2',
    info:         '#3B82F6',
    infoLight:    '#DBEAFE',
  },
  gradients: {
    hero:   'linear-gradient(135deg, #2D2BAA 0%, #3D3BF3 40%, #00C896 100%)',
    button: 'linear-gradient(135deg, #3D3BF3 0%, #5B5BFF 100%)',
    card:   'linear-gradient(135deg, #EEEEFF 0%, #E6FAF5 100%)',
  },
} as const

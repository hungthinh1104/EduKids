/**
 * Design System Tokens
 * Semantic, production-grade design tokens for EduKids
 * 
 * Structure:
 * - Colors (psychology for children)
 * - Typography (semantic tokens)
 * - Spacing (8-point grid)
 * - Shadows (depth)
 * - Transitions (smooth motion)
 */

// ==========================================
// COLOR TOKENS (with psychology for kids)
// ==========================================

export const colors = {
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',

  // Grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Primary: Vibrant Blue (trust, calm, focused learning)
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Secondary: Warm Green (growth, achievement, positivity)
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#145231',
  },

  // Accent: Warm Orange (energy, fun, engagement)
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Interactive: Purple (creativity, imagination, joy)
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },

  // Semantic: Red (errors, caution, but warm tone)
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Semantic: Yellow (warnings, highlights, positive feedback)
  yellow: {
    50: '#FEFCE8',
    100: '#FFFACD',
    200: '#FFED4E',
    300: '#FFDB1F',
    400: '#FFC107',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Semantic: Pink (encouragement, rewards, celebration)
  pink: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F8B4D9',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },

  // Semantic: Cyan (information, clarity)
  cyan: {
    50: '#ECFDF5',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#134E4A',
    900: '#0F2F2F',
  },
};

// ==========================================
// SEMANTIC COLOR TOKENS
// ==========================================
// Use these in components instead of raw colors
// Makes design changes easier (e.g., theme switching)

export const semanticColors = {
  // Primary (main brand color)
  primary: colors.blue[600],
  primaryLight: colors.blue[100],
  primaryDark: colors.blue[800],

  // Secondary (complementary)
  secondary: colors.green[500],
  secondaryLight: colors.green[100],
  secondaryDark: colors.green[700],

  // Accent (call-to-action, highlights)
  accent: colors.orange[500],
  accentLight: colors.orange[100],
  accentDark: colors.orange[700],

  // Interactive elements
  interactive: colors.purple[500],
  interactiveLight: colors.purple[100],
  interactiveDark: colors.purple[700],

  // States
  success: colors.green[500],
  successLight: colors.green[100],
  warning: colors.yellow[500],
  warningLight: colors.yellow[100],
  error: colors.red[500],
  errorLight: colors.red[100],
  info: colors.cyan[500],
  infoLight: colors.cyan[100],

  // Backgrounds
  bgPrimary: colors.white,
  bgSecondary: colors.gray[50],
  bgTertiary: colors.gray[100],
  bgOverlay: 'rgba(0, 0, 0, 0.5)',

  // Text
  textPrimary: colors.gray[900],
  textSecondary: colors.gray[700],
  textTertiary: colors.gray[500],
  textInverse: colors.white,

  // Borders & Dividers
  borderPrimary: colors.gray[200],
  borderSecondary: colors.gray[300],

  // Disabled
  disabled: colors.gray[400],
  disabledBg: colors.gray[100],
};

// ==========================================
// TYPOGRAPHY TOKENS
// ==========================================
// Semantic typography scale (not raw px sizes)

export const typography = {
  // Display (hero, large titles)
  display: {
    fontSize: '48px',
    lineHeight: '1.2',
    letterSpacing: '0.02em',
    fontWeight: 700,
    fontFamily: 'var(--font-baloo-2)',
  },

  // Title (page titles)
  title: {
    fontSize: '32px',
    lineHeight: '1.25',
    letterSpacing: '0.01em',
    fontWeight: 700,
    fontFamily: 'var(--font-baloo-2)',
  },

  // Heading (section headings)
  heading: {
    fontSize: '24px',
    lineHeight: '1.35',
    letterSpacing: '0.01em',
    fontWeight: 600,
    fontFamily: 'var(--font-baloo-2)',
  },

  // Subheading
  subheading: {
    fontSize: '20px',
    lineHeight: '1.4',
    letterSpacing: '0em',
    fontWeight: 600,
    fontFamily: 'var(--font-baloo-2)',
  },

  // Body (default text)
  body: {
    fontSize: '16px',
    lineHeight: '1.65', // Increased for children
    letterSpacing: '0.02em',
    fontWeight: 400,
    fontFamily: 'var(--font-lexend)',
  },

  // Body Medium
  bodyMedium: {
    fontSize: '16px',
    lineHeight: '1.65',
    letterSpacing: '0.02em',
    fontWeight: 500,
    fontFamily: 'var(--font-lexend)',
  },

  // Caption (small text, hints)
  caption: {
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '0.02em',
    fontWeight: 400,
    fontFamily: 'var(--font-lexend)',
  },

  // Button
  button: {
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '0.04em', // Wide tracking for buttons
    fontWeight: 600,
    fontFamily: 'var(--font-baloo-2)',
  },

  // Input
  input: {
    fontSize: '16px',
    lineHeight: '1.5',
    letterSpacing: '0em',
    fontWeight: 400,
    fontFamily: 'var(--font-lexend)',
  },

  // Label
  label: {
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '0.02em',
    fontWeight: 500,
    fontFamily: 'var(--font-baloo-2)',
  },

  // Helper (validation, hints)
  helper: {
    fontSize: '12px',
    lineHeight: '1.5',
    letterSpacing: '0.02em',
    fontWeight: 400,
    fontFamily: 'var(--font-lexend)',
  },
};

// ==========================================
// SPACING TOKENS (8-point grid)
// ==========================================

export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '1rem',     // 16px
  md: '1.5rem',   // 24px
  lg: '2rem',     // 32px
  xl: '3rem',     // 48px
  '2xl': '4rem',  // 64px
  '3xl': '6rem',  // 96px
};

// ==========================================
// SHADOW TOKENS (depth levels)
// ==========================================

export const shadows = {
  none: 'none',

  // Subtle
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

  // Standard
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',

  // Medium
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

  // Large
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

  // Extra Large
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // Focus ring (accessibility)
  focus: '0 0 0 3px rgba(59, 130, 246, 0.1), 0 0 0 1px rgba(59, 130, 246, 1)',

  // Interactive (hover effect)
  interactive: '0 4px 12px rgba(59, 130, 246, 0.15)',
};

// ==========================================
// BORDER RADIUS TOKENS
// ==========================================

export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '6px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

// ==========================================
// TRANSITION TOKENS
// ==========================================

export const transitions = {
  // Fast (instant feedback)
  fast: {
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Base (smooth)
  base: {
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Slow (deliberate)
  slow: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Bounce (playful for kids)
  bounce: {
    duration: '300ms',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// ==========================================
// BREAKPOINTS (responsive design)
// ==========================================

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ==========================================
// Z-INDEX SCALE (stacking context)
// ==========================================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  tooltip: 60,
  notification: 70,
  alert: 80,
};

// ==========================================
// COMPOUND TOKENS (combination of tokens)
// ==========================================

export const components = {
  button: {
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.base,
    fontSize: typography.button.fontSize,
    transition: `all ${transitions.base.duration} ${transitions.base.easing}`,
  },

  input: {
    padding: `${spacing.sm} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    fontSize: typography.input.fontSize,
    border: `2px solid ${semanticColors.borderPrimary}`,
  },

  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.md,
    transition: `box-shadow ${transitions.base.duration} ${transitions.base.easing}`,
  },

  badge: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.caption.fontSize,
    fontWeight: 600,
  },
};

// ==========================================
// EXPORT AS CONSTANTS
// ==========================================

export const designTokens = {
  colors,
  semanticColors,
  typography,
  spacing,
  shadows,
  borderRadius,
  transitions,
  breakpoints,
  zIndex,
  components,
};

export default designTokens;

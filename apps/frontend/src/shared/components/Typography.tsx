import React from 'react';
import { semanticColors } from '@/shared/utils/design-tokens';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

type TextAlign = 'left' | 'center' | 'right' | 'justify';
type TextColor = keyof typeof semanticColors;
type TextSize = 'sm' | 'base' | 'lg';

// ==========================================
// They use CSS custom properties so dark mode works automatically.
// Fallback to semanticColors (static) for places where CSS vars aren't available.
const cssVarColorMap: Partial<Record<TextColor, string>> = {
  primary: 'var(--color-primary)',
  primaryLight: 'var(--color-primary-light)',
  primaryDark: 'var(--color-primary-dark)',
  secondary: 'var(--color-secondary)',
  secondaryLight: 'var(--color-secondary-light)',
  secondaryDark: 'var(--color-secondary-dark)',
  accent: 'var(--color-accent)',
  accentLight: 'var(--color-accent-light)',
  accentDark: 'var(--color-accent-dark)',
  success: 'var(--color-success)',
  successLight: 'var(--color-success-light)',
  warning: 'var(--color-warning)',
  warningLight: 'var(--color-warning-light)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  star: 'var(--color-star)',
  badge: 'var(--color-badge)',
  medal: 'var(--color-medal)',
  heading: 'var(--color-text-heading)',
  body: 'var(--color-text-body)',
  muted: 'var(--color-text-muted)',
  textInverse: 'var(--color-text-white)',
  bgPrimary: 'var(--color-bg-main)',
  bgSecondary: 'var(--color-bg-card)',
  borderPrimary: 'var(--color-border)',
  borderSecondary: 'var(--color-border-secondary)',
};

const resolveColor = (color: TextColor) => cssVarColorMap[color] ?? semanticColors[color];

interface BaseTypographyProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  align?: TextAlign;
  color?: TextColor;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  asChild?: React.ElementType;
}

// ==========================================
// DISPLAY COMPONENT
// ==========================================

export function Display({
  children,
  className = '',
  style,
  align = 'left',
  color = 'textPrimary',
  weight = 'bold',
  asChild: Component = 'h1',
}: BaseTypographyProps & { asChild?: React.ElementType }) {
  const resolvedColor = resolveColor(color);

  return (
    <Component
      className={`
        text-display
        text-${align}
        text-[${resolvedColor}]
        font-${weight}
        leading-tight
        tracking-wider
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
        textAlign: align,
      }}
    >
      {children}
    </Component>
  );
}

// ==========================================
// TITLE COMPONENT
// ==========================================

export function Title({
  children,
  className = '',
  style,
  align = 'left',
  color = 'textPrimary',
  weight = 'bold',
}: BaseTypographyProps) {
  const resolvedColor = resolveColor(color);

  return (
    <h1
      className={`
        text-4xl
        md:text-5xl
        font-heading
        font-${weight}
        leading-snug
        tracking-wider
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
        textAlign: align,
      }}
    >
      {children}
    </h1>
  );
}

// ==========================================
// HEADING COMPONENT
// ==========================================

interface HeadingProps extends BaseTypographyProps {
  level?: 2 | 3 | 4;
}

export function Heading({
  children,
  className = '',
  style,
  align = 'left',
  color = 'textPrimary',
  weight = 'semibold',
  level = 2,
}: HeadingProps) {
  const sizeClasses = {
    2: 'text-3xl md:text-4xl',
    3: 'text-2xl md:text-3xl',
    4: 'text-xl md:text-2xl',
  };

  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  const resolvedColor = resolveColor(color);

  return React.createElement(
    HeadingTag,
    {
      className: `
        ${sizeClasses[level]}
        font-heading
        font-${weight}
        leading-snug
        tracking-wide
        ${className}
      `,
      style: {
        ...style,
        color: resolvedColor as string,
        textAlign: align,
      },
    },
    children
  );
}

// ==========================================
// BODY COMPONENT
// ==========================================

interface BodyProps extends BaseTypographyProps {
  size?: TextSize;
}

export function Body({
  children,
  className = '',
  style,
  align = 'left',
  color = 'textPrimary',
  weight = 'normal',
  size = 'base',
}: BodyProps) {
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  const resolvedColor = resolveColor(color);

  return (
    <p
      className={`
        ${sizeClasses[size]}
        font-body
        font-${weight}
        leading-relaxed
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
        textAlign: align,
      }}
    >
      {children}
    </p>
  );
}

// ==========================================
// CAPTION COMPONENT
// ==========================================

interface CaptionProps extends BaseTypographyProps {
  muted?: boolean;
}

export function Caption({
  children,
  className = '',
  style,
  align = 'left',
  color = 'textTertiary',
  weight = 'normal',
  muted = false,
}: CaptionProps) {
  const resolvedColor = resolveColor(color);

  return (
    <span
      className={`
        text-sm
        font-body
        font-${weight}
        leading-snug
        ${muted ? 'opacity-75' : ''}
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
        textAlign: align,
      }}
    >
      {children}
    </span>
  );
}

// ==========================================
// LABEL COMPONENT
// ==========================================

interface LabelProps extends Omit<BaseTypographyProps, 'children'> {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}

export function Label({
  children,
  htmlFor,
  className = '',
  style,
  align = 'left',
  color = 'textPrimary',
  weight = 'medium',
  required = false,
}: LabelProps) {
  const resolvedColor = resolveColor(color);

  return (
    <label
      htmlFor={htmlFor}
      className={`
        text-sm
        font-baloo-2
        font-${weight}
        leading-snug
        tracking-wide
        block
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
        textAlign: align,
      }}
    >
      {children}
      {required && <span className="ml-1 text-error">*</span>}
    </label>
  );
}

// ==========================================
// BUTTON TEXT COMPONENT
// ==========================================

export function ButtonText({
  children,
  className = '',
  style,
  color = 'textInverse',
  weight = 'semibold',
}: Omit<BaseTypographyProps, 'align'>) {
  const resolvedColor = resolveColor(color);

  return (
    <span
      className={`
        text-sm
        font-heading
        font-${weight}
        leading-snug
        tracking-widest
        uppercase
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
      }}
    >
      {children}
    </span>
  );
}

// ==========================================
// HELPER TEXT COMPONENT
// ==========================================

interface HelperProps extends BaseTypographyProps {
  variant?: 'default' | 'error' | 'success' | 'warning' | 'info';
}

export function HelperText({
  children,
  className = '',
  style,
  variant = 'default',
}: HelperProps) {
  const colorMap: Record<string, keyof typeof semanticColors> = {
    default: 'textTertiary',
    error: 'error',
    success: 'success',
    warning: 'warning',
    info: 'info',
  };

  const resolvedColor = resolveColor(colorMap[variant]);

  return (
    <span
      className={`
        text-xs
        font-body
        leading-snug
        tracking-wide
        block
        mt-1
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
      }}
    >
      {children}
    </span>
  );
}

// ==========================================
// EMPHASIS COMPONENT
// ==========================================

interface EmphasisProps extends BaseTypographyProps {
  variant?: 'bold' | 'italic' | 'highlight' | 'code';
}

export function Emphasis({
  children,
  className = '',
  style,
  color = 'textPrimary',
  variant = 'bold',
}: EmphasisProps) {
  const tagMap = {
    bold: 'strong',
    italic: 'em',
    highlight: 'mark',
    code: 'code',
  };

  const Tag = tagMap[variant] as keyof React.JSX.IntrinsicElements;
  const resolvedColor = resolveColor(color);

  return React.createElement(
    Tag,
    {
      className: `${className}`,
      style: {
        ...style,
        color: resolvedColor as string,
      },
    },
    children
  );
}

// ==========================================
// LIST ITEM COMPONENT
// ==========================================

interface ListItemProps extends BaseTypographyProps {
  bullet?: boolean;
}

export function ListItem({
  children,
  className = '',
  style,
  color = 'textPrimary',
  bullet = true,
}: ListItemProps) {
  const resolvedColor = resolveColor(color);

  return (
    <li
      className={`
        text-base
        font-body
        leading-relaxed
        ${bullet ? 'list-disc list-inside' : ''}
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
      }}
    >
      {children}
    </li>
  );
}

// ==========================================
// TRUNCATE COMPONENT
// ==========================================

interface TruncateProps extends BaseTypographyProps {
  lines?: 1 | 2 | 3;
}

export function Truncate({
  children,
  className = '',
  style,
  color = 'textPrimary',
  lines = 1,
}: TruncateProps) {
  const lineClampClasses = {
    1: 'line-clamp-1',
    2: 'line-clamp-2',
    3: 'line-clamp-3',
  };

  const resolvedColor = resolveColor(color);

  return (
    <span
      className={`
        text-base
        font-body
        ${lineClampClasses[lines]}
        overflow-hidden
        text-ellipsis
        ${className}
      `}
      style={{
        ...style,
        color: resolvedColor as string,
      }}
    >
      {children}
    </span>
  );
}

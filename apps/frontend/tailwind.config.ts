import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', 'class'],
  theme: {
  	extend: {
  		fontSize: {
  			xs: '0.75rem',
  			sm: '0.875rem',
  			base: '1rem',
  			lg: '1.25rem',
  			xl: '1.563rem',
  			'2xl': '1.953rem',
  			'3xl': '2.441rem',
  			'4xl': '3.052rem',
  			'5xl': '3.815rem',
  			'6xl': '4.768rem'
  		},
  		lineHeight: {
  			tight: '1.2',
  			snug: '1.35',
  			normal: '1.5',
  			relaxed: '1.65',
  			loose: '1.8'
  		},
  		letterSpacing: {
  			tight: '-0.01em',
  			normal: '0',
  			wide: '0.02em',
  			wider: '0.04em',
  			widest: '0.08em'
  		},
  		fontFamily: {
  			heading: [
  				'var(--font-baloo-2)',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			],
  			body: [
  				'var(--font-lexend)',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Courier New',
  				'monospace'
  			]
  		},
  		fontWeight: {
  			normal: '400',
  			medium: '500',
  			semibold: '600',
  			bold: '700',
  			extrabold: '800'
  		},
  		colors: {
  			background: 'var(--color-bg-main)',
  			card: 'var(--color-bg-card)',
  			border: 'var(--color-border)',
  			white: '#FFFFFF',
  			black: '#000000',
  			primary: {
  				DEFAULT: 'var(--color-primary)',
  				light: 'var(--color-primary-light)',
  				dark: 'var(--color-primary-dark)'
  			},
  			secondary: {
  				DEFAULT: 'var(--color-secondary)',
  				light: 'var(--color-secondary-light)',
  				dark: 'var(--color-secondary-dark)'
  			},
  			success: {
  				DEFAULT: 'var(--color-success)',
  				light: 'var(--color-success-light)',
  				dark: 'var(--color-success-dark)'
  			},
  			accent: {
  				DEFAULT: 'var(--color-accent)',
  				light: 'var(--color-accent-light)',
  				dark: 'var(--color-accent-dark)'
  			},
  			warning: {
  				DEFAULT: 'var(--color-warning)',
  				light: 'var(--color-warning-light)'
  			},
  			error: {
  				DEFAULT: 'var(--color-error)'
  			},
  			info: {
  				DEFAULT: 'var(--color-info)'
  			},
  			star: {
  				DEFAULT: 'var(--color-star)',
  				dark: 'var(--color-star-dark)'
  			},
  			badge: 'var(--color-badge)',
  			medal: 'var(--color-medal)',
  			heading: 'var(--color-text-heading)',
  			body: 'var(--color-text-body)',
  			muted: 'var(--color-text-muted)',
  			gray: {
  				'50': '#F9FAFB',
  				'100': '#F3F4F6',
  				'200': '#E5E7EB',
  				'300': '#D1D5DB',
  				'400': '#9CA3AF',
  				'500': '#6B7280',
  				'600': '#4B5563',
  				'700': '#374151',
  				'800': '#1F2937',
  				'900': '#111827'
  			}
  		},
  		spacing: {
  			'0': '0',
  			'1': '0.25rem',
  			'2': '0.5rem',
  			'3': '0.75rem',
  			'4': '1rem',
  			'5': '1.25rem',
  			'6': '1.5rem',
  			'7': '1.75rem',
  			'8': '2rem',
  			'9': '2.25rem',
  			'10': '2.5rem',
  			'12': '3rem',
  			'14': '3.5rem',
  			'16': '4rem',
  			'20': '5rem',
  			'24': '6rem',
  			'28': '7rem',
  			'32': '8rem',
  			'36': '9rem',
  			'40': '10rem',
  			'44': '11rem',
  			'48': '12rem',
  			'52': '13rem',
  			'56': '14rem',
  			'60': '15rem',
  			'64': '16rem',
  			'72': '18rem',
  			'80': '20rem',
  			'96': '24rem',
  			'0.5': '0.125rem',
  			'1.5': '0.375rem',
  			'2.5': '0.625rem',
  			'3.5': '0.875rem'
  		},
  		borderRadius: {
  			none: '0',
  			sm: '0.125rem',
  			base: '0.375rem',
  			md: '0.5rem',
  			lg: '0.75rem',
  			xl: '1rem',
  			'2xl': '1.5rem',
  			'3xl': '2rem',
  			full: '9999px'
  		},
  		boxShadow: {
  			none: 'none',
  			xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  			sm: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
  			base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  			md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  			lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  			xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  		},
  		transitionDuration: {
  			fast: '150ms',
  			base: '200ms',
  			slow: '300ms',
  			slower: '500ms'
  		},
  		transitionTimingFunction: {
  			smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  			bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			ease: 'ease-in-out'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
};

export default config;

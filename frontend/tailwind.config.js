/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        success: '#10B981',
        danger: '#EF4444',
        primary: '#2563eb',
        'primary-dark': '#1e40af',
        'primary-light': '#60a5fa',
        secondary: '#f9fafb',
        'secondary-dark': '#d1d5db',
        neutral: '#4b5563',
        'neutral-light': '#d1d5db',
        'neutral-muted': '#9ca3af',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.2' }],
        'sm': ['0.875rem', { lineHeight: '1.3' }],
        'base': ['1rem', { lineHeight: '1.4' }],
      },
      lineHeight: {
        tighter: '1.1',
        tight: '1.2',
      },
      maxWidth: {
        'mobile': 'calc(100vw - 1rem)',
      },
      spacing: {
        '0.25': '0.0625rem',
        '0.5': '0.125rem',
        '0.75': '0.1875rem',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.1)',
        lift: '0 4px 12px rgba(0, 0, 0, 0.15)',
        glass: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fade: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        lift: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
          '100%': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        fade: 'fade 0.5s ease-in-out',
        lift: 'lift 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-out',
      },
      screens: {
        xxs: '300px',
        xs: '400px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
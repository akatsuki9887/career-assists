/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        text: 'var(--text)',
        success: '#10B981',
        danger: '#EF4444',
        primary: '#4A90E2',
        'primary-dark': '#357ABD',
        'primary-light': '#A3BFFA',
        secondary: '#F5F7FA',
        'secondary-dark': '#E2E8F0',
        neutral: '#1A202C',
        'neutral-light': '#CBD5E0',
        'neutral-muted': '#A0AEC0',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.1)',
        lift: '0 4px 12px rgba(0, 0, 0, 0.15)',
        glass: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fade: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        lift: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
          '100%': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' },
        },
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        fade: 'fade 0.5s ease-in-out',
        lift: 'lift 0.2s ease-out',
      },
      border: {
        DEFAULT: 'hsl(var(--border))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        text: 'var(--text)',
        success: '#10B981',
        danger: '#EF4444',
        primary: '#4A90E2',
        'primary-dark': '#357ABD',
        'primary-light': '#A3BFFA',
        secondary: '#F5F7FA',
        'secondary-dark': '#E2E8F0',
        neutral: '#1A202C',
        'neutral-light': '#CBD5E0',
        'neutral-muted': '#A0AEC0',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.1)',
        lift: '0 4px 12px rgba(0, 0, 0, 0.15)',
        glass: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fade: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        lift: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
          '100%': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' },
        },
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        fade: 'fade 0.5s ease-in-out',
        lift: 'lift 0.2s ease-out',
      },
      border: {
        DEFAULT: 'hsl(var(--border))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
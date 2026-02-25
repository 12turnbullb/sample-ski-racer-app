/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Team USA palette
        'usa-red': {
          DEFAULT: '#d31118',
          dark: '#7f0a0e',
          darker: '#3f0507',
          light: '#f2b8ba',
          muted: '#a6192e',
        },
        'usa-navy': {
          DEFAULT: '#171fbe',
          dark: '#050626',
          light: '#c2deff',
          medium: '#4264d0',
        },
        // Retained for backwards compatibility (used in backgrounds/cards)
        ice: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        neon: {
          cyan: '#00ffff',
          blue: '#0080ff',
          purple: '#8b5cf6',
          pink: '#ec4899',
        },
        carbon: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        'barlow': ['Barlow', 'system-ui', 'sans-serif'],
        'barlow-condensed': ['Barlow Condensed', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // Team USA primary gradient: red to navy
        'gradient-primary': 'linear-gradient(135deg, #d31118 0%, #4264d0 100%)',
        // Keep gradient-ice for any components still using it
        'gradient-ice': 'linear-gradient(135deg, #d31118 0%, #4264d0 100%)',
        'gradient-carbon': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      },
      boxShadow: {
        // Team USA glow shadows
        'usa-red': '0 0 20px rgba(211, 17, 24, 0.5)',
        'usa-navy': '0 0 20px rgba(66, 100, 208, 0.4)',
        // Keep old names mapped to new colors for backwards compat
        'neon': '0 0 20px rgba(211, 17, 24, 0.5)',
        'neon-blue': '0 0 20px rgba(66, 100, 208, 0.4)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(211, 17, 24, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(211, 17, 24, 0.6)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-up': 'slide-in-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fadeIn': 'fadeIn 0.25s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

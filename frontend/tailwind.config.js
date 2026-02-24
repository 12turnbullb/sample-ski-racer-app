/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Futuristic ski racing palette
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
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-speed': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-ice': 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #8b5cf6 100%)',
        'gradient-carbon': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(210, 100%, 50%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340, 100%, 76%, 0.3) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(22, 100%, 77%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242, 100%, 70%, 0.3) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 0.3) 0px, transparent 50%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-blue': '0 0 20px rgba(0, 128, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
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
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.6)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'speed-line': {
          '0%': { transform: 'translateX(-100%) scaleX(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%) scaleX(1)', opacity: '0' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-up': 'slide-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'speed-line': 'speed-line 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

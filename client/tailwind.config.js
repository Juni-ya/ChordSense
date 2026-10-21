/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"SF Pro"',
          'system-ui',
          '-system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          '"JetBrains Mono"',
          'monospace',
        ],
      },
      colors: {
        apple: {
          bg: '#000000',
          base: '#0b0b0c',
          card: '#1c1c1e',
          cardHover: '#242426',
          elevated: '#2c2c2e',
          tertiary: '#3a3a3c',
          border: 'rgba(255, 255, 255, 0.08)',
          divider: 'rgba(255, 255, 255, 0.06)',
          accent: '#10b981',
          accentDim: 'rgba(16, 185, 129, 0.15)',
          label: '#f5f5f7',
          secondary: '#86868b',
          tertiaryLabel: '#6e6e73',
          quaternary: '#48484a',
        },
      },
      boxShadow: {
        'liquid': '0 8px 32px 0 rgba(0, 0, 0, 0.36), inset 0 0.5px 0 0 rgba(255, 255, 255, 0.15)',
        'liquid-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.28), inset 0 0.5px 0 0 rgba(255, 255, 255, 0.12)',
        'apple-card': '0 2px 8px 0 rgba(0, 0, 0, 0.2), inset 0 0.5px 0 0 rgba(255, 255, 255, 0.08)',
        'apple-focus': '0 0 0 3px rgba(16, 185, 129, 0.35)',
      },
      borderRadius: {
        'apple': '14px',
        'apple-lg': '18px',
        'apple-xl': '22px',
      },
    },
  },
  plugins: [],
};

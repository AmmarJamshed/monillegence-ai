/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pakistan: {
          green: '#01411C',
          white: '#FFFFFF',
          accent: '#059669',
        },
        monil: {
          bg: '#0f1419',
          surface: '#1a2332',
          border: '#2d3a4f',
          primary: '#10b981',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Noto Nastaliq Urdu', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pakistan: { green: '#01411C', accent: '#059669' },
        monil: {
          bg: '#070b10',
          surface: '#111827',
          card: '#1a2332',
          border: '#2d3a4f',
          primary: '#10b981',
          glow: '#34d399',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Noto Nastaliq Urdu', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        hero: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(16,185,129,0.25), transparent)',
      },
    },
  },
  plugins: [],
};

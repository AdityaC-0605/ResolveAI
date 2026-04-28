/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void:    '#04060f',
        mint:    { DEFAULT: '#00f0b5', dim: '#00c492', glow: 'rgba(0,240,181,0.15)' },
        coral:   { DEFAULT: '#ff2d6b', dim: '#cc2356', glow: 'rgba(255,45,107,0.15)' },
        violet:  { deep: '#4c1d95', DEFAULT: '#7c3aed', bright: '#a78bfa', glow: 'rgba(124,58,237,0.15)' },
        slate:   {
          950: '#04060f', 900: '#080d1e', 850: '#0d1428',
          800: '#111827', 700: '#1e2940', 600: '#2d3a56',
          500: '#4a5568', 400: '#718096', 300: '#a0aec0',
          200: '#cbd5e0', 100: '#e2e8f0',
        },
      },
      backgroundImage: {
        'grid-void': `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glow-mint':   '0 0 30px rgba(0,240,181,0.2), 0 0 60px rgba(0,240,181,0.05)',
        'glow-coral':  '0 0 30px rgba(255,45,107,0.2), 0 0 60px rgba(255,45,107,0.05)',
        'glow-violet': '0 0 30px rgba(124,58,237,0.2), 0 0 60px rgba(124,58,237,0.05)',
        'panel':       '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)',
        'panel-hover': '0 0 0 1px rgba(0,240,181,0.15), 0 8px 32px rgba(0,0,0,0.6)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-slow':  'pulse 4s ease-in-out infinite',
        'scan':        'scan 3s linear infinite',
        'border-flow': 'borderFlow 3s linear infinite',
        'flicker':     'flicker 0.3s ease-in-out',
        'data-scroll': 'dataScroll 20s linear infinite',
      },
      keyframes: {
        float:       { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        scan:        { '0%': { top: '0%' }, '100%': { top: '100%' } },
        borderFlow:  { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        flicker:     { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        dataScroll:  { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-50%)' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono:    ['"IBM Plex Mono"', 'monospace'],
        sans:    ['"IBM Plex Sans"', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
      },
      colors: {
        ink:    '#07080d',
        panel:  '#0d0f18',
        edge:   '#161925',
        border: '#1e2334',
        muted:  '#2a3044',
        dim:    '#4a566e',
        ghost:  '#8494a8',
        silver: '#c4cfde',
        snow:   '#edf2f7',
        acid:   { DEFAULT: '#d4f43c', dim: '#a8c230', glow: 'rgba(212,244,60,0.12)' },
        cyan:   { DEFAULT: '#2ee8d4', dim: '#1db8a8', glow: 'rgba(46,232,212,0.1)' },
        amber:  { DEFAULT: '#f5a623', dim: '#c47d0e', glow: 'rgba(245,166,35,0.1)' },
        coral:  { DEFAULT: '#ff4d6a', dim: '#cc3d55', glow: 'rgba(255,77,106,0.1)' },
        violet: { DEFAULT: '#9b6fff', dim: '#7a55d4', glow: 'rgba(155,111,255,0.1)' },
      },
      keyframes: {
        scan:     { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        blink:    { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
        marquee:  { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeUp:   { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        glitch:   { '0%,100%': { clipPath: 'inset(0 0 100% 0)' }, '25%': { clipPath: 'inset(10% 0 80% 0)' }, '50%': { clipPath: 'inset(50% 0 30% 0)' }, '75%': { clipPath: 'inset(80% 0 5% 0)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        scan:    'scan 8s linear infinite',
        blink:   'blink 1s step-end infinite',
        marquee: 'marquee 30s linear infinite',
        fadeUp:  'fadeUp 0.4s ease forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
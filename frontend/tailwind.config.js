/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        carbon:   '#0A0A0B',
        graphite: '#121214',
        ash:      '#1E1E20',
        dust:     '#2E2E32',
        
        quartz:   '#F4F4F5',
        slate:    '#A1A1AA',
        flint:    '#71717A',
        
        critical: { DEFAULT: '#E11D48', dim: 'rgba(225,29,72,0.1)' },
        high:     { DEFAULT: '#D97706', dim: 'rgba(217,119,6,0.1)' },
        medium:   { DEFAULT: '#CA8A04', dim: 'rgba(202,138,4,0.1)' },
        low:      { DEFAULT: '#475569', dim: 'rgba(71,85,105,0.1)' },
        success:  { DEFAULT: '#059669', dim: 'rgba(5,150,105,0.1)' },
        
        brand:    { DEFAULT: '#FAFAFA', dim: '#D4D4D8' },
        accent:   { DEFAULT: '#4F46E5', dim: 'rgba(79,70,229,0.1)' },
      },
      animation: {
        fadeUp:  'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
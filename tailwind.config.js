/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#FBFBFA',
          dark: '#0F1012',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#16171A',
          subtle: '#F7F6F3',
          'subtle-dark': '#1C1E22',
        },
        border: {
          light: '#EAEAEA',
          dark: '#26282E',
        },
        ink: {
          DEFAULT: '#111111',
          muted: '#787774',
          faint: '#A1A09E',
        },
        pastel: {
          red: '#FDEBEC',
          'red-ink': '#9F2F2D',
          blue: '#E1F3FE',
          'blue-ink': '#1F6C9F',
          green: '#EDF3EC',
          'green-ink': '#346538',
          yellow: '#FBF3DB',
          'yellow-ink': '#956400',
        },
        brand: {
          50: '#F4F4F5',
          100: '#E4E4E7',
          200: '#D4D4D8',
          300: '#A1A1AA',
          400: '#71717A',
          500: '#3F3F46',
          600: '#18181B',
          700: '#09090B',
          800: '#09090B',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'ui-monospace', 'monospace'],
        display: ['Geist', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'lift': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'crisp': '8px',
        'bento': '12px',
      }
    },
  },
  plugins: [],
}

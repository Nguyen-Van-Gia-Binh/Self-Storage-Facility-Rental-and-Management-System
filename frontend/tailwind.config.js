/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f9f7',
          100: '#e1f2ed',
          200: '#c5e6dc',
          300: '#9ed4c4',
          400: '#75beaa',
          500: '#57b29a', // Primary Mint Teal
          600: '#439782',
          700: '#367969',
          800: '#2c6155',
          900: '#255047',
          950: '#0a1614', // Deep Pine Obsidian
        },
        pine: {
          DEFAULT: '#0a1614',
          900: '#0a1614',
          800: '#132522',
          700: '#1d3632',
        },
        mist: '#f2f9f7',
        sky: {
          soft: '#96b3cf',
        },
        denim: {
          DEFAULT: '#7c94c3',
        },
        unit: {
          available: {
            bg: '#ecfdf5',
            text: '#047857',
            border: '#a7f3d0',
          },
          reserved: {
            bg: '#f0f9ff',
            text: '#0369a1',
            border: '#bae6fd',
          },
          occupied: {
            bg: '#f8fafc',
            text: '#334155',
            border: '#cbd5e1',
          },
          maintenance: {
            bg: '#fffbeb',
            text: '#b45309',
            border: '#fde68a',
          },
          overdue: {
            bg: '#fef2f2',
            text: '#b91c1c',
            border: '#fecaca',
          },
          locked: {
            bg: '#fff1f2',
            text: '#be123c',
            border: '#fecdd3',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

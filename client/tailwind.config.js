/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#faf8f4',
          100: '#f0ece5',
          200: '#ded8ce',
          300: '#c8bfb2',
          400: '#877e74',
          500: '#70675d',
          600: '#5e554b',
          700: '#453e35',
          800: '#302b25',
          900: '#090907',
          950: '#090907',
        },
        brand: {
          50: '#f7f1e8',
          100: '#eee5d8',
          200: '#ddcbb5',
          300: '#cbb395',
          400: '#b89973',
          500: '#96764e',
          600: '#6c5636',
          700: '#59462c',
          800: '#453622',
          900: '#32281a',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
    },
  },
  plugins: [],
};

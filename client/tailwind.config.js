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
          900: '#24221e',
          950: '#171612',
        },
        brand: {
          50: '#fff4eb',
          100: '#ffe6cf',
          200: '#ffcca3',
          300: '#ffa767',
          400: '#f88339',
          500: '#ed6425',
          600: '#ba4214',
          700: '#97330f',
          800: '#7a2c14',
          900: '#622714',
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

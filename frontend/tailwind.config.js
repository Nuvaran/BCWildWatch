/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BC WildWatch Brand Colors
        primary: {
          50: '#fce7f0',
          100: '#f8c5d9',
          200: '#f39fc0',
          300: '#ee79a7',
          400: '#e95d94',
          500: '#b53867',
          600: '#a23259',
          700: '#8f2c4b',
          800: '#7c263d',
          900: '#69202f',
        },
        accent: {
          teal: '#4dd0e1',
          green: '#4caf50',
          yellow: '#ffa726',
          orange: '#ff9800',
          red: '#f44336',
          purple: '#9c27b0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
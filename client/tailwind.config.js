/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B3055',
          hover: '#243D6A',
          light: '#EEF2F8',
        },
        grey: {
          50: '#F7F9FC',
          100: '#EEF2F8',
          200: '#DDE3EE',
          400: '#8896A7',
          500: '#4A5568',
          700: '#374151',
          900: '#0D1B2E',
        },
        success: '#0F9E6E',
        warning: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

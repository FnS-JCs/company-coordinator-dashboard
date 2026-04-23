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
        navy: '#1B3055',
        'navy-light': '#2A456F',
        grey: {
          50: '#F5F5F7',
          200: '#E5E5EA',
          500: '#6B7280',
          900: '#1F2937',
        }
      }
    },
  },
  plugins: [],
}

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
        primary: {
          DEFAULT: '#111827',
          light: '#1F2937',
          dark: '#030712',
        },
        accent: {
          DEFAULT: '#FBBF24',
          light: '#FCD34D',
          dark: '#D97706',
        },
        bg: '#F8FAFC',
        surface: '#FFFFFF',
      },
      borderRadius: {
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.01)',
        'premium': '0 20px 40px -15px rgba(17, 24, 39, 0.05), 0 1px 3px rgba(17, 24, 39, 0.01)',
        'glass': '0 8px 32px 0 rgba(17, 24, 39, 0.04)',
      },
    },
  },
  plugins: [],
}

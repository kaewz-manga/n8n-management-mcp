/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        n2f: {
          bg: '#050508',
          card: '#0a0b0e',
          elevated: '#12141a',
        },
        'n2f-accent': {
          DEFAULT: '#fbbf24',
          light: '#fcd34d',
          dark: '#f59e0b',
          hover: '#d97706',
        },
        'n2f-text': {
          DEFAULT: '#f9fafb',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
        'n2f-border': {
          DEFAULT: '#1f2937',
          hover: '#374151',
        },
      },
    },
  },
  plugins: [],
}

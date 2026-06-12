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
        primary: {
          DEFAULT: '#1A2B4A',
          light: '#2D4172',
        },
        accent: {
          DEFAULT: '#E07B39',
          soft: '#F5E6D8',
        },
        surface: {
          DEFAULT: '#FAFAF8',
          card: '#FFFFFF',
        },
        customBorder: '#E4E2DC',
        text: {
          primary: '#1C1C1C',
          secondary: '#5C5C5C',
          muted: '#9A9A9A',
        },
        success: '#2E7D32',
        warning: '#B45309',
        danger: '#C0392B',
        info: '#1565C0',
      },
      fontFamily: {
        serif: ["'Playfair Display'", 'serif'],
        sans: ["'Inter'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.06)',
        sm: '0 2px 6px rgba(0,0,0,0.08)',
        md: '0 4px 16px rgba(0,0,0,0.10)',
        lg: '0 8px 32px rgba(0,0,0,0.12)',
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
        '64': '64px',
        '80': '80px',
      }
    },
  },
  plugins: [],
}

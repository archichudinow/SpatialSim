/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          primary: '#333333',
          secondary: '#1e1e1e',
          tertiary: '#2a2a2a',
          overlay: 'rgba(30, 30, 30, 0.95)',
          hover: 'rgba(255, 255, 255, 0.1)',
          active: 'rgba(100, 200, 255, 0.4)',
        },
        // Border colors
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.2)',
          active: '#64c8ff',
          light: 'rgba(255, 255, 255, 0.1)',
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#aaaaaa',
          muted: '#666666',
          accent: '#64c8ff',
          warning: '#ffa864',
        },
        // Accent colors
        accent: {
          blue: '#64c8ff',
          orange: '#ffa864',
          green: '#64ff96',
          red: '#ff6464',
        },
      },
      fontFamily: {
        mono: ['monospace'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xxs': '9px',
        'xs': '10px',
        'sm': '11px',
        'base': '12px',
        'lg': '13px',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
      },
      spacing: {
        'panel': '12px',
        'section': '10px',
        'item': '8px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0a',
          dark: '#121212',
          gray: '#1e1e1e',
          accent: '#2d2d2d',
          text: '#e0e0e0',
        },
        neon: {
          green: '#00ff41',
          cyan: '#00f3ff',
          pink: '#ff00ff',
          red: '#ff2a2a',
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'], // Suggest installing Fira Code or similar if possible
      }
    },
  },
  plugins: [],
}

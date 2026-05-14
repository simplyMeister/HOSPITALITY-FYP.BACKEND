/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Benedict Theme Colors
        "ben-bg": "#f7f3ec",
        "ben-grid": "#d6cfc4",
        "ben-text": "var(--text)",
        "ben-muted": "var(--muted)",
        "ben-border": "var(--border)",
        "ben-accent": "var(--accent)",
        
        // Existing roles/actions maintained for functionality
        "primary": "#1a1a1a", // Deep accent
        "primary-fixed": "#22c55e", // Using green for actions like in the reference
        "surface": "var(--bg)",
      },
      fontFamily: {
        "serif": ["Instrument Serif", "serif"],
        "sans": ["Inter", "sans-serif"],
        "headline": ["Instrument Serif", "serif"],
        "body": ["Inter", "sans-serif"],
      },
      animation: {
        "aurora": "auroraWave 12s ease-in-out infinite alternate",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        auroraWave: {
          "0%": { transform: "scale(1) translate(0) rotate(0)" },
          "33%": { transform: "scale(1.15) translate(3%, -3%) rotate(4deg)" },
          "66%": { transform: "scale(0.9) translate(-3%, 3%) rotate(-3deg)" },
          "100%": { transform: "scale(1.1) translate(2%, 2%) rotate(2deg)" },
        }
      }
    },
  },
  plugins: [],
}

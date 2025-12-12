/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}"
  ],
  presets: [require('../../packages/shared/tailwind.preset.js')],
  theme: {
    extend: {
      // Any dashboard-specific overrides can go here, 
      // otherwise it inherits from the shared preset.
    },
  },
  plugins: [],
}

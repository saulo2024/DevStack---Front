/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- ESSA LINHA É OBRIGATÓRIA!
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')


module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['"Ubuntu Mono"', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};

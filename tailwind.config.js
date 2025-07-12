/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#235B4E',
        secondary: '#9F2241',
        accent: '#BC955C',
        neutral: '#6F7271',
        'primary-light': '#2D7563',
        'secondary-light': '#B83058',
        'accent-light': '#D4A96A',
      },
      fontFamily: {
        'sans': ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  // FIX: Provide the paths to all your component and page files.
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}', 
  ],
  theme: {
    extend: {
      // ... your theme content
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}
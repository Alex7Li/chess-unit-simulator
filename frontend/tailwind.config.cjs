/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'grid_light': '#D1D1D1',
        'grid_dark': '#F4F4F4',
      },
      gridTemplateRows: {
        '15': 'repeat(15, minmax(0, 1fr))'
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))'
      },
      spacing: {
        '60': '15rem',
        '75': '18.75rem',
      }
    },
  },
  plugins: [require('flowbite/plugin')],
}


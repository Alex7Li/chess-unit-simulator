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
        '17': 'repeat(17, minmax(0, 1fr))'
      },
      gridTemplateColumns: {
        '17': 'repeat(17, minmax(0, 1fr))'
      },
      spacing: {
        '68': '17rem',
        '85': '21.25rem',
      }
    },
  },
  plugins: [require('flowbite/plugin')],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'ubuntu': ['Ubuntu', 'sans-serif'],
      },
      colors: {
        ubuntu: {
          orange: '#E95420',
          purple: '#772953',
          aubergine: '#77216F',
          warmgrey: '#AEA79F',
          coolgrey: '#333333',
          textgrey: '#111111',
        }
      },
      backgroundImage: {
        'ubuntu-gradient': 'linear-gradient(135deg, #77216F 0%, #E95420 100%)',
        'ubuntu-desktop': 'linear-gradient(135deg, #4A148C 0%, #7B1FA2 50%, #E65100 100%)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

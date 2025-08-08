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
        },
        theme: {
          'bg-primary': 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-tertiary': 'var(--bg-tertiary)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
          'border': 'var(--border-color)',
          'accent': 'var(--accent-color)',
          'glass-bg': 'var(--glass-bg)',
          'glass-border': 'var(--glass-border)',
        }
      },
      backgroundImage: {
        'ubuntu-gradient': 'linear-gradient(135deg, #77216F 0%, #E95420 100%)',
        'ubuntu-desktop': 'linear-gradient(135deg, #4A148C 0%, #7B1FA2 50%, #E65100 100%)',
        'gradient-radial': 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

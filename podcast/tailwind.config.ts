import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#141410',
          surface: '#1a1a15',
          border: '#242420',
          amber: '#EF9F27',
          amberDark: '#BA7517',
          amberDeep: '#1e1808',
          green: '#97C459',
          greenDeep: '#1a2010',
          greenBorder: '#3B6D11',
          heading: '#F0E6C8',
          body: '#a89878',
          muted: '#555555',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config

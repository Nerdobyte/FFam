import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        pitch: {
          600: '#16a34a',
          800: '#166534',
          950: '#052e16',
        },
        gold: {
          400: '#facc15',
          500: '#eab308',
        },
      },
      backgroundImage: {
        'pitch-gradient':
          'radial-gradient(ellipse at top, #166534 0%, #052e16 55%, #020617 100%)',
      },
    },
  },
  plugins: [],
};

export default config;

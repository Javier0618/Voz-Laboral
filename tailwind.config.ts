import type { Config } from 'tailwindcss';

// Los colores leen los tokens CSS definidos en :root (src/styles/index.css),
// así la marca se cambia en un solo sitio.
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: token('ink'),
        navy: token('navy'),
        action: token('action'),
        'action-tint': token('action-tint'),
        paper: token('paper'),
        mist: token('mist'),
        line: token('line'),
        muted: token('muted'),
        warning: token('warning'),
        danger: token('danger'),
      },
      fontFamily: {
        serif: ['"Newsreader Variable"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans Variable"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
} satisfies Config;

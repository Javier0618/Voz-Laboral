/** Los colores salen de variables CSS definidas en src/index.css (:root),
 *  así la identidad visual se cambia en un solo lugar. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        navy: 'rgb(var(--navy) / <alpha-value>)',
        teal: { DEFAULT: 'rgb(var(--teal) / <alpha-value>)', strong: 'rgb(var(--teal-strong) / <alpha-value>)', tint: 'rgb(var(--teal-tint) / <alpha-value>)' },
        paper: 'rgb(var(--paper) / <alpha-value>)',
        mist: 'rgb(var(--mist) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        slate: 'rgb(var(--slate) / <alpha-value>)',
        amber: { DEFAULT: 'rgb(var(--amber) / <alpha-value>)', tint: 'rgb(var(--amber-tint) / <alpha-value>)' },
        danger: { DEFAULT: 'rgb(var(--danger) / <alpha-value>)', tint: 'rgb(var(--danger-tint) / <alpha-value>)' },
      },
      fontFamily: {
        serif: ['"Newsreader Variable"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans Variable"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Escala de tercera mayor (1.25) sobre 16 px.
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.9375rem', { lineHeight: '1.5rem' }],
        base: ['1.0625rem', { lineHeight: '1.75rem' }],
        lg: ['1.25rem', { lineHeight: '1.875rem' }],
        xl: ['1.5625rem', { lineHeight: '2.125rem' }],
        '2xl': ['1.9375rem', { lineHeight: '2.5rem' }],
        '3xl': ['2.4375rem', { lineHeight: '2.875rem' }],
        '4xl': ['3.0625rem', { lineHeight: '3.375rem' }],
        '5xl': ['3.8125rem', { lineHeight: '4.0625rem' }],
      },
      maxWidth: { prose: '68ch' },
      borderRadius: { DEFAULT: '6px', lg: '10px' },
    },
  },
  plugins: [],
};

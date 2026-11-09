/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Rubik', 'system-ui', 'sans-serif'] },
      colors: {
        bg: v('bg'),
        card: v('card'),
        sunk: v('sunk'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        brand: v('brand'),
        brandink: v('brandink'),
        danger: v('danger'),
        ok: v('ok'),
        warn: v('warn'),
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06)',
        lift: '0 8px 30px rgb(0 0 0 / 0.12)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};

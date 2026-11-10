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
        brandsoft: v('brandsoft'),
        brandink: v('brandink'),
        accent: v('accent'),
        danger: v('danger'),
        ok: v('ok'),
        warn: v('warn'),
        pee: v('pee'),
        poop: v('poop'),
        feed: v('feed'),
        sleep: v('sleep'),
        note: v('note'),
        photo: v('photo'),
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / 0.05), 0 6px 20px -6px rgb(var(--shadow) / 0.10)',
        lift: '0 2px 6px rgb(var(--shadow) / 0.06), 0 18px 44px -10px rgb(var(--shadow) / 0.25)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};

export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'daycare.theme';
const BG = { light: '#FCF7F2', dark: '#171312' };
const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function resolved(p: ThemePref): 'light' | 'dark' {
  return p === 'system' ? (mq?.matches ? 'dark' : 'light') : p;
}

export function applyTheme(p: ThemePref = getThemePref()) {
  const root = document.documentElement;
  if (p === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', p);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[resolved(p)]);
}

export function setThemePref(p: ThemePref) {
  try {
    if (p === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, p);
  } catch {
    /* ignore */
  }
  applyTheme(p);
}

mq?.addEventListener?.('change', () => applyTheme());

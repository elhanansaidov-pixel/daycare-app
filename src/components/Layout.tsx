import { NavLink, Outlet } from 'react-router-dom';
import { useData } from '../hooks/useData';

const TABS = [
  { to: '/', icon: '🏠', label: 'היום', end: true },
  { to: '/attendance', icon: '🗓️', label: 'נוכחות' },
  { to: '/gallery', icon: '🖼️', label: 'תמונות' },
  { to: '/summary', icon: '💬', label: 'סיכום להורים' },
  { to: '/settings', icon: '⚙️', label: 'הגדרות' },
];

export default function Layout() {
  const { error, store } = useData();
  return (
    <div className="min-h-screen pb-24">
      {error && <div className="bg-danger text-white text-center text-sm p-2">שגיאת חיבור: {error}</div>}
      {store.mode === 'local' && (
        <div className="bg-warn/15 text-ink text-center text-xs py-1.5 px-3">מצב מקומי: הנתונים נשמרים רק במכשיר הזה</div>
      )}
      <Outlet />
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-line safe-bottom">
        <ul className="grid grid-cols-5 max-w-3xl mx-auto">
          {TABS.map((t) => (
            <li key={t.to}>
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 pt-2 pb-1 min-h-[56px] text-[11px] font-medium ${isActive ? 'text-brand' : 'text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-xl leading-none transition ${isActive ? 'scale-110' : 'grayscale-[.4] opacity-80'}`}>{t.icon}</span>
                    <span>{t.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="px-4 pt-6 pb-3 max-w-6xl mx-auto flex items-end justify-between gap-3">
      <div className="min-w-0">
        {sub && <p className="text-muted text-sm">{sub}</p>}
        <h1 className="text-[28px] font-extrabold leading-tight">{title}</h1>
      </div>
      {children}
    </header>
  );
}

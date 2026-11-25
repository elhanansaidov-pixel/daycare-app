import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarCheck, House, Images, MessageCircleHeart, Settings, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useData } from '../hooks/useData';
import { track } from '../lib/assistant/usage';
import Assistant from './assistant/Assistant';
import { exitDemo, isDemo, resetDemo } from '../lib/demo';

const TABS: { to: string; icon: LucideIcon; label: string; end?: boolean }[] = [
  { to: '/', icon: House, label: 'היום', end: true },
  { to: '/attendance', icon: CalendarCheck, label: 'נוכחות' },
  { to: '/gallery', icon: Images, label: 'תמונות' },
  { to: '/summary', icon: MessageCircleHeart, label: 'סיכום' },
  { to: '/settings', icon: Settings, label: 'הגדרות' },
];

export default function Layout() {
  const { error, store } = useData();
  const loc = useLocation();
  useEffect(() => {
    track('screen', loc.pathname.startsWith('/child/') ? '/child' : loc.pathname);
  }, [loc.pathname]);
  return (
    <div className="min-h-screen pb-28">
      {error && (
        <div className="bg-danger text-white text-center text-sm p-2 flex items-center justify-center gap-2">
          <TriangleAlert size={16} /> שגיאת חיבור: {error}
        </div>
      )}
      {isDemo && (
        <div className="bg-sleep/20 text-ink text-center text-xs py-1.5 px-3 flex items-center justify-center gap-2 flex-wrap" data-testid="demo-banner">
          <span className="font-semibold">🧪 מצב דמו: הכול כאן לניסיון, ולא משפיע על היומן האמיתי</span>
          <button className="underline underline-offset-2 font-semibold" onClick={() => confirm('להתחיל את הדמו מחדש? כל מה שנרשם בדמו יימחק.') && resetDemo()}>
            איפוס
          </button>
          <button className="underline underline-offset-2 font-semibold" onClick={exitDemo}>
            יציאה
          </button>
        </div>
      )}
      {store.mode === 'local' && !isDemo && (
        <div className="bg-warn/15 text-ink text-center text-xs py-1.5 px-3">מצב מקומי: הנתונים נשמרים רק במכשיר הזה</div>
      )}
      <div key={loc.pathname} className="anim-rise">
        <Outlet />
      </div>
      <Assistant />
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-xl border-t border-line/80 safe-bottom">
        <ul className="grid grid-cols-5 max-w-3xl mx-auto px-1">
          {TABS.map(({ to, icon: I, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                data-help={`nav-${to.slice(1) || 'home'}`}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 pt-2 pb-1 min-h-[60px] text-[11px] font-semibold transition-colors ${isActive ? 'text-brand' : 'text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid place-items-center h-8 w-14 rounded-full transition-all duration-200 ${isActive ? 'bg-brandsoft' : ''}`}>
                      <I size={22} strokeWidth={isActive ? 2.4 : 1.9} />
                    </span>
                    <span>{label}</span>
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

export function PageHeader({ title, sub, icon, children }: { title: React.ReactNode; sub?: React.ReactNode; icon?: LucideIcon; children?: React.ReactNode }) {
  const I = icon;
  return (
    <header className="px-4 pt-7 pb-4 max-w-6xl mx-auto flex items-end justify-between gap-3">
      <div className="min-w-0 flex items-center gap-3">
        {I && (
          <span className="grid place-items-center h-11 w-11 rounded-2xl bg-brandsoft text-brand shrink-0">
            <I size={22} />
          </span>
        )}
        <div className="min-w-0">
          {sub && <p className="text-muted text-sm font-medium">{sub}</p>}
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">{title}</h1>
        </div>
      </div>
      {children}
    </header>
  );
}

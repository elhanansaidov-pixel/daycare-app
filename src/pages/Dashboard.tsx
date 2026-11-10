import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useData } from '../hooks/useData';
import { useOverdue } from '../hooks/useAlerts';
import { useActions } from '../hooks/useActions';
import ChildCard from '../components/ChildCard';
import EventSheet from '../components/EventSheet';
import PhotoSheet from '../components/PhotoSheet';
import Timeline from '../components/Timeline';
import Avatar from '../components/Avatar';
import { Wordmark } from '../components/Logo';
import { Bubble } from '../components/Icon';
import { APP_NAME } from '../lib/brand';
import { AlarmClock, Baby, Columns3, LayoutGrid, ListChecks } from 'lucide-react';
import type { Child, EventType } from '../lib/types';
import { presence, type IconKey } from '../lib/util';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

export default function Dashboard() {
  const { children, today, todayPhotos, settings, loading } = useData();
  const overdue = useOverdue();
  const act = useActions();
  const [view, setView] = useState<'cards' | 'columns'>(() => (localStorage.getItem('daycare.view') as 'cards') || 'cards');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [sheet, setSheet] = useState<{ type: EventType; kids: Child[] } | null>(null);
  const [photoFor, setPhotoFor] = useState<string[] | null>(null);

  const byChild = useMemo(() => {
    const m = new Map<string, typeof today>();
    for (const e of today) m.set(e.child_id, [...(m.get(e.child_id) ?? []), e]);
    return m;
  }, [today]);
  const presentCount = children.filter((c) => presence(byChild.get(c.id) ?? []) === 'in').length;
  const overdueBy = (id: string) => new Set(overdue.filter((o) => o.child.id === id).map((o) => o.kind));
  const selKids = children.filter((c) => selected.includes(c.id));

  const setViewP = (v: 'cards' | 'columns') => {
    setView(v);
    localStorage.setItem('daycare.view', v);
  };
  const exitSelect = () => {
    setSelectMode(false);
    setSelected([]);
  };

  return (
    <>
      <header className="max-w-6xl mx-auto px-4 pt-5 pb-4">
        <Wordmark name={APP_NAME} size={34} />
        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted text-sm font-medium">{format(new Date(), 'EEEE, d בMMMM', { locale: he })}</p>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">
              {greeting()}
              {settings.caregiver_name ? `, ${settings.caregiver_name}` : ''}
            </h1>
          </div>
          <PresenceRing n={presentCount} total={children.length} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 space-y-3">
        {overdue.length > 0 && (
          <div className="rounded-3xl bg-danger/10 border border-danger/20 p-3 space-y-1 anim-pop">
            {overdue.map((o) => (
              <p key={o.child.id + o.kind} className="text-danger font-medium text-sm flex items-center gap-2">
                <AlarmClock size={16} className="shrink-0" />
                {o.text}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="segmented">
            {(['cards', 'columns'] as const).map((v) => (
              <button key={v} className={`segmented-item !h-9 ${view === v ? 'on' : ''}`} onClick={() => setViewP(v)}>
                {v === 'cards' ? <LayoutGrid size={16} /> : <Columns3 size={16} />}
                {v === 'cards' ? 'כרטיסים' : 'עמודות'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            className={`chip ${selectMode ? 'chip-on' : ''}`}
            onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
          >
            {selectMode ? 'סיום בחירה' : <><ListChecks size={16} /> כמה ילדים יחד</>}
          </button>
        </div>

        {!loading && children.length === 0 && (
          <div className="card p-8 text-center">
            <span className="inline-grid place-items-center h-16 w-16 rounded-full bg-brandsoft text-brand mb-3"><Baby size={30} /></span>
            <p className="font-semibold mb-4">עוד אין ילדים במשפחתון</p>
            <Link to="/settings" className="btn-primary">
              הוספת ילד
            </Link>
          </div>
        )}

        {view === 'cards' || selectMode ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((c, i) => (
              <ChildCard
                index={i}
                key={c.id}
                child={c}
                events={byChild.get(c.id) ?? []}
                overdue={overdueBy(c.id)}
                selectMode={selectMode}
                selected={selected.includes(c.id)}
                onSelect={() => setSelected((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                onFeed={() => setSheet({ type: 'feed', kids: [c] })}
                onPhoto={() => setPhotoFor([c.id])}
              />
            ))}
          </div>
        ) : (
          <div className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
            {children.map((c) => (
              <section key={c.id} className="card overflow-hidden snap-start shrink-0 w-[82vw] sm:w-72 flex flex-col max-h-[calc(100vh-15rem)]">
                <Link to={`/child/${c.id}`} className="flex items-center gap-2 p-3 border-b border-line" style={{ background: `linear-gradient(to bottom, ${c.color}2E, transparent)` }}>
                  <Avatar child={c} size={40} />
                  <h3 className="font-bold text-lg flex-1">{c.name}</h3>
                  <span className={presence(byChild.get(c.id) ?? []) === 'in' ? 'badge-ok' : 'badge-muted'}>
                    {presence(byChild.get(c.id) ?? []) === 'in' ? (c.gender === 'girl' ? 'נמצאת' : 'נמצא') : 'לא כאן'}
                  </span>
                </Link>
                <div className="grid grid-cols-4 gap-1 p-2">
                  {(
                    [
                      ['pee', () => act.diaper([c], 'pee')],
                      ['poop', () => act.diaper([c], 'poop')],
                      ['bottle', () => setSheet({ type: 'feed', kids: [c] })],
                      ['sleep', () => act.sleep([c])],
                    ] as [IconKey, () => void][]
                  ).map(([k, fn]) => (
                    <button key={k} className="tile !min-h-[44px]" onClick={fn}>
                      <Bubble k={k} size={32} />
                    </button>
                  ))}
                </div>
                <div className="overflow-y-auto px-2 pb-2 flex-1">
                  <Timeline child={c} events={byChild.get(c.id) ?? []} photos={todayPhotos} compact />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {selectMode && (
        <div className="fixed inset-x-0 bottom-[72px] z-40 px-3 anim-up">
          <div className="max-w-3xl mx-auto card shadow-lift p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">
                נבחרו {selected.length} {selected.length === 1 ? 'ילד' : 'ילדים'}
              </p>
              <button className="text-sm text-brand font-semibold" onClick={() => setSelected(selected.length === children.length ? [] : children.map((c) => c.id))}>
                {selected.length === children.length ? 'נקה הכל' : 'בחר הכל'}
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {(
                [
                  ['arrive', 'הגעה', () => act.attendance(selKids, 'arrive')],
                  ['leave', 'איסוף', () => act.attendance(selKids, 'leave')],
                  ['pee', 'פיפי', () => act.diaper(selKids, 'pee')],
                  ['poop', 'קקי', () => act.diaper(selKids, 'poop')],
                  ['meal', 'אוכל', () => setSheet({ type: 'feed', kids: selKids })],
                  ['sleep', 'שינה', () => act.sleep(selKids)],
                  ['note', 'הערה', () => setSheet({ type: 'note', kids: selKids })],
                  ['photo', 'תמונה', () => setPhotoFor(selected)],
                ] as [IconKey, string, () => void][]
              ).map(([k, label, fn]) => (
                <button key={label} disabled={!selected.length} className="tile !min-h-[60px]" onClick={fn}>
                  <Bubble k={k} size={30} />
                  <span className="tile-label">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <EventSheet open={!!sheet} onClose={() => setSheet(null)} kids={sheet?.kids ?? []} type={sheet?.type ?? 'feed'} />
      <PhotoSheet open={!!photoFor} onClose={() => setPhotoFor(null)} preselect={photoFor ?? []} />
    </>
  );
}

function PresenceRing({ n, total }: { n: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = total ? n / total : 0;
  return (
    <div className="relative h-[68px] w-[68px] shrink-0" title="ילדים שנמצאים עכשיו">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(var(--ok) / .15)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="rgb(var(--ok))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <p className="text-lg font-extrabold tabular-nums">
            {n}
            <span className="text-muted text-xs font-semibold">/{total}</span>
          </p>
          <p className="text-[10px] text-muted mt-0.5">נמצאים</p>
        </div>
      </div>
    </div>
  );
}

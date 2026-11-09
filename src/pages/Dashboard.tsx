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
import { PageHeader } from '../components/Layout';
import type { Child, EventType } from '../lib/types';
import { presence } from '../lib/util';

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
      <PageHeader
        sub={`${format(new Date(), 'EEEE, d בMMMM', { locale: he })}`}
        title={
          <>
            {greeting()}
            {settings.caregiver_name ? `, ${settings.caregiver_name}` : ''} ☀️
          </>
        }
      >
        <div className="text-center rounded-2xl bg-ok/10 px-3 py-1.5 shrink-0">
          <p className="text-2xl font-extrabold text-ok leading-none tabular-nums">
            {presentCount}/{children.length}
          </p>
          <p className="text-[11px] text-muted">נמצאים</p>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-4 space-y-3">
        {overdue.length > 0 && (
          <div className="rounded-3xl bg-danger/10 border border-danger/20 p-3 space-y-1 anim-pop">
            {overdue.map((o) => (
              <p key={o.child.id + o.kind} className="text-danger font-medium text-sm flex items-center gap-2">
                <span>{o.kind === 'diaper' ? '🧷' : '🍼'}</span>
                {o.text}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex rounded-2xl bg-sunk p-1 text-sm font-semibold">
            {(['cards', 'columns'] as const).map((v) => (
              <button key={v} className={`px-3 h-9 rounded-xl ${view === v ? 'bg-card shadow-soft' : 'text-muted'}`} onClick={() => setViewP(v)}>
                {v === 'cards' ? '▦ כרטיסים' : '▥ עמודות'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            className={`chip ${selectMode ? 'chip-on' : ''}`}
            onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
          >
            {selectMode ? 'סיום בחירה' : '☑️ כמה ילדים יחד'}
          </button>
        </div>

        {!loading && children.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-4xl mb-2">👶</p>
            <p className="font-semibold mb-4">עוד אין ילדים במשפחתון</p>
            <Link to="/settings" className="btn-primary">
              הוספת ילד
            </Link>
          </div>
        )}

        {view === 'cards' || selectMode ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((c) => (
              <ChildCard
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
              <section key={c.id} className="card snap-start shrink-0 w-[82vw] sm:w-72 flex flex-col max-h-[calc(100vh-15rem)]">
                <Link to={`/child/${c.id}`} className="flex items-center gap-2 p-3 border-b border-line" style={{ borderTop: `6px solid ${c.color}`, borderRadius: '1.5rem 1.5rem 0 0' }}>
                  <Avatar child={c} size={40} />
                  <h3 className="font-bold text-lg flex-1">{c.name}</h3>
                  <span className={`text-xs font-semibold rounded-full px-2 py-1 ${presence(byChild.get(c.id) ?? []) === 'in' ? 'bg-ok/15 text-ok' : 'bg-sunk text-muted'}`}>
                    {presence(byChild.get(c.id) ?? []) === 'in' ? (c.gender === 'girl' ? 'נמצאת' : 'נמצא') : 'לא כאן'}
                  </span>
                </Link>
                <div className="grid grid-cols-4 gap-1 p-2">
                  {[
                    ['💧', () => act.diaper([c], 'pee')],
                    ['💩', () => act.diaper([c], 'poop')],
                    ['🍼', () => setSheet({ type: 'feed', kids: [c] })],
                    ['😴', () => act.sleep([c])],
                  ].map(([icon, fn]) => (
                    <button key={icon as string} className="rounded-xl bg-sunk h-11 text-xl active:scale-90" onClick={fn as () => void}>
                      {icon as string}
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
                  ['👋', 'הגעה', () => act.attendance(selKids, 'arrive')],
                  ['🏠', 'איסוף', () => act.attendance(selKids, 'leave')],
                  ['💧', 'פיפי', () => act.diaper(selKids, 'pee')],
                  ['💩', 'קקי', () => act.diaper(selKids, 'poop')],
                  ['🍲', 'אוכל', () => setSheet({ type: 'feed', kids: selKids })],
                  ['😴', 'שינה', () => act.sleep(selKids)],
                  ['📝', 'הערה', () => setSheet({ type: 'note', kids: selKids })],
                  ['📷', 'תמונה', () => setPhotoFor(selected)],
                ] as [string, string, () => void][]
              ).map(([icon, label, fn]) => (
                <button key={label} disabled={!selected.length} className="flex flex-col items-center rounded-2xl bg-sunk py-2 disabled:opacity-40 active:scale-90" onClick={fn}>
                  <span className="text-xl">{icon}</span>
                  <span className="text-[11px] text-muted">{label}</span>
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

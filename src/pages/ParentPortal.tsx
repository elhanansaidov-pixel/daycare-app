import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isToday } from 'date-fns';
import { useData, useDay, useNow } from '../hooks/useData';
import Avatar from '../components/Avatar';
import Timeline from '../components/Timeline';
import DayNav from '../components/DayNav';
import { PhotoGrid } from './Gallery';
import { ageLabel, childWord, clockDuration, durationLabel, lastOf, openSleep, presence } from '../lib/util';
import { signOut } from '../lib/auth';

export default function ParentPortal({ preview }: { preview?: boolean }) {
  const { children, settings, loading } = useData();
  const [sel, setSel] = useState<string | null>(null);
  const [day, setDay] = useState(new Date());
  const [tab, setTab] = useState<'day' | 'photos'>('day');
  const { events, photos } = useDay(day);
  const now = useNow(1000);
  useEffect(() => {
    if (!sel && children[0]) setSel(children[0].id);
  }, [children, sel]);
  const child = children.find((c) => c.id === sel);

  if (!loading && !children.length)
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div className="card p-8 max-w-sm">
          <p className="text-5xl mb-3">🔒</p>
          <p className="font-bold text-lg">לא נמצאו ילדים המשויכים למייל הזה</p>
          <p className="text-muted text-sm mt-2">בקשו מהמטפלת להוסיף את המייל שלכם בכרטיס הילד.</p>
          <button className="btn-ghost mt-4" onClick={() => signOut().then(() => location.reload())}>
            יציאה
          </button>
        </div>
      </div>
    );

  const ev = child ? events.filter((e) => e.child_id === child.id) : [];
  const pres = presence(ev);
  const sleep = openSleep(ev);
  const lastFeed = lastOf(ev, 'feed');
  const lastDiaper = lastOf(ev, 'diaper');

  return (
    <div className="min-h-screen pb-10">
      {preview && (
        <div className="bg-ink text-bg text-sm text-center py-2 px-3">
          👀 כך ההורים רואים את הפורטל · <Link to="/settings" className="underline font-semibold">חזרה</Link>
        </div>
      )}
      <header className="px-4 pt-6 pb-4 max-w-2xl mx-auto" style={{ background: child ? `linear-gradient(to bottom, ${child.color}35, transparent)` : undefined }}>
        <div className="flex items-center justify-between">
          <p className="text-muted font-medium">🧸 {settings.daycare_name}</p>
          {!preview && (
            <button className="text-sm text-muted" onClick={() => signOut().then(() => location.reload())}>
              יציאה
            </button>
          )}
        </div>
        {children.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {children.map((c) => (
              <button key={c.id} className={`chip shrink-0 !pr-1 ${sel === c.id ? 'chip-on' : ''}`} onClick={() => setSel(c.id)}>
                <Avatar child={c} size={30} /> {c.name}
              </button>
            ))}
          </div>
        )}
        {child && (
          <div className="flex items-center gap-4 mt-4">
            <Avatar child={child} size={76} />
            <div>
              <h1 className="text-3xl font-extrabold">{child.name}</h1>
              <p className="text-muted">{ageLabel(child.birth_date)}</p>
            </div>
          </div>
        )}
      </header>

      {child && (
        <main className="max-w-2xl mx-auto px-4 space-y-3">
          {isToday(day) && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`card p-3 ${pres === 'in' ? '' : 'opacity-70'}`}>
                <p className="text-2xl">{pres === 'in' ? (sleep ? '😴' : '🧸') : '🏠'}</p>
                <p className="font-bold text-sm mt-1">
                  {pres === 'in' ? (sleep ? `${childWord(child, 'ישן', 'ישנה')} ${clockDuration(now - +new Date(sleep.started_at))}` : 'במשפחתון') : pres === 'out' ? childWord(child, 'נאסף', 'נאספה') : 'עוד לא הגיע/ה'}
                </p>
              </div>
              <div className="card p-3">
                <p className="text-2xl">🍽️</p>
                <p className="font-bold text-sm mt-1">{lastFeed ? `לפני ${durationLabel(now - +new Date(lastFeed.started_at))}` : '—'}</p>
              </div>
              <div className="card p-3">
                <p className="text-2xl">🧷</p>
                <p className="font-bold text-sm mt-1">{lastDiaper ? `לפני ${durationLabel(now - +new Date(lastDiaper.started_at))}` : '—'}</p>
              </div>
            </div>
          )}

          <div className="flex rounded-2xl bg-sunk p-1 font-semibold">
            {(
              [
                ['day', '📖 יומן'],
                ['photos', '🖼️ תמונות'],
              ] as const
            ).map(([k, l]) => (
              <button key={k} className={`flex-1 h-10 rounded-xl ${tab === k ? 'bg-card shadow-soft' : 'text-muted'}`} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'day' ? (
            <>
              <DayNav day={day} setDay={setDay} />
              <div className="card p-3">
                <Timeline child={child} events={ev} photos={photos} day={day} emptyText={isToday(day) ? 'עדיין אין עדכונים היום' : 'אין תיעוד ליום הזה'} readOnly />
              </div>
            </>
          ) : (
            <PhotoGrid childFilter={child.id} canDelete={false} days={60} />
          )}
        </main>
      )}
    </div>
  );
}

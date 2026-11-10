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
import { Bubble } from '../components/Icon';
import { Wordmark } from '../components/Logo';
import { APP_NAME } from '../lib/brand';
import { BookOpen, Eye, Images, Lock, LogOut } from 'lucide-react';

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
          <span className="inline-grid place-items-center h-16 w-16 rounded-full bg-brandsoft text-brand mb-3">
            <Lock size={28} />
          </span>
          <p className="font-bold text-lg">לא נמצאו ילדים המשויכים למייל הזה</p>
          <p className="text-muted text-sm mt-2">בקשו מהמטפלת לשלוח לכם את קישור ההזמנה של הילד/ה, ולחצו עליו.</p>
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
          <Eye size={15} className="inline -mt-0.5" /> כך ההורים רואים את הפורטל · <Link to="/settings" className="underline font-semibold">חזרה</Link>
        </div>
      )}
      <header className="px-4 pt-5 pb-4" style={{ background: child ? `linear-gradient(to bottom, ${child.color}38, ${child.color}0A 70%, transparent)` : undefined }}>
        <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <Wordmark name={APP_NAME} sub={settings.caregiver_name ? `עם ${settings.caregiver_name}` : undefined} size={34} />
          {!preview && (
            <button className="icon-btn !bg-card/80" onClick={() => signOut().then(() => location.reload())} aria-label="יציאה">
              <LogOut size={18} />
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
          <div className="flex items-center gap-4 mt-5 anim-pop" key={child.id}>
            <Avatar child={child} size={84} />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{child.name}</h1>
              <p className="text-muted">{ageLabel(child.birth_date)}</p>
            </div>
          </div>
        )}
        </div>
      </header>

      {child && (
        <main className="max-w-2xl mx-auto px-4 space-y-3">
          {isToday(day) && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`card p-3 anim-rise ${pres === 'in' ? '' : 'opacity-75'}`}>
                <Bubble k={pres === 'in' ? (sleep ? 'sleep' : 'arrive') : 'leave'} size={40} className="mx-auto" />
                <p className="text-[11px] text-muted mt-1.5">{sleep && pres === 'in' ? 'שינה' : 'נוכחות'}</p>
                <p className="font-bold text-sm">
                  {pres === 'in' ? (sleep ? `${childWord(child, 'ישן', 'ישנה')} ${clockDuration(now - +new Date(sleep.started_at))}` : 'במשפחתון') : pres === 'out' ? childWord(child, 'נאסף', 'נאספה') : 'עוד לא הגיע/ה'}
                </p>
              </div>
              <div className="card p-3 anim-rise" style={{ animationDelay: '60ms' }}>
                <Bubble k="meal" size={40} className="mx-auto" />
                <p className="text-[11px] text-muted mt-1.5">אוכל</p>
                <p className="font-bold text-sm">{lastFeed ? `לפני ${durationLabel(now - +new Date(lastFeed.started_at))}` : '—'}</p>
              </div>
              <div className="card p-3 anim-rise" style={{ animationDelay: '120ms' }}>
                <Bubble k="pee" size={40} className="mx-auto" />
                <p className="text-[11px] text-muted mt-1.5">חיתול</p>
                <p className="font-bold text-sm">{lastDiaper ? `לפני ${durationLabel(now - +new Date(lastDiaper.started_at))}` : '—'}</p>
              </div>
            </div>
          )}

          <div className="segmented">
            {(
              [
                ['day', 'יומן', BookOpen],
                ['photos', 'תמונות', Images],
              ] as const
            ).map(([k, l, I]) => (
              <button key={k} className={`segmented-item ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
                <I size={16} /> {l}
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

import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { isToday } from 'date-fns';
import { useData, useDay } from '../hooks/useData';
import Avatar from '../components/Avatar';
import Timeline from '../components/Timeline';
import DayNav from '../components/DayNav';
import EventSheet from '../components/EventSheet';
import PhotoSheet from '../components/PhotoSheet';
import ChildForm from '../components/ChildForm';
import { ageLabel, telLink, waLink } from '../lib/util';
import { buildSummary } from '../lib/summary';
import type { EventType } from '../lib/types';

export default function ChildPage() {
  const { id } = useParams();
  const { childById, guardians, settings } = useData();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'profile' ? 'profile' : 'log';
  const [day, setDay] = useState(new Date());
  const { events, photos } = useDay(day);
  const [sheet, setSheet] = useState<EventType | null>(null);
  const [photo, setPhoto] = useState(false);
  const child = id ? childById(id) : undefined;
  if (!child) return <p className="p-8 text-center text-muted">לא נמצא</p>;
  const mine = guardians.filter((g) => g.child_id === child.id);
  const evs = events.filter((e) => e.child_id === child.id);

  return (
    <div className="max-w-3xl mx-auto">
      <header className="px-4 pt-4 pb-4" style={{ background: `linear-gradient(to bottom, ${child.color}30, transparent)` }}>
        <Link to="/" className="inline-flex items-center gap-1 text-muted font-medium h-10">
          → חזרה
        </Link>
        <div className="flex items-center gap-4 mt-1">
          <Avatar child={child} size={72} />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold">{child.name}</h1>
            <p className="text-muted">{ageLabel(child.birth_date) || 'הוסיפו תאריך לידה בכרטיס'}</p>
          </div>
          {mine[0]?.phone && (
            <div className="flex gap-2">
              <a href={telLink(mine[0].phone)} className="h-12 w-12 grid place-items-center rounded-full bg-card shadow-soft text-xl" aria-label={`חיוג ל${mine[0].name}`}>
                📞
              </a>
              <a
                href={waLink(mine[0].phone, buildSummary(child, evs, photos, day, settings))}
                target="_blank"
                rel="noreferrer"
                className="h-12 w-12 grid place-items-center rounded-full bg-card shadow-soft text-xl"
                aria-label="שליחת סיכום בוואטסאפ"
              >
                💬
              </a>
            </div>
          )}
        </div>
        {(child.allergies || child.medications) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {child.allergies && <span className="rounded-full bg-danger/10 text-danger text-sm font-semibold px-3 py-1">⚠️ {child.allergies}</span>}
            {child.medications && <span className="rounded-full bg-warn/15 text-sm font-semibold px-3 py-1">💊 {child.medications}</span>}
          </div>
        )}
        <div className="flex rounded-2xl bg-sunk p-1 mt-4 font-semibold">
          {(
            [
              ['log', '📖 יומן'],
              ['profile', '🪪 כרטיס ילד'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={`flex-1 h-10 rounded-xl ${tab === k ? 'bg-card shadow-soft' : 'text-muted'}`} onClick={() => setParams(k === 'log' ? {} : { tab: k }, { replace: true })}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 space-y-3">
        {tab === 'log' ? (
          <>
            <DayNav day={day} setDay={setDay} />
            <div className="grid grid-cols-6 gap-1.5">
              {(
                [
                  ['diaper', '🧷', 'חיתול'],
                  ['feed', '🍼', 'אוכל'],
                  ['sleep', '😴', 'שינה'],
                  ['note', '📝', 'הערה'],
                  ['attendance', '👋', 'נוכחות'],
                ] as [EventType, string, string][]
              ).map(([t, i, l]) => (
                <button key={t} className="flex flex-col items-center rounded-2xl bg-card shadow-soft py-2 active:scale-90" onClick={() => setSheet(t)}>
                  <span className="text-xl">{i}</span>
                  <span className="text-[11px] text-muted">{l}</span>
                </button>
              ))}
              <button className="flex flex-col items-center rounded-2xl bg-card shadow-soft py-2 active:scale-90" onClick={() => setPhoto(true)}>
                <span className="text-xl">📷</span>
                <span className="text-[11px] text-muted">תמונה</span>
              </button>
            </div>
            {child.notes && <p className="rounded-2xl bg-sunk p-3 text-sm">📌 {child.notes}</p>}
            <div className="card p-3">
              <Timeline child={child} events={evs} photos={photos} day={day} emptyText={isToday(day) ? 'עוד לא תועד כלום היום' : 'אין תיעוד ליום הזה'} />
            </div>
          </>
        ) : (
          <ChildForm initial={child} />
        )}
      </div>
      <EventSheet open={!!sheet} onClose={() => setSheet(null)} kids={[child]} type={sheet ?? 'note'} day={day} />
      <PhotoSheet open={photo} onClose={() => setPhoto(false)} preselect={[child.id]} />
    </div>
  );
}

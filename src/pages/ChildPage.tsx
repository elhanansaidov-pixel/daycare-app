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
import { ageLabel, avatarState, telLink, waLink } from '../lib/util';
import { buildSummary } from '../lib/summary';
import type { EventType } from '../lib/types';
import type { IconKey } from '../lib/util';
import { Bubble } from '../components/Icon';
import { ArrowRight, BookOpen, IdCard, MessageCircle, Phone, Pill, Pin, TriangleAlert } from 'lucide-react';

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
      <header className="px-4 pt-4 pb-4" style={{ background: `linear-gradient(to bottom, ${child.color}38, ${child.color}0A 70%, transparent)` }}>
        <Link to="/" className="icon-btn !bg-card/80 shadow-soft" aria-label="חזרה">
          <ArrowRight size={20} />
        </Link>
        <div className="flex items-center gap-4 mt-3">
          <Avatar child={child} size={88} state={isToday(day) ? avatarState(evs) : 'idle'} />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight">{child.name}</h1>
            <p className="text-muted">{ageLabel(child.birth_date) || 'הוסיפו תאריך לידה בכרטיס'}</p>
          </div>
          {mine[0]?.phone && (
            <div className="flex gap-2">
              <a href={telLink(mine[0].phone)} className="h-12 w-12 grid place-items-center rounded-full bg-card shadow-soft text-ok active:scale-90 transition" aria-label={`חיוג ל${mine[0].name}`}>
                <Phone size={20} />
              </a>
              <a
                href={waLink(mine[0].phone, buildSummary(child, evs, photos, day, settings))}
                target="_blank"
                rel="noreferrer"
                className="h-12 w-12 grid place-items-center rounded-full bg-card shadow-soft text-[#25A55F] active:scale-90 transition"
                aria-label="שליחת סיכום בוואטסאפ"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          )}
        </div>
        {(child.allergies || child.medications) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {child.allergies && <span className="badge-danger !text-sm !px-3"><TriangleAlert size={14} /> {child.allergies}</span>}
            {child.medications && <span className="badge-warn !text-sm !px-3"><Pill size={14} /> {child.medications}</span>}
          </div>
        )}
        <div className="segmented mt-4">
          {(
            [
              ['log', 'יומן', BookOpen],
              ['profile', 'כרטיס ילד', IdCard],
            ] as const
          ).map(([k, l, I]) => (
            <button key={k} className={`segmented-item ${tab === k ? 'on' : ''}`} onClick={() => setParams(k === 'log' ? {} : { tab: k }, { replace: true })}>
              <I size={16} /> {l}
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
                  ['diaper', 'pee', 'חיתול'],
                  ['feed', 'meal', 'אוכל'],
                  ['sleep', 'sleep', 'שינה'],
                  ['note', 'note', 'הערה'],
                  ['attendance', 'arrive', 'נוכחות'],
                ] as [EventType, IconKey, string][]
              ).map(([t, k, l]) => (
                <button key={t} className="tile !bg-card shadow-soft border border-line/70 !min-h-[70px]" onClick={() => setSheet(t)}>
                  <Bubble k={k} size={32} />
                  <span className="tile-label">{l}</span>
                </button>
              ))}
              <button className="tile !bg-card shadow-soft border border-line/70 !min-h-[70px]" onClick={() => setPhoto(true)}>
                <Bubble k="photo" size={32} />
                <span className="tile-label">תמונה</span>
              </button>
            </div>
            {child.notes && (
              <p className="rounded-2xl bg-brandsoft/70 p-3 text-sm flex gap-2">
                <Pin size={16} className="text-brand shrink-0 mt-0.5" /> {child.notes}
              </p>
            )}
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

import { Link } from 'react-router-dom';
import { AlarmClock, Camera, Check, House, Plus, TriangleAlert } from 'lucide-react';
import type { Child, DayEvent } from '../lib/types';
import Avatar from './Avatar';
import { EvIcon } from './Icon';
import { avatarState, ageLabel, clockDuration, durationLabel, lastOf, openSleep, presence, childWord, hhmm, type IconKey } from '../lib/util';
import { useNow } from '../hooks/useData';
import { useActions } from '../hooks/useActions';

export default function ChildCard({
  child,
  events,
  overdue,
  selectMode,
  selected,
  onSelect,
  onFeed,
  onPhoto,
  index = 0,
}: {
  child: Child;
  events: DayEvent[];
  overdue: Set<'diaper' | 'feed'>;
  selectMode: boolean;
  selected: boolean;
  onSelect: () => void;
  onFeed: () => void;
  onPhoto: () => void;
  index?: number;
}) {
  const now = useNow(1000);
  const act = useActions();
  const pres = presence(events);
  const sleep = openSleep(events);
  const lastDiaper = lastOf(events, 'diaper');
  const lastFeed = lastOf(events, 'feed');
  const diapers = events.filter((e) => e.type === 'diaper').length;
  const sleptMs = events
    .filter((e) => e.type === 'sleep')
    .reduce((s, e) => s + ((e.ended_at ? new Date(e.ended_at).getTime() : now) - new Date(e.started_at).getTime()), 0);

  const ago = (e?: DayEvent) => (e ? `לפני ${durationLabel(now - new Date(e.started_at).getTime())}` : '—');

  return (
    <article
      className={`card relative overflow-hidden transition anim-rise ${pres === 'in' ? '' : 'opacity-[.86]'} ${selected ? 'ring-4 ring-brand' : ''} ${selectMode ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      onClick={selectMode ? onSelect : undefined}
    >
      <div className="absolute inset-x-0 top-0 h-20 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${child.color}26, transparent)` }} />
      <header className="relative flex items-center gap-3 p-4 pb-2">
        {selectMode && (
          <div className={`h-7 w-7 rounded-full border-2 grid place-items-center transition ${selected ? 'bg-brand border-brand text-white' : 'border-line bg-card'}`}>
            {selected && <Check size={16} strokeWidth={3} />}
          </div>
        )}
        <Link to={`/child/${child.id}`} className="flex items-center gap-3 flex-1 min-w-0" onClick={(e) => selectMode && e.preventDefault()}>
          <Avatar child={child} size={58} state={avatarState(events, now)} />
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight truncate">{child.name}</h3>
            <p className="text-sm text-muted">{ageLabel(child.birth_date) || (child.gender === 'girl' ? 'בת' : 'בן')}</p>
          </div>
        </Link>
        <button
          className={`badge !text-[13px] !px-3 h-9 shrink-0 transition active:scale-95 ${
            pres === 'in' ? 'bg-ok/15 text-ok' : pres === 'out' ? 'bg-sunk text-muted' : 'bg-card text-muted border border-dashed border-line'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!selectMode) act.attendance([child], pres === 'in' ? 'leave' : 'arrive');
          }}
          title={pres === 'in' ? 'סמן איסוף' : 'סמן הגעה'}
        >
          {pres === 'in' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-ok anim-pulse" /> {childWord(child, 'נמצא', 'נמצאת')}
            </>
          ) : pres === 'out' ? (
            <>
              <House size={14} /> {childWord(child, 'נאסף', 'נאספה')}
            </>
          ) : (
            <>
              <Plus size={14} /> הגעה
            </>
          )}
        </button>
      </header>

      {child.allergies && (
        <p className="relative mx-4 mb-1 badge-danger">
          <TriangleAlert size={13} /> אלרגיה: {child.allergies}
        </p>
      )}

      <dl className="relative grid grid-cols-3 gap-2 px-4 py-2 text-center">
        <Stat k="diaper" label="חיתול" value={ago(lastDiaper)} sub={diapers ? `${diapers} היום` : ''} alert={overdue.has('diaper')} />
        <Stat
          k={(lastFeed?.subtype as IconKey) ?? 'feed'}
          label="אוכל"
          value={ago(lastFeed)}
          sub={lastFeed ? hhmm(lastFeed.started_at) : ''}
          alert={overdue.has('feed')}
        />
        {sleep ? (
          <div className="rounded-2xl bg-sleep/15 py-2 px-1">
            <dt className="text-xs text-sleep font-medium inline-flex items-center gap-1">
              <EvIcon k="sleep" size={13} className="anim-breathe" /> {childWord(child, 'ישן', 'ישנה')}
            </dt>
            <dd className="font-bold tabular-nums text-[15px]">{clockDuration(now - new Date(sleep.started_at).getTime())}</dd>
          </div>
        ) : (
          <Stat k="sleep" label="שינה היום" value={sleptMs ? durationLabel(sleptMs) : '—'} />
        )}
      </dl>

      {!selectMode && (
        <div className="relative grid grid-cols-5 gap-1.5 p-3 pt-1">
          <QuickBtn k="pee" label="פיפי" onClick={() => act.diaper([child], 'pee')} />
          <QuickBtn k="poop" label="קקי" onClick={() => act.diaper([child], 'poop')} />
          <QuickBtn k="bottle" label="אוכל" onClick={onFeed} />
          <QuickBtn k={sleep ? 'wake' : 'sleep'} label={sleep ? childWord(child, 'התעורר', 'התעוררה') : 'שינה'} onClick={() => act.sleep([child])} active={!!sleep} />
          <QuickBtn k="photo" label="תמונה" onClick={onPhoto} icon={<Camera size={22} />} />
        </div>
      )}
    </article>
  );
}

function Stat({ k, label, value, sub, alert }: { k: IconKey; label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={`rounded-2xl py-2 px-1 ${alert ? 'bg-danger/10 text-danger' : 'bg-sunk'}`}>
      <dt className={`text-xs font-medium inline-flex items-center gap-1 ${alert ? '' : 'text-muted'}`}>
        {alert ? <AlarmClock size={13} /> : <EvIcon k={k} size={13} />}
        {label}
      </dt>
      <dd className="font-bold text-[15px] leading-tight">{value}</dd>
      {sub && <dd className={`text-[11px] ${alert ? '' : 'text-muted'}`}>{sub}</dd>}
    </div>
  );
}

function QuickBtn({ k, label, onClick, active, icon }: { k: IconKey; label: string; onClick: () => void; active?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      className={`tile !min-h-[62px] ${active ? '!bg-sleep/20' : ''}`}
      style={{ color: `rgb(var(--${k === 'photo' ? 'photo' : k === 'wake' ? 'warn' : k === 'pee' ? 'pee' : k === 'poop' ? 'poop' : k === 'sleep' ? 'sleep' : 'feed'}))` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {icon ?? <EvIcon k={k} size={22} />}
      <span className="tile-label">{label}</span>
    </button>
  );
}

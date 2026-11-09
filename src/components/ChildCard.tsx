import { Link } from 'react-router-dom';
import type { Child, DayEvent } from '../lib/types';
import Avatar from './Avatar';
import { ageLabel, clockDuration, durationLabel, lastOf, openSleep, presence, childWord, hhmm, DIAPER_ICON, FEED_ICON } from '../lib/util';
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
}: {
  child: Child;
  events: DayEvent[];
  overdue: Set<'diaper' | 'feed'>;
  selectMode: boolean;
  selected: boolean;
  onSelect: () => void;
  onFeed: () => void;
  onPhoto: () => void;
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
      className={`card relative overflow-hidden transition ${pres === 'in' ? '' : 'opacity-[.82]'} ${selected ? 'ring-4 ring-brand' : ''}`}
      onClick={selectMode ? onSelect : undefined}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: child.color }} />
      <header className="flex items-center gap-3 p-4 pb-2">
        {selectMode ? (
          <div className={`h-8 w-8 rounded-full border-2 grid place-items-center ${selected ? 'bg-brand border-brand text-white' : 'border-line'}`}>{selected && '✓'}</div>
        ) : null}
        <Link to={`/child/${child.id}`} className="flex items-center gap-3 flex-1 min-w-0" onClick={(e) => selectMode && e.preventDefault()}>
          <Avatar child={child} size={52} />
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight truncate">{child.name}</h3>
            <p className="text-sm text-muted">{ageLabel(child.birth_date) || (child.gender === 'girl' ? 'בת' : 'בן')}</p>
          </div>
        </Link>
        <button
          className={`rounded-full px-3 h-9 text-sm font-semibold shrink-0 ${
            pres === 'in' ? 'bg-ok/15 text-ok' : pres === 'out' ? 'bg-sunk text-muted' : 'bg-sunk text-muted border border-dashed border-line'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!selectMode) act.attendance([child], pres === 'in' ? 'leave' : 'arrive');
          }}
          title={pres === 'in' ? 'סמן איסוף' : 'סמן הגעה'}
        >
          {pres === 'in' ? `✓ ${childWord(child, 'נמצא', 'נמצאת')}` : pres === 'out' ? '🏠 נאסף/ה' : '+ הגעה'}
        </button>
      </header>

      {child.allergies && (
        <p className="mx-4 mb-1 inline-flex items-center gap-1 rounded-full bg-danger/10 text-danger text-xs font-semibold px-2.5 py-1">
          ⚠️ אלרגיה: {child.allergies}
        </p>
      )}

      <dl className="grid grid-cols-3 gap-2 px-4 py-2 text-center">
        <Stat label="חיתול" value={ago(lastDiaper)} sub={diapers ? `${diapers} היום` : ''} alert={overdue.has('diaper')} />
        <Stat
          label="אוכל"
          value={ago(lastFeed)}
          sub={lastFeed ? `${FEED_ICON[lastFeed.subtype ?? 'meal'] ?? ''} ${hhmm(lastFeed.started_at)}` : ''}
          alert={overdue.has('feed')}
        />
        {sleep ? (
          <div className="rounded-2xl bg-[#9AA8F5]/20 py-2">
            <dt className="text-xs text-muted">{childWord(child, 'ישן', 'ישנה')} 💤</dt>
            <dd className="font-bold tabular-nums anim-pulse">{clockDuration(now - new Date(sleep.started_at).getTime())}</dd>
          </div>
        ) : (
          <Stat label="שינה היום" value={sleptMs ? durationLabel(sleptMs) : '—'} />
        )}
      </dl>

      {!selectMode && (
        <div className="grid grid-cols-5 gap-1.5 p-3 pt-1">
          <QuickBtn icon={DIAPER_ICON.pee} label="פיפי" onClick={() => act.diaper([child], 'pee')} />
          <QuickBtn icon={DIAPER_ICON.poop} label="קקי" onClick={() => act.diaper([child], 'poop')} />
          <QuickBtn icon="🍼" label="אוכל" onClick={onFeed} />
          <QuickBtn icon={sleep ? '🌤️' : '😴'} label={sleep ? 'התעורר/ה' : 'שינה'} onClick={() => act.sleep([child])} active={!!sleep} />
          <QuickBtn icon="📷" label="תמונה" onClick={onPhoto} />
        </div>
      )}
    </article>
  );
}

function Stat({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={`rounded-2xl py-2 px-1 ${alert ? 'bg-danger/10 text-danger' : 'bg-sunk'}`}>
      <dt className={`text-xs ${alert ? '' : 'text-muted'}`}>
        {alert && '⏰ '}
        {label}
      </dt>
      <dd className="font-bold text-[15px] leading-tight">{value}</dd>
      {sub && <dd className={`text-[11px] ${alert ? '' : 'text-muted'}`}>{sub}</dd>}
    </div>
  );
}

function QuickBtn({ icon, label, onClick, active }: { icon: string; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      className={`flex flex-col items-center justify-center rounded-2xl min-h-[60px] transition active:scale-90 ${
        active ? 'bg-[#9AA8F5]/30' : 'bg-sunk hover:bg-line/60'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span className="text-[11px] font-medium mt-1 text-muted">{label}</span>
    </button>
  );
}

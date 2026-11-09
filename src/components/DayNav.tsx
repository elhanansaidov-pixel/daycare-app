import { addDays, format, isToday, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';

export default function DayNav({ day, setDay }: { day: Date; setDay: (d: Date) => void }) {
  const label = isToday(day) ? 'היום' : isYesterday(day) ? 'אתמול' : format(day, 'EEEE', { locale: he });
  return (
    <div className="flex items-center gap-2 card p-1.5">
      <button className="h-11 w-11 rounded-2xl bg-sunk text-lg" onClick={() => setDay(addDays(day, -1))} aria-label="יום קודם">
        →
      </button>
      <label className="flex-1 text-center relative">
        <span className="block font-bold leading-tight">{label}</span>
        <span className="block text-xs text-muted">{format(day, 'd בMMMM yyyy', { locale: he })}</span>
        <input
          type="date"
          className="absolute inset-0 opacity-0"
          value={format(day, 'yyyy-MM-dd')}
          max={format(new Date(), 'yyyy-MM-dd')}
          onChange={(e) => e.target.value && setDay(new Date(e.target.value + 'T12:00:00'))}
          aria-label="בחירת תאריך"
        />
      </label>
      <button className="h-11 w-11 rounded-2xl bg-sunk text-lg disabled:opacity-30" disabled={isToday(day)} onClick={() => setDay(addDays(day, 1))} aria-label="יום הבא">
        ←
      </button>
    </div>
  );
}

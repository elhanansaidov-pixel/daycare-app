import { addDays, format, isToday, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DayNav({ day, setDay }: { day: Date; setDay: (d: Date) => void }) {
  const label = isToday(day) ? 'היום' : isYesterday(day) ? 'אתמול' : format(day, 'EEEE', { locale: he });
  return (
    <div className="flex items-center gap-2 card p-1.5">
      <button className="icon-btn !h-11 !w-11 !rounded-2xl" onClick={() => setDay(addDays(day, -1))} aria-label="יום קודם">
        <ChevronRight size={20} />
      </button>
      <label className="flex-1 text-center relative">
        <span className="font-bold leading-tight inline-flex items-center gap-1.5">
          <CalendarDays size={15} className="text-brand" /> {label}
        </span>
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
      <button className="icon-btn !h-11 !w-11 !rounded-2xl" disabled={isToday(day)} onClick={() => setDay(addDays(day, 1))} aria-label="יום הבא">
        <ChevronLeft size={20} />
      </button>
    </div>
  );
}

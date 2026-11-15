// U3: days the daycare is closed. Stored in settings.closed_days (no extra table).
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { ClosedDay, Settings } from './types';

export const ymd = (d: Date) => format(d, 'yyyy-MM-dd');
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const closedOn = (s: Settings, d: Date): ClosedDay | undefined => (s.closed_days ?? []).find((x) => x.date === ymd(d));

/** All days from `from` to `to` (inclusive), skipping Saturdays, merged into the list. */
export function addClosed(list: ClosedDay[], from: string, to: string, note: string): ClosedDay[] {
  const out = new Map(list.map((x) => [x.date, x]));
  const end = parse(to < from ? from : to);
  for (let d = parse(from); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 6) continue;
    out.set(ymd(d), { date: ymd(d), ...(note.trim() ? { note: note.trim() } : {}) });
  }
  return [...out.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export interface ClosedGroup {
  from: string;
  to: string;
  note?: string;
  dates: string[];
}

/** Upcoming closed days (today onward), consecutive days with the same note grouped (Saturday gaps ignored). */
export function upcomingGroups(s: Settings, today = new Date(), withinDays = 365): ClosedGroup[] {
  const start = ymd(today);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + withinDays);
  const days = (s.closed_days ?? []).filter((x) => x.date >= start && x.date <= ymd(limit)).sort((a, b) => a.date.localeCompare(b.date));
  const groups: ClosedGroup[] = [];
  for (const d of days) {
    const g = groups[groups.length - 1];
    if (g && (g.note ?? '') === (d.note ?? '')) {
      const gap = (parse(d.date).getTime() - parse(g.to).getTime()) / 864e5;
      const satGap = gap === 2 && parse(g.to).getDay() === 5;
      if (gap === 1 || satGap) {
        g.to = d.date;
        g.dates.push(d.date);
        continue;
      }
    }
    groups.push({ from: d.date, to: d.date, note: d.note, dates: [d.date] });
  }
  return groups;
}

const dayLabel = (s: string) => format(parse(s), "EEEE d בMMMM", { locale: he });
export const groupLabel = (g: ClosedGroup) => (g.from === g.to ? dayLabel(g.from) : `${dayLabel(g.from)} – ${dayLabel(g.to)}`);

/** The next day the children would normally come (skips Saturday). */
export function nextWorkday(d: Date) {
  const n = new Date(d);
  n.setDate(n.getDate() + 1);
  if (n.getDay() === 6) n.setDate(n.getDate() + 1);
  return n;
}

import { useEffect, useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameMonth, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { useData } from '../hooks/useData';
import { useActions } from '../hooks/useActions';
import { PageHeader } from '../components/Layout';
import Avatar from '../components/Avatar';
import type { DayEvent } from '../lib/types';
import { durationLabel, hhmm, presence } from '../lib/util';

export default function Attendance() {
  const { children, today, store } = useData();
  const act = useActions();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [monthEvents, setMonthEvents] = useState<DayEvent[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      store.listEvents(startOfMonth(month), endOfMonth(month)).then((e) => alive && setMonthEvents(e.filter((x) => x.type === 'attendance')));
    load();
    const off = store.subscribe(load);
    return () => {
      alive = false;
      off();
    };
  }, [store, month]);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).filter((d) => d.getDay() !== 6);

  const report = useMemo(() => {
    return children.map((c) => {
      const mine = monthEvents.filter((e) => e.child_id === c.id);
      const byDay = new Map<string, DayEvent[]>();
      for (const e of mine) {
        const k = format(new Date(e.started_at), 'yyyy-MM-dd');
        byDay.set(k, [...(byDay.get(k) ?? []), e]);
      }
      let ms = 0;
      for (const list of byDay.values()) {
        const a = list.filter((e) => e.subtype === 'arrive').map((e) => +new Date(e.started_at));
        const l = list.filter((e) => e.subtype === 'leave').map((e) => +new Date(e.started_at));
        if (a.length && l.length) ms += Math.max(...l) - Math.min(...a);
      }
      return { c, present: new Set([...byDay.keys()]), hours: ms };
    });
  }, [children, monthEvents]);

  return (
    <>
      <PageHeader sub={format(new Date(), 'EEEE d בMMMM', { locale: he })} title="נוכחות 🗓️" />
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        <section className="card divide-y divide-line">
          {children.map((c) => {
            const ev = today.filter((e) => e.child_id === c.id && e.type === 'attendance').sort((a, b) => a.started_at.localeCompare(b.started_at));
            const p = presence(ev);
            const arr = ev.find((e) => e.subtype === 'arrive');
            const lv = [...ev].reverse().find((e) => e.subtype === 'leave');
            return (
              <div key={c.id} className="flex items-center gap-3 p-3">
                <Avatar child={c} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {arr ? `הגעה ${hhmm(arr.started_at)}` : 'עוד לא הגיע/ה'}
                    {lv && p === 'out' ? ` · איסוף ${hhmm(lv.started_at)}` : ''}
                  </p>
                </div>
                {p === 'in' ? (
                  <button className="btn bg-sunk min-w-[6.5rem]" onClick={() => act.attendance([c], 'leave')}>
                    🏠 איסוף
                  </button>
                ) : (
                  <button className="btn bg-ok/15 text-ok min-w-[6.5rem]" onClick={() => act.attendance([c], 'arrive')}>
                    👋 הגעה
                  </button>
                )}
              </div>
            );
          })}
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <button className="h-10 w-10 rounded-xl bg-sunk" onClick={() => setMonth(addMonths(month, -1))} aria-label="חודש קודם">
              →
            </button>
            <h2 className="font-bold text-lg">דוח חודשי · {format(month, 'MMMM yyyy', { locale: he })}</h2>
            <button className="h-10 w-10 rounded-xl bg-sunk disabled:opacity-30" disabled={isSameMonth(month, new Date())} onClick={() => setMonth(addMonths(month, 1))} aria-label="חודש הבא">
              ←
            </button>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="text-sm border-separate border-spacing-0.5">
              <thead>
                <tr>
                  <th className="sticky right-0 bg-card text-right pl-2">ילד/ה</th>
                  {days.map((d) => (
                    <th key={d.toISOString()} className="font-normal text-muted text-[11px] w-6">
                      {format(d, 'd')}
                    </th>
                  ))}
                  <th className="pr-2 text-right whitespace-nowrap">ימים</th>
                  <th className="pr-2 text-right whitespace-nowrap">שעות</th>
                </tr>
              </thead>
              <tbody>
                {report.map(({ c, present, hours }) => (
                  <tr key={c.id}>
                    <td className="sticky right-0 bg-card font-semibold pl-2 whitespace-nowrap">{c.name}</td>
                    {days.map((d) => {
                      const on = present.has(format(d, 'yyyy-MM-dd'));
                      return <td key={d.toISOString()} className="h-6 w-6 rounded-md" style={{ background: on ? c.color : 'rgb(var(--sunk))' }} title={format(d, 'd/M')} />;
                    })}
                    <td className="pr-2 font-bold tabular-nums">{present.size}</td>
                    <td className="pr-2 text-muted whitespace-nowrap">{hours ? durationLabel(hours) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

import { useState } from 'react';
import { CalendarOff, Trash2 } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from './Toast';
import { PilotBadge } from './Pilot';
import { addClosed, groupLabel, upcomingGroups, ymd } from '../lib/closedDays';

/** U3 (Settings): mark days the daycare is closed. Parents see them in the portal. */
export function ClosedDaysEditor() {
  const { settings, store } = useData();
  const toast = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const groups = upcomingGroups(settings);

  const save = async (closed_days: typeof settings.closed_days) => {
    await store.saveSettings({ ...settings, closed_days });
  };

  return (
    <section className="card p-4 space-y-3" data-help="closed-days">
      <h2 className="section-title">
        <CalendarOff size={20} className="text-brand" /> ימים שהמשפחתון סגור <PilotBadge />
      </h2>
      <p className="text-sm text-muted">ההורים יראו את הימים האלה בפורטל שלהם, ויקבלו תזכורת בסיכום היומי יום לפני.</p>
      {groups.length > 0 ? (
        <ul className="divide-y divide-line" data-testid="closed-list">
          {groups.map((g) => (
            <li key={g.from} className="flex items-center gap-2 py-2">
              <div className="flex-1">
                <p className="font-semibold">{groupLabel(g)}</p>
                {g.note && <p className="text-sm text-muted">{g.note}</p>}
              </div>
              <button
                className="icon-btn"
                aria-label={`מחיקת ${groupLabel(g)}`}
                onClick={async () => {
                  await save((settings.closed_days ?? []).filter((x) => !g.dates.includes(x.date)));
                  toast({ text: 'הוסר', icon: '🗑️' });
                }}
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">עוד לא סומנו ימים.</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="label">מתאריך</span>
          <input type="date" className="input" min={ymd(new Date())} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="מתאריך" />
        </label>
        <label className="block">
          <span className="label">עד (לא חובה)</span>
          <input type="date" className="input" min={from || ymd(new Date())} value={to} onChange={(e) => setTo(e.target.value)} aria-label="עד תאריך" />
        </label>
      </div>
      <input className="input" placeholder="סיבה (לא חובה), למשל: חופשת חנוכה" value={note} onChange={(e) => setNote(e.target.value)} aria-label="סיבה" />
      <button
        className="btn-primary w-full"
        disabled={!from}
        onClick={async () => {
          await save(addClosed(settings.closed_days ?? [], from, to || from, note));
          setFrom('');
          setTo('');
          setNote('');
          toast({ text: 'נשמר, ההורים יראו את זה בפורטל', icon: '📅' });
        }}
      >
        הוספת ימים סגורים
      </button>
    </section>
  );
}

/** U3 (parent portal): upcoming closed days. */
export function ClosedDaysForParents() {
  const { settings } = useData();
  const groups = upcomingGroups(settings, new Date(), 90);
  if (!groups.length) return null;
  return (
    <section className="card p-4" data-testid="parent-closed">
      <h3 className="font-bold mb-2 flex items-center gap-2">
        <CalendarOff size={18} className="text-brand" /> ימים שהמשפחתון סגור
      </h3>
      <ul className="space-y-1.5 text-sm">
        {groups.map((g) => (
          <li key={g.from}>
            <b>{groupLabel(g)}</b>
            {g.note ? ` · ${g.note}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}

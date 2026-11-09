import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subDays, format } from 'date-fns';
import { useData } from '../hooks/useData';
import { PageHeader } from '../components/Layout';
import Avatar from '../components/Avatar';
import Sheet from '../components/Sheet';
import ChildForm, { blankChild } from '../components/ChildForm';
import { Field, Chips } from '../components/EventSheet';
import { useToast } from '../components/Toast';
import type { Reminder } from '../lib/types';
import { ageLabel, uid } from '../lib/util';
import { describe } from '../components/Timeline';
import { signOut } from '../lib/auth';
import { supabase } from '../lib/supabase';

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export default function Settings() {
  const { settings, store, allChildren, reminders, childById } = useData();
  const toast = useToast();
  const [s, setS] = useState(settings);
  const [newChild, setNewChild] = useState(false);
  const [rem, setRem] = useState<Reminder | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [notif, setNotif] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  useEffect(() => setS(settings), [settings]);
  useEffect(() => {
    supabase?.auth.getUser().then((r) => setEmail(r.data.user?.email ?? null));
  }, []);

  const active = allChildren.filter((c) => c.active);
  const archived = allChildren.filter((c) => !c.active);

  async function exportCsv() {
    const events = await store.listEvents(subDays(new Date(), 90), new Date());
    const rows = [['תאריך', 'שעה', 'ילד/ה', 'סוג', 'פירוט', 'סיום']];
    for (const e of events.sort((a, b) => a.started_at.localeCompare(b.started_at))) {
      const c = childById(e.child_id);
      if (!c) continue;
      const d = describe(e, c);
      const t = new Date(e.started_at);
      rows.push([format(t, 'yyyy-MM-dd'), format(t, 'HH:mm'), c.name, d.title, d.detail, e.ended_at ? format(new Date(e.ended_at), 'HH:mm') : '']);
    }
    const csv = '﻿' + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `משפחתון-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  }

  return (
    <>
      <PageHeader title="הגדרות ⚙️" />
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <section className="card p-4 space-y-3">
          <h2 className="font-bold text-lg">המשפחתון</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="שם המשפחתון">
              <input className="input" value={s.daycare_name} onChange={(e) => setS({ ...s, daycare_name: e.target.value })} />
            </Field>
            <Field label="השם שלך (יופיע בסיכומים)">
              <input className="input" value={s.caregiver_name} onChange={(e) => setS({ ...s, caregiver_name: e.target.value })} />
            </Field>
          </div>
          <button
            className="btn-primary w-full"
            onClick={async () => {
              await store.saveSettings(s);
              toast({ text: 'נשמר', icon: '✅' });
            }}
          >
            שמירה
          </button>
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">ילדים ({active.length})</h2>
            <button className="btn-ghost !min-h-[40px]" onClick={() => setNewChild(true)}>
              + הוספת ילד/ה
            </button>
          </div>
          <ul className="divide-y divide-line">
            {active.map((c) => (
              <li key={c.id}>
                <Link to={`/child/${c.id}?tab=profile`} className="flex items-center gap-3 py-2.5">
                  <Avatar child={c} size={40} />
                  <span className="font-semibold flex-1">{c.name}</span>
                  <span className="text-sm text-muted">{ageLabel(c.birth_date)}</span>
                  <span className="text-muted">‹</span>
                </Link>
              </li>
            ))}
          </ul>
          {archived.length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-muted cursor-pointer py-2">ארכיון ({archived.length})</summary>
              {archived.map((c) => (
                <Link key={c.id} to={`/child/${c.id}?tab=profile`} className="flex items-center gap-3 py-2 opacity-70">
                  <Avatar child={c} size={32} /> {c.name}
                </Link>
              ))}
            </details>
          )}
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">⏰ תזכורות</h2>
            <button
              className="btn-ghost !min-h-[40px]"
              onClick={() => setRem({ id: uid(), child_id: null, title: '', time_of_day: '10:00', days: [0, 1, 2, 3, 4], active: true })}
            >
              + תזכורת
            </button>
          </div>
          {!reminders.length && <p className="text-sm text-muted">למשל: ״תרופה לכפיר״ ב-10:00, או ״ארוחת צהריים״ ב-12:00.</p>}
          <ul className="divide-y divide-line">
            {reminders
              .slice()
              .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
              .map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <span className="font-bold tabular-nums text-lg w-14">{r.time_of_day}</span>
                  <button className="flex-1 text-right min-w-0" onClick={() => setRem(r)}>
                    <p className={`font-semibold truncate ${r.active ? '' : 'line-through text-muted'}`}>{r.title}</p>
                    <p className="text-xs text-muted">
                      {r.child_id ? childById(r.child_id)?.name : 'כל הילדים'} · {r.days.map((d) => DAY_NAMES[d]).join(' ')}
                    </p>
                  </button>
                  <Toggle on={r.active} onChange={(v) => store.saveReminder({ ...r, active: v })} />
                </li>
              ))}
          </ul>
          <div className="mt-3 rounded-2xl bg-sunk p-3 text-sm flex items-center gap-3">
            <span className="flex-1">
              {notif === 'granted'
                ? '🔔 התראות מופעלות. הן יופיעו כשהאפליקציה פתוחה או ברקע.'
                : 'כדי לקבל התראה קופצת עם צליל, צריך לאשר התראות.'}
            </span>
            {notif !== 'granted' && typeof Notification !== 'undefined' && (
              <button className="btn-primary !min-h-[40px]" onClick={async () => setNotif(await Notification.requestPermission())}>
                הפעלה
              </button>
            )}
          </div>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="font-bold text-lg">נתונים וחשבון</h2>
          <button className="btn-ghost w-full" onClick={exportCsv}>
            ⬇️ ייצוא 90 ימים אחרונים לאקסל (CSV)
          </button>
          <Link to="/parent" className="btn-ghost w-full">
            👀 תצוגה מקדימה של פורטל ההורים
          </Link>
          {store.mode === 'cloud' ? (
            <div className="flex items-center gap-3 rounded-2xl bg-sunk p-3">
              <span className="flex-1 text-sm">
                ☁️ מחובר/ת לענן{email ? <> · <span dir="ltr">{email}</span></> : ''}
              </span>
              <button className="btn-danger !min-h-[40px]" onClick={() => signOut().then(() => location.reload())}>
                יציאה
              </button>
            </div>
          ) : (
            <p className="rounded-2xl bg-warn/15 p-3 text-sm">
              📱 מצב מקומי: הנתונים נשמרים רק בדפדפן של המכשיר הזה. אחרי חיבור ל-Supabase הם יישמרו בענן, יסונכרנו בין מכשירים ויופיעו להורים בפורטל.
            </p>
          )}
          <details className="rounded-2xl bg-sunk p-3 text-sm">
            <summary className="font-semibold cursor-pointer">📲 איך מתקינים כאפליקציה בטלפון?</summary>
            <p className="mt-2">
              <b>אייפון (Safari):</b> כפתור השיתוף ⬆️ ← ״הוספה למסך הבית״.
              <br />
              <b>אנדרואיד (Chrome):</b> תפריט ⋮ ← ״התקנת אפליקציה״ / ״הוספה למסך הבית״.
            </p>
          </details>
        </section>
      </div>

      <Sheet open={newChild} onClose={() => setNewChild(false)} title="ילד/ה חדש/ה">
        <ChildForm initial={blankChild(allChildren.length)} onSaved={() => setNewChild(false)} />
      </Sheet>

      <Sheet
        open={!!rem}
        onClose={() => setRem(null)}
        title="⏰ תזכורת"
        footer={
          rem && (
            <div className="flex gap-2">
              <button
                className="btn-primary flex-1"
                disabled={!rem.title.trim() || !rem.days.length}
                onClick={async () => {
                  await store.saveReminder({ ...rem, title: rem.title.trim() });
                  setRem(null);
                  toast({ text: 'התזכורת נשמרה', icon: '⏰' });
                }}
              >
                שמירה
              </button>
              {reminders.some((r) => r.id === rem.id) && (
                <button
                  className="btn-danger"
                  onClick={async () => {
                    await store.deleteReminder(rem.id);
                    setRem(null);
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          )
        }
      >
        {rem && (
          <div className="space-y-4">
            <Field label="מה להזכיר?">
              <input className="input" autoFocus placeholder="למשל: לתת תרופה" value={rem.title} onChange={(e) => setRem({ ...rem, title: e.target.value })} />
            </Field>
            <Field label="שעה">
              <input type="time" className="input text-center" value={rem.time_of_day} onChange={(e) => setRem({ ...rem, time_of_day: e.target.value })} />
            </Field>
            <Field label="ימים">
              <div className="flex gap-1.5">
                {DAY_NAMES.map((d, i) => {
                  const on = rem.days.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`h-11 flex-1 rounded-xl font-semibold ${on ? 'bg-brand text-brandink' : 'bg-sunk text-muted'}`}
                      onClick={() => setRem({ ...rem, days: on ? rem.days.filter((x) => x !== i) : [...rem.days, i].sort() })}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="עבור">
              <Chips
                options={[{ key: '', label: 'כל הילדים' }, ...active.map((c) => ({ key: c.id, label: `${c.emoji} ${c.name}` }))]}
                value={rem.child_id ?? ''}
                onChange={(v) => setRem({ ...rem, child_id: v || null })}
              />
            </Field>
          </div>
        )}
      </Sheet>
    </>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      className={`relative h-8 w-14 rounded-full transition ${on ? 'bg-ok' : 'bg-line'}`}
      onClick={() => onChange(!on)}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'right-1' : 'right-7'}`} />
    </button>
  );
}

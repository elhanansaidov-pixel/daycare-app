import { useEffect, useState } from 'react';
import type { Child, Guardian } from '../lib/types';
import { useData } from '../hooks/useData';
import { useToast } from './Toast';
import { CHILD_COLORS, CHILD_EMOJIS, telLink, uid, waLink } from '../lib/util';
import { Field, Chips } from './EventSheet';
import { inviteLink, rotateInvite } from '../lib/auth';

export function blankChild(sort: number): Child {
  return {
    id: uid(),
    name: '',
    gender: 'boy',
    birth_date: null,
    color: CHILD_COLORS[sort % CHILD_COLORS.length],
    emoji: CHILD_EMOJIS[sort % CHILD_EMOJIS.length],
    allergies: '',
    medications: '',
    notes: '',
    diaper_alert_min: 180,
    feed_alert_min: 240,
    active: true,
    sort,
  };
}

export default function ChildForm({ initial, onSaved }: { initial: Child; onSaved?: (c: Child) => void }) {
  const { store, guardians } = useData();
  const toast = useToast();
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => setC(initial), [initial]);
  const set = (p: Partial<Child>) => setC((x) => ({ ...x, ...p }));
  const mine = guardians.filter((g) => g.child_id === c.id);

  async function save() {
    if (!c.name.trim()) return toast({ text: 'צריך שם', tone: 'error' });
    setBusy(true);
    try {
      const saved = await store.saveChild({ ...c, name: c.name.trim() });
      toast({ text: 'נשמר', icon: '✅' });
      onSaved?.(saved);
    } catch (e) {
      toast({ text: 'שגיאה: ' + (e as Error).message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-4 space-y-4">
        <h3 className="font-bold text-lg">פרטים</h3>
        <Field label="שם">
          <input className="input" value={c.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="מין">
            <Chips
              options={[
                { key: 'boy', label: '👦 בן' },
                { key: 'girl', label: '👧 בת' },
              ]}
              value={c.gender}
              onChange={(v) => v && set({ gender: v as Child['gender'] })}
            />
          </Field>
          <Field label="תאריך לידה">
            <input type="date" className="input" value={c.birth_date ?? ''} onChange={(e) => set({ birth_date: e.target.value || null })} />
          </Field>
        </div>
        <Field label="דמות">
          <div className="flex flex-wrap gap-1.5">
            {CHILD_EMOJIS.map((em) => (
              <button key={em} type="button" className={`h-11 w-11 rounded-2xl text-2xl ${c.emoji === em ? 'bg-brand/20 ring-2 ring-brand' : 'bg-sunk'}`} onClick={() => set({ emoji: em })}>
                {em}
              </button>
            ))}
          </div>
        </Field>
        <Field label="צבע">
          <div className="flex flex-wrap gap-2">
            {CHILD_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                className={`h-10 w-10 rounded-full ${c.color === col ? 'ring-4 ring-offset-2 ring-offset-card' : ''}`}
                style={{ background: col, ['--tw-ring-color' as string]: col }}
                onClick={() => set({ color: col })}
                aria-label={col}
              />
            ))}
          </div>
        </Field>
      </section>

      <section className="card p-4 space-y-4">
        <h3 className="font-bold text-lg">בריאות והערות</h3>
        <Field label="⚠️ אלרגיות">
          <input className="input" placeholder="למשל: בוטנים, חלב" value={c.allergies} onChange={(e) => set({ allergies: e.target.value })} />
        </Field>
        <Field label="💊 תרופות">
          <input className="input" placeholder="שם התרופה, מינון ושעות" value={c.medications} onChange={(e) => set({ medications: e.target.value })} />
        </Field>
        <Field label="📌 הערות קבועות">
          <textarea className="input min-h-[90px] py-3" placeholder="הרגלי שינה, מוצץ, דברים שמרגיעים..." value={c.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
      </section>

      <section className="card p-4 space-y-4">
        <h3 className="font-bold text-lg">התראות</h3>
        <p className="text-sm text-muted -mt-2">התראה מופיעה כשהילד/ה נמצא/ת במשפחתון ועבר הזמן הזה. 0 = בלי התראה.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="חיתול אחרי (שעות)">
            <input
              type="number"
              step="0.5"
              min="0"
              className="input text-center"
              value={c.diaper_alert_min / 60}
              onChange={(e) => set({ diaper_alert_min: Math.round(Number(e.target.value) * 60) })}
            />
          </Field>
          <Field label="אוכל אחרי (שעות)">
            <input
              type="number"
              step="0.5"
              min="0"
              className="input text-center"
              value={c.feed_alert_min / 60}
              onChange={(e) => set({ feed_alert_min: Math.round(Number(e.target.value) * 60) })}
            />
          </Field>
        </div>
      </section>

      <button className="btn-primary w-full text-lg sticky bottom-24 z-10" disabled={busy} onClick={save}>
        שמירת פרטים
      </button>

      <section className="card p-4 space-y-3">
        <h3 className="font-bold text-lg">👨‍👩‍👧 הורים ואנשי קשר</h3>
        {store.mode === 'cloud' && c.invite_code && (
          <div className="rounded-2xl bg-brand/10 p-3 space-y-2">
            <p className="text-sm">
              <b>הזמנת הורה לפורטל:</b> שלחו להורה את הקישור. אחרי שיתחבר עם Google הוא יצורף ל{c.name} אוטומטית ויופיע כאן ברשימה.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                className="btn bg-[#25D366] text-white flex-1 min-w-[10rem]"
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `היי! 💛\nכאן אפשר לראות בכל רגע את היומן והתמונות של ${c.name} מהמשפחתון:\n${inviteLink(c.invite_code)}\n\nנכנסים עם חשבון Google, וזהו.`,
                )}`}
              >
                📨 שליחת הזמנה בוואטסאפ
              </a>
              <button
                className="btn-ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteLink(c.invite_code!));
                  toast({ text: 'הקישור הועתק', icon: '📋' });
                }}
              >
                📋 העתקה
              </button>
              <button
                className="btn-ghost"
                onClick={async () => {
                  if (!confirm('ליצור קישור חדש? הקישור הקודם יפסיק לעבוד. הורים שכבר הצטרפו יישארו מחוברים.')) return;
                  try {
                    const nc = await rotateInvite(c.id);
                    set({ invite_code: nc });
                    toast({ text: 'נוצר קישור חדש', icon: '🔄' });
                  } catch (e) {
                    toast({ text: 'שגיאה: ' + (e as Error).message, tone: 'error' });
                  }
                }}
              >
                🔄 קישור חדש
              </button>
            </div>
          </div>
        )}
        {mine.map((g) => (
          <GuardianRow key={g.id} g={g} />
        ))}
        <GuardianRow key={'new-' + mine.length} g={{ id: '', child_id: c.id, name: '', relation: mine.length ? 'אבא' : 'אמא', phone: '', email: '' }} />
        <p className="text-xs text-muted">ההורה נכנס לפורטל עם חשבון ה-Google שמופיע כאן, ורואה רק את הילדים שהוא רשום אצלם. כדי להסיר גישה, מוחקים את ההורה מהרשימה.</p>
      </section>

      <button
        className="btn-danger w-full"
        onClick={async () => {
          if (!confirm(c.active ? `להעביר את ${c.name} לארכיון? הנתונים נשמרים.` : `להחזיר את ${c.name} למשפחתון?`)) return;
          await store.saveChild({ ...c, active: !c.active });
          set({ active: !c.active });
          toast({ text: c.active ? 'הועבר לארכיון' : 'הוחזר', icon: '📦' });
        }}
      >
        {c.active ? '📦 העברה לארכיון (סיים במשפחתון)' : '↩️ החזרה מהארכיון'}
      </button>
    </div>
  );
}

function GuardianRow({ g: initial }: { g: Guardian }) {
  const { store } = useData();
  const toast = useToast();
  const [g, setG] = useState(initial);
  const [editing, setEditing] = useState(!initial.id);
  const isNew = !initial.id;
  const set = (p: Partial<Guardian>) => setG((x) => ({ ...x, ...p }));

  if (!editing)
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-sunk p-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold">
            {g.name} <span className="text-muted font-normal text-sm">· {g.relation}</span>
          </p>
          <p className="text-sm text-muted truncate" dir="ltr" style={{ textAlign: 'right' }}>
            {[g.phone, g.email].filter(Boolean).join(' · ')}
          </p>
        </div>
        {g.phone && (
          <>
            <a href={telLink(g.phone)} className="h-10 w-10 grid place-items-center rounded-full bg-card" aria-label="חיוג">
              📞
            </a>
            <a href={waLink(g.phone, '')} target="_blank" rel="noreferrer" className="h-10 w-10 grid place-items-center rounded-full bg-card" aria-label="וואטסאפ">
              💬
            </a>
          </>
        )}
        <button className="h-10 w-10 rounded-full bg-card" onClick={() => setEditing(true)} aria-label="עריכה">
          ✏️
        </button>
      </div>
    );

  return (
    <div className={`rounded-2xl p-3 space-y-2 ${isNew ? 'border-2 border-dashed border-line' : 'bg-sunk'}`}>
      {isNew && <p className="font-semibold text-sm">+ הוספת איש קשר</p>}
      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <input className="input" placeholder="שם" value={g.name} onChange={(e) => set({ name: e.target.value })} />
        <input className="input" placeholder="קרבה" value={g.relation} onChange={(e) => set({ relation: e.target.value })} />
      </div>
      <input className="input" type="tel" dir="ltr" placeholder="050-0000000" value={g.phone} onChange={(e) => set({ phone: e.target.value })} />
      <input className="input" type="email" dir="ltr" placeholder="email@example.com" value={g.email} onChange={(e) => set({ email: e.target.value })} />
      <div className="flex gap-2">
        <button
          className="btn-primary flex-1"
          disabled={!g.name.trim()}
          onClick={async () => {
            try {
              await store.saveGuardian({ ...g, id: g.id || uid() });
              toast({ text: 'איש הקשר נשמר', icon: '✅' });
              if (isNew) setG(initial);
              else setEditing(false);
            } catch (e) {
              toast({ text: 'שגיאה: ' + (e as Error).message, tone: 'error' });
            }
          }}
        >
          שמירה
        </button>
        {!isNew && (
          <>
            <button className="btn-ghost" onClick={() => (setG(initial), setEditing(false))}>
              ביטול
            </button>
            <button
              className="btn-danger"
              onClick={async () => {
                if (confirm(`למחוק את ${g.name}?`)) await store.deleteGuardian(g.id);
              }}
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

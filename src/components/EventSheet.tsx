import { useEffect, useState } from 'react';
import Sheet from './Sheet';
import { useData } from '../hooks/useData';
import { useToast } from './Toast';
import type { Child, DayEvent, EventType, NewEvent } from '../lib/types';
import { DIAPER_ICON, DIAPER_LABEL, FEED_ICON, FEED_LABEL, MOODS, PORTION_LABEL, TEXTURES, hhmm } from '../lib/util';

const TYPE_TITLE: Record<EventType, string> = {
  diaper: '🧷 החלפת חיתול',
  feed: '🍽️ אוכל',
  sleep: '😴 שינה',
  note: '📝 הערה',
  attendance: '👋 נוכחות',
};
const BOTTLE_ML = [60, 90, 120, 150, 180, 210, 240];

function withTime(baseIso: string, time: string) {
  const d = new Date(baseIso);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export default function EventSheet({
  open,
  onClose,
  kids,
  type,
  existing,
  day,
}: {
  open: boolean;
  onClose: () => void;
  kids: Child[];
  type: EventType;
  existing?: DayEvent | null;
  day?: Date;
}) {
  const { store } = useData();
  const toast = useToast();
  const [subtype, setSubtype] = useState<string | null>(null);
  const [data, setData] = useState<DayEvent['data']>({});
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setSubtype(existing.subtype);
      setData(existing.data ?? {});
      setTime(hhmm(existing.started_at));
      setEndTime(existing.ended_at ? hhmm(existing.ended_at) : '');
    } else {
      setSubtype(type === 'diaper' ? 'pee' : type === 'feed' ? 'bottle' : type === 'attendance' ? 'arrive' : null);
      setData(type === 'feed' ? { portion: 'all' } : {});
      setTime(hhmm(new Date()));
      setEndTime('');
    }
  }, [open, existing, type]);

  const set = (patch: Partial<DayEvent['data']>) => setData((d) => ({ ...d, ...patch }));
  const baseIso = existing?.started_at ?? (day ?? new Date()).toISOString();

  async function save() {
    setBusy(true);
    try {
      const started_at = withTime(baseIso, time || hhmm(new Date()));
      let ended_at: string | null = endTime ? withTime(baseIso, endTime) : null;
      if (ended_at && ended_at < started_at) ended_at = new Date(new Date(ended_at).getTime() + 864e5).toISOString();
      const clean = { ...data };
      if (type === 'feed' && subtype !== 'bottle') delete clean.amount_ml;
      if (type === 'diaper' && subtype === 'pee') delete clean.texture;
      if (type === 'note') clean.mood = subtype ?? undefined;
      if (existing) {
        await store.updateEvent(existing.id, { subtype, data: clean, started_at, ended_at: type === 'sleep' ? ended_at : null });
        toast({ text: 'עודכן', icon: '✅' });
      } else {
        const list: NewEvent[] = kids.map((c) => ({
          child_id: c.id,
          type,
          subtype,
          data: clean,
          started_at,
          ended_at: type === 'sleep' ? ended_at : null,
        }));
        const created = await store.addEvents(list);
        toast({
          text: kids.length === 1 ? `נשמר ל${kids[0].name}` : `נשמר ל-${kids.length} ילדים`,
          icon: '✅',
          undo: () => Promise.all(created.map((e) => store.deleteEvent(e.id))).then(() => undefined),
        });
      }
      onClose();
    } catch (e) {
      toast({ text: 'שגיאה: ' + (e as Error).message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    const copy = existing;
    await store.deleteEvent(existing.id);
    toast({
      text: 'נמחק',
      icon: '🗑️',
      undo: async () => {
        const { id: _id, created_at: _c, ...rest } = copy;
        await store.addEvents([rest]);
      },
    });
    onClose();
  }

  const who = kids.length === 1 ? kids[0].name : `${kids.length} ילדים`;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span>
          {TYPE_TITLE[type]} <span className="text-muted font-medium text-base">· {who}</span>
        </span>
      }
      footer={
        <div className="flex gap-2">
          <button className="btn-primary flex-1 text-lg" disabled={busy || (type === 'note' && !data.text?.trim() && !subtype)} onClick={save}>
            {existing ? 'שמירת שינויים' : 'שמירה'}
          </button>
          {existing && (
            <button className="btn-danger" onClick={remove} aria-label="מחיקה">
              🗑️ מחיקה
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        {type === 'diaper' && (
          <>
            <Chips
              options={Object.keys(DIAPER_LABEL).map((k) => ({ key: k, label: `${DIAPER_ICON[k]} ${DIAPER_LABEL[k]}` }))}
              value={subtype}
              onChange={setSubtype}
              big
            />
            {subtype !== 'pee' && (
              <Field label="מרקם (לא חובה)">
                <Chips options={TEXTURES.map((t) => ({ key: t, label: t }))} value={data.texture ?? null} onChange={(v) => set({ texture: v ?? undefined })} toggle />
              </Field>
            )}
          </>
        )}

        {type === 'feed' && (
          <>
            <Chips
              options={Object.keys(FEED_LABEL).map((k) => ({ key: k, label: `${FEED_ICON[k]} ${FEED_LABEL[k]}` }))}
              value={subtype}
              onChange={setSubtype}
            />
            {subtype === 'bottle' ? (
              <Field label="כמות (מ״ל)">
                <div className="flex flex-wrap gap-2">
                  {BOTTLE_ML.map((ml) => (
                    <button key={ml} className={`chip ${data.amount_ml === ml ? 'chip-on' : ''}`} onClick={() => set({ amount_ml: ml })}>
                      {ml}
                    </button>
                  ))}
                  <input
                    className="input !min-h-[40px] !w-24 text-center"
                    inputMode="numeric"
                    placeholder="אחר"
                    value={data.amount_ml && !BOTTLE_ML.includes(data.amount_ml) ? data.amount_ml : ''}
                    onChange={(e) => set({ amount_ml: Number(e.target.value.replace(/\D/g, '')) || undefined })}
                  />
                </div>
              </Field>
            ) : (
              <Field label="מה אכלו? (לא חובה)">
                <input className="input" placeholder="למשל: פסטה עם ירקות" value={data.food ?? ''} onChange={(e) => set({ food: e.target.value })} />
              </Field>
            )}
            <Field label="כמה אכלו?">
              <Chips options={Object.keys(PORTION_LABEL).map((k) => ({ key: k, label: PORTION_LABEL[k] }))} value={data.portion ?? null} onChange={(v) => set({ portion: (v ?? undefined) as DayEvent['data']['portion'] })} />
            </Field>
          </>
        )}

        {type === 'attendance' && (
          <Chips
            options={[
              { key: 'arrive', label: '👋 הגעה' },
              { key: 'leave', label: '🏠 איסוף' },
            ]}
            value={subtype}
            onChange={setSubtype}
            big
          />
        )}

        {type === 'note' && (
          <>
            <Field label="מצב רוח">
              <Chips options={MOODS.map((m) => ({ key: m.key, label: `${m.icon} ${m.label}` }))} value={subtype} onChange={setSubtype} toggle />
            </Field>
            <Field label="הערה">
              <textarea
                className="input min-h-[110px] py-3"
                placeholder="למשל: שיחקה יפה בחצר, קצת נזלת"
                value={data.text ?? ''}
                onChange={(e) => set({ text: e.target.value })}
              />
            </Field>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={type === 'sleep' ? 'נרדם/ה בשעה' : 'שעה'}>
            <input type="time" className="input text-center" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          {type === 'sleep' && (
            <Field label="התעורר/ה בשעה">
              <input type="time" className="input text-center" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Field>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block" role="group" aria-label={label}>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

export function Chips({
  options,
  value,
  onChange,
  big,
  toggle,
}: {
  options: { key: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
  big?: boolean;
  toggle?: boolean;
}) {
  return (
    <div className={big ? 'grid grid-cols-3 gap-2' : 'flex flex-wrap gap-2'}>
      {options.map((o) => (
        <button
          type="button"
          key={o.key}
          className={`chip ${big ? 'justify-center !min-h-[56px] text-base' : ''} ${value === o.key ? 'chip-on' : ''}`}
          onClick={() => onChange(toggle && value === o.key ? null : o.key)}
          aria-pressed={value === o.key}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

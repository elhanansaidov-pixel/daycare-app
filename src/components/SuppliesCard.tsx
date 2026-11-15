import { useEffect, useRef, useState } from 'react';
import type { Child, SupplyItem } from '../lib/types';
import { useData } from '../hooks/useData';
import { useToast } from './Toast';
import Sheet from './Sheet';
import { uid } from '../lib/util';
import { Check, Plus, ShoppingBag } from 'lucide-react';

/** Quick picks for the "מה חסר" list. */
export const SUPPLY_PRESETS = ['חיתולים', 'מגבונים', 'משחה', 'בגדים להחלפה', 'פורמולה', 'מוצץ'];

/**
 * "מה חסר" – things the parents should bring.
 * Staff can add items and mark them as arrived (removes them); parents see the list read-only.
 */
export default function SuppliesCard({ child, readOnly }: { child: Child; readOnly?: boolean }) {
  const { store } = useData();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const items = child.supplies ?? [];
  // Latest list, so quick taps in a row don't overwrite each other before the store refreshes.
  const latest = useRef(items);
  useEffect(() => {
    latest.current = child.supplies ?? [];
  }, [child.supplies]);

  if (readOnly && !items.length) return null;

  async function save(next: SupplyItem[], msg: string, icon: string) {
    const prev = latest.current;
    latest.current = next;
    try {
      await store.saveSupplies(child.id, next);
      toast({
        text: msg,
        icon,
        undo: async () => {
          latest.current = prev;
          await store.saveSupplies(child.id, prev);
          toast({ text: 'בוטל', icon: '↩️' });
        },
      });
    } catch (e) {
      latest.current = prev;
      toast({ text: 'שגיאה בשמירה: ' + (e as Error).message, tone: 'error' });
    }
  }

  const has = (t: string) => latest.current.some((x) => x.text === t);
  const add = (t: string) => {
    const v = t.trim();
    if (!v || has(v)) return;
    void save([...latest.current, { id: uid(), text: v, added_at: new Date().toISOString() }], `נוסף: ${v}`, '🛍️');
  };
  const arrived = (it: SupplyItem) =>
    save(
      latest.current.filter((x) => x.id !== it.id),
      `${it.text} – הגיע`,
      '✓',
    );

  return (
    <section className="card p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="section-title !text-base">
          <ShoppingBag size={18} className="text-brand" /> {readOnly ? 'מה להביא מחר' : 'מה חסר'}
          {items.length > 0 && <span className="badge-warn">{items.length}</span>}
        </h3>
        {!readOnly && (
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="הוספת פריט חסר">
            <Plus size={18} />
          </button>
        )}
      </div>

      {items.length ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 rounded-2xl bg-sunk px-3 min-h-[44px]">
              <span className="flex-1 font-medium">{it.text}</span>
              {!readOnly && (
                <button className="chip !min-h-[34px] !bg-card text-ok" onClick={() => arrived(it)} aria-label={`${it.text} הגיע`}>
                  <Check size={15} /> הגיע
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted mt-1">לא חסר כלום כרגע</p>
      )}
      {readOnly && <p className="text-xs text-muted mt-2">הפריט יורד מהרשימה כשהוא מגיע למשפחתון.</p>}

      {!readOnly && (
        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          title={
            <span className="flex items-center gap-2.5">
              <ShoppingBag size={22} className="text-brand" /> מה חסר ל{child.name}?
            </span>
          }
        >
          <div className="space-y-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {SUPPLY_PRESETS.map((p) => (
                <button key={p} className={`chip ${has(p) ? 'chip-on' : ''}`} disabled={has(p)} onClick={() => add(p)}>
                  {has(p) ? <Check size={15} /> : <Plus size={15} />} {p}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                add(text);
                setText('');
              }}
            >
              <input className="input" placeholder="משהו אחר…" value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn-primary shrink-0" disabled={!text.trim()}>
                הוספה
              </button>
            </form>
            <p className="text-xs text-muted">ההורים רואים את הרשימה בפורטל ובסיכום היומי בוואטסאפ.</p>
          </div>
        </Sheet>
      )}
    </section>
  );
}

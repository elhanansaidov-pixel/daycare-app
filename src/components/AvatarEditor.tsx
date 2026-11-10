import { useEffect, useState } from 'react';
import { Shuffle } from 'lucide-react';
import Sheet from './Sheet';
import Avatar, { type AvatarState } from './Avatar';
import type { Child } from '../lib/types';
import {
  ANIMALS,
  EXTRAS,
  EYE_COLORS,
  EYE_COLOR_LABELS,
  HAIR_COLORS,
  HAIR_COLOR_LABELS,
  HAIR_STYLES,
  FACES,
  MOUTHS,
  PRINTS,
  TOYS,
  SKINS,
  lookOf,
  randomLook,
  type Look,
} from '../lib/look';

type Tab = 'animal' | 'skin' | 'face' | 'hair' | 'hairColor' | 'eyes' | 'extras' | 'print' | 'toy';
const TABS: [Tab, string][] = [
  ['animal', 'חיה'],
  ['skin', 'עור'],
  ['face', 'פנים וחיוך'],
  ['hair', 'שיער'],
  ['hairColor', 'צבע שיער'],
  ['eyes', 'עיניים'],
  ['extras', 'תוספות'],
  ['print', 'הדפס'],
  ['toy', 'צעצוע'],
];

export default function AvatarEditor({ child, open, onClose, onSave }: { child: Child; open: boolean; onClose: () => void; onSave: (look: Look) => void | Promise<void> }) {
  const [look, setLook] = useState<Look>(() => lookOf(child));
  const [tab, setTab] = useState<Tab>('animal');
  const [preview, setPreview] = useState<AvatarState>('idle');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setLook(lookOf(child));
  }, [open, child]);
  const set = (p: Partial<Look>) => setLook((l) => ({ ...l, ...p }));
  const mini = (l: Partial<Look>, key: string, label: string, on: boolean) => (
    <button key={key} type="button" className={`flex flex-col items-center gap-1 rounded-2xl p-1.5 transition active:scale-95 ${on ? 'bg-brandsoft ring-2 ring-brand' : 'bg-sunk'}`} onClick={() => set(l)}>
      <Avatar child={child} look={{ ...look, ...l }} size={56} ring={false} />
      <span className="text-[11px] font-medium text-muted leading-tight text-center">{label}</span>
    </button>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`הדמות של ${child.name || 'הילד/ה'}`}
      footer={
        <button
          className="btn-primary w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(look);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'שומר…' : 'שמירת הדמות'}
        </button>
      }
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <Avatar child={child} look={look} size={150} state={preview} />
          <button type="button" className="icon-btn absolute -bottom-1 -left-1 !bg-card shadow-soft" onClick={() => setLook(randomLook(look))} aria-label="הפתעה">
            <Shuffle size={18} />
          </button>
        </div>
        <div className="segmented mt-4 w-full max-w-xs !p-0.5">
          {(
            [
              ['idle', 'רגיל'],
              ['wave', 'מנופף/ת'],
              ['sleep', 'ישן/ה'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" className={`segmented-item !h-8 !text-xs ${preview === k ? 'on' : ''}`} onClick={() => setPreview(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-5 -mx-1 px-1">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" className={`chip shrink-0 ${tab === k ? 'chip-on' : ''}`} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3 pb-2">
        {tab === 'animal' && ANIMALS.map((a) => mini({ animal: a.key }, a.key, a.label, look.animal === a.key))}
        {tab === 'skin' && SKINS.map((s, i) => mini({ skin: i }, s, `גוון ${i + 1}`, look.skin === i))}
        {tab === 'face' &&
          [
            ...FACES.map((f) => mini({ face: f.key }, f.key, f.label, (look.face ?? 'round') === f.key)),
            ...MOUTHS.map((m) => mini({ mouth: m.key }, m.key, m.label, (look.mouth ?? 'smile') === m.key)),
          ]}
        {tab === 'print' && PRINTS.map((x) => mini({ print: x.key }, x.key, x.label, (look.print ?? 'none') === x.key))}
        {tab === 'toy' && TOYS.map((x) => mini({ toy: x.key }, x.key, x.label, (look.toy ?? 'none') === x.key))}
        {tab === 'hair' && HAIR_STYLES.map((h) => mini({ hair: h.key }, h.key, h.label, look.hair === h.key))}
        {tab === 'hairColor' && HAIR_COLORS.map((c, i) => mini({ hairColor: i }, c, HAIR_COLOR_LABELS[i], look.hairColor === i))}
        {tab === 'eyes' &&
          [
            ...(['round', 'sparkle'] as const).map((e) => mini({ eyes: e }, e, e === 'round' ? 'עגולות' : 'נוצצות', look.eyes === e)),
            ...EYE_COLORS.map((c, i) => mini({ eyeColor: i }, c, EYE_COLOR_LABELS[i], look.eyeColor === i)),
          ]}
        {tab === 'extras' &&
          EXTRAS.map((x) => {
            const on = look.extras.includes(x.key);
            return (
              <button
                key={x.key}
                type="button"
                className={`flex flex-col items-center gap-1 rounded-2xl p-1.5 transition active:scale-95 ${on ? 'bg-brandsoft ring-2 ring-brand' : 'bg-sunk'}`}
                onClick={() => set({ extras: on ? look.extras.filter((e) => e !== x.key) : [...look.extras, x.key] })}
              >
                <Avatar child={child} look={{ ...look, extras: on ? look.extras : [...look.extras, x.key] }} size={56} ring={false} />
                <span className="text-[11px] font-medium text-muted">{x.label}</span>
              </button>
            );
          })}
      </div>
    </Sheet>
  );
}

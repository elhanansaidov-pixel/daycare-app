import { useState } from 'react';
import type { Child, DayEvent, Photo } from '../lib/types';
import { DIAPER_LABEL, FEED_LABEL, durationLabel, eventTitle, hhmm, moodFor, portionFor, type IconKey } from '../lib/util';
import { Bubble } from './Icon';
import { useData } from '../hooks/useData';
import EventSheet from './EventSheet';
import PhotoViewer from './PhotoViewer';

export function describe(e: DayEvent, c: Child): { icon: IconKey; emoji?: string; title: string; detail: string } {
  const t = eventTitle(e);
  const w = (boy: string, girl: string) => (c.gender === 'girl' ? girl : boy);
  switch (e.type) {
    case 'diaper':
      return { icon: t.icon, title: `החלפת חיתול · ${DIAPER_LABEL[e.subtype ?? 'pee']}`, detail: e.data.texture ? `מרקם: ${e.data.texture}` : '' };
    case 'feed': {
      const parts = [e.data.amount_ml ? `${e.data.amount_ml} מ״ל` : '', e.data.food ?? '', portionFor(c, e.data.portion)].filter(Boolean);
      return { icon: t.icon, title: FEED_LABEL[e.subtype ?? 'meal'] ?? 'אוכל', detail: parts.join(' · ') };
    }
    case 'sleep':
      return {
        icon: 'sleep',
        title: e.ended_at ? `שינה ${hhmm(e.started_at)}–${hhmm(e.ended_at)}` : w('ישן עכשיו', 'ישנה עכשיו'),
        detail: e.ended_at ? durationLabel(new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) : '',
      };
    case 'attendance':
      return { icon: t.icon, title: e.subtype === 'arrive' ? w('הגיע למשפחתון', 'הגיעה למשפחתון') : w('נאסף הביתה', 'נאספה הביתה'), detail: '' };
    case 'note':
      return { icon: t.icon, emoji: t.emoji, title: e.data.mood ? moodFor(c, e.data.mood).replace(/^\S+\s/, '') : 'הערה', detail: e.data.text ?? '' };
  }
}

type Item = { kind: 'event'; at: string; e: DayEvent } | { kind: 'photo'; at: string; p: Photo };

export default function Timeline({
  child,
  events,
  photos = [],
  day,
  compact,
  emptyText = 'עוד לא תועד כלום היום',
  readOnly: forceRO,
}: {
  child: Child;
  events: DayEvent[];
  photos?: Photo[];
  day?: Date;
  compact?: boolean;
  emptyText?: string;
  readOnly?: boolean;
}) {
  const ctx = useData();
  const readOnly = forceRO ?? ctx.readOnly;
  const [edit, setEdit] = useState<DayEvent | null>(null);
  const [view, setView] = useState<Photo | null>(null);
  const items: Item[] = [
    ...events.filter((e) => e.child_id === child.id).map((e) => ({ kind: 'event' as const, at: e.started_at, e })),
    ...photos.filter((p) => p.child_ids.includes(child.id)).map((p) => ({ kind: 'photo' as const, at: p.taken_at, p })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (!items.length)
    return (
      <div className="text-center py-10 text-muted">
        <span className="inline-grid place-items-center h-14 w-14 rounded-full bg-sunk mb-2">
          <Bubble k="note" size={36} />
        </span>
        <p>{emptyText}</p>
      </div>
    );

  return (
    <>
      <ol className="relative">
        <div className="absolute top-4 bottom-4 right-[4.62rem] w-0.5 rounded-full bg-line" aria-hidden />
        {items.map((it) => {
          if (it.kind === 'photo')
            return (
              <li key={it.p.id} className="relative flex gap-3 py-2">
                <time className="w-11 shrink-0 text-sm font-medium text-muted tabular-nums pt-2.5 text-left">{hhmm(it.at)}</time>
                <span className="relative z-10 rounded-full ring-4 ring-card bg-card"><Bubble k="photo" size={38} /></span>
                <button className="flex-1 text-right" onClick={() => setView(it.p)}>
                  {it.p.url ? (
                    <img src={it.p.url} alt={it.p.caption} className={`rounded-2xl object-cover w-full shadow-soft ${compact ? 'max-h-32' : 'max-h-60'}`} loading="lazy" />
                  ) : (
                    <div className="h-24 rounded-2xl bg-sunk" />
                  )}
                  {it.p.caption && <p className="text-sm mt-1">{it.p.caption}</p>}
                </button>
              </li>
            );
          const d = describe(it.e, child);
          const Tag = readOnly ? 'div' : 'button';
          return (
            <li key={it.e.id} className="relative">
              <Tag
                className="w-full flex items-start gap-3 py-2 text-right rounded-2xl transition-colors active:bg-sunk"
                {...(!readOnly && { onClick: () => setEdit(it.e) })}
              >
                <time className="w-11 shrink-0 text-sm font-medium text-muted tabular-nums pt-2.5 text-left">{hhmm(it.at)}</time>
                <span className="relative z-10 rounded-full ring-4 ring-card bg-card">
                  <Bubble k={d.icon} emoji={d.emoji} size={38} />
                </span>
                <div className="flex-1 min-w-0 pt-2">
                  <p className="font-semibold leading-tight">{d.title}</p>
                  {d.detail && <p className={`text-sm text-muted ${compact ? 'line-clamp-2' : ''}`}>{d.detail}</p>}
                </div>
              </Tag>
            </li>
          );
        })}
      </ol>
      {!readOnly && <EventSheet open={!!edit} onClose={() => setEdit(null)} kids={[child]} type={edit?.type ?? 'note'} existing={edit} day={day} />}
      <PhotoViewer photo={view} onClose={() => setView(null)} />
    </>
  );
}

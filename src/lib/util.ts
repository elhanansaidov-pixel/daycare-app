import { differenceInMonths, format, startOfDay, endOfDay } from 'date-fns';
import type { Child, DayEvent } from './types';

export const uid = () =>
  (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

export const hhmm = (iso: string | Date) => format(typeof iso === 'string' ? new Date(iso) : iso, 'HH:mm');

export const dayRange = (d: Date) => [startOfDay(d), endOfDay(d)] as const;

export const isoDay = (d: Date) => format(d, 'yyyy-MM-dd');

export function ageLabel(birth: string | null, now = new Date()): string {
  if (!birth) return '';
  const m = differenceInMonths(now, new Date(birth));
  if (m < 0) return '';
  if (m < 1) return 'פחות מחודש';
  if (m === 1) return 'חודש';
  if (m === 2) return 'חודשיים';
  if (m < 12) return `${m} חודשים`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  const yl = y === 1 ? 'שנה' : y === 2 ? 'שנתיים' : `${y} שנים`;
  if (r === 0) return yl;
  const rl = r === 1 ? 'חודש' : r === 2 ? 'חודשיים' : `${r} חודשים`;
  return `${yl} ו${rl}`;
}

/** "לפני 1:25" style compact duration. */
export function durationLabel(ms: number): string {
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 1) return 'עכשיו';
  if (min < 60) return `${min} דק׳`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ש׳ ${m} דק׳` : `${h} ש׳`;
}

export function clockDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export const childWord = (c: Child, boy: string, girl: string) => (c.gender === 'girl' ? girl : boy);

export const DIAPER_LABEL: Record<string, string> = { pee: 'פיפי', poop: 'קקי', both: 'פיפי + קקי' };
export const DIAPER_ICON: Record<string, string> = { pee: '💧', poop: '💩', both: '💧💩' };
export const FEED_LABEL: Record<string, string> = {
  bottle: 'בקבוק',
  porridge: 'דייסה',
  meal: 'ארוחה',
  snack: 'נשנוש',
  fruit: 'פרי',
};
export const FEED_ICON: Record<string, string> = { bottle: '🍼', porridge: '🥣', meal: '🍲', snack: '🍪', fruit: '🍌' };
export const PORTION_LABEL: Record<string, string> = { all: 'אכל/ה הכל', half: 'חצי', little: 'קצת', none: 'לא אכל/ה' };
export const MOODS: { key: string; icon: string; label: string }[] = [
  { key: 'happy', icon: '😄', label: 'שמח/ה' },
  { key: 'calm', icon: '😌', label: 'רגוע/ה' },
  { key: 'tired', icon: '🥱', label: 'עייף/ה' },
  { key: 'cranky', icon: '😣', label: 'עצבני/ת' },
  { key: 'sick', icon: '🤒', label: 'לא מרגיש/ה טוב' },
];
export const TEXTURES = ['רגיל', 'רך', 'נוזלי', 'קשה'];

export function portionFor(c: Child, p?: string) {
  if (!p) return '';
  const map: Record<string, [string, string]> = {
    all: ['אכל הכל', 'אכלה הכל'],
    half: ['אכל חצי', 'אכלה חצי'],
    little: ['אכל קצת', 'אכלה קצת'],
    none: ['לא אכל', 'לא אכלה'],
  };
  const v = map[p];
  return v ? childWord(c, v[0], v[1]) : '';
}

export function moodFor(c: Child, key?: string) {
  const m = MOODS.find((x) => x.key === key);
  if (!m) return '';
  return `${m.icon} ${m.label.replace('/ה', c.gender === 'girl' ? 'ה' : '').replace('/ת', c.gender === 'girl' ? 'ת' : '')}`;
}

export type IconKey =
  | 'pee' | 'poop' | 'both' | 'diaper'
  | 'bottle' | 'porridge' | 'meal' | 'snack' | 'fruit' | 'feed'
  | 'sleep' | 'wake' | 'arrive' | 'leave' | 'note' | 'photo';

export function eventTitle(e: DayEvent): { icon: IconKey; emoji?: string; title: string } {
  switch (e.type) {
    case 'diaper': {
      const k = (e.subtype ?? 'pee') as IconKey;
      return { icon: k in DIAPER_LABEL ? k : 'diaper', title: `חיתול · ${DIAPER_LABEL[e.subtype ?? 'pee'] ?? ''}` };
    }
    case 'feed': {
      const k = (e.subtype ?? 'meal') as IconKey;
      return { icon: k in FEED_LABEL ? k : 'feed', title: FEED_LABEL[e.subtype ?? 'meal'] ?? 'אוכל' };
    }
    case 'sleep':
      return { icon: 'sleep', title: 'שינה' };
    case 'attendance':
      return e.subtype === 'arrive' ? { icon: 'arrive', title: 'הגיע/ה' } : { icon: 'leave', title: 'נאסף/ה' };
    case 'note':
      return { icon: 'note', emoji: MOODS.find((m) => m.key === e.data.mood)?.icon, title: 'הערה' };
  }
}

/** Presence: last attendance event of the day decides. */
export function presence(events: DayEvent[]): 'in' | 'out' | 'none' {
  const att = events.filter((e) => e.type === 'attendance').sort((a, b) => a.started_at.localeCompare(b.started_at));
  const last = att[att.length - 1];
  if (!last) return 'none';
  return last.subtype === 'arrive' ? 'in' : 'out';
}

export const lastOf = (events: DayEvent[], type: DayEvent['type']) =>
  events
    .filter((e) => e.type === type)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];

export const openSleep = (events: DayEvent[]) => events.find((e) => e.type === 'sleep' && !e.ended_at);

export const CHILD_COLORS = ['#F59E8B', '#7CC6B6', '#F6C25B', '#9AA8F5', '#E89BD0', '#8CCB7E', '#F2A65A', '#6FB7E9'];
export const CHILD_EMOJIS = ['🦁', '🐰', '🦋', '🐻', '🐥', '🐳', '🦊', '🐼', '🐸', '🦄', '🐨', '🐞'];

export function waLink(phone: string, text: string) {
  let p = phone.replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  else if (p.startsWith('0')) p = '972' + p.slice(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export async function compressImage(file: Blob, max = 1280, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', quality));
}

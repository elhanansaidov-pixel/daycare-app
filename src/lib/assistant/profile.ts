// U2 learned profile: what the assistant learned about how she uses the app.
// Computed from the local usage log; synced to assistant_profile so it is the same on every device
// and the weekly summary can compare it week over week.
import type { SupabaseClient } from '@supabase/supabase-js';
import { onUsageFlushed, readUsage, type UsageEntry } from './usage';
import { faqById } from './faq';
import { tourById } from './tours';

export const TOPIC_LABEL: Record<string, string> = {
  arrive: 'סימון הגעה ואיסוף',
  diaper: 'חיתולים',
  feed: 'אוכל',
  sleep: 'שינה',
  note: 'הערות',
  photo: 'תמונות',
  multi: 'כמה ילדים יחד',
  summary: 'סיכום להורים',
  undo: 'ביטול רישום',
  child: 'יומן הילד ותיקונים',
  invite: 'הזמנת הורים',
  reminder: 'תזכורות',
  attendance: 'נוכחות',
  install: 'התקנה',
  settings: 'הגדרות',
  account: 'חשבון',
};

export const SCREEN_LABEL: Record<string, string> = {
  '/attendance': 'נוכחות',
  '/gallery': 'תמונות',
  '/summary': 'סיכום',
  '/settings': 'הגדרות',
};

export interface Profile {
  updated: string;
  learned: string[];
  struggling: string[];
  shortcuts: string[];
  usualHour: { feed?: number; sleep?: number };
  counts: Record<string, number>;
  undos7: Record<string, number>;
  asks7: Record<string, number>;
  misses: string[];
}

const DAY = 864e5;
const TYPE_TOPIC: Record<string, string> = { attendance: 'arrive', diaper: 'diaper', feed: 'feed', sleep: 'sleep', note: 'note', photo: 'photo', summary: 'summary', edit: 'child', delete: 'child' };
const MULTI_TYPES = new Set(['attendance', 'diaper', 'feed', 'sleep', 'note']);

/** Action detail format: "<type>:<subtype>|<children count>". */
export function parseAction(detail: string) {
  const [head, n] = detail.split('|');
  const [type, sub = ''] = head.split(':');
  return { type, sub, n: Number(n) || 1, topic: TYPE_TOPIC[type] ?? type };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : undefined;
};
const hourOf = (t: number) => {
  const d = new Date(t);
  return Math.round((d.getHours() + d.getMinutes() / 60) * 2) / 2;
};

export function computeProfile(log: UsageEntry[] = readUsage(), now = Date.now()): Profile {
  const streak: Record<string, number> = {};
  const counts: Record<string, number> = {};
  const undos7: Record<string, number> = {};
  const asks7: Record<string, number> = {};
  const quits7: Record<string, number> = {};
  const screens: Record<string, number> = {};
  const hours: { feed: number[]; sleep: number[] } = { feed: [], sleep: [] };
  const misses: string[] = [];
  const inc = (m: Record<string, number>, k: string) => (m[k] = (m[k] ?? 0) + 1);

  for (const e of [...log].sort((a, b) => a.at - b.at)) {
    const recent = now - e.at < 7 * DAY;
    if (now - e.at > 30 * DAY) continue;
    if (e.kind === 'action') {
      const a = parseAction(e.detail);
      inc(counts, a.topic);
      inc(streak, a.topic);
      if (a.n > 1 && MULTI_TYPES.has(a.type)) {
        inc(counts, 'multi');
        inc(streak, 'multi');
      }
      if (a.type === 'edit' || a.type === 'delete') inc(streak, 'child');
      if (now - e.at < 14 * DAY && a.type === 'feed') hours.feed.push(hourOf(e.at));
      if (now - e.at < 14 * DAY && a.type === 'sleep' && a.sub === 'start') hours.sleep.push(hourOf(e.at));
    } else if (e.kind === 'undo') {
      const topic = TYPE_TOPIC[e.detail] ?? e.detail;
      streak[topic] = 0;
      inc(streak, 'undo'); // she knows how to undo
      inc(counts, 'undo');
      if (recent) inc(undos7, topic);
    } else if (e.kind === 'help_q') {
      const f = faqById(e.detail.split('|')[0]);
      if (f) {
        streak[f.topic] = 0;
        if (recent) inc(asks7, f.topic);
      }
    } else if (e.kind === 'help_miss') {
      if (recent) misses.push(e.detail);
    } else if (e.kind === 'tour') {
      const [what, id] = e.detail.split(':');
      const t = tourById(id);
      if (t && what === 'quit' && recent) inc(quits7, t.topic);
      if (t && what === 'done') quits7[t.topic] = 0;
    } else if (e.kind === 'screen') {
      if (SCREEN_LABEL[e.detail]) inc(screens, e.detail);
    }
  }

  const topics = new Set([...Object.keys(streak), ...Object.keys(undos7), ...Object.keys(asks7), ...Object.keys(quits7)]);
  const struggling = [...topics].filter((t) => (undos7[t] ?? 0) >= 3 || (asks7[t] ?? 0) >= 2 || (quits7[t] ?? 0) >= 2);
  const learned = [...topics].filter((t) => (streak[t] ?? 0) >= 3 && !struggling.includes(t));
  const shortcuts = Object.entries(screens)
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([p]) => p);

  return {
    updated: new Date(now).toISOString(),
    learned: learned.sort(),
    struggling: struggling.sort(),
    shortcuts,
    usualHour: {
      feed: hours.feed.length >= 3 ? median(hours.feed) : undefined,
      sleep: hours.sleep.length >= 3 ? median(hours.sleep) : undefined,
    },
    counts,
    undos7,
    asks7,
    misses: misses.slice(-10),
  };
}

let lastSync = 0;
onUsageFlushed(async (sb: SupabaseClient) => {
  if (Date.now() - lastSync < 60000) return;
  lastSync = Date.now();
  const { counts, learned, struggling, shortcuts, usualHour, undos7, asks7, misses, updated } = computeProfile();
  await sb
    .from('assistant_profile')
    .upsert({ profile: { counts, learned, struggling, shortcuts, usualHour, undos7, asks7, misses, updated }, updated_at: updated }, { onConflict: 'user_email' });
});

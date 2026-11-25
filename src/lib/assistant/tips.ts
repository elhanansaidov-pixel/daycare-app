// U4 proactive tips: simple rules over today's data and the learned profile.
import type { Child, DayEvent } from '../types';
import { presence } from '../util';
import { parseAction, type Profile } from './profile';
import type { UsageEntry } from './usage';
import { tourById } from './tours';
import { isDemo } from '../demo';

export interface Tip {
  id: string;
  text: string;
  topic: string;
  prio: number;
  tour?: string;
}

const DISMISSED = isDemo ? 'daycare.demo.tipsDismissed' : 'daycare.tipsDismissed';
const SEEN = isDemo ? 'daycare.demo.assistantSeen' : 'daycare.assistantSeen';

export function dismissedTips(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED) || '[]'));
  } catch {
    return new Set();
  }
}
export function dismissTip(id: string) {
  const s = dismissedTips();
  s.add(id);
  try {
    localStorage.setItem(DISMISSED, JSON.stringify([...s].slice(-200)));
  } catch {
    /* ignore */
  }
}
export const assistantSeen = () => {
  try {
    return !!localStorage.getItem(SEEN);
  } catch {
    return true;
  }
};
export const markAssistantSeen = () => {
  try {
    localStorage.setItem(SEEN, '1');
  } catch {
    /* ignore */
  }
};

const dateKey = (d: Date) => d.toISOString().slice(0, 10);
const weekKey = (d: Date) => {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  return dateKey(s);
};
const hhmm = (h: number) => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;
const list = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} ו${names[names.length - 1]}`);

export function computeTips(opts: { children: Child[]; today: DayEvent[]; log: UsageEntry[]; profile: Profile; now?: number; name?: string }): Tip[] {
  const { children, today, log, profile, name } = opts;
  const now = new Date(opts.now ?? Date.now());
  const hour = now.getHours() + now.getMinutes() / 60;
  const day = dateKey(now);
  const learned = new Set(profile.learned);
  const out: Tip[] = [];

  if (!assistantSeen())
    out.push({
      id: 'welcome',
      topic: 'account',
      prio: 100,
      text: `היי${name ? ' ' + name : ''}! אני העוזרת שלך ✨ אפשר לשאול אותי כל שאלה על היומן, ואני גם מראה איפה ללחוץ.`,
    });

  // Topics she struggles with get the guide offered again (once a week per topic).
  for (const t of profile.struggling) {
    const tr = TOPIC_TOUR[t] ? tourById(TOPIC_TOUR[t]) : undefined;
    if (tr) out.push({ id: `struggle-${t}-${weekKey(now)}`, topic: t, prio: 80, tour: tr.id, text: `נראה שהנושא „${tr.title}” עוד קצת מבלבל. רוצה שאראה לך שוב, צעד אחר צעד?` });
  }

  const todayLog = log.filter((e) => dateKey(new Date(e.at)) === day);
  const undosToday = todayLog.filter((e) => e.kind === 'undo').length;
  if (undosToday >= 3 && !learned.has('child'))
    out.push({ id: `undo-${day}`, topic: 'undo', prio: 70, tour: 'child', text: 'לחצת היום כמה פעמים על „ביטול”. אפשר גם לתקן רישום בלי למחוק אותו. להראות לך איך?' });

  const singles = todayLog.filter((e) => e.kind === 'action' && ['attendance', 'diaper', 'feed', 'sleep'].includes(parseAction(e.detail).type) && parseAction(e.detail).n === 1).length;
  if (singles >= 5 && !(profile.counts.multi > 0) && !learned.has('multi'))
    out.push({ id: 'multi', topic: 'multi', prio: 60, tour: 'multi', text: 'שמתי לב שאת רושמת לכל ילד בנפרד. אפשר לרשום לכמה ילדים בלחיצה אחת!' });

  // Today's data: present & awake children without food / sleep. Uses her usual hour when known.
  const byKid = (id: string) => today.filter((e) => e.child_id === id);
  const present = children.filter((c) => presence(byKid(c.id)) === 'in');
  const feedAt = (profile.usualHour.feed ?? 12) + 0.5;
  const noFood = present.filter((c) => !byKid(c.id).some((e) => e.type === 'feed'));
  if (hour >= feedAt && hour < 17 && noFood.length)
    out.push({ id: `feed-${day}`, topic: 'data', prio: 50, text: `השעה כבר ${hhmm(Math.floor(hour * 2) / 2)}, ועוד לא נרשם אוכל ל${list(noFood.map((c) => c.name))}.` });
  const sleepAt = (profile.usualHour.sleep ?? 13) + 0.5;
  if (hour >= sleepAt && hour < 17 && present.length >= 3 && !today.some((e) => e.type === 'sleep'))
    out.push({ id: `sleep-${day}`, topic: 'data', prio: 40, tour: learned.has('sleep') ? undefined : 'sleep', text: `${present.length} ילדים כאן, ועוד לא נרשמה היום שינה. לא לשכוח ללחוץ „שינה” כשהם נרדמים 😴` });

  const summaryWeek = log.some((e) => e.kind === 'action' && e.detail.startsWith('summary') && now.getTime() - e.at < 7 * 864e5);
  if (now.getDay() >= 4 && now.getDay() <= 5 && hour >= 13 && !summaryWeek)
    out.push({ id: `summary-${weekKey(now)}`, topic: 'summary', prio: 30, tour: learned.has('summary') ? undefined : 'summary', text: 'עוד לא נשלח סיכום להורים השבוע. ההורים מאוד אוהבים לקבל אותו 💌' });

  const actions = log.filter((e) => e.kind === 'action').length;
  if (actions >= 30 && !(profile.counts.photo > 0))
    out.push({ id: 'photo-intro', topic: 'photo', prio: 20, tour: 'photo', text: 'עוד לא הוספת תמונות. ההורים יראו אותן אצלם, וזה משמח אותם מאוד 📷' });

  const gone = dismissedTips();
  return out
    .filter((t) => !gone.has(t.id) && (t.topic === 'data' || t.id === 'welcome' || profile.struggling.includes(t.topic) || !learned.has(t.topic)))
    .map((t) => (profile.struggling.includes(t.topic) && t.prio < 80 ? { ...t, prio: t.prio + 15 } : t))
    .sort((a, b) => b.prio - a.prio);
}

/** Topic → the guide that teaches it. */
export const TOPIC_TOUR: Record<string, string> = {
  arrive: 'arrive',
  undo: 'undo',
  multi: 'multi',
  feed: 'feed',
  sleep: 'sleep',
  photo: 'photo',
  summary: 'summary',
  child: 'child',
  note: 'child',
  invite: 'invite',
  reminder: 'reminders',
  attendance: 'attendance',
  install: 'install',
};

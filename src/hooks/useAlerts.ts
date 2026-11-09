import { useEffect, useMemo, useRef } from 'react';
import { useData, useNow } from './useData';
import type { Child } from '../lib/types';
import { durationLabel, lastOf, openSleep, presence } from '../lib/util';

export interface ChildAlert {
  child: Child;
  kind: 'diaper' | 'feed';
  text: string;
}

/** Overdue diaper/feed for children who are currently present and awake. */
export function useOverdue(): ChildAlert[] {
  const { children, today } = useData();
  const now = useNow(60000);
  return useMemo(() => {
    const out: ChildAlert[] = [];
    for (const c of children) {
      const ev = today.filter((e) => e.child_id === c.id);
      if (presence(ev) !== 'in' || openSleep(ev)) continue;
      const arrived = lastOf(ev, 'attendance')!;
      const ref = (t: 'diaper' | 'feed') => new Date((lastOf(ev, t) ?? arrived).started_at).getTime();
      const d = now - ref('diaper');
      if (c.diaper_alert_min > 0 && d > c.diaper_alert_min * 60000)
        out.push({ child: c, kind: 'diaper', text: `${c.name}: לא הוחלף חיתול ${durationLabel(d)}` });
      const f = now - ref('feed');
      if (c.feed_alert_min > 0 && f > c.feed_alert_min * 60000)
        out.push({ child: c, kind: 'feed', text: `${c.name}: לא ${c.gender === 'girl' ? 'אכלה' : 'אכל'} ${durationLabel(f)}` });
    }
    return out;
  }, [children, today, now]);
}

const FIRED_KEY = 'daycare.firedReminders';

function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker?.getRegistration().then((reg) => {
        if (reg) reg.showNotification(title, { body, icon: 'icon-192.png', lang: 'he', dir: 'rtl' });
        else new Notification(title, { body });
      });
    }
  } catch {
    /* ignore */
  }
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
}

/** Fires reminders whose time has come today (while the app is open). Returns due-and-unacknowledged ones. */
export function useReminderTicker(onFire: (title: string) => void) {
  const { reminders, childById } = useData();
  const now = useNow(20000);
  const cb = useRef(onFire);
  cb.current = onFire;

  useEffect(() => {
    const d = new Date(now);
    const today = d.toDateString();
    let fired: Record<string, string> = {};
    try {
      fired = JSON.parse(localStorage.getItem(FIRED_KEY) || '{}');
    } catch {
      /* ignore */
    }
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    let changed = false;
    for (const r of reminders) {
      if (!r.active || !r.days.includes(d.getDay())) continue;
      if (r.time_of_day > hm) continue;
      // only fire within 30 minutes after due time
      const [h, m] = r.time_of_day.split(':').map(Number);
      const due = new Date(d);
      due.setHours(h, m, 0, 0);
      if (now - due.getTime() > 30 * 60000) continue;
      if (fired[r.id] === today) continue;
      fired[r.id] = today;
      changed = true;
      const who = r.child_id ? childById(r.child_id)?.name : '';
      const title = who ? `${who}: ${r.title}` : r.title;
      notify('⏰ תזכורת', title);
      cb.current(title);
    }
    if (changed) localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
  }, [now, reminders, childById]);
}

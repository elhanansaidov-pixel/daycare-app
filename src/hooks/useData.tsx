import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Store } from '../lib/store';
import { DEFAULT_SETTINGS } from '../lib/store';
import type { Child, DayEvent, Guardian, Photo, Reminder, Settings } from '../lib/types';
import { dayRange } from '../lib/util';

interface DataCtx {
  store: Store;
  readOnly: boolean;
  settings: Settings;
  allChildren: Child[];
  children: Child[];
  guardians: Guardian[];
  reminders: Reminder[];
  today: DayEvent[];
  todayPhotos: Photo[];
  loading: boolean;
  error: string | null;
  childById: (id: string) => Child | undefined;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ store, readOnly = false, children: kids }: { store: Store; readOnly?: boolean; children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [allChildren, setAll] = useState<Child[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [today, setToday] = useState<DayEvent[]>([]);
  const [todayPhotos, setTodayPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [from, to] = dayRange(new Date());
      const [s, c, g, r, e, p] = await Promise.all([
        store.getSettings(),
        store.listChildren(),
        store.listGuardians(),
        store.listReminders(),
        store.listEvents(from, to),
        store.listPhotos(from, to),
      ]);
      setSettings(s);
      setAll(c);
      setGuardians(g);
      setReminders(r);
      setToday(e);
      setTodayPhotos(p);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    load();
    const off = store.subscribe(load);
    // refresh at midnight / when returning to the app
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      off();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [store, load]);

  const value = useMemo<DataCtx>(() => {
    const children = allChildren.filter((c) => c.active);
    return {
      store,
      readOnly,
      settings,
      allChildren,
      children,
      guardians,
      reminders,
      today,
      todayPhotos,
      loading,
      error,
      childById: (id) => allChildren.find((c) => c.id === id),
    };
  }, [store, readOnly, settings, allChildren, guardians, reminders, today, todayPhotos, loading, error]);

  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData outside provider');
  return v;
}

/** Events + photos for an arbitrary day (re-fetches on data changes). */
export function useDay(date: Date) {
  const { store } = useData();
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const key = date.toDateString();
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [from, to] = dayRange(date);
      const [e, p] = await Promise.all([store.listEvents(from, to), store.listPhotos(from, to)]);
      if (alive) {
        setEvents(e);
        setPhotos(p);
      }
    };
    load();
    const off = store.subscribe(load);
    return () => {
      alive = false;
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, key]);
  return { events, photos };
}

/** Re-render every `ms` milliseconds. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

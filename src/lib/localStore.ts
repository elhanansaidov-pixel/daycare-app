import type { Store } from './store';
import { DEFAULT_SETTINGS, SEED_CHILDREN } from './store';
import type { Child, DayEvent, Guardian, Photo, Reminder, Settings } from './types';
import { uid } from './util';

const K = 'daycare.v1.';
const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(K + k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const write = (k: string, v: unknown) => localStorage.setItem(K + k, JSON.stringify(v));

// --- tiny IndexedDB blob store for photos ---
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open('daycare-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('blobs');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbOp<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await idb();
  return new Promise((res, rej) => {
    const req = fn(db.transaction('blobs', mode).objectStore('blobs'));
    req.onsuccess = () => res(req.result as T);
    req.onerror = () => rej(req.error);
  });
}

const urlCache = new Map<string, string>();

export function createLocalStore(): Store {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  window.addEventListener('storage', (e) => e.key?.startsWith(K) && emit());

  if (!localStorage.getItem(K + 'children')) {
    const kids: Child[] = SEED_CHILDREN.map((c, i) => ({
      ...c,
      id: uid(),
      birth_date: null,
      allergies: '',
      medications: '',
      notes: '',
      diaper_alert_min: 180,
      feed_alert_min: 240,
      active: true,
      sort: i,
    }));
    write('children', kids);
  }

  const upsert = <T extends { id: string }>(key: string, item: T) => {
    const all = read<T[]>(key, []);
    const i = all.findIndex((x) => x.id === item.id);
    if (i >= 0) all[i] = item;
    else all.push(item);
    write(key, all);
    emit();
    return item;
  };
  const remove = (key: string, id: string) => {
    write(
      key,
      read<{ id: string }[]>(key, []).filter((x) => x.id !== id),
    );
    emit();
  };

  return {
    mode: 'local',
    async getSettings() {
      return read<Settings>('settings', DEFAULT_SETTINGS);
    },
    async saveSettings(s) {
      write('settings', s);
      emit();
    },
    async listChildren() {
      return read<Child[]>('children', []).sort((a, b) => a.sort - b.sort);
    },
    async saveChild(c) {
      return upsert('children', c);
    },
    async listGuardians() {
      return read<Guardian[]>('guardians', []);
    },
    async saveGuardian(g) {
      return upsert('guardians', g);
    },
    async deleteGuardian(id) {
      remove('guardians', id);
    },
    async listEvents(from, to) {
      const f = from.toISOString();
      const t = to.toISOString();
      return read<DayEvent[]>('events', []).filter((e) => e.started_at >= f && e.started_at <= t);
    },
    async addEvents(list) {
      const all = read<DayEvent[]>('events', []);
      const now = new Date().toISOString();
      const created = list.map((e) => ({ ...e, id: uid(), created_at: now }));
      write('events', [...all, ...created]);
      emit();
      return created;
    },
    async updateEvent(id, patch) {
      write(
        'events',
        read<DayEvent[]>('events', []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
      emit();
    },
    async deleteEvent(id) {
      remove('events', id);
    },
    async listPhotos(from, to) {
      const f = from.toISOString();
      const t = to.toISOString();
      const list = read<Photo[]>('photos', []).filter((p) => p.taken_at >= f && p.taken_at <= t);
      for (const p of list) {
        if (!urlCache.has(p.id)) {
          const blob = await idbOp<Blob | undefined>('readonly', (s) => s.get(p.id)).catch(() => undefined);
          if (blob) urlCache.set(p.id, URL.createObjectURL(blob));
        }
        p.url = urlCache.get(p.id);
      }
      return list.sort((a, b) => b.taken_at.localeCompare(a.taken_at));
    },
    async addPhoto(blob, childIds, caption) {
      const id = uid();
      await idbOp('readwrite', (s) => s.put(blob, id));
      const p: Photo = { id, storage_path: id, caption, taken_at: new Date().toISOString(), child_ids: childIds };
      upsert('photos', p);
      return p;
    },
    async deletePhoto(p) {
      await idbOp('readwrite', (s) => s.delete(p.id)).catch(() => undefined);
      remove('photos', p.id);
    },
    async listReminders() {
      return read<Reminder[]>('reminders', []);
    },
    async saveReminder(r) {
      return upsert('reminders', r);
    },
    async deleteReminder(id) {
      remove('reminders', id);
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

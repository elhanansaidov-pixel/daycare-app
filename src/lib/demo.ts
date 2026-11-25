// Demo mode (…/?demo=1#/): the full caregiver app on sample data stored only in this browser.
// Never connects to Supabase, so nothing here reaches the real daycare journal.
import type { Store } from './store';
import type { NewEvent } from './types';

export const isDemo = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');

const base = () => location.origin + location.pathname;
export const demoUrl = () => `${base()}?demo=1#/`;
export const exitDemo = () => location.replace(`${base()}#/settings`);

/** Wipes the demo's local data (sample children, events, photos, assistant memory) and starts over. */
export async function resetDemo() {
  for (const k of Object.keys(localStorage)) if (k.startsWith('daycare.v1.') || k.startsWith('daycare.demo.')) localStorage.removeItem(k);
  try {
    indexedDB.deleteDatabase('daycare-photos');
  } catch {
    /* ignore */
  }
  location.reload();
}

/** First visit: a morning that already started, so the screens and the assistant have something to show. */
export async function seedDemo(store: Store) {
  if (localStorage.getItem('daycare.demo.seeded')) return;
  localStorage.setItem('daycare.demo.seeded', '1');
  const kids = await store.listChildren();
  // times relative to now, so the demo looks like a normal day whenever it is opened
  const at = (minAgo: number) => new Date(Date.now() - minAgo * 60000).toISOString();
  const ev = (i: number, type: NewEvent['type'], subtype: string | null, t: string, data: NewEvent['data'] = {}): NewEvent => ({
    child_id: kids[i].id,
    type,
    subtype,
    data,
    started_at: t,
    ended_at: null,
  });
  if (kids.length < 4) return;
  await store.addEvents([
    ev(0, 'attendance', 'arrive', at(130)),
    ev(1, 'attendance', 'arrive', at(115)),
    ev(2, 'attendance', 'arrive', at(100)),
    ev(3, 'attendance', 'arrive', at(90)),
    ev(0, 'feed', 'porridge', at(60), { portion: 'all' }),
    ev(1, 'diaper', 'pee', at(40)),
    ev(0, 'diaper', 'pee', at(35)),
    ev(3, 'feed', 'meal', at(30), { portion: 'half' }),
    ev(2, 'diaper', 'poop', at(20)),
    ev(3, 'diaper', 'pee', at(15)),
    ev(2, 'feed', 'bottle', at(25), { amount_ml: 150, portion: 'all' }),
    ev(1, 'feed', 'snack', at(10), { portion: 'all' }),
  ]);
}

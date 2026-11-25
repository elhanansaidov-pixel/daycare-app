// U4 usage log: what the caregiver does in the app, so the assistant can learn her habits.
// Only action types and counts are recorded – never child names or event content.
import type { SupabaseClient } from '@supabase/supabase-js';
import { isDemo } from '../demo';

export type UsageKind = 'screen' | 'action' | 'undo' | 'help_q' | 'help_miss' | 'tour' | 'tip';
export interface UsageEntry {
  kind: UsageKind;
  detail: string;
  at: number;
}

const KEY = isDemo ? 'daycare.demo.usage' : 'daycare.usage';
const MAX = 1500;
let sb: SupabaseClient | null = null;
let queue: UsageEntry[] = [];
let timer: number | undefined;
const profileHooks = new Set<(sb: SupabaseClient) => void>();

/** Cloud mode: queued entries are sent to the usage_log table. */
export function configureUsage(client: SupabaseClient | null) {
  sb = client;
}

/** Called after each successful flush (used to sync the learned profile). */
export function onUsageFlushed(fn: (sb: SupabaseClient) => void) {
  profileHooks.add(fn);
}

export function readUsage(): UsageEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function track(kind: UsageKind, detail = '') {
  const e: UsageEntry = { kind, detail: detail.slice(0, 200), at: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify([...readUsage(), e].slice(-MAX)));
  } catch {
    /* storage full or blocked – keep going */
  }
  if (sb) {
    queue.push(e);
    window.clearTimeout(timer);
    timer = window.setTimeout(flush, 8000);
  }
  window.dispatchEvent(new Event('usage-changed'));
}

async function flush() {
  if (!sb || !queue.length) return;
  const batch = queue.splice(0, 100);
  const { error } = await sb.from('usage_log').insert(batch.map((e) => ({ kind: e.kind, detail: e.detail, at: new Date(e.at).toISOString() })));
  if (error) return; // table missing or offline: the local copy still drives tips; drop the batch
  const client = sb;
  profileHooks.forEach((fn) => fn(client));
  if (queue.length) timer = window.setTimeout(flush, 1000);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
}

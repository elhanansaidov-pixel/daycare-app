import type { SupabaseClient } from '@supabase/supabase-js';
import type { Store } from './store';
import { DEFAULT_SETTINGS } from './store';
import type { Child, DayEvent, Guardian, Photo, Reminder } from './types';
import { uid } from './util';

const BUCKET = 'photos';

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export function createSupabaseStore(sb: SupabaseClient): Store {
  const listeners = new Set<() => void>();
  let channel: ReturnType<SupabaseClient['channel']> | null = null;
  let timer: number | undefined;
  const emit = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => listeners.forEach((l) => l()), 150);
  };

  const ensureChannel = () => {
    if (channel) return;
    channel = sb.channel('daycare-changes');
    for (const table of ['events', 'photos', 'photo_children', 'children', 'guardians', 'reminders']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, emit);
    }
    channel.subscribe();
  };

  return {
    mode: 'cloud',
    async getSettings() {
      const r = await sb.from('settings').select('value').eq('id', 1).maybeSingle();
      return { ...DEFAULT_SETTINGS, ...((r.data?.value as object) ?? {}) };
    },
    async saveSettings(s) {
      check(await sb.from('settings').upsert({ id: 1, value: s }));
      emit();
    },
    async listChildren() {
      return check(await sb.from('children').select('*').order('sort')) as Child[];
    },
    async saveChild(c) {
      const r = check(await sb.from('children').upsert(c).select().single());
      emit();
      return r as Child;
    },
    async listGuardians() {
      return check(await sb.from('guardians').select('*')) as Guardian[];
    },
    async saveGuardian(g) {
      const r = check(await sb.from('guardians').upsert({ ...g, email: g.email.trim().toLowerCase() }).select().single());
      emit();
      return r as Guardian;
    },
    async deleteGuardian(id) {
      check(await sb.from('guardians').delete().eq('id', id));
      emit();
    },
    async listEvents(from, to) {
      return check(
        await sb
          .from('events')
          .select('*')
          .gte('started_at', from.toISOString())
          .lte('started_at', to.toISOString())
          .order('started_at'),
      ) as DayEvent[];
    },
    async addEvents(list) {
      const r = check(await sb.from('events').insert(list).select());
      emit();
      return r as DayEvent[];
    },
    async updateEvent(id, patch) {
      check(await sb.from('events').update(patch).eq('id', id));
      emit();
    },
    async deleteEvent(id) {
      check(await sb.from('events').delete().eq('id', id));
      emit();
    },
    async listPhotos(from, to) {
      const rows = check(
        await sb
          .from('photos')
          .select('*, photo_children(child_id)')
          .gte('taken_at', from.toISOString())
          .lte('taken_at', to.toISOString())
          .order('taken_at', { ascending: false }),
      ) as (Omit<Photo, 'child_ids'> & { photo_children: { child_id: string }[] })[];
      const photos: Photo[] = rows.map(({ photo_children, ...p }) => ({
        ...p,
        child_ids: photo_children.map((x) => x.child_id),
      }));
      if (photos.length) {
        const signed = await sb.storage.from(BUCKET).createSignedUrls(
          photos.map((p) => p.storage_path),
          60 * 60,
        );
        signed.data?.forEach((s, i) => (photos[i].url = s.signedUrl ?? undefined));
      }
      return photos;
    },
    async addPhoto(blob, childIds, caption) {
      const id = uid();
      const path = `${new Date().toISOString().slice(0, 10)}/${id}.jpg`;
      check(await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' }));
      const p = check(
        await sb.from('photos').insert({ id, storage_path: path, caption, taken_at: new Date().toISOString() }).select().single(),
      );
      if (childIds.length)
        check(await sb.from('photo_children').insert(childIds.map((child_id) => ({ photo_id: id, child_id }))));
      emit();
      return { ...(p as Omit<Photo, 'child_ids'>), child_ids: childIds };
    },
    async deletePhoto(p) {
      await sb.storage.from(BUCKET).remove([p.storage_path]);
      check(await sb.from('photos').delete().eq('id', p.id));
      emit();
    },
    async listReminders() {
      return check(await sb.from('reminders').select('*')) as Reminder[];
    },
    async saveReminder(r) {
      const res = check(await sb.from('reminders').upsert(r).select().single());
      emit();
      return res as Reminder;
    },
    async deleteReminder(id) {
      check(await sb.from('reminders').delete().eq('id', id));
      emit();
    },
    subscribe(cb) {
      ensureChannel();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

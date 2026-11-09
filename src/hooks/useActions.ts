import { useCallback } from 'react';
import { useData } from './useData';
import { useToast } from '../components/Toast';
import type { Child, DayEvent, NewEvent } from '../lib/types';
import { childWord, DIAPER_LABEL, FEED_LABEL, openSleep } from '../lib/util';

const names = (kids: Child[]) => (kids.length === 1 ? kids[0].name : `${kids.length} ילדים`);

export function useActions() {
  const { store, today } = useData();
  const toast = useToast();

  const log = useCallback(
    async (events: NewEvent[], text: string, icon: string) => {
      try {
        const created = await store.addEvents(events);
        toast({
          text,
          icon,
          undo: async () => {
            await Promise.all(created.map((e) => store.deleteEvent(e.id)));
            toast({ text: 'בוטל', icon: '↩️' });
          },
        });
        return created;
      } catch (e) {
        toast({ text: 'שגיאה בשמירה: ' + (e as Error).message, tone: 'error' });
        return [];
      }
    },
    [store, toast],
  );

  const now = () => new Date().toISOString();
  const base = (c: Child, type: DayEvent['type'], subtype: string | null, data: DayEvent['data'] = {}, at?: string): NewEvent => ({
    child_id: c.id,
    type,
    subtype,
    data,
    started_at: at ?? now(),
    ended_at: null,
  });

  return {
    diaper: (kids: Child[], subtype: 'pee' | 'poop' | 'both', data: DayEvent['data'] = {}, at?: string) =>
      log(kids.map((c) => base(c, 'diaper', subtype, data, at)), `${names(kids)} · ${DIAPER_LABEL[subtype]}`, subtype === 'poop' ? '💩' : '💧'),

    feed: (kids: Child[], subtype: string, data: DayEvent['data'] = {}, at?: string) =>
      log(
        kids.map((c) => base(c, 'feed', subtype, data, at)),
        `${names(kids)} · ${FEED_LABEL[subtype] ?? 'אוכל'}${data.amount_ml ? ` ${data.amount_ml} מ״ל` : ''}`,
        '🍽️',
      ),

    note: (kids: Child[], text: string, mood?: string) =>
      log(kids.map((c) => base(c, 'note', mood ?? null, { text, mood })), `${names(kids)} · הערה נשמרה`, '📝'),

    /** Toggle sleep: start if not sleeping, else wake up. */
    sleep: async (kids: Child[]) => {
      const starts: NewEvent[] = [];
      const ends: DayEvent[] = [];
      for (const c of kids) {
        const open = openSleep(today.filter((e) => e.child_id === c.id));
        if (open) ends.push(open);
        else starts.push(base(c, 'sleep', null));
      }
      if (ends.length) {
        const t = now();
        await Promise.all(ends.map((e) => store.updateEvent(e.id, { ended_at: t })));
        toast({
          text: kids.length === 1 ? `${kids[0].name} ${childWord(kids[0], 'התעורר', 'התעוררה')}` : 'התעוררו',
          icon: '🌤️',
          undo: async () => {
            await Promise.all(ends.map((e) => store.updateEvent(e.id, { ended_at: null })));
          },
        });
      }
      if (starts.length) {
        await log(starts, kids.length === 1 ? `${kids[0].name} ${childWord(kids[0], 'נרדם', 'נרדמה')}` : 'נרדמו', '😴');
      }
    },

    attendance: (kids: Child[], subtype: 'arrive' | 'leave') =>
      log(
        kids.map((c) => base(c, 'attendance', subtype)),
        kids.length === 1
          ? `${kids[0].name} ${subtype === 'arrive' ? childWord(kids[0], 'הגיע', 'הגיעה') : childWord(kids[0], 'נאסף', 'נאספה')}`
          : subtype === 'arrive'
            ? 'הגיעו'
            : 'נאספו',
        subtype === 'arrive' ? '👋' : '🏠',
      ),
  };
}

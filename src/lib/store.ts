import type { Child, DayEvent, Guardian, NewEvent, Photo, Reminder, Settings } from './types';

export interface Store {
  mode: 'local' | 'cloud';
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;

  listChildren(): Promise<Child[]>;
  saveChild(c: Child): Promise<Child>;

  listGuardians(): Promise<Guardian[]>;
  saveGuardian(g: Guardian): Promise<Guardian>;
  deleteGuardian(id: string): Promise<void>;

  listEvents(from: Date, to: Date): Promise<DayEvent[]>;
  addEvents(e: NewEvent[]): Promise<DayEvent[]>;
  updateEvent(id: string, patch: Partial<DayEvent>): Promise<void>;
  deleteEvent(id: string): Promise<void>;

  listPhotos(from: Date, to: Date): Promise<Photo[]>;
  addPhoto(blob: Blob, childIds: string[], caption: string): Promise<Photo>;
  deletePhoto(p: Photo): Promise<void>;

  listReminders(): Promise<Reminder[]>;
  saveReminder(r: Reminder): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;

  /** Called whenever data changes (locally or remotely). Returns unsubscribe. */
  subscribe(cb: () => void): () => void;
}

export const DEFAULT_SETTINGS: Settings = { daycare_name: 'המשפחתון', caregiver_name: '' };

export const SEED_CHILDREN: Pick<Child, 'name' | 'gender' | 'color' | 'emoji'>[] = [
  { name: 'כפיר', gender: 'boy', color: '#F59E8B', emoji: '🦁' },
  { name: 'ליבי', gender: 'boy', color: '#7CC6B6', emoji: '🐳' },
  { name: 'אור', gender: 'girl', color: '#F6C25B', emoji: '🐥' },
  { name: 'מיכל', gender: 'girl', color: '#E89BD0', emoji: '🦋' },
  { name: 'מיתר', gender: 'girl', color: '#9AA8F5', emoji: '🐰' },
  { name: 'נטע', gender: 'boy', color: '#8CCB7E', emoji: '🐻' },
];

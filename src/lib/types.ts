export type Gender = 'boy' | 'girl';

export interface Child {
  id: string;
  name: string;
  gender: Gender;
  birth_date: string | null; // yyyy-MM-dd
  color: string; // hex
  emoji: string;
  allergies: string;
  medications: string;
  notes: string;
  diaper_alert_min: number;
  feed_alert_min: number;
  active: boolean;
  sort: number;
  invite_code?: string;
}

export interface Guardian {
  id: string;
  child_id: string;
  name: string;
  relation: string; // אמא / אבא / ...
  phone: string;
  email: string;
}

export type EventType = 'diaper' | 'feed' | 'sleep' | 'note' | 'attendance';

export interface DayEvent {
  id: string;
  child_id: string;
  type: EventType;
  /**
   * diaper: pee | poop | both
   * feed: bottle | porridge | meal | snack | fruit
   * attendance: arrive | leave
   * note: mood key or null
   */
  subtype: string | null;
  data: {
    amount_ml?: number;
    portion?: 'all' | 'half' | 'little' | 'none';
    food?: string;
    texture?: string;
    text?: string;
    mood?: string;
  };
  started_at: string; // ISO
  ended_at: string | null; // sleep only
  created_at: string;
}

export interface Photo {
  id: string;
  storage_path: string;
  caption: string;
  taken_at: string;
  child_ids: string[];
  url?: string;
}

export interface Reminder {
  id: string;
  child_id: string | null; // null = all
  title: string;
  time_of_day: string; // HH:mm
  days: number[]; // 0=Sunday..6
  active: boolean;
}

export interface Settings {
  daycare_name: string;
  caregiver_name: string;
}

export type NewEvent = Omit<DayEvent, 'id' | 'created_at'>;

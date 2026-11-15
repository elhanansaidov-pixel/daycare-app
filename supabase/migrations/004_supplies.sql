-- ============================================================
--  שלב 4: ״מה חסר״ – רשימת דברים שההורים צריכים להביא
--  רשימה לכל ילד: [{ "id", "text", "added_at" }]
--  רק המטפלת כותבת (children_write). ההורים קוראים (children_read).
--  להריץ פעם אחת ב-Supabase > SQL Editor
-- ============================================================
alter table public.children add column if not exists supplies jsonb not null default '[]'::jsonb;

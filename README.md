# 🧸 היומן של המשפחתון

אפליקציית ווב לטלפון (PWA) לניהול יומי של משפחתון: חיתולים, אוכל, שינה, נוכחות, תמונות, תזכורות, כרטיס ילד, סיכום יומי להורים בוואטסאפ ופורטל הורים.

## הרצה מקומית
```bash
npm install
npm run dev
```
בלי קובץ `.env` האפליקציה עובדת **במצב מקומי**: הנתונים נשמרים רק בדפדפן של המכשיר. זה טוב לניסיון.

## חיבור לענן (Supabase), פעם אחת
1. פותחים חשבון **חדש** ב-[supabase.com](https://supabase.com) ויוצרים פרויקט חדש (אזור: Frankfurt / eu-central-1).
2. **SQL Editor**: מדביקים את התוכן של `supabase/migrations/001_init.sql`, מחליפים בשורה האחרונה את `MOM_EMAIL@example.com` במייל של המטפלת, ומריצים.
3. **Authentication → Emails → Magic Link**: כדי שיישלח קוד ולא רק קישור, מוסיפים לתבנית את השורה:
   `<h2>{{ .Token }}</h2>`
4. **Authentication → URL Configuration**: ב-Site URL שמים את כתובת האתר (למשל `https://USER.github.io/daycare-app/`).
5. **Project Settings → API**: מעתיקים את `Project URL` ואת `anon public key` ל-`.env`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

> שירות המייל המובנה של Supabase מוגבל לכמה מיילים בשעה. אם יש הרבה הורים, מומלץ לחבר SMTP חינמי (למשל Resend או Brevo) תחת Authentication → SMTP.

## פריסה ל-GitHub Pages
1. דוחפים את הקוד לריפו ב-GitHub (ענף `main`).
2. **Settings → Pages → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions**: מוסיפים את `VITE_SUPABASE_URL` ואת `VITE_SUPABASE_ANON_KEY`.
4. כל push ל-`main` מפרסם גרסה חדשה בכתובת `https://USER.github.io/REPO/`.

## הרשאות
- **מטפלת**: מי שהמייל שלה רשום בטבלה `staff_emails`. מקבלת גישה מלאה.
- **הורה**: כל מייל שרשום בכרטיס של ילד (אנשי קשר). ההורה רואה רק את הילד שלו, בקריאה בלבד, כולל התמונות שתויג בהן.
- ההרשאות נאכפות בבסיס הנתונים עצמו באמצעות RLS.

## מבנה
- `src/lib/store.ts`: ממשק הנתונים. יש לו שני מימושים: `localStore.ts` (מקומי) ו-`supabaseStore.ts` (ענן).
- `src/pages/`: הלוח הראשי, ילד, נוכחות, תמונות, סיכום, הגדרות ופורטל הורים.
- `supabase/migrations/001_init.sql`: טבלאות, RLS, bucket לתמונות, realtime ו-6 הילדים.

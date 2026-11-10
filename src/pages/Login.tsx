import { useState } from 'react';
import { sendCode, signInWithGoogle, verifyCode } from '../lib/auth';
import Logo from '../components/Logo';
import { APP_NAME } from '../lib/brand';
import { ArrowRight, Heart, Mail } from 'lucide-react';

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Login({ invited }: { invited?: boolean }) {
  const [mode, setMode] = useState<'google' | 'email' | 'code'>('google');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function google() {
    setErr('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      setErr('הכניסה עם Google לא הצליחה. נסו שוב.');
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'email') {
        await sendCode(email);
        setMode('code');
      } else {
        await verifyCode(email, code);
      }
    } catch (e) {
      console.error(e);
      setErr(mode === 'email' ? 'לא הצלחנו לשלוח מייל. נסו שוב בעוד כמה דקות.' : 'הקוד שגוי או שפג תוקפו.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen grid place-items-center p-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brandsoft via-bg to-bg" />
      <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-brand/15 blur-3xl -z-10" />
      <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl -z-10" />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center anim-rise">
          <Logo size={92} className="mx-auto drop-shadow-md" />
          <h1 className="text-[26px] font-extrabold tracking-tight mt-4">{APP_NAME}</h1>
          <p className="text-muted mt-1.5">
            {invited ? (
              <>
                הוזמנתם לצפות ביומן של הילד/ה <Heart size={14} className="inline text-brand fill-brand -mt-0.5" />
                <br />
                התחברו כדי להמשיך
              </>
            ) : (
              'חיתולים, אוכל, שינה ותמונות, במקום אחד'
            )}
          </p>
        </div>
      <div className="card p-6 space-y-5 anim-rise" style={{ animationDelay: '80ms' }}>

        {mode === 'google' ? (
          <>
            <button
              className="btn w-full text-[17px] bg-white text-[#1f1f1f] border border-[#dadce0] shadow-soft !min-h-[56px] hover:bg-[#f8f9fa]"
              onClick={google}
              disabled={busy}
            >
              <GoogleLogo />
              {busy ? 'מעביר ל-Google…' : 'התחברות עם Google'}
            </button>
            {err && <p className="text-danger text-sm text-center">{err}</p>}
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> או <span className="h-px flex-1 bg-line" />
            </div>
            <button className="btn-ghost w-full !min-h-[44px] text-sm" onClick={() => setMode('email')}>
              <Mail size={16} /> כניסה עם מייל
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === 'email' ? (
              <input className="input text-center" type="email" dir="ltr" autoFocus required placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            ) : (
              <>
                <p className="text-sm text-center">שלחנו מייל ל-{email}. אפשר ללחוץ על הקישור שבמייל, או להקליד כאן את הקוד אם הוא מופיע.</p>
                <input
                  className="input text-center text-2xl tracking-[.5em] font-bold"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  dir="ltr"
                />
              </>
            )}
            {err && <p className="text-danger text-sm text-center">{err}</p>}
            <button className="btn-primary w-full" disabled={busy || (mode === 'code' && code.length < 6)}>
              {busy ? '...' : mode === 'email' ? 'שליחת מייל כניסה' : 'כניסה'}
            </button>
            <button type="button" className="w-full text-sm text-muted inline-flex items-center justify-center gap-1" onClick={() => (setMode('google'), setCode(''), setErr(''))}>
              <ArrowRight size={15} /> חזרה לכניסה עם Google
            </button>
          </form>
        )}
      </div>
      <p className="text-center text-xs text-muted">
        <a href="privacy.html" className="underline underline-offset-4">מדיניות פרטיות</a>
      </p>
      </div>
    </div>
  );
}

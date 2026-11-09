import { useState } from 'react';
import { sendCode, verifyCode } from '../lib/auth';

export default function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (step === 'email') {
        await sendCode(email);
        setStep('code');
      } else {
        await verifyCode(email, code);
        onDone();
      }
    } catch (e) {
      setErr(step === 'email' ? 'לא הצלחנו לשלוח קוד. בדקו את כתובת המייל.' : 'הקוד שגוי או שפג תוקפו.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-b from-brand/20 to-bg">
      <form onSubmit={submit} className="card w-full max-w-sm p-6 space-y-4 anim-pop">
        <div className="text-center">
          <div className="text-6xl mb-2">🧸</div>
          <h1 className="text-2xl font-extrabold">היומן של המשפחתון</h1>
          <p className="text-muted text-sm mt-1">{step === 'email' ? 'כניסה עם קוד חד-פעמי במייל' : `שלחנו קוד ל-${email}`}</p>
        </div>
        {step === 'email' ? (
          <input className="input text-center" type="email" dir="ltr" autoFocus required placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        ) : (
          <input
            className="input text-center text-2xl tracking-[.5em] font-bold"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={10}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            dir="ltr"
          />
        )}
        {err && <p className="text-danger text-sm text-center">{err}</p>}
        <button className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? '...' : step === 'email' ? 'שליחת קוד' : 'כניסה'}
        </button>
        {step === 'code' && (
          <button type="button" className="w-full text-sm text-muted" onClick={() => (setStep('email'), setCode(''))}>
            שינוי מייל
          </button>
        )}
      </form>
    </div>
  );
}

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface ToastOpts {
  text: string;
  icon?: string;
  undo?: () => void | Promise<void>;
  action?: { label: string; fn: () => void };
  tone?: 'default' | 'error';
}
const Ctx = createContext<(t: ToastOpts) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOpts & { key: number }) | null>(null);
  const timer = useRef<number>();
  const show = useCallback((t: ToastOpts) => {
    window.clearTimeout(timer.current);
    setToast({ ...t, key: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), t.undo || t.action ? 5000 : 2600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 pointer-events-none" role="status" aria-live="polite">
          <div
            key={toast.key}
            className={`anim-pop pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift max-w-md w-full ${
              toast.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-bg'
            }`}
          >
            {toast.icon && <span className="text-xl">{toast.icon}</span>}
            <span className="flex-1 font-medium">{toast.text}</span>
            {toast.action && (
              <button
                className="font-bold underline underline-offset-4 px-1"
                onClick={() => {
                  toast.action!.fn();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
            {toast.undo && (
              <button
                className="font-bold rounded-xl bg-white/15 px-3 py-1.5"
                onClick={async () => {
                  setToast(null);
                  await toast.undo!();
                }}
              >
                ביטול
              </button>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

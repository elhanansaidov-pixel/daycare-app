import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] anim-fade" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card rounded-t-4xl sm:rounded-4xl shadow-lift anim-up border-t border-line/70 max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-line" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="icon-btn" aria-label="סגירה">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-4 flex-1">{children}</div>
        {footer && <div className="px-5 pt-2 pb-4 safe-bottom border-t border-line">{footer}</div>}
      </div>
    </div>
  );
}

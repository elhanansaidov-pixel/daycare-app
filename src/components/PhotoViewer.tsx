import type { Photo } from '../lib/types';
import { useData } from '../hooks/useData';
import { hhmm } from '../lib/util';
import { format } from 'date-fns';

export default function PhotoViewer({ photo, onClose, onDelete }: { photo: Photo | null; onClose: () => void; onDelete?: (p: Photo) => void }) {
  const { childById } = useData();
  if (!photo) return null;
  const names = photo.child_ids.map((id) => childById(id)?.name).filter(Boolean).join(', ');

  async function share() {
    if (!photo?.url) return;
    try {
      const blob = await (await fetch(photo.url)).blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: photo.caption || names });
      else {
        const a = document.createElement('a');
        a.href = photo.url;
        a.download = `photo-${format(new Date(photo.taken_at), 'yyyy-MM-dd-HHmm')}.jpg`;
        a.click();
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="fixed inset-0 z-[55] bg-black/95 flex flex-col anim-fade" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-3 text-white">
        <button className="h-11 w-11 rounded-full bg-white/10" onClick={onClose} aria-label="סגירה">
          ✕
        </button>
        <div className="text-center text-sm">
          <p className="font-semibold">{names || 'ללא תיוג'}</p>
          <p className="opacity-70">
            {format(new Date(photo.taken_at), 'dd/MM')} · {hhmm(photo.taken_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-11 px-3 rounded-full bg-white/10" onClick={share}>
            שיתוף
          </button>
          {onDelete && (
            <button className="h-11 w-11 rounded-full bg-white/10" onClick={() => onDelete(photo)} aria-label="מחיקה">
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 grid place-items-center p-2 min-h-0" onClick={onClose}>
        <img src={photo.url} alt={photo.caption} className="max-h-full max-w-full object-contain rounded-xl" />
      </div>
      {photo.caption && <p className="text-white text-center p-4 safe-bottom">{photo.caption}</p>}
    </div>
  );
}

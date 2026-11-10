import { useEffect, useRef, useState } from 'react';
import Sheet from './Sheet';
import Avatar from './Avatar';
import { useData } from '../hooks/useData';
import { useToast } from './Toast';
import { Camera, ImagePlus, X } from 'lucide-react';
import { Bubble } from './Icon';
import { compressImage } from '../lib/util';

/** Pick/take photos and tag children. `preselect` children are tagged by default. */
export default function PhotoSheet({ open, onClose, preselect = [] }: { open: boolean; onClose: () => void; preselect?: string[] }) {
  const { children, store } = useData();
  const toast = useToast();
  const [files, setFiles] = useState<{ blob: Blob; url: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTags(preselect);
      setCaption('');
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onPick(list: FileList | null) {
    if (!list) return;
    const out = await Promise.all(
      Array.from(list).map(async (f) => {
        const blob = await compressImage(f);
        return { blob, url: URL.createObjectURL(blob) };
      }),
    );
    setFiles((prev) => [...prev, ...out]);
  }

  async function save() {
    setBusy(true);
    try {
      for (const f of files) await store.addPhoto(f.blob, tags, caption.trim());
      toast({ text: files.length === 1 ? 'התמונה נשמרה' : `${files.length} תמונות נשמרו`, icon: '📷' });
      onClose();
    } catch (e) {
      toast({ text: 'שגיאה בהעלאה: ' + (e as Error).message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={<span className="flex items-center gap-2.5"><Bubble k="photo" size={36} /> תמונות</span>}
      footer={
        <button className="btn-primary w-full text-lg" disabled={!files.length || busy} onClick={save}>
          {busy ? 'שומר…' : files.length ? `שמירת ${files.length} תמונות` : 'בחרו תמונות'}
        </button>
      }
    >
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPick(e.target.files)} />
      <input ref={galRef} type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost !min-h-[64px]" onClick={() => camRef.current?.click()}>
          <Camera size={20} /> צילום
        </button>
        <button className="btn-ghost !min-h-[64px]" onClick={() => galRef.current?.click()}>
          <ImagePlus size={20} /> מהגלריה
        </button>
      </div>
      {files.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {files.map((f, i) => (
            <div key={f.url} className="relative shrink-0">
              <img src={f.url} alt="" className="h-24 w-24 object-cover rounded-2xl" />
              <button
                className="absolute -top-1 -left-1 h-7 w-7 grid place-items-center rounded-full bg-ink text-bg shadow-soft"
                onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}
                aria-label="הסרה"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="label mt-5">מי בתמונה?</p>
      <div className="flex flex-wrap gap-2">
        {children.map((c) => {
          const on = tags.includes(c.id);
          return (
            <button
              key={c.id}
              className={`chip !pl-3 !pr-1 ${on ? 'chip-on' : ''}`}
              onClick={() => setTags((t) => (on ? t.filter((x) => x !== c.id) : [...t, c.id]))}
            >
              <Avatar child={c} size={30} /> {c.name}
            </button>
          );
        })}
        <button className="chip" onClick={() => setTags(tags.length === children.length ? [] : children.map((c) => c.id))}>
          {tags.length === children.length ? 'נקה' : 'כולם'}
        </button>
      </div>
      <label className="block mt-5">
        <span className="label">כיתוב (לא חובה)</span>
        <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="למשל: משחק בחול 🏖️" />
      </label>
    </Sheet>
  );
}

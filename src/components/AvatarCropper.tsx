import { useEffect, useRef, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import Sheet from './Sheet';

const VIEW = 260; // viewport size in CSS px
const OUT = 320; // output image size in px

/** Pick the face: drag to move, slider to zoom. Returns a square JPEG data URL. */
export default function AvatarCropper({ file, onClose, onDone }: { file: File | null; onClose: () => void; onDone: (dataUrl: string) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      setImg(im);
      setZoom(1);
      setPos({ x: 0, y: 0 });
    };
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // base scale: image covers the viewport
  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const scale = base * zoom;
  const w = img ? img.naturalWidth * scale : 0;
  const h = img ? img.naturalHeight * scale : 0;
  const clamp = (p: { x: number; y: number }) => ({
    x: Math.max(-(w - VIEW) / 2, Math.min((w - VIEW) / 2, p.x)),
    y: Math.max(-(h - VIEW) / 2, Math.min((h - VIEW) / 2, p.y)),
  });
  const p = clamp(pos);

  function save() {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d')!;
    const k = OUT / VIEW;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (VIEW / 2 - w / 2 + p.x) * k, (VIEW / 2 - h / 2 + p.y) * k, w * k, h * k);
    onDone(canvas.toDataURL('image/jpeg', 0.85));
  }

  return (
    <Sheet
      open={!!file}
      onClose={onClose}
      title="בחירת הפנים"
      footer={
        <button className="btn-primary w-full" disabled={!img} onClick={save}>
          שמירת התמונה
        </button>
      }
    >
      <p className="text-sm text-muted text-center mb-3">גררו את התמונה והגדילו עד שרק הפנים בתוך העיגול</p>
      <div
        className="relative mx-auto overflow-hidden rounded-full bg-sunk touch-none cursor-grab active:cursor-grabbing ring-4 ring-brand/40"
        style={{ width: VIEW, height: VIEW }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, px: p.x, py: p.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setPos(clamp({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }));
        }}
        onPointerUp={() => (drag.current = null)}
      >
        {img && (
          <img
            src={img.src}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none pointer-events-none"
            style={{ width: w, height: h, left: VIEW / 2 - w / 2 + p.x, top: VIEW / 2 - h / 2 + p.y }}
          />
        )}
      </div>
      <label className="flex items-center gap-3 mt-5 px-2">
        <ZoomIn size={20} className="text-muted shrink-0" />
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(+e.target.value)}
          className="flex-1 accent-[rgb(var(--brand))]"
          aria-label="הגדלה"
        />
      </label>
    </Sheet>
  );
}

import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { useData } from '../hooks/useData';
import { PageHeader } from '../components/Layout';
import PhotoSheet from '../components/PhotoSheet';
import PhotoViewer from '../components/PhotoViewer';
import Avatar from '../components/Avatar';
import { useToast } from '../components/Toast';
import { ImagePlus, Images } from 'lucide-react';
import type { Photo } from '../lib/types';

export function PhotoGrid({ childFilter, canDelete, days = 30 }: { childFilter: string | null; canDelete: boolean; days?: number }) {
  const { store } = useData();
  const toast = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [view, setView] = useState<Photo | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => store.listPhotos(subDays(new Date(), days), new Date()).then((p) => alive && setPhotos(p));
    load();
    const off = store.subscribe(load);
    return () => {
      alive = false;
      off();
    };
  }, [store, days]);

  const shown = photos.filter((p) => !childFilter || p.child_ids.includes(childFilter));
  const groups = new Map<string, Photo[]>();
  for (const p of shown) {
    const k = format(new Date(p.taken_at), 'yyyy-MM-dd');
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  if (!shown.length)
    return (
      <div className="card p-10 text-center text-muted">
        <span className="inline-grid place-items-center h-16 w-16 rounded-full bg-photo/15 text-photo mb-3">
          <Images size={28} />
        </span>
        <br />
        אין עדיין תמונות
      </div>
    );

  return (
    <>
      {[...groups.entries()].map(([k, list]) => (
        <section key={k}>
          <h3 className="font-bold text-muted text-sm mb-2 mt-5">{format(new Date(k + 'T12:00'), 'EEEE, d בMMMM', { locale: he })}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {list.map((p) => (
              <button key={p.id} className="aspect-square rounded-2xl overflow-hidden bg-sunk transition active:scale-95 hover:opacity-90" onClick={() => setView(p)}>
                {p.url && <img src={p.url} alt={p.caption} className="h-full w-full object-cover" loading="lazy" />}
              </button>
            ))}
          </div>
        </section>
      ))}
      <PhotoViewer
        photo={view}
        onClose={() => setView(null)}
        onDelete={
          canDelete
            ? async (p) => {
                if (!confirm('למחוק את התמונה?')) return;
                await store.deletePhoto(p);
                setView(null);
                toast({ text: 'התמונה נמחקה', icon: '🗑️' });
              }
            : undefined
        }
      />
    </>
  );
}

export default function Gallery() {
  const { children } = useData();
  const [filter, setFilter] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  return (
    <>
      <PageHeader sub="30 הימים האחרונים" title="תמונות" icon={Images}>
        <button className="btn-primary" onClick={() => setAdding(true)}>
          <ImagePlus size={18} /> הוספה
        </button>
      </PageHeader>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button className={`chip shrink-0 ${!filter ? 'chip-on' : ''}`} onClick={() => setFilter(null)}>
            כולם
          </button>
          {children.map((c) => (
            <button key={c.id} className={`chip shrink-0 !pr-1 ${filter === c.id ? 'chip-on' : ''}`} onClick={() => setFilter(c.id)}>
              <Avatar child={c} size={30} />
              {c.name}
            </button>
          ))}
        </div>
        <PhotoGrid childFilter={filter} canDelete />
      </div>
      <PhotoSheet open={adding} onClose={() => setAdding(false)} preselect={filter ? [filter] : []} />
    </>
  );
}

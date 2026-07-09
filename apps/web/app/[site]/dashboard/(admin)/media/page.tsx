'use client';

import { useMemo, useState } from 'react';
import { 
  Image as ImageIcon, Upload, Search, Filter, 
  Trash2, X, Check, Copy,
  Maximize2, RefreshCw
} from 'lucide-react';
import { api } from '../../../../../lib/api';
import { cn } from '../../../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaLibrary, type MediaItem } from '../../../../../hooks/useMediaLibrary';
import { useAuthStore } from '../../../../../store/authStore';

// ─── Component ───────────────────────────────────────────────────
export default function MediaManagerPage() {
  const { user } = useAuthStore();
  const { items, setItems, loading, hasMore, loadMore, refresh, total } = useMediaLibrary();
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [search, setSearch] = useState('');
  const restrictedToOwnMedia = user?.role === 'reporter' || user?.role === 'kontributor';

  const filteredMedia = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      (item.altText || '').toLowerCase().includes(keyword) ||
      (item.caption || '').toLowerCase().includes(keyword) ||
      (item.credit || '').toLowerCase().includes(keyword) ||
      (item.url.split('/').pop() || '').toLowerCase().includes(keyword)
    );
  }, [items, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setItems((prev) => [data.data, ...prev.filter((item) => item.id !== data.data.id)]);
    } catch (_e) {
      alert('Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus media ini secara permanen?')) return;
    try {
      await api.delete(`/media/${id}`);
      setItems(prev => prev.filter(m => m.id !== id));
      setSelectedMedia(null);
    } catch (_e) {
      alert('Gagal menghapus');
    }
  };

  const handleUpdateMetadata = async () => {
    if (!selectedMedia) return;
    try {
      const { data } = await api.patch(`/media/${selectedMedia.id}`, {
        altText: selectedMedia.altText,
        caption: selectedMedia.caption,
        credit: selectedMedia.credit
      });
      setItems(prev => prev.map(m => m.id === data.data.id ? data.data : m));
      setSelectedMedia(data.data);
    } catch (_e) {
      alert('Gagal update');
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-slate-900 dark:bg-white/10 flex items-center justify-center shadow-lg shrink-0">
            <ImageIcon size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-brand-black dark:text-white tracking-tight truncate">Media Manager</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Asset & Galeri Berita</p>
            {restrictedToOwnMedia && (
              <div className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/30">
                Mode: hanya media milik Anda
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label htmlFor="media-upload" className={cn(
            "flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 bg-brand-red text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-brand-red/20 cursor-pointer",
            uploading && "opacity-50 pointer-events-none"
          )}>
            {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Upload Baru'}
            <input id="media-upload" type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
          </label>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Cari media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-transparent rounded-xl text-xs outline-none focus:border-brand-red transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2.5 text-gray-400 hover:text-brand-black dark:hover:text-white transition-colors">
              <Filter size={18} />
           </button>
           <button onClick={refresh} className="p-2.5 text-gray-400 hover:text-brand-red transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span>{filteredMedia.length} media tampil</span>
        <span>Total tersinkron: {total}</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading ? (
          Array(15).fill(0).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))
        ) : filteredMedia.length === 0 ? (
          <div className="col-span-full py-32 text-center">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-200 dark:text-white/5" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {items.length === 0 ? 'Belum ada media diunggah' : 'Tidak ada media yang cocok'}
            </p>
          </div>
        ) : (
          filteredMedia.map((m) => (
            <motion.div
              layoutId={m.id}
              key={m.id}
              onClick={() => setSelectedMedia(m)}
              className={cn(
                "group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 cursor-pointer border-2 transition-all",
                selectedMedia?.id === m.id ? "border-brand-red ring-4 ring-brand-red/10" : "border-transparent hover:border-brand-red/30"
              )}
            >
              <img 
                src={m.thumbUrl} 
                alt={m.altText || ''} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-brand-red transition-colors">
                  <Maximize2 size={16} />
                </button>
              </div>
              {selectedMedia?.id === m.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-brand-red rounded-full flex items-center justify-center text-white">
                  <Check size={12} />
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Memuat...
              </>
            ) : (
              'Tampilkan Lebih Banyak'
            )}
          </button>
        </div>
      )}

      {/* Detail Sidebar / Modal Overlay */}
      <AnimatePresence>
        {selectedMedia && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[95vh] md:h-[80vh]"
            >
              {/* Preview Area */}
              <div className="h-[40vh] md:h-auto md:flex-1 bg-slate-100 dark:bg-black/40 relative flex items-center justify-center overflow-hidden p-4 md:p-6 shrink-0">
                <img
                  src={selectedMedia.url}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                  alt="Preview"
                />
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="absolute top-3 left-3 md:top-6 md:left-6 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg text-gray-500 hover:text-brand-red transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Info Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto flex-1 md:flex-initial">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Detail Media</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Informasi & Metadata</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Dimensi</p>
                      <p className="text-[10px] font-bold text-brand-black dark:text-white">{selectedMedia.width} × {selectedMedia.height}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Ukuran</p>
                      <p className="text-[10px] font-bold text-brand-black dark:text-white">{(selectedMedia.size/1024).toFixed(1)} KB</p>
                    </div>
                  </div>

                  {/* Metadata Form */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="media-alt-text" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Alt Text (SEO)</label>
                      <input
                        id="media-alt-text"
                        type="text"
                        value={selectedMedia.altText || ''}
                        onChange={(e) => setSelectedMedia({...selectedMedia, altText: e.target.value})}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-red rounded-xl text-xs outline-none transition-all"
                        placeholder="Deskripsi untuk tuna netra/SEO"
                      />
                    </div>
                    <div>
                      <label htmlFor="media-caption" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Caption</label>
                      <textarea
                        id="media-caption"
                        value={selectedMedia.caption || ''}
                        onChange={(e) => setSelectedMedia({...selectedMedia, caption: e.target.value})}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-red rounded-xl text-xs outline-none transition-all h-20 resize-none"
                        placeholder="Keterangan foto..."
                      />
                    </div>
                    <div>
                      <label htmlFor="media-credit" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Kredit / Sumber</label>
                      <input
                        id="media-credit"
                        type="text"
                        value={selectedMedia.credit || ''}
                        onChange={(e) => setSelectedMedia({...selectedMedia, credit: e.target.value})}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-red rounded-xl text-xs outline-none transition-all"
                        placeholder="Contoh: Reuters / John Doe"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4">
                    <button 
                      onClick={handleUpdateMetadata}
                      className="w-full py-3 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={14} /> Simpan Perubahan
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMedia.url);
                          alert('Link disalin');
                        }}
                        className="py-2.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Copy size={12} /> Salin URL
                      </button>
                      <button 
                        onClick={() => handleDelete(selectedMedia.id)}
                        className="py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

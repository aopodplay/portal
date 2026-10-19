// app/playlists/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import {
  Plus,
  ListMusic,
  Loader2,
  AlertCircle,
  Trash2,
  X,
} from 'lucide-react';
import { playlistApi, Playlist } from '@/lib/playlistApi';
import { resolveCoverUrl } from '@/lib/media';

export default function PlaylistsPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await playlistApi.list();
      setPlaylists(rows);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar playlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const p = await playlistApi.create({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
      });
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      router.push(`/playlists/${p.id}`);
    } catch (e: any) {
      alert(e?.message || 'Erro ao criar playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Apagar a playlist "${title}"?`)) return;
    try {
      await playlistApi.remove(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Erro ao apagar');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ListMusic size={28} className="text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">As minhas playlists</h1>
                <p className="text-purple-200 text-sm">
                  {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} /> Nova playlist
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-purple-500 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {!loading && !error && playlists.length === 0 && (
            <div className="text-center py-20">
              <ListMusic size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-4">
                Ainda não tens playlists.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
              >
                Criar a primeira
              </button>
            </div>
          )}

          {!loading && playlists.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map((p) => {
                const cover = resolveCoverUrl(p.cover_url ?? undefined);
                return (
                  <div key={p.id} className="group relative">
                    <Link href={`/playlists/${p.id}`} className="block">
                      <div className="relative rounded-lg overflow-hidden aspect-square mb-2 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                        {p.cover_url ? (
                          <img
                            src={cover}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <ListMusic size={48} className="text-white/40" />
                        )}
                      </div>
                      <h4 className="font-medium text-sm truncate text-white">
                        {p.title}
                      </h4>
                      <p className="text-gray-400 text-xs truncate">
                        {p.tracks_count ?? 0}{' '}
                        {(p.tracks_count ?? 0) === 1 ? 'música' : 'músicas'}
                      </p>
                    </Link>

                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      title="Apagar"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PlayerBar />

      {/* Modal criar */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Nova playlist</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-xs text-gray-400 mb-1">Título</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex.: Louvores de domingo"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white mb-3 focus:outline-none focus:border-purple-500"
              autoFocus
            />

            <label className="block text-xs text-gray-400 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Uma pequena descrição..."
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white mb-4 focus:outline-none focus:border-purple-500 resize-none"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-gray-300 hover:text-white text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-full text-sm font-medium flex items-center gap-2"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
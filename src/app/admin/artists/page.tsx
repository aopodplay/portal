'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import {
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  Camera,
  X,
  Search,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { resolveCoverUrl } from '@/lib/media';
import { catalogApi, followersLabel, type Artist } from '@/lib/catalogApi';

export default function AdminArtistsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && (user as any).role !== 'admin' && (user as any).role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await catalogApi.listArtists(1, 200);
      setArtists(data.artists || []);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar artistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const filtered = query.trim()
    ? artists.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
    : artists;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }

    setNewImage(file);
    const url = URL.createObjectURL(file);
    setNewImagePreview(url);
    setError(null);
  };

  const clearCreateModal = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setShowCreate(false);
    setNewName('');
    setNewBio('');
    setNewImage(null);
    setNewImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      setCreating(true);
      setError('');
      const artist = await catalogApi.createArtist({
        name: newName.trim(),
        bio: newBio.trim() || undefined,
        image: newImage,
      });

      setSuccess(`Artista "${artist.name}" criado`);
      setTimeout(() => setSuccess(''), 3000);
      clearCreateModal();
      await loadArtists();
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar artista');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (artist: Artist) => {
    if (
      !confirm(
        `Apagar o artista "${artist.name}"?\n\nEsta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      await catalogApi.deleteArtist(artist.id);
      setSuccess(`Artista "${artist.name}" apagado`);
      setTimeout(() => setSuccess(''), 3000);
      setArtists((prev) => prev.filter((a) => a.id !== artist.id));
    } catch (e: any) {
      setError(e?.message || 'Erro ao apagar artista');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield size={28} className="text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Admin · Artistas
                </h1>
                <p className="text-purple-200 text-sm">
                  Gerir artistas da plataforma
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-medium flex items-center gap-2 self-start md:self-auto"
            >
              <Plus size={16} />
              Criar artista
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar artista..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
            {!loading && (
              <p className="text-xs text-gray-400 mt-2">
                {filtered.length} artista{filtered.length !== 1 ? 's' : ''}
                {query && ` encontrado${filtered.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-purple-500 animate-spin" />
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20">
              <Users size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {query
                  ? 'Nenhum artista encontrado'
                  : 'Ainda não há artistas na plataforma'}
              </p>
              {!query && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
                >
                  Criar o primeiro
                </button>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((artist) => {
                const cover = resolveCoverUrl(artist.image_url ?? undefined);
                const tracks = artist.tracks_count ?? 0;
                const followers = artist.followers_count ?? 0;

                return (
                  <div
                    key={artist.id}
                    className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-purple-900/40 flex-shrink-0 flex items-center justify-center ring-2 ring-white/10">
                      {artist.image_url ? (
                        <img
                          src={cover}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users size={22} className="text-white/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm truncate">
                        {artist.name}
                      </h3>
                      <p className="text-gray-400 text-xs truncate">
                        {tracks} {tracks === 1 ? 'música' : 'músicas'}
                        {followers > 0 && ` · ${followersLabel(followers)}`}
                      </p>
                      {artist.bio && (
                        <p className="text-gray-500 text-xs truncate mt-0.5">
                          {artist.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/artists/${artist.id}`}
                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors"
                      >
                        Ver
                      </Link>

                      <Link
                        href={`/admin/artists/${artist.id}`}
                        className="w-8 h-8 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg flex items-center justify-center transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Link>

                      <button
                        onClick={() => handleDelete(artist)}
                        className="w-8 h-8 bg-red-500/10 hover:bg-red-500 text-red-300 hover:text-white rounded-lg flex items-center justify-center transition-colors"
                        title="Apagar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={clearCreateModal}
        >
          <div
            className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus size={20} className="text-purple-400" />
                Criar artista
              </h2>
              <button
                onClick={clearCreateModal}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-purple-900/40 flex items-center justify-center flex-shrink-0 ring-2 ring-white/10">
                {newImagePreview ? (
                  <img
                    src={newImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users size={32} className="text-white/40" />
                )}
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-2"
                >
                  <Camera size={14} />
                  {newImagePreview ? 'Trocar foto' : 'Escolher foto'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG ou WebP · máx 5 MB
                </p>
              </div>
            </div>

            <label className="block text-xs text-gray-400 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Albertina"
              autoFocus
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 mb-3 focus:outline-none focus:border-purple-500 transition-all"
            />

            <label className="block text-xs text-gray-400 mb-1">
              Biografia (opcional)
            </label>
            <textarea
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              placeholder="Conte um pouco sobre o artista..."
              rows={4}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 mb-5 focus:outline-none focus:border-purple-500 transition-all resize-none"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={clearCreateModal}
                className="px-4 py-2 text-gray-300 hover:text-white text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-full text-sm font-medium flex items-center gap-2"
              >
                {creating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
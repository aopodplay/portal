'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import { DiscAlbum, Loader2, AlertCircle, Search } from 'lucide-react';
import { resolveCoverUrl } from '@/lib/media';
import { catalogApi, type Album } from '@/lib/catalogApi';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await catalogApi.listAlbums(1, 200);
        setAlbums(data.albums || []);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar álbuns');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = query.trim()
    ? albums.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          (a.artist_name &&
            a.artist_name.toLowerCase().includes(query.toLowerCase()))
      )
    : albums;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <DiscAlbum size={28} className="text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Álbuns</h1>
            </div>
            <p className="text-purple-200 text-sm">
              Todos os álbuns da Podfe Play
            </p>
          </div>

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
                placeholder="Pesquisar álbum ou artista..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
            {!loading && (
              <p className="text-xs text-gray-400 mt-2">
                {filtered.length} álbum{filtered.length !== 1 ? 'ns' : ''}
                {query && ` encontrado${filtered.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-purple-500 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-20">
              <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20">
              <DiscAlbum size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {query ? 'Nenhum álbum encontrado' : 'Nenhum álbum disponível'}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((album) => {
                const cover = resolveCoverUrl(album.cover_url ?? undefined);
                return (
                  <Link
                    key={album.id}
                    href={`/albums/${album.id}`}
                    className="group"
                  >
                    <div className="relative rounded-lg overflow-hidden aspect-square mb-2 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                      {album.cover_url ? (
                        <img
                          src={cover}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <DiscAlbum size={48} className="text-white/40" />
                      )}
                    </div>
                    <h4 className="font-medium text-sm truncate text-white">
                      {album.title}
                    </h4>
                    {album.artist_name ? (
                      <p className="text-gray-400 text-xs truncate">
                        {album.artist_name}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-xs">
                        {album.tracks_count ?? 0}{' '}
                        {(album.tracks_count ?? 0) === 1 ? 'faixa' : 'faixas'}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}
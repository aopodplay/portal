'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import { Users, Loader2, AlertCircle, Search } from 'lucide-react';
import { resolveCoverUrl } from '@/lib/media';
import {
  catalogApi,
  followersLabel,
  type Artist,
} from '@/lib/catalogApi';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const filtered = query.trim()
    ? artists.filter((a) =>
        a.name.toLowerCase().includes(query.toLowerCase())
      )
    : artists;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-64 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <Users size={28} className="text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Artistas</h1>
            </div>
            <p className="text-purple-200 text-sm">
              Todos os artistas da Podfe Play
            </p>
          </div>

          {/* Busca */}
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

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 size={40} className="text-purple-500 animate-spin" />
            </div>
          )}

          {/* Erro */}
          {!loading && error && (
            <div className="text-center py-20">
              <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Vazio */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20">
              <Users size={64} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {query
                  ? 'Nenhum artista encontrado'
                  : 'Nenhum artista disponível'}
              </p>
            </div>
          )}

          {/* Grid de artistas */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filtered.map((artist) => {
                const cover = resolveCoverUrl(artist.image_url ?? undefined);
                const tracks = artist.tracks_count ?? 0;
                const followers = artist.followers_count ?? 0;

                // Linha secundária do card: "X músicas · Y seguidores" (ou só um)
                const metaParts: string[] = [];
                if (tracks > 0) {
                  metaParts.push(
                    `${tracks} ${tracks === 1 ? 'música' : 'músicas'}`
                  );
                }
                if (followers > 0) {
                  metaParts.push(followersLabel(followers));
                }
                const meta = metaParts.length > 0 ? metaParts.join(' · ') : '—';

                return (
                  <Link
                    key={artist.id}
                    href={`/artists/${artist.id}`}
                    className="group text-center"
                  >
                    <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center shadow-lg">
                      {artist.image_url ? (
                        <img
                          src={cover}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Users size={56} className="text-white/40" />
                      )}
                    </div>
                    <h4 className="font-medium text-white text-sm truncate">
                      {artist.name}
                    </h4>
                    <p className="text-gray-400 text-xs truncate">{meta}</p>
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
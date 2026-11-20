'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PlayerBar from '@/components/PlayerBar';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/config/api';
import { getFriendlyErrorMessage } from '@/lib/errorHandler';
import {
  Users,
  AlertCircle,
  Search,
  X,
  BadgeCheck,
  UserPlus,
  UserCheck,
  Music,
  Check,
  Award,
  Loader2,
} from 'lucide-react';
import { resolveCoverUrl } from '@/lib/media';
import {
  catalogApi,
  followersLabel,
  getArtistHref,
  type Artist,
} from '@/lib/catalogApi';

type ArtistSort = 'popular' | 'tracks' | 'alpha';

const ARTISTS_BATCH_SIZE = 20;

export default function ArtistsPage() {
  const { user } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<ArtistSort>('popular');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ARTISTS_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [followBusyId, setFollowBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await catalogApi.listArtists(1, 200);
        const list = data.artists || [];
        setArtists(list);
        const followed = new Set<number>();
        for (const a of list as any[]) {
          if (a.is_following) followed.add(Number(a.id));
        }
        setFollowingIds(followed);
      } catch (e: any) {
        setError(getFriendlyErrorMessage(e, 'Não foi possível carregar os artistas.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = artists.filter((a: any) => {
      if (verifiedOnly && !a.is_verified) return false;
      if (!q) return true;
      return (
        String(a.name || '').toLowerCase().includes(q) ||
        String(a.genre || '').toLowerCase().includes(q)
      );
    });

    if (sortBy === 'tracks') {
      list = [...list].sort((a, b) => (b.tracks_count ?? 0) - (a.tracks_count ?? 0));
    } else if (sortBy === 'alpha') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    } else {
      list = [...list].sort(
        (a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0)
      );
    }

    return list;
  }, [artists, query, sortBy, verifiedOnly]);

  const visibleArtists = useMemo(
    () => filteredAndSorted.slice(0, visibleCount),
    [filteredAndSorted, visibleCount]
  );

  const hasMore = visibleCount < filteredAndSorted.length;

  useEffect(() => {
    setVisibleCount(ARTISTS_BATCH_SIZE);
  }, [query, sortBy, verifiedOnly]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(filteredAndSorted.length, prev + ARTISTS_BATCH_SIZE)
          );
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, filteredAndSorted.length]);

  const featuredArtist = useMemo(() => {
    if (artists.length === 0) return null;
    return [...artists].sort(
      (a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0)
    )[0];
  }, [artists]);

  const handleToggleFollow = async (e: React.MouseEvent, artist: Artist) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast('Inicia sessão para seguir artistas.');
      return;
    }
    if (followBusyId === artist.id) return;

    const wasFollowing = followingIds.has(artist.id);
    setFollowBusyId(artist.id);
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (wasFollowing) next.delete(artist.id);
      else next.add(artist.id);
      return next;
    });
    setArtists((prev) =>
      prev.map((a) =>
        a.id === artist.id
          ? {
              ...a,
              followers_count: Math.max(
                0,
                (a.followers_count ?? 0) + (wasFollowing ? -1 : 1)
              ),
            }
          : a
      )
    );

    try {
      const res = await fetchWithAuth(`/api/v1/artists/${artist.id}/follow`, {
        method: 'POST',
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error('Erro ao seguir artista');
      }
      const followedNow = Boolean(body.data?.following ?? !wasFollowing);
      showToast(
        followedNow
          ? `Agora segues ${artist.name}`
          : `Deixaste de seguir ${artist.name}`
      );
    } catch {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.add(artist.id);
        else next.delete(artist.id);
        return next;
      });
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artist.id
            ? {
                ...a,
                followers_count: Math.max(
                  0,
                  (a.followers_count ?? 0) + (wasFollowing ? 1 : -1)
                ),
              }
            : a
        )
      );
      showToast('Não foi possível atualizar o seguimento.');
    } finally {
      setFollowBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-24 transition-all duration-300">
        <Header />

        <div className="p-6 max-w-[1600px] mx-auto">
          {/* Cabeçalho */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Users size={28} className="text-purple-400" />
                <h1 className="text-3xl font-bold text-white">Artistas</h1>
              </div>
              <p className="text-purple-200 text-sm">
                {artists.length} ministérios e artistas na PodFéPlay
              </p>
            </div>
          </div>

          {/* Artista em Destaque */}
          {!loading && !query && !verifiedOnly && featuredArtist && (
            <section className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-slate-900/75 border border-purple-500/25 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              <Link
                href={getArtistHref(featuredArtist.id, featuredArtist.name)}
                className="w-20 h-20 sm:w-32 sm:h-32 rounded-full overflow-hidden shrink-0 shadow-xl ring-4 ring-purple-500/30 bg-purple-900/40 flex items-center justify-center"
              >
                {featuredArtist.image_url ? (
                  <img
                    src={resolveCoverUrl(featuredArtist.image_url)}
                    alt={featuredArtist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users size={48} className="text-white/40" />
                )}
              </Link>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-200 mb-2">
                  <Award size={12} /> Artista em Destaque
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {featuredArtist.name}
                  </h2>
                  {Boolean((featuredArtist as any).is_verified) && (
                    <BadgeCheck size={20} className="text-sky-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  {featuredArtist.tracks_count ?? 0}{' '}
                  {(featuredArtist.tracks_count ?? 0) === 1 ? 'música' : 'músicas'}
                  {(featuredArtist.followers_count ?? 0) > 0
                    ? ` · ${followersLabel(featuredArtist.followers_count ?? 0)}`
                    : ''}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Link
                    href={getArtistHref(featuredArtist.id, featuredArtist.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 hover:bg-purple-100 text-xs font-bold transition-colors"
                  >
                    <Music size={14} />
                    <span>Ver Perfil e Músicas</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleToggleFollow(e, featuredArtist)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${
                      followingIds.has(featuredArtist.id)
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-purple-600 hover:bg-purple-500 border-transparent text-white'
                    }`}
                  >
                    {followingIds.has(featuredArtist.id) ? (
                      <>
                        <UserCheck size={14} /> A seguir
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} /> Seguir
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Busca + Ordenação + Filtro */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(ARTISTS_BATCH_SIZE);
                }}
                placeholder="Pesquisar artista por nome ou género..."
                className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setVisibleCount(ARTISTS_BATCH_SIZE);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: 'popular', label: 'Mais Populares' },
                  { key: 'tracks', label: 'Mais Músicas' },
                  { key: 'alpha', label: 'A–Z' },
                ] as Array<{ key: ArtistSort; label: string }>
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSortBy(item.key);
                    setVisibleCount(ARTISTS_BATCH_SIZE);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sortBy === item.key
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setVerifiedOnly((v) => !v);
                  setVisibleCount(ARTISTS_BATCH_SIZE);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border inline-flex items-center gap-1.5 transition-colors ${
                  verifiedOnly
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <BadgeCheck size={13} />
                <span>Verificados</span>
              </button>
            </div>
          </div>

          {!loading && (
            <p className="text-xs text-gray-400 mb-4">
              {filteredAndSorted.length} artista{filteredAndSorted.length !== 1 ? 's' : ''}
              {query && ` encontrado${filteredAndSorted.length !== 1 ? 's' : ''}`}
            </p>
          )}

          {/* Skeleton Loading */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse text-center">
                  <div className="w-full aspect-square rounded-full bg-white/10 mb-3" />
                  <div className="h-3.5 bg-white/10 rounded w-2/3 mx-auto mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2 mx-auto" />
                </div>
              ))}
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
          {!loading && !error && filteredAndSorted.length === 0 && (
            <div className="text-center py-20 bg-white/[0.03] border border-white/10 rounded-2xl">
              <Users size={56} className="text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 text-sm">
                {query || verifiedOnly
                  ? 'Nenhum artista encontrado para este filtro'
                  : 'Nenhum artista disponível'}
              </p>
              {(query || verifiedOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setVerifiedOnly(false);
                    setVisibleCount(ARTISTS_BATCH_SIZE);
                  }}
                  className="text-purple-400 hover:text-purple-300 text-xs mt-2"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Grid de artistas com carregamento contínuo ao rolar */}
          {!loading && !error && visibleArtists.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                {visibleArtists.map((artist: any) => {
                  const cover = resolveCoverUrl(artist.image_url ?? undefined);
                  const tracks = artist.tracks_count ?? 0;
                  const followers = artist.followers_count ?? 0;
                  const isFollowing = followingIds.has(artist.id);

                  const metaParts: string[] = [];
                  if (tracks > 0) {
                    metaParts.push(`${tracks} ${tracks === 1 ? 'música' : 'músicas'}`);
                  }
                  if (followers > 0) {
                    metaParts.push(followersLabel(followers));
                  }
                  const meta = metaParts.length > 0 ? metaParts.join(' · ') : 'Artista PodFéPlay';

                  return (
                    <Link
                      key={artist.id}
                      href={getArtistHref(artist.id, artist.name)}
                      className="group bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/35 rounded-2xl p-2.5 sm:p-4 text-center transition-all flex flex-col items-center min-w-0"
                    >
                      <div className="relative w-20 h-20 sm:w-full sm:h-auto sm:aspect-square rounded-full overflow-hidden mb-2.5 sm:mb-3 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center shadow-lg">
                        {artist.image_url ? (
                          <img
                            src={cover}
                            alt={artist.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Users size={36} className="text-white/40 sm:w-12 sm:h-12" />
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-1 max-w-full">
                        <h4 className="font-semibold text-white text-xs sm:text-sm truncate group-hover:text-purple-300 transition-colors">
                          {artist.name}
                        </h4>
                        {Boolean(artist.is_verified) && (
                          <BadgeCheck size={13} className="text-sky-400 shrink-0" />
                        )}
                      </div>

                      <p className="text-gray-400 text-[11px] sm:text-xs truncate w-full mt-0.5">{meta}</p>

                      <button
                        type="button"
                        onClick={(e) => handleToggleFollow(e, artist)}
                        disabled={followBusyId === artist.id}
                        className={`mt-2.5 sm:mt-3 w-full py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors ${
                          isFollowing
                            ? 'bg-white/15 text-white hover:bg-white/20'
                            : 'bg-purple-600/80 hover:bg-purple-600 text-white'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck size={13} /> A seguir
                          </>
                        ) : (
                          <>
                            <UserPlus size={13} /> Seguir
                          </>
                        )}
                      </button>
                    </Link>
                  );
                })}
              </div>

              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400"
                >
                  <Loader2 size={16} className="animate-spin text-purple-400" />
                  <span>A carregar mais artistas...</span>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-full bg-slate-900/95 border border-purple-500/40 text-white text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <Check size={14} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <PlayerBar />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  Loader2,
  AlertCircle,
  Music as MusicIcon,
  DiscAlbum,
  Users,
  Headphones,
  Play,
  TrendingUp,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { resolveCoverUrl } from '@/lib/media';
import { catalogApi } from '@/lib/catalogApi';
import {
  adminApi,
  type OverviewResponse,
  type PlaysByPeriodResponse,
} from '@/lib/adminApi';

// Helper para formatar inteiro com separador PT
function fmt(n: number): string {
  return (n ?? 0).toLocaleString('pt-PT');
}

export default function AdminStatsPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [period, setPeriod] = useState<PlaysByPeriodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [overview, plays] = await Promise.all([
          adminApi.getOverview(),
          adminApi.getPlaysByPeriod(),
        ]);
        setData(overview);
        setPeriod(plays);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 size={48} className="text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-red-300">{error || 'Erro'}</p>
        <Link
          href="/"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm"
        >
          Voltar
        </Link>
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <main className="min-h-screen pb-24">
        <Header />

        <div className="p-6 max-w-7xl mx-auto">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <BarChart3 size={28} className="text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Estatísticas de Músicas
              </h1>
              <p className="text-purple-200 text-sm">
                Painel administrativo — apenas utilizadores com permissão
              </p>
            </div>
          </div>

          {/* Cards de totais */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            <StatCard
              icon={<Play size={20} className="text-purple-300" />}
              label="Reproduções"
              value={fmt(t.total_plays)}
            />
            <StatCard
              icon={<TrendingUp size={20} className="text-green-400" />}
              label="Eventos"
              value={fmt(t.total_play_events)}
            />
            <StatCard
              icon={<Headphones size={20} className="text-blue-400" />}
              label="Ouvintes únicos"
              value={fmt(t.unique_listeners)}
            />
            <StatCard
              icon={<MusicIcon size={20} className="text-pink-400" />}
              label="Músicas"
              value={fmt(t.total_music)}
            />
            <StatCard
              icon={<Users size={20} className="text-yellow-400" />}
              label="Artistas"
              value={fmt(t.total_artists)}
            />
            <StatCard
              icon={<DiscAlbum size={20} className="text-orange-400" />}
              label="Álbuns"
              value={fmt(t.total_albums)}
            />
          </div>

          {/* Top 3 listas */}
          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            {/* Top músicas */}
            <section className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MusicIcon size={18} className="text-purple-300" />
                Top músicas
              </h2>
              <div className="space-y-2">
                {data.topMusic.map((m, i) => (
                  <Link
                    key={m.id}
                    href={`/artists/${m.artist_id ?? ''}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-gray-500 text-sm w-5 tabular-nums">
                      {i + 1}
                    </span>
                    <div className="w-9 h-9 rounded bg-purple-600/30 flex-shrink-0 overflow-hidden">
                      {m.cover_image ? (
                        <img
                          src={resolveCoverUrl(m.cover_image)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MusicIcon size={16} className="text-white/50 m-auto mt-2.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {m.title}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {m.artist}
                      </p>
                    </div>
                    <span className="text-purple-300 text-xs font-semibold tabular-nums">
                      {fmt(m.plays)}
                    </span>
                  </Link>
                ))}
                {data.topMusic.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Sem dados
                  </p>
                )}
              </div>
            </section>

            {/* Top artistas */}
            <section className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users size={18} className="text-yellow-400" />
                Top artistas
              </h2>
              <div className="space-y-2">
                {data.topArtists.map((a, i) => (
                  <Link
                    key={a.id}
                    href={`/artists/${a.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-gray-500 text-sm w-5 tabular-nums">
                      {i + 1}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-purple-600/30 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {a.image_url ? (
                        <img
                          src={resolveCoverUrl(a.image_url)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users size={16} className="text-white/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {a.name}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {a.tracks_count}{' '}
                        {a.tracks_count === 1 ? 'música' : 'músicas'}
                      </p>
                    </div>
                    <span className="text-purple-300 text-xs font-semibold tabular-nums">
                      {fmt(a.total_plays)}
                    </span>
                  </Link>
                ))}
                {data.topArtists.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Sem dados
                  </p>
                )}
              </div>
            </section>

            {/* Top álbuns */}
            <section className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <DiscAlbum size={18} className="text-orange-400" />
                Top álbuns
              </h2>
              <div className="space-y-2">
                {data.topAlbums.map((al, i) => (
                  <Link
                    key={al.id}
                    href={`/albums/${al.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-gray-500 text-sm w-5 tabular-nums">
                      {i + 1}
                    </span>
                    <div className="w-9 h-9 rounded bg-purple-600/30 flex-shrink-0 overflow-hidden">
                      {al.cover_url ? (
                        <img
                          src={resolveCoverUrl(al.cover_url)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DiscAlbum
                          size={16}
                          className="text-white/50 m-auto mt-2.5"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {al.title}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {al.artist_name || '—'}
                      </p>
                    </div>
                    <span className="text-purple-300 text-xs font-semibold tabular-nums">
                      {fmt(al.total_plays)}
                    </span>
                  </Link>
                ))}
                {data.topAlbums.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Sem dados
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Reproduções por dia */}
          <section className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-300" />
              Reproduções por dia
              {period && (
                <span className="text-gray-400 text-xs font-normal ml-2">
                  {period.from} → {period.to}
                </span>
              )}
            </h2>

            {!period || period.days.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                Sem reproduções registadas no período.
              </p>
            ) : (
              <div className="space-y-1">
                {/* Calcula o máximo para escalar a barra */}
                {(() => {
                  const max = Math.max(...period.days.map((d) => d.total), 1);
                  return period.days.map((d) => (
                    <div
                      key={d.day}
                      className="grid grid-cols-[110px_1fr_60px] gap-3 items-center"
                    >
                      <span className="text-gray-400 text-xs tabular-nums">
                        {d.day}
                      </span>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${(d.total / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-white text-xs tabular-nums text-right">
                        {fmt(d.total)}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Sub-componente — card de total
// ============================================================

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}
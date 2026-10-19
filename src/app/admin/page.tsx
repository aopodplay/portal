// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  DiscAlbum,
  Music,
  ListMusic,
  UserCog,
  BarChart3,
  TrendingUp,
  Play,
  Clock,
  Loader2,
  AlertCircle,
  ArrowRight,
  Plus,
  Activity,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/config/api';

interface DashboardTotals {
  total_music: number;
  total_artists: number;
  total_albums: number;
  total_plays: number;
  total_play_events: number;
  unique_listeners: number;
}

function fmt(n: number | string | undefined): string {
  if (n === undefined || n === null) return '0';
  const num = typeof n === 'string' ? parseInt(n, 10) : n;
  if (isNaN(num)) return '0';
  return num.toLocaleString('pt-PT');
}

export default function AdminDashboardPage() {
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/api/v1/admin/stats/overview'), {
          headers: getAuthHeaders(),
        });
        const body = await res.json();
        if (!res.ok || !body?.success) throw new Error(body?.message);
        setTotals(body.data.totals);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cards de navegação rápida
  const shortcuts = [
    {
      href: '/admin/artists',
      label: 'Artistas',
      description: 'Criar, editar e remover artistas',
      icon: Users,
      color: 'from-pink-500 to-rose-600',
    },
    {
      href: '/admin/albums',
      label: 'Álbuns',
      description: 'Gerir álbuns e capas',
      icon: DiscAlbum,
      color: 'from-orange-500 to-amber-600',
    },
    {
      href: '/admin/music',
      label: 'Músicas',
      description: 'Upload e gestão de faixas',
      icon: Music,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      href: '/admin/playlists',
      label: 'Playlists',
      description: 'Moderação de playlists públicas',
      icon: ListMusic,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      href: '/admin/users',
      label: 'Utilizadores',
      description: 'Roles, banir, ver atividade',
      icon: UserCog,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      href: '/admin/stats',
      label: 'Estatísticas',
      description: 'Gráficos e métricas detalhadas',
      icon: BarChart3,
      color: 'from-violet-500 to-fuchsia-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* ---------- Cabeçalho ---------- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Visão geral da plataforma Podfe Play
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ---------- Cards de totais ---------- */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={36} className="text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              icon={<Play size={20} className="text-emerald-400" />}
              label="Reproduções totais"
              value={fmt(totals?.total_plays)}
            />
            <StatCard
              icon={<Activity size={20} className="text-indigo-400" />}
              label="Eventos registados"
              value={fmt(totals?.total_play_events)}
            />
            <StatCard
              icon={<Users size={20} className="text-pink-400" />}
              label="Artistas"
              value={fmt(totals?.total_artists)}
            />
            <StatCard
              icon={<DiscAlbum size={20} className="text-orange-400" />}
              label="Álbuns"
              value={fmt(totals?.total_albums)}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <StatCard
              icon={<Music size={20} className="text-purple-400" />}
              label="Músicas"
              value={fmt(totals?.total_music)}
            />
            <StatCard
              icon={<Clock size={20} className="text-blue-400" />}
              label="Ouvintes únicos"
              value={fmt(totals?.unique_listeners)}
            />
            <StatCard
              icon={<TrendingUp size={20} className="text-fuchsia-400" />}
              label="Média por música"
              value={
                totals?.total_music && totals.total_music > 0
                  ? fmt(Math.round(
                      (parseInt(String(totals.total_plays), 10) || 0) /
                        totals.total_music
                    ))
                  : '0'
              }
            />
          </div>
        </>
      )}

      {/* ---------- Atalhos ---------- */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Gestão</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative bg-slate-900/60 border border-white/5 hover:border-indigo-500/40 rounded-xl p-5 transition-all hover:bg-slate-900 overflow-hidden"
          >
            {/* Gradiente de fundo em hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity`}
            />

            <div className="relative flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
              >
                <s.icon size={22} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">{s.label}</h3>
                  <ArrowRight
                    size={14}
                    className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all"
                  />
                </div>
                <p className="text-slate-400 text-xs mt-1">{s.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ---------- Ações rápidas ---------- */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-white mb-4">Ações rápidas</h2>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/artists?action=create"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
          >
            <Plus size={16} /> Criar artista
          </Link>
          <Link
            href="/admin/albums?action=create"
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
          >
            <Plus size={16} /> Criar álbum
          </Link>
          <Link
            href="/admin/music?action=upload"
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
          >
            <Plus size={16} /> Upload de música
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTES
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
    <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-slate-400 text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}
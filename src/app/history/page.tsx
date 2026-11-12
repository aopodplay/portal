// app/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { historyApi, HistoryItem } from '@/lib/historyApi';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await historyApi.getHistory({ page: p, limit: 20 });
      setItems(data.items);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const handleDelete = async (contentId: number) => {
    if (!confirm('Remover este item do histórico?')) return;
    try {
      await historyApi.clearContent(contentId);
      setItems((prev) => prev.filter((i) => i.content_id !== contentId));
    } catch (e: any) {
      alert('Erro ao remover: ' + e.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Apagar TODO o histórico?')) return;
    try {
      await historyApi.clearAll();
      setItems([]);
    } catch (e: any) {
      alert('Erro ao limpar: ' + e.message);
    }
  };

  const formatTime = (s?: number | null) => {
    if (!s || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="text-purple-400" /> Histórico
          </h1>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-sm bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Limpar tudo
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            Ainda não ouviste nada. Começa a explorar! 🎧
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              // backend já devolve progress (0-100) pronto a usar
              const pct = Math.min(100, Math.max(0, item.progress ?? 0));
              const isDone = !!item.completed;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors group"
                >
                  {/* Capa */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-purple-600/30 flex-shrink-0">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.title || 'Capa'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Play
                        className="absolute inset-0 m-auto text-white/50"
                        size={20}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/player/${item.content_id}`}
                      className="font-medium text-white truncate block hover:text-purple-300 transition-colors"
                    >
                      {item.title || `Conteúdo #${item.content_id}`}
                    </Link>
                    <p className="text-gray-400 text-xs truncate">
                      {item.full_name || item.username || '—'}
                      {item.total_duration
                        ? ` · ${formatTime(item.last_position)} / ${formatTime(item.total_duration)}`
                        : ` · ${formatTime(item.last_position)}`}
                    </p>

                    {/* Barra de progresso */}
                    <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isDone ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Badge de concluído */}
                  {isDone && (
                    <div title="Concluído" className="flex-shrink-0">
                      <CheckCircle2 size={18} className="text-green-400" />
                    </div>
                  )}

                  {/* Apagar */}
                  <button
                    onClick={() => handleDelete(item.content_id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                    title="Remover do histórico"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                  p === page
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
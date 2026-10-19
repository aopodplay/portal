'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ListMusic, Loader2, Check, X } from 'lucide-react';
import { playlistApi, type Playlist } from '@/lib/playlistApi';

interface Position {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

export default function AddToPlaylistButton({
  musicId,
  onDone,
}: {
  musicId: number;
  onDone?: (playlistTitle: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [pos, setPos] = useState<Position | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ---------- cálculo da posição ----------
  const computePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const PANEL_WIDTH = 280;
    const PANEL_HEIGHT_ESTIMATE = 340;
    const GAP = 8;
    const MARGIN = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < PANEL_HEIGHT_ESTIMATE + GAP;

    // Largura: nunca passa da janela
    const width = Math.min(PANEL_WIDTH, window.innerWidth - MARGIN * 2);

    // Left: alinha à direita do botão, mas nunca sai fora
    let left = rect.right - width;
    if (left < MARGIN) left = MARGIN;
    if (left + width > window.innerWidth - MARGIN) {
      left = window.innerWidth - MARGIN - width;
    }

    // Top: acima ou abaixo do botão
    const top = openUp
      ? Math.max(MARGIN, rect.top - GAP - Math.min(PANEL_HEIGHT_ESTIMATE, rect.top - MARGIN))
      : rect.bottom + GAP;

    setPos({ top, left, width, openUp });
  }, []);

  // ---------- abrir/fechar ----------
  const handleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    computePosition();
    setOpen(true);
    setAdded(null);
    loadPlaylists();
  };

  // ---------- carregar playlists ----------
  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await playlistApi.list();
      setPlaylists(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar playlists');
    } finally {
      setLoading(false);
    }
  };

  // ---------- adicionar ----------
  const handleAdd = async (playlistId: number, playlistTitle: string) => {
    try {
      setAdding(playlistId);
      await playlistApi.addMusic(playlistId, musicId);
      setAdded(playlistId);
      onDone?.(playlistTitle);
      setTimeout(() => {
        setOpen(false);
        setAdded(null);
      }, 1200);
    } catch (e: any) {
      setError(e?.message || 'Erro ao adicionar');
    } finally {
      setAdding(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const p = await playlistApi.create({ title: newTitle.trim() });
      setNewTitle('');
      setPlaylists((prev) => [p, ...prev]);
      await handleAdd(p.id, p.title);
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar playlist');
    } finally {
      setCreating(false);
    }
  };

  // ---------- fechar ao clicar fora / scroll / resize ----------
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current?.contains(t) ||
        buttonRef.current?.contains(t)
      ) return;
      setOpen(false);
    };

    const handleScrollOrResize = () => {
      // Recalcula posição em vez de fechar (mais suave)
      computePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, computePosition]);

  // ---------- conteúdo do panel (para o portal) ----------
  const Panel = open && pos ? (
    <div
      ref={panelRef}
      className="fixed z-[9999] bg-slate-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden"
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: '400px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <span className="text-white text-sm font-semibold flex items-center gap-2">
          <ListMusic size={14} className="text-purple-400" />
          Adicionar à playlist
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Lista (com scroll) */}
      <div className="max-h-64 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="text-purple-500 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="text-red-400 text-xs p-3">{error}</p>
        )}

        {!loading && !error && playlists.length === 0 && (
          <p className="text-gray-500 text-xs p-3 text-center">
            Ainda não tens playlists. Cria uma abaixo.
          </p>
        )}

        {!loading &&
          !error &&
          playlists.map((p) => {
            const isAdding = adding === p.id;
            const isAdded = added === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id, p.title)}
                disabled={isAdding || isAdded}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition-colors text-left disabled:opacity-60"
              >
                <div className="w-8 h-8 rounded bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                  <ListMusic size={14} className="text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {p.tracks_count ?? 0}{' '}
                    {(p.tracks_count ?? 0) === 1 ? 'música' : 'músicas'}
                  </p>
                </div>
                {isAdding && (
                  <Loader2 size={14} className="text-purple-400 animate-spin" />
                )}
                {isAdded && <Check size={16} className="text-green-400" />}
              </button>
            );
          })}
      </div>

      {/* Criar nova */}
      <div className="border-t border-white/10 p-2">
        <div className="flex gap-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
            placeholder="Nova playlist…"
            className="flex-1 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleCreateAndAdd}
            disabled={creating || !newTitle.trim()}
            className="px-2 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded text-xs"
          >
            {creating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Plus size={12} />
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        className="w-9 h-9 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90 transition-all shadow-lg"
        title="Adicionar à playlist"
      >
        <Plus size={14} className="text-white" />
      </button>

      {typeof window !== 'undefined' && Panel
        ? createPortal(Panel, document.body)
        : null}
    </>
  );
}
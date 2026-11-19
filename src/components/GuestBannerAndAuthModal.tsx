'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Lock, Headphones } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/verify-account'];

export default function GuestBannerAndAuthModal() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [authModal, setAuthModal] = useState<{ open: boolean; action?: string; title?: string }>({
    open: false,
  });

  useEffect(() => {
    const onRequireAuth = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      setAuthModal({
        open: true,
        action: detail.action || 'ouvir ou assistir este conteúdo',
        title: detail.title,
      });
    };
    window.addEventListener('podplay:require-auth', onRequireAuth);
    return () => window.removeEventListener('podplay:require-auth', onRequireAuth);
  }, []);

  const isAuthPage = AUTH_PAGES.some((p) => pathname?.startsWith(p));
  const showGuestBanner = !loading && !user && !isAuthPage;

  return (
    <>
      {/* Notificação fixa inferior estilo Spotify quando não está logado */}
      {showGuestBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-gradient-to-r from-[#1a102b] via-[#2b1449] to-[#141122] px-4 sm:px-6 py-3 shadow-2xl backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                Pré-visualização do PodFéPlay
              </p>
              <p className="text-sm text-gray-200 truncate">
                Inscreva-se gratuitamente para ouvir músicas, assistir vídeos e guardar os seus favoritos.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                href="/register"
                className="px-4 py-2 rounded-full bg-white text-slate-950 hover:bg-gray-100 text-xs sm:text-sm font-bold transition-all"
              >
                Inscrever-se
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-full border border-white/25 text-white hover:bg-white/10 text-xs sm:text-sm font-semibold transition-all"
              >
                Iniciar sessão
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal ao tentar reproduzir música ou vídeo sem sessão */}
      {authModal.open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setAuthModal({ open: false })}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#12121a] border border-white/15 p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAuthModal({ open: false })}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
              <Headphones size={22} className="text-purple-400" />
            </div>

            <h3 className="text-xl font-bold text-white">
              Inicia sessão para continuar
            </h3>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              {authModal.title ? (
                <>
                  Para {authModal.action} (<span className="text-white font-medium">{authModal.title}</span>), cria uma conta gratuita ou inicia sessão.
                </>
              ) : (
                <>
                  Cria uma conta gratuita ou inicia sessão no PodFéPlay para ouvir músicas e assistir vídeos sem limites.
                </>
              )}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/register"
                onClick={() => setAuthModal({ open: false })}
                className="w-full py-2.5 px-4 rounded-full bg-white text-slate-950 hover:bg-gray-100 text-sm font-bold text-center transition-all"
              >
                Inscrever-se grátis
              </Link>
              <Link
                href="/login"
                onClick={() => setAuthModal({ open: false })}
                className="w-full py-2.5 px-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold text-center inline-flex items-center justify-center gap-2 transition-all"
              >
                <Lock size={15} />
                <span>Iniciar sessão</span>
              </Link>
              <button
                type="button"
                onClick={() => setAuthModal({ open: false })}
                className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Continuar a explorar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

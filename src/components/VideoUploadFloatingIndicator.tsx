'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, X, ArrowUpRight } from 'lucide-react';
import { useVideoUpload } from '@/contexts/VideoUploadContext';

export default function VideoUploadFloatingIndicator() {
  const {
    isUploading,
    progress,
    statusLabel,
    videoTitle,
    originPath,
    error,
    successMessage,
    isModalVisible,
    requestReopenModal,
    dismissStatus,
  } = useVideoUpload();

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      dismissStatus();
    }, 7000);
    return () => clearTimeout(timer);
  }, [successMessage, dismissStatus]);

  if (isModalVisible) return null;
  if (!isUploading && !successMessage && !error) return null;

  const targetPath = originPath || '/videos';
  const isOnOrigin = pathname === targetPath;

  const handleGoToUpload = () => {
    requestReopenModal();
    if (!isOnOrigin) {
      router.push(targetPath);
    }
  };

  if (isUploading) {
    return (
      <div className="fixed bottom-24 right-5 z-[95] w-80 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-md border border-purple-500/40 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Loader2 size={16} className="text-purple-400 animate-spin shrink-0" />
            <span className="text-xs font-semibold text-purple-200 truncate">
              A inserir vídeo em segundo plano
            </span>
          </div>
          <span className="text-xs font-bold text-white shrink-0">{progress}%</span>
        </div>

        <p className="text-sm font-medium text-white truncate mb-1" title={videoTitle}>
          {videoTitle || 'Vídeo sem título'}
        </p>
        <p className="text-[11px] text-gray-400 mb-2.5">{statusLabel || 'A enviar...'}</p>

        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={handleGoToUpload}
          className="w-full py-1.5 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-medium text-purple-100 flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>{isOnOrigin ? 'Ver carregamento' : 'Voltar e ver carregamento'}</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="fixed bottom-24 right-5 z-[95] w-80 max-w-[calc(100vw-2rem)] bg-emerald-950/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-2xl p-3.5 text-white">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-200">Publicação concluída</p>
            <p className="text-xs text-emerald-100/90 mt-0.5 break-words">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={dismissStatus}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10"
            aria-label="Fechar aviso"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-5 z-[95] w-80 max-w-[calc(100vw-2rem)] bg-red-950/95 backdrop-blur-md border border-red-500/40 rounded-2xl shadow-2xl p-3.5 text-white">
      <div className="flex items-start gap-2.5">
        <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-200">Erro no envio do vídeo</p>
          <p className="text-xs text-red-100/90 mt-0.5 break-words">{error}</p>
        </div>
        <button
          type="button"
          onClick={dismissStatus}
          className="p-1 rounded-lg text-red-300 hover:text-white hover:bg-white/10"
          aria-label="Fechar aviso"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

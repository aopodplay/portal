'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Upload, Loader2, Lock, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';
import { useVideoUpload } from '@/contexts/VideoUploadContext';

interface AddVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddVideoModal({ open, onClose, onSuccess }: AddVideoModalProps) {
  const pathname = usePathname();
  const {
    isUploading,
    progress,
    statusLabel,
    videoTitle,
    error: uploadError,
    startVideoUpload,
    setModalVisible,
    clearError,
  } = useVideoUpload();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('video');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [commentsLocked, setCommentsLocked] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setModalVisible(open);
    return () => setModalVisible(false);
  }, [open, setModalVisible]);

  if (!open) return null;

  const displayError = localError || uploadError;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setThumbFile(null);
    setCommentsLocked(false);
    setLocalError(null);
    clearError();
  };

  const handleClose = () => {
    // Se estiver a enviar, minimiza apenas para segundo plano sem perder o progresso
    if (!isUploading) {
      resetForm();
    } else {
      setLocalError(null);
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    if (!title.trim() || !videoFile) {
      setLocalError('O título e o ficheiro de vídeo são obrigatórios.');
      return;
    }

    setLocalError(null);
    clearError();

    const ok = await startVideoUpload({
      title,
      category,
      description,
      videoFile,
      thumbFile,
      commentsLocked,
      originPath: pathname || '/videos',
      onSuccess: () => {
        resetForm();
        onSuccess();
        onClose();
      },
    });

    if (!ok) {
      // Erro fica visível no displayError caso o modal ainda esteja aberto
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <VideoIcon size={20} className="text-purple-400" />
            <h2 className="text-base font-bold text-white">Adicionar Vídeo</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            aria-label={isUploading ? 'Minimizar para segundo plano' : 'Fechar'}
            title={isUploading ? 'Minimizar para segundo plano' : 'Fechar'}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {displayError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {displayError}
            </div>
          )}

          {isUploading ? (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-purple-300 font-medium">A inserir vídeo</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {videoTitle || title || 'Vídeo'}
                  </p>
                </div>
                <span className="text-sm font-bold text-purple-200 shrink-0">{progress}%</span>
              </div>

              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin text-purple-400" />
                  <span>{statusLabel || 'A enviar...'}</span>
                </span>
              </div>

              <p className="text-[11px] text-gray-400">
                Podes fechar esta janela ou navegar para outras páginas — o envio continua em segundo plano.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pregação de Domingo"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="video">Vídeo / Clipe</option>
                  <option value="sermao">Sermão</option>
                  <option value="podcast">Podcast</option>
                  <option value="estudo">Estudo Bíblico</option>
                  <option value="culto">Culto / Conferência</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escreve a descrição do vídeo..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Ficheiro de Vídeo *
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-purple-500/60 cursor-pointer text-xs text-gray-300">
                    <VideoIcon size={16} className="text-purple-400 flex-shrink-0" />
                    <span className="truncate">
                      {videoFile ? videoFile.name : 'Selecionar vídeo'}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-[11px] text-gray-500 mt-1">
                    MP4, MOV, MKV, WebM (até 10 GB)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Capa / Thumbnail (opcional)
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-purple-500/60 cursor-pointer text-xs text-gray-300">
                    <ImageIcon size={16} className="text-pink-400 flex-shrink-0" />
                    <span className="truncate">
                      {thumbFile ? thumbFile.name : 'Selecionar capa'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              {/* Opção de trancar comentários */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.07] transition-colors">
                <input
                  type="checkbox"
                  checked={commentsLocked}
                  onChange={(e) => setCommentsLocked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-800 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Lock size={14} className="text-amber-400" />
                    <span>Trancar comentários</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Quando ativado, ninguém poderá publicar novos comentários neste vídeo.
                  </p>
                </div>
              </label>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isUploading ? 'Continuar em segundo plano' : 'Cancelar'}
            </button>
            {!isUploading && (
              <button
                type="submit"
                disabled={!title.trim() || !videoFile}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <Upload size={16} />
                <span>Publicar Vídeo</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

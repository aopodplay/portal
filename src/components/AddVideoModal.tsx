'use client';

import { useState } from 'react';
import { X, Upload, Loader2, Lock, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';
import { fetchWithAuth } from '@/config/api';

interface AddVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function uploadDirectPost(
  uploadURL: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadURL, true);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Falha no envio para Cloudflare (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Erro de rede ao enviar vídeo para Cloudflare'));
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  });
}

function patchChunkWithXhr(
  uploadURL: string,
  chunk: Blob,
  offset: number,
  totalSize: number,
  onProgress: (pct: number) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PATCH', uploadURL, true);
    xhr.setRequestHeader('Tus-Resumable', '1.0.0');
    xhr.setRequestHeader('Upload-Offset', String(offset));
    xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && totalSize > 0) {
        const uploaded = Math.min(totalSize, offset + ev.loaded);
        onProgress(Math.min(99, Math.round((uploaded / totalSize) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const nextOffsetHeader = xhr.getResponseHeader('upload-offset');
        const nextOffset = nextOffsetHeader
          ? parseInt(nextOffsetHeader, 10)
          : offset + chunk.size;
        onProgress(Math.min(100, Math.round((nextOffset / totalSize) * 100)));
        resolve(nextOffset);
      } else {
        reject(new Error(`Erro durante upload TUS (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Erro de rede durante envio do chunk'));
    xhr.send(chunk);
  });
}

async function uploadDirectTus(
  uploadURL: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  // 5 MB por chunk (mínimo TUS na Cloudflare, múltiplo de 256 KiB) com até 3 tentativas por chunk
  const chunkSize = 5 * 1024 * 1024;
  let offset = 0;

  while (offset < file.size) {
    const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
    let attempt = 0;
    let nextOffset = offset;

    while (attempt < 3) {
      try {
        nextOffset = await patchChunkWithXhr(
          uploadURL,
          slice,
          offset,
          file.size,
          onProgress
        );
        break;
      } catch (err) {
        attempt += 1;
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    offset = nextOffset;
  }
}

export default function AddVideoModal({ open, onClose, onSuccess }: AddVideoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [commentsLocked, setCommentsLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusLabel, setStatusLabel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setThumbFile(null);
    setCommentsLocked(false);
    setUploadProgress(0);
    setStatusLabel('');
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoFile) {
      setError('O título e o ficheiro de vídeo são obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setUploadProgress(0);
      setStatusLabel('A preparar envio...');

      // 1. Pedir URL de upload direto à API
      const initRes = await fetchWithAuth('/api/v1/videos/direct-upload', {
        method: 'POST',
        body: JSON.stringify({
          fileSize: videoFile.size,
          fileName: videoFile.name,
        }),
      });
      const initBody = await initRes.json();

      if (!initRes.ok || !initBody?.success || !initBody?.data?.uploadURL) {
        throw new Error(initBody?.message || 'Não foi possível iniciar o upload direto');
      }

      const { uploadURL, uid, mode } = initBody.data as {
        uploadURL: string;
        uid: string;
        mode: 'post' | 'tus';
      };

      // 2. Enviar diretamente do browser para o Cloudflare Stream (com progresso contínuo)
      setStatusLabel('A enviar vídeo...');
      if (mode === 'tus') {
        await uploadDirectTus(uploadURL, videoFile, setUploadProgress);
      } else {
        await uploadDirectPost(uploadURL, videoFile, setUploadProgress);
      }

      // 3. Confirmar e guardar na base de dados (com thumbnail se houver)
      setStatusLabel('A guardar vídeo...');
      const confirmFd = new FormData();
      confirmFd.append('uid', uid);
      confirmFd.append('title', title.trim());
      if (description.trim()) confirmFd.append('description', description.trim());
      confirmFd.append('comments_locked', String(commentsLocked));
      confirmFd.append('file_size', String(videoFile.size));
      if (thumbFile) {
        confirmFd.append('thumbnail', thumbFile);
      }

      const confirmRes = await fetchWithAuth('/api/v1/videos/confirm-upload', {
        method: 'POST',
        body: confirmFd,
      });
      const confirmBody = await confirmRes.json();

      if (!confirmRes.ok || !confirmBody?.success) {
        throw new Error(confirmBody?.message || 'Erro ao guardar vídeo na base de dados');
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar vídeo');
    } finally {
      setSubmitting(false);
      setStatusLabel('');
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
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

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
              disabled={submitting}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-60"
            />
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
              disabled={submitting}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-60"
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
                  disabled={submitting}
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
                  disabled={submitting}
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
              disabled={submitting}
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

          {/* Barra de progresso em tempo real */}
          {submitting && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-purple-200">
                <span>{statusLabel || 'A enviar...'}</span>
                <span className="font-semibold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !videoFile}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{uploadProgress > 0 ? `${uploadProgress}%` : 'A enviar...'}</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Publicar Vídeo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

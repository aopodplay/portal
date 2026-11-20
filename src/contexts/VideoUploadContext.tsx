'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { fetchWithAuth } from '@/config/api';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';

export interface StartVideoUploadParams {
  title: string;
  category: string;
  description: string;
  videoFile: File;
  thumbFile: File | null;
  commentsLocked: boolean;
  originPath?: string;
  onSuccess?: () => void;
}

interface VideoUploadContextValue {
  isUploading: boolean;
  progress: number;
  statusLabel: string;
  videoTitle: string;
  videoCategory: string;
  originPath: string | null;
  error: string | null;
  successMessage: string | null;
  lastCompletedAt: number | null;
  reopenModalPath: string | null;
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  startVideoUpload: (params: StartVideoUploadParams) => Promise<boolean>;
  requestReopenModal: () => void;
  clearReopenModal: () => void;
  dismissStatus: () => void;
  clearError: () => void;
}

const VideoUploadContext = createContext<VideoUploadContextValue | undefined>(undefined);

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

export function VideoUploadProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState('video');
  const [originPath, setOriginPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastCompletedAt, setLastCompletedAt] = useState<number | null>(null);
  const [reopenModalPath, setReopenModalPath] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const activeUploadRef = useRef(false);

  const startVideoUpload = useCallback(async (params: StartVideoUploadParams): Promise<boolean> => {
    if (activeUploadRef.current) {
      setError('Já existe um vídeo a ser enviado em segundo plano.');
      return false;
    }

    const {
      title,
      category,
      description,
      videoFile,
      thumbFile,
      commentsLocked,
      originPath: fromPath,
      onSuccess,
    } = params;

    activeUploadRef.current = true;
    setIsUploading(true);
    setProgress(0);
    setStatusLabel('A preparar envio...');
    setVideoTitle(title.trim());
    setVideoCategory(category);
    setOriginPath(fromPath || '/videos');
    setError(null);
    setSuccessMessage(null);

    try {
      const initRes = await fetchWithAuth('/api/v1/videos/direct-upload', {
        method: 'POST',
        body: JSON.stringify({
          fileSize: videoFile.size,
          fileName: videoFile.name,
        }),
      });
      const initBody = await initRes.json().catch(() => null);

      if (!initRes.ok || !initBody?.success || !initBody?.data?.uploadURL) {
        throw new Error(parseApiError(initRes, initBody, 'Não foi possível iniciar o envio do vídeo.'));
      }

      const { uploadURL, uid, mode } = initBody.data as {
        uploadURL: string;
        uid: string;
        mode: 'post' | 'tus';
      };

      setStatusLabel('A enviar vídeo...');
      if (mode === 'tus') {
        await uploadDirectTus(uploadURL, videoFile, (pct) => setProgress(pct));
      } else {
        await uploadDirectPost(uploadURL, videoFile, (pct) => setProgress(pct));
      }

      setStatusLabel('A guardar vídeo...');
      const confirmFd = new FormData();
      confirmFd.append('uid', uid);
      confirmFd.append('title', title.trim());
      confirmFd.append('category', category);
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
      const confirmBody = await confirmRes.json().catch(() => null);

      if (!confirmRes.ok || !confirmBody?.success) {
        throw new Error(parseApiError(confirmRes, confirmBody, 'Não foi possível concluir a publicação do vídeo.'));
      }

      setProgress(100);
      setSuccessMessage(`Vídeo "${title.trim()}" publicado com sucesso!`);
      setLastCompletedAt(Date.now());
      onSuccess?.();
      return true;
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível enviar o vídeo. Verifica a tua ligação e tenta novamente.'));
      return false;
    } finally {
      activeUploadRef.current = false;
      setIsUploading(false);
      setStatusLabel('');
    }
  }, []);

  const requestReopenModal = useCallback(() => {
    setReopenModalPath(originPath || '/videos');
  }, [originPath]);

  const clearReopenModal = useCallback(() => {
    setReopenModalPath(null);
  }, []);

  const dismissStatus = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <VideoUploadContext.Provider
      value={{
        isUploading,
        progress,
        statusLabel,
        videoTitle,
        videoCategory,
        originPath,
        error,
        successMessage,
        lastCompletedAt,
        reopenModalPath,
        isModalVisible,
        setModalVisible: setIsModalVisible,
        startVideoUpload,
        requestReopenModal,
        clearReopenModal,
        dismissStatus,
        clearError,
      }}
    >
      {children}
    </VideoUploadContext.Provider>
  );
}

export function useVideoUpload() {
  const ctx = useContext(VideoUploadContext);
  if (!ctx) {
    throw new Error('useVideoUpload deve ser usado dentro de VideoUploadProvider');
  }
  return ctx;
}

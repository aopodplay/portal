// src/lib/media.ts
import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL.replace(/\/+$/, '');

export const DEFAULT_COVER = '/default-cover.svg';
export const DEFAULT_VIDEO_THUMB = '/default-video-thumb.svg';

export const resolveMediaUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const path = String(value).trim();
  if (!path) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return BASE + path;
  if (path.startsWith('uploads/')) return BASE + '/' + path;

  const parts = path.replace(/\\/g, '/').split('/');
  const fileName = parts[parts.length - 1];
  return BASE + '/uploads/covers/' + fileName;
};

export const resolveCoverUrl = (value?: string | null): string => {
  const resolved = resolveMediaUrl(value);
  return resolved || DEFAULT_COVER;
};

export const resolveThumbUrl = (value?: string | null): string => {
  if (!value) return DEFAULT_VIDEO_THUMB;

  const path = String(value).trim();
  if (!path) return DEFAULT_VIDEO_THUMB;

  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return BASE + path;
  if (path.startsWith('uploads/')) return BASE + '/' + path;

  const parts = path.replace(/\\/g, '/').split('/');
  const fileName = parts[parts.length - 1];
  return BASE + '/uploads/images/' + fileName;
};

export const resolveAudioUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const path = String(value).trim();
  if (!path) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return BASE + path;
  if (path.startsWith('uploads/')) return BASE + '/' + path;

  const parts = path.replace(/\\/g, '/').split('/');
  const fileName = parts[parts.length - 1];
  return BASE + '/uploads/music/' + fileName;
};
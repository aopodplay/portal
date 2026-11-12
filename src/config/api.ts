// src/config/api.ts
import Cookies from "js-cookie";

// URL da API PodPlay
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Endpoints da API
export const API_ENDPOINTS = { 
  // Auth
  LOGIN: "/api/v1/auth/login",
  REGISTER: "/api/v1/auth/register",
  LOGOUT: "/api/v1/auth/logout",
  REFRESH_TOKEN: "/api/v1/auth/refresh-token",
  VERIFY_ACCOUNT: "/api/v1/auth/verify",
  RESEND_CODE: "/api/v1/auth/resend-verification",
  FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
  RESET_PASSWORD: "/api/v1/auth/reset-password",

  // User
  ME: "/api/v1/users/me",
  UPDATE_PROFILE: "/api/v1/users/me",
  CHANGE_PASSWORD: "/api/v1/users/change-password",

  // Profile
  PROFILE: "/api/v1/profile",
  PROFILE_STATS: "/api/v1/profile/stats",
  PROFILE_AVATAR: "/api/v1/profile/avatar",
  PROFILE_PREFERENCES: "/api/v1/profile/preferences",
  PROFILE_CHURCH: "/api/v1/profile/church",

  // Notifications
  NOTIFICATIONS: "/api/v1/notifications",
  NOTIFICATION_PREFERENCES: "/api/v1/notifications/preferences",
  NOTIFICATION_READ: "/api/v1/notifications/read",
  NOTIFICATION_READ_ALL: "/api/v1/notifications/read-all",
  NOTIFICATION_TEST: "/api/v1/notifications/test",

  // Sessions
  SESSIONS_ACTIVE: "/api/v1/sessions/active",
  SESSIONS_REVOKE_ALL: "/api/v1/sessions/revoke-all",
  SESSION_REVOKE: (sessionId: string) => `/api/v1/sessions/${sessionId}`,
  SESSION_VALIDATE: "/api/v1/sessions/validate",
  SESSION_STATS: "/api/v1/sessions/stats",

  // History (endpoints novos do HistoryController)
  HISTORY_PLAYBACK: "/api/v1/history/playback",
  HISTORY_SYNC: "/api/v1/history/sync",
  HISTORY_STATS: "/api/v1/history/stats",

  // Content
  CONTENTS: "/api/v1/contents",
  CATEGORIES: "/api/v1/contents/categories",

  // Music
  MUSIC: "/api/v1/music",
  MUSIC_STREAM: (id: number) => `/api/v1/music/stream/${id}`,
  MUSIC_SEARCH: "/api/v1/music/search",

  // Playlists
  PLAYLISTS: "/api/v1/playlists",

  // Favorites
  FAVORITES: "/api/v1/favorites",

  // History
  HISTORY: "/api/v1/history",

  // Library
  LIBRARY_FAVORITES: "/api/v1/library/favorites",
  LIBRARY_DOWNLOADS: "/api/v1/library/downloads",
  LIBRARY_HISTORY: "/api/v1/library/history",
  LIBRARY_SUMMARY: "/api/v1/library/summary",

  // Search
  SEARCH: "/api/v1/search",
  SEARCH_SUGGESTIONS: "/api/v1/search/suggestions",
  SEARCH_TRENDING: "/api/v1/search/trending",

  // Sections (Home)
  SECTIONS: "/api/v1/sections",
  HOME: "/api/v1/sections/home",
  CONTINUE_WATCHING: "/api/v1/sections/continue-watching",
  TRENDING: "/api/v1/trending",

  // Bible
  BIBLE_BOOKS: "/api/v1/bible/books",
  BIBLE_VERSE_OF_DAY: "/api/v1/bible/verse-of-day",

  // Podcasts
  PODCASTS: "/api/v1/podcasts",

  // Live Streaming
  LIVE_STREAMS: "/api/v1/live",
  FEATURED_LIVE: "/api/v1/live/featured",

  // Downloads
  DOWNLOADS: "/api/v1/downloads",
  DOWNLOAD_QUEUE: "/api/v1/downloads/queue",

  // Subscriptions
  SUBSCRIPTION_PLANS: "/api/v1/subscriptions/plans",
  SUBSCRIPTION_MINE: "/api/v1/subscriptions/mine",
  SUBSCRIPTION_CREATE: "/api/v1/subscriptions",

  // Churches
  CHURCHES: "/api/v1/churches",

  // Admin
  ADMIN_STATS: "/api/v1/admin/stats",
  ADMIN_USERS: "/api/v1/admin/users",
  ADMIN_CONTENTS: "/api/v1/admin/contents",
  ADMIN_USER_DISABLE: (id: number) => `/api/v1/admin/users/${id}/disable`,
  ADMIN_USER_ENABLE: (id: number) => `/api/v1/admin/users/${id}/enable`,
  ADMIN_USER_DELETE: (id: number) => `/api/v1/admin/users/${id}`,
  ADMIN_CONTENT_TOGGLE: (id: number) => `/api/v1/admin/contents/${id}/toggle`,
  ADMIN_CONTENT_DELETE: (id: number) => `/api/v1/admin/contents/${id}`,
};

// Funções para endpoints com parâmetros dinâmicos
export const getContentDetail = (id: string) => `/api/v1/contents/${id}`;
export const getStreamUrl = (id: string) => `/api/v1/contents/${id}/stream`;
export const getDownloadUrl = (id: string) => `/api/v1/contents/${id}/download`;
export const getPlaylistDetail = (id: string) => `/api/v1/playlists/${id}`;
export const getPlaylistAddContent = (id: string) => `/api/v1/playlists/${id}/contents`;
export const getPlaylistRemoveContent = (id: string, contentId: string) => `/api/v1/playlists/${id}/contents/${contentId}`;
export const getFavoriteToggle = (contentId: string) => `/api/v1/favorites/${contentId}/toggle`;
export const getHistoryProgress = (contentId: string) => `/api/v1/history/${contentId}/progress`;
export const getBibleChapter = (bookId: string, chapter: number) => `/api/v1/bible/${bookId}/${chapter}`;
export const getPodcastDetail = (id: string) => `/api/v1/podcasts/${id}`;
export const getPodcastEpisodes = (id: string) => `/api/v1/podcasts/${id}/episodes`;
export const getLiveStreamDetail = (id: string) => `/api/v1/live/${id}`;
export const getSubscriptionCancel = (id: string) => `/api/v1/subscriptions/${id}/cancel`;
export const getChurchDetail = (id: string) => `/api/v1/churches/${id}`;
export const getNotificationById = (id: number) => `/api/v1/notifications/${id}`;
export const getSessionById = (sessionId: string) => `/api/v1/sessions/${sessionId}`;

// Music functions
export const getMusicList = (page: number = 1, limit: number = 20, search?: string) => {
  let url = `/api/v1/music?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return url;
};

export const getHistoryResume = (contentId: string | number) =>
  `/api/v1/history/${contentId}/resume`;
export const getHistoryComplete = (contentId: string | number) =>
  `/api/v1/history/${contentId}/complete`;
export const getHistoryDelete = (contentId: string | number) =>
  `/api/v1/history/${contentId}`;

export const getMusicStream = (id: number) => `/api/v1/music/stream/${id}`;
export const getMusicSearch = (query: string, page: number = 1, limit: number = 20) =>
  `/api/v1/music/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

// Library functions
export const getLibraryFavorites = (page: number = 1, limit: number = 20) => `/api/v1/library/favorites?page=${page}&limit=${limit}`;
export const getLibraryDownloads = (page: number = 1, limit: number = 20) => `/api/v1/library/downloads?page=${page}&limit=${limit}`;
export const getLibraryHistory = (page: number = 1, limit: number = 20) => `/api/v1/library/history?page=${page}&limit=${limit}`;
export const getLibrarySummary = () => `/api/v1/library/summary`;
export const addToFavorites = (contentId: number) => `/api/v1/library/favorites/${contentId}`;
export const removeFromFavorites = (contentId: number) => `/api/v1/library/favorites/${contentId}`;
export const checkFavorite = (contentId: number) => `/api/v1/library/favorites/${contentId}/check`;
export const addToHistory = (contentId: number) => `/api/v1/library/history/${contentId}`;
export const removeFromHistory = (contentId: number) => `/api/v1/library/history/${contentId}`;
export const clearHistory = () => `/api/v1/library/history`;
export const addDownload = (contentId: number) => `/api/v1/library/downloads/${contentId}`;
export const removeDownload = (contentId: number) => `/api/v1/library/downloads/${contentId}`;

// Monta URL completa
export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

// Headers padrão
export const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Headers com autenticação
export const getAuthHeaders = (): HeadersInit => {
  let token: string | undefined = Cookies.get("podplay_token");

  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("podplay_token") || undefined;
  }

  return token
    ? {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    : {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
};

// Upload headers (multipart/form-data)
export const getUploadHeaders = (): HeadersInit => {
  let token: string | undefined = Cookies.get("podplay_token");

  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("podplay_token") || undefined;
  }

  return token
    ? {
      Authorization: `Bearer ${token}`,
    }
    : {};
};

// ============ FUNÇÕES DE API ============

// Função para fazer requisições autenticadas com tratamento de refresh token
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("podplay_token");

  const makeRequest = async (tokenValue: string | null) => {
    const headers = {
      ...options.headers,
      Authorization: tokenValue ? `Bearer ${tokenValue}` : "",
    };

    return fetch(getApiUrl(endpoint), { ...options, headers });
  };

  let response = await makeRequest(token);

  // Se token expirou (401), tentar renovar
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("podplay_refresh_token");

    if (refreshToken) {
      try {
        const refreshResponse = await fetch(getApiUrl(API_ENDPOINTS.REFRESH_TOKEN), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const { data } = await refreshResponse.json();
          const { accessToken, refreshToken: newRefreshToken } = data;

          // Atualizar tokens
          localStorage.setItem("podplay_token", accessToken);
          localStorage.setItem("podplay_refresh_token", newRefreshToken);
          Cookies.set("podplay_token", accessToken, { expires: 7 });
          Cookies.set("podplay_refresh_token", newRefreshToken, { expires: 7 });

          // Repetir requisição original com novo token
          response = await makeRequest(accessToken);
        }
      } catch (error) {
        console.error("Erro ao renovar token:", error);
      }
    }
  }

  return response;
}

// ============ PERFIL ============

export async function fetchProfile(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.PROFILE);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar perfil");
  }

  return result.data;
}

export async function updateProfile(data: {
  full_name?: string;
  bio?: string;
  birth_date?: string;
  gender?: string;
}): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.PROFILE, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao atualizar perfil");
  }

  return result.data;
}

export async function fetchProfileStats(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.PROFILE_STATS);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar estatísticas");
  }

  return result.data;
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const token = localStorage.getItem("podplay_token");

  const response = await fetch(getApiUrl(API_ENDPOINTS.PROFILE_AVATAR), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao fazer upload");
  }

  return { avatarUrl: result.data.avatar_url };
}

// ============ PREFERÊNCIAS ============

export async function fetchPreferences(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.PROFILE_PREFERENCES);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar preferências");
  }

  return result.data;
}

export async function updatePreferences(preferences: {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  autoPlay?: boolean;
  quality?: string;
  language?: string;
  theme?: string;
}): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.PROFILE_PREFERENCES, {
    method: "PUT",
    body: JSON.stringify(preferences),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao atualizar preferências");
  }

  return result.data;
}

// ============ NOTIFICAÇÕES ============

export async function fetchNotifications(page: number = 1, limit: number = 20): Promise<any> {
  const response = await fetchWithAuth(`${API_ENDPOINTS.NOTIFICATIONS}?page=${page}&limit=${limit}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar notificações");
  }

  return result.data;
}

export async function fetchNotificationPreferences(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.NOTIFICATION_PREFERENCES);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar preferências de notificações");
  }

  return result.data;
}

export async function updateNotificationPreferences(preferences: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
  new_episode_notifications?: boolean;
  live_notifications?: boolean;
}): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.NOTIFICATION_PREFERENCES, {
    method: "PUT",
    body: JSON.stringify(preferences),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao atualizar preferências de notificações");
  }

  return result.data;
}

export async function markNotificationsAsRead(notificationIds: number[]): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.NOTIFICATION_READ, {
    method: "POST",
    body: JSON.stringify({ notificationIds }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao marcar notificações como lidas");
  }

  return result.data;
}

export async function markAllNotificationsAsRead(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.NOTIFICATION_READ_ALL, {
    method: "POST",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao marcar notificações como lidas");
  }

  return result.data;
}

export async function deleteNotification(notificationId: number): Promise<any> {
  const response = await fetchWithAuth(getNotificationById(notificationId), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao deletar notificação");
  }

  return result.data;
}

// ============ SESSÕES ============

export async function fetchActiveSessions(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.SESSIONS_ACTIVE);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar sessões ativas");
  }

  return result.data;
}

export async function revokeSession(sessionId: string): Promise<any> {
  const response = await fetchWithAuth(getSessionById(sessionId), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao encerrar sessão");
  }

  return result.data;
}

export async function revokeAllSessions(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.SESSIONS_REVOKE_ALL, {
    method: "POST",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao encerrar sessões");
  }

  return result.data;
}

export async function validateToken(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.SESSION_VALIDATE);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Token inválido");
  }

  return result.data;
}

// ============ SEGURANÇA ============

export async function changePassword(oldPassword: string, newPassword: string): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.CHANGE_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao alterar senha");
  }

  return result.data;
}

// ============ IGREJA ============

export async function updateUserChurch(churchId: string | null): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.PROFILE_CHURCH, {
    method: "PUT",
    body: JSON.stringify({ church_id: churchId }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao atualizar igreja");
  }

  return result.data;
}

// ============ PLAYLISTS ============

export async function fetchPlaylists(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.PLAYLISTS);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar playlists");
  }

  return result.data;
}

export async function createPlaylist(data: { name: string; description?: string; isPublic?: boolean }): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.PLAYLISTS, {
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao criar playlist");
  }

  return result.data;
}

// ============ FAVORITOS ============

export async function fetchFavorites(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.FAVORITES);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar favoritos");
  }

  return result.data;
}

export async function toggleFavorite(contentId: string): Promise<{ isFavorite: boolean }> {
  const response = await fetchWithAuth(getFavoriteToggle(contentId), {
    method: "POST",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao alterar favorito");
  }

  return result.data;
}

// ============ HISTÓRICO ============

export async function fetchHistory(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.HISTORY);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar histórico");
  }

  return result.data;
}

export async function updateProgress(contentId: string, progress: number, completed?: boolean): Promise<any> {
  const response = await fetchWithAuth(getHistoryProgress(contentId), {
    method: "PUT",
    body: JSON.stringify({ progress, completed }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao atualizar progresso");
  }

  return result.data;
}

// ============ MÚSICA ============

export interface Music {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  duration: number | null;
  file_path: string;
  file_size: number;
  cover_image: string | null;
  plays: number;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

export async function fetchMusicList(page: number = 1, limit: number = 20, search?: string): Promise<{ items: Music[]; pagination: any }> {
  let url = `/api/v1/music?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const response = await fetchWithAuth(url);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar músicas");
  }

  return result.data;
}

export async function fetchMusicById(id: number): Promise<Music> {
  const response = await fetchWithAuth(`/api/v1/music/${id}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar música");
  }

  return result.data;
}

export async function searchMusic(query: string, page: number = 1, limit: number = 20): Promise<{ items: Music[]; pagination: any; query: string }> {
  const response = await fetchWithAuth(`/api/v1/music/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao buscar músicas");
  }

  return result.data;
}

export async function uploadMusic(file: File, data: { title: string; artist: string; album?: string; cover_image?: File }): Promise<Music> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('data', JSON.stringify({
    title: data.title,
    artist: data.artist,
    album: data.album,
    cover_image: data.cover_image
  }));

  const token = localStorage.getItem('podplay_token');
  const response = await fetch(getApiUrl(API_ENDPOINTS.MUSIC), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao fazer upload");
  }

  return result.data;
}

export async function updateMusic(id: number, data: { title?: string; artist?: string; album?: string }): Promise<Music> {
  const response = await fetchWithAuth(`/api/v1/music/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao atualizar música");
  }

  return result.data;
}

export async function deleteMusic(id: number): Promise<void> {
  const response = await fetchWithAuth(`/api/v1/music/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao deletar música");
  }
}

export function getMusicStreamUrl(id: number): string {
  return getApiUrl(API_ENDPOINTS.MUSIC_STREAM(id));
}

// ============ BIBLIOTECA (LIBRARY) ============

export async function fetchLibraryFavorites(page: number = 1, limit: number = 20): Promise<any> {
  const response = await fetchWithAuth(getLibraryFavorites(page, limit));
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar favoritos");
  }

  return result.data;
}

export async function fetchLibraryDownloads(page: number = 1, limit: number = 20): Promise<any> {
  const response = await fetchWithAuth(getLibraryDownloads(page, limit));
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar downloads");
  }

  return result.data;
}

export async function fetchLibraryHistory(page: number = 1, limit: number = 20): Promise<any> {
  const response = await fetchWithAuth(getLibraryHistory(page, limit));
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar histórico");
  }

  return result.data;
}

export async function fetchLibrarySummary(): Promise<any> {
  const response = await fetchWithAuth(getLibrarySummary());
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar resumo da biblioteca");
  }

  return result.data;
}

export async function addToFavoritesAPI(contentId: number): Promise<any> {
  const response = await fetchWithAuth(addToFavorites(contentId), {
    method: "POST",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao adicionar aos favoritos");
  }

  return result.data;
}

export async function removeFromFavoritesAPI(contentId: number): Promise<any> {
  const response = await fetchWithAuth(removeFromFavorites(contentId), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao remover dos favoritos");
  }

  return result.data;
}

export async function checkFavoriteStatus(contentId: number): Promise<boolean> {
  const response = await fetchWithAuth(checkFavorite(contentId));
  const result = await response.json();

  if (!result.success) {
    return false;
  }

  return result.data.isFavorited;
}

export async function addToHistoryAPI(contentId: number, progress: number = 0, completed: boolean = false): Promise<any> {
  const response = await fetchWithAuth(addToHistory(contentId), {
    method: "POST",
    body: JSON.stringify({ progress, completed }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao adicionar ao histórico");
  }

  return result.data;
}

export async function removeFromHistoryAPI(contentId: number): Promise<any> {
  const response = await fetchWithAuth(removeFromHistory(contentId), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao remover do histórico");
  }

  return result.data;
}

export async function clearHistoryAPI(): Promise<any> {
  const response = await fetchWithAuth(clearHistory(), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao limpar histórico");
  }

  return result.data;
}

export async function addDownloadAPI(contentId: number, quality: string = 'high'): Promise<any> {
  const response = await fetchWithAuth(addDownload(contentId), {
    method: "POST",
    body: JSON.stringify({ quality }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao registrar download");
  }

  return result.data;
}

export async function removeDownloadAPI(contentId: number): Promise<any> {
  const response = await fetchWithAuth(removeDownload(contentId), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao remover download");
  }

  return result.data;
}

// ============ ADMIN ============

export async function fetchAdminStats(): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.ADMIN_STATS);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar estatísticas");
  }

  return result.data;
}

export async function fetchAdminUsers(page: number = 1, limit: number = 20, search?: string): Promise<any> {
  let url = `${API_ENDPOINTS.ADMIN_USERS}?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const response = await fetchWithAuth(url);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar usuários");
  }

  return result.data;
}

export async function fetchAdminContents(page: number = 1, limit: number = 20, search?: string, type?: string): Promise<any> {
  let url = `${API_ENDPOINTS.ADMIN_CONTENTS}?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (type && type !== 'todos') url += `&type=${type}`;

  const response = await fetchWithAuth(url);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao carregar conteúdos");
  }

  return result.data;
}

export async function disableUser(userId: number): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.ADMIN_USER_DISABLE(userId), {
    method: "POST",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao desativar usuário");
  }

  return result.data;
}

export async function enableUser(userId: number): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.ADMIN_USER_ENABLE(userId), {
    method: "POST",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao ativar usuário");
  }

  return result.data;
}

export async function deleteUser(userId: number): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.ADMIN_USER_DELETE(userId), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao deletar usuário");
  }

  return result.data;
}

export async function toggleContentStatus(contentId: number): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.ADMIN_CONTENT_TOGGLE(contentId), {
    method: "POST",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao alterar status do conteúdo");
  }

  return result.data;
}

export async function deleteContent(contentId: number): Promise<any> {
  const response = await fetchWithAuth(API_ENDPOINTS.ADMIN_CONTENT_DELETE(contentId), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Erro ao deletar conteúdo");
  }

  return result.data;
}

// ============ LOGOUT ============

export async function logoutUser(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem("podplay_refresh_token");
    if (refreshToken) {
      await fetch(getApiUrl(API_ENDPOINTS.LOGOUT), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error("Erro no logout:", error);
  }

  // Limpar dados locais
  Cookies.remove("podplay_token");
  Cookies.remove("podplay_refresh_token");
  localStorage.removeItem("podplay_token");
  localStorage.removeItem("podplay_refresh_token");
  localStorage.removeItem("podplay_user");
}


// ============================================================
// HISTÓRICO — funções extra (alinhadas com HistoryController)
// ============================================================

export interface HistoryItem {
  id: number;
  content_id: number;
  title: string;
  cover_url?: string;
  author?: string;
  progress: number;
  duration?: number;
  completed: boolean;
  last_played_at: string;
  type?: string;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ResumePoint {
  position: number;
  progress: number;
  completed: boolean;
}

export interface HistoryStats {
  total_listened: number;
  total_contents: number;
  completed_count: number;
  streak_days?: number;
}

/** Grava progresso (HistoryController.recordPlayback). */
export async function recordPlayback(payload: {
  contentId: number;
  progress: number;
  completed?: boolean;
  deviceType?: string;
}) {
  const response = await fetchWithAuth("/api/v1/history/playback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Erro ao gravar progresso");
  return result.data;
}

/** Ponto onde o utilizador parou. */
export async function getResumePoint(contentId: string | number): Promise<ResumePoint | null> {
  const response = await fetchWithAuth(`/api/v1/history/${contentId}/resume`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Erro ao obter ponto de retomada");
  return result.data;
}

/** Marca como concluído. */
export async function markAsCompleted(contentId: string | number) {
  const response = await fetchWithAuth(`/api/v1/history/${contentId}/complete`, {
    method: "POST",
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Erro ao marcar como concluído");
  return result.data;
}

/** Estatísticas de escuta. */
export async function getHistoryStats(): Promise<HistoryStats> {
  const response = await fetchWithAuth("/api/v1/history/stats");
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Erro ao obter estatísticas");
  return result.data;
}

/** Sincroniza registos offline (PWA). */
export async function syncOfflineHistory(offlineRecords: any[]) {
  const response = await fetchWithAuth("/api/v1/history/sync", {
    method: "POST",
    body: JSON.stringify({ offlineRecords }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Erro ao sincronizar histórico");
  return result.data;
}
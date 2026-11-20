// src/lib/errorHandler.ts
import { getAuthHeaders } from '@/config/api';

const TECHNICAL_PATTERNS =
  /(failed to fetch|networkerror|load failed|err_network|econnrefused|enotfound|etimedout|unexpected token|json\.parse|is not valid json|typeerror:|referenceerror:|syntaxerror:|cannot read propert|sql syntax|er_[a-z_]+|unknown column|localhost:\d+|resposta não-json|src[/\\].*\.[tj]sx?|\bat\s+\S+\s*\()/i;

const NETWORK_PATTERNS =
  /(failed to fetch|networkerror|load failed|err_network|econnrefused|enotfound|etimedout|network request failed|erro de rede|erro ao conectar)/i;

/**
 * Converte qualquer erro técnico ou exceção numa mensagem amigável para o utilizador.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir o pedido. Tenta novamente dentro de instantes.'
): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Estás sem ligação à internet. Verifica a tua rede e tenta novamente.';
  }

  const raw =
    typeof error === 'string'
      ? error.trim()
      : error instanceof Error
        ? error.message.trim()
        : typeof (error as any)?.message === 'string'
          ? String((error as any).message).trim()
          : '';

  if (!raw) return fallback;

  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'O pedido demorou demasiado tempo a responder. Tenta novamente.';
  }

  if (NETWORK_PATTERNS.test(raw)) {
    return 'Não foi possível comunicar neste momento. Verifica a tua ligação à internet e tenta novamente.';
  }

  if (/unexpected token|json|not valid json/i.test(raw)) {
    return 'Recebemos uma resposta inesperada. Por favor, tenta novamente dentro de instantes.';
  }

  if (TECHNICAL_PATTERNS.test(raw)) {
    return fallback;
  }

  return raw;
}

/**
 * Extrai e traduz a mensagem de erro de uma resposta HTTP da API.
 */
export function parseApiError(
  response: Response,
  body?: any,
  fallback?: string
): string {
  const apiMessage =
    typeof body?.message === 'string' && body.message.trim()
      ? body.message.trim()
      : '';

  if (apiMessage && !TECHNICAL_PATTERNS.test(apiMessage)) {
    return apiMessage;
  }

  switch (response.status) {
    case 400:
      return 'Os dados enviados não são válidos. Verifica os campos e tenta novamente.';
    case 401:
      return 'A tua sessão expirou. Inicia sessão novamente para continuar.';
    case 403:
      return 'Não tens permissão para realizar esta ação.';
    case 404:
      return 'O conteúdo solicitado não foi encontrado.';
    case 409:
      return 'Este registo já existe ou entrou em conflito.';
    case 413:
      return 'O ficheiro selecionado excede o tamanho máximo permitido.';
    case 422:
      return 'Não foi possível processar os dados enviados. Verifica as informações.';
    case 429:
      return 'Demasiadas tentativas seguidas. Aguarda alguns segundos e tenta novamente.';
    default:
      if (response.status >= 500) {
        return (
          fallback ||
          'Ocorreu um contratempo temporário no serviço. Tenta novamente dentro de momentos.'
        );
      }
      return fallback || 'Não foi possível concluir o pedido. Tenta novamente.';
  }
}

export interface ApiJsonFetchOptions {
  fetcher?: (input: string, init?: RequestInit) => Promise<Response>;
  useAuthHeaders?: boolean;
  fallbackMessage?: string;
}

/**
 * Executa uma chamada HTTP JSON e garante que qualquer falha (rede, HTTP ou
 * resposta não-JSON) lança apenas uma mensagem amigável, sem expor detalhes técnicos.
 */
export async function apiJsonFetch<T>(
  url: string,
  init?: RequestInit,
  options: ApiJsonFetchOptions = {}
): Promise<T> {
  const {
    fetcher = fetch,
    useAuthHeaders = true,
    fallbackMessage = 'Não foi possível concluir o pedido. Tenta novamente.',
  } = options;

  let res: Response;
  try {
    res = await fetcher(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(useAuthHeaders ? getAuthHeaders() : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new Error(getFriendlyErrorMessage(err, fallbackMessage));
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    throw new Error(parseApiError(res, null, fallbackMessage));
  }

  if (!res.ok || !body?.success) {
    throw new Error(parseApiError(res, body, fallbackMessage));
  }

  return body.data as T;
}

/**
 * Processa a resposta JSON de um upload multipart com tratamento amigável de erros.
 */
export async function parseMultipartResponse<T>(
  res: Response,
  fallbackMessage = 'Não foi possível concluir o envio. Tenta novamente.'
): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    throw new Error(parseApiError(res, null, fallbackMessage));
  }

  if (!res.ok || !body?.success) {
    throw new Error(parseApiError(res, body, fallbackMessage));
  }

  return body.data as T;
}

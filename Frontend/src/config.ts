const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const DEFAULT_WS_BASE_URL = 'ws://localhost:8000';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveBaseUrl = (candidate: string | undefined, fallback: string) => {
  const normalized = candidate?.trim() ?? fallback;
  return trimTrailingSlash(normalized || fallback);
};

export const apiBaseUrl = resolveBaseUrl(import.meta.env.VITE_API_BASE_URL, DEFAULT_API_BASE_URL);
export const wsBaseUrl = resolveBaseUrl(import.meta.env.VITE_WS_BASE_URL, DEFAULT_WS_BASE_URL);

export const endpoints = {
  rooms: `${apiBaseUrl}/rooms`,
  autocomplete: `${apiBaseUrl}/autocomplete`
} as const;

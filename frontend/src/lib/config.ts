const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
const wsUrl = import.meta.env.VITE_WS_URL as string | undefined;

export const API_BASE = apiUrl || '/api';
export const API_URL = apiUrl ?? '';

export const WS_URL =
  wsUrl ??
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

export const CHAT_URL = `${API_URL || ''}/chat`;
export const YJS_URL = `${WS_URL}/yjs`;

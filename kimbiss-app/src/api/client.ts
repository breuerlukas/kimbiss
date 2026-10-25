import { API_CACHE } from "./cache.ts";

const TOKEN_KEY = "kimbiss.token";

/** A refusal from the api; `code` is its stable snake_case error key. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

let signedOutListener: () => void = () => {};

export const session = {
  token: () => localStorage.getItem(TOKEN_KEY),
  save: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  /** Also drops the cached api answers, so the next account sees none of them. */
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    window.caches?.delete(API_CACHE).catch(() => undefined);
  },
  /** Called when the api rejects the stored token, so the app shows sign-in. */
  onSignedOut: (listener: () => void) => {
    signedOutListener = listener;
  },
};

/**
 * JSON request against `/v1`. A 401 outside `/auth/` ends the session. Every
 * failure is an {@link ApiError}, so the app can say what went wrong: `offline`
 * (the device has no network), `unreachable` (network, but no answer from the
 * server), `server_error` (the server or its proxy broke, no code of its own),
 * or the api's own code. The browser caches nothing (the service worker keeps
 * the last answers for offline only), so a change shows at once.
 */
export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await send(method, path, body);
  if (response.status === 401 && !path.startsWith("/auth/")) {
    session.clear();
    signedOutListener();
  }
  const text = await response.text();
  const json = parseJson(text);
  if (!response.ok) {
    throw new ApiError(response.status, json?.error ?? (response.status >= 500 ? "server_error" : "unknown"));
  }
  return json as T;
}

/** A JPEG from the api as an object URL; the caller revokes it. */
export async function apiImage(path: string): Promise<string> {
  const response = await send("GET", path);
  if (!response.ok) {
    throw new ApiError(response.status, response.status >= 500 ? "server_error" : "unknown");
  }
  return URL.createObjectURL(await response.blob());
}

/** The error key `errors.<code>` for any failure, an unexpected one included. */
export function errorCode(failure: unknown): string {
  return failure instanceof ApiError ? failure.code : "unknown";
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const token = session.token();
  try {
    return await fetch(`/v1${path}`, {
      method,
      cache: "no-store",
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, navigator.onLine ? "unreachable" : "offline");
  }
}

/** A proxy's error page is HTML, not JSON; it then carries no code. */
function parseJson(text: string) {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

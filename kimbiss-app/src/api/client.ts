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
  clear: () => localStorage.removeItem(TOKEN_KEY),
  /** Called when the api rejects the stored token, so the app shows sign-in. */
  onSignedOut: (listener: () => void) => {
    signedOutListener = listener;
  },
};

/** JSON request against `/v1`. A 401 outside `/auth/` ends the session. */
export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = session.token();
  const response = await fetch(`/v1${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401 && !path.startsWith("/auth/")) {
    session.clear();
    signedOutListener();
  }
  const text = await response.text();
  const json = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new ApiError(response.status, json?.error ?? "unknown");
  }
  return json as T;
}

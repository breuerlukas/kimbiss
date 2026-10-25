import { useCallback, useEffect, useRef, useState } from "react";
import { errorCode } from "./client.ts";

/**
 * Loads once per change of `key` and hands out `reload` for after a write.
 * `data` stays the previous value while a reload of the same key runs, so
 * lists don't flicker, but it is undefined until the current key has loaded:
 * one day's meals never show under another day. Only the latest call's answer
 * counts, so a slow earlier one cannot overwrite it. `error` is the failed
 * load's error code.
 */
export function useLoad<T>(loader: () => Promise<T>, key: string) {
  const [loaded, setLoaded] = useState<{ key: string; data: T }>();
  const [error, setError] = useState<string>();
  const latest = useRef(0);
  const load = useCallback(loader, [key]);

  const reload = useCallback(() => {
    const call = ++latest.current;
    setError(undefined);
    return load().then(
      (data) => call === latest.current && setLoaded({ key, data }),
      (failure) => call === latest.current && setError(errorCode(failure)),
    );
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data: loaded?.key === key ? loaded.data : undefined, error, reload };
}

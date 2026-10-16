import { useCallback, useEffect, useState } from "react";

/**
 * Loads once per change of `key` and hands out `reload` for after a write.
 * `data` stays the previous value while a reload runs, so lists don't flicker.
 */
export function useLoad<T>(loader: () => Promise<T>, key: string) {
  const [data, setData] = useState<T>();
  const [failed, setFailed] = useState(false);
  const load = useCallback(loader, [key]);

  const reload = useCallback(() => {
    setFailed(false);
    return load().then(setData, () => setFailed(true));
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, failed, reload };
}

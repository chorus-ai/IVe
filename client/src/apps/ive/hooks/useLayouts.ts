import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { setLayouts, DEFAULT_LAYOUTS } from '../store';
import { listLayouts } from '../api/layouts';

/**
 * Saved layouts from the store, refreshed from the server on mount.
 * Built-in defaults that aren't on the server are appended, so callers
 * always see at least DEFAULT_LAYOUTS.
 */
export function useSavedLayouts() {
  const dispatch = useAppDispatch();
  const layouts = useAppSelector((s) => s.ive.savedLayouts);

  useEffect(() => {
    listLayouts().then((server) => {
      const serverIds = new Set(server.map((l) => l.id));
      const missingDefaults = DEFAULT_LAYOUTS.filter((l) => !serverIds.has(l.id));
      dispatch(setLayouts([...server, ...missingDefaults]));
    }).catch(() => {});
  }, [dispatch]);

  return layouts;
}

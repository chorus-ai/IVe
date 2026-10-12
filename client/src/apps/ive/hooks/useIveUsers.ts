import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useQuery } from '../../../hooks/useApiQuery';
import { useMutation } from '../../../hooks/useApiMutation';
import { showIveAlert } from '../store';
import {
  addFeatureUser,
  listFeatureUsers,
  removeFeatureUser,
  updateFeatureUser,
  updateUser,
  type IveUser,
  type NewUserPayload,
} from '../api/users';

const APP = 'ive';

/**
 * The signed-in user's IVe membership. `/api/auth/me` returns featureUsers as a
 * map keyed by feature id, each value carrying the feature's name as `app` —
 * so the id IVe was mounted under is read off the key, never hardcoded.
 */
export function useIveMembership(): { fid: number | null; role: string | null; isAdmin: boolean } {
  const user = useAppSelector((s) => s.main.user);

  const entry = Object.entries(user?.featureUsers ?? {}).find(
    ([, fu]) => (fu as { app?: string }).app === APP,
  );

  if (!entry) return { fid: null, role: null, isAdmin: false };

  const [key, fu] = entry;
  const role = (fu as { role?: string }).role ?? null;
  return { fid: Number(key), role, isAdmin: role === 'admin' };
}

/**
 * Members of the IVe feature. Only fetches while `enabled` (i.e. drawer open).
 * `searchString` is passed straight to the backend's user-search endpoint —
 * pass it already debounced, since every change refetches.
 */
export function useIveUsers(fid: number | null, enabled: boolean, searchString = '') {
  const dispatch = useAppDispatch();

  const { data, isLoading, error, refetch } = useQuery<IveUser[]>(
    () => listFeatureUsers(fid as number, searchString),
    [fid, enabled, searchString],
    { enabled: enabled && fid !== null },
  );

  const onError = useCallback(
    (err: Error) => dispatch(showIveAlert({ message: err.message, severity: 'error' })),
    [dispatch],
  );

  const add = useMutation(
    async (payload: NewUserPayload) => {
      const created = await addFeatureUser(fid as number, payload);
      refetch();
      dispatch(showIveAlert({ message: 'User added', severity: 'success' }));
      return created;
    },
    { onError },
  );

  /**
   * An edit can touch the account row, the membership row, or both — they live
   * behind different endpoints. Each half is skipped when nothing in it
   * changed, which also avoids the 500 the backend returns for a no-op update.
   */
  const edit = useMutation(
    async ({
      uid,
      account,
      membership,
    }: {
      uid: number;
      account?: Parameters<typeof updateUser>[1];
      membership?: { role?: string; status?: string };
    }) => {
      if (account && Object.keys(account).length > 0) await updateUser(uid, account);
      if (membership && Object.keys(membership).length > 0) {
        await updateFeatureUser(fid as number, uid, membership);
      }
      refetch();
      dispatch(showIveAlert({ message: 'User updated', severity: 'success' }));
      return uid;
    },
    { onError },
  );

  const remove = useMutation(
    async (uid: number) => {
      const result = await removeFeatureUser(fid as number, uid);
      refetch();
      dispatch(showIveAlert({ message: 'User removed', severity: 'success' }));
      return result;
    },
    { onError },
  );

  return { users: data ?? [], isLoading, error, refetch, add, edit, remove };
}

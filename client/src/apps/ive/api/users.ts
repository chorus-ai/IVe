import { apiFetch } from '../../../hooks/useApiFetch';

/** A user's membership row for one feature (`featureUsers` join table). */
export interface FeatureMembership {
  id: number;
  featureId: number;
  userId: number;
  role: string;
  status?: string;
}

export interface IveUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  loginType?: string;
  isBot?: boolean;
  avatar?: string | null;
  /** Only the memberships the search was scoped to, i.e. IVe's. */
  featureUsers?: FeatureMembership[];
}

export interface NewUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  loginType: string;
  role: string;
  status?: string;
  isBot?: boolean;
}

export const IVE_ROLES = ['admin', 'user'] as const;
export const IVE_STATUSES = ['active', 'Pending'] as const;
export const LOGIN_TYPES = ['local', 'github', 'google', 'azure'] as const;

/**
 * Users who have a membership in the given feature, optionally narrowed by
 * `searchString` — the backend matches it against first name, last name,
 * username and email.
 */
export function listFeatureUsers(fid: number, searchString = ''): Promise<IveUser[]> {
  return apiFetch<IveUser[]>('/api/user/search', {
    method: 'POST',
    body: JSON.stringify({ fid, searchString: searchString.trim() }),
  });
}

/**
 * Add a user to the feature. The backend creates the account when the username
 * is new and only grants the membership when it already exists.
 */
export function addFeatureUser(fid: number, payload: NewUserPayload): Promise<IveUser> {
  return apiFetch<IveUser>(`/api/feature/${fid}/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Change the account's own fields (name, email, login type, username). */
export function updateUser(
  uid: number,
  body: Partial<Pick<NewUserPayload, 'firstName' | 'lastName' | 'email' | 'username' | 'loginType'>>,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/user/${uid}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** Change a user's role or status within the feature. */
export function updateFeatureUser(
  fid: number,
  uid: number,
  body: { role?: string; status?: string },
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/feature/${fid}/users/${uid}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** Revoke the membership. The backend deletes the account if it was the last one. */
export function removeFeatureUser(fid: number, uid: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/feature/${fid}/users/${uid}`, {
    method: 'DELETE',
  });
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from 'react-nice-avatar';
import { avatarConfigFrom } from '../../../utils/avatarConfig';
import { useAppSelector } from '../../../hooks/redux';
import DataGrid, { type GridColDef } from './ui/DataGrid';
import { Drawer } from './ui/Drawer';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Alert } from './ui/Alert';
import { Popup } from './ui/Popup';
import { useIveUsers } from '../hooks/useIveUsers';
import {
  IVE_ROLES,
  IVE_STATUSES,
  LOGIN_TYPES,
  type IveUser,
  type NewUserPayload,
} from '../api/users';

const FIELD =
  'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all';
// NB: no bare `block` class — m2d's Home.css redefines it as a fixed overlay.
const EYEBROW =
  'text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2';

const EMPTY_FORM: NewUserPayload = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  loginType: 'local',
  role: 'user',
  status: 'active',
};

const roleTone = (role?: string) => ((role ?? '').toLowerCase() === 'admin' ? ('info' as const) : ('neutral' as const));

const statusTone = (status?: string) => {
  const s = (status ?? '').toLowerCase();
  if (s === 'active' || s === 'approved') return 'success' as const;
  if (s === 'pending') return 'warning' as const;
  return 'neutral' as const;
};

/** IVe's membership row for a user, i.e. the one the search was scoped to. */
const membershipOf = (u: IveUser) => u.featureUsers?.[0];

/**
 * Older rows carry roles outside IVE_ROLES (e.g. "Regular"). Keep the stored
 * value selectable so the dropdown doesn't silently misreport it.
 */
const roleOptions = (current?: string) =>
  current && !IVE_ROLES.includes(current as (typeof IVE_ROLES)[number])
    ? [current, ...IVE_ROLES]
    : [...IVE_ROLES];

const statusOptions = (current?: string) =>
  current && !IVE_STATUSES.includes(current as (typeof IVE_STATUSES)[number])
    ? [current, ...IVE_STATUSES]
    : [...IVE_STATUSES];

export default function UsersDrawer({
  open,
  onClose,
  fid,
}: {
  open: boolean;
  onClose: () => void;
  fid: number | null;
}) {
  const currentUser = useAppSelector((s) => s.main.user);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Same server-side search the concept search uses: debounce the input, then
  // let /api/user/search do the matching (first/last name, username, email).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const { users, isLoading, error, add, edit, remove } = useIveUsers(
    fid,
    open,
    debouncedSearch,
  );

  const [formOpen, setFormOpen] = useState(false);
  /** null while adding; the row being edited otherwise. */
  const [editing, setEditing] = useState<IveUser | null>(null);
  const [form, setForm] = useState<NewUserPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<IveUser | null>(null);

  const setField = (name: keyof NewUserPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (u: IveUser) => {
    const membership = membershipOf(u);
    setEditing(u);
    setForm({
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      email: u.email ?? '',
      username: u.username ?? '',
      loginType: u.loginType || 'local',
      role: membership?.role ?? 'user',
      status: membership?.status ?? 'active',
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setFormError('First name, last name and email are required.');
      return;
    }
    setFormError(null);

    // The backend keys off username; fall back to the email when the login
    // type doesn't carry a separate handle.
    const payload: NewUserPayload = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      username: form.username.trim() || form.email.trim(),
    };

    try {
      if (editing) {
        const membership = membershipOf(editing);
        const account: Record<string, string> = {};
        if (payload.firstName !== editing.firstName) account.firstName = payload.firstName;
        if (payload.lastName !== editing.lastName) account.lastName = payload.lastName;
        if (payload.email !== editing.email) account.email = payload.email;
        if (payload.username !== editing.username) account.username = payload.username;
        if (payload.loginType !== (editing.loginType ?? '')) account.loginType = payload.loginType;

        const membershipDiff: { role?: string; status?: string } = {};
        if (payload.role !== membership?.role) membershipDiff.role = payload.role;
        if (payload.status !== membership?.status) membershipDiff.status = payload.status;

        if (Object.keys(account).length === 0 && Object.keys(membershipDiff).length === 0) {
          closeForm();
          return;
        }
        await edit.mutate({ uid: editing.id, account, membership: membershipDiff });
      } else {
        await add.mutate(payload);
      }
      closeForm();
    } catch {
      /* the hook already surfaced it as a toast */
    }
  };

  const columns: GridColDef<IveUser>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'User',
        flex: 2,
        valueGetter: ({ row }) => `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
        renderCell: ({ row }) => {
          const config = avatarConfigFrom(row.avatar);
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10">
                {config ? (
                  <Avatar style={{ width: '32px', height: '32px' }} {...config} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-primary">
                    {row.firstName?.charAt(0).toUpperCase()}
                    {row.lastName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm text-slate-800 dark:text-slate-100">
                  {row.firstName} {row.lastName}
                  {currentUser?.id === row.id && (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-slate-400">
                      you
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {row.email || row.username}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 110,
        valueGetter: ({ row }) => membershipOf(row)?.role ?? '',
        renderCell: ({ row }) => {
          const role = membershipOf(row)?.role;
          return role ? (
            <Badge tone={roleTone(role)}>{role}</Badge>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          );
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        valueGetter: ({ row }) => membershipOf(row)?.status ?? '',
        renderCell: ({ row }) => {
          const status = membershipOf(row)?.status;
          return status ? (
            <Badge tone={statusTone(status)}>{status}</Badge>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          );
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        renderCell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(row)}
              aria-label={`Edit ${row.firstName} ${row.lastName}`}
              className="p-1.5 text-slate-400 transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
            <button
              onClick={() => setPendingRemoval(row)}
              disabled={currentUser?.id === row.id}
              aria-label={`Remove ${row.firstName} ${row.lastName}`}
              className="p-1.5 text-slate-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-base">person_remove</span>
            </button>
          </div>
        ),
      },
    ],
    // openEdit closes over `editing`-free state only, so the identity is stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id],
  );

  const confirmRemove = async () => {
    if (!pendingRemoval) return;
    try {
      await remove.mutate(pendingRemoval.id);
    } catch {
      /* toast */
    }
    setPendingRemoval(null);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Users"
      widthClass="w-full sm:w-[50vw]"
      rightActions={<Badge tone="info">{users.length}</Badge>}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!formOpen && (
            <Button onClick={openAdd}>
              <span className="material-symbols-outlined text-base">person_add</span>
              Add user
            </Button>
          )}
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Toolbar — same search treatment as the Endpoints page */}
        <div className="shrink-0 px-4 py-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 outline-none w-full transition-all"
            />
          </div>
        </div>

        {/* Add-user form — same drawer, expanded above the list */}
        {formOpen && (
          <div className="shrink-0 mx-4 mb-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {editing ? `Edit ${editing.firstName} ${editing.lastName}` : 'New user'}
              </h3>
              <button
                onClick={closeForm}
                className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                aria-label="Cancel"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {formError && (
              <Alert tone="danger" title="Missing fields" className="mb-3">
                {formError}
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className={EYEBROW} htmlFor="ive-user-first">
                  First name
                </label>
                <input
                  id="ive-user-first"
                  className={FIELD}
                  value={form.firstName}
                  onChange={setField('firstName')}
                  placeholder="e.g., John"
                />
              </div>
              <div className="flex flex-col">
                <label className={EYEBROW} htmlFor="ive-user-last">
                  Last name
                </label>
                <input
                  id="ive-user-last"
                  className={FIELD}
                  value={form.lastName}
                  onChange={setField('lastName')}
                  placeholder="e.g., Snow"
                />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className={EYEBROW} htmlFor="ive-user-email">
                  Email
                </label>
                <input
                  id="ive-user-email"
                  type="email"
                  className={FIELD}
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="e.g., john.snow@emory.edu"
                />
              </div>
              <div className="flex flex-col">
                <label className={EYEBROW} htmlFor="ive-user-login">
                  Login type
                </label>
                <select
                  id="ive-user-login"
                  className={FIELD}
                  value={form.loginType}
                  onChange={setField('loginType')}
                >
                  {LOGIN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className={EYEBROW} htmlFor="ive-user-username">
                  {form.loginType === 'github' ? 'Git handle' : 'Username'}
                </label>
                <input
                  id="ive-user-username"
                  className={FIELD}
                  value={form.username}
                  onChange={setField('username')}
                  placeholder="defaults to the email"
                />
              </div>
              <div className="flex flex-col">
                <label className={EYEBROW} htmlFor="ive-user-role">
                  Role
                </label>
                {/* Changing your own role here could lock you out of this drawer. */}
                <select
                  id="ive-user-role"
                  className={FIELD}
                  value={form.role}
                  onChange={setField('role')}
                  disabled={editing?.id === currentUser?.id}
                >
                  {roleOptions(form.role).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className={EYEBROW} htmlFor="ive-user-status">
                  Status
                </label>
                <select
                  id="ive-user-status"
                  className={FIELD}
                  value={form.status}
                  onChange={setField('status')}
                >
                  {statusOptions(form.status).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={add.isLoading || edit.isLoading}>
                {(add.isLoading || edit.isLoading) && (
                  <span className="material-symbols-outlined animate-spin text-base">
                    progress_activity
                  </span>
                )}
                {editing ? 'Save changes' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="min-h-0 flex-1 overflow-auto custom-scrollbar px-4 pb-4">
          {error && (
            <Alert tone="danger" title="Couldn't load users" className="mb-3">
              {error.message}
            </Alert>
          )}

          <DataGrid
            rows={users}
            columns={columns}
            getRowId={(row) => row.id}
            loading={isLoading}
            pageSizeOptions={[5, 10, 20, 50]}
            emptyMessage={
              search ? `No user matches "${search}".` : 'No one has access to IVe yet.'
            }
          />
        </div>
      </div>

      <Popup
        open={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        title="Remove user"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setPendingRemoval(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemove} disabled={remove.isLoading}>
              Remove
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-200">
          Revoke IVe access for{' '}
          <span className="font-medium">
            {pendingRemoval?.firstName} {pendingRemoval?.lastName}
          </span>
          ? If IVe is their only app, the account is deleted entirely.
        </p>
      </Popup>
    </Drawer>
  );
}

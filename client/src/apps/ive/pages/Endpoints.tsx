import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { setEndpoints, removeEndpoint, showIveAlert } from '../store';
import {
  listVisibleEndpoints,
  deleteEndpoint,
  updateEndpoint,
  setEndpointTags,
} from '../api/endpoints';
import SaveEndpointModal from '../components/SaveEndpointModal';
import EndpointRunModal from '../components/EndpointRunModal';
import DataGrid, { GridColDef } from '../components/ui/DataGrid';

interface Owner {
  id?: number;
  initials: string;
  fullName: string;
  isMe: boolean;
}

interface Endpoint {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  tags: string[];
  body?: string;
  attributes: string[];
  countOnly: boolean;
  isPublic: boolean;
  isCached: boolean;
  owner: Owner;
  created: string;
  createdAtRaw: string;
  storeIndex?: number;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-orange-500',
];

const TABS = [
  { id: 0, label: 'All' },
  { id: 1, label: 'By Me' },
  { id: 2, label: 'Cached' },
];

const colorForId = (id?: number) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];

const getInitials = (cb: any): string => {
  if (!cb) return '?';
  const fi = (cb.firstName || '')[0];
  const li = (cb.lastName || '')[0];
  if (fi || li) return `${fi || ''}${li || ''}`.toUpperCase();
  const src = cb.username || cb.email || '';
  return src.slice(0, 2).toUpperCase() || '?';
};

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'POST': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'PUT': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
};

const EndpointsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [runningIdx, setRunningIdx] = useState<number | null>(null);
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.main.user);
  const endpoints = useAppSelector((s) => s.ive.endpoint);

  const editingRaw = editingIdx != null ? (endpoints[editingIdx] as any) : null;

  useEffect(() => {
    if (!user?.id) return;
    listVisibleEndpoints()
      .then((data) => dispatch(setEndpoints(data)))
      .catch(() => {});
  }, [dispatch, user?.id]);

  const handleDelete = useCallback(
    async (index: number) => {
      const ep = endpoints[index] as any;
      if (ep?.id) {
        try {
          await deleteEndpoint(ep.id);
          if (user?.id) {
            const fresh = await listVisibleEndpoints();
            dispatch(setEndpoints(fresh));
            return;
          }
        } catch {
          // fall through to local removal
        }
      }
      dispatch(removeEndpoint(index));
    },
    [dispatch, endpoints, user?.id],
  );

  const storeRows: Endpoint[] = useMemo(
    () =>
      endpoints.map((se: any, idx: number) => {
        const method = ((se.method as string) ?? 'POST').toUpperCase() as Endpoint['method'];
        const path = se.endpoint ? String(se.endpoint) : '-';
        const params = (se.params ?? {}) as Record<string, unknown>;
        const bodyObj = params.body;
        const bodyStr = bodyObj ? JSON.stringify(bodyObj, null, 2) : undefined;
        const attributes = Array.isArray(params.attributes) ? (params.attributes as string[]) : [];
        const countOnly = !!params.countOnly;

        const iveTags = Array.isArray(se.iveTags)
          ? se.iveTags.map((t: any) => t.slug).filter(Boolean)
          : [];
        const legacyTags = Array.isArray(se.tags) ? se.tags : [];
        const tags = (iveTags.length ? iveTags : legacyTags).filter(Boolean);

        const created = se.createdAt
          ? new Date(se.createdAt).toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-';

        const cb = se.createdBy;
        const ownerId = cb?.id ?? se.userId;
        const fullName =
          (cb && [cb.firstName, cb.lastName].filter(Boolean).join(' ')) ||
          cb?.username ||
          cb?.email ||
          (ownerId ? `User #${ownerId}` : 'Unknown');
        const owner: Owner = {
          id: ownerId,
          initials: getInitials(cb),
          fullName,
          isMe: !!user?.id && ownerId === user.id,
        };

        return {
          id: `store-${idx}`,
          method,
          path,
          description: se.description ? String(se.description) : '',
          tags,
          body: bodyStr,
          attributes,
          countOnly,
          isPublic: se.isPublic !== false,
          isCached: !!se.isCached,
          owner,
          created,
          createdAtRaw: se.createdAt ? String(se.createdAt) : '',
          storeIndex: idx,
        };
      }),
    [endpoints, user?.id]
  );

  const tabFiltered = useMemo(() => {
    switch (activeTab) {
      case 1:
        return storeRows.filter((e) => e.owner.isMe);
      case 2:
        return storeRows.filter((e) => e.isCached);
      default:
        return storeRows;
    }
  }, [storeRows, activeTab]);

  const filteredEndpoints = useMemo(
    () =>
      tabFiltered.filter((endpoint) => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        return (
          endpoint.path.toLowerCase().includes(q) ||
          endpoint.description.toLowerCase().includes(q) ||
          endpoint.owner.fullName.toLowerCase().includes(q) ||
          endpoint.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }),
    [tabFiltered, searchQuery]
  );

  const columns: GridColDef<Endpoint>[] = useMemo(() => [
    {
      field: 'method',
      headerName: 'Method',
      width: 90,
      renderCell: ({ row }) => (
        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getMethodColor(row.method)}`}>
          {row.method}
        </span>
      ),
    },
    {
      field: 'path',
      headerName: 'Endpoint',
      flex: 2,
      renderCell: ({ row }) => (
        <div>
          <code className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {row.path}
          </code>
          {row.body && (
            <div className="mt-2">
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-primary font-medium select-none">View Body</summary>
                <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-950 text-blue-600 dark:text-blue-400 rounded-lg overflow-x-auto font-mono text-[10px] leading-relaxed border border-slate-200 dark:border-slate-800">
                  {row.body}
                </pre>
              </details>
            </div>
          )}
        </div>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      renderCell: ({ row }) =>
        row.description || <span className="text-slate-400">-</span>,
    },
    {
      field: 'tags',
      headerName: 'Tags',
      flex: 1,
      sortable: false,
      renderCell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.tags.length > 0
            ? row.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {tag}
                </span>
              ))
            : <span className="text-slate-400 text-xs">-</span>}
        </div>
      ),
    },
    {
      field: 'isPublic',
      headerName: 'Public',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) =>
        row.isPublic ? (
          <span className="material-symbols-outlined text-base text-emerald-500" title="Public">public</span>
        ) : (
          <span className="material-symbols-outlined text-base text-slate-400" title="Private">lock</span>
        ),
    },
    {
      field: 'owner',
      headerName: 'Owner',
      flex: 1,
      valueGetter: ({ row }) => row.owner.fullName,
      renderCell: ({ row }) =>
        row.owner.isMe ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            Me
          </span>
        ) : (
          <div className="flex items-center gap-2" title={row.owner.fullName}>
            <span
              className={`inline-flex items-center justify-center size-6 rounded-full text-[10px] font-bold text-white ${colorForId(row.owner.id)}`}
            >
              {row.owner.initials}
            </span>
          </div>
        ),
    },
    {
      field: 'createdAtRaw',
      headerName: 'Created',
      flex: 1,
      renderCell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{row.created}</span>
      ),
    },
    {
      field: 'isCached',
      headerName: 'Cached',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) =>
        row.isCached ? (
          <span className="material-symbols-outlined text-base text-emerald-500" title="Cached">check_circle</span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            className="p-1 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Run"
            onClick={(e) => {
              e.stopPropagation();
              if (row.storeIndex != null) setRunningIdx(row.storeIndex);
            }}
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
          </button>
          <button
            className="p-1 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              if (row.storeIndex != null) setEditingIdx(row.storeIndex);
            }}
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
          <button
            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              if (row.storeIndex != null) handleDelete(row.storeIndex);
            }}
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      ),
    },
  ], [handleDelete]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">API Endpoints</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and view available API endpoints for the application.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 outline-none w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">
          <div className="px-6 border border-slate-200 dark:border-slate-800 border-b-0 rounded-t-xl shrink-0 flex items-center gap-6 bg-slate-50/50 dark:bg-slate-950/20">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-all font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <DataGrid
            rows={filteredEndpoints}
            columns={columns}
            getRowId={(row) => row.id}
            emptyMessage="No endpoints saved yet."
            pageSizeOptions={[10, 25, 50]}
            className="rounded-t-none"
          />
        </div>
      </div>

      <EndpointRunModal
        endpoint={runningIdx != null ? (endpoints[runningIdx] as any) : null}
        onClose={() => setRunningIdx(null)}
      />

      <SaveEndpointModal
        isOpen={editingIdx != null}
        onClose={() => setEditingIdx(null)}
        mode="edit"
        endpoint={
          editingRaw
            ? {
                endpoint: editingRaw.endpoint,
                method: editingRaw.method,
                params: editingRaw.params,
              }
            : null
        }
        availableAttributes={
          (editingRaw?.params?.attributes as string[] | undefined) ?? []
        }
        defaultAttributes={
          (editingRaw?.params?.attributes as string[] | undefined) ?? []
        }
        initialValues={
          editingRaw
            ? {
                description: editingRaw.description ?? '',
                tagSlugs: Array.isArray(editingRaw.iveTags)
                  ? editingRaw.iveTags.map((t: any) => t.slug).filter(Boolean)
                  : [],
                isPublic: editingRaw.isPublic !== false,
                isCached: !!editingRaw.isCached,
                countOnly: !!editingRaw.params?.countOnly,
                attributes: Array.isArray(editingRaw.params?.attributes)
                  ? editingRaw.params.attributes
                  : [],
              }
            : undefined
        }
        onSave={async ({ description, tagSlugs, isPublic, isCached, countOnly, attributes }) => {
          if (!editingRaw?.id) return;
          const baseParams = { ...(editingRaw.params || {}) };
          delete baseParams.countOnly;
          const params: Record<string, unknown> = {
            ...baseParams,
            attributes: countOnly ? [] : attributes,
          };
          if (countOnly) params.countOnly = true;
          try {
            await updateEndpoint(editingRaw.id, { description, isPublic, isCached, params });
            await setEndpointTags(editingRaw.id, tagSlugs);
            if (user?.id) {
              const fresh = await listVisibleEndpoints();
              dispatch(setEndpoints(fresh));
            }
            dispatch(showIveAlert({ message: 'Endpoint saved successfully', severity: 'success' }));
          } finally {
            setEditingIdx(null);
          }
        }}
      />
    </div>
  );
};

export default EndpointsView;

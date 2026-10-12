# Client

React/Vite frontend for the Hulab healthcare SPA. A single bundle hosts
multiple feature apps (CADA, IVE, M2D, CBW, CRC), each with its own routes,
Redux state, and components.

## Tech Stack

- **React 19** with **TypeScript**
- **Vite 7** — dev server and production build
- **React Router 7** — routing (global routes in `App.tsx`, per-app nested routes)
- **Redux Toolkit 2** — state (single store, per-app slices)
- **MUI 7** — component library and theming
- **Axios** — HTTP client (cookie-based auth, 401 redirect)
- **ECharts** — charts and waveform rendering

## Getting Started

### Prerequisites
- Node.js v22+
- A running backend on `http://localhost:8080` (see `../server`) — only if
  this checkout actually has a `server/` (some downstream deployments are
  client-only; see Auth below for what breaks/doesn't without one)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev      # Vite dev server on http://localhost:5173
```
The dev server proxies `/api` and `/docs` to the backend on port `8080`.

### Other commands
```bash
npm run build    # Production build to dist/
npm run preview  # Preview the production build
npm run lint     # ESLint
```

## Project Structure

```
client/
├── public/
├── src/
│   ├── apps/        # Feature apps
│   │   └── <app>/   #   each: routes.tsx, store slice, pages, components
│   ├── common/      # Shared UI components
│   ├── hooks/       # Typed Redux hooks (useAppDispatch/useAppSelector) + others
│   ├── layouts/     # Page layouts
│   ├── pages/       # Top-level pages (auth, profile, errors)
│   ├── store/       # Redux store (main + per-app reducers)
│   ├── utils/       # Axios instance, helpers
│   ├── App.tsx      # Root: Provider, theme, SessionLoader, top-level routes
│   └── main.tsx     # Entry point
├── vite.config.ts   # Vite config + /api & /docs proxy, "@" path alias
└── package.json
```

## Auth

`SessionLoader` in `App.tsx` calls `GET /api/auth/me` on mount and dispatches
the login state. `src/utils/axios.ts` sends credentials with every request and
redirects to `/signin` on a 401. Non-public routes are wrapped in
`<ProtectedRoute>`.

Without a backend running, that `GET /api/auth/me` call fails and is caught
silently — the app still renders, you're just never logged in. Any route
wrapped in `<ProtectedRoute>` will bounce to `/signin` with nothing to sign
in to. A route left unwrapped renders fine standalone with no backend at
all — this is how a client-only deployment (no `server/` checked out) is
expected to work.

## Notes

- `dist/` (build output) is not tracked in version control.
- TypeScript strict mode is intentionally relaxed in app code during the
  JS→TS migration.

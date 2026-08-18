# Page 3 — Workspace

**Route:** `/ive/workspace`
**Source:** `client/src/apps/ive/pages/Workspace.tsx`

## Purpose

A customisable dashboard for IVe. Users build a layout out of widgets (patient profile, condition timeline, lab measurements, charts, etc.), save the layout, and revisit it later.

## What the user sees

- **Widget grid.** Drag-and-drop tiles. Edit mode toggles the drag handles.
- **Top toolbar** — Edit / Done, Save layout, Load layout, Add widget, Browse archive.
- **Sidebar** (`LayoutsSidebar`) — the user's saved layouts.

## Widget types (rendered by the widget registry)

`patient_profile`, `clinical_note`, `conditions`, `timeline`, `stats`, `table_card`, `chart`, `radar`, `adherence`, `genericChart`, `domain_table`, `visit_header`, `omop_domain_table`.

## Modals

- `SaveLayoutModal` — name + description for a new layout.
- `WidgetSettingsModal` — per-widget config (e.g. table key, person filter, chart options).
- `WidgetCreatorModal` — pick a widget type to add.
- `BrowseArchiveModal` — restore an archived layout.

## Redux state (`ive` slice)

| Field | Use |
| --- | --- |
| `currentWidgets` | Widgets shown in the active layout |
| `savedLayouts` | All layouts owned by the user |
| `activeLayoutId` | Which saved layout is currently rendered |

## Backend calls

| When | Endpoint |
| --- | --- |
| Page load | `GET /api/layouts` |
| Save layout | `POST /api/layouts` |
| Update layout | `PUT /api/layouts/:id` |
| Delete layout | `DELETE /api/layouts/:id` |

Widget-specific data calls are made by each widget (see the [Person](person.md) / [Visit](visit.md) page docs for examples).

For how layouts and widgets fit together, see the [Layouts](../guides/layouts.md) and [Widgets](../guides/widgets.md) developer guides.

# Widgets

How to build, configure, and register dashboard widgets. All paths are
relative to `client/src/apps/ive/`.

## Architecture

Widgets are self-describing plugins registered in a single map — the
registry is the "widget store". Everything that hosts widgets (the
Workspace renderer, the settings modal, the Add Widget picker, page-level
layout hosts) reads the same registry, so **registering a widget makes it
renderable, configurable, and discoverable everywhere at once**.

```
widgets/
  registry.ts              ← WIDGET_REGISTRY: one entry per widget (single source of truth)
  Widget.tsx               ← RegistryWidget: generic renderer (defaults → saved config → overrides)
  WidgetGrid.tsx            ← read-only 12-col grid for pages that host a layout
  WidgetFrame.tsx           ← shared card chrome (title bar, edit/remove buttons)
  shared/
    types.ts               ← WidgetDefinition, WidgetComponentProps, WidgetSettingsProps, WidgetPreset
    settingsShared.tsx     ← settings primitives: SourceToggle, EndpointFields, DataShape, inputCls/labelCls
    cohortSettings.tsx     ← person-scoped primitives: CohortWidgetConfig, PersonIdField, requirePerson
    useWidgetData.ts       ← static/endpoint data hook for endpoint-configurable widgets
    requestTemplate.ts     ← RequestSpec, resolveRequest, useTemplatedFetch (executable config.request)
    RequestTemplateSection.tsx ← "Custom Request (advanced)" settings block
  catalog/
    <widget-name>/         ← ONE FOLDER PER WIDGET; the folder name is the only identifier
      definition.ts        ← the store listing (metadata + wiring)
      widget.tsx            ← the component — SELF-CONTAINED: the full view code
      settings.tsx          ← the settings panel (optional)
```

File names inside a catalog folder are always exactly `definition.ts`,
`widget.tsx`, `settings.tsx` — never `<Name>Widget.tsx` etc.

**Self-contained rule:** a widget's entire view (fetching, state, markup)
lives in its `widget.tsx` — no wrapper-around-a-component-in-
`components/widgets/`. Big views may keep an internal sub-component in the
same file (see `cohort-timeline`, `waveform`). Catalog folders import only
from `widgets/` itself, `api/`, `types`, app-level `components/` (e.g.
`ConceptHoverIcon`), and `hooks/` — never from `components/widgets/`
(that folder is legacy-only; `WidgetFrame` there is just a shim).

## Adding a widget

1. Add the type name to the `WidgetType` union in `types.ts` (and any new
   config fields to `WidgetConfig['config']`).
2. Create `widgets/catalog/<name>/` with the three files below.
3. Register it: one import + one line in `widgets/registry.ts`.

That's all. Do **not** touch the Workspace switch, `settingsRegistry`, or
`WidgetCreatorModal` — those are legacy-only (see "Legacy bridge" below).

### `widget.tsx`

```tsx
import React from 'react';
import WidgetFrame from '../../WidgetFrame';
import type { WidgetComponentProps } from '../../shared/types';

export interface MyConfig {
  limit?: number;              // widget-owned config type lives here
}

const MyWidget: React.FC<WidgetComponentProps<MyConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => (
  <WidgetFrame title={title} isEditMode={isEditMode} onRemove={onRemove} onEdit={onEdit}>
    {/* content; config is defaults+saved+overrides, so read fields directly */}
  </WidgetFrame>
);

export default MyWidget;
```

The props contract (`WidgetComponentProps<C>`) is fixed: `title`, `config`,
`isEditMode`, `onRemove?`, `onEdit?`. `config` arrives pre-merged by
`RegistryWidget`: `{ ...def.defaults, ...widget.config, ...overrides }`
(overrides come from a hosting page's context, e.g. the selected subject —
they always win).

If the wrapped component only reads props as *initial state* (e.g.
`WaveformPanel`), remount it with a `key` derived from the config so
settings changes take effect.

### `settings.tsx`

```tsx
import React from 'react';
import { inputCls, labelCls } from '../../shared/settingsShared';
import type { WidgetSettingsProps } from '../../shared/types';
import type { MyConfig } from './widget';

const MySettings: React.FC<WidgetSettingsProps<MyConfig>> = ({ config, onChange }) => { ... };
export default MySettings;
```

**Rule: a settings panel exposes only fields the widget actually reads.**
No decorative fields. Three established patterns:

- **Endpoint-configurable widgets** (user points the widget at a URL):
  config extends `EndpointConfig`; render `SourceToggle` + `EndpointFields`
  + `DataShape`; fetch via `useWidgetData(config, STATIC_FALLBACK)`.
  Reference: `catalog/demographics/`.
- **Domain-parameter widgets** (widget queries its own APIs internally):
  config carries only domain params (personId, dates, table, limit…).
  Person-scoped widgets reuse `PersonIdField` / `requirePerson` from
  `shared/cohortSettings.tsx`. Reference: `catalog/person-top-concepts/`;
  for a chart-drawing one see `catalog/measurement-trend/` (filters
  `/api/omop/measurement/search` by `measurement_concept_id` IN-list or
  `measurement_source_value` LIKE, renders an inline SVG line with hover).

- **Request-template widgets** (config carries the executable request):
  config holds `request: { endpoint, method, body }` where body/endpoint
  may contain `{{param}}` placeholders filled from the widget's live
  fields at fetch time (`shared/requestTemplate.ts` → `resolveRequest`).
  Because the widget executes exactly the saved spec, the stored endpoint
  cannot drift — safe for AI-generated configs. Live fields (personId,
  concept lists) stay top-level so settings, page overrides, and agents
  edit them without touching the template. Supported by the single-query
  widgets: `measurement-trend`, `person-top-concepts`,
  `person-measurements` (multi-query widgets like `person_stats` /
  `cohort_timeline` don't accept one — their fan-out can't be one spec).
  Pieces: `shared/requestTemplate.ts` (`useTemplatedFetch` → the widget's
  effect does `const load = templatedFetch ?? builtInQuery`) and
  `shared/RequestTemplateSection.tsx` (the settings block; list the
  widget's injectable placeholders).

Chart widgets: single hue per single-series chart, 2px line, recessive
grid, direct-label the latest value, hover marker + readout. Validate any
hardcoded color against both surfaces (light `#ffffff`, dark `#0f172a`)
with the dataviz palette validator.

### `definition.ts`

```ts
import type { WidgetDefinition } from '../../shared/types';
import MyWidget, { MyConfig } from './widget';
import MySettings from './settings';

const myWidget: WidgetDefinition<MyConfig> = {
  type: 'my_widget',            // must match the WidgetType union
  label: 'My Widget',           // shown in the Add Widget picker
  description: '…',             // picker card subtitle
  icon: 'monitoring',           // Material Symbols name
  category: 'person',           // 'cohort' | 'person' | 'visit' | 'chart' | 'generic'
  defaultLayout: { w: 6, h: 'auto' },   // w: 1–12 grid cols; h: auto|sm|md|lg
  Component: MyWidget,
  Settings: MySettings,         // optional
  defaults: { limit: 10 },      // merged under saved config at render time
  validate: (c) => c.limit > 0 ? [] : ['Limit must be positive.'],  // optional
  presets: [                    // pre-configured picker entries; if the widget
    {                           // takes a request template, presets carry it
      title: 'Top 5',           // explicitly so examples are executable
      config: { request: MY_REQUEST, limit: 5 },
    },
  ],
};
export default myWidget;
```

`describeRegistry()` in `registry.ts` returns the whole catalog (type,
label, description, category, defaultLayout, defaults, presets) as
serializable JSON — feed it into an LLM prompt, have the model emit a
`WidgetConfig[]`, then check each entry with
`getWidget(type).validate(config)` before rendering via `WidgetGrid`.
There is no separate prose metadata about data access: the AI learns it
from the executable `request` templates carried by presets and the
built-in layouts (`SUBJECT_SEPSIS_WIDGETS` in `store/index.ts` is the
richest example set). Keep `description` sharp for the multi-query widgets
(`person_stats`, `cohort_timeline`) since it's all the assembler sees for
them.

`category` is load-bearing, not cosmetic: pages use it structurally. A
layout qualifies for the cohort **subject view** only if *every* widget in
it has `category: 'person'` (i.e. accepts the `personId` override). See the
[Layouts](layouts.md) guide.

`presets` become entries in the Add Widget library tab; a definition
without presets contributes itself (label + description) once.

## Legacy bridge (temporary)

Unmigrated widgets still live in `components/widgets/` and render through
switch statements in `pages/Workspace.tsx` and `components/widgets/index.tsx`;
their settings come from `components/widgets/settingsRegistry.tsx`; their
picker entries are hardcoded in `components/WidgetCreatorModal.tsx`.
All hosts check the registry **first** and fall back to the legacy path.

When migrating a legacy widget, also delete its: switch case(s),
`settingsRegistry` entry, hardcoded `WIDGET_LIBRARY` entry, and old files.
When the last one is migrated, delete the switches/settingsRegistry
entirely and derive the union:
`export type WidgetType = keyof typeof WIDGET_REGISTRY;`

## Checklist

- [ ] `WidgetType` union updated in `types.ts` (+ new config fields on `WidgetConfig['config']`)
- [ ] `catalog/<name>/definition.ts` + `widget.tsx` (+ `settings.tsx`)
- [ ] Registered in `registry.ts`
- [ ] Settings show only fields the widget reads; `validate` covers required ones
- [ ] Sensible `defaults` so the widget renders out of the box
- [ ] `category: 'person'` only if the widget honors a `personId` override
- [ ] If the widget takes a `request` template: presets (and any built-in layout entries) carry it explicitly, so saved configs are executable examples
- [ ] `cd client && npx tsc -p tsconfig.json --noEmit` clean — check the **full** output for your files (including `components/widgets/` if you touched inner views); `npm run build` passes
- [ ] Verify in the app: add via picker, edit settings, check subject view if person-scoped

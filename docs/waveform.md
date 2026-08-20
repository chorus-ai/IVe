---
description: >-
  Multi-channel, bedside-monitor-style viewer for WFDB physiological signal
  records (ECG, plethysmogram, respiration, etc.) — pans, zooms, and scrubs a
  synced stack of traces, streaming more of the recording in as the user
  scrubs forward.
---

# Waveform Viewer

## Status

**Implemented.** Reachable two ways, both backed by the same component:

* **Standalone page** — the **Waveform** card on the [Clinical Tables](clinical-tables.md) directory's Media section → `/ive/table/waveform`.
* **Dashboard widget** — `waveform` in the widget registry (`category: person`), droppable into any [layout](layouts.md), including the built-in "Subject Event Timeline" used on the [Cohort](cohort.md) → Subject view.

![Multi-channel waveform viewer showing ECG leads II/V/aVR, Pleth, and Resp for a subject](../.gitbook/assets/subject_event_timeline_waveform.png)

## What the user sees

A stack of synchronized signal traces from a WFDB-style record:

* **Header strip**, in order: sampling rate (`fs: 62.47 Hz`), source file duration (`file: 4h 25m 40.5s`), the record's absolute start time when it has one (`start: 2180-07-23 18:46:43.000`), the currently buffered range (`buffered: 0.0s → 60.0s (60s / 300s)`), and the current scrubbed view window — shown as absolute clock time if the record has a base date/time (`view: 2180-07-23 18:46:43.500 → 2180-07-23 18:47:01.100`), otherwise as plain seconds from file start (`view: 2.9s → 20.6s`).
* **One row per channel**, each its own chart with its own y-axis/units and a mini scrub bar for repositioning the view window. Observed channel sets include ECG leads **II**/**V**/**aVR** (mV), **Pleth** (NU), and **Resp** (Ω) — the exact set depends on the record. Trace colors follow bedside-monitor convention (ECG green, pleth/SpO2 cyan, arterial pressure red, respiration amber), cycling through those four by channel order.
* **Optional controls bar** — record path, start offset, and a Load button. Can be hidden per widget instance (see Config below) once a dashboard's placement is finalized, so the panel just displays data.
* Missing samples render as literal breaks in the line (never smoothed or interpolated across).

## Where it lives

```
client/src/apps/ive/
  pages/Waveform.tsx                  ← standalone page (WaveformView), routed at /ive/table/waveform
  widgets/catalog/waveform/
    widget.tsx                        ← WaveformPanel (the real implementation) + WaveformWidget wrapper
    definition.ts                     ← registry entry: type 'waveform', category 'person'
    settings.tsx                      ← Record Path / Start Offset / show-controls toggle
```

`WaveformPanel` is exported from `widget.tsx` and reused directly by `pages/Waveform.tsx`. The widget wrapper (`WaveformWidget`) just adds `WidgetFrame` chrome and remounts the panel (`key={filename}:{offset}`) whenever its config changes, since the panel only reads `defaultFilename`/`defaultOffset` once at mount. See [Widgets](widgets.md) for the registry pattern in general — this is one of the "big view, self-contained `widget.tsx`" cases that guide calls out explicitly.

## Data flow

**Endpoint:** `GET /api/cada/file/wfdb?filename=<path>&offset=<sec>&range=<sec>`. A Node handler shells out to a Python script (`wfdb` library) that reads only the requested slice of the record — never the whole file, which matters for multi-hour recordings. Response shape:

```json
{
  "StartTime": "2180-07-23T18:46:43.000",
  "OffsetInSec": 0,
  "TicksPerSec": 62.4725,
  "TotalSamples": 124000,
  "DurationSec": 1985.0,
  "WaveformData": [
    { "Channel": "II", "UOM": "mV", "ID": 0, "Samples": [0.1, null, -0.05, "..."] }
  ]
}
```

`Samples` entries are `null` for missing data; the client keeps those as gaps rather than interpolating (`connectNulls: false`).

**Client-side buffering** (`WaveformPanel`):

* Loads a 30s chunk at the configured offset on mount, and opens the view onto the first 10s of it.
* As the user zooms/pans toward the buffered edge (within 5s of it), the panel fetches the next 30s chunk and appends it per channel.
* Once the buffered span exceeds 300s, the oldest samples are trimmed from the left so memory stays bounded no matter how far a session scrubs.
* Only the **first channel's** chart is wired to the zoom listener that drives this buffering state; the other channels stay visually in sync purely through ECharts' cross-chart `group`/`connect` mechanism. Zooming a channel other than the first pans it visually but won't itself trigger a prefetch or update the header's view-range readout — the first channel (or any, since they're group-linked) is the reliable one to drag.

**Rendering:** one isolated ECharts `LineChart` per channel, all joined into one `echarts.connect()` group so pan/zoom stays synced across the stack; `sampling: 'lttb'` (Largest-Triangle-Three-Buckets) downsamples what's actually drawn so a wide zoomed-out view stays smooth without the client pre-thinning the data itself.

## Config

`WaveformConfig`, editable from the widget's settings panel:

| Field | Meaning |
|---|---|
| `filename` | WFDB record path. Falls back to a built-in sample record if left empty. |
| `offset` | Start offset, in seconds. |
| `showControls` | Show the record-path / offset / Load controls bar (default `true`). |

No presets are currently defined for this widget in the registry.

## Known limitation

`waveform` is registered as a `category: 'person'` widget, but unlike the other person-scoped widgets — which share the `CohortWidgetConfig`/`personOf()` pattern (see [Widgets](widgets.md)) — its config has no `personId` field. When a layout renders on the [Cohort](cohort.md) → Subject view, the page passes `{ personId, startDate, endDate }` down as config overrides to every widget on it, but the waveform widget doesn't read `personId`: it always shows whichever `filename` is baked into its own config rather than resolving a per-subject WFDB record automatically. Also noted where layouts are built — see [Layouts](layouts.md).

## Performance notes

The in-memory sample buffer is a plain boxed `(number | null)[]` per channel, which is fine at the ~62 Hz rates seen in tested data. If a higher-rate signal shows up (roughly `fs × channel count` above 250), the panel feels sluggish, or a waveform tab's memory climbs noticeably, there's a scoped `Float32Array` conversion already planned for this component — browser-side only, no API or server changes. That plan also sketches multi-rate channel support (per-channel `samples_per_frame`) for if/when a record starts mixing sampling rates within itself; not needed for anything seen so far. Both are deferred-until-triggered, not scheduled work.

## Related

* [Widgets](widgets.md) — registry pattern; `CohortWidgetConfig`/`personOf()` for person-scoping.
* [Layouts](layouts.md) — how a layout hosts this widget and passes subject overrides.
* [Clinical Tables](clinical-tables.md) — the Media section entry point.
* [Cohort](cohort.md) — Subject-view embedding via the built-in "Subject Event Timeline" layout.

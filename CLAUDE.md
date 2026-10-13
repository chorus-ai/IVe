# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This repository is **only a static marketing/landing page plus its GitBook documentation** for
IVe (Integrated Viewer), a clinical research webapp built for the CHoRUS project on the OMOP
Common Data Model. The repo contains no application code, no backend, no build tooling, and no
tests — just:

- `index.html` — a single self-contained landing page (Tailwind CDN + vanilla JS, no build step)
- `screens/` — full-size screenshots embedded by the landing page
- `README.md`, `LICENSE`
- `SUMMARY.md`, `docs/` — multi-page GitBook documentation (see below)
- `.gitbook/assets/` — GitBook's own copies of the same screenshots, referenced by files in `docs/`
  and `README.md` (kept separate from `screens/`, which is only for `index.html`)

**The actual IVe application (React/Vite client + Express server) does not live here.** Active
development happens in the internal monorepo:
https://github.com/chorus-ai/chorus-apps-internal/tree/develop (app code under `client/src/apps/ive/`).
Do not expect to find client/server source, package.json, or a dev/build/test setup in this repo —
there isn't one, by design. If asked to work on actual IVe application features, clarify that this
repo only hosts the public landing page and its docs, and point to the monorepo instructions in
`README.md`.

## Working with `index.html`

- Single file, no build process — open directly in a browser or serve statically to preview changes.
- Styling uses the Tailwind CSS CDN build (`<script src="https://cdn.tailwindcss.com">`) with an
  inline `tailwind.config` (custom `primary`/`accent` colors, `Inter` font). There is no PostCSS/Tailwind
  build pipeline; utility classes are resolved at runtime in-browser.
- Dark mode is class-based (`html.dark`) and defaults to the OS preference, persisted to
  `localStorage["ive-theme"]`; the toggle button and its wiring live inline near the header
  (`#theme-toggle` script, ~line 238). Because dark-mode utility classes are used as the base styling,
  light mode is implemented via manual `html:not(.dark) ...` CSS overrides in the `<style>` block —
  when adding new dark-styled elements, add a matching light-mode override rather than relying on
  Tailwind's `dark:` variant alone.
- Sections are anchor-linked from the nav (`#features`, `#screens`, `#workflow`, `#faq`) — keep `id`s
  in sync with nav links if restructuring sections.
- External links of note: "Sign in" and API Reference point at the live Azure-hosted instance
  (`mgh-chorus.eastus2.cloudapp.azure.com`); Documentation points at a GitBook
  (`chorus4ai.gitbook.io/apps`).

## Docs (`SUMMARY.md`, `docs/`) and the GitBook sync

Together with `README.md` these form a GitBook-structured documentation site at the repo root:
`README.md` is the space's front page, `SUMMARY.md` is its table of contents, and `docs/` holds
one Markdown file per page — flat, no subfolders (a page doc that covers both a list and a detail
view, e.g. `docs/cohort.md` or `docs/clinical-tables.md`, follows the same one-file pattern: no
"## Purpose" heading, the summary instead lives in YAML frontmatter, and the secondary view is a
`## <Thing> Detail`/`## Detail view` section on the same page rather than a separate file).

**This repo is connected to a live GitBook space.** Edits made in the GitBook UI get merged back
into `main` as `GITBOOK-N: change request ... merged in GitBook` commits — check `git log` before
assuming the docs' current formatting was written here. GitBook reformats files as it touches them
(adds a YAML `description:` frontmatter block, rewrites image paths to `.gitbook/assets/...`,
escapes some Markdown punctuation like `\~`), so **formatting is inconsistent across `docs/*.md`
by design** — some files have the frontmatter/escaping treatment, others don't yet. Don't
"normalize" this wholesale; match the GitBook-produced style (see `docs/cohort.md` or
`docs/clinical-tables.md`) when editing a file GitBook has already touched, and don't invent a
different convention for untouched files.

It documents the *actual application* — install/dev/build commands live in `README.md`; a
reference page per IVe screen and developer guides for the widget/layout systems both live flat in
`docs/` — as it exists in the internal monorepo, not in this repo. It's reference material for
contributors going there, not something runnable from this checkout. Page docs intentionally omit
route/source-file metadata (no `**Route:**`/`**Source:**` lines) to stay readable for a
non-developer audience; keep that out when adding new pages. When adding a new page doc, also list
it in `SUMMARY.md` and in the table in `README.md`.

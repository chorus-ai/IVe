# Page 5 — Agent

**Route:** `/ive/agent`
**Source:** `client/src/apps/ive/pages/Agent.tsx`

## Purpose

A chat-style assistant for exploring OMOP CDM data with natural language. The user asks questions like "show me diabetic patients under 50 with HbA1c > 7"; the agent responds with an answer, the API trace it would run, and inline widgets (demographics, condition counts, mini-charts).

## What the user sees

- **Conversation pane.** Messages alternate user / agent. Each agent message can include:
  - A free-text answer.
  - One or more **API traces** — expandable POST endpoints (e.g. `/api/omop/person/search`, `/api/omop/condition_occurrence`) with the body the agent would have sent.
  - Inline **widgets** rendered by the same widget registry the Workspace uses (`patient_profile`, `timeline`, `stats`, `genericChart`, etc.). See the [Widgets](../guides/widgets.md) guide.
- **Input box** at the bottom with a Send button.
- **Quick actions** on each response: Save as Cohort, Refine Query, Visualize, Export.

## Current state

Responses are currently simulated client-side (no LLM call yet); the API traces shown are the queries the live integration will issue. Wiring this to a real `/api/ive/agent` endpoint that returns `{ answer, traces, widgets }` is the next step.

## Future backend

- `POST /api/ive/agent` — body: `{ message, conversationId? }`; returns `{ answer, traces, widgets }`.
- Conversations persisted server-side so a refresh restores chat history.

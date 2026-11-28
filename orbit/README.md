# ORBIT — Autonomous Research Intelligence

ORBIT is a GenAI research workspace. A user submits a research objective and chooses Quick, Standard, or Deep dive. The backend runs four sequential specialist stages:

1. **Planner** — decomposes the objective into research questions and evidence criteria.
2. **Researcher** — uses live web search and gathers URL citation annotations.
3. **Analyst** — compares evidence quality, corroboration, contradictions, and uncertainty.
4. **Report Writer** — synthesizes a structured report from the gathered evidence.

The app includes email/password authentication, user-scoped research history, a per-account run limit, cited source links, and Markdown report export.

## Architecture snapshot

This folder contains source snapshots exported from the live Floot-hosted ORBIT project. The production implementation currently uses Floot's React/TypeScript runtime, managed PostgreSQL, and server endpoints. It is **not yet** the originally discussed Next.js + FastAPI + LangGraph stack. The files are provided as a project record and reference; they are not a standalone clone of the Floot runtime.

### Agent flow

```text
Research objective
       |
       v
    Planner
       |
       v
  Researcher ---- live web search + URL citations
       |
       v
    Analyst
       |
       v
  Report Writer
       |
       v
 Report + sources -> user-scoped PostgreSQL history
```

## Key capabilities

- Hosted OpenAI API calls; no local model required.
- Server-side API key access via `OPENAI_API_KEY`; never expose it in frontend code.
- Live web search during the Researcher stage.
- Citation extraction from Responses API annotations; reports are rejected if no URL citations are returned.
- Authenticated research endpoint and per-user history.
- Quick, Standard, and Deep dive modes.
- Markdown report download.

## Current source layout

- `src/pages/home.tsx` — main research workspace UI snapshot.
- `src/pages/login.tsx` — login/register page snapshot.
- `src/endpoints/research.ts` — four-stage research pipeline snapshot.
- `src/endpoints/research-schema.ts` — request validation and client API helper.
- `src/endpoints/research-history.ts` — authenticated history endpoint.
- `src/helpers/global-context-providers.tsx` — global React providers.
- `docs/architecture.md` — implementation notes and current limitations.

The Floot project also relies on its seeded UI component library, auth endpoints, CSS modules, managed database schema, and hosting runtime. Those platform-provided files are not copied wholesale here.

## Configuration

In the hosted Floot deployment, configure `OPENAI_API_KEY` as a server-side secret using Floot's secure resource connection. Never commit a real key.

For a future standalone deployment, the environment will also need a PostgreSQL connection string and an application session/JWT secret. The current exported source uses Floot-managed auth/database helpers, so those integrations must be replaced before running outside Floot.

## Honest limitations / roadmap

- The agent stages currently run sequentially as separate model calls; LangGraph orchestration is not integrated yet.
- The current host implementation is Floot-native React/TypeScript, not Next.js/FastAPI.
- Stage-level live telemetry is not available yet; the UI labels the workflow as descriptive rather than pretending to stream stage progress.
- Add automated tests, retry/backoff, usage/cost telemetry, robust URL/domain validation, and explicit citation-to-claim mapping.
- Consider migrating the orchestration layer to LangGraph and the API to FastAPI as a separate portability milestone.

## Inspiration and attribution

ORBIT uses a conventional planner → researcher → analyst → writer pattern found across public agentic research systems. The implementation in this repository is an original project snapshot, not a copy of another repository.

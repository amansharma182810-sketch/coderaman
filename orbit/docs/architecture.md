# ORBIT architecture notes

## Request lifecycle

1. Browser validates the goal and selected depth.
2. Server verifies the signed-in user session.
3. Server checks the user's recent completed run count.
4. Planner produces 4–6 investigation questions and evidence criteria.
5. Researcher calls the Responses API with the web-search tool required.
6. Analyst assesses the evidence without introducing new sources.
7. Writer produces tagged report sections.
8. Server extracts URL citation annotations from the Researcher response.
9. Server refuses to save a report if no URL citations were returned.
10. Server persists the report under the authenticated user's ID.

## Trust boundaries

- The OpenAI key is read only on the server from `process.env.OPENAI_API_KEY`.
- Session validation is server-side.
- Research history is filtered by the authenticated user ID.
- Source URLs come from web-search citation annotations, not from model-authored plain text.

## Known gaps

- No durable job queue or resumable workflow yet.
- No independent fact-checking or claim-level citation alignment yet.
- No token/cost accounting or provider fallback.
- Rate limit is a simple completed-run count, not a distributed atomic limiter.
- Floot-managed database, authentication, and UI components need replacement for standalone hosting.

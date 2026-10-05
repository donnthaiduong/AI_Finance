# Scoped Treasury Copilot

The default is guided mode. The optional AI interprets a typed question into one of four validated intents: explain coverage, calculate minimum preparation, draft explicit interruption assumptions, or reject an unsupported request. Deterministic tools produce the displayed financial numbers. AI output is never displayed as free-form advice and cannot apply or confirm a proposal.

## Local setup

Set `CASCADEGUARD_GEMINI_API_KEY` on the server, for example in the ignored `.env.local`, then restart Next.js. Never use a `NEXT_PUBLIC_` key. No key is configured or included in this repository. Use a Google project with appropriate billing/data-use settings before typing real business information. Do not enter account numbers or secrets in the question.

The fixed model is `gemini-3.5-flash-lite`, using REST `generateContent` and `generationConfig.responseFormat.text` with a JSON schema. Reference checked 2026-10-05: [Google structured output documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en). A real provider request has not been verified in this checkout. Mocked transport exercises the request contract and failure handling; it does not demonstrate provider accuracy or availability.

## Data and failure behavior

- Optional AI is unchecked initially. The user sees the provider disclosure before opting in.
- The local API receives the current portfolio to calculate tools. Only the question text and fixed system instructions are sent to Google. Bank names, balances, schedules, evidence and history are not separately sent. Anything typed into the question will be sent.
- Requests are limited to 128,000 bytes and a 500-character question, accommodating the permitted banks/payments and Unicode labels. Provider responses are limited to 32 KB. AI has an 8-second timeout; the browser has a 10-second timeout.
- Missing configuration stays in guided mode. Provider errors, malformed/oversized output, unsupported tool calls and timeouts return deterministic guided fallback. The browser also provides local explanation when its API request fails.
- Draft percentages and days must match single explicit numeric values in the question. Written-out numbers or ambiguous alternatives require manual entry. Drafts require a user click before editing the scenario.
- Minimum preparation is recomputed locally and shown for review. An existing confirmation checkbox is reset. Only the separate confirmation action changes the simulated allocation.
- Changes to inputs, destination, question or AI opt-in invalidate an outstanding response. Model output cannot set an evidence-derived unavailable percentage.
- No provider error details, secrets or portfolio data are logged by this route.

## Cost cap and deployment limit

This local MVP allows at most 20 configured AI requests per minute per server process. It deliberately uses one process-wide bucket rather than trusting caller-supplied forwarding headers. Guided mode remains available. Before multi-instance public deployment, replace the limiter with a shared quota store and appropriate authentication/abuse protection; the current cap is not a cross-instance quota.

## Remaining acceptance work

Real provider structured-response compatibility and intent accuracy, keyboard/mobile interaction, stale-response UI cases, and five SME user sessions remain unverified. No live integration, deployment or user benefit is claimed by this document.

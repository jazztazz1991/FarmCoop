## 🔒 RULE: GLOBAL STYLE ENTRY POINT REQUIRED (NON-NEGOTIABLE)

This project MUST have exactly one global style entry point.

- Pages Router → src/pages/_app.tsx
- App Router → src/app/layout.tsx

That file MUST:
- Import src/styles/globals.css
- Be preserved during refactors

Enforced by `scripts/assert-globals-import.ts` (runs in `npm run lint`).

DO NOT:
- Remove this file
- Inline global styles elsewhere
- Assume styles load implicitly

If routing strategy changes:
- Update the global style entry point immediately

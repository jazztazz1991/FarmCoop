## Architectural Rules
- Domain logic lives only in src/domain
- Components are presentational only
- View models own decisions and derived state
- No inline styles
- No new patterns without explicit approval

If uncertain at any point, STOP and ASK.


## 🔒 ARCHITECTURE RULE: APP ROUTER LOCATION (NON-NEGOTIABLE)

This project uses the **Next.js App Router located at:**

  src/app/

Rules:
- All routing files (page.tsx, layout.tsx, route.ts) MUST live under src/app/
- A root-level app/ directory is NOT allowed
- src/app/ is routing-only (no business logic)

If you see or create a root-level app/ directory:
- STOP
- Remove it
- Move routing files to src/app/

## 🔒 RULE: RTL REQUIRED WHEN EXTRACTING JSX (MANDATORY)

When JSX is extracted into a new component (or a component is split):

YOU MUST:
- Add a React Testing Library (RTL) test for the extracted component
- OR update an existing RTL test to cover the new component

This rule applies when:
- JSX is moved into a new file
- A large TSX file is split into smaller components
- Conditional rendering logic moves with the JSX
- A component becomes independently reusable

The RTL test MUST:
- Assert observable behavior (text, roles, visibility, enabled/disabled state)
- Avoid implementation details
- Avoid snapshot-only tests unless explicitly approved

DO NOT:
- Skip RTL tests because unit tests exist
- Test internal state or hooks directly
- Write placeholder or trivial tests to satisfy the rule

If you are unsure whether JSX extraction occurred:
- Assume YES
- Add the RTL test

If adding an RTL test is not possible:
- STOP
- Explain why
- Ask for approval before proceeding
---

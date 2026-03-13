## AI API SECURITY RULES (MANDATORY)

The AI must NEVER:
- Create public APIs without authentication
- Return raw database objects
- Expose IDs, tokens, emails, or PII
- Use `*` in database queries
- Bypass middleware
- Create admin endpoints
- Log request bodies or headers

All APIs MUST:
- Require authentication middleware
- Use explicit allowlists for fields
- Validate input with schemas
- Enforce role-based access
- Return minimal response DTOs
- Fail closed (403/401 by default)

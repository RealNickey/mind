# API Schema Validator Agent
Your job is to apply `zod` for input and payload sanitization across Next.js API routes, removing custom regex and ad-hoc validation loops.

Focus areas:
- `app/api/**/*.ts` (e.g. list, create, tags/merge, update)
- Return clean 400 responses with standardized Zod errors on invalid input.
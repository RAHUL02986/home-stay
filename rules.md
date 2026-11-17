# Coding Rules & Conventions

## Homestay Platform — Dharamshala

**Version:** 1.0 (MVP)
**Date:** 2026-04-11

---

## 1. Language

- **TypeScript** is the default for all new code (components, models, API routes, utils).
- JavaScript is acceptable only for config files that require it (e.g. `next.config.mjs`).
- All Mongoose models must be typed with interfaces extending `Document`.

---

## 2. Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `PropertyForm.tsx` |
| Component files | PascalCase | `PropertyCard.tsx` |
| Utility/hook files | camelCase | `dbConnect.ts`, `useProperties.ts` |
| API route files | lowercase `route.ts` | `app/api/properties/route.ts` |
| Mongoose models | PascalCase singular | `User`, `Property`, `Room` |
| Model files | PascalCase | `Property.ts` |
| Variables / functions | camelCase | `fetchProperties`, `pricePerNight` |
| Constants | UPPER_SNAKE_CASE | `AREAS`, `AMENITY_OPTIONS` |
| CSS classes | Tailwind utilities only | `bg-emerald-600 text-white` |

---

## 3. Folder & File Organization

- Keep components small and single-purpose.
- Co-locate component-specific types inside the component file unless shared.
- Shared types go in `types/index.ts`.
- Reusable UI primitives live in `components/ui/`.
- Feature components live in feature folders: `components/host/`, `components/listing/`.
- Never put business logic inside page components; delegate to components or lib.

---

## 4. Mongoose Conventions

- Always use `{ timestamps: true }` on schemas.
- Use `mongoose.models.X || mongoose.model(...)` to avoid recompilation in dev/HMR.
- Index frequently queried fields: `area`, `host`, `property`.
- Add text indexes for searchable string fields.
- Validate required fields at schema level (`required: true`).
- Use `ref` for relationships; populate only needed fields.
- Never store raw passwords; store `passwordHash` only (auth-ready).
- Use `lean()` for read-only queries to improve performance.

---

## 5. API Route Conventions

- File: `app/api/<resource>/route.ts`.
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.
- Wrap all logic in `try/catch`.
- Standard response shape:
  ```ts
  { success: boolean; data?: any; error?: string; message?: string }
  ```
- Use appropriate HTTP status codes: 200 (ok), 201 (created), 400 (bad request), 401 (unauth), 404 (not found), 500 (server error).
- Validate required fields and return 400 before touching the DB.
- Connect to DB at the start of each handler via `await dbConnect()`.
- Never leak raw stack traces to the client.

---

## 6. Validation Rules

- Validate at the API boundary; do not trust client input.
- Required property fields: `name`, `area`, `address`.
- Required room fields: `type`, `pricePerNight`, `maxGuests`.
- Numeric fields must be `>= 0` (price) or `>= 1` (guests).
- Enums: account role in `['guest','host','admin']` (public registration may create only guest/host); room availability in `['available','unavailable']`.
- Sanitize string inputs with `trim()` (Mongoose) and basic escaping.

---

## 7. Tailwind CSS Conventions

- Utility-first; avoid custom CSS except in `globals.css`.
- Mobile-first responsive design: base styles for mobile, then `sm:`, `md:`, `lg:`, `xl:`.
- Use a consistent color palette (see `design.md`): emerald for primary actions, slate for text, red for errors.
- Avoid arbitrary values (`w-[347px]`) unless absolutely necessary.
- Extract repeated class strings into components, not `@apply` (prefer component composition).
- Ensure focus states (`focus:ring-*`) on all interactive elements.

---

## 8. Error Handling Rules

- Never swallow errors silently; log server-side, return user-friendly message.
- Use `error?.message` with a fallback string.
- Client components must handle loading and error states visibly.
- Avoid `any` where a proper type exists; if unavoidable, annotate with a comment.

---

## 9. Git & Commit Conventions

- Branch naming: `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- One logical change per commit.
- Do not commit `.env.local` or `node_modules`.

---

## 10. Security Baseline (MVP)

- No secrets in client code; use `NEXT_PUBLIC_` prefix only for safe values.
- All DB access through Mongoose (parameterized queries) — no string concatenation.
- Enforce session roles in every protected page and mutation; never trust a role or owner ID from request JSON.
- Public property search and details may return approved listings only.
- An admin account is provisioned only through the private one-time bootstrap; never add public admin registration or expose bootstrap secrets to the client.
- Recalculate booking prices from database room values; never trust client prices or payment status.
- Reserve room inventory atomically per room/date when confirming requests; release allocations on eligible cancellation.
- Do not claim a booking is paid until a verified payment integration is implemented.
- CORS not needed (same origin); API routes are same-origin by default.

---

## 11. Code Review Checklist

- [ ] TypeScript compiles with no errors (`tsc --noEmit`).
- [ ] No `console.log` left in production code (use only for dev debugging).
- [ ] All new API routes have error handling.
- [ ] Components are responsive (mobile + desktop).
- [ ] Mongoose models registered safely (`mongoose.models.X || ...`).
- [ ] No hardcoded secrets or real host IDs in committed code.

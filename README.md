# SAKTHI AMS Frontend

Enterprise Apartment Management System frontend aligned with the existing `AMS_sys` Fastify backend.

## Stack

- React 19, TypeScript, Vite
- React Router, TanStack Query, Axios
- React Hook Form, Zod
- Tailwind CSS with shadcn-style primitives
- Recharts, Sonner
- pnpm workspaces, Turborepo, TypeScript project references

## Backend Contract Alignment

The API client targets the backend `/v1` contract discovered from `AMS_sys`:

- Auth: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- Users and audit: `/users`, `/audit-logs`
- Dashboard: `/dashboard/metrics`
- Hierarchy: `/blocks`, `/units`, `/residents`
- Operations: `/visitors`, `/complaints`, `/invoices`, `/maintenance-heads`, `/amenities`, `/staff`, `/assets`, `/notices`, `/meetings`, `/compliance`

`AMS_sys` remains unmodified.

## Run

```bash
pnpm install
pnpm run dev
```

The web app runs at `http://localhost:5174`.

## Validate

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```

All three commands pass in the current workspace.

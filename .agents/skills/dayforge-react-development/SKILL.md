---
name: dayforge-react-development
description: >-
  Guides React 19, strict TypeScript, shadcn/ui, React Router, React Hook Form,
  Zod, Lucide React, and Recharts implementation in DayForge. Use when building
  components, forms, routes, hooks, or analytics visualizations.
---

# DayForge React Development

## Purpose
Produce clean, accessible, strictly typed React 19 components that compose shadcn/ui primitives and keep state and validation predictable.

## When to Use
- Implementing pages, feature components, forms, dialogs, or charts.
- Writing custom React hooks, route definitions, or Zod form schemas.

## Project Conventions
Follow Sections 2, 3, and 4 of [SKILLS.md](../../../SKILLS.md):
- **Stack:** React 19, TypeScript (strict), Tailwind CSS, shadcn/ui (`src/components/ui/`), Lucide React, Framer Motion, Recharts, React Router, React Hook Form, Zod.
- **Forms:** Validate inputs with Zod schemas centralized in `src/lib/` or feature schemas, wired via React Hook Form.
- **Charts:** Render Recharts analytics strictly from real user-persisted records—never fabricated or hardcoded demo progress.
- **Component hygiene:** Small, single-purpose components; extract shared patterns into `src/components/shared/`; keep JSX free of direct IndexedDB calls.

## Required Workflow
1. Check `src/components/ui/`, `src/components/shared/`, and `src/lib/` before creating new components or utilities.
2. Define explicit TypeScript interfaces/types for props and domain entities.
3. Wire interactive controls to real state/persistence handlers or clearly indicate unavailable states.
4. Run `npx tsc --noEmit`, ESLint, and `npm run build` after changes.

## Quality Requirements
- No `any`, no `@ts-ignore`, and no suppressed hooks/lint warnings without documented justification.
- Accessible labels, semantic landmarks, and keyboard-operable controls.

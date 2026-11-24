---
name: dayforge-data-management
description: >-
  Guides IndexedDB/Dexie schema design, local-first CRUD services, user config
  separation, export/import backups, and future Supabase sync readiness in
  DayForge. Use when modeling data, writing persistence services, or handling user data.
---

# DayForge Data Management

## Purpose
Ensure all user productivity, schedule, DSA, learning, and career data persists reliably offline in IndexedDB with clean migration paths toward future Supabase PostgreSQL synchronization.

## When to Use
- Designing domain types, Zod schemas, or Dexie/IndexedDB tables.
- Implementing repositories/services under `src/services/`.
- Adding data export/import, backup, or future sync metadata.

## Project Conventions
Follow Sections 2, 3, 4, and 6 of [SKILLS.md](../../../SKILLS.md):
- **Local-first store:** Use IndexedDB (with Dexie where appropriate) as the source of truth during Phase 1.
- **No fabricated data:** Never seed fake user progress, fake DSA stats, or invented academic schedules. Keep default templates empty or clearly user-editable config.
- **Sync-ready records:** Include stable UUID `id`, `createdAt`, and `updatedAt` timestamps (and optional `userId` / sync metadata fields when appropriate) so future Supabase PostgreSQL sync stays clean.
- **No Firebase:** Never introduce Firebase SDKs or Firestore adapters.
- **Clean boundaries:** Keep all IndexedDB/Dexie access inside `src/services/`, exposed via typed functions or feature hooks.

## Required Workflow
1. Define Zod schemas and TypeScript types in `src/types/` or feature `types.ts`.
2. Version Dexie/IndexedDB schemas safely—never break existing local user stores without an upgrade path.
3. Validate external/imported JSON with Zod before writing to IndexedDB.
4. Centralize date/time calculations in `src/lib/` to avoid timezone drift.

## Quality Requirements
- Persisted records survive full page reloads and offline sessions.
- Corrupt or missing local data degrades gracefully with clear error/empty states.

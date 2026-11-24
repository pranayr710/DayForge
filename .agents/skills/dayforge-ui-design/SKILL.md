---
name: dayforge-ui-design
description: >-
  Enforces DayForge's dark-first visual system, color palette, typography,
  responsive desktop/mobile navigation, and Stitch UI workflow. Use when
  designing screens, defining tokens, or building and polishing UI layouts.
---

# DayForge UI Design

## Purpose
Ensure every DayForge screen achieves a calm, Linear/Notion/Raycast-inspired dark-mode experience across mobile and desktop viewports.

## When to Use
- Designing new screens or flows (especially with `StitchMCP` and Stitch skills).
- Configuring Tailwind tokens, CSS variables, typography, or layout shells.
- Auditing responsive behavior, spacing, or empty/loading/error states.

## Project Conventions
Follow Section 5 of [SKILLS.md](../../../SKILLS.md):
- **Default dark palette:** Background `#111318`, Secondary `#191D25`, Elevated `#202631`, Primary accent `#635BDB`, Secondary accent `#8178F5`, Success `#16A34A`, Warning `#E5A03C`, Error `#E05252`, Primary text `#F3F4F6`, Secondary text `#9CA3AF`.
- **Typography:** `Geist` or `Inter`, with tabular numerals for schedules, counts, and timers.
- **Navigation:** Responsive desktop sidebar + mobile bottom navigation bar with safe-area padding and touch-friendly (`40px`–`44px`+) targets.
- **States:** Every data view must handle empty, loading, and error states cleanly without fabricated data.

## Required Workflow
1. Define or reference design tokens in `src/styles/` (and `.stitch/DESIGN.md` when using Stitch).
2. For Stitch-assisted screen design, pair `enhance-prompt` / `taste-design` / `manage-design-system` / `generate-design` with `StitchMCP`, then convert via `react-components` and `shadcn-ui`.
3. Build mobile-first layouts and scale up cleanly to desktop widths.
4. Use Framer Motion subtly and respect `prefers-reduced-motion`.

## Quality Requirements
- Zero horizontal overflow at mobile (`375px`) and desktop (`1280px+`) widths.
- WCAG AA contrast, clear keyboard focus rings, and zero non-functional buttons.

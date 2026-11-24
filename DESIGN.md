# Design System: DayForge
**Stitch Project ID:** `projects/12983810351007516320`
**Design System Asset:** `assets/9113049471360688484` (*DayForge Dark System — Obsidian Smoked Glass*)

---

## 1. Visual Theme & Atmosphere
DayForge pairs an **obsidian smoked-glass aesthetic** with Linear/Raycast-grade layout restraint. A deep obsidian base (`#0D0F14`) carries subtle radial ambient indigo lighting so frosted-glass cards, floating sidebars, and mobile navigation bars have genuine depth and specular clarity without harsh gradients, neon glows, or visual clutter.

- **Default Mode:** Obsidian Dark Glass (`#0D0F14` base + translucent frosted surfaces), with a matching light-glass mode (`#F4F6FA`) switchable in Settings.
- **Craft Guardrails:** Subtle 1px specular top highlights (`inset 0 1px 0`), crisp hairline borders, restrained spring physics, `prefers-reduced-motion` support, and zero fabricated sample metrics.

---

## 2. Color Palette & Glass Tokens

### Obsidian Smoked-Glass Dark Theme (Default)
| Token | Value | Functional Role |
| :--- | :--- | :--- |
| `--df-bg` | `#0D0F14` | Primary obsidian canvas with subtle ambient radial indigo depth |
| `--df-secondary` | `rgba(25, 29, 37, 0.62)` | Frosted glass sidebar, cards, and mobile header (`blur(20px) saturate(155%)`) |
| `--df-elevated` | `rgba(34, 40, 52, 0.74)` | Elevated glass spotlights, modals, floating mobile nav (`blur(24px) saturate(170%)`) |
| `--df-border` | `rgba(255, 255, 255, 0.085)` | Hairline structural border |
| `--df-specular` | `rgba(255, 255, 255, 0.075)` | Crisp 1px top-edge specular highlight inside glass surfaces |
| `--df-accent` | `#635BDB` | Primary CTAs, active nav pill gradient, focus ring |
| `--df-accent-secondary` | `#8178F5` | Secondary highlights, badges, progress gradient |
| `--df-success` | `#16A34A` | Completed tasks, live active status, online indicator |
| `--df-warning` | `#E5A03C` | Approaching deadlines, break blocks, offline notice |
| `--df-error` | `#E05252` | Validation errors, destructive actions, urgent P1 badges |
| `--df-text` | `#F3F4F6` | Headings, primary body copy, tabular metrics |
| `--df-text-muted` | `#9CA3AF` | Timestamps, subject codes, metadata |

### Light Glass Theme (Supported)
- `--df-bg`: `#F4F6FA`
- `--df-secondary`: `rgba(255, 255, 255, 0.72)`
- `--df-elevated`: `rgba(255, 255, 255, 0.88)`
- `--df-border`: `rgba(15, 23, 42, 0.09)`
- `--df-text`: `#111318`, `--df-text-muted`: `#4B5563`

---

## 3. Typography Rules
- **UI & Headings:** `Geist` (`@fontsource-variable/geist`, bundled locally for offline PWA).
- **Monospace & Numerals:** `JetBrains Mono` (`@fontsource-variable/jetbrains-mono`) with `tabular-nums` for class slot times, countdowns, IST clock, and KPI numbers.

---

## 4. Motion & Glass Component Stylings
- **Navigation Pills (`layoutId`):** Smooth spring-driven shared-element pill (`stiffness: 380–420, damping: 30–32`) across desktop sidebar items, mobile bottom tabs, and `SegmentedTabs`.
- **Page Transitions:** Smooth `opacity + 8px translateY` enter transition on route change, respecting `prefers-reduced-motion`.
- **Buttons:** Tactile press (`active:scale-[0.985]`), subtle specular top highlight on primary `#635BDB` buttons, frosted `secondary` / `outline` buttons.
- **Cards:** `rounded-2xl` smoked-glass containers (`df-glass` / `df-glass-elevated`) with optional subtle lift on interactive metric cards.
- **Focus Mode Overlay:** Deep blurred backdrop (`backdrop-blur-xl`), frosted chamber card, and animated circular SVG countdown ring.

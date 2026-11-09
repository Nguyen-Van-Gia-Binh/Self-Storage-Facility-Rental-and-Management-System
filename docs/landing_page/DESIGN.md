---
name: SmartStorage UI
colors:
  surface: '#effcf8'
  surface-dim: '#cfddd9'
  surface-bright: '#effcf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e9f7f3'
  surface-container: '#e3f1ed'
  surface-container-high: '#ddebe7'
  surface-container-highest: '#d8e5e2'
  on-surface: '#121e1c'
  on-surface-variant: '#3e4945'
  inverse-surface: '#273330'
  inverse-on-surface: '#e6f4f0'
  outline: '#6e7a75'
  outline-variant: '#bdc9c4'
  surface-tint: '#006b58'
  primary: '#006b58'
  on-primary: '#ffffff'
  primary-container: '#57b29a'
  on-primary-container: '#004134'
  inverse-primary: '#7dd7be'
  secondary: '#45617a'
  on-secondary: '#ffffff'
  secondary-container: '#c3e0fe'
  on-secondary-container: '#47647d'
  tertiary: '#465e8a'
  on-tertiary: '#ffffff'
  tertiary-container: '#8ba3d3'
  on-tertiary-container: '#1f3962'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#99f4d9'
  primary-fixed-dim: '#7dd7be'
  on-primary-fixed: '#002019'
  on-primary-fixed-variant: '#005141'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#accae6'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#2d4961'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#afc7f9'
  on-tertiary-fixed: '#001b3f'
  on-tertiary-fixed-variant: '#2e4771'
  background: '#effcf8'
  on-background: '#121e1c'
  surface-variant: '#d8e5e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a high-precision, hyper-clean modern SaaS aesthetic inspired by next-generation web utilities. It blends utility-first minimalism with airy, tactile Scandinavian tech sensibilities. Built for both facility operators managing hundreds of physical units and end customers booking dynamic storage spaces, the interface conveys reliability, physical asset security, frictionless logistics, and modern digital fluidity.

The personality balances utilitarian efficiency with refreshing clarity:
- **Pristine & Organized:** Crisp 1px structural micro-borders, clean tabular layouts, and intentional whitespace eliminate visual clutter.
- **Calm Operational Focus:** Muted botanical mint bases and soft sky secondary notes reduce cognitive fatigue during prolonged dashboard monitoring.
- **Immediate State Legibility:** High-contrast tactical status accents grant instant peripheral recognition of unit availability, locks, and payment delinquency.
- **Sharp & Ergonomic:** Modern geometric surfaces, snappy interactive transitions, and rounded-xl containers ground the experience in approachable utility.

## Colors

The palette establishes an airy, crystalline baseline anchored by deep obsidian pine typography and fresh mint accents.

### Core Swatches
- **Primary (Mint Teal):** `#57b29a` — Key actions, active states, brand marks, and prominent primary toggles.
- **Primary Hover (Mint Dark):** `#439782` — Interactive states for primary CTA buttons and active controls.
- **Secondary (Soft Sky Blue):** `#96b3cf` — Supportive badges, analytics secondary series, secondary interactive accents.
- **Accent (Denim Periwinkle):** `#7c94c3` — Metadata tags, filter pills, interactive focus indicators, and chart telemetry.
- **Neutral Dark (Deep Pine Obsidian):** `#0a1614` — High-contrast display typography, primary titles, and dark sidebar options.
- **Neutral Light (Canvas White):** `#ffffff` — Card containers, elevated surfaces, input backgrounds, and modal sheets.
- **Background (Soft Mint Mist):** `#f2f9f7` — App canvas viewport background providing soft contrast behind pure white cards.
- **Border / Hairline (Subtle Mist Border):** `#e2ece9` (or `rgba(10, 22, 20, 0.08)`) — Crisp 1px framing strokes around cards and controls.

### Functional Storage Unit Statuses
- **Available:** `#10b981` (Emerald) — Vacant, cleaned, and ready for lease.
- **Reserved:** `#38bdf8` (Sky) — Deposit held, pending contract or check-in.
- **Occupied:** `#64748b` (Slate) — Currently tenanted and in active use.
- **Maintenance:** `#f59e0b` (Amber) — Service required, cleaning, or sensor check.
- **Overdue:** `#ef4444` (Red) — Unpaid balance, grace period expired.
- **Locked / Overlock:** `#e11d48` (Rose) — Access revoked, physical/digital lockout engaged.

## Typography

The type system runs purely on `Inter` (with tabular monospace fallback for unit serial IDs and access codes). Tight, negative letter tracking on headings provides the distinctive modern SaaS voice found in top developer tools and clean productivity software.

- **Headlines & Metric Figures:** Rendered in semi-bold and bold weights with negative tracking (`-0.02em` to `-0.03em`) to deliver a dense, graphic punch.
- **Data & Tables:** Body copy relies on strict optical alignment at 13px and 14px with `font-feature-settings: "cv02", "cv03", "cv04", "cv11", "tnum"` enabled to ensure monospaced figures inside live grid views, currency counters, and occupancy ratios.
- **Labels & Badges:** Uppercase and title-case labels use medium to semi-bold weights with slight positive tracking for micro-legibility at 11px and 12px.

## Layout & Spacing

The layout model is anchored by a structured 12-column adaptive fluid grid for desktop dashboards, collapsing into an 8-column layout on tablets and a single/double-column stacked system on mobile devices.

### Grid & Breakpoints
- **Desktop (>= 1280px):** 12-column fluid grid, 2rem page margins, 1.25rem gutters. Content max-width constrained to `1440px` for ultra-wide setups.
- **Tablet (768px - 1279px):** 8-column fluid grid, 1.5rem margins, 1rem gutters. Sidebars fold into an icon rail or collapsible drawer.
- **Mobile (< 768px):** 4-column layout, 1rem edge margin, 0.75rem gutters. Storage floor plans switch from spatial interactive SVGs into segmented card lists.

### Spacing Rhythm
Component spacing follows strict 4px / 8px geometric increments:
- `space-xs` (4px): Micro-gaps between badge dots and text, icon-to-label inline offsets.
- `space-sm` (8px): Form input inner paddings, list item row gaps.
- `space-md` (12px): Standard button vertical/horizontal inset, compact card headers.
- `space-lg` (20px): Card content padding, toolbar button stacks, modal body boundaries.
- `space-xl` (32px): Section breaks, metric card cluster separations.

## Elevation & Depth

Visual depth is achieved through **low-contrast outlines combined with ambient, diffused shadows**. Heavy, dark drop shadows are avoided entirely to preserve a crisp, modern SaaS feel.

- **Level 0 (Flat Canvas):** `#f2f9f7` background tone without borders.
- **Level 1 (Card & Content Blocks):** Pure white `#ffffff` background with a crisp `1px solid #e2ece9` perimeter border and a faint, high-diffusion feather: `box-shadow: 0 1px 3px rgba(10, 22, 20, 0.04), 0 1px 2px rgba(10, 22, 20, 0.02)`.
- **Level 2 (Interactive Floating / Hover):** Used on hovering unit cards and table rows: `box-shadow: 0 4px 12px -2px rgba(10, 22, 20, 0.06), 0 2px 6px -1px rgba(10, 22, 20, 0.03)` with border shifting to `rgba(87, 178, 154, 0.35)`.
- **Level 3 (Dropdowns & Popovers):** White surface framed by `1px solid #e2ece9` with `box-shadow: 0 10px 25px -5px rgba(10, 22, 20, 0.08), 0 8px 10px -6px rgba(10, 22, 20, 0.04)`.
- **Level 4 (Modals & Drawers):** White surface over a tinted backdrop (`rgba(10, 22, 20, 0.4)` with 4px backdrop blur) accompanied by `box-shadow: 0 25px 50px -12px rgba(10, 22, 20, 0.18)`.

## Shapes

The geometric identity relies on a hybrid harmony: structured containers use precise `12px` (rounded-xl) radii, while operational micro-indicators and controls use full pill forms.

- **Primary Cards & Containers:** Standardized at `12px` (`rounded-xl` in the scale). This grounds tables, metric widgets, and unit visualizers with clean, modern corners that never feel boxy or toy-like.
- **Input Fields & Action Triggers:** Configured with `8px` (`rounded-md` / base rounded) corners for sharp input accuracy.
- **Status Tags, Chips & Filter Badges:** Always `rounded-full` (9999px pill shapes), contrasting against the rectangular grid framing.
- **Micro-Dots & Sensory Nodes:** 6px to 8px circular glyphs embedded inside badges to show real-time IoT unit status (e.g., active electronic lock, climate control online).

## Components

### Buttons
- **Primary:** Solid `#57b29a` fill with pure white `#ffffff` text, 1px subtle matching border, `8px` corner radius. Hover transitions to `#439782`. Focus ring: 2px offset with `rgba(87, 178, 154, 0.4)`.
- **Secondary:** White `#ffffff` background with 1px border (`#e2ece9`), text in `#0a1614`. Hover switches to `#f2f9f7` with subtle text darkening.
- **Tertiary / Ghost:** Transparent background, `#0a1614` text with hover fill `#f2f9f7`.
- **Destructive:** Solid `#ef4444` fill or subtle tinted rose background (`#ffe4e6`) with `#e11d48` text for unit eviction or lock cut actions.

### Cards
- Pure white `#ffffff` background, `12px` border radius, bounded by a uniform `1px solid #e2ece9` stroke.
- Padding defaults to `20px` (`space-lg`). Header areas have bottom border separators when holding tabular datasets.

### Storage Unit Status Badges (Pills)
Pill-shaped containers (`rounded-full`), padded `4px 10px`, containing a 6px status dot and 11px uppercase/semi-bold label:
- **Available:** Mint/Emerald tint (`#ecfdf5`), text `#047857`, dot `#10b981`.
- **Reserved:** Sky tint (`#f0f9ff`), text `#0369a1`, dot `#38bdf8`.
- **Occupied:** Slate tint (`#f1f5f9`), text `#475569`, dot `#64748b`.
- **Maintenance:** Amber tint (`#fffbeb`), text `#b45309`, dot `#f59e0b`.
- **Overdue:** Red tint (`#fef2f2`), text `#b91c1c`, dot `#ef4444`.
- **Locked:** Rose tint (`#fff1f2`), text `#be123c`, dot `#e11d48`.

### Inputs & Form Controls
- **Text Inputs:** `14px` font, 38px height, `8px` border radius, white background, `1px solid #e2ece9` border. Focus state activates a sharp 1px border in `#57b29a` with a 3px outer glow `rgba(87, 178, 154, 0.15)`.
- **Checkboxes & Radios:** `16px` dimensional square with 4px radius (or round for radio). Checked state fills `#57b29a` with white checkmark glyph.

### Interactive Facility Grid Tile (Domain-Specific)
- Rectangular modular block representing individual physical units (e.g., "Unit 104 - 10x10").
- Features a top color-coded state rail (3px accent bar according to status).
- Displays occupancy percentage, temperature/humidity sensor readings, and keycode status in high-density tabular typography.
- Hover produces subtle scale lift (`translateY(-2px)`) and triggers Elevation Level 2.
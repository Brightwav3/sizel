# Rigsmith Design System

A clean, restrained interface system for **Rigsmith** — an electronics storefront with catalog, product detail, cart, checkout, and PC builder surfaces. The system favors quiet neutrals, a single accent blue, compact information hierarchy, and semantic component tokens that keep every screen in the same visual language.

> **Sources.** The foundations below are the contract for the current Rigsmith frontend. Catalog imagery is allowed in product surfaces; decorative gradients, textures, and arbitrary component styling are not.

---

## Brand context

Rigsmith is a focused electronics shop for comparing parts and assembling a compatible PC. The product surface is dense but never noisy: lots of small text, subtle borders instead of heavy shadows, and one dark pill button per view as the clear primary action.

**Products represented**
- **Storefront** (`src/`) — persistent top bar, catalog rail, category grids, product detail, cart, checkout, and PC builder.

---

## Content fundamentals

- **Voice:** plain, calm, second-person. Address the user as *you* ("Your project is ready"). Refer to the product as *Rigsmith* or *your workspace*.
- **Casing:** sentence case everywhere — buttons ("New project", not "New Project"), titles, menu items. The only uppercase is small section eyebrows (letter-spaced, tertiary grey).
- **Length:** terse. Labels are 1–2 words; helper text is one short sentence. Never a paragraph where a phrase will do.
- **Punctuation:** no exclamation marks in UI copy. Periods on full-sentence helper/description text; none on labels or single-clause hints.
- **Numbers & meta:** relative time ("Edited 2h ago"), compact counts in badges ("12", "3").
- **Emoji:** none. The brand does not use emoji in product UI.
- **Examples:** "Give your project a name to get started." · "This permanently removes the project and all its files. This can't be undone." · "Changes saved — your project is live."

---

## Visual foundations

- **Type:** Inter, two weights only — Regular (400) and Medium (500). Global letter-spacing of **−0.15px** on all text. The base ramp is **12 / 13 / 14 / 24px**. Component roles in `tokens/components.css` cover intentional geometry such as icon sizes, compact prices, hero headings, and review scores; screens must use those semantic roles instead of raw values.
- **Color hierarchy:** text is built from three greys — `#292929` (primary), `#5D5D5D` (secondary), `#9E9E9E` (tertiary). These do the heavy lifting; color is used sparingly.
- **Accent:** one blue (`#2C6EF5`) for links, active nav, focus rings, and the accent button variant. The *primary* CTA is not blue — it is the near-black `#292929` pill.
- **Semantic:** green `#2E9E5B` (success), amber `#C9820A` (warning), red `#DC3B3B` (danger), each with a soft tinted background for badges/toasts.
- **Backgrounds:** flat. Page is white; content areas sit on a faint `#F4F4F4` sunken fill. Product imagery is content; decorative gradients, textures, and patterns are not.
- **Borders:** hairline `1px` in the neutral ramp (`#EBEBEB` subtle, `#E0E0E0` default). Cards rely on borders more than shadow.
- **Shadows:** soft and low-contrast, tinted with the ink color (`rgba(41,41,41,…)`), never pure black. Four steps: card, raised, popover, modal. Most cards have *no* shadow at rest.
- **Corner radii:** three intentional values — **8px** navigation/inputs/menus, **16px** cards/sheets/dialogs, **pill (full)** for CTA buttons and toggles. Chips/tags use a tight 4px.
- **Spacing:** 4px base grid (4, 8, 12, 16, 20, 24, 32, 40, 48). Cards pad at 16px; nav items gap at 4px.
- **Animation:** quick and understated — 120–160ms ease on background/border/opacity. Buttons scale to 0.97 on press. No bounces, no long fades, no motion flourishes.
- **Hover states:** neutral surfaces darken by one ramp step (transparent → `#F4F4F4`); the primary pill darkens slightly. Never lighten.
- **Press states:** slight scale-down (0.97) on buttons; active nav uses a one-step-darker fill.
- **Transparency & blur:** reserved for the persistent topbar and modal scrim (`rgba(41,41,41,0.32)`). The topbar uses a restrained translucent surface with an 18px backdrop blur; cards stay solid.
- **Cards:** white surface, 16px radius, hairline subtle border, no shadow at rest; interactive cards lift 1px and gain the card shadow on hover; floating panels use the raised shadow instead.

---

## Iconography

- **Set:** [Google Material Symbols](https://fonts.google.com/icons) — Outlined style. Loaded as a variable icon font from Google Fonts. Names are snake_case Material Symbols identifiers (e.g. `chat_bubble`, `calendar_month`, `more_horiz`).
- **Loading:** each host page links the font: `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`. The `Icon` wrapper maps `size` to both `font-size` and the `opsz` axis, and exposes `fill` and `weight` axes.
- **Sizes:** **14px** in navigation (sidebar, topbar, buttons), **20px** in cards and content. These two sizes are the rule.
- **Color:** icons inherit text greys — tertiary `#9E9E9E` at rest in nav, secondary `#5D5D5D` when meaningful.
- **Delivery:** icon font ligatures (via Material Symbols), never PNG, never emoji, never arbitrary Unicode glyphs.
- **Wrapper:** the `Icon` component (`components/icon/`) is an intentional addition — a thin adapter over Material Symbols so consumers get consistent sizing and axis defaults without touching the font directly.

---

## Logo

No logo or brand mark was provided. Wherever a mark is needed, render the wordmark **"Rigsmith"** in Inter Medium, or the single-letter **"F"** tile used in the sidebar (dark `#292929` square, 6px radius, white letter). **Do not** invent or draw a logo. Provide real brand assets to replace these placeholders.

---

## Index / manifest

**Root**
- `styles.css` — the single entry point consumers link (import list only).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radii.css`, `shadows.css`, `components.css`, `fonts.css`.
- `thumbnail.html` — homepage tile.
- `SKILL.md` — Agent-Skill wrapper.
- `guidelines/` — foundation specimen cards (Type, Colors, Spacing).

**Components** (`components/`) — React primitives, each with `.jsx` + `.d.ts` + `.prompt.md` + a directory card:
- `forms/` — **Button, IconButton, Input, Select, Checkbox, Radio, Switch**
- `display/` — **Card, Badge, Tag**
- `navigation/` — **Tabs**
- `feedback/` — **Dialog, Toast, Tooltip**
- `icon/` — **Icon** *(intentional addition — Lucide wrapper)*

**UI kits** (`ui_kits/`)
- `workspace/` — interactive workspace app (Sidebar, Topbar, Projects grid, New-project dialog, Settings). Entry: `index.html`.

Components are reachable at runtime via `window.RigsmithDesignSystem_795038.<Name>` after loading `_ds_bundle.js`.

---

## Caveats

- **Fonts:** Inter (Regular + Medium) is loaded from the Google Fonts CDN via `tokens/fonts.css`; it renders consistently across platforms with no upload needed.
- **Icons:** Google Material Symbols (Outlined), per your direction.
- **Accent & semantic hues** were derived, not supplied — adjust to match real brand values if they exist.

## Context
The Persian date-time picker library needs dark mode support. The consumer codebase uses Tailwind CSS with `class` strategy (`.dark` class on `<html>`), and we also want OS-level dark mode detection via `prefers-color-scheme`.

## Goals / Non-Goals

**Goals:**
- Global dark mode toggle on the service, consumed by all components
- Dual-detection: `.dark` class AND `prefers-color-scheme: dark`
- No new npm dependencies
- Tailwind-aligned default color palette (slate-gray + blue primary)
- Consumers can override individual colors via CSS custom properties
- No breaking API changes

**Non-Goals:**
- Per-instance dark mode (single project-wide toggle is sufficient)
- CSS-only dark mode (service-based detection is needed for the programmatic toggle)
- Complex theming system (dark/light toggle only, not multi-theme)

## Decisions

### Decision 1: Service signal with computed `isDark`
- **What**: `PersianDateTimePickerService.theme` signal (`'auto'|'light'|'dark'`) + computed `isDark`
- **Why**: Single source of truth consumed by all components. Service can be injected by consumers for programmatic control.
- **Alternatives considered**: Per-component `@Input()` — rejected because it requires every consumer template to pass the value down, and doesn't support auto-detection.

### Decision 2: Dual detection in 'auto' mode
- **What**: On init, the service sets up both a `matchMedia('(prefers-color-scheme: dark)')` listener AND a `MutationObserver` on `document.documentElement` watching for the `class` attribute. Either trigger flips `isDark` to `true`.
- **Why**: Many Tailwind-based apps use `.dark` class. Many laptop users toggle OS dark mode. Both patterns are common. Supporting only one would leave the other group out.
- **Alternatives considered**: CSS-only `@media (prefers-color-scheme)` + `.dark` class — rejected because you can't combine media queries and selectors in one rule cleanly. Also required component-level class bindings anyway.

### Decision 3: `[class.dtp-dark]` host binding on each component
- **What**: Each of the four components binds `[class.dtp-dark]="service.isDark()"` on its host element.
- **Why**: Cleanest CSS selector — `:host.dtp-dark` targets the component root without leaking styles. No global body classes. Works regardless of Angular's encapsulation strategy.
- **Alternatives considered**: Adding `.dtp-dark` class to `<body>` — rejected because it mutates global state outside Angular's control and risks conflicts.

### Decision 4: CSS custom properties with Tailwind-aware defaults
- **What**: Replace all hardcoded SCSS variables (`$primary-color`, `$background-color`, etc.) with `var(--dtp-*)` calls. Define light values in `:root` and dark values inside `:host.dtp-dark` blocks.
- **Why**: Consumers can override at the `:root` level to match their brand. No SCSS variable leakage. Tailwind palette values give a professional dark mode out of the box.
- **Alternatives considered**: SCSS `@mixin dark-mode { }` with color overrides — rejected because SCSS mixins can't be overridden by consumers at runtime.

### Decision 5: 14 CSS custom properties
- **What**: `--dtp-surface`, `--dtp-surface-alt`, `--dtp-text`, `--dtp-text-secondary`, `--dtp-border`, `--dtp-primary`, `--dtp-primary-hover`, `--dtp-primary-light`, `--dtp-primary-text`, `--dtp-disabled`, `--dtp-disabled-text`, `--dtp-backdrop`, `--dtp-shadow`, `--dtp-today-ring`, `--dtp-input-bg`, `--dtp-input-border`
- **Why**: Covers all currently hardcoded colors in the library. Not over-engineered (16 vars is manageable). Named semantically so it's clear what each controls.

## Risks / Trade-offs
- **Consumer SCSS variable usage**: If anyone imported `$primary-color` directly from the library's SCSS, they'll break. Mitigation: these were never documented as public API, and the replacement is trivial (`var(--dtp-primary)`).
- **MutationObserver perf**: Watching a single element's `class` attribute is negligible. The observer is set up once on service init and lives for the app's lifetime.
- **iOS Safari `matchMedia`**: Works on iOS 13+. iOS 12 is effectively dead in 2026.

## Migration Plan
1. Add `theme` signal + detection logic to `PersianDateTimePickerService`
2. Define CSS custom properties in a shared SCSS partial (`_colors.scss`)
3. Update each component's SCSS (POPUP → TIME → MOBILE → INPUT) — convert hardcoded vars to `var(--dtp-*)`, add `:host.dtp-dark` block
4. Add `[class.dtp-dark]` host binding to each component
5. Build & verify
6. Update `public-api.ts` if needed (unlikely — no new exports)

## Open Questions
- None — all decisions made during brainstorming.

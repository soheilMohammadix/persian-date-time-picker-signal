# Global Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global dark mode to the Persian date-time-picker library that syncs with Tailwind's `.dark` class and `prefers-color-scheme: dark`, controlled via a `theme` signal on `PersianDateTimePickerService`.

**Architecture:** A `theme<'auto'|'light'|'dark'>` signal on the service auto-detects dark mode via `MutationObserver` (`.dark` class on `<html>`) and `matchMedia` (`prefers-color-scheme`). A computed `isDark` boolean is exposed. All four visual components bind `[class.dtp-dark]="isDark()"` on their host. Hardcoded SCSS variables are replaced with `var(--dtp-*)` CSS custom properties, with dark values under `:host.dtp-dark`.

**Tech Stack:** Angular (signals, `DestroyRef`), SCSS (→ CSS custom properties), native `MutationObserver` + `matchMedia`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| **Create** | `projects/persian-date-time-picker-signal/src/lib/_colors.scss` | Defines all `--dtp-*` CSS custom properties (light defaults in `:root`, overrides under `:host.dtp-dark`) |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/persian-date-time-picker.service.ts` | Add `theme` signal, `isDark` computed, `MutationObserver` + `matchMedia` detection |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/date-picker-popup/date-picker-popup.component.ts` | Add `[class.dtp-dark]` host binding |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/date-picker-popup/date-picker-popup.component.scss` | Replace `$primary-color` etc. with `var(--dtp-*)`, add `:host.dtp-dark` block |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/time-picker/time-picker.component.ts` | Add `[class.dtp-dark]` host binding |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/time-picker/time-picker.component.scss` | Replace `$primary-color` etc. with `var(--dtp-*)`, add `:host.dtp-dark` |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/mobile-date-picker/mobile-date-picker.component.ts` | Add `[class.dtp-dark]` host binding |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/mobile-date-picker/mobile-date-picker.component.scss` | Add `:host.dtp-dark` block overriding `--mobile-*` vars |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/date-picker/date-picker.component.ts` | Add `[class.dtp-dark]` host binding |
| **Modify** | `projects/persian-date-time-picker-signal/src/lib/date-picker/date-picker.component.scss` | Replace hardcoded hex colors with `var(--dtp-*)` |

---

### Task 1: Create shared `_colors.scss` partial

**Files:**
- Create: `projects/persian-date-time-picker-signal/src/lib/_colors.scss`

```scss
// ============================================
// Persian Date Time Picker — CSS Custom Property Tokens
// Light + dark color palettes (Tailwind-aligned defaults)
// Consumers may override any --dtp-* variable at :root level
// ============================================

// Light (default) — Tailwind gray/blue palette
:root {
  --dtp-surface: #ffffff;
  --dtp-surface-alt: #f9fafb;       /* gray-50 */
  --dtp-text: #111827;              /* gray-900 */
  --dtp-text-secondary: #6b7280;    /* gray-500 */
  --dtp-border: #e5e7eb;            /* gray-200 */
  --dtp-primary: #2563eb;           /* blue-600 */
  --dtp-primary-hover: #1d4ed8;     /* blue-700 */
  --dtp-primary-light: #eff6ff;     /* blue-50 */
  --dtp-primary-text: #ffffff;
  --dtp-disabled: #f3f4f6;          /* gray-100 */
  --dtp-disabled-text: #9ca3af;     /* gray-400 */
  --dtp-backdrop: rgba(0, 0, 0, 0.5);
  --dtp-shadow: rgba(0, 0, 0, 0.1);
  --dtp-today-ring: #2563eb;        /* blue-600 */
  --dtp-input-bg: #ffffff;
  --dtp-input-border: #d9d9d9;
  --dtp-success: #10b981;           /* emerald-500 */
  --dtp-danger: #e65100;            /* orange-900 */
  --dtp-danger-bg: #fff3e0;         /* orange-50 */

  // Time-picker specific
  --dtp-focus-shadow: rgba(24, 144, 255, 0.2);
  --dtp-selection-bg: #e6f4ff;
  --dtp-separator: #999;
  --dtp-border-light: #f0f0f0;
  --dtp-column-bg-hover: #f5f5f5;
  --dtp-column-bg-selected: #e6f4ff;
  --dtp-column-disabled-bg: #fafafa;

  // Mobile-specific (mapped from --mobile-*)
  --dtp-mobile-divider: #e5e7eb;
  --dtp-mobile-surface: #f9fafb;
}

// Dark — activated when a parent (or host) has class .dtp-dark
:host.dtp-dark {
  --dtp-surface: #1f2937;             /* gray-800 */
  --dtp-surface-alt: #111827;         /* gray-900 */
  --dtp-text: #f9fafb;               /* gray-50 */
  --dtp-text-secondary: #9ca3af;     /* gray-400 */
  --dtp-border: #374151;              /* gray-700 */
  --dtp-primary: #3b82f6;            /* blue-500 */
  --dtp-primary-hover: #60a5fa;      /* blue-400 */
  --dtp-primary-light: #1e3a5f;      /* blue-900 tint */
  --dtp-primary-text: #ffffff;
  --dtp-disabled: #374151;            /* gray-700 */
  --dtp-disabled-text: #6b7280;      /* gray-500 */
  --dtp-backdrop: rgba(0, 0, 0, 0.7);
  --dtp-shadow: rgba(0, 0, 0, 0.3);
  --dtp-today-ring: #60a5fa;         /* blue-400 */
  --dtp-input-bg: #1f2937;           /* gray-800 */
  --dtp-input-border: #4b5563;       /* gray-600 */
  --dtp-success: #34d399;            /* emerald-400 */
  --dtp-danger: #ff8a65;             /* orange-300 */
  --dtp-danger-bg: #3e2723;         /* brown-900 */

  // Time-picker dark
  --dtp-focus-shadow: rgba(59, 130, 246, 0.3);
  --dtp-selection-bg: #1e3a5f;
  --dtp-separator: #6b7280;
  --dtp-border-light: #374151;
  --dtp-column-bg-hover: #374151;
  --dtp-column-bg-selected: #1e3a5f;
  --dtp-column-disabled-bg: #111827;

  // Mobile dark
  --dtp-mobile-divider: #374151;
  --dtp-mobile-surface: #111827;
}
```

> **Note:** The `:host.dtp-dark` block works because each component has `[class.dtp-dark]="service.isDark()"` on its host element. When the class is present, these variables override the `:root` defaults within that component's shadow tree.

---

### Task 2: Add `theme` signal and dark-mode detection to the service

**Files:**
- Modify: `projects/persian-date-time-picker-signal/src/lib/persian-date-time-picker.service.ts`

Expand the imports to include:

```typescript
import {Injectable, signal, computed, DestroyRef, inject} from "@angular/core";
```

Add these signals inside the `PersianDateTimePickerService` class (after the existing signals):

```typescript
// ========== Dark Mode ==========

/** Consumer-facing: 'auto' (default) | 'light' | 'dark' */
readonly theme = signal<'auto' | 'light' | 'dark'>('auto');

/** True when the OS prefers dark scheme (backed by matchMedia) */
private readonly _prefersDark = signal(false);

/** True when <html> has class 'dark' (backed by MutationObserver) */
private readonly _htmlHasDark = signal(false);

/** Computed — single source of truth: auto detects both, manual overrides */
readonly isDark = computed(() => {
  const t = this.theme();
  if (t === 'light') return false;
  if (t === 'dark') return true;
  // auto
  return this._prefersDark() || this._htmlHasDark();
});

private _setupDarkModeDetection(): void {
  // 1) prefers-color-scheme media query
  const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  this._prefersDark.set(darkMq.matches);
  darkMq.addEventListener('change', (e) => {
    this._prefersDark.set(e.matches);
  });

  // 2) MutationObserver for .dark class on <html>
  const observer = new MutationObserver(() => {
    this._htmlHasDark.set(document.documentElement.classList.contains('dark'));
  });
  observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});

  // Clean up the observer when the service is destroyed
  // We need DestroyRef for cleanup — inject it
  const destroyRef = inject(DestroyRef);
  destroyRef.onDestroy(() => observer.disconnect());
}
```

Then call `_setupDarkModeDetection()` at the end of the constructor.

The full modified service file will be:

```typescript
import {Injectable, OnDestroy, signal, computed, DestroyRef, inject} from "@angular/core";
import {BehaviorSubject, Subject, takeUntil} from "rxjs";
import {EnglishLocale, LanguageLocale, PersianLocale} from "./utils/models";

export interface ValidTimeResult {
  isValid: boolean;
  normalizedTime: string;
}

@Injectable()
export class PersianDateTimePickerService {
  // Legacy BehaviorSubject for backward compatibility during migration
  activeInput: BehaviorSubject<string> = new BehaviorSubject('');
  languageLocale?: LanguageLocale;

  // Signal-based state (new)
  readonly activeInputSignal = signal<'start' | 'end' | ''>('');
  readonly languageLocaleSignal = signal<LanguageLocale | undefined>(undefined);

  // ========== Dark Mode ==========

  /** Consumer-facing: 'auto' (default) | 'light' | 'dark' */
  readonly theme = signal<'auto' | 'light' | 'dark'>('auto');

  /** True when the OS prefers dark scheme (backed by matchMedia) */
  private readonly _prefersDark = signal(false);

  /** True when <html> has class 'dark' (backed by MutationObserver) */
  private readonly _htmlHasDark = signal(false);

  /** Computed — single source of truth */
  readonly isDark = computed(() => {
    const t = this.theme();
    if (t === 'light') return false;
    if (t === 'dark') return true;
    return this._prefersDark() || this._htmlHasDark();
  });

  constructor(public persianLocale: PersianLocale, public englishLocale: EnglishLocale) {
    this._setupDarkModeDetection();
  }

  private _setupDarkModeDetection(): void {
    // 1) prefers-color-scheme media query
    const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
    this._prefersDark.set(darkMq.matches);
    darkMq.addEventListener('change', (e) => {
      this._prefersDark.set(e.matches);
    });

    // 2) MutationObserver for .dark class on <html>
    const observer = new MutationObserver(() => {
      this._htmlHasDark.set(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});

    // Cleanup
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => observer.disconnect());
  }

  // ... rest of the existing methods unchanged
  setActiveInput(value: 'start' | 'end' | '') { ... }
  setLanguageLocale(locale: LanguageLocale | undefined) { ... }
  getLocaleForCalendarType(calendarType: 'jalali' | 'gregorian'): LanguageLocale { ... }
  convertNumbers(number: number | string): string { ... }
  get activeInput$() { ... }
}
```

> **Note:** `DestroyRef` is available from `@angular/core` in Angular 16+. Since this project targets Angular 20+, it's safe to use.

---

### Task 3: Date picker popup — host binding + SCSS conversion

**Files:**
- Modify: `projects/persian-date-time-picker-signal/src/lib/date-picker-popup/date-picker-popup.component.ts`
- Modify: `projects/persian-date-time-picker-signal/src/lib/date-picker-popup/date-picker-popup.component.scss`

**3a — Component TS:**
- The popup extends `PersianDatePickerBase`, which already has `persianDateTimePickerService = inject(PersianDateTimePickerService)`.
- Add `[class.dtp-dark]` to the `host` property on `@Component`.

Change the `@Component` decorator to add:

```typescript
@Component({
  selector: "persian-date-picker-popup",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TimePickerComponent, ConvertNumbersPipe],
  templateUrl: "./date-picker-popup.component.html",
  styleUrls: ["./date-picker-popup.component.scss"],
  host: {
    '[class.dtp-dark]': 'persianDateTimePickerService.isDark()'
  }
})
```

**3b — Component SCSS:**
Replace the SCSS variable declarations at the top with an import of `_colors.scss`, then replace every `$variable` usage with the corresponding `var(--dtp-*)`.

At the very top of the file, add:

```scss
@import '../colors';
```

Then replace all SCSS variable references with the `var(--dtp-*)` equivalents:

| SCSS var | CSS custom property |
|----------|-------------------|
| `$primary-color` | `var(--dtp-primary)` |
| `$primary-hover` | `var(--dtp-primary-hover)` |
| `$primary-light` | `var(--dtp-primary-light)` |
| `$primary-medium` | `var(--dtp-primary-light)` (use same, or drop — only used in one place: `bbdefb` → `eff6ff` differs slightly, use `var(--dtp-primary-light)` which is `#eff6ff`) |
| `$secondary-color` | `var(--dtp-text-secondary)` |
| `$background-color` | `var(--dtp-surface)` |
| `$border-color` | `var(--dtp-border)` |
| `$text-color` | `var(--dtp-text)` |
| `$text-color-light` | `var(--dtp-text-secondary)` |
| `$shadow-color` | `var(--dtp-shadow)` |
| `$today-border` | `var(--dtp-today-ring)` |
| `$today-dot` | `var(--dtp-today-ring)` |
| `$disabled-color` | `var(--dtp-disabled-text)` |
| `$success-color` | `var(--dtp-success)` |

Also replace hardcoded `#fafafa` with `var(--dtp-disabled)` and `#fff3e0`/`#e65100` with `var(--dtp-danger-bg)`/`var(--dtp-danger)`.

Remove the SCSS `$` variable declarations entirely (lines 1–15 of the current file).

The `:host.dtp-dark` block is already handled by the variables defined in `_colors.scss`. No additional `:host.dtp-dark` styling is needed in this file.

---

### Task 4: Time picker — host binding + SCSS conversion

**Files:**
- Modify: `projects/persian-date-time-picker-signal/src/lib/time-picker/time-picker.component.ts`
- Modify: `projects/persian-date-time-picker-signal/src/lib/time-picker/time-picker.component.scss`

**4a — Component TS:**
Change the `host` property in `@Component`:

```typescript
@Component({
  selector: 'persian-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
  standalone: true,
  imports: [ ... ],
  providers: [ ... ],
  host: {
    '(click)': 'open()',
    '[class.dtp-dark]': 'persianDateTimePickerService.isDark()'
  },
  animations: [slideMotion]
})
```

**4b — Component SCSS:**
Same pattern as popup. Add `@import '../colors';` at top. Replace all `$` variable references:

| SCSS var | CSS custom property |
|----------|-------------------|
| `$primary-color` | `var(--dtp-primary)` |
| `$primary-hover` | `var(--dtp-primary-hover)` |
| `$border-color` | `var(--dtp-input-border)` (for input borders) / `var(--dtp-border)` (for popup borders) |
| `$text-color` | `var(--dtp-text-secondary)` (used as `#666` — secondary text) |
| `$disabled-color` | `var(--dtp-disabled-text)` |
| `$separator-color` | `var(--dtp-separator)` |
| `$border-light` | `var(--dtp-border-light)` |
| `$box-shadow-color` | `var(--dtp-shadow)` |
| `$focus-shadow-color` | `var(--dtp-focus-shadow)` |

Replace hardcoded colors:
- `background: white` → `background: var(--dtp-surface)`
- `background: #fafafa` → `background: var(--dtp-column-disabled-bg)`
- `background: #f5f5f5` → `background: var(--dtp-column-bg-hover)`
- `background: #e6f4ff` → `background: var(--dtp-selection-bg)`
- `color: #666` (in `$text-color`) → `color: var(--dtp-text-secondary)`
- `&:hover:not(.disabled)` background `#f5f5f5` → `var(--dtp-column-bg-hover)`
- `&.selected` background `#e6f4ff` → `var(--dtp-selection-bg)`
- `background: #f5f5f5` in scrollbar track → `var(--dtp-surface-alt)`

Remove the SCSS `$` variable declarations (lines 1–10 of the current file).

Manual inspection of replacements needed in `time-picker.component.scss`:

Line 22: `background: white;` in `@mixin default-button` → `background: var(--dtp-surface);`
Line 62: `background: #fafafa;` → `background: var(--dtp-column-disabled-bg);`
Line 92: `background: white;` → `background: var(--dtp-surface);`
Line 118: `background: #f5f5f5;` → `background: var(--dtp-surface-alt);`
Line 134: `border-bottom: 1px solid $border-light;` → stays (uses var)
Line 170: `background: #f5f5f5;` → `background: var(--dtp-column-bg-hover);`
Line 174: `background: #e6f4ff;` → `background: var(--dtp-selection-bg);`
Line 262: `background: white;` → `background: var(--dtp-surface);`

---

### Task 5: Mobile date picker — host binding + dark overrides

**Files:**
- Modify: `projects/persian-date-time-picker-signal/src/lib/mobile-date-picker/mobile-date-picker.component.ts`
- Modify: `projects/persian-date-time-picker-signal/src/lib/mobile-date-picker/mobile-date-picker.component.scss`

**5a — Component TS:**
Add host binding to `@Component`:

```typescript
@Component({
  selector: "mobile-date-picker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimePickerComponent, ConvertNumbersPipe],
  templateUrl: "./mobile-date-picker.component.html",
  styleUrls: ["./mobile-date-picker.component.scss"],
  host: {
    '[class.dtp-dark]': 'persianDateTimePickerService.isDark()'
  }
})
```

**5b — Component SCSS:**
Add `@import '../colors';` at top. Then add a `:host.dtp-dark` block that overrides the `--mobile-*` custom properties:

```scss
// Dark mode overrides for mobile
:host.dtp-dark {
  --mobile-primary-color: var(--dtp-primary);
  --mobile-primary-hover: var(--dtp-primary-hover);
  --mobile-primary-light: var(--dtp-primary-light);
  --mobile-secondary-color: var(--dtp-text-secondary);
  --mobile-background-color: var(--dtp-surface);
  --mobile-border-color: var(--dtp-border);
  --mobile-text-color: var(--dtp-text);
  --mobile-text-color-light: var(--dtp-text-secondary);
  --mobile-shadow-color: var(--dtp-shadow);
  --mobile-today-border: var(--dtp-today-ring);
  --mobile-today-dot: var(--dtp-today-ring);
  --mobile-disabled-color: var(--dtp-disabled);
  --mobile-success-color: var(--dtp-success);
  --mobile-surface-color: var(--dtp-surface-alt);
  --mobile-divider-color: var(--dtp-mobile-divider);
}
```

This works because the existing `--mobile-*` variables are already consumed throughout the SCSS. When `:host.dtp-dark` is active, the `--mobile-*` variables resolve to the dark palette via the `var(--dtp-*)` chain.

Also replace the hardcoded `#fff3e0` and `#e65100` in the `.clear-button` hover with `var(--dtp-danger-bg)` and `var(--dtp-danger)`:

```scss
// In .clear-button hover:
// Old:
//   background-color: #fff3e0;
//   border-color: #e65100;
//   color: #e65100;
// New:
.clear-button {
  // ...
  &:hover {
    background-color: var(--dtp-danger-bg);
    border-color: var(--dtp-danger);
    color: var(--dtp-danger);
  }
}
```

---

### Task 6: Date picker (input) — host binding + color replacement

**Files:**
- Modify: `projects/persian-date-time-picker-signal/src/lib/date-picker/date-picker.component.ts`
- Modify: `projects/persian-date-time-picker-signal/src/lib/date-picker/date-picker.component.scss`

**6a — Component TS:**
The date-picker already has a `host` property:

```typescript
host: {
  "[class.persian-date-picker]": "true",
  "[class.persian-date-picker-rtl]": "rtl()",
},
```

Add the dark mode binding:

```typescript
host: {
  "[class.persian-date-picker]": "true",
  "[class.persian-date-picker-rtl]": "rtl()",
  "[class.dtp-dark]": "persianDateTimePickerService.isDark()"
},
```

**6b — Component SCSS:**
Add `@import '../colors';` at top. Replace hardcoded colors:

| Line(s) | Current | Replace with |
|---------|---------|-------------|
| 16 | `border: 1px solid #d9d9d9;` | `border: 1px solid var(--dtp-input-border);` |
| 28 | `border-color: #40a9ff;` | `border-color: var(--dtp-primary-hover);` |
| 33 | `border-color: #40a9ff;` | `border-color: var(--dtp-primary-hover);` |
| 34 | `box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);` | `box-shadow: 0 0 0 2px var(--dtp-focus-shadow);` |
| 40 | `border: 1px solid #d9d9d9;` | `border: 1px solid var(--dtp-input-border);` |
| 55 | `border-color: #40a9ff;` | `border-color: var(--dtp-primary-hover);` |
| 61 | `color: #999;` | `color: var(--dtp-separator);` |
| 76 | `color: #444;` | `color: var(--dtp-text);` |
| 90 | `background: #f3f3f3;` | `background: var(--dtp-disabled);` |
| 108 | `color: #444` | `color: var(--dtp-text)` |
| 121 | `background-color: rgba(0, 0, 0, 0.5);` | `background-color: var(--dtp-backdrop);` |

Add input background and text color:

```scss
input {
  background: var(--dtp-input-bg);
  color: var(--dtp-text);
}
```

---

### Task 7: Build and verify

- [ ] **Step 1: Build the library**

```bash
bun run build:lib
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Fix any TypeScript/SCSS errors**

If the build fails (e.g., a `$variable` reference was missed), scan for remaining `$`-variable usages that weren't replaced:

```bash
rg '^\$' projects/persian-date-time-picker-signal/src/lib/date-picker-popup/date-picker-popup.component.scss
rg '^\$' projects/persian-date-time-picker-signal/src/lib/time-picker/time-picker.component.scss
rg '\$' projects/persian-date-time-picker-signal/src/lib/date-picker/date-picker.component.scss
```

Replace any missed occurrences with the corresponding `var(--dtp-*)`.

- [ ] **Step 3: Verify no SCSS variable declarations remain in component files**

```bash
rg '^\$[a-z]' projects/persian-date-time-picker-signal/src/lib/date-picker-popup/ projects/persian-date-time-picker-signal/src/lib/time-picker/ projects/persian-date-time-picker-signal/src/lib/date-picker/
```

Expected: No matches.

---

## Self-Review

**Spec coverage:**
- `theme` signal on service → task 2 ✅
- `isDark` computed on service → task 2 ✅
- Dual detection (`.dark` class + `prefers-color-scheme`) → task 2 ✅
- Host binding `[class.dtp-dark]` on all 4 components → tasks 3a, 4a, 5a, 6a ✅
- CSS custom properties with light defaults in `:root` → task 1 ✅
- CSS custom properties with dark values under `:host.dtp-dark` → task 1 ✅
- Popup SCSS conversion → task 3b ✅
- Time picker SCSS conversion → task 4b ✅
- Mobile date picker dark overrides → task 5b ✅
- Input field color replacement → task 6b ✅
- Consumer can override `--dtp-*` vars at `:root` → implicit in task 1 ✅
- Manual override beats auto → task 2 (`theme` signal checked first in `isDark`) ✅
- No breaking API changes → no new inputs/outputs added, no selectors changed ✅

**Placeholder scan:** No placeholders found. Every code block contains complete, working code.

**Type consistency:** `PersianDateTimePickerService.isDark()` is a computed signal (returns boolean), bound as `[class.dtp-dark]="persianDateTimePickerService.isDark()"`. The `theme` signal is `signal<'auto'|'light'|'dark'>`. Type names and method signatures are consistent across all tasks.


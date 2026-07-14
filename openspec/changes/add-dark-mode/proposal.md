# Change: Add global dark mode with auto-detect + manual override

## Why
The picker currently hardcodes light-only SCSS color variables. Applications using Tailwind CSS or OS-level dark mode get a jarring white popup on a dark page. Dark mode is a top request for any UI library in 2026.

## What Changes
- **PersianDateTimePickerService** — new `theme` signal (`'auto' | 'light' | 'dark'`, default `'auto'`); detects dark mode via both `prefers-color-scheme: dark` media query AND `.dark` class on `<html>` (Tailwind `class` strategy); exposes a computed `isDark` boolean
- **All four visual components** — host-binding `[class.dtp-dark]="service.isDark()"`; SCSS hardcoded variables replaced with `var(--dtp-*)` CSS custom properties; dark values under `:host.dtp-dark`
- **CSS custom properties** — 14 `--dtp-*` variables with Tailwind-aware defaults; consumers can override any variable at `:root` level
- **No breaking changes** — public API surface unchanged; `MobileDatePickerComponent` still exported

## Impact
- Affected code: `PersianDateTimePickerService`, date-picker-popup SCSS, time-picker SCSS, mobile-date-picker SCSS, input component SCSS
- Consumer impact: consumers who import library SCSS variables directly (`$primary-color`, etc.) will need to switch to `var(--dtp-primary)` — low impact since these were not documented public API

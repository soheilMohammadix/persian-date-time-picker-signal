## 1. Service Layer
- [ ] 1.1 Add `theme` signal (`'auto' | 'light' | 'dark'`, default `'auto'`) to `PersianDateTimePickerService`
- [ ] 1.2 Add `_prefersDarkScheme` signal: listen to `matchMedia('(prefers-color-scheme: dark)')` changes
- [ ] 1.3 Add `_htmlHasDarkClass` signal: `MutationObserver` on `document.documentElement` class attribute
- [ ] 1.4 Add computed `isDark` signal that reads `theme`, `_prefersDarkScheme`, and `_htmlHasDarkClass`
- [ ] 1.5 Export `PersianDateTimePickerService` from public-api.ts (verify it's already exported)

## 2. CSS Custom Properties (Shared)
- [ ] 2.1 Create `_colors.scss` partial with `--dtp-*` light defaults on `:root` and dark defaults under `:host.dtp-dark`
- [ ] 2.2 Import `_colors.scss` into each component's SCSS

## 3. Date Picker Popup Component
- [ ] 3.1 Add host binding `[class.dtp-dark]="service.isDark()"` in the component TS
- [ ] 3.2 Replace hardcoded SCSS variables (`$primary-color`, `$background-color`, etc.) with `var(--dtp-*)`
- [ ] 3.3 Remove SCSS `$` variable declarations (now defined in `_colors.scss`)
- [ ] 3.4 Build and verify

## 4. Time Picker Component
- [ ] 4.1 Add host binding `[class.dtp-dark]="service.isDark()"` in the component TS
- [ ] 4.2 Replace hardcoded SCSS variables with `var(--dtp-*)`
- [ ] 4.3 Build and verify

## 5. Mobile Date Picker Component
- [ ] 5.1 Add host binding `[class.dtp-dark]="service.isDark()"` in the component TS
- [ ] 5.2 Add `:host.dtp-dark` block with dark-mode overrides for existing `--mobile-*` custom properties
- [ ] 5.3 Build and verify

## 6. Input (DatePicker) Component
- [ ] 6.1 Add host binding `[class.dtp-dark]="service.isDark()"` in the component TS
- [ ] 6.2 Replace hardcoded input colors (`gray-100` background, etc.) with `var(--dtp-input-bg)`, `var(--dtp-input-border)`, `var(--dtp-text)`
- [ ] 6.3 Calendar icon SVG fill color to use `var(--dtp-text-secondary)`
- [ ] 6.4 Build and verify

## 7. Verification
- [ ] 7.1 Run `bun run build:lib` and fix any errors
- [ ] 7.2 Run tests (if any) and fix failures
- [ ] 7.3 Toggle dark mode programmatically (`service.theme.set('dark')`) — verify all components render correctly
- [ ] 7.4 Add `.dark` class to `<html>` in demo app — verify auto-detection
- [ ] 7.5 Enable OS dark mode — verify `prefers-color-scheme` detection

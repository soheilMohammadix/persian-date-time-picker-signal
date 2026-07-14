## ADDED Requirements

### Requirement: Global dark mode theme
The library SHALL support a global dark mode theme controlled via a service signal.

#### Scenario: Toggle dark mode programmatically
- **WHEN** a consumer sets `PersianDateTimePickerService.theme` to `'dark'`
- **THEN** all picker components SHALL render with dark-mode colors
- **AND** the `isDark` computed signal SHALL return `true`

#### Scenario: Toggle light mode programmatically
- **WHEN** a consumer sets `PersianDateTimePickerService.theme` to `'light'`
- **THEN** all picker components SHALL render with light-mode colors
- **AND** the `isDark` computed signal SHALL return `false`

#### Scenario: Auto mode with `.dark` class
- **WHEN** `PersianDateTimePickerService.theme` is `'auto'` (the default)
- **AND** the `<html>` element has the `dark` CSS class
- **THEN** all picker components SHALL render with dark-mode colors

#### Scenario: Auto mode with `prefers-color-scheme`
- **WHEN** `PersianDateTimePickerService.theme` is `'auto'`
- **AND** the OS color scheme is `dark`
- **THEN** all picker components SHALL render with dark-mode colors

#### Scenario: Auto mode when neither condition matches
- **WHEN** `PersianDateTimePickerService.theme` is `'auto'`
- **AND** the `<html>` element does NOT have the `dark` class
- **AND** the OS color scheme is NOT `dark`
- **THEN** all picker components SHALL render with light-mode colors

#### Scenario: Manual override beats auto mode
- **WHEN** `PersianDateTimePickerService.theme` is set to `'light'`
- **AND** the `<html>` element has the `dark` class
- **THEN** all picker components SHALL render with light-mode colors
- **AND** the explicit `'light'` value SHALL override auto-detection

### Requirement: CSS custom property overrides
Consumers SHALL be able to override individual color values via CSS custom properties at the `:root` level.

#### Scenario: Override primary color
- **WHEN** a consumer sets `--dtp-primary` to a custom color value in their CSS
- **THEN** the picker SHALL use that custom color for primary UI elements (selected dates, primary buttons)

#### Scenario: Override surface color in dark mode
- **WHEN** a consumer sets `--dtp-surface` to a custom color value
- **AND** dark mode is active
- **THEN** the picker SHALL use that custom color for surface backgrounds

### Requirement: No breaking public API changes
The dark mode feature SHALL NOT require changes to any existing component `@Input()`, `@Output()`, or selector.

#### Scenario: Existing inputs continue to work
- **WHEN** a consumer uses existing inputs like `cssClass`, `placeholder`, `minDate`, etc.
- **THEN** they SHALL continue to function as before
- **AND** no new required inputs are added for dark mode support

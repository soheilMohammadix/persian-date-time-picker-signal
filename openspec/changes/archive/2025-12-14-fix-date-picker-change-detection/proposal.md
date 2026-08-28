# Fix Date Picker Change Detection Bug

## Problem Summary
When selecting a date in the Persian date picker library, the value doesn't change if the time picker is enabled. However, changing the time does properly update the value. This creates an inconsistent user experience where date selections are ignored but time changes are respected.

## Root Cause Analysis
The issue is in the `handleSingleSelection` method in `date-picker-popup.component.ts:509-511`. When `showTimePicker` is true, the method doesn't emit the selected date, expecting the time picker to handle the emission. However, this creates a gap where:
1. User selects a date → No emission occurs
2. User changes time → Emission occurs via `updateSingleDateTime`

## Proposed Solution
Modify the date selection logic to always emit the selected date, regardless of whether the time picker is shown. The time picker should then update the already-selected date with time components.

## Impact
- Fixes inconsistent behavior between date and time selection
- Maintains existing time picker functionality  
- Ensures proper value emission for ControlValueAccessor
- Improves user experience by making date selection immediately responsive

## Files to Modify
- `projects/persian-date-time-picker-signal/src/lib/date-picker-popup/date-picker-popup.component.ts`

## Testing Strategy
- Test single date picker with time picker enabled
- Verify date selection immediately updates the value
- Confirm time selection still works correctly
- Test range picker functionality remains intact
- Verify ControlValueAccessor integration works properly
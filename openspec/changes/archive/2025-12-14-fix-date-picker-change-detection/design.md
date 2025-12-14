# Design: Date Picker Change Detection Fix

## Current Behavior Flow

### Date Selection (Broken)
```
User clicks date → selectDate() → handleSingleSelection() → 
if showTimePicker: NO EMISSION → Value doesn't change
```

### Time Selection (Working)
```
User changes time → updateSingleDateTime() → dateSelected.emit() → 
Value changes correctly
```

## Problem Analysis

The core issue is in `handleSingleSelection` method:

```typescript
handleSingleSelection(date: Date): void {
  if (!this.showTimePicker()) this.dateSelected.emit(date);
  // Missing: else case for when showTimePicker is true
}
```

When `showTimePicker` is true, no emission occurs, leaving the component in an inconsistent state where:
- The UI shows the selected date
- The internal value remains unchanged
- Only time changes trigger value updates

## Proposed Solution Design

### Option 1: Always Emit on Date Selection (Recommended)
Modify `handleSingleSelection` to always emit the date, regardless of time picker visibility:

```typescript
handleSingleSelection(date: Date): void {
  this.dateSelected.emit(date);
  // Time picker will later update this date with time components
}
```

### Option 2: Conditional Emission with Time Integration
Emit immediately but coordinate with time picker:

```typescript
handleSingleSelection(date: Date): void {
  if (this.showTimePicker()) {
    // Set a base date that time picker can modify
    this.baseSelectedDate = date;
  }
  this.dateSelected.emit(date);
}
```

## Recommended Approach: Option 1

**Why Option 1 is better:**
1. **Simplicity**: Minimal code changes, clear behavior
2. **Consistency**: Date selection always triggers value change
3. **User Experience**: Immediate feedback on date selection
4. **Backward Compatibility**: Doesn't break existing time picker logic

## Implementation Details

### Modified Flow
```
User clicks date → selectDate() → handleSingleSelection() → 
dateSelected.emit(date) → Parent updates value → 
Time picker changes → updateSingleDateTime() → 
dateSelected.emit(updatedDate) → Parent updates with time
```

### Key Changes Required
1. Remove conditional emission in `handleSingleSelection`
2. Ensure time picker properly updates the selected date
3. Maintain existing range picker logic

## Edge Cases Considered

1. **Time Component Preservation**: When user selects date after setting time, preserve existing time components
2. **Initial State**: Handle cases where no time was previously set
3. **Range Picker**: Ensure range selection logic remains unaffected
4. **ControlValueAccessor**: Maintain proper form control integration

## Validation Strategy

1. **Unit Tests**: Test date selection with/without time picker
2. **Integration Tests**: Verify ControlValueAccessor behavior
3. **Manual Testing**: Test user interaction flows
4. **Regression Tests**: Ensure existing functionality remains intact
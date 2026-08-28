# Design Document: Signals Architecture for Date Picker Library

## Overview
This document outlines the architectural approach for migrating the Persian Date Time Picker library from traditional RxJS/change detection patterns to Angular v20+ signals and zoneless operation.

## Core Principles

### 1. Signal-Based State Management
- Replace component properties with signals for reactive state
- Use computed signals for derived state
- Implement effects for side effects previously in ngOnChanges
- Maintain backward compatibility with existing APIs

### 2. OnPush Change Detection Strategy
- All components use OnPush change detection
- Manual change detection via markForCheck only when necessary
- Signal-based reactivity eliminates most manual change detection needs

### 3. Zoneless Operation
- Configure application for zoneless bootstrap
- Use runOutsideAngular for performance-critical operations
- Replace zone-based timing with native browser APIs

## Architecture Patterns

### Component Signal Structure
```typescript
// Input signals
readonly mode = input<DatePickerMode>('day');
readonly isRange = input(false);
readonly calendarType = input<CalendarType>('gregorian');

// State signals  
readonly isOpen = signal(false);
readonly selectedDate = signal<Date | null>(null);
readonly activeInput = signal<'start' | 'end' | ''>('');

// Computed signals
readonly displayValue = computed(() => {
  // Derived state logic
});

// Effects for side effects
private isOpenEffect = effect(() => {
  if (this.isOpen()) {
    this.onOpenChange.emit(true);
  }
});
```

### Service Signal Integration
```typescript
@Injectable()
export class PersianDateTimePickerService {
  // Global state signals
  readonly activeInput = signal<'start' | 'end' | ''>('');
  readonly languageLocale = signal<LanguageLocale>(this.englishLocale);
  
  // Computed state
  readonly isRtl = computed(() => 
    this.languageLocale().direction === 'rtl'
  );
}
```

### Form Integration with Signals
- Use signal-based reactive forms
- Convert form value changes to signals
- Implement signal-based validation

## Migration Strategy

### Phase 1: Foundation
1. Update dependencies and configuration
2. Establish signal-based service layer
3. Create signal utilities and helpers

### Phase 2: Component Migration
1. Migrate DatePickerComponent (most complex)
2. Migrate DatePickerPopupComponent
3. Migrate TimePickerComponent
4. Update directives and utilities

### Phase 3: Integration and Testing
1. Update all tests for signal patterns
2. Performance optimization
3. Documentation updates

## Key Considerations

### Backward Compatibility
- Maintain existing public API surface
- Internal implementation changes only
- Provide migration guide for advanced use cases

### Performance Optimizations
- Leverage signal fine-grained reactivity
- Minimize unnecessary re-renders
- Optimize bundle size through zoneless operation

### Testing Strategy
- Update unit tests for signal assertions
- Add signal-specific test utilities
- Verify performance improvements

## Risk Mitigation

### Breaking Changes
- Minimum Angular version increase (v14 → v20)
- Internal API changes for advanced users
- Zone.js configuration changes

### Migration Risks
- Complex component state management
- Form integration complexity
- Animation and overlay positioning

## Success Metrics
- Bundle size reduction (target: 15-20%)
- Performance improvement (target: 25-30% faster)
- Zero breaking changes to public API
- 100% test coverage maintained
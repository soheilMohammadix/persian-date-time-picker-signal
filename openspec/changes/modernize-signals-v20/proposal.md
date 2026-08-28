# Modernize to Angular v20+ with Signals and OnPush

## Summary
Modernize the Persian Date Time Picker library to use Angular v20+ features including signals, OnPush change detection, and zone.js optimization. This change will improve performance, reduce bundle size, and align with modern Angular best practices.

## Problem Statement
The current library supports Angular v14-20 but uses traditional change detection and RxJS patterns. Modern Angular applications benefit from:
- Signals for reactive state management
- OnPush change detection for better performance  
- Zone.js optimization for smaller bundle sizes
- Modern Angular patterns and APIs

## Proposed Solution
Transform the library to use Angular v20+ as the minimum version and implement:
- Signal-based state management in all components
- OnPush change detection throughout
- Zone.js removal/optimization
- Modern Angular patterns and APIs

## Scope
This change covers:
- All component classes (DatePickerComponent, TimePickerComponent, DatePickerPopupComponent)
- Service layer modernization
- Directive updates
- Peer dependency updates
- Documentation updates

## Benefits
- Improved performance through OnPush and signals
- Smaller bundle sizes with zone.js optimization
- Better developer experience with modern Angular patterns
- Future-proof library aligned with Angular's direction

## Impact
- Breaking change: Minimum Angular version becomes v20+
- API compatibility maintained for existing users
- Internal implementation changes only
- Improved performance for all users
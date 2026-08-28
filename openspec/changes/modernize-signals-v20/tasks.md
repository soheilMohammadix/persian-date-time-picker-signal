# Tasks for Modernize to Angular v20+ with Signals

## Phase 1: Foundation and Dependencies
- [x] 1. Update peer dependencies to require Angular v20+
- [x] 2. Remove zone.js dependency and configure zoneless
- [x] 3. Update package.json and build configuration
- [x] 4. Create migration guide documentation

## Phase 2: Service Layer Modernization
- [x] 5. Modernize PersianDateTimePickerService with signals
- [x] 6. Convert RxJS subjects to signals where appropriate
- [x] 7. Update DestroyService for zoneless operation
- [x] 8. Add signal-based computed properties

## Phase 3: Component Modernization - DatePickerComponent
- [x] 9. Convert component properties to signals (input, state)
- [x] 10. Replace ngOnChanges with signal effects
- [x] 11. Update ControlValueAccessor implementation for signals
- [x] 12. Convert form handling to signal-based reactive forms
- [x] 13. Update event handling with signal-based patterns

## Phase 4: Component Modernization - DatePickerPopupComponent  
14. Convert popup component to signals
15. Update calendar generation with computed signals
16. Modernize overlay positioning logic
17. Update animation triggers for OnPush

## Phase 5: Component Modernization - TimePickerComponent
18. Convert time picker to signals
19. Update time selection logic with signals
20. Modernize scrolling and time display

## Phase 6: Directive and Utility Modernization
21. Update DateMaskDirective for signals
22. Modernize TemplateDirective
23. Update overlay utilities for zoneless
24. Convert animation utilities

## Phase 7: Date Adapter Modernization
25. Update date adapters for signal integration
26. Optimize date parsing/formatting for signals
27. Update adapter selection logic

## Phase 8: Testing and Validation
28. Update all unit tests for signal-based components
29. Add integration tests for zoneless operation
30. Performance testing and optimization
31. Update E2E tests

## Phase 9: Documentation and Release
32. Update API documentation
33. Create migration guide for existing users
34. Update examples and demos
35. Prepare release notes

## Validation Tasks
36. Run full test suite with zoneless configuration
37. Verify bundle size reduction
38. Test with various Angular v20+ versions
39. Validate backward compatibility of public API
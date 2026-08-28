# Dependency Updates Specification

## MODIFIED Requirements

### Requirement: Angular Version Support
The library SHALL require Angular v20+ as the minimum version to ensure access to modern Angular features.

#### Scenario:
When developers install the library, it should require Angular v20+ as the minimum version to ensure access to modern Angular features.

**Acceptance Criteria:**
- Update peerDependencies to require Angular v20.0.0+
- Remove support for Angular v14-19
- Update all Angular-related imports to use v20+ APIs
- Ensure compatibility with Angular v20+ features

### Requirement: Zone.js Configuration
The library SHALL support both zoneless and zone-based applications with optimal configuration for each.

#### Scenario:
When the library is used, it should support both zoneless and zone-based applications with optimal configuration for each.

**Acceptance Criteria:**
- Make zone.js an optional dependency
- Provide zoneless bootstrap configuration
- Maintain backward compatibility with existing zone.js setups
- Update build configuration for zoneless operation

### Requirement: Bundle Size Optimization
The library SHALL achieve smaller bundle sizes through zoneless operation and modern Angular patterns.

#### Scenario:
When the library is bundled, it should achieve smaller bundle sizes through zoneless operation and modern Angular patterns.

**Acceptance Criteria:**
- Remove unnecessary zone.js polyfills
- Optimize imports for tree-shaking
- Use modern Angular APIs that are more efficient
- Measure and document bundle size improvements

## ADDED Requirements

### Requirement: Signal API Dependencies
The library SHALL properly import and use Angular's signal APIs for signal-based features.

#### Scenario:
When using signal-based features, the library should properly import and use Angular's signal APIs.

**Acceptance Criteria:**
- Import signal functions from @angular/core
- Use proper signal typing and generics
- Ensure signal features are available in Angular v20+
- Provide fallbacks for any missing signal features

### Requirement: Modern Build Configuration
The library SHALL use modern build tools and configurations optimized for Angular v20+.

#### Scenario:
When the library is built, it should use modern build tools and configurations optimized for Angular v20+.

**Acceptance Criteria:**
- Update TypeScript configuration for modern features
- Configure build tools for optimal tree-shaking
- Ensure proper library packaging for v20+ compatibility
- Update development and production build configurations
# Layout Constants - Migration Guide

## Overview

The `layout.ts` constants file provides reusable responsive layout configurations to eliminate code duplication across the application.

## Problem

Before this refactoring, responsive configurations were duplicated across multiple files:

```tsx
// ❌ Before: Duplicated in 7+ files
<Col xs={1} sm={1} md={2} lg={3} xl={4} xxl={4}>
<Col xs={1} sm={1} md={2} lg={3} xl={4} xxl={4}>
<Col xs={1} sm={1} md={2} lg={3} xl={4} xxl={4}>
```

## Solution

Use the centralized constants:

```tsx
// ✅ After: Single source of truth
import { GRID_COLUMNS_RESPONSIVE, GRID_GUTTER } from '@/constants/layout';

<Row gutter={GRID_GUTTER}>
  <Col {...GRID_COLUMNS_RESPONSIVE}>
    <Card>Content</Card>
  </Col>
</Row>
```

## Available Constants

### Grid Columns

- `GRID_COLUMNS_RESPONSIVE` - Standard grid (1→2→3→4 columns)
- `GRID_COLUMNS_COMPACT` - Compact grid (1→2→3→4→5 columns)
- `GRID_COLUMNS_WIDE` - Wide grid (1→1→1→2→2→3 columns)
- `STATS_CARD_RESPONSIVE` - Statistics cards (1→1→2→2→3→4)
- `FORM_RESPONSIVE` - Form layouts (1→1→1→2→2→2)
- `DETAIL_PAGE_RESPONSIVE` - Detail pages (1→1→1→2→2→3)
- `FULL_WIDTH_RESPONSIVE` - Full width (always 1 column)

### Grid Gutters

- `GRID_GUTTER` - Standard spacing (16px)
- `GRID_GUTTER_LARGE` - Large spacing (24px)
- `GRID_GUTTER_SMALL` - Small spacing (8px)

## Usage Examples

### Standard Grid Layout

```tsx
import { Row, Col } from 'antd';
import { GRID_COLUMNS_RESPONSIVE, GRID_GUTTER } from '@/constants/layout';

function MyComponent() {
  return (
    <Row gutter={GRID_GUTTER}>
      {items.map(item => (
        <Col key={item.id} {...GRID_COLUMNS_RESPONSIVE}>
          <Card>{item.name}</Card>
        </Col>
      ))}
    </Row>
  );
}
```

### Statistics Cards

```tsx
import { STATS_CARD_RESPONSIVE } from '@/constants/layout';

<Row gutter={[16, 16]}>
  <Col {...STATS_CARD_RESPONSIVE}>
    <StatCard title="Total" value={100} />
  </Col>
  <Col {...STATS_CARD_RESPONSIVE}>
    <StatCard title="Active" value={50} />
  </Col>
</Row>
```

### Dynamic Column Selection

```tsx
import { getResponsiveColumns } from '@/constants/layout';

function DynamicGrid({ density }: { density: 'standard' | 'compact' }) {
  const columns = getResponsiveColumns(density);

  return (
    <Row gutter={GRID_GUTTER}>
      <Col {...columns}>
        <Card>Content</Card>
      </Col>
    </Row>
  );
}
```

### Dynamic Gutter Selection

```tsx
import { getGutter } from '@/constants/layout';

function SpaciousGrid() {
  return (
    <Row gutter={getGutter('large')}>
      <Col {...GRID_COLUMNS_RESPONSIVE}>
        <Card>Content</Card>
      </Col>
    </Row>
  );
}
```

## Migration Steps

To migrate existing code:

1. **Import the constants**:
   ```tsx
   import { GRID_COLUMNS_RESPONSIVE, GRID_GUTTER } from '@/constants/layout';
   ```

2. **Replace responsive props**:
   ```tsx
   // Before
   <Col xs={1} sm={1} md={2} lg={3} xl={4} xxl={4}>

   // After
   <Col {...GRID_COLUMNS_RESPONSIVE}>
   ```

3. **Replace gutter props**:
   ```tsx
   // Before
   <Row gutter={[16, 16]}>

   // After
   <Row gutter={GRID_GUTTER}>
   ```

## Files to Migrate

Based on code analysis, these files contain duplicated responsive configurations:

1. `frontend/src/app/forecasts/page.tsx` (5 occurrences)
2. `frontend/src/app/timeseries/page.tsx` (3 occurrences)
3. `frontend/src/app/alerts/rules/page.tsx` (3 occurrences)
4. `frontend/src/app/anomalies/page.tsx` (2 occurrences)
5. `frontend/src/app/ai/models/page.tsx` (1 occurrence)
6. `frontend/src/app/apikeys/page.tsx` (2 occurrences)
7. `frontend/src/app/alerts/page.tsx` (2 occurrences)

## Benefits

- ✅ **Single source of truth** - Change responsive behavior in one place
- ✅ **Consistent UX** - All grids behave the same way
- ✅ **Less code** - Eliminate ~50+ lines of duplicated configuration
- ✅ **Type safety** - Full TypeScript support
- ✅ **Maintainability** - Easier to update responsive behavior

## Customization

If you need a custom responsive pattern:

1. Add it to `layout.ts`:
   ```tsx
   export const CUSTOM_PATTERN: Partial<Record<Breakpoint, number>> = {
     xs: 1,
     sm: 2,
     md: 3,
     lg: 4,
     xl: 6,
     xxl: 6,
   };
   ```

2. Use it in your components:
   ```tsx
   import { CUSTOM_PATTERN } from '@/constants/layout';
   <Col {...CUSTOM_PATTERN}>
   ```

## Contributing

When adding new responsive patterns:

1. Follow the naming convention: `PATTERN_TYPE_RESPONSIVE`
2. Add JSDoc comments explaining the use case
3. Update this README with examples
4. Consider if the pattern is reusable before adding

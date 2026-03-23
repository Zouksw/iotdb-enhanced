# IoTDB Enhanced - Component Documentation

**Version**: 1.0.0
**Last Updated**: 2026-03-23
**Status**: Active

---

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Component Library](#component-library)
4. [Usage Patterns](#usage-patterns)
5. [Theming](#theming)
6. [Best Practices](#best-practices)

---

## Overview

This document provides a comprehensive guide to the UI components in IoTDB Enhanced. All components follow the professional design system outlined in [DESIGN.md](./DESIGN.md).

### Key Principles

- **Minimal over maximal**: Clean, functional design without unnecessary decoration
- **Consistency**: All components use shared design tokens
- **Accessibility**: WCAG AA compliant with proper contrast and touch targets
- **Professional appearance**: Enterprise-grade aesthetics

---

## Design System

### Design Tokens

All design tokens are centralized in `/frontend/src/lib/tokens.ts`:

```typescript
import tokens from '@/lib/tokens';

// Usage examples
const primaryColor = tokens.colors.primary;
const spacingMD = tokens.spacing.marginMD;
const borderRadius = tokens.borderRadius.MD;
```

### Token Categories

| Category | Location | Description |
|----------|----------|-------------|
| Colors | `tokens.colors` | Primary, semantic, neutral, accent colors |
| Typography | `tokens.typography` | Font sizes, weights, line heights |
| Spacing | `tokens.spacing` | 4px-based spacing scale |
| Border Radius | `tokens.borderRadius` | 2-8px scale for corners |
| Shadows | `tokens.shadows` | Subtle depth effects |

### Chart Configuration

For data visualization components, use the unified chart config:

```typescript
import {
  chartColors,
  chartTooltipStyles,
  lineChartStyles,
  chartAnimations,
} from '@/lib/chart-config';
```

---

## Component Library

### Authentication Components

Location: `/frontend/src/components/auth-page/`

#### LoginForm

Professional login form with inline validation.

```tsx
import { LoginForm } from '@/components/auth-page';

<LoginForm />
```

**Features:**
- Email validation with RFC 5322 compliance
- Password field with forgot password link
- "Remember me" checkbox
- Inline validation feedback
- Loading states during submission

**Styling:**
- Border radius: 3px
- Input height: 48px
- Button height: 50px
- Primary color: #0066CC

#### RegisterForm

Registration form with password strength indicator.

```tsx
import { RegisterForm } from '@/components/auth-page';

<RegisterForm />
```

**Features:**
- Real-time password strength indicator
- Visual feedback (Weak/Medium/Strong)
- Confirmation password validation
- Help text for all fields

**Password Strength:**
- Weak: < 40 points (red)
- Medium: 40-70 points (orange)
- Strong: > 70 points (green)

---

### Chart Components

Location: `/frontend/src/components/charts/`

All charts use the unified chart configuration for consistent styling.

#### RealTimeChart

Real-time data visualization with automatic updates.

```tsx
import { RealTimeChart } from '@/components/charts/RealTimeChart';

<RealTimeChart
  timeseries="root.sg.device1.temperature"
  autoScroll={true}
  maxPoints={100}
  refreshInterval={2000}
  showStatistics={true}
  height={400}
/>
```

**Features:**
- Live data updates
- Statistics cards (Current, Min, Max, Mean)
- Play/Pause/Stop controls
- Reference lines for mean and standard deviation

**Styling:**
- Border radius: 4px
- Solid color statistics cards (no gradients)
- Professional tooltips with backdrop blur
- Colorblind-friendly palette

#### PredictionChart

Time series prediction with confidence intervals.

```tsx
import { PredictionChart } from '@/components/charts/PredictionChart';

<PredictionChart
  timeseries="root.sg.device1.temperature"
  historicalData={historicalData}
  predictionData={predictionData}
  algorithm="arima"
  height={450}
/>
```

**Features:**
- Historical and prediction data display
- 95% confidence interval area
- Export to PNG and CSV
- Expandable view

#### AnomalyChart

Anomaly detection visualization with severity indicators.

```tsx
import { AnomalyChart } from '@/components/charts/AnomalyChart';

<AnomalyChart
  timeseries="root.sg.device1.temperature"
  anomalies={anomalies}
  historicalData={historicalData}
  method="statistical"
  height={450}
/>
```

**Features:**
- Scatter plot for anomalies
- Color-coded severity levels
- Statistics summary
- Export capabilities

**Severity Colors:**
- LOW: #10B981 (green)
- MEDIUM: #F59E0B (orange)
- HIGH: #EF4444 (red)
- CRITICAL: #8B5CF6 (purple)

---

### UI Components

#### GlassCard

Modern card component with glassmorphism effect.

```tsx
import { GlassCard } from '@/components/ui/GlassCard';

<GlassCard intensity="medium" gradientBorder={false}>
  <p>Your content here</p>
</GlassCard>
```

**Props:**
- `intensity`: "light" | "medium" | "heavy"
- `gradientBorder`: boolean (default: false)
- `gradient`: "purple" | "blue" | "sunset" | "success"

**Note:** Consider using standard Ant Design Card with `variant="borderless"` for most cases. GlassCard is best for hero sections or special emphasis areas.

---

## Usage Patterns

### Form Validation

Use the centralized validation rules from `/frontend/src/lib/validation.ts`:

```tsx
import { validationRules, required } from '@/lib/validation';

<Form.Item
  name="email"
  rules={[
    validationRules.getAntRule(required("Email")),
    validationRules.getAntRule(validationRules.email),
  ]}
  extra="Enter your email address"
>
  <Input placeholder="your.email@example.com" />
</Form.Item>
```

### Available Validation Rules

| Rule | Description |
|------|-------------|
| `email` | RFC 5322 email validation |
| `passwordStrength` | 8+ chars, uppercase, lowercase, number |
| `passwordStrong` | 12+ chars with special character |
| `datasetName` | Alphanumeric, hyphens, underscores |
| `timeseriesPath` | Must start with "root." |
| `url` | Valid URL format |
| `port` | 1-65535 range |
| `phoneNumber` | E.164 international format |

### Color Usage

#### Semantic Colors

```tsx
// Success states
color: tokens.colors.success

// Warning states
color: tokens.colors.warning

// Error states
color: tokens.colors.error

// Info states
color: tokens.colors.info
```

#### Chart Colors

```tsx
import { chartColors } from '@/lib/chart-config';

// Primary data
stroke: chartColors.primary

// Secondary data
stroke: chartColors.purple

// Anomalies
fill: chartColors.error
```

### Spacing

Use the 4px-based spacing scale:

```tsx
import { spacing } from '@/lib/tokens';

// Small gap
gap: spacing.gapSM  // 12px

// Default gap
gap: spacing.gapMD  // 16px

// Large gap
gap: spacing.gapLG  // 24px
```

### Border Radius

Professional border radius values:

```tsx
import { borderRadius } from '@/lib/tokens';

// Small elements (tags, badges)
borderRadius: borderRadius.XS  // 2px

// Inputs, buttons
borderRadius: borderRadius.SM  // 3px

// Cards, panels
borderRadius: borderRadius.MD  // 4px

// Large cards, modals
borderRadius: borderRadius.LG  // 6px

// Hero sections
borderRadius: borderRadius.XL  // 8px
```

### Shadows

Subtle depth for professional appearance:

```tsx
import { shadows } from '@/lib/tokens';

// Cards, inputs
boxShadow: shadows.SM

// Dropdowns, popovers
boxShadow: shadows.MD

// Modals, panels
boxShadow: shadows.LG

// Hero elements
boxShadow: shadows.XL
```

---

## Theming

### Light Mode (Default)

```tsx
const lightColors = {
  primary: "#0066CC",
  bgContainer: "#FFFFFF",
  bgLayout: "#F9FAFB",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};
```

### Dark Mode

```tsx
const darkColors = {
  primary: "#3B82F6",
  bgContainer: "#1F2937",
  bgLayout: "#111827",
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  border: "#374151",
};
```

### Theme Customization

Customize Ant Design theme via global CSS:

```css
/* globals.css */
.ant-btn-primary {
  background: #0066CC !important;
  box-shadow: 0 1px 3px rgba(0, 102, 204, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.ant-btn-primary:hover {
  background: #0055A3 !important;
  transform: translateY(-1px);
}
```

---

## Best Practices

### DO

✅ Use design tokens instead of hardcoded values
✅ Follow the border radius scale (2-8px)
✅ Use subtle shadows for depth
✅ Provide help text for form fields
✅ Include inline validation feedback
✅ Use semantic colors consistently
✅ Ensure WCAG AA contrast ratios
✅ Test with colorblind simulators

### DON'T

❌ Use gradient backgrounds (use solid colors)
❌ Use large border radius (>8px)
❌ Use heavy shadows
❌ Mix warm and cool neutrals
❌ Skip validation feedback
❌ Use generic "Submit" button labels
❌ Forget accessibility attributes

### Component Composition

When composing complex layouts:

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: tokens.spacing.gapLG,
  padding: tokens.spacing.paddingLG,
}}>
  {items.map(item => (
    <Card
      key={item.id}
      variant="borderless"
      style={{ borderRadius: tokens.borderRadius.MD }}
    >
      {item.content}
    </Card>
  ))}
</div>
```

### Error Handling

Always provide specific, actionable error messages:

```tsx
// Bad
message.error('Invalid input');

// Good
message.error('Email must be a valid format (e.g., user@example.com)');
```

---

## Migration Guide

### From Old Gradient Styles

**Before:**
```tsx
style={{
  background: 'linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)',
  borderRadius: 12,
}}
```

**After:**
```tsx
import { tokens } from '@/lib/tokens';

style={{
  background: tokens.colors.primary,
  borderRadius: tokens.borderRadius.SM,
}}
```

### From Hardcoded Spacing

**Before:**
```tsx
style={{ padding: '24px', margin: '16px' }}
```

**After:**
```tsx
import { spacing } from '@/lib/tokens';

style={{
  padding: spacing.paddingLG,
  margin: spacing.marginMD,
}}
```

---

## Component Status

| Component | Status | Notes |
|----------|--------|-------|
| LoginForm | ✅ Active | Updated with new styles |
| RegisterForm | ✅ Active | Password strength indicator added |
| RealTimeChart | ✅ Active | Unified chart config applied |
| PredictionChart | ✅ Active | Unified chart config applied |
| AnomalyChart | ✅ Active | Unified chart config applied |
| GlassCard | ✅ Active | Use sparingly for special cases |

---

## Contributing

When adding new components:

1. Use design tokens from `/lib/tokens.ts`
2. Follow the border radius scale (2-8px)
3. Add inline validation for forms
4. Include help text where appropriate
5. Test with light and dark modes
6. Verify WCAG AA compliance
7. Update this documentation

---

## Resources

- [DESIGN.md](./DESIGN.md) - Complete design system
- [lib/tokens.ts](./src/lib/tokens.ts) - Design tokens
- [lib/chart-config.ts](./src/lib/chart-config.ts) - Chart configuration
- [lib/validation.ts](./src/lib/validation.ts) - Validation rules
- [styles/globals.css](./src/styles/globals.css) - Global styles

---

**Maintainers**: Frontend Team
**Last Reviewed**: 2026-03-23
**Next Review**: 2026-04-23

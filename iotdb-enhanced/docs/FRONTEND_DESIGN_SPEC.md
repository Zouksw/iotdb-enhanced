# IoTDB Enhanced - Frontend Design Specification

**Version**: 1.0.0
**Date**: 2026-03-19
**Status**: Draft
**Owner**: IoTDB Enhanced Team

---

## Executive Summary

This document defines the frontend design improvements for the IoTDB Enhanced platform. The design system foundation exists but needs:
1. **Restoration of deleted detail pages** (forecasts, datasets, anomalies, API keys)
2. **Consistent application** of existing design system across all pages
3. **Responsive design** improvements for mobile/tablet
4. **Visual polish** to eliminate "generic" appearance

**Target Timeline**: 1 week
**Target Audience**: Production users (internal team + external customers)

---

## Current State Analysis

### ✅ Strengths (Keep These)
- **Design System**: Comprehensive theme.ts with light/dark modes, glassmorphism, gradients
- **Component Library**: GlassCard, StatCard, PageHeader, EmptyState, StatusBadge
- **Styling**: Custom scrollbar, table zebra striping, hover effects
- **Framework**: Next.js 14 App Router, Ant Design 5.x, TypeScript
- **Pattern**: Commercial SaaS design with gradients and glass effects

### ⚠️ Issues to Fix
1. **Missing Pages**: Detail pages deleted (forecasts/show/[id], datasets/show/[id], anomalies/show/[id], apikeys/show/[id])
2. **Inconsistent Design**: Some pages don't use the design system consistently
3. **Limited Responsive**: No mobile-specific breakpoints or layouts
4. **Generic Feel**: Needs more visual personality and branding

---

## Design Principles

### 1. Consistency Over Creativity
- Use existing design tokens (colors, spacing, typography) from `lib/theme.ts`
- Apply glassmorphism effects consistently across all cards
- Maintain gradient usage for primary actions and highlights

### 2. Mobile-First Responsive
- Design for mobile (320px) first, then scale up
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Test on real devices

### 3. Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced experience with animations and interactions
- Graceful degradation for older browsers

### 4. Performance First
- Lighthouse score >90 on all pages
- First Contentful Paint <1.5s
- Time to Interactive <3s

---

## Page Architecture

### Navigation Structure

```
Dashboard (Main)
├── AI
│   ├── Predict
│   ├── Anomalies
│   └── Models
├── Timeseries
│   ├── List
│   ├── Create
│   └── [id] (detail page - TO RESTORE)
├── Datasets
│   ├── [id] (detail page - TO RESTORE)
│   └── [id]/edit (edit page - TO RESTORE)
├── Forecasts
│   ├── List
│   ├── Create
│   ├── [id] (detail page - TO RESTORE)
│   └── [id]/edit (edit page - TO RESTORE)
├── Alerts
│   ├── List
│   ├── Rules
│   └── Create
├── Anomalies
│   ├── List
│   └── [id] (detail page - TO RESTORE)
├── API Keys
│   ├── List
│   ├── Create
│   ├── [id] (detail page - TO RESTORE)
│   └── [id]/edit (edit page - TO RESTORE)
└── Settings
    ├── Profile
    ├── Sessions
    └── Notifications
```

---

## Component Specification

### Detail Page Template (New)

All detail pages follow this structure:

```
┌─────────────────────────────────────────────┐
│ PageHeader (Title, Actions, Breadcrumb)    │
├─────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────────────┐ │
│ │ Summary Card  │ │ Details/Tabs           │ │
│ │ (GlassCard)   │ │                       │ │
│ │               │ │ - Overview            │ │
│ │ Key metrics   │ │ - Data/History        │ │
│ │ Status        │ │ - Settings            │ │
│ │ Actions       │ │                       │ │
│ └───────────────┘ └───────────────────────┘ │
│                                             │
│ Related Content Section                     │
└─────────────────────────────────────────────┘
```

**File**: `frontend/src/components/layout/DetailPageLayout.tsx`

### Responsive Breakpoints

```typescript
// breakpoints.ts
export const breakpoints = {
  xs: '320px',   // Mobile portrait
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};

// Usage in components
const isMobile = useMediaQuery({ maxWidth: breakpoints.md });
const isTablet = useMediaQuery({ minWidth: breakpoints.md, maxWidth: breakpoints.lg });
```

---

## Page-by-Page Specifications

### 1. Dashboard (Already Good - Minor Polish)

**Current**: `/dashboard/page.tsx`
**Changes**:
- Improve mobile layout (stack stat cards vertically)
- Add loading skeleton for better perceived performance
- Enhance chart tooltips

**File**: `frontend/src/app/dashboard/page.tsx`

---

### 2. Forecast Detail Page (TO RESTORE)

**Path**: `/forecasts/show/[id]/page.tsx`
**Purpose**: View forecast results, parameters, and historical data

**Components**:
```typescript
<PageContainer>
  <PageHeader
    title={forecast.name}
    subtitle={`Created ${formatDate(forecast.createdAt)}`}
    actions={[
      { icon: <EditOutlined />, label: 'Edit', href: `/forecasts/edit/${forecast.id}` },
      { icon: <DeleteOutlined />, label: 'Delete', danger: true }
    ]}
  />

  <Row gutter={[16, 16]}>
    {/* Summary Card */}
    <Col xs={24} lg={8}>
      <ForecastSummaryCard forecast={forecast} />
    </Col>

    {/* Chart Card */}
    <Col xs={24} lg={16}>
      <ForecastChartCard forecastId={forecast.id} />
    </Col>

    {/* Parameters Card */}
    <Col xs={24}>
      <ForecastParametersCard parameters={forecast.parameters} />
    </Col>

    {/* Historical Runs */}
    <Col xs={24}>
      <ForecastHistoryCard forecastId={forecast.id} />
    </Col>
  </Row>
</PageContainer>
```

**Key Features**:
- Forecast visualization with actual vs predicted values
- Parameter display (algorithm, horizon, accuracy metrics)
- Historical forecast runs comparison
- Export functionality (CSV, JSON)

---

### 3. Dataset Detail Page (TO RESTORE)

**Path**: `/datasets/show/[id]/page.tsx`
**Purpose**: View dataset metadata, associated timeseries, and data statistics

**Components**:
```typescript
<PageContainer>
  <PageHeader
    title={dataset.name}
    description={dataset.description}
    actions={[
      { icon: <EditOutlined />, label: 'Edit', href: `/datasets/edit/${dataset.id}` },
      { icon: <LineChartOutlined />, label: 'Analyze', href: `/timeseries?dataset=${dataset.id}` }
    ]}
  />

  <Row gutter={[16, 16]}>
    <Col xs={24} lg={8}>
      <DatasetSummaryCard dataset={dataset} />
    </Col>
    <Col xs={24} lg={16}>
      <DatasetStatsCard datasetId={dataset.id} />
    </Col>
    <Col xs={24}>
      <DatasetTimeseriesList datasetId={dataset.id} />
    </Col>
  </Row>
</PageContainer>
```

---

### 4. Anomaly Detail Page (TO RESTORE)

**Path**: `/anomalies/show/[id]/page.tsx`
**Purpose**: View anomaly details, context, and related alerts

**Components**:
```typescript
<PageContainer>
  <PageHeader
    title={`Anomaly #${anomaly.id}`}
    badge={anomaly.severity}
    actions={[
      { icon: <CheckOutlined />, label: 'Resolve', onClick: handleResolve },
      { icon: <CloseOutlined />, label: 'Dismiss', onClick: handleDismiss }
    ]}
  />

  <Row gutter={[16, 16]}>
    <Col xs={24} lg={12}>
      <AnomalyDetailsCard anomaly={anomaly} />
    </Col>
    <Col xs={24} lg={12}>
      <AnomalyContextCard anomaly={anomaly} />
    </Col>
    <Col xs={24}>
      <AnomalyChart anomaly={anomaly} />
    </Col>
  </Row>
</PageContainer>
```

---

### 5. API Key Detail Page (TO RESTORE)

**Path**: `/apikeys/show/[id]/page.tsx`
**Purpose**: View API key details, usage statistics, and permissions

**Components**:
```typescript
<PageContainer>
  <PageHeader
    title={apiKey.name}
    subtitle={`Last used ${formatDate(apiKey.lastUsed)}`}
    actions={[
      { icon: <EditOutlined />, label: 'Edit', href: `/apikeys/edit/${apiKey.id}` },
      { icon: <ReloadOutlined />, label: 'Regenerate', onClick: handleRegenerate }
    ]}
  />

  <Row gutter={[16, 16]}>
    <Col xs={24} lg={8}>
      <ApiKeySummaryCard apiKey={apiKey} />
    </Col>
    <Col xs={24} lg={16}>
      <ApiKeyUsageCard apiKeyId={apiKey.id} />
    </Col>
    <Col xs={24}>
      <ApiKeyPermissionsCard permissions={apiKey.permissions} />
    </Col>
  </Row>
</PageContainer>
```

---

## Responsive Design Strategy

### Mobile Layout (xs < 640px)

```css
/* Stack columns vertically */
.ant-row {
  flex-direction: column;
}

.ant-col {
  width: 100% !important;
}

/* Hide non-critical elements */
.desktop-only {
  display: none;
}

/* Adjust font sizes */
h1 { font-size: 24px; }
h2 { font-size: 20px; }
h3 { font-size: 18px; }

/* Larger touch targets */
button, a {
  min-height: 44px;
  min-width: 44px;
}
```

### Tablet Layout (md 768px - 1024px)

```css
/* 2-column grid for cards */
.ant-col-lg-8 {
  width: 100%;
}

.ant-col-lg-12 {
  width: 50%;
}

/* Compact tables */
.ant-table {
  font-size: 12px;
}
```

### Desktop Layout (lg > 1024px)

```css
/* Full layout with sidebar */
.ant-layout-sider {
  display: block;
}

/* Restore hover effects */
.ant-card:hover {
  transform: translateY(-2px);
}
```

---

## Implementation Plan

### Week 1: Foundation + Critical Pages

**Day 1-2: Design System & Components**
- [ ] Create `DetailPageLayout.tsx` component
- [ ] Create responsive hooks (`useBreakpoint`, `useMediaQuery`)
- [ ] Create loading skeletons for all pages
- [ ] Update `GlassCard` for better mobile support

**Day 3-4: Restore Missing Pages**
- [ ] `/forecasts/show/[id]/page.tsx`
- [ ] `/datasets/show/[id]/page.tsx`
- [ ] `/anomalies/show/[id]/page.tsx`
- [ ] `/apikeys/show/[id]/page.tsx`

**Day 5: Dashboard Polish**
- [ ] Mobile responsive dashboard
- [ ] Loading skeletons
- [ ] Error boundaries

**Day 6-7: Testing & Deployment**
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Deploy to staging

---

## Success Metrics

### Performance
- [ ] Lighthouse Performance score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Cumulative Layout Shift <0.1

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works on all pages
- [ ] Screen reader compatible
- [ ] Color contrast ratio >4.5:1

### User Experience
- [ ] All pages work on mobile (320px+)
- [ ] No broken links or 404s
- [ ] Loading states for all async operations
- [ ] Error messages are helpful and actionable

---

## File Structure

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── DetailPageLayout.tsx      (NEW)
│   │   ├── PageContainer.tsx
│   │   └── ContentCard.tsx
│   ├── responsive/
│   │   ├── MobileNav.tsx             (NEW)
│   │   ├── useBreakpoint.ts          (NEW)
│   │   └── useMediaQuery.ts          (NEW)
│   └── loading/
│       ├── PageSkeleton.tsx          (NEW)
│       ├── TableSkeleton.tsx         (NEW)
│       └── ChartSkeleton.tsx         (NEW)
├── lib/
│   ├── breakpoints.ts                (NEW)
│   └── responsive-utils.ts           (NEW)
├── app/
│   ├── forecasts/
│   │   └── show/
│   │       └── [id]/
│   │           └── page.tsx         (RESTORE)
│   ├── datasets/
│   │   └── show/
│   │       └── [id]/
│   │           └── page.tsx         (RESTORE)
│   ├── anomalies/
│   │   └── show/
│   │       └── [id]/
│   │           └── page.tsx         (RESTORE)
│   └── apikeys/
│       └── show/
│           └── [id]/
│               └── page.tsx         (RESTORE)
```

---

## Design Tokens Reference

### Colors
- Primary: `#0066cc` (Indigo 500)
- Success: `#22c55e` (Green 500)
- Warning: `#f59e0b` (Amber 500)
- Error: `#ef4444` (Red 500)
- Info: `#3b82f6` (Blue 500)

### Typography
- Heading 1: 36px
- Heading 2: 30px
- Heading 3: 24px
- Heading 4: 20px
- Body: 14px
- Small: 12px

### Spacing
- XS: 8px
- SM: 12px
- MD: 16px
- LG: 24px
- XL: 32px
- XXL: 48px

### Border Radius
- XS: 4px
- SM: 6px
- MD: 8px
- LG: 12px
- XL: 16px

---

## Next Steps

1. **Review this specification** with team
2. **Approve implementation plan**
3. **Create GitHub issues** for each page
4. **Start with Day 1-2** (Design System & Components)
5. **Daily standups** to track progress

---

**Appendix**: [Figma Mockups](https://figma.com/placeholder) | [Component Storybook](http://localhost:6006) | [Design Tokens](../lib/tokens.ts)

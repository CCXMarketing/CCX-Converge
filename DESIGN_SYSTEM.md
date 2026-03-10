# Converge Design System

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Lime Green (Primary) | `#ADC837` | Primary actions, active states, health indicators |
| Deep Teal (Secondary) | `#02475A` | Headers, secondary actions, emphasis |
| Charcoal Gray | `#404041` | Sidebar background, dark UI elements |
| White | `#FFFFFF` | Page backgrounds, card surfaces |

### Extended Palette

| Name | Hex | Usage |
|------|-----|-------|
| Light Gray | `#F3F4F6` | Table hover, subtle backgrounds |
| Medium Gray | `#9CA3AF` | Placeholder text, disabled states |
| Dark Gray | `#6B7280` | Secondary text, captions |
| Border Gray | `#E5E7EB` | Dividers, card borders |

---

## Semantic Colors

| State | Hex | Usage |
|-------|-----|-------|
| Success | `#10B981` | Confirmations, positive indicators |
| Warning | `#F59E0B` | Caution states, pending items |
| Danger | `#EF4444` | Errors, destructive actions, critical alerts |
| Info | `#3B82F6` | Informational messages, links |

### Semantic Background Tints

Use these lighter variants for background fills on alerts, badges, and status indicators:

| State | Background | Text |
|-------|-----------|------|
| Success | `#ECFDF5` | `#065F46` |
| Warning | `#FFFBEB` | `#92400E` |
| Danger | `#FEF2F2` | `#991B1B` |
| Info | `#EFF6FF` | `#1E40AF` |

---

## Sidebar

| Property | Value |
|----------|-------|
| Background | `#404041` |
| Width | `256px` (expanded), `64px` (collapsed) |
| Text Color | `#FFFFFF` |
| Active Item Background | `#ADC837` |
| Active Item Text | `#FFFFFF` |
| Hover Background | `rgba(173, 200, 55, 0.1)` |
| Icon Size | `20px` |
| Item Padding | `12px 16px` |
| Section Divider | `rgba(255, 255, 255, 0.1)` |
| Transition | `width 200ms ease` |

### Sidebar Item States

- **Default**: White text on charcoal background
- **Hover**: Lime green tint background (`rgba(173, 200, 55, 0.1)`)
- **Active**: Lime green background (`#ADC837`) with white text
- **Disabled**: `rgba(255, 255, 255, 0.4)` text, no pointer events

---

## Typography

**Font Family**: `'Nunito Sans', sans-serif`

| Level | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| H1 | `32px` | 700 (Bold) | 1.25 | `-0.02em` |
| H2 | `24px` | 700 (Bold) | 1.33 | `-0.01em` |
| H3 | `20px` | 600 (Semi-Bold) | 1.4 | `0` |
| H4 | `18px` | 600 (Semi-Bold) | 1.44 | `0` |
| Body | `16px` | 400 (Regular) | 1.5 | `0` |
| Body Bold | `16px` | 600 (Semi-Bold) | 1.5 | `0` |
| Small | `14px` | 400 (Regular) | 1.43 | `0` |
| Caption | `12px` | 400 (Regular) | 1.33 | `0.01em` |

### Text Colors

| Usage | Color |
|-------|-------|
| Primary Text | `#111827` |
| Secondary Text | `#6B7280` |
| Disabled Text | `#9CA3AF` |
| Link Text | `#02475A` |
| Link Hover | `#ADC837` |
| Inverse Text (on dark bg) | `#FFFFFF` |

---

## Spacing Scale

Based on a 4px grid system:

| Token | Value |
|-------|-------|
| `space-1` | `4px` |
| `space-2` | `8px` |
| `space-3` | `12px` |
| `space-4` | `16px` |
| `space-5` | `20px` |
| `space-6` | `24px` |
| `space-8` | `32px` |
| `space-10` | `40px` |
| `space-12` | `48px` |
| `space-16` | `64px` |

---

## Border Radius

| Usage | Value |
|-------|-------|
| Small (badges, chips) | `6px` |
| Medium (buttons, inputs) | `8px` |
| Large (cards, modals) | `12px` |
| XL (panels) | `16px` |
| Full (avatars, pills) | `9999px` |

---

## Shadows

| Level | Value | Usage |
|-------|-------|-------|
| SM | `0 1px 2px rgba(0, 0, 0, 0.05)` | Subtle elevation (cards at rest) |
| MD | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` | Cards, dropdowns |
| LG | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | Modals, popovers |
| XL | `0 20px 25px -5px rgba(0, 0, 0, 0.1)` | Dialogs |

---

## Components

### Cards

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border Radius | `12px` |
| Shadow | `0 1px 2px rgba(0, 0, 0, 0.05)` |
| Shadow (hover) | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` |
| Padding | `24px` |
| Border | `1px solid #E5E7EB` |
| Transition | `box-shadow 150ms ease` |

#### Card Variants

- **Default**: White background with subtle shadow
- **Outlined**: White background with `1px solid #E5E7EB` border, no shadow
- **Elevated**: White background with MD shadow
- **Interactive**: Adds hover shadow transition and `cursor: pointer`

---

### Buttons

#### Primary Button

| Property | Value |
|----------|-------|
| Background | `#ADC837` |
| Text Color | `#FFFFFF` |
| Border Radius | `8px` |
| Font Weight | 600 |
| Padding | `10px 20px` |
| Font Size | `14px` |
| Hover Background | `#9AB52F` |
| Active Background | `#8AA228` |
| Disabled Background | `#D1D5DB` |
| Disabled Text | `#9CA3AF` |
| Transition | `background-color 150ms ease` |

#### Secondary Button

| Property | Value |
|----------|-------|
| Background | `transparent` |
| Text Color | `#02475A` |
| Border | `1px solid #02475A` |
| Border Radius | `8px` |
| Hover Background | `rgba(2, 71, 90, 0.05)` |

#### Danger Button

| Property | Value |
|----------|-------|
| Background | `#EF4444` |
| Text Color | `#FFFFFF` |
| Border Radius | `8px` |
| Hover Background | `#DC2626` |

#### Ghost Button

| Property | Value |
|----------|-------|
| Background | `transparent` |
| Text Color | `#6B7280` |
| Border | none |
| Hover Background | `#F3F4F6` |

#### Button Sizes

| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| Small | `6px 12px` | `12px` | `32px` |
| Medium | `10px 20px` | `14px` | `40px` |
| Large | `12px 24px` | `16px` | `48px` |

---

### Tables

| Property | Value |
|----------|-------|
| Header Background | `#F9FAFB` |
| Header Text Color | `#6B7280` |
| Header Font Size | `12px` |
| Header Font Weight | 600 |
| Header Text Transform | `uppercase` |
| Header Letter Spacing | `0.05em` |
| Row Height | `56px` |
| Row Border | `1px solid #F3F4F6` |
| Row Hover Background | `#F3F4F6` |
| Cell Padding | `16px` |
| Cell Font Size | `14px` |
| Cell Text Color | `#111827` |
| Stripe Background (alt rows) | `#FAFAFA` (optional) |

---

### Badges

| Property | Value |
|----------|-------|
| Border Radius | `6px` |
| Padding | `2px 10px` |
| Font Size | `12px` |
| Font Weight | 600 |
| Text Transform | `capitalize` |

#### Badge Variants

| Variant | Background | Text Color |
|---------|-----------|------------|
| Success | `#ECFDF5` | `#065F46` |
| Warning | `#FFFBEB` | `#92400E` |
| Danger | `#FEF2F2` | `#991B1B` |
| Info | `#EFF6FF` | `#1E40AF` |
| Neutral | `#F3F4F6` | `#374151` |
| Primary | `rgba(173, 200, 55, 0.15)` | `#6B8A1A` |

---

### Health Scores

Health scores use a three-tier color system to indicate status:

| Range | Label | Color | Background |
|-------|-------|-------|------------|
| 70 - 100 | Good | `#10B981` | `#ECFDF5` |
| 40 - 69 | Fair | `#F59E0B` | `#FFFBEB` |
| 0 - 39 | Poor | `#EF4444` | `#FEF2F2` |

#### Health Score Display

- **Circular Indicator**: 48px diameter, 4px stroke, color based on score range
- **Inline Badge**: Uses badge styling with score-appropriate color
- **Progress Bar**: 8px height, rounded ends, color fill based on score

---

### Form Inputs

| Property | Value |
|----------|-------|
| Height | `40px` |
| Border | `1px solid #D1D5DB` |
| Border Radius | `8px` |
| Padding | `8px 12px` |
| Font Size | `14px` |
| Background | `#FFFFFF` |
| Focus Border | `#ADC837` |
| Focus Ring | `0 0 0 3px rgba(173, 200, 55, 0.2)` |
| Error Border | `#EF4444` |
| Error Ring | `0 0 0 3px rgba(239, 68, 68, 0.2)` |
| Disabled Background | `#F9FAFB` |
| Placeholder Color | `#9CA3AF` |

---

### Modals / Dialogs

| Property | Value |
|----------|-------|
| Overlay Background | `rgba(0, 0, 0, 0.5)` |
| Background | `#FFFFFF` |
| Border Radius | `16px` |
| Shadow | `0 20px 25px -5px rgba(0, 0, 0, 0.1)` |
| Padding | `24px` |
| Max Width | `560px` (default), `800px` (wide) |
| Header Font Size | `20px` |
| Header Font Weight | 700 |
| Animation | `fade-in 200ms ease, scale 200ms ease` |

---

### Tooltips

| Property | Value |
|----------|-------|
| Background | `#111827` |
| Text Color | `#FFFFFF` |
| Font Size | `12px` |
| Border Radius | `6px` |
| Padding | `6px 10px` |
| Max Width | `240px` |
| Arrow Size | `6px` |

---

### Tabs

| Property | Value |
|----------|-------|
| Font Size | `14px` |
| Font Weight (inactive) | 400 |
| Font Weight (active) | 600 |
| Text Color (inactive) | `#6B7280` |
| Text Color (active) | `#02475A` |
| Active Indicator | `2px solid #ADC837` (bottom border) |
| Hover Text Color | `#111827` |
| Padding | `12px 16px` |
| Gap | `0` |

---

### Alerts / Notifications

| Property | Value |
|----------|-------|
| Border Radius | `8px` |
| Padding | `16px` |
| Border Left | `4px solid` (semantic color) |
| Font Size | `14px` |
| Icon Size | `20px` |

#### Alert Variants

| Variant | Background | Border Color | Icon Color |
|---------|-----------|-------------|------------|
| Success | `#ECFDF5` | `#10B981` | `#10B981` |
| Warning | `#FFFBEB` | `#F59E0B` | `#F59E0B` |
| Danger | `#FEF2F2` | `#EF4444` | `#EF4444` |
| Info | `#EFF6FF` | `#3B82F6` | `#3B82F6` |

---

### Avatars

| Size | Dimensions | Font Size |
|------|-----------|-----------|
| XS | `24px` | `10px` |
| SM | `32px` | `12px` |
| MD | `40px` | `14px` |
| LG | `48px` | `18px` |
| XL | `64px` | `24px` |

- **Border Radius**: `9999px` (full circle)
- **Fallback Background**: `#02475A`
- **Fallback Text**: `#FFFFFF`
- **Border (on image)**: `2px solid #FFFFFF`

---

### Dropdowns / Select Menus

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border | `1px solid #D1D5DB` |
| Border Radius | `8px` |
| Shadow | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` |
| Max Height | `320px` |
| Item Padding | `10px 12px` |
| Item Hover Background | `#F3F4F6` |
| Item Active Background | `rgba(173, 200, 55, 0.1)` |
| Item Active Text | `#02475A` |
| Divider | `1px solid #E5E7EB` |

---

## Layout

### Page Structure

| Element | Value |
|---------|-------|
| Sidebar Width | `256px` (expanded), `64px` (collapsed) |
| Top Bar Height | `64px` |
| Content Max Width | `1440px` |
| Content Padding | `24px` (desktop), `16px` (mobile) |
| Section Gap | `24px` |

### Breakpoints

| Name | Min Width |
|------|-----------|
| SM | `640px` |
| MD | `768px` |
| LG | `1024px` |
| XL | `1280px` |
| 2XL | `1536px` |

---

## Transitions & Animation

| Property | Duration | Easing |
|----------|----------|--------|
| Color changes | `150ms` | `ease` |
| Background changes | `150ms` | `ease` |
| Shadow changes | `150ms` | `ease` |
| Transform | `200ms` | `ease` |
| Sidebar expand/collapse | `200ms` | `ease` |
| Modal enter | `200ms` | `ease-out` |
| Modal exit | `150ms` | `ease-in` |
| Tooltip show | `100ms` | `ease-out` |

---

## Z-Index Scale

| Layer | Value |
|-------|-------|
| Dropdown | `10` |
| Sticky Header | `20` |
| Sidebar | `30` |
| Modal Overlay | `40` |
| Modal | `50` |
| Tooltip | `60` |
| Toast / Notification | `70` |

---

## Iconography

- **Library**: Lucide React (preferred) or Heroicons
- **Default Size**: `20px`
- **Stroke Width**: `1.5px`
- **Color**: Inherits from parent text color
- **Interactive Icon Padding**: `8px` (for click targets of at least `36px`)

---

## Accessibility

- All interactive elements must have minimum `44px` touch target
- Color contrast must meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
- Focus indicators: `2px solid #ADC837` with `2px offset`
- All images must have `alt` text
- Form inputs must have associated `<label>` elements
- Error messages must be announced via `aria-live="polite"`

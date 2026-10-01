# UI Rules: Fund Management Platform

> [!IMPORTANT]
> These rules guide every UI component. Consult the `apple-design` skill for HIG grounded decisions.

---

## Design Philosophy

1. **Clarity over decoration**: Every element must serve a purpose. Remove anything that does not aid comprehension.
2. **Data density matters**: Fund managers scan dashboards rapidly. Design for information density without feeling cluttered.
3. **Financial trust signals**: The UI must feel premium, precise, and trustworthy. Sloppy UI causes distrust.
4. **Consistency is critical**: Same patterns must look and behave identically across all modules.
5. **Accessibility is a requirement**: WCAG 2.1 AA minimum, with no compromises.

---

## Layout Rules

### Grid & Spacing
- Use Tailwind's spacing scale exclusively (4px base unit)
- Page content max width: `1400px` (`max-w-[1400px]`)
- Content padding: `px-6 py-6` on desktop, `px-4 py-4` on mobile
- Card gaps: `gap-4` (16px) default, `gap-6` (24px) for prominent layouts
- Never use arbitrary pixel values, only Tailwind spacing tokens

### Sidebar
- Fixed width: `w-64` (256px) on desktop
- Collapsible to icon only: `w-16` (64px) on mobile or collapsed view
- Always use the `Sidebar` component, never recreate navigation ad hoc

### Responsive Breakpoints
```
sm:  640px   (Tailwind default)
md:  768px   (Tailwind default)
lg:  1024px  (Tailwind default)
xl:  1280px  (Tailwind default)
2xl: 1536px  (Tailwind default)
```
- Design mobile first (base styles for mobile, then add breakpoint prefixes)
- Tables must be horizontally scrollable on mobile (`overflow-x-auto`)
- Sidebar collapses to bottom nav on mobile

---

## Typography Rules

- **Font stack**: Inter (primary), system-ui (fallback)
- Import via Google Fonts in `app/layout.tsx`
- **Never use default browser fonts** in production UI

| Element | Class | Size |
|---------|-------|------|
| Page title (h1) | `text-2xl font-semibold` | 24px |
| Section title (h2) | `text-xl font-semibold` | 20px |
| Card title (h3) | `text-base font-semibold` | 16px |
| Body text | `text-sm text-muted-foreground` | 14px |
| Caption or label | `text-xs text-muted-foreground` | 12px |
| Numbers (metrics) | `text-3xl font-bold tabular-nums` | 30px |
| Currency values | Use `CurrencyDisplay` component |  |

- Always use `tabular-nums` for financial numbers to prevent layout shift
- Currency should right align in tables

---

## Color Rules

> See `ui-tokens.md` for the full token definitions.

- **Never hardcode hex values** in components, always use semantic Tailwind tokens
- Background hierarchy: `background` to `card` to `muted` (never invent new levels)
- Status colors follow this strict mapping:

| Status | Color Token | Example |
|--------|------------|---------|
| Active or Success | `text-emerald-600` | Fund active, transaction approved |
| Warning or Pending | `text-amber-600` | KYC pending, awaiting approval |
| Error or Rejected | `text-red-600` | Transaction rejected, fund suspended |
| Neutral or Info | `text-blue-600` | Informational, in progress |
| Muted or Archived | `text-muted-foreground` | Closed fund, read only state |

---

## Component Behavior Rules

### Buttons
- Primary action: `<Button>` (filled, brand color)
- Secondary action: `<Button variant="outline">`
- Destructive action: `<Button variant="destructive">`
- Icon only buttons **must** have `aria-label`
- Loading state: disable button plus show spinner inside (`isLoading` prop)
- Never use `<a>` tags for actions, use `<Button>` or `<Link>`

### Forms
- Every form input must have a visible `<Label>`
- Validation errors appear below the field (not as alerts)
- Form submit button must show loading state during submission
- Never clear form data without explicit user confirmation
- Pair with `react-hook-form` and `zod`, with no exceptions

### Tables
- Use `<DataTable>` component (TanStack Table wrapper), never build raw `<table>` from scratch
- Empty state: show `<EmptyState>` component, not blank space
- Loading state: show `<Skeleton>` rows, not a spinner
- All columns with financial values must be right aligned
- Row click should navigate or open a sheet, specify which in the component props

### Dialogs & Sheets
- Use `<Dialog>` for confirmations and small forms (fewer than 4 fields)
- Use `<Sheet>` (side panel) for detailed forms and record editing
- Always include a cancel button in dialogs
- Pressing `Escape` must close the dialog
- Clicking outside the dialog must close it (default shadcn behavior)

### Toasts & Feedback
- Success: green toast with checkmark icon, shown after mutations
- Error: red toast, shown when API calls fail
- Toast duration: `4000ms` (4 seconds)
- Never show raw error messages to users, show human friendly descriptions

---

## Accessibility Rules

1. All interactive elements must be keyboard navigable
2. Focus ring must be visible (never `outline: none` without a custom focus style)
3. Color alone must never convey meaning, always pair with an icon or text
4. Images must have `alt` text, and use an empty alt attribute for decorative images (`alt=""`)
5. Form fields must have associated labels (use `htmlFor` and `id`)
6. Tables must use proper `<thead>`, `<tbody>`, `<th scope="col">` structure
7. Minimum touch target: `44×44px` (Apple HIG requirement)
8. Screen reader text: use `sr-only` class for visually hidden labels

---

## Motion & Animation

- Use CSS transitions only (no JS animation libraries unless necessary)
- Duration: `150ms` for micro interactions, `300ms` for panels and modals
- Easing: `ease-out` for entering, `ease-in` for exiting
- Respect `prefers-reduced-motion` by wrapping all animations:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; }
  }
  ```
- No page level loading spinners, use Suspense and skeleton loading

---

## Dark Mode

- The platform uses system preference by default (via `next-themes`)
- All color tokens must work in both light and dark mode
- Never use hardcoded colors like `bg-white` or `text-black`
- Test every new component in both modes before marking as complete

---

## Financial Data Display Rules

1. **Currency**: Always show currency code (USD, EUR) next to values
2. **Precision**: NAV values use 6 decimal places. AUM uses 2 decimal places. Percentages use 2 decimal places.
3. **Negative values**: Show in red with parentheses, like `(USD 1,234.56)`, not `-USD 1,234.56`
4. **Large numbers**: Use abbreviated display for dashboard KPIs, like `$1.2M` or `$45.6B`
5. **Dates**: Always display timezone. Format: `15 Jan 2026 (UTC+8)`
6. **Percentages**: Always show sign, like `+12.4%` or `-3.2%`

---

*Last updated: 2026-10-01*

# UI Tokens: Fund Management Platform

> [!IMPORTANT]
> All design tokens are defined here. Never hardcode colors, sizes, or shadows in components. Use CSS custom properties (via Tailwind's `--variable` system) and the semantic token names below.

---

## Color Palette

### Brand Colors

The platform uses a dark, finance grade aesthetic, with a deep navy primary and gold or amber accent.

| Token Name | Light Mode | Dark Mode | Hex (Light) |
|-----------|-----------|----------|-------------|
| `--brand-primary` | Navy | Soft Navy | `#0F2142` |
| `--brand-accent` | Gold | Amber-400 | `#C9A227` |
| `--brand-surface` | Off white | Dark-900 | `#F8F9FC` |

### Semantic Color Tokens (CSS Custom Properties)

Configure in `app/globals.css` following shadcn/ui convention:

```css
:root {
  /* Background */
  --background: 0 0% 100%;             /* white */
  --foreground: 222.2 84% 4.9%;        /* near black */

  /* Card / Surface */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  /* Popover */
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  /* Primary (Brand Navy) */
  --primary: 222 70% 17%;              /* #0F2142 */
  --primary-foreground: 210 40% 98%;

  /* Secondary */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  /* Muted */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  /* Accent (Brand Gold) */
  --accent: 43 67% 48%;                /* #C9A227 */
  --accent-foreground: 222.2 47.4% 11.2%;

  /* Destructive */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  /* Border / Input / Ring */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222 70% 17%;

  /* Border radius */
  --radius: 0.5rem;

  /* Sidebar */
  --sidebar-background: 222 70% 10%;   /* Deep navy */
  --sidebar-foreground: 210 40% 90%;
  --sidebar-primary: 43 67% 48%;       /* Gold accent */
  --sidebar-accent: 222 70% 15%;
  --sidebar-border: 222 70% 15%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 43 67% 55%;               /* Gold shifts to primary in dark mode */
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 43 67% 55%;

  --sidebar-background: 222 70% 5%;
  --sidebar-foreground: 210 40% 90%;
  --sidebar-primary: 43 67% 60%;
  --sidebar-accent: 222 70% 10%;
  --sidebar-border: 222 70% 10%;
}
```

---

## Status Colors (Tailwind Classes)

Always use these exact Tailwind classes for status indicators:

```
Active / Success:   bg-emerald-100  text-emerald-700  dark:bg-emerald-900/30  dark:text-emerald-400
Warning / Pending:  bg-amber-100    text-amber-700    dark:bg-amber-900/30    dark:text-amber-400
Error / Rejected:   bg-red-100      text-red-700      dark:bg-red-900/30      dark:text-red-400
Info / Processing:  bg-blue-100     text-blue-700     dark:bg-blue-900/30     dark:text-blue-400
Neutral / Closed:   bg-gray-100     text-gray-600     dark:bg-gray-800        dark:text-gray-400
```

---

## Typography Scale

```
Font family (primary):  Inter, system-ui, sans-serif
Font family (mono):     JetBrains Mono, Consolas, monospace

/* Scale */
text-xs:   12px / 1.5rem line-height
text-sm:   14px / 1.5rem line-height
text-base: 16px / 1.5rem line-height
text-lg:   18px / 1.75rem line-height
text-xl:   20px / 1.75rem line-height
text-2xl:  24px / 2rem line-height
text-3xl:  30px / 2.25rem line-height
text-4xl:  36px / 2.5rem line-height

/* Weights */
font-normal:    400
font-medium:    500
font-semibold:  600
font-bold:      700
```

---

## Spacing Scale (Tailwind)

```
Spacing token to px value:
1   = 4px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
20  = 80px
24  = 96px
```

### Standard Spacing Usage

| Context | Token | Value |
|---------|-------|-------|
| Card padding | `p-6` | 24px |
| Section gap | `gap-6` | 24px |
| Input height | `h-10` | 40px |
| Icon size (sm) | `h-4 w-4` | 16px |
| Icon size (md) | `h-5 w-5` | 20px |
| Icon size (lg) | `h-6 w-6` | 24px |
| Sidebar width | `w-64` | 256px |
| Topbar height | `h-16` | 64px |
| Page max width | `max-w-[1400px]` | 1400px |

---

## Border Radius

```
--radius: 0.5rem (8px)

Tailwind classes:
rounded-sm:   calc(var(--radius) - 4px)  (4px)
rounded-md:   calc(var(--radius) - 2px)  (6px)
rounded-lg:   var(--radius)              (8px)
rounded-xl:   calc(var(--radius) + 4px)  (12px)
rounded-full: 9999px (for badges, avatars)
```

---

## Shadow Scale

```css
/* Card shadow */
.shadow-card {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

/* Elevated modal shadow */
.shadow-elevated {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

---

## Z-Index Scale

| Layer | Token | Value |
|-------|-------|-------|
| Base content | default | 0 |
| Sticky table header | `z-10` | 10 |
| Sidebar | `z-20` | 20 |
| Topbar | `z-30` | 30 |
| Dropdown menus | `z-40` | 40 |
| Modal or Dialog | `z-50` | 50 |
| Toast notifications | `z-[100]` | 100 |

---

## Icon System

Use **Lucide React** exclusively. Standard sizes:

```tsx
import { TrendingUp, Users, DollarSign } from 'lucide-react'

// Small (inline with text)
<TrendingUp className="h-4 w-4" />

// Medium (card or section icons)
<Users className="h-5 w-5" />

// Large (empty states, hero icons)
<DollarSign className="h-8 w-8" />
```

---

## Animation Tokens

```css
/* Micro interaction (button, toggle) */
transition-duration: 150ms;
timing-function: cubic-bezier(0.4, 0, 0.2, 1);  /* ease-in-out */

/* Panel or Sheet slide */
transition-duration: 300ms;
timing-function: cubic-bezier(0, 0, 0.2, 1);    /* ease-out */

/* Modal fade */
transition-duration: 200ms;
timing-function: cubic-bezier(0.4, 0, 1, 1);    /* ease-in */
```

---

*Last updated: 2026-10-01*

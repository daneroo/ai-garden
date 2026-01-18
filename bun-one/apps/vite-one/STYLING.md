# Styling Guide: DaisyUI + Tailwind CSS

This document provides a comprehensive styling guide for the `vite-one`
application, covering best practices for DaisyUI v5 with Tailwind CSS v4 in a
React environment.

---

## Table of Contents

- [Overview](#overview)
- [Best Practices](#best-practices)
- [Current Implementation Analysis](#current-implementation-analysis)
- [Theme Configuration](#theme-configuration)
- [Evolution Roadmap](#evolution-roadmap)

---

## Overview

### Tech Stack

- DaisyUI v5: Tailwind CSS plugin providing semantic component classes
- Tailwind CSS v4: Utility-first CSS framework with CSS-based configuration
- React: Component runtime with state-controlled theming

### Key Principles

DaisyUI is a pure CSS plugin—it adds zero JavaScript to your bundle and doesn't
interfere with React's state management. This means:

- Use DaisyUI classes for styling (`btn`, `navbar`, `card`, etc.)
- Use React state for behavior and interactivity
- Use Tailwind utilities for layout, spacing, and custom styling

---

## Best Practices

### Use Semantic Color Classes

Preferred approach:

```jsx
// Semantic colors - adapts to theme
<div className="bg-base-100 text-base-content">
  <button className="btn btn-primary">Action</button>
  <p className="text-base-content/70">Subdued text</p>
</div>
```

Avoid:

```jsx
// Hardcoded colors - does not adapt to theme
<div className="bg-white text-gray-800">
  <button className="bg-blue-500 text-white">Action</button>
</div>
```

### DaisyUI Semantic Color Palette

| Role             | Class                  | Purpose                        |
| ---------------- | ---------------------- | ------------------------------ |
| Base             | `bg-base-100/200/300`  | Background layers              |
| Content          | `text-base-content`    | Primary text on base           |
| Primary          | `btn-primary`          | Primary actions                |
| Secondary        | `btn-secondary`        | Secondary actions              |
| Accent           | `text-accent`          | Highlights                     |
| Neutral          | `bg-neutral`           | Neutral backgrounds            |
| Info/Success/... | `alert-info`           | Status feedback                |
| Opacity modifier | `text-base-content/70` | Reduced emphasis (70% opacity) |

### Component Patterns

#### Navbar

Use DaisyUI's navbar structure with `navbar-start`, `navbar-center`,
`navbar-end`:

```jsx
<div className="navbar bg-base-100 shadow-sm">
  <div className="navbar-start">{/* Brand/Logo */}</div>
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">{/* Navigation items */}</ul>
  </div>
  <div className="navbar-end">{/* Actions (theme toggle, etc.) */}</div>
</div>
```

#### Responsive Mobile Menu

Use a dropdown for mobile, horizontal menu for desktop:

```jsx
<div className="dropdown lg:hidden">
  <div role="button" tabIndex={0} className="btn btn-ghost">
    {/* Hamburger icon */}
  </div>
  <ul className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
    {/* Mobile menu items */}
  </ul>
</div>
```

#### Footer

Use semantic footer classes:

```jsx
<footer className="footer footer-center p-4 bg-base-300 text-base-content">
  <aside>
    <p>Copyright © {year} - Your Company</p>
  </aside>
</footer>
```

### Layout Structure

Recommended page structure:

```jsx
<div className="min-h-screen flex flex-col bg-base-100 text-base-content">
  <Navbar /> {/* Fixed/sticky */}
  <main className="grow container mx-auto px-4 pt-20">
    {/* Page content */}
  </main>
  <Footer />
</div>
```

### Gradient and Visual Effects

When using gradients or decorative elements, combine DaisyUI semantic colors
where possible:

```jsx
// Themed gradients using CSS custom properties
<div className="bg-gradient-to-br from-primary to-secondary">

// Decorative overlays that respect theme
<div className="bg-base-100/30 backdrop-blur-sm border border-base-content/5">
```

For brand-specific gradients (like hero sections), hardcoded colors are
acceptable when they represent brand identity rather than theme-adaptive UI.

---

## Current Implementation Analysis

### What Works Well

| Component         | Status | Notes                                  |
| ----------------- | ------ | -------------------------------------- |
| Layout.tsx        | Good   | Proper navbar/footer structure         |
| ThemeController   | Good   | React state + DaisyUI swap animation   |
| Theme persistence | Good   | localStorage for user preference       |
| Navbar structure  | Good   | Uses navbar-start/center/end correctly |

### Issues to Address

#### Missing Theme Configuration in CSS

Current (`index.css`):

```css
@import "tailwindcss";
@plugin "daisyui";
```

Problem: No themes configured. Only the default DaisyUI theme is available.

Solution: Configure themes with default and dark mode preferences.

#### Pages Use Hardcoded Colors

Current (`Home.tsx`):

```jsx
<div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
  <h1 className="text-white">...</h1>
  <div className="bg-white/90">
    <p className="text-gray-800">...</p>
  </div>
</div>
```

Problem: Colors don't adapt to light/dark theme.

Solution: Use semantic classes or CSS custom properties for adaptive styling.

#### Missing System Theme Support

Current: Only light/dark toggle.

Problem: Does not respect user's OS preference on first visit.

Solution: Add system preference detection with three-way toggle
(system/light/dark), as shown in the Elixir reference.

#### Legacy CSS Styles

Current (`App.css`):

```css
#root { max-width: 1280px; margin: 0 auto; ... }
.logo { height: 6em; ... }
.card { padding: 2em; }
```

Problem: Legacy Vite template styles conflict with DaisyUI patterns.

Solution: Remove or consolidate into DaisyUI patterns.

---

## Theme Configuration

### Basic Setup

Update `index.css` to configure themes:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark;
}

/* Enable Tailwind dark: variant with DaisyUI themes */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

/* External Package Sources */
@source "../../../components";
```

### Adding Additional Themes

Include more built-in themes or create custom ones:

```css
@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark,
    nord,
    dracula;
}
```

### Custom Theme Definition

For brand-specific colors (like the Elixir reference project), define custom
themes:

```css
@plugin "daisyui-theme" {
  name: "brand-light";
  default: true;
  prefersdark: false;
  color-scheme: "light";
  --color-base-100: oklch(98% 0 0);
  --color-base-200: oklch(96% 0.001 286.375);
  --color-base-content: oklch(21% 0.006 285.885);
  --color-primary: oklch(70% 0.213 47.604);
  /* ... additional color tokens */
}
```

### Three-Way Theme Toggle (System/Light/Dark)

The Elixir reference implements a robust theming pattern:

#### Initialize in Head (Avoid FOUC)

Add to `index.html`:

```html
<script>
  (() => {
    const setTheme = (theme) => {
      if (theme === "system") {
        localStorage.removeItem("theme");
        document.documentElement.removeAttribute("data-theme");
      } else {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
      }
    };
    if (!document.documentElement.hasAttribute("data-theme")) {
      setTheme(localStorage.getItem("theme") || "system");
    }
    window.addEventListener(
      "storage",
      (e) => e.key === "theme" && setTheme(e.newValue || "system"),
    );
  })();
</script>
```

#### React Theme Controller

Update component to support three states:

```tsx
type Theme = "system" | "light" | "dark";

const [theme, setTheme] = useState<Theme>(() => {
  return (localStorage.getItem("theme") as Theme) || "system";
});

const applyTheme = (newTheme: Theme) => {
  if (newTheme === "system") {
    localStorage.removeItem("theme");
    document.documentElement.removeAttribute("data-theme");
  } else {
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }
  setTheme(newTheme);
};
```

#### CSS for System Preference Detection

When `data-theme` is not set, DaisyUI with `--prefersdark` will automatically
respect `prefers-color-scheme`:

```css
@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark;
}
```

---

## Evolution Roadmap

### Phase 1: CSS Theme Configuration (Quick Win)

- [ ] Update `index.css` with theme configuration
- [ ] Add `@custom-variant dark` for Tailwind integration
- [ ] Test theme toggle works correctly

### Phase 2: Page Migration

- [ ] Refactor `Home.tsx` to use semantic colors
- [ ] Refactor `About.tsx` to use semantic colors
- [ ] Remove or consolidate `App.css` legacy styles

### Phase 3: Enhanced Theme Toggle

- [ ] Add system preference option (three-way toggle)
- [ ] Add initialization script to `index.html`
- [ ] Update `ThemeController.tsx` with system/light/dark options

### Phase 4: Visual Polish (Optional)

- [ ] Create brand-consistent custom theme colors
- [ ] Add subtle animations matching the Elixir reference
- [ ] Enhance footer with more content/links

---

## Reference: Elixir Project Patterns

The `elixir_one` project demonstrates several excellent patterns:

### Theme Toggle UI

A three-button pill toggle (system/light/dark) with sliding indicator:

```html
<div
  class="card relative flex flex-row items-center border-2 border-base-300 bg-base-300 rounded-full"
>
  <div
    class="absolute w-1/3 h-full rounded-full border-1 border-base-200 bg-base-100 brightness-200 left-0 [[data-theme=light]_&]:left-1/3 [[data-theme=dark]_&]:left-2/3 transition-[left]"
  />
  <button>System</button>
  <button>Light</button>
  <button>Dark</button>
</div>
```

### Navbar with Active States

Conditional styling based on current page:

```jsx
<Link
  to="/about"
  className={[
    "btn btn-sm",
    isActive
      ? "btn-active"
      : "btn-ghost text-base-content/80 hover:text-base-content hover:bg-base-content/5",
  ]
    .filter(Boolean)
    .join(" ")}
>
  About
</Link>
```

### Decorative Background Elements

Subtle animated gradients for visual interest:

```jsx
<div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
  <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
  <div
    className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-500/20 rounded-full blur-[100px] animate-pulse"
    style={{ animationDelay: "2s" }}
  />
</div>
```

---

## Resources

- [DaisyUI Documentation](https://daisyui.com/docs/intro/)
- [DaisyUI Theme Generator](https://daisyui.com/theme-generator/)
- [DaisyUI Components](https://daisyui.com/components/)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind CSS v4 Configuration](https://tailwindcss.com/docs/configuration)

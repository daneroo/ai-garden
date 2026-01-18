# Styling Guide: DaisyUI + Tailwind CSS

This document provides a comprehensive styling guide for the `vite-one`
application, covering best practices for DaisyUI v5 with Tailwind CSS v4 in a
React environment.

---

## Table of Contents

- [Overview](#overview)
- [Layout Modes](#layout-modes)
- [Best Practices](#best-practices)
- [Theme Configuration](#theme-configuration)
- [Resources](#resources)

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

## Layout Modes

The application uses a `Layout` component with a `mode` prop to abstract common
layout patterns. This eliminates cognitive overhead—pages don't need to remember
CSS incantations for navbar offsets or container constraints.

### Available Modes

| Mode        | Horizontal                              | Vertical                           | Use Case                                               |
| ----------- | --------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `contained` | Centered with max-width, `px-4` padding | Below navbar with `pt-20` offset   | Standard content pages                                 |
| `fullBleed` | Edge-to-edge, no constraints            | No navbar offset (page handles it) | Hero pages, landing pages with full-screen backgrounds |

### Router Integration

Layout mode is declared per-route via the `handle` prop. This keeps the layout
configuration co-located with the route definition:

```tsx
// App.tsx
export interface RouteHandle {
  layoutMode?: "contained" | "fullBleed";
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} handle={{ layoutMode: "fullBleed" }} />
      <Route path="/about" element={<About />} />
    </Route>,
  ),
);
```

Layout reads the mode from the matched route's handle using `useMatches()`.
Routes without a `handle.layoutMode` default to `contained`.

### Mode Details

#### `contained` (default)

The standard mode for most pages:

- Horizontal: `container mx-auto px-4` centers content with responsive max-width
- Vertical: `pt-20` offsets content below the fixed navbar
- Pages receive a clean content area—no layout CSS needed

```tsx
// About.tsx - just content, no layout concerns
function About() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1>About</h1>
      {/* Content here */}
    </div>
  );
}
```

#### `fullBleed`

For pages that need edge-to-edge control:

- Horizontal: No constraints—content fills viewport width
- Vertical: No navbar offset—page must add `pt-20` where content starts
- Use for: hero sections, landing pages, full-screen backgrounds/gradients

```tsx
// Home.tsx - handles its own full-screen gradient
function Home() {
  return (
    <div className="min-h-screen pt-20 bg-linear-to-br from-primary/10 to-secondary/10">
      <div className="hero min-h-[70vh]">{/* Hero content */}</div>
    </div>
  );
}
```

### Extending Layout Modes

The current modes cover common cases. To add new patterns (e.g., sidebar),
extend the `LayoutMode` type in `App.tsx` and handle it in `Layout.tsx`.

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

### Gradient and Visual Effects

When using gradients or decorative elements, combine DaisyUI semantic colors
where possible:

```jsx
// Themed gradients using CSS custom properties
<div className="bg-linear-to-br from-primary to-secondary">

// Decorative overlays that respect theme
<div className="bg-base-100/30 backdrop-blur-sm border border-base-content/5">
```

For brand-specific gradients (like hero sections), hardcoded colors are
acceptable when they represent brand identity rather than theme-adaptive UI.

---

## Theme Configuration

### Basic Setup

The current `index.css` configuration:

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

Include more built-in themes:

```css
@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark,
    nord,
    dracula;
}
```

### Three-Way Theme Toggle

The app implements a system/light/dark toggle:

- System: Removes `data-theme` attribute, respects OS preference via
  `--prefersdark`
- Light/Dark: Explicitly sets `data-theme` and persists to `localStorage`

FOUC prevention script in `index.html` applies theme before React hydrates.

---

## Resources

- [DaisyUI Documentation](https://daisyui.com/docs/intro/)
- [DaisyUI Theme Generator](https://daisyui.com/theme-generator/)
- [DaisyUI Components](https://daisyui.com/components/)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind CSS v4 Configuration](https://tailwindcss.com/docs/configuration)

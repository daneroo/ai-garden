# Styling Guide: DaisyUI + Tailwind CSS

This document provides a comprehensive styling guide for the `vite-one`
application, covering best practices for DaisyUI v5 with Tailwind CSS v4 in a
React environment.

---

## Table of Contents

- [Overview](#overview)
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

- **System:** Removes `data-theme` attribute, respects OS preference via
  `--prefersdark`
- **Light/Dark:** Explicitly sets `data-theme` and persists to `localStorage`

FOUC prevention script in `index.html` applies theme before React hydrates.

---

## Resources

- [DaisyUI Documentation](https://daisyui.com/docs/intro/)
- [DaisyUI Theme Generator](https://daisyui.com/theme-generator/)
- [DaisyUI Components](https://daisyui.com/components/)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind CSS v4 Configuration](https://tailwindcss.com/docs/configuration)

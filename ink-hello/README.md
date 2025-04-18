# Hello Ink CLI

A simple CLI application built with Ink and React.

## Prerequisites

- Node.js (v23 or later)
- pnpm (v10.7.1 or later)
- Optional: Deno or Bun

## Installation

```bash
pnpm install
```

## Running the Application

The application can be run with any of the following JavaScript runtimes:

```bash
# Preferred method with Node.js
pnpx tsx hello.tsx
# Alternative method for node
node --import tsx hello.tsx

# Normal invocation for Deno and Bun
deno run -A hello.tsx
bun run hello.tsx
```

## Prompt to properly recreate this project

Create a simple CLI application using Ink and React that can run on Node.js, Deno, and Bun. The application should display "Hello World from Ink!" in a box.

Key points to address:

1. Use pnpm as the package manager
2. Set up the project as an ES module (type: "module" in package.json)
3. For Node.js:
   - Use tsx for TypeScript support
   - PREFERRED: Use `pnpx tsx hello.tsx`
   - Alternative: Use `node --import tsx hello.tsx` (--loader was deprecated in Node.js v20.6.0)
4. For Deno:
   - Use the `-A` flag to allow all permissions
5. For Bun:
   - No special configuration needed, it handles TypeScript natively

The project should have:

- A single TypeScript file (hello.tsx) with the Ink component
- Minimal dependencies (only what's needed)
- No build configuration (run directly with the respective runtime)
- No unnecessary TypeScript configuration
- No complex setup or build steps

Remember:

- Do not add unnecessary dependencies
- Do not create complex build configurations
- Do not add TypeScript configuration files
- Keep it simple and runnable with all three runtimes
- Document both the preferred (pnpx) and alternative Node.js commands

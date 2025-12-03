# Top-Down Code Organization

In a single TypeScript file, code should be organized such that **calling code precedes called code**.

## Example

```ts
// Correct
function main() {
  doAThing()
}

function doAThing() {
  // implementation
}
```

```ts
// Incorrect
function doAThing() {
  // implementation
}

function main() {
  doAThing()
}
```

export function ProgressView({ dirStack }: { dirStack: string[] }) {
  return (
    <box flexDirection="column">
      {dirStack.length === 0 ? (
        <text fg="#666666">&lt;root&gt;</text>
      ) : (
        dirStack.map((relativePath, index) => {
          const label =
            relativePath === "."
              ? "<root>"
              : (relativePath.split("/").at(-1) ?? relativePath);
          const indent = "  ".repeat(index);

          return (
            <text key={`${relativePath}:${index}`} fg="#666666">
              {indent}
              {label}
            </text>
          );
        })
      )}
    </box>
  );
}

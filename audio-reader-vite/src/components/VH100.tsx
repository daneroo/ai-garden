import { ReactNode } from "react";

interface VH100Props {
  children: ReactNode;
}

export function VH100({ children }: VH100Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "calc(var(--vh) * 100)",
        justifyContent: "space-between",
        gap: "1.2rem",
      }}
    >
      {children}
    </div>
  );
}

import type { BoxProps, TextProps } from "@opentui/react";

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      box: BoxProps;
      text: TextProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      box: BoxProps;
      text: TextProps;
    }
  }
}

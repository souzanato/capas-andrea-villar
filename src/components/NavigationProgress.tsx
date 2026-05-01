"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export function NavigationProgress() {
  return (
    <ProgressBar
      height="3px"
      color="hsl(var(--andrea-rose))"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}

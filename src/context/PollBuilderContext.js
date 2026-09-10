"use client";

import { createContext, useContext } from "react";

export const PollBuilderContext = createContext(null);

export function usePollBuilder() {
  const context = useContext(PollBuilderContext);

  if (!context) {
    throw new Error(
      "usePollBuilder must be used inside a PollBuilderProvider",
    );
  }

  return context;
}

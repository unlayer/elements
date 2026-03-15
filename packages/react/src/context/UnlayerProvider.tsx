"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { DEFAULT_CONFIG } from "@unlayer-internal/shared-elements";

/**
 * @internal Flag added to context value when a provider is active.
 * Used by item components to detect provider-without-Body usage.
 */
export const PROVIDER_ACTIVE_KEY = "__unlayerProviderActive";

// Lazy-init: createContext is not available in React Server Component modules.
// Deferring the call ensures it only runs when UnlayerProvider or
// useUnlayerConfig is actually invoked (always in a client context).
let _UnlayerContext: React.Context<UnlayerConfig> | null = null;
function getUnlayerContext(): React.Context<UnlayerConfig> {
  if (!_UnlayerContext) {
    _UnlayerContext = createContext<UnlayerConfig>(DEFAULT_CONFIG);
  }
  return _UnlayerContext;
}

export interface UnlayerProviderProps {
  config: Partial<UnlayerConfig>;
  children: React.ReactNode;
}

export const UnlayerProvider: React.FC<UnlayerProviderProps> = ({
  config,
  children,
}) => {
  const merged = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config, [PROVIDER_ACTIVE_KEY]: true }),
    [config]
  );

  const Context = getUnlayerContext();
  return (
    <Context.Provider value={merged}>
      {children}
    </Context.Provider>
  );
};

UnlayerProvider.displayName = "UnlayerProvider";

export function useUnlayerConfig(): UnlayerConfig {
  return useContext(getUnlayerContext());
}

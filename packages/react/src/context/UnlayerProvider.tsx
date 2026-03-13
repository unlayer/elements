"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { UnlayerConfig } from "./unlayer-config";
import { DEFAULT_CONFIG } from "./unlayer-config";

/**
 * @internal Flag added to context value when a provider is active.
 * Used by item components to detect provider-without-Body usage.
 */
export const PROVIDER_ACTIVE_KEY = "__unlayerProviderActive";

// Lazy context — only created when UnlayerProvider or useUnlayerConfig is used.
// This file is marked "use client" so the context creation only happens in
// client component boundaries, never when server components import the barrel.
let _unlayerContext: React.Context<UnlayerConfig> | null = null;

function getUnlayerContext(): React.Context<UnlayerConfig> {
  if (!_unlayerContext) {
    _unlayerContext = createContext<UnlayerConfig>(DEFAULT_CONFIG);
  }
  return _unlayerContext;
}

export interface UnlayerProviderProps {
  config: Partial<UnlayerConfig>;
  children: React.ReactNode;
}

export const UnlayerProvider: React.FC<UnlayerProviderProps> = ({
  config,
  children,
}) => {
  const UnlayerContext = getUnlayerContext();
  const merged = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config, [PROVIDER_ACTIVE_KEY]: true }),
    [config]
  );

  return (
    <UnlayerContext.Provider value={merged}>
      {children}
    </UnlayerContext.Provider>
  );
};

UnlayerProvider.displayName = "UnlayerProvider";

export function useUnlayerConfig(): UnlayerConfig {
  return useContext(getUnlayerContext());
}

"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { DEFAULT_CONFIG } from "@unlayer-internal/shared-elements";

/**
 * @internal Flag added to context value when a provider is active.
 * Used by item components to detect provider-without-Body usage.
 */
export const PROVIDER_ACTIVE_KEY = "__unlayerProviderActive";

const UnlayerContext = createContext<UnlayerConfig>(DEFAULT_CONFIG);

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

  return (
    <UnlayerContext.Provider value={merged}>
      {children}
    </UnlayerContext.Provider>
  );
};

UnlayerProvider.displayName = "UnlayerProvider";

export function useUnlayerConfig(): UnlayerConfig {
  return useContext(UnlayerContext);
}

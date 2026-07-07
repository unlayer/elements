"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { DEFAULT_CONFIG } from "@unlayer-internal/shared-elements";

/**
 * @internal Flag added to the context value while a provider is mounted.
 * Body uses it to distinguish "provider config" from the context default —
 * only a real provider's config participates in Body's config resolution.
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

/** Strip the internal provider-active flag from a context value. */
function withoutProviderFlag(ctx: Record<string, any>): UnlayerConfig {
  const { [PROVIDER_ACTIVE_KEY]: _active, ...config } = ctx;
  return config as UnlayerConfig;
}

export function useUnlayerConfig(): UnlayerConfig {
  return withoutProviderFlag(useContext(getUnlayerContext()) as Record<string, any>);
}

/**
 * @internal Read the mounted provider's config from inside a component render.
 *
 * Returns undefined when no provider is mounted, and — via the try/catch —
 * in React Server Components, where context is unavailable. That fallback is
 * what lets Body consult the provider in client/SSR renders while staying
 * usable as a Server Component (where config must arrive via the prop).
 */
export function readProviderConfig(): Partial<UnlayerConfig> | undefined {
  try {
    const ctx = useContext(getUnlayerContext()) as Record<string, any>;
    if (!ctx || ctx[PROVIDER_ACTIVE_KEY] !== true) return undefined;
    return withoutProviderFlag(ctx);
  } catch {
    return undefined;
  }
}

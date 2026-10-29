"use client";

import React, { useMemo } from "react";
import type { UnlayerConfig } from "@unlayer-internal/shared-elements";
import { DEFAULT_CONFIG } from "@unlayer-internal/shared-elements";
import { rendering } from "../engine/dispatcher";
import { layerConfig } from "./layer-config";

// React Server Components' React (its react-server build: Next.js's Server Components and route handlers) has no
// createContext or useContext. They're read off React, not imported by name: webpack (Next.js 15's default bundler)
// fails the build of a module that imports by name what the module it imports doesn't export.
const { createContext, useContext } = React as Partial<Pick<typeof React, "createContext" | "useContext">>;

/**
 * @internal Flag added to context value when a provider is active.
 * Used by item components to detect provider-without-Body usage.
 */
export const PROVIDER_ACTIVE_KEY = "__unlayerProviderActive";

/**
 * @internal On UnlayerProvider: the render functions read its config off the element around a root (see
 * unwrap-root.ts), where React Server Components have no context to read it from.
 */
export const UNLAYER_PROVIDER = Symbol.for("@unlayer/react-elements/provider");

// Lazy-init: createContext is not available in React Server Component modules.
// Deferring the call ensures it only runs when UnlayerProvider, Body or
// useUnlayerConfig is actually rendered, and never where React has no context.
let _UnlayerContext: React.Context<UnlayerConfig> | null = null;
function getUnlayerContext(): React.Context<UnlayerConfig> | null {
  if (!_UnlayerContext && typeof createContext === "function") {
    _UnlayerContext = createContext<UnlayerConfig>(DEFAULT_CONFIG);
  }
  return _UnlayerContext;
}

export interface UnlayerProviderProps {
  config: Partial<UnlayerConfig>;
  children: React.ReactNode;
}

/**
 * Config for every root (Email, Page, Document, Body) inside it, key by key under the root's own `config` prop and a
 * render function's options. Inside another UnlayerProvider, its keys win over that one's.
 */
export const UnlayerProvider: React.FC<UnlayerProviderProps> = ({
  config,
  children,
}) => {
  const Context = getUnlayerContext();
  // React Server Components' React has no context: the render functions read the config off this element instead.
  if (!Context || !useContext) return <>{children}</>;
  const parent = useContext(Context);
  // Key by key over the Provider around it (or the defaults): a key it leaves undefined comes from there.
  const merged = useMemo(
    () => ({ ...layerConfig(parent, config), [PROVIDER_ACTIVE_KEY]: true }),
    [parent, config]
  );

  return (
    <Context.Provider value={merged}>
      {children}
    </Context.Provider>
  );
};

UnlayerProvider.displayName = "UnlayerProvider";
(UnlayerProvider as unknown as Record<symbol, boolean>)[UNLAYER_PROVIDER] = true;

export function useUnlayerConfig(): UnlayerConfig {
  const Context = getUnlayerContext();
  return Context && useContext ? useContext(Context) : DEFAULT_CONFIG;
}

/**
 * The nearest UnlayerProvider's config, for a root React renders (an app's render, `renderToStaticMarkup`); undefined
 * where there's none, or no context to read it from: React Server Components' React, a React other than the one the
 * render runs with (a bundler's second copy), or outside a render. The render functions read it off the element too
 * (see unwrap-root.ts). The check is the same on every render of a root, so its hooks are always the same.
 */
export function useProvidedConfig(): Partial<UnlayerConfig> | undefined {
  const Context = getUnlayerContext();
  if (!Context || !useContext || !rendering()) return undefined;
  const { [PROVIDER_ACTIVE_KEY]: active, ...config } = useContext(Context) as UnlayerConfig & Record<string, unknown>;
  return active ? (config as Partial<UnlayerConfig>) : undefined;
}

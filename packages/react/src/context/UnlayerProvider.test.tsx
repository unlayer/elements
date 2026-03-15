import { describe, it, expect } from "vitest";
import React from "react";
import { renderHook } from "@testing-library/react";
import { UnlayerProvider, useUnlayerConfig, PROVIDER_ACTIVE_KEY } from "./UnlayerProvider";

describe("UnlayerProvider", () => {
  it("returns default config when no provider", () => {
    const { result } = renderHook(() => useUnlayerConfig());
    expect(result.current.cdnBaseUrl).toBe("https://cdn.tools.unlayer.com");
    expect(result.current.mode).toBe("web");
  });

  it("merges config with defaults", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UnlayerProvider config={{ cdnBaseUrl: "https://custom.cdn.com" }}>
        {children}
      </UnlayerProvider>
    );
    const { result } = renderHook(() => useUnlayerConfig(), { wrapper });
    expect(result.current.cdnBaseUrl).toBe("https://custom.cdn.com");
    expect(result.current.mode).toBe("web"); // default preserved
  });

  it("sets provider active flag", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UnlayerProvider config={{}}>{children}</UnlayerProvider>
    );
    const { result } = renderHook(() => useUnlayerConfig(), { wrapper });
    expect((result.current as any)[PROVIDER_ACTIVE_KEY]).toBe(true);
  });

  it("does not set provider active flag without provider", () => {
    const { result } = renderHook(() => useUnlayerConfig());
    expect((result.current as any)[PROVIDER_ACTIVE_KEY]).toBeUndefined();
  });
});

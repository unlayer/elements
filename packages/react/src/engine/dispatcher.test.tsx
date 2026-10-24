// @vitest-environment node
/**
 * Elements' hooks dispatcher, on the installed React (CI runs it on each version it supports): every hook React
 * exports works in a template's component as on a server, and a hook it doesn't know fails with a named error.
 */
import { describe, expect, it } from "vitest";
import React, { createContext, useState } from "react";
import * as ReactDom from "react-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { renderStatic } from "./index";
import { isIdleDispatcher, theSlot } from "./dispatcher";

const R = React as unknown as Record<string, any>;
const has = (name: string) => typeof R[name] === "function";
const Theme = createContext("default");

/** What a component gives with the walker and with react-dom/server: the same, where react-dom can render it. */
const both = (element: React.ReactElement) => ({ walker: renderStatic(element), reactDom: renderToStaticMarkup(element) });

describe("an idle dispatcher (React's between its client renders: no render running, where a context's default is learned)", () => {
  const invalid = () => {
    throw new Error("Invalid hook call");
  };
  const hooks = ["useState", "useEffect", "useContext", "useCallback", "useMemo", "useReducer", "useRef"];
  it("is none, or one whose hooks are one function (React's ContextOnlyDispatcher), compared without calling anything", () => {
    expect(isIdleDispatcher(null)).toBe(true);
    expect(isIdleDispatcher(undefined)).toBe(true);
    const calls: string[] = [];
    const contextOnly = new Proxy(Object.fromEntries(hooks.map((hook) => [hook, invalid])), { get: (target, key) => (calls.push(String(key)), target[key as string]) });
    expect(isIdleDispatcher(contextOnly)).toBe(true);
    expect(calls.every((key) => hooks.includes(key))).toBe(true);
  });

  it("isn't a running render's: React Server Components' shares one function for most hooks, but not useContext", () => {
    const unsupported = () => {
      throw new Error("This Hook is not supported in Server Components.");
    };
    const flight = { ...Object.fromEntries(hooks.map((hook) => [hook, unsupported])), useContext: () => {
      throw new Error("Cannot read a Client Context from a Server Component.");
    } };
    expect(isIdleDispatcher(flight)).toBe(false);
    // A server's or a client's, with a function each, and a shape this doesn't know: hosts (the safe side, no learning).
    expect(isIdleDispatcher(Object.fromEntries(hooks.map((hook) => [hook, () => hook])))).toBe(false);
    expect(isIdleDispatcher({})).toBe(false);
    expect(isIdleDispatcher({ useState: 1, useEffect: 1, useContext: 1, useCallback: 1 })).toBe(false);
  });
});

describe("the hooks dispatcher", () => {
  it("implements every hook this React exports, as its server renderer does", () => {
    const store = { subscribe: () => () => {}, get: () => "client", server: () => "server" };
    function Everything() {
      const out: unknown[] = [];
      const [state, setState] = R.useState(() => "state");
      const [reduced] = R.useReducer((s: number, a: number) => s + a, 1, (n: number) => n + 1);
      out.push(state, reduced, R.useMemo(() => "memo", []), R.useCallback(() => "cb", [])(), R.useRef("ref").current);
      out.push(R.useContext(Theme), R.useSyncExternalStore(store.subscribe, store.get, store.server), R.useDeferredValue("deferred"));
      const [pending] = R.useTransition();
      out.push(pending, typeof R.useId());
      // Effects never run on a server.
      for (const effect of ["useEffect", "useLayoutEffect", "useInsertionEffect"]) R[effect](() => out.push(`ran ${effect}`));
      R.useImperativeHandle(null, () => ({}));
      R.useDebugValue("debug");
      if (has("use")) out.push(R.use(Theme));
      if (has("useOptimistic")) out.push(R.useOptimistic("optimistic")[0]);
      if (has("useActionState")) out.push(R.useActionState(() => {}, "action")[0]);
      if (has("useEffectEvent")) out.push(typeof R.useEffectEvent(() => {}));
      if (typeof (ReactDom as Record<string, any>).useFormStatus === "function") out.push((ReactDom as Record<string, any>).useFormStatus().pending);
      void setState;
      return <p>{out.map(String).join(",")}</p>;
    }
    const element = <Theme.Provider value="provided"><Everything /></Theme.Provider>;
    const { walker, reactDom } = both(element);
    expect(walker).toBe(reactDom);
    expect(walker).not.toContain("ran ");
    // Each hook this React has: the list above covers them (a new one needs a line there and in dispatcher.ts).
    const covered = ["useState", "useReducer", "useMemo", "useCallback", "useRef", "useContext", "useSyncExternalStore", "useDeferredValue", "useTransition", "useId", "useEffect", "useLayoutEffect", "useInsertionEffect", "useImperativeHandle", "useDebugValue", "use", "useOptimistic", "useActionState", "useEffectEvent"];
    expect(Object.keys(R).filter((key) => /^use([A-Z]|$)/.test(key) && has(key)).filter((key) => !covered.includes(key))).toEqual([]);
  });

  it("runs a component again when it sets its state while rendering, as React does", () => {
    function Counter() {
      const [n, setN] = useState(0);
      if (n < 3) setN(n + 1);
      return <b>{n}</b>;
    }
    expect(renderStatic(<Counter />)).toBe("<b>3</b>");
  });

  it("says what a function from a hook can't do while rendering (useEffectEvent, useOptimistic, useActionState)", () => {
    for (const [hook, call] of [
      ["useEffectEvent", () => R.useEffectEvent(() => {})()],
      ["useOptimistic", () => R.useOptimistic(1)[1](2)],
      ["useActionState", () => R.useActionState(() => {}, 1)[1]()],
    ] as const) {
      if (!has(hook)) continue;
      const Component = () => (call(), null);
      expect(() => renderStatic(<Component />), hook).toThrow(/while rendering/);
    }
  });

  it("fails a hook it doesn't know (a newer React's) with a named error, and puts React's dispatcher back", () => {
    const slot = theSlot()!;
    const before = slot.get();
    // What a newer React's `useFuture` would do: call it on the dispatcher in its slot.
    const useFuture = () => (slot.get() as Record<string, () => unknown>).useFuture();
    function Futuristic() {
      useFuture();
      return null;
    }
    expect(() => renderStatic(<Futuristic />)).toThrow(`[Unlayer] <Futuristic> calls useFuture, which Elements' renderer doesn't support (React ${React.version}).`);
    expect(slot.get()).toBe(before);
    // Not every property: one React reads for something else isn't a hook.
    expect((slot.get() as Record<string, unknown> | null)?.then).toBeUndefined();
  });

  it("needs getServerSnapshot for useSyncExternalStore, as React's server renderer does", () => {
    const Store = () => <i>{R.useSyncExternalStore(() => () => {}, () => "client")}</i>;
    expect(() => renderStatic(<Store />)).toThrow(/getServerSnapshot/);
  });
});

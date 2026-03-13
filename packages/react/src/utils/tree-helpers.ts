/**
 * Shared helpers for walking React element trees.
 *
 * Used by both render-to-json.ts and extract-head.ts to avoid duplication.
 */

import React from "react";

/** Get the displayName of a React element's component type. */
export function getDisplayName(element: React.ReactElement): string | undefined {
  const type = element.type as any;
  return type?.displayName || type?.name;
}

/** Collect valid React element children from a node. */
export function collectChildren(node: React.ReactNode): React.ReactElement[] {
  const result: React.ReactElement[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement(child)) {
      result.push(child);
    }
  });
  return result;
}

/**
 * Strip internal/base props from an element's props,
 * returning only the semantic props that should be mapped to values.
 */
export function extractSemanticProps(
  props: Record<string, any>,
  extraKeys: string[] = []
): Record<string, any> {
  const internalKeys = new Set([
    "children",
    "mode",
    "className",
    "style",
    "index",
    "colIndex",
    "cells",
    "bodyValues",
    "rowValues",
    "_config",
    "config",
    "previewText",
    "layout",
    "collection",
    ...extraKeys,
  ]);

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!internalKeys.has(key) && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/** Increment and return counter for a given key. */
export function nextCounter(counters: Record<string, number>, key: string): number {
  counters[key] = (counters[key] || 0) + 1;
  return counters[key];
}

/** Warnings more than one kind of node gives. */
import { ALWAYS_TRUE } from "./defaults";
import type { ModuleState } from "./state";
import type { Plain } from "./values";

export const list = (keys: string[]) => keys.map((key) => `\`${key}\``).join(", ");

/** Says which values come back in Elements' own form (see lostThroughValues). */
export function warnLost(keys: string[], where: string, state: ModuleState): void {
  if (keys.length) state.warn(`${where}: ${list(keys)} ${keys.length > 1 ? "come" : "comes"} back in the form Elements writes ${keys.length > 1 ? "them" : "it"}, not as the design has ${keys.length > 1 ? "them" : "it"}.`);
}

/** Drops the builder flags renderToJson always writes as `true` from `values`, saying which were `false`. */
export function dropFixedFlags(values: Plain, where: string, state: ModuleState): void {
  const fixed = ALWAYS_TRUE.filter((flag) => values[flag] === false);
  if (fixed.length) state.warn(`${where}: ${list(fixed)} ${fixed.length > 1 ? "are" : "is"} false in the design, but renderToJson writes ${fixed.length > 1 ? "them" : "it"} as true.`);
  for (const key of ALWAYS_TRUE) delete values[key];
}

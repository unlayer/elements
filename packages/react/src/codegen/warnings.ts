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

/**
 * Says where a row's or block's merge tag rule (the editor's `mergeTagGroup` and `mergeTagRule`: rows repeated for
 * each product, a block shown where a tag is set) isn't applied in Elements' HTML: the code and the design keep it, but
 * only a Table applies one, where the render's `mergeTagState` names it.
 */
export function warnMergeTagRule(values: Plain, where: string, state: ModuleState, table: boolean): void {
  const { mergeTagGroup: group, mergeTagRule: rule } = values;
  if (!group || !rule) return;
  const name = `\`${group}.${rule}\``;
  state.warn(
    table
      ? `${where}: its rows repeat by the merge tag rule ${name} only where the render's \`mergeTagState\` holds your editor's merge tags with \`mergeTagGroup: "${group}", mergeTagRule: "${rule}"\`.`
      : `${where}: its merge tag rule ${name} isn't applied in Elements' HTML (the code and the design keep it), so the HTML has it once, without the rule's tags around it.`
  );
}

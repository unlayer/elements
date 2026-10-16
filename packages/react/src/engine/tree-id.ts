/**
 * Where a component is in the tree, as React's server renderer numbers it (Fizz's tree context): `useId()` is made
 * from it, so the walker's ids are what react-dom would give the same tree, in the installed React's format.
 */
import { idFormat } from "./react-compat";

export interface TreeContext {
  id: number;
  overflow: string;
}

export const ROOT_TREE: TreeContext = { id: 1, overflow: "" };

const clz32 = Math.clz32;

/** The tree context of child `index` of `total` (React's pushTreeContext). */
export function pushTreeContext(base: TreeContext, total: number, index: number): TreeContext {
  let baseId = base.id;
  let baseLength = 32 - clz32(baseId) - 1;
  baseId &= ~(1 << baseLength);
  const slot = index + 1;
  const length = 32 - clz32(total) + baseLength;
  if (length > 30) {
    // The id would overflow 32 bits: the bits so far go to `overflow`, in base 32.
    const overflowBits = baseLength - (baseLength % 5);
    const overflow = (baseId & ((1 << overflowBits) - 1)).toString(32);
    baseId >>= overflowBits;
    baseLength -= overflowBits;
    return { id: (1 << (32 - clz32(total) + baseLength)) | (slot << baseLength) | baseId, overflow: overflow + base.overflow };
  }
  return { id: (1 << length) | (slot << baseLength) | baseId, overflow: base.overflow };
}

function treeId(tree: TreeContext): string {
  const id = tree.id;
  return (id & ~(1 << (32 - clz32(id) - 1))).toString(32) + tree.overflow;
}

/** The `local`-th `useId()` of the component at `tree` (no `identifierPrefix`: Elements' ids carry nothing of its own). */
export function makeId(tree: TreeContext, local: number): string {
  const tid = treeId(tree);
  const h = local > 0 ? "H" + local.toString(32) : "";
  switch (idFormat()) {
    case "underscore":
      return `_R_${tid}${h}_`;
    case "guillemet":
      return `«R${tid}${h}»`;
    default:
      return `:R${tid}${h}:`;
  }
}

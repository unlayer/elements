/**
 * The package's export that the runtime loading Elements picks (package.json's "exports"): fizz-cleanup.node.ts in
 * Node, fizz-cleanup.noop.ts elsewhere. Declared, not mapped in tsconfig's `paths`, which esbuild follows from the
 * built files too, to Node's module in every bundle.
 */
declare module "@unlayer/react-elements/fizz-cleanup" {
  export const cleanUp: () => boolean;
}

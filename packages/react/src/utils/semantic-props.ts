/**
 * React Semantic Props
 *
 * Re-exports the shared semantic props system with React.ReactNode
 * as the default children type.
 */

import type { SemanticProps as SharedSemanticProps } from "@unlayer-internal/shared-elements";

/**
 * React-specific SemanticProps — pins TChildren to React.ReactNode
 */
export type SemanticProps<T> = SharedSemanticProps<T, React.ReactNode>;

// Re-export the runtime mapper (framework-agnostic, works as-is)
export { mapSemanticProps } from "@unlayer-internal/shared-elements";

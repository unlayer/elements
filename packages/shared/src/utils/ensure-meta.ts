/**
 * Add _meta fields if not present
 */
export function ensureMeta(values: any, type: string, index: number = 0): any {
  return {
    ...values,
    _meta: {
      htmlID: `u_content_${type.toLowerCase()}_${index + 1}`,
      htmlClassNames: `u_content_${type.toLowerCase()}`,
      ...(values._meta || {})
    }
  };
}

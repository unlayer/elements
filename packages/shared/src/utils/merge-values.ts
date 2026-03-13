/**
 * Deep-merge user values with defaults.
 * Plain objects are merged recursively; arrays and primitives
 * from userValues override the default entirely.
 */
export function mergeValues<T extends Record<string, any>>(
  defaults: T,
  userValues?: Partial<T>
): T {
  if (!userValues) return defaults;

  const result: any = { ...defaults };

  for (const key of Object.keys(userValues)) {
    const userVal = (userValues as any)[key];
    const defaultVal = (defaults as any)[key];

    if (
      userVal !== null &&
      defaultVal !== null &&
      typeof userVal === "object" &&
      typeof defaultVal === "object" &&
      !Array.isArray(userVal) &&
      !Array.isArray(defaultVal)
    ) {
      // Recursively merge plain objects
      result[key] = mergeValues(defaultVal, userVal);
    } else {
      result[key] = userVal;
    }
  }

  return result as T;
}

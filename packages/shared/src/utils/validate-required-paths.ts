/**
 * Required nested paths per component type + usage examples for warnings
 */
const REQUIRED_PATHS: Record<string, { paths: string[]; examples: Record<string, string> }> = {
  Social: {
    paths: ["icons.icons"],
    examples: {
      "icons.icons": '<Social icons={[{ name: "Facebook", url: "https://facebook.com" }]} />',
    },
  },
  Menu: {
    paths: ["menu.items"],
    examples: {
      "menu.items": '<Menu items={[{ text: "Home", href: "/" }]} />',
    },
  },
  Table: {
    paths: ["table"],
    examples: {
      table: '<Table headers={["Name", "Email"]} data={[["Alice", "alice@co.com"]]} />',
    },
  },
  Video: {
    paths: ["video"],
    examples: {
      video: '<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />',
    },
  },
};

/**
 * Check for missing required nested values and log helpful warnings.
 * Does not throw — render is still attempted.
 */
export function validateRequiredPaths(type: string, values: any): void {
  const spec = REQUIRED_PATHS[type];
  if (!spec) return;

  for (const path of spec.paths) {
    const parts = path.split(".");
    let current = values;
    for (const part of parts) {
      if (current == null || typeof current !== "object") {
        current = undefined;
        break;
      }
      current = current[part];
    }

    if (current === undefined || current === null) {
      const example = spec.examples[path] ?? "";
      console.warn(
        `[Unlayer] <${type}> is missing required value "${path}".` +
          (example ? `\nExample: ${example}` : "")
      );
    }
  }
}

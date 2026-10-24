/**
 * Generated code formatted with prettier (an optional peer dependency, loaded only when it's asked for), with the
 * project's own settings where it passes them. Without prettier the code comes back as it is: designToElements
 * already writes it as prettier's defaults do.
 */
export async function formatElements(code: string, options: Record<string, unknown> = {}): Promise<string> {
  let prettier: { format(text: string, options: Record<string, unknown>): Promise<string> };
  let plugins: unknown[];
  try {
    // Not where a bundler would follow it: loaded when it runs.
    const [standalone, typescript, estree] = await Promise.all([
      import(/* webpackIgnore: true */ /* @vite-ignore */ "prettier/standalone"),
      import(/* webpackIgnore: true */ /* @vite-ignore */ "prettier/plugins/typescript"),
      import(/* webpackIgnore: true */ /* @vite-ignore */ "prettier/plugins/estree"),
    ]);
    prettier = standalone.default ?? standalone;
    plugins = [typescript.default ?? typescript, estree.default ?? estree];
  } catch {
    return code;
  }
  return prettier.format(code, { ...options, parser: "typescript", plugins });
}

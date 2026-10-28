/**
 * Generated code formatted with prettier (an optional peer dependency, loaded only when it's asked for), with the
 * project's own settings where it passes them. Without prettier the code comes back as it is: designToElements
 * already writes it as prettier's defaults do.
 */
/**
 * An optional peer dependency's module, loaded when it runs. Its name isn't a literal, so no bundler follows it into
 * the bundle: esbuild (wrangler's, a serverless bundler's) failed on an app that imports this entry without prettier
 * installed; webpack and Vite are told to leave it too.
 */
const peer = (name: string): Promise<any> => import(/* webpackIgnore: true */ /* @vite-ignore */ name);

export async function formatElements(code: string, options: Record<string, unknown> = {}): Promise<string> {
  let prettier: { format(text: string, options: Record<string, unknown>): Promise<string> };
  let plugins: unknown[];
  try {
    // Not where a bundler would follow it: loaded when it runs (see peer).
    const [standalone, typescript, estree] = await Promise.all([peer("prettier/standalone"), peer("prettier/plugins/typescript"), peer("prettier/plugins/estree")]);
    prettier = standalone.default ?? standalone;
    plugins = [typescript.default ?? typescript, estree.default ?? estree];
  } catch {
    return code;
  }
  return prettier.format(code, { ...options, parser: "typescript", plugins });
}

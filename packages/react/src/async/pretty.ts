/**
 * HTML formatted for reading, with prettier (an optional peer dependency, loaded only when it's asked for). Its
 * whitespace sensitivity is strict: no space is added or taken where it would show (in text, between inline
 * elements). Comments are set aside first and put back as they were: Outlook's conditional ones (`<!--[if mso]>`)
 * hold markup that doesn't pair up, which prettier would rewrite. The document shows the same.
 */
export async function prettyHtml(html: string): Promise<string> {
  let prettier: { format(text: string, options: Record<string, unknown>): Promise<string> };
  let plugin: unknown;
  try {
    // Not where a bundler would follow it: loaded when it runs.
    [prettier, plugin] = await Promise.all([import(/* webpackIgnore: true */ /* @vite-ignore */ "prettier/standalone"), import(/* webpackIgnore: true */ /* @vite-ignore */ "prettier/plugins/html")]);
  } catch (cause) {
    throw Object.assign(new Error("[Unlayer] `pretty` needs prettier: install it with `npm install prettier` (an optional peer dependency of @unlayer/react-elements)."), { cause });
  }
  const comments: string[] = [];
  const set = html.replace(/<!--[\s\S]*?-->/g, (comment) => `<!--unlayer-pretty-${comments.push(comment) - 1}-->`);
  const formatted = await prettier.format(set, { parser: "html", plugins: [plugin], htmlWhitespaceSensitivity: "strict", printWidth: 120 });
  return formatted.replace(/<!--unlayer-pretty-(\d+)-->/g, (_, i: string) => comments[Number(i)]);
}

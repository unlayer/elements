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
    // Prettier 2 installs with Elements (the peer dependency takes any version, so a project's prettier 2 doesn't fail
    // the install), but has no `prettier/plugins/html`: its version says so. (`standalone.js`, which both have: 2 has
    // no `exports`, so its files are named with their extension.)
    const version: unknown = await import(/* webpackIgnore: true */ /* @vite-ignore */ "prettier/standalone.js").then((p: Record<string, any>) => p.version ?? p.default?.version, () => undefined);
    const older = typeof version === "string" && Number.parseInt(version, 10) < 3;
    throw Object.assign(
      new Error(older ? `[Unlayer] \`pretty\` needs prettier 3, and prettier ${version} is installed: upgrade it with \`npm install prettier@3\` (an optional peer dependency of @unlayer/react-elements).` : "[Unlayer] `pretty` needs prettier: install it with `npm install prettier` (an optional peer dependency of @unlayer/react-elements)."),
      { cause }
    );
  }
  const comments: string[] = [];
  const set = html.replace(/<!--[\s\S]*?-->/g, (comment) => `<!--unlayer-pretty-${comments.push(comment) - 1}-->`);
  const formatted = await prettier.format(set, { parser: "html", plugins: [plugin], htmlWhitespaceSensitivity: "strict", printWidth: 120 });
  return formatted.replace(/<!--unlayer-pretty-(\d+)-->/g, (_, i: string) => comments[Number(i)]);
}

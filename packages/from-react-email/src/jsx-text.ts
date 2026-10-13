import ts from "typescript";
import { decodeHtmlEntities } from "@unlayer/convert-core";

/** JSX text the way React sees it: lines trimmed and joined by spaces, entities decoded (JSX's set, not every HTML5 name). */
export function jsxText(text: string): string {
  return jsxLines(text).replace(
    /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,
    (reference, name: string) => {
      if (name.startsWith("#")) return decodeHtmlEntities(reference);
      let decoded = JSX_ENTITIES.get(name);
      if (decoded === undefined) {
        // JSX uses the React/TypeScript entity set, not every HTML5 name.
        // Ask our parser rather than maintaining a second, incomplete table.
        const emitted = ts.transpileModule(
          `const text = <span>${reference}</span>;`,
          { compilerOptions: { jsx: ts.JsxEmit.React } },
        ).outputText;
        const file = ts.createSourceFile(
          "entity.js",
          emitted,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.JS,
        );
        const statement = file.statements[0];
        const init = ts.isVariableStatement(statement)
          ? statement.declarationList.declarations[0].initializer
          : undefined;
        const child =
          init && ts.isCallExpression(init) ? init.arguments[2] : undefined;
        decoded = child && ts.isStringLiteral(child) ? child.text : reference;
        JSX_ENTITIES.set(name, decoded);
      }
      return decoded;
    },
  );
}

const JSX_ENTITIES = new Map<string, string>();

/** JSX text's lines trimmed and joined by spaces, as JSX joins them (entities left as written). */
export function jsxLines(text: string): string {
  const lines = text.split(/\r\n|\n|\r/);
  let out = "";
  lines.forEach((line, i) => {
    let t = line.replace(/\t/g, " ");
    if (i > 0) t = t.replace(/^ +/, "");
    if (i < lines.length - 1) t = t.replace(/ +$/, "");
    if (t) out += (out && lines.length > 1 && i > 0 ? " " : "") + t;
  });
  return out;
}

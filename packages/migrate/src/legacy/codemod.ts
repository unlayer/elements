/**
 * Codemod: today's components (@unlayer/react-elements's main entry, or /legacy) rewritten as the new ones
 * (/primitives), keeping the template's props, loops, conditions and helpers (RFC 0001, step 7).
 *
 * Only the import and the JSX of today's components change; JSX inside expressions is rewritten in place. The new
 * template draws what today's draws: where today's components fill in a default the new ones don't share (a block's
 * 10px of padding, a Heading's 22px at 140%, an email's 500px width), the value is written out; where today's draw
 * something other than their props say (an image's width in px, which they draw as a percentage of their column),
 * the value they draw is written out too, so nothing moves when a template is migrated. Values that can't be read
 * from the source (expressions) are kept as they are, and what that may change is reported, as is anything with no
 * new component yet (Html, Table, custom tools): the migration never drops anything quietly.
 */
import ts from "typescript";
import { formatTsx } from "@unlayer/convert-core";
import { hole, inlineHtml } from "./html";

export interface MigrateElementsOptions {
  /** Module specifiers today's components are imported from (default: the package and its /legacy entry). */
  from?: string[];
  /** Where the new components are imported from (default "@unlayer/react-elements/primitives"). */
  to?: string;
}

export interface MigrateElementsResult {
  /** The migrated module, formatted. */
  code: string;
  /** What couldn't be migrated as it was, or what it may change: one line each, with where. */
  report: string[];
}

const DEFAULT_FROM = ["@unlayer/react-elements", "@unlayer/react-elements/legacy"];
const DEFAULT_TO = "@unlayer/react-elements/primitives";

/** Today's components that have a new one (by the same name, or the one they become). */
const COMPONENTS = new Set(["Email", "Page", "Row", "Column", "Heading", "Paragraph", "Text", "Button", "Image", "Divider", "Social", "Menu", "Video", "Html", "Table", "Spacer"]);
const LAYOUTS: Record<string, number[]> = {
  OneColumn: [1],
  TwoEqual: [1, 1],
  TwoWideNarrow: [2, 1],
  TwoNarrowWide: [1, 2],
  ThreeEqual: [1, 1, 1],
  FourEqual: [1, 1, 1, 1],
};

/**
 * A prop's value: one known from the source (a literal, or a constant whose name is kept as `code`), or its source as
 * it is (an expression, its node kept for the html it may build).
 */
type Value = { literal: unknown; code?: string } | { code: string; node?: ts.Expression };
type Props = Map<string, Value>;

const isLiteral = (value: Value | undefined): value is { literal: unknown; code?: string } => !!value && "literal" in value;
const code = (value: Value): string => value.code ?? JSON.stringify((value as { literal: unknown }).literal);

/** Strings and values joined into one: a string where every part is a literal, else a template literal. */
function joined(parts: Array<Value | string>): Value {
  const known = parts.every((part) => typeof part === "string" || isLiteral(part));
  const text = known ? parts.map((part) => (typeof part === "string" ? part : String((part as { literal: unknown }).literal))).join("") : undefined;
  if (parts.every((part) => typeof part === "string" || (isLiteral(part) && part.code === undefined))) return { literal: text };
  const escape = (s: string) => s.replace(/[`\\]|\$\{/g, (m) => `\\${m}`);
  const template = `\`${parts.map((part) => (typeof part === "string" ? escape(part) : isLiteral(part) && part.code === undefined ? escape(String(part.literal)) : `\${${code(part)}}`)).join("")}\``;
  return known ? { literal: text, code: template } : { code: template };
}

/** px from "18px", "18" or 18; undefined for anything else. */
function px(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const match = typeof value === "string" ? /^\s*(-?\d+(?:\.\d+)?)\s*(px)?\s*$/.exec(value) : null;
  return match ? Number(match[1]) : undefined;
}

/** "10px 20px" (1 to 4 values) as [top, right, bottom, left]. */
function sides(value: unknown): [number, number, number, number] | undefined {
  if (typeof value === "number") return [value, value, value, value];
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parts = value.trim().split(/\s+/).map(px);
  if (parts.some((part) => part === undefined) || parts.length > 4) return undefined;
  const [top, right = top, bottom = top, left = right] = parts as number[];
  return [top, right, bottom, left];
}

const round = (n: number) => Math.round(n * 100) / 100;

/** What a block knows about where it is, for widths today's components work out (undefined where it isn't known). */
interface Place {
  /** The column's width, the row's side padding taken off (today's image maximum is a share of it). */
  column?: number;
  /** The room in the column, its padding taken off. */
  room?: number;
  /** The Row's side padding, which today's leave out of the column (the new Section is that much wider). */
  outside?: number;
}

export async function migrateElements(source: string, options: MigrateElementsOptions = {}): Promise<MigrateElementsResult> {
  const from = new Set(options.from ?? DEFAULT_FROM);
  const file = ts.createSourceFile("template.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const report: string[] = [];
  const used = new Set<string>();
  const where = (node: ts.Node) => `line ${file.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  // Today's components and layouts, by the name they're imported as.
  const local = new Map<string, string>();
  const imports: ts.ImportDeclaration[] = [];
  const kept: string[] = [];
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !from.has(statement.moduleSpecifier.text)) continue;
    imports.push(statement);
    const named = statement.importClause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    for (const element of named.elements) {
      const name = (element.propertyName ?? element.name).text;
      if (COMPONENTS.has(name) || name === "ColumnLayouts") local.set(element.name.text, name);
      else if (!element.isTypeOnly && !statement.importClause?.isTypeOnly) {
        kept.push(element.getText());
        report.push(`${where(element)}: ${name} is today's API and stays imported from ${statement.moduleSpecifier.text}; it doesn't take the new components (render them with render() from the new entry)`);
      }
    }
  }

  const bare = (expression: ts.Expression): ts.Expression => {
    while (ts.isAsExpression(expression) || ts.isParenthesizedExpression(expression) || ts.isSatisfiesExpression(expression)) expression = expression.expression;
    return expression;
  };
  /** The value a name is a constant for where it's used (the nearest `const` in scope), or undefined (a parameter, a `let`). */
  const constant = (name: ts.Identifier): ts.Expression | undefined => {
    for (let scope: ts.Node | undefined = name.parent; scope; scope = scope.parent) {
      if (ts.isFunctionLike(scope) && scope.parameters.some((parameter) => parameter.name.getText() === name.text)) return undefined;
      if (!ts.isBlock(scope) && !ts.isSourceFile(scope)) continue;
      for (const statement of scope.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        const declaration = statement.declarationList.declarations.find((d) => ts.isIdentifier(d.name) && d.name.text === name.text);
        if (declaration) return statement.declarationList.flags & ts.NodeFlags.Const && declaration.initializer ? bare(declaration.initializer) : undefined;
      }
    }
    return undefined;
  };

  /** A literal value from an expression (with the constant's name, where it's one), or undefined where it isn't one. */
  const literal = (expression: ts.Expression, depth = 0): { value: unknown; code?: string } | undefined => {
    if (depth > 8) return undefined;
    if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) return literal(expression.expression, depth);
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return { value: expression.text };
    if (ts.isNumericLiteral(expression)) return { value: Number(expression.text) };
    if (ts.isPrefixUnaryExpression(expression) && expression.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(expression.operand)) return { value: -Number(expression.operand.text) };
    if (expression.kind === ts.SyntaxKind.TrueKeyword) return { value: true };
    if (expression.kind === ts.SyntaxKind.FalseKeyword) return { value: false };
    if (ts.isArrayLiteralExpression(expression)) {
      const items = expression.elements.map((element) => literal(element));
      return items.every(Boolean) ? { value: items.map((item) => item!.value) } : undefined;
    }
    if (ts.isObjectLiteralExpression(expression)) {
      const out: Record<string, unknown> = {};
      for (const property of expression.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) return undefined;
        const value = literal(property.initializer);
        if (!value) return undefined;
        out[property.name.text] = value.value;
      }
      return { value: out };
    }
    if (ts.isIdentifier(expression)) {
      const init = constant(expression);
      const value = init && literal(init, depth + 1);
      return value && { value: value.value, code: expression.text };
    }
    if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression) && local.get(expression.expression.text) === "ColumnLayouts") {
      const cells = LAYOUTS[expression.name.text];
      return cells ? { value: { cells } } : undefined;
    }
    return undefined;
  };

  const valueOf = (expression: ts.Expression): Value => {
    const value = literal(expression);
    return value ? { literal: value.value, code: value.code } : { code: rewrite(expression), node: expression };
  };
  const propsOf = (element: ts.JsxOpeningLikeElement): Props => {
    const out: Props = new Map();
    for (const attribute of element.attributes.properties) {
      if (ts.isJsxSpreadAttribute(attribute)) {
        // A spread of an object literal (or a constant for one): its props, each read as a prop given here.
        let spread: ts.Expression | undefined = bare(attribute.expression);
        if (ts.isIdentifier(spread)) spread = constant(spread);
        if (spread && ts.isObjectLiteralExpression(spread) && spread.properties.every((p) => (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)))) {
          for (const property of spread.properties as ts.NodeArray<ts.PropertyAssignment | ts.ShorthandPropertyAssignment>) {
            const value = ts.isPropertyAssignment(property) ? property.initializer : property.name;
            out.set((property.name as ts.Identifier).text, valueOf(value));
          }
        } else {
          report.push(`${where(attribute)}: the props spread here ({...${attribute.expression.getText()}}) can't be read, so they're left out: give them as props`);
        }
        continue;
      }
      const name = attribute.name.getText();
      const init = attribute.initializer;
      if (!init) out.set(name, { literal: true });
      else if (ts.isStringLiteral(init)) out.set(name, { literal: init.text });
      else if (ts.isJsxExpression(init) && init.expression) out.set(name, valueOf(init.expression));
    }
    return out;
  };

  // ─── Writing the new JSX ───────────────────────────────────────────────────

  const element = (tag: string, attributes: Array<string | false | undefined>, children: string[] = []) => {
    used.add(tag);
    const attrs = attributes.filter(Boolean).join(" ");
    return children.length ? `<${tag}${attrs ? ` ${attrs}` : ""}>${children.join("")}</${tag}>` : `<${tag}${attrs ? ` ${attrs}` : ""} />`;
  };
  const attr = (name: string, value: Value | undefined) =>
    value && (isLiteral(value) && value.code === undefined && typeof value.literal === "string" && !/["\\&{}\n]/.test(value.literal) ? `${name}="${value.literal}"` : `${name}={${code(value)}}`);
  const object = (entries: Array<[string, Value | undefined]>) => {
    const set = entries.filter((entry): entry is [string, Value] => entry[1] !== undefined);
    return set.length ? `{{ ${set.map(([key, value]) => `${key}: ${code(value)}`).join(", ")} }}` : undefined;
  };
  const styleAttr = (entries: Array<[string, Value | undefined]>) => {
    const value = object(entries);
    return value && `style=${value}`;
  };
  const lit = (value: unknown): Value => ({ literal: value });
  const given = (props: Props, name: string, fallback?: unknown): Value | undefined => props.get(name) ?? (fallback === undefined ? undefined : lit(fallback));
  /** A non-empty color, or nothing ("" and "transparent" are none). */
  const color = (props: Props, name: string): Value | undefined => {
    const value = props.get(name);
    return isLiteral(value) && (value.literal === "" || value.literal === "transparent") ? undefined : value;
  };
  const hidden = (props: Props) => {
    const mobile = props.get("hideOnMobile");
    const desktop = props.get("hideOnDesktop");
    return mobile || desktop ? `hidden=${object([["mobile", mobile], ["desktop", desktop]])}` : undefined;
  };
  /** A font: today's `{ label, value }` or a stack; the stack. */
  const font = (props: Props, name = "fontFamily"): Value | undefined => {
    const value = props.get(name);
    if (!value) return undefined;
    if (isLiteral(value) && value.literal && typeof value.literal === "object") return { literal: (value.literal as { value?: string }).value, code: value.code && `${value.code}.value` };
    if (!isLiteral(value)) report.push(`${where(value.node ?? file)}: its ${name} comes from an expression: it's kept as it is; where it's today's { label, value }, give its value`);
    return value;
  };
  /** Letter spacing in px: today's take em ("0.06em"), which is worked out from the font size where both are known. */
  const letterSpacing = (props: Props, fontSize: Value | undefined, at: ts.Node): Value | undefined => {
    const value = props.get("letterSpacing");
    if (!value || !isLiteral(value) || typeof value.literal !== "string" || !value.literal.trim().endsWith("em")) return value;
    const size = isLiteral(fontSize!) ? px(fontSize!.literal) : undefined;
    if (size === undefined) {
      report.push(`${where(at)}: letterSpacing ${value.literal} is in em and the font size isn't known here: it's left out (give it in px)`);
      return undefined;
    }
    return lit(round(parseFloat(value.literal) * size));
  };
  /** "14px" as 14: a literal length in px written as a number; anything else as it is. */
  const n = (value: Value | undefined): Value | undefined => {
    if (!isLiteral(value) || value.code !== undefined || typeof value.literal !== "string" || !/^\s*-?[\d.]+(px)?\s*$/.test(value.literal)) return value;
    return lit(px(value.literal));
  };
  /** Today's `mobile` prop, setting by setting (none where it can't be read, which is reported). */
  const phone = (props: Props, at: ts.Node): Map<string, Value> => {
    const value = props.get("mobile");
    const out = new Map<string, Value>();
    if (!value) return out;
    const node = !isLiteral(value) && value.node ? bare(value.node) : undefined;
    if (isLiteral(value) && value.literal && typeof value.literal === "object") {
      for (const [key, item] of Object.entries(value.literal as Record<string, unknown>)) out.set(key, lit(item));
    } else if (node && ts.isObjectLiteralExpression(node) && node.properties.every((p) => ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)))) {
      for (const property of node.properties as ts.NodeArray<ts.PropertyAssignment>) out.set((property.name as ts.Identifier).text, valueOf(property.initializer));
    } else {
      report.push(`${where(at)}: its mobile settings come from an expression: they're left out (give them as an object)`);
    }
    return out;
  };
  const mobileAttr = (entries: Array<[string, Value | undefined]>) => {
    const value = object(entries);
    return value && `mobile=${value}`;
  };
  const textChildren = (node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, at: ts.Node): string[] => {
    const html = props.get("html") ?? props.get("text");
    if (html) {
      // Markup in a string, or in a template literal with expressions in it (`<b>${value}</b>`).
      const template = !isLiteral(html) && html.node ? bare(html.node) : undefined;
      let markup: string;
      let holes: string[] = [];
      if (isLiteral(html) && typeof html.literal === "string") markup = html.literal;
      else if (template && ts.isTemplateExpression(template)) {
        markup = template.head.text + template.templateSpans.map((span, index) => hole(index) + span.literal.text).join("");
        holes = template.templateSpans.map((span) => rewrite(span.expression));
      } else {
        report.push(`${where(at)}: its html comes from an expression (${code(html)}): it's written as text, so markup in it would show; write that with Span, Link and LineBreak`);
        return [`{${code(html)}}`];
      }
      const parsed = inlineHtml(markup, holes);
      if ("unsupported" in parsed) {
        report.push(`${where(at)}: its html holds ${parsed.unsupported}: it's written as text; rewrite it with Span, Link and LineBreak`);
        return [isLiteral(html) ? `{${JSON.stringify(markup.replace(/<[^>]+>/g, ""))}}` : `{${code(html)}}`];
      }
      parsed.used.forEach((name) => used.add(name));
      return [parsed.jsx];
    }
    return ts.isJsxElement(node) ? node.children.map((c) => child(c)).filter(Boolean) : [];
  };
  /** A block's padding (today's containerPadding, 10px by default): the block's own, or a Column around it. */
  const padding = (props: Props) => given(props, "containerPadding", "10px")!;
  const ALIGN: Record<string, string> = { left: "start", center: "center", right: "end" };
  /** Today's alignment (left, center, right) as the new one's (start, center, end). */
  const alignOf = (value: Value | undefined): Value | undefined =>
    value && (isLiteral(value) ? lit(ALIGN[String(value.literal)] ?? "start") : { code: `({ left: "start", center: "center", right: "end" } as const)[${value.code} as "left"]` });
  const align = (props: Props, name: string, fallback: string): Value => alignOf(props.get(name) ?? lit(fallback))!;
  /** A border's shorthand ("1px solid #BBBBBB") from today's width, style and color. */
  const line = (width: Value, style: Value | undefined, color: Value): Value =>
    joined([isLiteral(width) && width.code === undefined && px(width.literal) !== undefined ? `${px(width.literal)}px` : width, " ", style ?? "solid", " ", color]);
  /** A block today's components pad (an Image, a Button, ...) in a Column the new one sits in, with that padding. */
  const wrapped = (props: Props, block: string, alignment: Value | undefined, at: ts.Node) => {
    const m = phone(props, at);
    return element("Column", [
      styleAttr([["padding", n(padding(props))], ["alignItems", alignment]]),
      mobileAttr([["padding", n(m.get("containerPadding"))], ["alignItems", alignOf(m.get("textAlign"))]]),
      hidden(props),
    ], [block]);
  };

  // ─── Each of today's components ────────────────────────────────────────────

  function root(type: "Email" | "Page", props: Props, children: string[]) {
    const width = props.get("contentWidth");
    return element(type, [
      `width={${width ? (isLiteral(width) && px(width.literal) !== undefined ? px(width.literal) : code(width)) : 500}}`,
      type === "Email" && attr("previewText", props.get("previewText")),
      styleAttr([
        ["backgroundColor", color(props, "backgroundColor")],
        ["color", given(props, "textColor", "#000000")],
        ["fontFamily", font(props) ?? lit("arial,helvetica,sans-serif")],
      ]),
    ], children);
  }

  function row(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, body: number | undefined) {
    const layout = props.get("layout");
    const cells: number[] = (isLiteral(layout) && (layout.literal as { cells?: number[] })?.cells) || (isLiteral(props.get("cells")) && (props.get("cells") as { literal: number[] }).literal) || [1];
    const pad = props.get("padding");
    const p = isLiteral(pad) ? sides(pad.literal) : undefined;
    if (pad && !p) report.push(`${where(node)}: this Row's padding can't be read: it's kept as written, its sides inside the content (today's are outside it)`);
    const total = cells.reduce((sum, cell) => sum + cell, 0) || 1;
    const rowWidth = body !== undefined && (p || !pad) ? body - (p ? p[1] + p[3] : 0) : undefined;
    const columns = ts.isJsxElement(node) ? node.children.filter((c) => !(ts.isJsxText(c) && !c.text.trim())) : [];
    const isColumn = (c: ts.JsxChild): c is ts.JsxElement | ts.JsxSelfClosingElement => (ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)) && local.get(tagName(c)) === "Column";
    const columnProps = columns.map((c) => (isColumn(c) ? propsOf(opening(c)) : undefined));
    const stacks = !(isLiteral(props.get("noStackMobile")) && (props.get("noStackMobile") as { literal: unknown }).literal);
    // Today's stretch a Row's Columns to its height, so a line along the top or the bottom of each is one line across
    // the Row; the new email's Columns end with their content. A line every Column has is the Row's (and, where they
    // stack on phones, each Column's there).
    const shared: Partial<Record<"top" | "bottom", Value>> = {};
    if (cells.length > 1 && columnProps.length > 1 && columnProps.every(Boolean)) {
      for (const side of ["Top", "Bottom"] as const) {
        const lines = columnProps.map((c) => borderOf(c!, side));
        if (lines.every((l) => l && code(l) === code(lines[0]!))) shared[side.toLowerCase() as "top" | "bottom"] = lines[0]!;
      }
    }
    let index = 0;
    const outside = rowSides;
    rowSides = p ? p[1] + p[3] : 0;
    const written = columns.map((c) => {
      const at = index++;
      if (isColumn(c)) {
        const share = cells[at] ?? 1;
        const width = rowWidth !== undefined ? (share / total) * rowWidth : undefined;
        return column(c, columnProps[at]!, cells.length > 1 ? `${round((share / total) * 100)}%` : undefined, width, cells.length === 1 ? color(props, "columnsBackgroundColor") : undefined, stacks ? shared : {}, Object.keys(shared), cells.length === 1 && columnProps.filter(Boolean).length === 1);
      }
      return child(c);
    });
    const unshared = cells.length > 1 && columnProps.some((c) => c && (c.get("backgroundColor") || (["Top", "Right", "Bottom", "Left"] as const).some((side) => !shared[side.toLowerCase() as "top"] && borderOf(c, side))));
    rowSides = outside;
    if (unshared) report.push(`${where(node)}: today's stretch this Row's Columns to its height, the new email's end with their content: a Column's border or background may end higher than its neighbor's`);
    const rowBorder = Object.keys(shared).length ? { code: object(Object.entries(shared))!.slice(1, -1) } : undefined;
    // Today's side padding is outside the content (none of it shows in a wide window, and phones zero it): left out.
    const section = styleAttr([
      ["backgroundColor", color(props, "backgroundColor")],
      ["padding", p ? (p[0] || p[2] ? lit([p[0], 0, p[2], 0]) : undefined) : pad],
    ]);
    const inner =
      cells.length > 1
        ? [
            element("Row", [
              stacks ? undefined : "stackOnMobile={false}",
              styleAttr([["backgroundColor", color(props, "columnsBackgroundColor")], ["border", rowBorder]]),
              stacks && rowBorder ? mobileAttr([["border", { code: object(Object.keys(shared).map((side) => [side, lit("none")]))!.slice(1, -1) }]]) : undefined,
            ], written),
          ]
        : written;
    return element("Section", [section, hidden(props)], inner);
  }

  /** A Column's border on one side, as a line ("1px solid #BBBBBB"), or undefined where it has none. */
  function borderOf(props: Props, side: "Top" | "Right" | "Bottom" | "Left"): Value | undefined {
    const w = props.get(`border${side}Width`);
    if (!w || (isLiteral(w) && !px(w.literal))) return undefined;
    return line(w, props.get(`border${side}Style`), props.get(`border${side}Color`) ?? lit("#000000"));
  }

  /**
   * A Column. `phoneLines` are lines its Row draws on desktop, which it draws itself on phones (where it's stacked);
   * `rowLines` are the sides its Row draws, which it leaves out.
   */
  function column(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, width: string | undefined, columnWidth: number | undefined, background?: Value, phoneLines: Partial<Record<string, Value>> = {}, rowLines: string[] = [], alone = false) {
    const pad = props.get("padding");
    const p = isLiteral(pad) ? sides(pad.literal) : pad ? undefined : [0, 0, 0, 0];
    const borders: Array<[string, Value]> = [];
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const value = rowLines.includes(side.toLowerCase()) ? undefined : borderOf(props, side);
      if (value) borders.push([side.toLowerCase(), value]);
    }
    const place: Place = { column: columnWidth, room: columnWidth !== undefined && p ? columnWidth - p[1] - p[3] : undefined, outside: rowSides };
    const blocks = ts.isJsxElement(node) ? node.children.map((c) => child(c, place)).filter(Boolean) : [];
    const attributes = [
      styleAttr([
        ["width", width === undefined ? undefined : lit(width)],
        ["padding", p && p.every((side) => side === 0) ? undefined : pad],
        ["backgroundColor", color(props, "backgroundColor") ?? background],
        ["border", borders.length ? { code: object(borders)!.slice(1, -1) } : undefined],
        ["borderRadius", n(props.get("borderRadius"))],
      ]),
      columnPhone(props, node, phoneLines),
    ];
    // The only Column of a Row, with nothing of its own: its blocks are the Section's.
    if (alone && !attributes.some(Boolean)) return blocks.join("");
    return element("Column", attributes, blocks);
  }

  /** A Column's phone padding and borders. */
  function columnPhone(props: Props, at: ts.Node, lines: Partial<Record<string, Value>> = {}) {
    const m = phone(props, at);
    const border = m.get("border");
    const sides = Object.entries(lines) as Array<[string, Value]>;
    if (isLiteral(border) && border.literal && typeof border.literal === "object") {
      const b = border.literal as Record<string, unknown>;
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        const w = b[`border${side}Width`];
        if (w === undefined) continue;
        const at = sides.findIndex(([key]) => key === side.toLowerCase());
        if (at >= 0) sides.splice(at, 1);
        sides.push([side.toLowerCase(), px(w) ? line(lit(w), b[`border${side}Style`] === undefined ? undefined : lit(b[`border${side}Style`]), lit(b[`border${side}Color`] ?? "#000000")) : lit("none")]);
      }
    } else if (border) report.push(`${where(at)}: its phone border can't be read: it's left out`);
    return mobileAttr([["padding", n(m.get("padding"))], ["border", sides.length ? { code: object(sides)!.slice(1, -1) } : undefined]]);
  }

  /** A text block's phone settings: today's padding, font size, line height and alignment. */
  const textPhone = (props: Props, at: ts.Node) => {
    const m = phone(props, at);
    return mobileAttr([["padding", n(m.get("containerPadding"))], ["fontSize", n(m.get("fontSize"))], ["lineHeight", m.get("lineHeight")], ["textAlign", m.get("textAlign")]]);
  };

  function heading(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const type = props.get("headingType");
    const level = isLiteral(type) ? Number(String(type.literal).replace(/^h/, "")) || 1 : 1;
    if (type && !isLiteral(type)) report.push(`${where(node)}: headingType can't be read: it's a level 1 Heading`);
    const fontSize = given(props, "fontSize", "22px");
    return element("Heading", [
      level !== 1 && `level={${level}}`,
      styleAttr(textStyle(props, fontSize, "400", "140%", node)),
      textPhone(props, node),
      hidden(props),
    ], textChildren(node, props, node));
  }

  function textStyle(props: Props, fontSize: Value | undefined, weight: string | undefined, lineHeight: string, at: ts.Node): Array<[string, Value | undefined]> {
    return [
      ["padding", n(padding(props))],
      ["fontFamily", font(props)],
      ["fontSize", n(fontSize)],
      ["fontWeight", given(props, "fontWeight", weight === undefined ? undefined : Number(weight))],
      ["color", color(props, "color")],
      ["textAlign", props.get("textAlign")],
      ["lineHeight", given(props, "lineHeight", lineHeight)],
      ["letterSpacing", letterSpacing(props, fontSize, at)],
      ["textTransform", props.get("textTransform")],
    ];
  }

  function paragraph(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, tag: "Paragraph" | "Text") {
    const fontSize = given(props, "fontSize", "14px");
    return element(tag, [styleAttr(textStyle(props, fontSize, undefined, "140%", node)), textPhone(props, node), hidden(props)], textChildren(node, props, node));
  }

  function button(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const href = props.get("href");
    const fontSize = props.get("fontSize");
    const radius = props.get("borderRadius");
    const m = phone(props, node);
    const block = element("Button", [
      attr("href", href ?? lit("#")),
      styleAttr([
        ["width", isLiteral(props.get("width")) && (props.get("width") as { literal: unknown }).literal !== "auto" ? props.get("width") : undefined],
        ["backgroundColor", color(props, "backgroundColor")],
        ["color", color(props, "color")],
        ["fontFamily", font(props)],
        ["fontSize", n(fontSize)],
        ["fontWeight", props.get("fontWeight")],
        ["lineHeight", props.get("lineHeight")],
        ["letterSpacing", letterSpacing(props, fontSize, node)],
        ["padding", n(props.get("padding"))],
        ["borderRadius", n(radius)],
      ]),
      mobileAttr([["width", isLiteral(m.get("autoWidth")) && (m.get("autoWidth") as { literal: unknown }).literal === true ? undefined : n(m.get("width"))], ["fontSize", n(m.get("fontSize"))], ["lineHeight", m.get("lineHeight")], ["padding", n(m.get("padding"))]]),
    ], textChildren(node, props, node));
    if (!href) report.push(`${where(node)}: this Button has no href: it links to "#"`);
    return wrapped(props, block, align(props, "textAlign", "center"), node);
  }

  function image(at: ts.JsxElement | ts.JsxSelfClosingElement, props: Props, place: Place) {
    // Today's `{ url, width, height }` is the new one's `{ src, width, height }`.
    const src = props.get("src");
    let natural: unknown;
    let source: Value | undefined = src;
    const node = src && !isLiteral(src) && src.node ? bare(src.node) : undefined;
    if (isLiteral(src) && src.literal && typeof src.literal === "object") {
      const { url, width, height } = src.literal as Record<string, unknown>;
      natural = width;
      const asset = Object.fromEntries(Object.entries({ src: url, width, height }).filter(([, v]) => v !== undefined));
      source = { literal: asset, code: src.code && `{ ${Object.keys(asset).map((key) => `${key}: ${src.code}.${key === "src" ? "url" : key}`).join(", ")} }` };
    } else if (node && ts.isObjectLiteralExpression(node)) {
      const parts: string[] = [];
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) continue;
        const key = property.name.getText();
        const value = ts.isPropertyAssignment(property) ? valueOf(property.initializer) : { code: key };
        if (key === "width" && isLiteral(value)) natural = value.literal;
        if (key === "url" || key === "width" || key === "height") parts.push(`${key === "url" ? "src" : key}: ${code(value)}`);
      }
      source = { code: `{ ${parts.join(", ")} }` };
    }
    // An image as wide as its column: today's make it no wider than the column less the Row's side padding.
    const full = (): Array<[string, Value | undefined]> => (place.outside && place.column !== undefined ? [["width", lit("100%")], ["maxWidth", lit(round(place.column))]] : []);
    // Today's take the first width given (width, maxWidth, then the source's maxWidth and width) as the one to draw.
    const srcMax = isLiteral(src) && src.literal && typeof src.literal === "object" ? (src.literal as Record<string, unknown>).maxWidth : undefined;
    const width = props.get("width") ?? props.get("maxWidth") ?? (srcMax === undefined ? undefined : lit(srcMax)) ?? (natural === undefined ? undefined : lit(natural));
    let size: Array<[string, Value | undefined]> = [];
    const w = isLiteral(width) ? width.literal : undefined;
    const percentGiven = typeof w === "string" && /^\s*[\d.]+%\s*$/.test(w);
    if (width && !isLiteral(width)) {
      size = [["width", width]];
      report.push(`${where(at)}: this Image's width comes from an expression: it's kept as it is, but today's draw a width in px as a share of its column, so it may come out a little narrower or wider`);
    } else if (percentGiven && parseFloat(w as string) < 100) {
      size = [["width", lit(w)]];
    } else if (width === undefined || percentGiven) {
      size = full();
    } else if (px(w) !== undefined) {
      // Today's draw a width in px as a share of the column's room (its padding and the block's taken off), at most that
      // share of the column, and no wider than the room: written out, so the image is as wide as it was.
      const pad = sides(isLiteral(padding(props)) ? (padding(props) as { literal: unknown }).literal : undefined);
      if (place.column !== undefined && place.room !== undefined && pad) {
        const percent = round((px(w)! / (place.room - pad[1] - pad[3])) * 100);
        if (percent < 100) {
          size = [["width", lit(`${percent}%`)], ["maxWidth", lit(round((percent / 100) * place.column))]];
          report.push(`${where(at)}: today's draw this Image's ${String(w)} as ${percent}% of its column, at most ${round((percent / 100) * place.column)}px: that's written out so it doesn't move (give it its width in px to draw it at that)`);
        } else size = full();
      } else {
        size = [["width", lit(px(w))]];
        report.push(`${where(at)}: this Image is ${String(w)} wide, which today's draw as a share of a column whose size isn't known here: it may come out a little narrower or wider`);
      }
    }
    // Today's phone width: the column's (autoWidth), no wider than the image is; or the width given.
    const m = phone(props, at);
    const auto = m.get("autoWidth");
    const phoneSize: Array<[string, Value | undefined]> =
      isLiteral(auto) && auto.literal === true
        ? [["width", lit("100%")], ["maxWidth", typeof natural === "number" ? lit(natural) : size.some(([key]) => key === "maxWidth") ? lit("100%") : undefined]]
        : [["width", n(m.get("width"))], ["maxWidth", n(m.get("maxWidth"))]];
    const block = element("Image", [attr("src", source), attr("alt", props.get("altText") ?? props.get("alt")), styleAttr(size), mobileAttr(phoneSize)]);
    return wrapped(props, block, align(props, "textAlign", "center"), at);
  }

  function divider(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const border = line(props.get("borderTopWidth") ?? lit("1px"), props.get("borderTopStyle"), props.get("borderTopColor") ?? lit("#BBBBBB"));
    const width = props.get("width");
    const m = phone(props, node);
    const block = element("Divider", [
      styleAttr([["borderTop", border], ["width", isLiteral(width) && width.literal === "100%" ? undefined : n(width)], ["padding", n(padding(props))]]),
      mobileAttr([["padding", n(m.get("containerPadding"))], ["width", n(m.get("width"))]]),
      hidden(props),
    ]);
    return width && !(isLiteral(width) && width.literal === "100%") ? element("Column", [styleAttr([["alignItems", align(props, "textAlign", "center")]])], [block]) : block;
  }

  function social(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const icons = props.get("icons");
    // Today's `{ name, url }` icons are the new one's `{ name, href }`.
    const rename = (list: string) => `${list}.map(({ name, url }) => ({ name, href: url }))`;
    const list: Value | undefined =
      isLiteral(icons) && Array.isArray(icons.literal)
        ? { literal: (icons.literal as Array<{ name: string; url: string }>).map(({ name, url }) => ({ name, href: url })), code: icons.code && rename(icons.code) }
        : icons && { code: rename(code(icons)) };
    const block = element("Social", [
      attr("icons", list ?? lit([])),
      attr("iconType", props.get("iconType")),
      attr("size", n(props.get("iconSize"))),
      styleAttr([["gap", n(props.get("spacing"))], ["justifyContent", alignOf(props.get("align"))]]),
    ]);
    if (!icons) report.push(`${where(node)}: this Social has no icons`);
    return wrapped(props, block, undefined, node);
  }

  function menu(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const items = props.get("items");
    const fontSize = given(props, "fontSize", "14px");
    const m = phone(props, node);
    const block = element("Menu", [
      attr("items", items ?? lit([])),
      attr("separator", props.get("separator")),
      attr("layout", props.get("layout")),
      styleAttr([
        ["color", color(props, "linkColor")],
        ["separatorColor", color(props, "textColor")],
        ["fontFamily", font(props)],
        ["fontSize", n(fontSize)],
        ["fontWeight", props.get("fontWeight")],
        ["letterSpacing", letterSpacing(props, fontSize, node)],
        ["padding", n(props.get("padding"))],
        ["justifyContent", alignOf(props.get("align"))],
      ]),
      mobileAttr([["fontSize", n(m.get("fontSize"))], ["padding", n(m.get("padding"))]]),
    ]);
    report.push(`${where(node)}: today's Menu puts a space between its links on top of their padding (a few px); the new one spaces them by their padding alone`);
    return wrapped(props, block, undefined, node);
  }

  function video(node: ts.JsxElement | ts.JsxSelfClosingElement, props: Props) {
    const src = props.get("videoUrl") ?? props.get("url");
    if (!src) {
      report.push(`${where(node)}: this Video's link can't be read (give it videoUrl): it's left out`);
      return "";
    }
    return wrapped(props, element("Video", [attr("src", src)]), undefined, node);
  }

  // ─── The walk ──────────────────────────────────────────────────────────────

  function tagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
    return opening(node).tagName.getText();
  }
  function opening(node: ts.JsxElement | ts.JsxSelfClosingElement): ts.JsxOpeningLikeElement {
    return ts.isJsxElement(node) ? node.openingElement : node;
  }

  /** A child of today's component, as the new JSX (text, an expression with today's JSX inside it rewritten, or an element). */
  function child(node: ts.JsxChild, place: Place = {}): string {
    if (ts.isJsxText(node)) return node.text;
    if (ts.isJsxExpression(node)) return node.expression ? `{${rewrite(node.expression)}}` : node.getText();
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) return convert(node, place);
    return node.getText();
  }

  let body: number | undefined;
  /** The side padding of the Row being written. */
  let rowSides = 0;
  /** One of today's elements as the new JSX; another element as it is, today's elements inside it rewritten. */
  function convert(node: ts.JsxElement | ts.JsxSelfClosingElement, place: Place = {}): string {
    const name = local.get(tagName(node));
    if (!name) return rewrite(node);
    const props = propsOf(opening(node));
    const children = () => (ts.isJsxElement(node) ? node.children.map((c) => child(c, place)).filter(Boolean) : []);
    switch (name) {
      case "Email":
      case "Page": {
        const width = props.get("contentWidth");
        const outer = body;
        body = width ? (isLiteral(width) ? px(width.literal) : undefined) : 500;
        const out = root(name, props, children());
        body = outer;
        return out;
      }
      case "Row":
        return row(node, props, body);
      case "Column":
        return column(node, props, undefined, undefined);
      case "Heading":
        return heading(node, props);
      case "Paragraph":
      case "Text":
        return paragraph(node, props, name);
      case "Button":
        return button(node, props);
      case "Image":
        return image(node, props, place);
      case "Divider":
        return divider(node, props);
      case "Social":
        return social(node, props);
      case "Menu":
        return menu(node, props);
      case "Video":
        return video(node, props);
      default:
        report.push(`${where(node)}: <${name}> has no new component yet: it's left out (write it with the new components, or keep this template on today's API)`);
        return `{/* @unlayer/migrate: <${name}> isn't migrated: ${node.getText().replace(/\*\//g, "* /").slice(0, 120)}… */}`;
    }
  }

  /** Source text with today's JSX inside it rewritten. */
  function rewrite(node: ts.Node): string {
    const edits: Array<{ start: number; end: number; text: string }> = [];
    const visit = (n: ts.Node) => {
      if ((ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) && local.has(tagName(n))) {
        edits.push({ start: n.getStart(), end: n.getEnd(), text: convert(n) });
        return;
      }
      ts.forEachChild(n, visit);
    };
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && local.has(tagName(node))) return convert(node);
    ts.forEachChild(node, visit);
    let text = node.getText();
    const start = node.getStart();
    for (const edit of edits.sort((a, b) => b.start - a.start)) text = text.slice(0, edit.start - start) + edit.text + text.slice(edit.end - start);
    return text;
  }

  // The module: its imports of today's components replaced, its JSX rewritten.
  const edits: Array<{ start: number; end: number; text: string }> = [];
  for (const statement of file.statements) {
    if (imports.includes(statement as ts.ImportDeclaration)) continue;
    const text = rewrite(statement);
    if (text !== statement.getText()) edits.push({ start: statement.getStart(), end: statement.getEnd(), text });
  }
  const names = [...used].sort();
  const to = options.to ?? DEFAULT_TO;
  imports.forEach((statement, index) =>
    edits.push({
      start: statement.getStart(),
      end: statement.getEnd(),
      text:
        index === 0
          ? [names.length ? `import { ${names.join(", ")} } from ${JSON.stringify(to)};` : "", kept.length ? `import { ${kept.join(", ")} } from ${JSON.stringify((statement.moduleSpecifier as ts.StringLiteral).text)};` : ""].filter(Boolean).join("\n")
          : "",
    })
  );
  let out = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  return { code: await formatTsx(out), report };
}

/** Small Beefree templates for the converter's tests, built the way Beefree writes them (2.0.0 unless said). */

type Plain = Record<string, any>;

export const MODULE = (kind: string) => `mailup-bee-newsletter-modules-${kind}`;

export function module(kind: string, descriptor: Plain, extra: Plain = {}): Plain {
  return { type: MODULE(kind), uuid: `${kind}-uuid`, descriptor, ...extra };
}

export function column(modules: Plain[], grid = 12, style: Plain = {}, extra: Plain = {}): Plain {
  return {
    "grid-columns": grid,
    modules,
    style: { "background-color": "transparent", "padding-top": "0px", "padding-right": "0px", "padding-bottom": "0px", "padding-left": "0px", ...style },
    ...extra,
  };
}

export function row(columns: Plain[], options: { container?: Plain; content?: Plain; computed?: Plain; mobile?: Plain; extra?: Plain } = {}): Plain {
  return {
    type: "one-column-empty",
    container: { style: { "background-color": "transparent", ...options.container } },
    content: {
      style: { "background-color": "transparent", color: "#000000", width: "600px", ...options.content },
      computedStyle: { rowColStackOnMobile: true, ...options.computed },
      ...(options.mobile ? { mobileStyle: options.mobile } : {}),
    },
    columns,
    ...options.extra,
  };
}

export function page(rows: Plain[], options: { version?: string; body?: Plain; computed?: Plain; container?: Plain; webFonts?: Plain[]; head?: Plain } = {}): Plain {
  const version = options.version ?? "2.0.0";
  return {
    page: {
      title: "",
      description: "",
      template: { name: "template-base", type: "basic", version },
      ...(options.head ? { head: options.head } : {}),
      body: {
        type: version === "0.0.1" ? "mailup-bee-page-proprerties" : "mailup-bee-page-properties",
        container: { style: { "background-color": "#f5f5f5", ...options.container } },
        content: {
          style: { color: "#222222", "font-family": "Arial, 'Helvetica Neue', Helvetica, sans-serif", ...options.body },
          computedStyle: { linkColor: "#0068A5", messageBackgroundColor: "transparent", messageWidth: "600px", ...options.computed },
        },
        webFonts: options.webFonts ?? [],
      },
      rows,
    },
  };
}

/** A template holding one module, in one full-width column. */
export const single = (mod: Plain, options?: Parameters<typeof page>[1]) => page([row([column([mod])])], options);

/** The design's blocks, in order. */
export const blocks = (design: Plain): Plain[] => design.body.rows.flatMap((r: Plain) => r.columns.flatMap((c: Plain) => c.contents));

// The site's code theme: greyscale, so code reads by weight and brightness, not colour.
// Red and green only for deleted and inserted lines.
export const hyperTheme = {
  name: "hyper-mono",
  type: "dark",
  colors: {
    "editor.background": "#0e0e0e",
    "editor.foreground": "#bdbdbd",
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#5f5f5f", fontStyle: "italic" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#d6d6d6" } },
    { scope: ["constant.numeric", "constant.language", "constant.language.boolean"], settings: { foreground: "#d6d6d6" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new"], settings: { foreground: "#8c8c8c" } },
    { scope: ["entity.name.tag", "support.class.component", "entity.name.tag.tsx", "entity.name.tag.jsx"], settings: { foreground: "#ffffff" } },
    { scope: ["entity.other.attribute-name", "entity.other.attribute-name.tsx"], settings: { foreground: "#a3a3a3" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#ffffff" } },
    { scope: ["variable", "variable.other.readwrite", "meta.object-literal.key"], settings: { foreground: "#bdbdbd" } },
    { scope: ["support.type.property-name", "meta.object-literal.key string"], settings: { foreground: "#a3a3a3" } },
    { scope: ["entity.name.type", "support.type", "entity.name.class"], settings: { foreground: "#e0e0e0" } },
    { scope: ["punctuation", "meta.brace", "punctuation.section"], settings: { foreground: "#737373" } },
    { scope: ["markup.heading"], settings: { foreground: "#ffffff", fontStyle: "bold" } },
    { scope: ["markup.inserted"], settings: { foreground: "#7ee2a8" } },
    { scope: ["markup.deleted"], settings: { foreground: "#ff7b6e" } },
  ],
};

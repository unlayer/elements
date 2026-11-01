import {
  video,
  videoParts, asset, border, color, enumOf, flex, fontFaces, fontFamily, fontStack, fontWeight, insets, length, lineHeight, link, number, radius, text, type Kind } from "../src";

const value = (kind: Kind<any, any>, input: unknown) => {
  const parsed = kind.parse(input);
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.value;
};
const rejects = (kind: Kind<any, any>, input: unknown) => expect(kind.parse(input).ok).toBe(false);

describe("color", () => {
  it("normalizes hex, rgb and names", () => {
    expect(value(color(), "#ABC")).toBe("#aabbcc");
    expect(value(color(), "#0879A1")).toBe("#0879a1");
    expect(value(color(), "#0879a1ff")).toBe("#0879a1");
    expect(value(color(), "#00000080")).toBe("rgba(0, 0, 0, 0.502)");
    expect(value(color(), "rgb(8, 121, 161)")).toBe("#0879a1");
    expect(value(color(), "rgba(0,0,0,0.5)")).toBe("rgba(0, 0, 0, 0.5)");
    expect(value(color(), "rgba(0, 0, 0, 1)")).toBe("#000000");
    expect(value(color(), "RebeccaPurple")).toBe("rebeccapurple");
  });
  it("rejects what isn't a color", () => {
    for (const input of ["#12", "blu", "rgb(300, 0, 0)", "rgba(0,0,0,2)", "url(x)", "red; background: url(x)", 3]) rejects(color(), input);
  });
});

describe("length", () => {
  it("takes px as numbers and other units as strings", () => {
    expect(value(length(), 12)).toBe(12);
    expect(value(length(), "12px")).toBe(12);
    expect(value(length(), "12")).toBe(12);
    expect(value(length(["px", "%"]), "50%")).toBe("50%");
  });
  it("rejects units the property doesn't take, and negatives", () => {
    rejects(length(), "50%");
    rejects(length(), -1);
    rejects(length(), "1em");
    rejects(length(), "calc(100% - 2px)");
    expect(value(length(["px"], { min: -100 }), -2)).toBe(-2);
  });
});

describe("insets", () => {
  it("reads every form into four sides", () => {
    const all = { top: 8, right: 8, bottom: 8, left: 8 };
    expect(value(insets(), 8)).toEqual(all);
    expect(value(insets(), "8px")).toEqual(all);
    expect(value(insets(), "8px 16px")).toEqual({ top: 8, right: 16, bottom: 8, left: 16 });
    expect(value(insets(), "1px 2px 3px")).toEqual({ top: 1, right: 2, bottom: 3, left: 2 });
    expect(value(insets(), [1, 2, 3, 4])).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
    expect(value(insets(), { top: 4 })).toEqual({ top: 4, right: 0, bottom: 0, left: 0 });
  });
  it("rejects percentages, extra sides and too many values", () => {
    rejects(insets(), "10%");
    rejects(insets(), [1, 2, 3, 4, 5]);
    rejects(insets(), { inline: 4 });
  });
});

describe("border", () => {
  const side = { width: 1, style: "solid", color: "#cccccc" };
  it("reads a CSS shorthand, a side for all sides, and sides", () => {
    expect(value(border(), "1px solid #ccc")).toEqual({ top: side, right: side, bottom: side, left: side });
    expect(value(border(), { color: "#ccc" })).toEqual({ top: side, right: side, bottom: side, left: side });
    expect(value(border(), { bottom: "2px dashed rgba(0, 0, 0, 0.5)" })).toEqual({ bottom: { width: 2, style: "dashed", color: "rgba(0, 0, 0, 0.5)" } });
  });
  it("rejects unknown words and mixed forms", () => {
    rejects(border(), "1px groove #ccc");
    rejects(border(), { top: "1px solid red", width: 2 });
  });
});

describe("radius", () => {
  it("is one number when every corner is the same", () => {
    expect(value(radius(), "4px")).toBe(4);
    expect(value(radius(), [4, 4, 4, 4])).toBe(4);
    expect(value(radius(), { topLeft: 4, topRight: 4 })).toEqual({ topLeft: 4, topRight: 4, bottomRight: 0, bottomLeft: 0 });
  });
});

describe("fonts", () => {
  it("takes a font stack, and points a web font to the root's fonts", () => {
    expect(value(fontFamily(), " Inter, Arial, sans-serif ")).toBe("Inter, Arial, sans-serif");
    expect(fontFamily().parse({ name: "Inter", src: "https://fonts.example.com/inter.woff2" })).toMatchObject({ ok: false, message: expect.stringContaining("root's fonts") });
    expect(fontStack(`'Brand Sans', "Other", Arial ,sans-serif`)).toEqual(["Brand Sans", "Other", "Arial", "sans-serif"]);
  });
  it("takes web fonts: a family's file for each weight and style", () => {
    expect(
      value(fontFaces(), [
        { family: " Inter ", src: "https://fonts.example.com/inter-400.woff2", weight: "normal" },
        { family: "Inter", src: "https://fonts.example.com/inter-700.woff2", weight: 700, style: "italic", format: "woff2" },
        { family: "Inter Variable", src: "data:font/woff2;base64,AAAA", weight: "100 900" },
      ])
    ).toEqual([
      { family: "Inter", src: "https://fonts.example.com/inter-400.woff2", weight: 400 },
      { family: "Inter", src: "https://fonts.example.com/inter-700.woff2", weight: 700, style: "italic", format: "woff2" },
      { family: "Inter Variable", src: "data:font/woff2;base64,AAAA", weight: [100, 900] },
    ]);
  });
  it("rejects what would break out of CSS", () => {
    rejects(fontFamily(), "Arial; } body { color: red");
    rejects(fontFaces(), [{ family: "Inter", src: "javascript:alert(1)" }]);
    rejects(fontFaces(), [{ family: "Inter", src: "data:text/html,<script>x</script>" }]);
    rejects(fontFaces(), [{ family: "In</style>", src: "https://x.test/a.woff2" }]);
    rejects(fontFaces(), [{ family: "Inter, Arial", src: "https://x.test/a.woff2" }]);
    rejects(fontFaces(), [{ family: "Inter", src: "https://x.test/a.woff2", weight: "900 100" }]);
    rejects(fontFaces(), [{ family: "Inter", src: "https://x.test/a.woff2", format: "eot" }]);
    rejects(fontFaces(), [{ family: "Inter", src: "https://x.test/a.woff2", unicodeRange: "U+0000" }]);
  });
  it("reads weights and line heights", () => {
    expect(value(fontWeight(), "bold")).toBe(700);
    rejects(fontWeight(), 450);
    expect(value(lineHeight(), 1.5)).toBe(1.5);
    expect(value(lineHeight(), "150%")).toBe(1.5);
    expect(value(lineHeight(), "24px")).toBe("24px");
    rejects(lineHeight(), "1.5");
    rejects(lineHeight(), 0);
  });
});

describe("links and images", () => {
  it("keeps safe URLs and merge tags", () => {
    expect(value(link(), "https://example.com")).toBe("https://example.com");
    expect(value(link(), "mailto:hi@example.com")).toBe("mailto:hi@example.com");
    expect(value(link(), "{{unsubscribe_url}}")).toBe("{{unsubscribe_url}}");
    expect(value(link(), { href: "/docs", target: "_blank" })).toEqual({ href: "/docs", target: "_blank" });
    expect(value(asset(), { src: "https://example.com/a.png", width: 120 })).toEqual({ src: "https://example.com/a.png", width: 120 });
    expect(value(asset(), "data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });
  it("rejects scripts, data and files, however they're written", () => {
    for (const input of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "java\nscript:alert(1)", "data:text/html,<b>", "vbscript:x", "file:///etc/passwd"]) rejects(link(), input);
    rejects(asset(), "data:text/html;base64,AAAA");
    rejects(asset(), "javascript:alert(1)");
    rejects(link(), { href: "https://example.com", target: "_top" });
  });
});

describe("the other kinds", () => {
  it("checks choices, numbers, text and flex", () => {
    expect(value(enumOf(["a", "b"]), "a")).toBe("a");
    rejects(enumOf(["a", "b"]), "c");
    expect(value(number({ min: 0, max: 1 }), 0.5)).toBe(0.5);
    rejects(number({ integer: true }), 0.5);
    rejects(text({ maxLength: 2 }), "abc");
    expect(value(flex(), "none")).toBe("none");
    rejects(flex(), -1);
  });
});

describe("video()", () => {
  it("takes a YouTube or Vimeo link and works out its player and, for YouTube, its thumbnail, without the network", () => {
    for (const url of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ&t=1", "https://youtube.com/shorts/dQw4w9WgXcQ"]) {
      expect(video().parse(url)).toEqual({ ok: true, value: url });
      expect(videoParts(url)).toEqual({ provider: "youtube", id: "dQw4w9WgXcQ", embed: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" });
    }
    expect(videoParts("https://vimeo.com/76979871")).toEqual({ provider: "vimeo", id: "76979871", embed: "https://player.vimeo.com/video/76979871" });
    for (const url of ["http://youtu.be/dQw4w9WgXcQ", "https://example.com/v.mp4", "javascript:alert(1)", 42]) expect(video().parse(url).ok).toBe(false);
  });
});


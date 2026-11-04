import { describe, expect, it } from "vitest";
import { heads } from "@unlayer/exporters";
import {
  buttonHover,
  dividerLength,
  documentBodyPicture,
  fontOfValues,
  imageBox,
  imagePadding,
  outlookCopy,
  ownMarkupCss,
  pageBodyColor,
  pageMargin,
  pictureCss,
  pictureOf,
  rowColorInEmail,
  rowOffsetInEmail,
  rowPaddingInEmail,
  spaceBeforeTag,
  textTransformOfText,
} from "./quirks";

describe("legacy's quirks, drawn as legacy draws them", () => {
  it("leaves a row's sides out in an email, where legacy writes them outside the content", () => {
    expect(rowPaddingInEmail({ top: 20, right: 40, bottom: 10, left: 40 })).toEqual({ top: 20, right: 0, bottom: 10, left: 0 });
  });

  it("sits a row off centre in an email by the difference of its sides, on the side with more", () => {
    expect(rowOffsetInEmail({ top: 0, right: 10, bottom: 0, left: 40 })).toEqual({ left: 30 });
    expect(rowOffsetInEmail({ top: 0, right: 40, bottom: 0, left: 10 })).toEqual({ right: 30 });
    expect(rowOffsetInEmail({ top: 5, right: 10, bottom: 5, left: 10 })).toBeUndefined();
  });

  it("reads a background picture as legacy's exporters do", () => {
    const url = "https://example.com/bg.png";
    expect(pictureOf({ url: "" }, "web")).toBeUndefined();
    expect(pictureOf({ url }, "web")).toEqual({ url, repeat: "no-repeat", position: undefined, size: undefined, tile: false });
    // `true` isn't a repeat CSS reads: the browser's default, which repeats; Outlook tiles it.
    expect(pictureOf({ url, repeat: true }, "web")).toMatchObject({ repeat: undefined, tile: true });
    expect(pictureOf({ url, repeat: "repeat-x" }, "web")).toMatchObject({ repeat: "repeat-x", tile: true });
    for (const [position, css] of [["top", "left top"], ["center", "center center"], ["right-bottom", "right bottom"], ["center-top", "center top"], ["nowhere", undefined]]) expect(pictureOf({ url, position }, "web")?.position).toBe(css);
    expect(pictureOf({ url, position: "custom", customPosition: ["10%", null] }, "web")?.position).toBe("10% auto");
    expect(pictureOf({ url, size: "cover" }, "web")?.size).toBe("cover");
    expect(pictureOf({ url, size: "custom", customSize: ["100px", null] }, "web")?.size).toBe("100px auto");
    // An email has no size.
    expect(pictureOf({ url, size: "cover", position: "center" }, "email")).toMatchObject({ size: undefined, position: "center center" });
    // What can't be written in CSS isn't.
    expect(pictureOf({ url, repeat: "repeat;}", position: "custom", customPosition: ["1px;}"] }, "web")).toMatchObject({ repeat: undefined, position: undefined });
  });

  it("reads a printed document's body's picture by its flags alone", () => {
    const url = "https://example.com/bg.png";
    expect(documentBodyPicture({ url, repeat: "no-repeat", position: "center", size: "cover" })).toEqual({ url, repeat: "repeat", position: "left top", size: undefined, tile: true });
    expect(documentBodyPicture({ url, center: true, cover: true })).toEqual({ url, repeat: "no-repeat", position: "center top", size: "cover", tile: false });
    expect(documentBodyPicture({ url: "" })).toBeUndefined();
  });

  it("writes a picture's rule so what its URL holds can't end the string or the stylesheet", () => {
    expect(pictureCss({ url: "data:image/png;base64,AA==", repeat: "repeat", position: "left top", size: "cover", tile: true })).toBe('background-image: url("data:image/png;base64,AA=="); background-repeat: repeat; background-position: left top; background-size: cover');
    expect(pictureCss({ url: 'x"</style>\\', tile: false })).toBe('background-image: url("x%22%3C/style%3E%5C")');
  });

  it("keeps the browser's 8px margin around a page", () => {
    expect(pageMargin()).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
  });

  it("draws a text block's letter case as written", () => {
    expect(textTransformOfText("uppercase")).toBeUndefined();
  });

  it("reads a block's font only as { label, value }", () => {
    expect(fontOfValues({ label: "Georgia", value: "Georgia, serif" })).toBe("Georgia, serif");
    expect(fontOfValues("Georgia, serif")).toBeUndefined();
  });

  it("draws no line for a divider whose length is the builder's { width, autoWidth }", () => {
    expect(dividerLength({ width: "100%", autoWidth: false })).toBe(0);
    expect(dividerLength("60%")).toBe("60%");
  });

  it("makes the first non-breaking space between a word and a tag a plain space", () => {
    expect(spaceBeforeTag("A&nbsp;<b>B</b>&nbsp;<i>C</i>")).toBe("A <b>B</b>&nbsp;<i>C</i>");
  });

  it("changes a button's colors under the pointer on a page, not in an email", () => {
    const colors = { hoverColor: "#fff", hoverBackgroundColor: "#000" };
    expect(buttonHover("web", colors)).toEqual({ color: "#fff", backgroundColor: "#000" });
    expect(buttonHover("email", colors)).toBeUndefined();
  });

  it("draws an image without the border, corners and background its props give it", () => {
    expect(imageBox({ borderWidth: "2px", borderStyle: "solid", borderColor: "#000", borderRadius: "8px", backgroundColor: "#eee" })).toEqual({});
  });

  it("sizes an image without its block's default padding, where its props don't give one", () => {
    expect(imagePadding({ containerPadding: "10px" }, {})).toBe("0px");
    expect(imagePadding({ containerPadding: "10px" }, { containerPadding: "16px" })).toBe("16px");
  });

  it("counts an email image twice in plain text where it knows its height (its Outlook copy)", () => {
    expect(outlookCopy({ url: "https://example.com/a.png", width: 600, height: 300 })).toBe(true);
    expect(outlookCopy({ url: "https://example.com/a.png", width: 600 })).toBe(false);
  });

  it("draws an email row's translucent background as none", () => {
    expect(rowColorInEmail("rgba(0, 0, 0, 0.5)")).toBeUndefined();
    expect(rowColorInEmail("rgba(0, 0, 0, 1)")).toBe("rgba(0, 0, 0, 1)");
    expect(rowColorInEmail("#ffffff")).toBe("#ffffff");
  });

  it("draws a page's text and background colors that aren't hex or rgb() as black on white", () => {
    expect(pageBodyColor("red", "#000000")).toBe("#000000");
    expect(pageBodyColor("hsl(0, 100%, 50%)", "#ffffff")).toBe("#ffffff");
    expect(pageBodyColor("rgba(0, 0, 0, 0.5)", "#ffffff")).toBe("rgba(0, 0, 0, 0.5)");
    expect(pageBodyColor("#123456", "#000000")).toBe("#123456");
  });

  it("gives a user's own markup, as legacy's stylesheet does, an email's text color on tables, a document's printed backgrounds and `.content`", () => {
    expect(ownMarkupCss("email", { textColor: "#333333" })).toBe("table, td { color: #333333; }");
    expect(ownMarkupCss("web", { textColor: "#333333" })).toBe("");
    const document = ownMarkupCss("document", { textColor: "#333333", backgroundColor: "#eeeeee", fontFamily: { value: "georgia,serif" } });
    expect(document).toContain("body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }");
    expect(document).toContain(".content { width: 100%; font-family: georgia,serif; font-size: 15px; color: #333333; background-color: #eeeeee; -webkit-print-color-adjust: exact; }");
    expect(ownMarkupCss("document", { fontFamily: { value: "x}</style>" } })).not.toContain("</style>");
  });

  it("takes the colors the closed Body head takes, and its defaults for others", () => {
    const meta = (displayMode: string) => ({ displayMode, isViewer: false, variant: null, type: "rows", headConfig: { hasFeature: () => false, getInitialValues: () => ({}) } });
    const closed = (mode: string, values: Record<string, unknown>) => heads.Body.css({ ...values, _meta: { htmlID: "u_body" } }, values, meta(mode)) as string;
    const declared = (css: string, selector: RegExp, property: string) => new RegExp(`${selector.source}[^}]*?\\b${property}: ([^;]*);`).exec(css)?.[1].trim();
    for (const value of [undefined, "", "#333", "#3334", "#333333", "#33333333", "#12345", "red", "rgb(1,2,3)", "rgb( 1 , 2 , 3 )", "RGB(1,2,3)", "rgb(300,0,0)", "rgb(1,2,3,.5)", "rgba(1,2,3,.5)", "rgba(1,2,3)", "rgba(1,2,3,2)", "rgb(10%,0%,0%)", "transparent", " #333 ", "hsl(0,0%,0%)", "#333;}</style>"]) {
      expect(declared(ownMarkupCss("email", { textColor: value }), /table, td \{/, "color"), `text ${value}`).toBe(declared(closed("email", { textColor: value }), /table, td \{/, "color"));
      const page = { textColor: value, backgroundColor: value, fontFamily: { value: "georgia,serif" } };
      for (const property of ["font-family", "font-size", "color", "background-color"]) {
        expect(declared(ownMarkupCss("document", page), /\.content \{/, property), `${property} ${value}`).toBe(declared(closed("document", page), /\.content \{/, property));
      }
    }
  });
});

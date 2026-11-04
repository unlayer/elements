import { describe, expect, it } from "vitest";
import { createElement } from "react";
import * as current from "../index";
import * as previous from "@unlayer/react-elements-previous";
import {
  buttonHover,
  dividerLength,
  documentBodyPicture,
  fontOfValues,
  imageBox,
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
    // As 0.2.1's stylesheet reads each, as it's given.
    for (const color of ["#333", "#3334", "#333333", "#33333333", "rgb(1,2,3)", "rgb( 1 , 2 , 3 )", "RGB(1,2,3)", "rgba(1,2,3,.5)", "transparent"]) expect(pageBodyColor(color, "#000000"), color).toBe(color);
    expect(pageBodyColor(" #333 ", "#000000").trim()).toBe("#333");
    for (const other of [undefined, "", "#12345", "red", "rgb(300,0,0)", "rgb(1,2,3,.5)", "rgba(1,2,3)", "rgba(1,2,3,2)", "rgb(10%,0%,0%)", "hsl(0,0%,0%)", "#333;}</style>"]) {
      expect(pageBodyColor(other, "#000000"), other).toBe("#000000");
      expect(pageBodyColor(other, "#ffffff"), other).toBe("#ffffff");
    }
  });

  it("gives a user's own markup, as legacy's stylesheet does, an email's text color on tables, a document's printed backgrounds and `.content`", () => {
    expect(ownMarkupCss("email", { textColor: "#333333" })).toBe("table, td { color: #333333; }");
    expect(ownMarkupCss("web", { textColor: "#333333" })).toBe("");
    const document = ownMarkupCss("document", { textColor: "#333333", backgroundColor: "#eeeeee", fontFamily: { value: "georgia,serif" } });
    expect(document).toContain("body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }");
    expect(document).toContain(".content { width: 100%; font-family: georgia,serif; font-size: 15px; color: #333333; background-color: #eeeeee; -webkit-print-color-adjust: exact; }");
    expect(ownMarkupCss("document", { fontFamily: { value: "x}</style>" } })).not.toContain("</style>");
  });

  it("takes the colors 0.2.1's stylesheet takes, and its defaults for others, in a template with markup of its own", () => {
    // None at all is the body's defaults' to fill in, in a render.
    expect(ownMarkupCss("email", {})).toBe("table, td { color: #000000; }");
    expect(ownMarkupCss("document", {})).toContain(".content { width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #000000; background-color: #ffffff;");
    const head = (release: any, root: "Email" | "Document", values: Record<string, unknown>) => release.renderToHtmlParts(createElement(release[root], values, createElement(release.Row, null, createElement(release.Column, null, createElement(release.Html, { html: "<b>Mine</b>" }))))).css as string;
    const declared = (css: string, selector: RegExp, property: string) => new RegExp(`${selector.source}[^}]*?\\b${property}: ([^;]*);`).exec(css)?.[1].trim();
    for (const value of ["", "#333", "#3334", "#333333", "#33333333", "#12345", "red", "rgb(1,2,3)", "rgb( 1 , 2 , 3 )", "RGB(1,2,3)", "rgb(300,0,0)", "rgb(1,2,3,.5)", "rgba(1,2,3,.5)", "rgba(1,2,3)", "rgba(1,2,3,2)", "rgb(10%,0%,0%)", "transparent", " #333 ", "hsl(0,0%,0%)", "#333;}</style>"]) {
      const text = { textColor: value };
      expect(declared(head(previous, "Email", text), /table, td \{/, "color"), `0.2.1's rule for ${value}`).toBeDefined();
      expect(declared(head(current, "Email", text), /table, td \{/, "color"), `text ${value}`).toBe(declared(head(previous, "Email", text), /table, td \{/, "color"));
      const page = { textColor: value, backgroundColor: value, fontFamily: { value: "georgia,serif" } };
      for (const property of ["font-family", "font-size", "color", "background-color"]) {
        expect(declared(head(current, "Document", page), /\.content \{/, property), `${property} ${value}`).toBe(declared(head(previous, "Document", page), /\.content \{/, property));
      }
    }
  });
});

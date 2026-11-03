import { describe, expect, it } from "vitest";
import {
  buttonHover,
  dividerLength,
  fontOfValues,
  imageBox,
  imagePadding,
  outlookCopy,
  pageBodyColor,
  pageMargin,
  rowColorInEmail,
  rowPaddingInEmail,
  spaceBeforeTag,
  textTransformOfText,
} from "./quirks";

describe("legacy's quirks, drawn as legacy draws them", () => {
  it("leaves a row's sides out in an email, where legacy writes them outside the content", () => {
    expect(rowPaddingInEmail({ top: 20, right: 40, bottom: 10, left: 40 })).toEqual({ top: 20, right: 0, bottom: 10, left: 0 });
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
});

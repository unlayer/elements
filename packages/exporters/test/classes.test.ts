import { Stylesheet } from "../src";

describe("the stylesheet", () => {
  it("writes a layout's rules before a node's own, whatever order they're made in, so what the author set on the node wins", () => {
    const sheet = new Stylesheet();
    const own = sheet.classFor("phone", "&{width:50%!important}");
    const layout = sheet.classFor("phone", "&>*{width:auto!important}", "layout");
    const hover = sheet.classFor("all", "&:hover{color:red!important}", "hover");
    const plain = sheet.classFor("all", "&{color:blue}");
    expect(sheet.css("@media (max-width: 480px)", "@media (min-width: 481px)")).toBe(
      `.${plain}{color:blue}.${hover}:hover{color:red!important}@media (max-width: 480px){.${layout}>*{width:auto!important}.${own}{width:50%!important}}`
    );
  });

  it("writes a device's rules under their own query, after a phone's; with none of their own, under a phone's", () => {
    const sheet = new Stylesheet();
    const phone = sheet.classFor("phone", "&{color:red}");
    const device = sheet.classFor("device", "&{color:blue}");
    expect(sheet.css("@media (max-width: 620px)", "@media (min-width: 621px)", "@media (max-width: 480px)")).toBe(`@media (max-width: 620px){.${phone}{color:red}}@media (max-width: 480px){.${device}{color:blue}}`);
    expect(sheet.css("@media (max-width: 480px)", "@media (min-width: 481px)")).toBe(`@media (max-width: 480px){.${phone}{color:red}}@media (max-width: 480px){.${device}{color:blue}}`);
    expect(sheet.css(null, null)).toBe("");
  });

  it("names a rule after its content: the same rule, the same class", () => {
    const sheet = new Stylesheet();
    expect(sheet.classFor("phone", "&{display:none!important}")).toBe(sheet.classFor("phone", "&{display:none!important}"));
    expect(new Stylesheet().classFor("phone", "&{display:none!important}")).toBe(sheet.classFor("phone", "&{display:none!important}"));
  });
});

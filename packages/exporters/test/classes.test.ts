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

  it("names a rule after its content: the same rule, the same class", () => {
    const sheet = new Stylesheet();
    expect(sheet.classFor("phone", "&{display:none!important}")).toBe(sheet.classFor("phone", "&{display:none!important}"));
    expect(new Stylesheet().classFor("phone", "&{display:none!important}")).toBe(sheet.classFor("phone", "&{display:none!important}"));
  });
});

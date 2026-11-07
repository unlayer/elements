// Elements in Jest's jsdom environment, as an app's tests use it (CommonJS, Jest's own module registry): 0.2.0's
// first build threw when it was imported there ("TextEncoder is not defined"), where 0.1.22 rendered.
const React = require("react");
const { renderToString } = require("react-dom/server");
const { Email, Text, render } = require("@hyper-elements/react");
const { toDesign } = require("@hyper-elements/react/builder");

const h = React.createElement;
const email = h(Email, null, h(Text, null, "Hello jest"));

test("renders an email and its design", async () => {
  expect((await render(email)).html).toContain("Hello jest");
  expect(toDesign(email).design.body.rows).toHaveLength(1);
});

test("works out a design inside a page's react-dom/server render, and the page's hooks keep working", () => {
  function Page() {
    const rows = React.useMemo(() => toDesign(email).design.body.rows.length, []);
    const [open] = React.useState(false);
    return h("pre", null, `${rows} rows, open=${open}`);
  }
  expect(renderToString(h(Page))).toBe("<pre>1 rows, open=false</pre>");
});

test("the main entry is the new components, and today's aren't in the package", () => {
  const main = require("@hyper-elements/react");
  expect(typeof main.render).toBe("function");
  expect(main.renderToHtml).toBeUndefined();
  expect(() => require("@hyper-elements/react/legacy")).toThrow();
});

test("renders a template in the new components, and takes it to the builder's design (/builder)", async () => {
  const {Email, Heading, Text, render} = require("@hyper-elements/react");
  const { toDesign } = require("@hyper-elements/react/builder");
  const template = h(Email, null, h(Heading, null, "Hello jest"), h(Text, null, "New components"));
  const { html, text } = await render(template);
  expect(html).toContain("Hello jest");
  expect(text).toContain("New components");
  expect(toDesign(template).design.body.rows.length).toBeGreaterThan(0);
});

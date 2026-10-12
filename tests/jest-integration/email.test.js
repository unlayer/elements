// Elements in Jest's jsdom environment, as an app's tests use it (CommonJS, Jest's own module registry): 0.2.0's
// first build threw when it was imported there ("TextEncoder is not defined"), where 0.1.22 rendered.
const React = require("react");
const { renderToString } = require("react-dom/server");
const { Email, Row, Column, Paragraph, renderToHtml, renderToJson } = require("@unlayer/react-elements");

const h = React.createElement;
const email = h(Email, null, h(Row, null, h(Column, null, h(Paragraph, null, "Hello jest"))));

test("renders an email and its design", () => {
  expect(renderToHtml(email)).toContain("Hello jest");
  expect(renderToJson(email).body.rows).toHaveLength(1);
});

test("works out a design inside a page's react-dom/server render, and the page's hooks keep working", () => {
  // Elements loads another of react-dom's modules with Jest's require, so it renders with the test's React.
  function Page() {
    const rows = React.useMemo(() => renderToJson(email).body.rows.length, []);
    const [open] = React.useState(false);
    return h("pre", null, `${rows} rows, open=${open}`);
  }
  expect(renderToString(h(Page))).toBe("<pre>1 rows, open=false</pre>");
});

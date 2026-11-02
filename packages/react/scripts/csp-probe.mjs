#!/usr/bin/env node
// Run with: node --disallow-code-generation-from-strings scripts/csp-probe.mjs
//
// CSP safety gate for @unlayer/react-elements.
//
// renderToHtml() pulls in @unlayer/exporters. If any reachable code evaluates a
// string (eval / new Function) at import or render time, a strict
// Content-Security-Policy without 'unsafe-eval' blocks it and the package throws
// in browsers, iframes, and CSP'd SSR — before any render runs. V8's
// --disallow-code-generation-from-strings is the engine-level equivalent of such
// a CSP, so importing + rendering the built bundle under it proves the shipped
// output is CSP-safe.
//
// This is a HARD gate. It fails if importing or rendering the built `dist/`
// evaluates a string anywhere — whether in this package's own code OR in its
// pinned @unlayer/exporters dependency. It will stay red until the workspace
// catalog pins an @unlayer/exporters release that precompiles its templates
// (no `new Function` at import / render). That is intentional: a green check
// must mean "@unlayer/react-elements is genuinely CSP-safe."

const CSP_ERROR = /Code generation from strings disallowed/;

try {
  const React = (await import('react')).default;
  const {
    renderToHtml,
    renderToPlainText,
    Body,
    Row,
    Column,
    Button,
    Heading,
    Image,
    Divider,
    Paragraph,
    Html,
    Social,
    Menu,
    Video,
    Table,
    ColumnLayouts,
  } = await import('../dist/index.js');

  // Exercise every component, including the template-backed paths (links, menu,
  // social) that historically compiled lodash templates at render time.
  const tree = React.createElement(
    Body,
    null,
    React.createElement(
      Row,
      { layout: ColumnLayouts.OneColumn },
      React.createElement(
        Column,
        null,
        React.createElement(Heading, { mode: 'web' }, 'Heading'),
        React.createElement(Paragraph, { mode: 'web' }, 'Paragraph'),
        React.createElement(Button, { mode: 'web', href: 'https://example.com' }, 'Button'),
        React.createElement(Divider, { mode: 'web' }),
        React.createElement(Video, {
          mode: 'web',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        }),
        React.createElement(Image, { mode: 'web', src: { url: 'https://example.com/i.png' } }),
        React.createElement(Table, { mode: 'web' }),
        React.createElement(Social, {
          mode: 'web',
          icons: [{ name: 'Facebook', url: 'https://example.com' }],
        }),
        React.createElement(Menu, {
          mode: 'web',
          items: [{ text: 'Home', link: { name: 'web', values: { href: 'https://example.com' } } }],
        }),
        React.createElement(Html, { mode: 'web' }, React.createElement('p', null, 'x')),
      ),
    ),
  );

  for (const mode of ['web', 'email', 'document']) {
    const html = renderToHtml(tree, { mode });
    if (typeof html !== 'string' || html.length === 0) {
      console.error(`CSP_FAIL: renderToHtml(${mode}) produced no output`);
      process.exit(2);
    }
  }
  renderToPlainText(tree);

  // The new components (/primitives) in each of their roots, and the builder's design (/builder) both ways.
  const p = await import('../dist/primitives.js');
  const { toDesign, fromDesign } = await import('../dist/builder.js');
  const h = React.createElement;
  const content = () => [
    h(p.Heading, { key: 'h' }, 'Heading'),
    h(p.Paragraph, { key: 'p' }, 'Words ', h(p.Link, { href: 'https://example.com' }, 'a link'), h(p.MergeTag, { name: 'first_name' })),
    h(p.Row, { key: 'r' }, h(p.Column, null, h(p.Text, null, 'Left')), h(p.Column, null, h(p.Text, null, 'Right'))),
    h(p.List, { key: 'l' }, h(p.ListItem, null, 'An item')),
    h(p.Table, { key: 't' }, h(p.TableRow, null, h(p.TableCell, null, 'A cell'))),
    h(p.Button, { key: 'b', href: 'https://example.com' }, 'Button'),
    h(p.Menu, { key: 'm', items: [{ text: 'Home', href: 'https://example.com' }] }),
    h(p.Social, { key: 's', icons: [{ name: 'Facebook', href: 'https://example.com' }] }),
    h(p.Video, { key: 'v', src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
  ];
  for (const root of [h(p.Email, null, content()), h(p.Page, null, content()), h(p.Document, null, content()), h(p.Canvas, { width: 600, height: 900 }, content())]) {
    const { html, text } = await p.render(root);
    if (!html || !text) {
      console.error('CSP_FAIL: the new components rendered no output');
      process.exit(2);
    }
  }
  fromDesign(toDesign(h(p.Email, null, content())).design);

  console.info(
    `CSP_OK: @unlayer/react-elements imports + renders every component (web / ` +
      `email / document / plaintext), and the new components in every root and to the builder and back, under ` +
      `strict CSP — no eval / new Function`,
  );
} catch (err) {
  const message = String((err && err.message) || err);
  if (CSP_ERROR.test(message)) {
    console.error(
      `CSP_FAIL: @unlayer/react-elements (or its pinned @unlayer/exporters ` +
        `dependency) evaluates a string (eval / new Function) at import or render — ` +
        `it would throw under a Content-Security-Policy without 'unsafe-eval'.\n${message}`,
    );
  } else {
    console.error(`CSP probe failed to run: ${message}`);
  }
  process.exit(3);
}

#!/usr/bin/env node
// Run with: node --disallow-code-generation-from-strings scripts/csp-probe.mjs
//
// CSP safety gate for @hyper-elements/react.
//
// If any code render() or the builder adapter reaches evaluates a string (eval /
// new Function) at import or render time, a strict
// Content-Security-Policy without 'unsafe-eval' blocks it and the package throws
// in browsers, iframes, and CSP'd SSR — before any render runs. V8's
// --disallow-code-generation-from-strings is the engine-level equivalent of such
// a CSP, so importing + rendering the built bundles under it proves the shipped
// output is CSP-safe.
//
// This is a HARD gate. It fails if importing or rendering the built `dist/`
// evaluates a string anywhere. A green check must mean "@hyper-elements/react
// is genuinely CSP-safe."

const CSP_ERROR = /Code generation from strings disallowed/;

try {
  const React = (await import('react')).default;
  // The components (the main entry) in each of their roots, and the builder's design (/builder) both ways.
  const p = await import('../dist/primitives.js');
  const { toDesign, fromDesign } = await import('../dist/builder.js');
  const h = React.createElement;
  const content = () => [
    h(p.Heading, { key: 'h' }, 'Heading'),
    h(p.Text, { key: 'p' }, 'Words ', h(p.Link, { href: 'https://example.com' }, 'a link'), h(p.MergeTag, { name: 'first_name' })),
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
    `CSP_OK: @hyper-elements/react imports + renders its components in every root (HTML and plain text), and ` +
      `takes them to the builder and back, under strict CSP — no eval / new Function`,
  );
} catch (err) {
  const message = String((err && err.message) || err);
  if (CSP_ERROR.test(message)) {
    console.error(
      `CSP_FAIL: @hyper-elements/react evaluates a string (eval / new Function) at import or render — ` +
        `it would throw under a Content-Security-Policy without 'unsafe-eval'.\n${message}`,
    );
  } else {
    console.error(`CSP probe failed to run: ${message}`);
  }
  process.exit(3);
}

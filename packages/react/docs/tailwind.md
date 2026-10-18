# Tailwind CSS in Elements

Style Elements components with Tailwind classes, as with React Email's `<Tailwind>`: `className="bg-gray-100 p-6 text-lg"` on an `Email`, `Row`, `Column`, `Button` or `Paragraph`. Each class becomes the component's own props, so the same template renders to email HTML, web pages and print documents, and `renderToJson()` gives a design the visual editor can still edit. Props you set yourself win over classes.

```bash
npm install @unlayer/react-elements tailwindcss
```

Tailwind CSS 4 is an optional peer dependency. Only `@unlayer/react-elements/tailwind` loads it; the main entry never does.

## Render a template with classes

Wrap the root in `<Tailwind>` (from `@unlayer/react-elements/tailwind`) and render with the async renderers, which that entry exports too (they're `@unlayer/react-elements/async`'s, the same functions). They compile the config first (asynchronously, and keep it compiled for the next render: see [`loadTailwind`](#keep-the-synchronous-renderers)), then render, resolving async components too (see [Async templates](./async.md)):

```tsx
import { Email, Row, Column, Heading, Paragraph, Button } from "@unlayer/react-elements";
import { Tailwind, renderToHtml, renderToPlainText, renderToJson } from "@unlayer/react-elements/tailwind";

const config = { theme: { extend: { colors: { brand: "#007291" } } } };

const welcome = (name: string) => (
  <Tailwind config={config}>
    <Email className="bg-gray-100 font-sans max-w-[600px]" previewText="Welcome aboard">
      <Row className="bg-white p-6 max-sm:p-4">
        <Column>
          <Heading className="text-3xl font-bold text-gray-900">Welcome, {name}</Heading>
          <Paragraph className="text-lg text-gray-700 my-4 max-sm:text-base">Your account is ready.</Paragraph>
          <Button href="https://example.com/start" className="bg-brand text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Get started
          </Button>
        </Column>
      </Row>
    </Email>
  </Tailwind>
);

const html = await renderToHtml(welcome("Ada"), { title: "Welcome" });
const text = await renderToPlainText(welcome("Ada"));
const design = await renderToJson(welcome("Ada")); // classes are props here, editable in the editor
```

`config` takes what React Email's `<Tailwind config>` takes (`theme`, `presets`, `plugins`). A `<Tailwind>` without `config` uses Tailwind's default theme. The four async renderers (`renderToHtml`, `renderToPlainText`, `renderToJson`, `renderToHtmlParts`) take the same arguments as the ones from `@unlayer/react-elements` and return Promises. They load the Tailwind compiler only for a template with a `<Tailwind>` (with a `config` or without one), from your `node_modules` when they run (so a bundle doesn't need `tailwindcss` unless you use it). Where there's no `node_modules` (an edge function), compile in the bundle instead: pass `tw={await loadTailwind(config)}` from `@unlayer/react-elements/tailwind`.

## Keep the synchronous renderers

The renderers from `@unlayer/react-elements` are synchronous, and Tailwind's compiler isn't. Compile once with `loadTailwind()` (at startup, or before rendering) and pass the result as `tw`:

```tsx
import { renderToHtml } from "@unlayer/react-elements";
import { Tailwind, loadTailwind } from "@unlayer/react-elements/tailwind";

const tw = await loadTailwind(config);

renderToHtml(
  <Tailwind tw={tw}>
    <Email className="bg-gray-100">…</Email>
  </Tailwind>
);
```

`loadTailwind(config)` compiles a config and keeps it: a later call with the same config (the same object, or one with equal contents) returns the same handle. It keeps the 50 configs used last, so a server that renders each customer's theme doesn't keep every theme it has rendered: one used longer ago is compiled again when it's asked for, and a handle you hold keeps working. A handle that has read 2,000 different classes (classes made from data, like `w-[123px]`, keep coming) compiles a fresh compiler in the background and reads new classes with it once it's ready, so reading a new class stays fast and memory stays bounded; classes read the same with either. A config with functions (plugins) is cached by the object only, so define it once, outside your components.

A synchronous renderer given `<Tailwind config>` without `tw` throws, telling you to pass `tw` or use the async renderers (`@unlayer/react-elements/async`). It throws every time, even when the async renderers compiled that config before: otherwise a template would render in development and fail on a cold serverless start.

## Where `<Tailwind>` goes

- **Around the root** (`<Tailwind><Email>…</Email></Tailwind>`), or as the root's only child: classes on the root and everything in it.
- **Around a template component** (`<Tailwind><Welcome /></Tailwind>`), or returned by one: the renderers find it.
- **Around part of a template**, in a `Column` or a component of your own: classes on what's inside it. An inner `<Tailwind>` wins over an outer one.

Outside a `<Tailwind>`, `className` is a class name on the component's element in the HTML, for a stylesheet of your own (see `style` and `className` in the [React API reference](../README.md)).

## Classes in HTML markup

Inside a `<Tailwind>`, `class` attributes in the markup of an `Html` block (and of a Paragraph's `html`) become inline styles, with the same conversions (hex colors, pixels, logical sides as physical ones), since email clients don't read a stylesheet's classes:

```tsx
<Html html={'<p class="text-sm text-gray-500 py-2">Sent by <a class="font-bold underline" href="https://example.com">Acme</a></p>'} />
// <p style="padding-top: 8px; padding-bottom: 8px; font-size: 14px; line-height: 1.4286; color: #6a7282">Sent by <a href="https://example.com" style="font-weight: 700; text-decoration: underline">Acme</a></p>
```

An element's own `style` wins over its classes, as in the browser. Classes Tailwind doesn't know stay in the attribute, for a stylesheet of your own. Phone, breakpoint and hover variants (`max-sm:`, `sm:`, `hover:`) can't be inline styles: they're left out with a warning, as are classes that don't apply in an email. Script and style elements and comments are left as they are.

## What each class becomes

Colors come out as hex, or `rgba()` when translucent: Tailwind's `oklch()` palette and opacity modifiers (`bg-black/50`) are converted, since email clients don't read them. Sizes come out in pixels (`1rem` is `16px`), with Tailwind's variables and `calc()` worked out.

| Classes | Component | Prop |
|---------|-----------|------|
| `bg-*` | `Email`, `Page`, `Document` / `Row` / `Column` / `Button` | `backgroundColor` / `columnsBackgroundColor` (the content width, like a section in a container; pass `backgroundColor` yourself for a full-width band) / `backgroundColor` / `backgroundColor` |
| `text-{color}` | root / `Paragraph`, `Heading`, `Button` / `Menu` | `textColor` / `color` / `textColor` |
| `text-*`, `font-*`, `leading-*`, `tracking-*` | `Row`, `Column`, root | the text blocks' inside, as CSS inherits them (see [Text on a Row, a Column or the root](#text-on-a-row-a-column-or-the-root)); the root's color and font are the body's `textColor` and `fontFamily` too |
| `font-{family}` | root, `Paragraph`, `Heading`, `Button`, `Menu` | `fontFamily` |
| `text-{size}`, `leading-*`, `font-{weight}`, `tracking-*` | `Paragraph`, `Heading`, `Button`, `Menu` (no line height) | `fontSize`, `lineHeight` (a unitless one as a percentage), `fontWeight`, `letterSpacing` |
| `text-left`, `text-center`, `text-right` | `Paragraph`, `Heading`, `Button`, `Image`, `Divider` / `Menu`, `Social` | `textAlign` / `align` (a Button's is where it sits in its column: its label stays centered) |
| `p-*` | `Row`, `Column`, `Button` | `padding` (a Button's is inside it; a Row's insets its content, see below) |
| `m-*` | `Column` | the space around it: its gutter (see [Card grids](#card-grids)) |
| `p-*`, `m-*` | content blocks | `containerPadding`, margins and padding added up (where they can't be, as `5%` and `8px`, the padding stays and Elements says the margin is ignored); sides the classes don't set keep 10px |
| `border*`, `border-{color}`, `border-dashed` | `Column`, `Button` / `Divider` | the `border` sides / its line (the top border); a width without a color class is in the text color, as Tailwind's `currentColor` |
| `rounded-*` | `Column`, `Button` | `borderRadius` |
| `w-*` | `Button`, `Image`, `Divider` / root | `width` (pixels or %; an Image's `w-auto` is its auto width) / `contentWidth` |
| `max-w-*` | `Image` / root | `maxWidth` (with a width, the smaller of the two: see [Images](#images)) / `contentWidth` |
| `hover:bg-*`, `hover:text-*` | `Button` | `hoverBackgroundColor`, `hoverColor` (without them it keeps its colors on hover) |
| `hidden` | `Row`, content blocks | `hideOnDesktop` and `hideOnMobile` |

A Row's `p-*` classes inset its content, as in CSS: they go to its Columns' padding, added to theirs (top and bottom to each Column, left to the first and right to the last; on phones, where Columns stack, the sides to each, the top to the first and the bottom to the last), so a `bg-*` covers them. A Column's `m-*` classes are the space around it, between it and the next, added the same way. That's unlike the Row's `padding` prop, which is the editor's, around the row, outside its content background (see Row in the [React API reference](../README.md)).

A Button's `text-left`, `text-center` and `text-right` are its `textAlign`: where the button sits in its column, as `text-center` on its container places an inline-block link in CSS. Its label stays centered in it, so on a fixed or full-width button (`w-48`, `w-full`) `text-left` doesn't move the label to the left, as it would in CSS.

A border width without a color class (`border`, `border-t-2`) is drawn in the text color, as Tailwind's `currentColor` is (from its preflight): a Button's in its label's color, a Column's or a Divider's in its own text color class's, else the text color around it (a Row's, the root's, the body's default black).

## Text on a Row, a Column or the root

Text classes on a container style the text inside it, as CSS inherits them:

```tsx
<Row className="bg-indigo-600 text-white text-center">
  <Column>
    <Heading className="text-2xl font-bold">Big news</Heading>
    <Paragraph>White and centered, like the heading.</Paragraph>
    <Button className="bg-white text-indigo-600">Read more</Button>
  </Column>
</Row>
```

A `Row`'s, a `Column`'s or the root's text color, alignment, font family, size, weight, line height and letter spacing (and their phone and breakpoint variants, for size, line height and alignment) are the props of the text blocks inside that don't set their own, so the design holds them too. A block's own classes and props win, and the nearest container's classes over the ones around it (a Column's over its Row's, a Row's over the root's).

- **Paragraph and Heading** take them all; a **Menu** its items' (`textColor`, `align`; it has no line height); a **Table** its header's, content's and footer's (`headerColor`, `contentColor`, `contentTextAlign`, …; the weight and line height its content's).
- **Button**: its label's font, size, weight, letter spacing and line height, and its place (`text-center` centers it in its column), but not its color: its label sits on its own background, and email clients give a link its own color. **Social**: its place.
- **The root's** color and font are the body's `textColor` and `fontFamily`, as the editor has them, and its color is its text blocks' too, so they show it.
- **Markup** in a Column (an `Html` block, a component of your own that renders HTML) has no such props: it gets them as an inline style on its Column, for the HTML only, which Elements says.
- **Case, italics and decoration** (`uppercase`, `italic`, `underline`) have no props on any block: they stay an inline style on the container, which the text inside takes as in CSS (HTML only, said).

Without classes around them, blocks keep their defaults (a Paragraph's 14px, left-aligned), as the editor's do.

## Images

An Image's `w-*` and `max-w-*` are its display width, which is one setting in the editor (a percentage of its column): `w-32` is 128px, `w-1/2` half its column, `max-w-xs` at most 320px, and `w-auto` (or `w-full`) its auto width, as wide as its column allows. A width with a max width is the smaller of the two, as the browser shows it: `w-full max-w-xs` is 320px (where the column is wider), in the HTML and the design. A percentage with pixels (`w-1/2 max-w-xs`) depends on the column's width, so the width is used and Elements says so. As the editor's width is a percentage, a fixed width is a share of the column's: where the column is narrower (a phone), the image is too.

## Card grids

Cards in a panel, as you'd write them for the browser:

```tsx
<Row className="bg-white px-10 py-4">
  <Column className="bg-zinc-50 rounded-lg p-4 mr-2">…</Column>
  <Column className="bg-zinc-50 rounded-lg p-4 ml-2">…</Column>
</Row>
```

render as in CSS: a white panel, the cards inset 40px from its sides and 16px from its top and bottom, 16px apart (`mr-2` and `ml-2`, 8px each). The editor has no margins, and a Column's padding is inside its own background, so each card's gutter is a border in the color around it (the Row's content background, here `bg-white`; else the Row's `backgroundColor`; else the body's): the Row's padding on its outer sides (the left of the first card, the right of the last, the top and bottom of each), its margins on the others. The card's `p-4` stays inside it. The design gets the same borders, so the editor shows the same grid. A Column without a background or border takes its gutter as padding, which looks the same.

- **Phones**: the cards stack. Each keeps the Row's side padding (`max-sm:px-*` for another), the first its top padding and the last its bottom, and two cards are as far apart as on desktop (the one's right margin below it, the next's left margin above it). These are the cards' phone settings, which an email applies. A web page (`Page`) keeps the desktop gutters on phones, as the editor's web export has no phone border for a column; Elements says so. An email stacks its columns below its content width plus 20px and applies phone settings at 480px, so between the two the stacked cards still have their desktop gutters.
- **Rounded corners** (`rounded-*`) grow by the gutters, as a corner's radius is its outer edge's, so they look the same. The editor's corners are circles, so a corner stays round only where its two gutters are equal (`p-2` on the Row with `mr-2` and `ml-2` on the cards: 8px on every side), on desktop and on phones alike. Where they differ (`px-10 py-4`: 40px at the side, 16px on top), the row's cards get square corners, and Elements says which gutters differ.
- **What keeps the old behavior**: a card with a border of its own (`border`, `border-zinc-200`) on a side its gutter needs, or a color around the cards that isn't one solid color (a background image, a translucent `bg-black/50`), or a gutter that isn't in pixels. Then the Row's padding classes stay its padding, around it, its Columns' margins are ignored, and Elements says why. Outside a whole template (`renderRowToJson`), the body's color isn't known: give the Row a background.
- **In the editor**, the gutters are the cards' borders: changing the Row's or the body's background later leaves them the old color, and a card's border setting holds its gutter.
- **Widths**: the Row's columns are as wide as its `layout` (or its `cells`) says, gutters included, so with three cards the outer ones, which also hold the Row's side padding, are narrower than the middle one; in CSS (`flex-1`) they'd be equal.

## Phones and breakpoints

- **Phone variants** (`max-sm:`, `max-md:`, `max-[480px]:`) set the component's `mobile` prop: `max-sm:text-sm` is `mobile={{ fontSize: "14px" }}`, `max-sm:hidden` is `hideOnMobile`. Phones can change font size, line height, alignment, padding, a block's `containerPadding`, widths, a Column's border and its margins (its gutters, see [Card grids](#card-grids)), as the `mobile` prop can.
- **Breakpoint variants** (`sm:`, `md:`, `lg:`) are the desktop value, and what's set without them is the phone one: `text-sm sm:text-lg` is `fontSize="18px"` with `mobile={{ fontSize: "14px" }}`. With no class for phones, phones get the component's default. `hidden sm:block` shows a block on desktops only.

Elements switches to phone styles at 480px, not at Tailwind's breakpoints (`sm` is 640px): every phone and breakpoint variant maps to that one switch.

## What's kept in HTML only, and what isn't kept

A class no prop takes (`uppercase`, `italic`, `underline`, `shadow-*`, `opacity-*`, `grid`, a Paragraph's `bg-*`, an Image's `rounded-*`) is inlined as a style on the component's element, as its `style` prop is: the text of a Paragraph or Heading, a Button's link, an Image's `img`, a Row's container, a Column's cell, the root's body. The HTML shows it; the design for the visual editor can't hold it, so Elements says so, once per render. The component's own `style` wins over a class.

A class that can't apply in an email is never dropped silently either: Elements logs a warning naming the component and the class, once per render.

```
[Unlayer] Button `display: grid` from class `grid` is kept in HTML (an inline style) but not in the design for the visual editor.
[Unlayer] Paragraph ignores class `dark:text-white`: it applies only for @media (prefers-color-scheme: dark).
[Unlayer] Paragraph has no phone setting for `color` (class `max-sm:text-red-500`).
```

Left out: dark mode, print, `focus:` and other states, group and peer variants, classes that style other elements (`space-y-*`), negative or automatic margins (`mx-auto`), phone, breakpoint and hover variants of what no prop takes (an inline style applies everywhere), and classes Tailwind doesn't know. Use the component's props for what classes can't express.

## Inspect what a class gives

`classNameToDeclarations(tw, className)` returns the declarations Elements reads, already converted for email, with when each applies (`always`, `phone`, `desktop`, `hover`) and the classes it ignores with why:

```ts
import { loadTailwind, classNameToDeclarations } from "@unlayer/react-elements/tailwind";

const tw = await loadTailwind();
classNameToDeclarations(tw, "bg-gray-100 max-sm:p-2 dark:bg-black");
// { declarations: [
//     { className: "bg-gray-100", property: "background-color", value: "#f3f4f6", when: "always", important: false },
//     { className: "max-sm:p-2", property: "padding", value: "8px", when: "phone", important: false } ],
//   ignored: [{ className: "dark:bg-black", reason: "it applies only for @media (prefers-color-scheme: dark)" }] }
```

## Agent rules

- With `<Tailwind config>`, render with the async renderers from `@unlayer/react-elements/async` and `await` them. To keep the synchronous renderers, call `await loadTailwind(config)` once and pass `<Tailwind tw={tw}>`.
- Put `<Tailwind>` around the root so the root's classes apply too. Keep the structure `root > Row > Column > content`: classes don't change it.
- Put the text styles a section shares on its Row or Column (`text-white text-center`), as in CSS: the text blocks inside take them, unless they set their own. To place a Button, use `text-center` on it or its container; its label is always centered.
- For cards in a panel, put the panel's background and padding on the Row (`bg-white px-6 py-4`) and margins on the cards (`mr-2`, `ml-2`), as in CSS. To keep `rounded-*` corners, make the gutters at each corner equal (`p-2` with `mr-2`/`ml-2`).
- Read the warnings after rendering. Replace each ignored class with the component's prop, or with markup in a `Paragraph`'s `html` (`<em>`, `<u>`) for text styles no prop has. A class kept in HTML only is fine for HTML; for a design someone edits in the visual editor, prefer a prop.
- A prop and a class for the same thing: the prop wins. Don't pass both.
- Tailwind's `sm:` is a breakpoint, not a phone variant: use `max-sm:` for phone-only styles.

See the [React API reference](../README.md) for each component's props, and [Migrate from React Email](./migrate-from-react-email.md) to convert whole React Email templates instead.

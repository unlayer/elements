# Translated React emails: react-intl, react-i18next, and next-intl

One shipping notification rendered with `@unlayer/react-elements` in English and Arabic (right-to-left), once with each of three i18n libraries. The [i18n guide](../../packages/react/docs/i18n.md) walks through the code. Commands run from the repository root with Node.js 20+ and pnpm 9.

```bash
pnpm install
pnpm build
pnpm --filter @unlayer/i18n-example test
pnpm --filter @unlayer/i18n-example render
```

`render` writes `output/shipped.en.html`, `output/shipped.ar.html`, and the plain text of each, using the react-intl version.

## Files

- `messages/en.json`, `messages/ar.json`: the messages, in ICU syntax, shared by all three libraries.
- `src/locales.ts`: loads a locale's messages (before rendering) and maps it to a text direction.
- `src/react-intl.tsx`: `createIntl()` + `RawIntlProvider`, `useIntl()` in the template.
- `src/react-i18next.tsx`: an initialized i18next instance per locale, `I18nextProvider`, `useTranslation()`.
- `src/next-intl.tsx`: `createTranslator()`, which needs no Next.js request.
- `src/i18n.test.ts`: renders both locales with each library and checks the subject, the translated text in the HTML and plain text, `lang`, `dir`, and the text alignment; and that rendering before i18next has loaded its messages fails.

```bash
pnpm --filter @unlayer/i18n-example typecheck
```

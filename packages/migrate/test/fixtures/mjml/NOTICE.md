# MJML test fixtures: sources and licenses

These templates are third-party files, committed unchanged as test fixtures for the MJML converter
(`npx @unlayer/migrate --from mjml`). Each folder keeps its license text beside it.

| Folder | Source (pinned commit) | License | Files |
|---|---|---|---|
| `colorlib/` | [ColorlibHQ/email-templates@3018557](https://github.com/ColorlibHQ/email-templates/tree/3018557fe943fb1c3e3367aa52d39b2fca44f725/src), `src/` | MIT (`colorlib/LICENSE`) | `1.mjml` → `01.mjml`, `3.mjml` → `03.mjml`, `6.mjml` → `06.mjml`, `12.mjml`, `21.mjml`, `partials/base.mjml` |
| `mrml/` | [jdrouet/mrml@8987c0f](https://github.com/jdrouet/mrml/tree/8987c0f4b2fde7fccfd9e0bee4ac5e55ac0060b5/packages/mrml-core/resources/compare/success), `packages/mrml-core/resources/compare/success/` | MIT (`mrml/LICENSE`) | `mj-*.mjml` (one per component) |

Colorlib's images are relative paths (`images/...`) that aren't included: they show as broken images on both sides of
the check, which compares image sources, not pixels.

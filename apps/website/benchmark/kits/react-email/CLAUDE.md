# Conventions

You're building one email. The brief is in BRIEF.md.

- Write it in emails/email.tsx with React Email (`@react-email/components`). The file's default export is the template.
- `node tools/render.mjs` renders emails/email.tsx to out/email.html.
- `npx tsc --noEmit` type-checks it.
- `node tools/check.mjs` checks out/email.html in a browser, at a desktop and a phone width. The email is done when it passes.
- The images are already hosted at https://assets.orbit.dev/img/.
- Don't change anything in tools/.

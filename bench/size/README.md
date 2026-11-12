# Bundle size

The same small example built with each library: a translated string with a parameter and, where the library has it, a plural form, rendered by a React component. The code is in [`entries`](./entries).

- Bundled with esbuild, minified, ESM, `NODE_ENV=production`.
- React is external: every app pays for it anyway.
- Counted: what the first screen loads, that is the entry chunk and its static imports. Lazy chunks are not counted: a second language, and `dictly/check`, which loads only with `validate`.
- gzip at level 9, brotli at its default level.

Run from the repository root:

```sh
pnpm bench:size
```

It builds dictly, installs the pinned versions from `package.json` and writes [`results.md`](./results.md).

Not everything here does the same job: rosetta has no React bindings and no plural rules, typesafe-i18n gets its types from a code generator, Lingui needs a compile step. The README of dictly lists these notes next to the numbers.

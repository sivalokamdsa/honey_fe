# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm ci` — install dependencies (lockfile is `package-lock.json`).
- `npm run dev` — Vite dev server. Proxies `/api` to `http://localhost:8080`, so the backend must run there for registration to work.
- `npm run build` — runs `tsc -b` then `vite build` into `dist/`. Type errors fail the build.
- `npm run lint` — ESLint flat config (`eslint.config.js`).
- `npm run preview` — serve the built `dist/`.

There is no test runner configured. No test script, no test files. Don't assume `npm test` exists.

## Architecture

Single-page React 19 app with two routes, using `react-router-dom` with `HashRouter` (URLs look like `/#/register`, so static hosting needs no rewrite rules):

- `src/App.tsx` — `/` renders `pages/Home`, `/register` renders `pages/Register`.
- `src/pages/Home.tsx` — the Telugu honey guide. Prose and tables are inline JSX; long lists come from `src/data/recipes.ts`, `src/data/remedies.ts`, and `src/data/beauty.ts`. Styles are in `Home.css`, on top of `index.css` (palette, hero, footer).
- `src/components/SiteNav.tsx` — shared sticky nav used by both pages. On Home it gets section links that scroll with `scrollIntoView`, because `href="#section"` would clash with the hash router.

Registration form details:

- `src/pages/Register.tsx` holds all form state locally (`useState`, no form library). Per-field validation errors come from the server, not the client: `onSubmit` calls the API and maps `ApiError.fieldErrors` onto the matching input by key name (`fullName`, `phone`, `email`, `city`, `consent`). Keep those keys aligned with the backend's field names.
- `src/api/registrations.ts` is the only network layer. `createRegistration` POSTs JSON to `/api/v1/registrations`. Errors are normalized into `ApiError` with `status`, `message`, and `fieldErrors`. Status `0` means the network call itself failed. The backend's error body shape (`detail`, `errors` map) is assumed from the comment on `ApiError`; the backend lives outside this repo.
- Styling is plain CSS per page (`Register.css`) plus `index.css`. Fonts are loaded from Google Fonts in `index.html` (Noto Sans/Serif Telugu, Poppins). Keep Telugu UI copy intact when editing.

## API base URL and deployment

- In dev, the Vite proxy forwards `/api` to the local backend.
- In production, the workflow `.github/workflows/deploy-frontend.yml` builds with `VITE_API_BASE_URL=/api` and rsyncs `dist/` to a VPS. It runs on every push to `main`. The frontend and API are served from the same origin, so requests go to a relative `/api` path.
- `src/api/registrations.ts` hardcodes `/api/v1/registrations` and does not read `VITE_API_BASE_URL`. If the base URL ever changes, update that file too.

## Conventions specific to this repo

- TypeScript is strict, with `noUnusedLocals`, `noUnusedParameters`, and `verbatimModuleSyntax`. Use `import type` for type-only imports, as `Register.tsx` does.
- `tsconfig.app.json` covers `src/`. `tsc -b` in `npm run build` is the real type check, so run `npm run build` before considering a change done.
- Lint config is the stock Vite setup (`react-hooks`, `react-refresh`, `typescript-eslint` recommended). Run `npm run lint` after changes.

## Known leftovers

- `README.md` is still the Vite template boilerplate.
- The favicon is still the default `vite.svg`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm ci` — install dependencies (lockfile is `package-lock.json`).
- `npm run dev` — Vite dev server. Proxies `/api` to `http://localhost:8080`, so the backend must run there for registration to work.
- `npm run build` — runs `tsc -b` then `vite build` into `dist/`. Type errors fail the build.
- `npm run lint` — ESLint flat config (`eslint.config.js`).
- `npm run preview` — serve the built `dist/`.

There is no test runner configured. No test script, no test files. Don't assume `npm test` exists.

The git repo root is `web/`, not the parent `honey-fe/` folder. Run git commands from `web/`. The `.github/` workflow is inside `web/` too.

Baseline: `npx tsc -b` and `npm run lint` both pass on a clean checkout.

## Architecture

Single-page React 19 app with seven routes, using `react-router-dom` with `HashRouter` (URLs look like `/#/register`, so static hosting needs no rewrite rules):

- `src/App.tsx` — `/` renders `pages/Home`, `/intro` renders `pages/intro` (the book's table of contents, which links into the beekeeping pages), `/beekeeping` renders `pages/BeeKeeping`, `/beekeeping2` renders `pages/BeeKeeping2`, `/register` renders `pages/Register`, `/checkout` renders `pages/Checkout` (see Checkout below), `/login` renders `pages/Login`.
- `src/pages/Home.tsx` — the Telugu honey guide. Prose and tables are inline JSX; long lists come from `src/data/recipes.ts`, `src/data/remedies.ts`, and `src/data/beauty.ts`. Styles are in `Home.css`, on top of `index.css` (palette, hero, footer).
- `src/pages/BeeKeeping.tsx` (~2,500 lines) and `src/pages/BeeKeeping2.tsx` are page-by-page notes from a beekeeping book. Each book page is a section with id `page<N>`. The submenu list is generated from page numbers at the top of each file (`BeeKeeping` skips page 26, which does not exist). Both files reuse `Register.css` for styling.
- `src/components/SiteNav.tsx` — shared sticky nav used by every page. It takes an optional `sections` prop for the submenu. The nav is responsive and has a hamburger menu (`☰ మెనూ · Menu`). On pages with sections, links scroll with `scrollIntoView`, because `href="#section"` would clash with the hash router. `SiteNav.css` holds its styles.
- `src/hooks/useScrollToPageParam.ts` — `BeeKeeping2` uses it to scroll to `<section id="pageN">` when the URL has `?page=N` (e.g. `/#/beekeeping2?page=48`). Both `BeeKeeping` and `BeeKeeping2` call it, and the intro TOC relies on these links.
- `src/pages/intro.tsx` + `intro.css` — the TOC page. Its `menusections` array is hand-maintained and must stay in sync with which page numbers actually exist across `BeeKeeping` and `BeeKeeping2`.

Registration form details:

- `src/pages/Register.tsx` holds all form state locally (`useState`, no form library). Fields: `fullName`, `phone`, `email`, `city`, `password`, `consent`. Per-field validation errors come from the server, not the client: `onSubmit` calls the API and maps `ApiError.fieldErrors` onto the matching input by key name. Keep those keys aligned with the backend's field names.
- `src/api/registrations.ts` is the registration network layer. `createRegistration` POSTs JSON to `/api/v1/registrations` (201 on success, returns `{ id, createdAt }`). Errors are normalized into `ApiError` with `status`, `message`, and `fieldErrors`. Status `0` means the network call itself failed. The frontend reads only `detail` from error bodies. The contract's 409 (phone already registered) is documented with `title: "Already registered"`, so if the backend does not also send `detail`, the user sees the generic message. Check the response if that message matters.
- `src/pages/Login.tsx` + `src/api/auth.ts` implement login. `login()` POSTs `{ phone, password }` to `/api/v1/auth/login` and expects `{ token, user: { id, fullName, phone, role } }`. On success the session is saved (see Auth and roles below) and the user is sent back to the page they came from. 401 shows the backend's `detail` ("Invalid phone or password").
- The password is only ever sent in a request body. Never log it, store it, or put it in a URL.
- `ApiError` is defined in `src/api/registrations.ts` and imported by `auth.ts`, `checkout.ts`, `products.ts`, and the `Register`, `Login`, and `Checkout` pages. Changes to its shape affect all of them.
- Styling is plain CSS per page (`Register.css`) plus `index.css`. Fonts are loaded from Google Fonts in `index.html` (Noto Sans/Serif Telugu, Poppins). Keep Telugu UI copy intact when editing.

Checkout (`/checkout`) is a cart plus Razorpay payment flow. The full design, backend contract, and testing checklist are in `docs/CHECKOUT.md`. Read it before changing anything in this area. Key files: `src/pages/Checkout.tsx` (+ `Checkout.css`), `src/api/checkout.ts`, `src/api/products.ts`, `src/lib/pricing.ts`, `src/lib/razorpay.ts`, `src/data/products.ts`.

- Money is integer paise everywhere. Format for display only, with `formatINR()`.
- The browser never sends prices. It sends `productId` and `quantity`, and the backend decides the charged amount. Never add a client-side price to a request.
- The Razorpay secret never goes in the frontend. Only the public `razorpayKeyId` from the order response is used.
- The cart lives in `localStorage` under `honey-cart`, not on the server.
- The backend lives outside this repo. Checkout cannot complete an order without it running on `localhost:8080` in dev.

## Auth and roles

- Roles are `user` and `admin` (`src/lib/session.ts`, type `Role`). A missing or unknown role is treated as `user`. The backend is the source of truth; the frontend only uses the role to decide what to show.
- Session = `{ token, user }`, stored in `localStorage` under `honey-session`. Every read and write is wrapped in try/catch. Only the token and the public profile are stored, never the password.
- `src/api/client.ts` builds the `Authorization: Bearer <token>` header (`authHeaders()`). Requests that need auth must spread it into their headers: `checkout.ts` and `admin.ts` do.
- On a 401 from an authenticated request, `notifyIfUnauthorized()` fires the `auth:unauthorized` event and the provider logs the user out. Don't handle 401 by clearing storage yourself.
- `src/auth/AuthContext.tsx` (`AuthProvider`, mounted in `main.tsx`) holds the session in React state. Read it with `useAuth()` from `src/auth/useAuth.ts`. The context object itself is in `src/auth/context.ts`, which keeps the provider file Fast-Refresh safe.
- Route guards: `src/auth/RequireAuth.tsx`, applied in `src/App.tsx`. Logged-out visitors go to `/login` with `state.from` set, and the login page returns them afterwards. A logged-in user without the required role is sent to `/`.
- Access rules (keep the comment in `App.tsx` in sync):
  - Public: `/`, `/intro`, `/register`, `/login`.
  - Any logged-in user: `/beekeeping`, `/beekeeping2`, `/checkout`.
  - Admin only: `/admin` (lists registrations from `GET /api/v1/admin/registrations`, `src/api/admin.ts`).
- The `/admin` route guard is UI only. The backend must check the role on every admin endpoint. Hiding a page is not access control.
- Logout is client-side only: it clears the stored session. There is no logout endpoint call.

## API base URL and deployment

- In dev, the Vite proxy forwards `/api` to the local backend.
- In production, the workflow `.github/workflows/deploy-frontend.yml` builds with `VITE_API_BASE_URL=/api` and rsyncs `dist/` to a VPS. It runs on every push to `main`. The frontend and API are served from the same origin, so requests go to a relative `/api` path.
- `src/api/registrations.ts` hardcodes `/api/v1/registrations` and does not read `VITE_API_BASE_URL`. If the base URL ever changes, update that file too.

## Conventions specific to this repo

- TypeScript is strict, with `noUnusedLocals`, `noUnusedParameters`, and `verbatimModuleSyntax`. Mark type-only imports explicitly, either with `import type` (as `lib/pricing.ts` does) or with inline `type` modifiers (as `Register.tsx` does).
- `tsconfig.app.json` covers `src/`. `tsc -b` in `npm run build` is the real type check, so run `npm run build` before considering a change done.
- Lint config is the stock Vite setup (`react-hooks`, `react-refresh`, `typescript-eslint` recommended). Run `npm run lint` after changes.

## Known leftovers

- `README.md` is still the Vite template boilerplate.
- `Checkout.tsx` always falls back to `sampleProducts` when the products request fails, in every environment, and the error message is never shown. `docs/CHECKOUT.md` section 8 has the intended behavior (DEV-only fallback, visible error). Fixing it needs a `setLoadError` setter, because `loadError` is currently `useState` with the setter discarded.
- The favicon is still the default `vite.svg`.
- `index.html` declares `<meta name="viewport">` twice. Remove one.
- `dist/` is a build output, gitignored, and rebuilt by `npm run build`. Don't edit it or treat it as source.
- `BeeKeeping.tsx` and `BeeKeeping2.tsx` import `Register.css` instead of their own stylesheet. Splitting that out is a cleanup if those pages change.

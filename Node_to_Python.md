# Node → Python: a dictionary for this repo

A personal glossary: web/Node terms mapped to the Python idea you already know.
These are *understanding* analogies, not exact equivalents. Add to it whenever a new term shows up.

---

## 1. Getting started (the "venv + requirements.txt" moment)

In Python you'd do:

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

In Node, for this repo, you do:

```
npm install
```

That's it. Why it's shorter:

| Python | Node | Notes |
|---|---|---|
| `requirements.txt` / `pyproject.toml` | `package.json` | Lists dependencies **and** project metadata **and** commands (see "scripts"). Closest to `pyproject.toml`. |
| `requirements.txt` with pinned `==` versions, or `poetry.lock` / `uv.lock` | `package-lock.json` | Exact versions of *everything* installed, including dependencies of dependencies. Auto-generated. Commit it, don't edit it by hand. |
| `.venv/` folder | `node_modules/` folder | Where packages live. Per project, created automatically, never committed (it's in `.gitignore`). Delete it and run `npm install` to rebuild, like recreating a venv. |
| `source .venv/bin/activate` | *(nothing)* | No activation step. Node always looks in the project's own `node_modules/` first. |
| `pip install requests` | `npm install <pkg>` | Adds it to `package.json` and installs it. |
| `pip install -r requirements.txt` | `npm install` (no package name) | Installs everything listed in `package.json` / `package-lock.json`. |
| `pip install -r requirements.txt` exactly as locked (CI) | `npm ci` | Clean install strictly from the lockfile. Used in automated builds. |
| `pip uninstall x` | `npm uninstall x` | |
| `pip list` | `npm ls` | |
| `pip list --outdated` | `npm outdated` | |
| dev-only extras (`pip install -e .[dev]`, `requirements-dev.txt`) | `devDependencies` in `package.json` (`npm install --save-dev x`) | Tools only needed while developing (tests, linter, TypeScript). `dependencies` = what the app needs to run. |
| PyPI | npm registry (npmjs.com) | Where packages come from. |
| `python` (the interpreter) | `node` | Runs JavaScript outside the browser. |
| `pip` | `npm` | The package manager that ships with the interpreter. |
| `pipx run cowsay` / `uvx` | `npx <tool>` | Run a tool without installing it permanently. |
| `pyenv` (switch Python versions) | `nvm` / `fnm` | Not needed yet. We use the one Node you installed. |

## 2. Running things

| Python | Node | Notes |
|---|---|---|
| `Makefile` targets, `tox`/`nox` sessions, `[project.scripts]` | `"scripts"` in `package.json`, run with `npm run <name>` | Named shortcuts for commands. `npm test` is shorthand for `npm run test`. |
| `python -m http.server` / `flask run --debug` | `npm run dev` | Starts the **dev server**: serves the app on `http://localhost:5173/dst_dashboard/` and reloads instantly when you save a file. |
| building a wheel (`python -m build`) | `npm run build` | Produces the finished site in `dist/`: plain HTML/CSS/JS files ready to upload anywhere. |
| — | `npm run preview` | Serves the built `dist/` folder locally, to check the production version. |

Our scripts (see `package.json`):

| Command | What it does | Python feel |
|---|---|---|
| `npm install` | install everything | `pip install -r requirements.txt` into a venv |
| `npm run dev` | dev server with live reload | `flask run --debug` |
| `npm test` | run tests once | `pytest` |
| `npm run test:watch` | rerun tests on every save | `pytest-watch` |
| `npm run test:features` | only feature tests | `pytest tests/features` |
| `npm run test:regression` | only regression tests | `pytest tests/regression` |
| `npm run lint` | find likely bugs / bad patterns | `ruff check` / `flake8` |
| `npm run format` | auto-format all code | `black .` / `ruff format` |
| `npm run build` | type-check + production build | `mypy` + `python -m build` |

## 3. Languages

| Python | Web | Notes |
|---|---|---|
| Python | **JavaScript (JS)** | The language browsers run. Dynamic, like Python. |
| Python + type hints + `mypy --strict` | **TypeScript (TS)** | JS with types. Unlike Python hints, they're **checked before the app builds**: a type error fails `npm run build`. Files end in `.ts`. Browsers can't run TS directly, so the build tool strips the types out. |
| `mypy` | `tsc` (TypeScript compiler) | `tsc -b` in our build script = the type check. |
| `mypy.ini` / `[tool.mypy]` | `tsconfig.json` (+ `tsconfig.app.json`, `tsconfig.node.json`) | Type-checker settings. One for the app code, one for config files. |
| — | **JSX / TSX** | HTML-looking tags written inside JS/TS (`<h1>Hello</h1>`). Files end in `.jsx`/`.tsx`. Like a Jinja template, except it *is* code, not a separate template file. |
| HTML templates (Jinja) | **HTML** | Page structure. We have one tiny `index.html`; React fills in the rest. |
| — | **CSS** | Styling (colors, sizes, layout). Like a theme file for the HTML. |

Small syntax crib:

| Python | JS / TS |
|---|---|
| `x = 1` | `const x = 1` (can't reassign) or `let x = 1` (can) |
| `None` | `null` / `undefined` (two kinds of "nothing") |
| `True` / `False` | `true` / `false` |
| `dict` | object `{ a: 1 }` or `Map` |
| `list` | array `[1, 2, 3]` |
| `def f(x): ...` | `function f(x) { ... }` or `const f = (x) => ...` (arrow function, like `lambda` but can be multi-line) |
| f-string `f"Hi {name}"` | template string `` `Hi ${name}` `` |
| `import x` / `from m import f` | `import x from 'm'` / `import { f } from './m'` |
| `if __name__ == "__main__":` | *(no equivalent)* the entry point is set in config (`src/main.tsx`) |
| `TypedDict` / `@dataclass` (shape only) | `type Card = { id: string, ... }` or `interface Card { ... }` |
| `Literal["once", "perPlayer"]` | `'once' \| 'perPlayer'` (union type) |
| `dict[str, Item]` | `Record<string, Item>` | A dict type with fixed key and value types. `Record<Season, …>` forces all 4 season keys to be present. |
| `Literal[*MY_DICT.keys()]` (not real Python, but that's the idea) | `keyof typeof ITEMS` | "The type made of this object's keys". `ItemId` in `src/data/items.ts` is built this way, so a typo in an item id fails the type check. |
| `x: Item = {...}` (check the value against a shape) | `{...} satisfies Item` | Checks the value matches the shape but keeps its exact keys and values for the type checker. |
| `from m import Item` used only for hints (`if TYPE_CHECKING:`) | `import type { Item } from './m'` | Import used only by the type checker. It vanishes from the built app. |
| `{**d, "key": v}` | `{ ...d, key: v }` (spread) | Copy with changes. How `src/logic/` returns a *new* state instead of editing the old one. `[...xs, x]` is `[*xs, x]`. |
| `x if x is not None else default` | `x ?? default` | "Use the default when x is null/undefined". `cardOf` uses it for fresh cards. |
| `functools.reduce(f, xs, start)` | `xs.reduce(f, start)` | Fold a list into one value. The tests replay a list of actions this way. |
| `match action: case Claim(...)` | `switch (action.type) { case 'claimSlot': … }` | With a **discriminated union** (`type Action = { type: 'a', … } \| { type: 'b', … }`), TS knows which fields each case has, like a union of dataclasses. |
| `copy.deepcopy(x)` | `structuredClone(x)` | Full deep copy. A test uses it to prove actions never modify the old state. |
| `json.dumps(x)` / `json.loads(s)` | `JSON.stringify(x)` / `JSON.parse(s)` | How the game is turned into text for saving, and back. |
| `try: … except Exception: …` | `try { … } catch { … }` | Same idea. The storage code catches errors so a broken save or a refusing browser never crashes the app. |
| `typing.Protocol` / ABC with one implementation | `type GameStore = { loadGame(): …; saveGame(g): void }` + `createLocalStore()` | Our storage adapter: the app only knows the shape, so M11 can plug in the cloud version. |
| `==` | `===` (always use the triple one; `==` does surprising conversions) |
| `async def` / `await` | `async function` / `await` — same idea |
| `print()` | `console.log()` (shows up in the browser's DevTools console) |

## 4. Tools in this repo

| Python | Node (here) | Notes |
|---|---|---|
| `pytest` | **Vitest** | Test runner. Files named `*.test.ts`. `describe` ≈ a test class, `it(...)` ≈ a `test_` function, `expect(a).toBe(b)` ≈ `assert a == b`. |
| `ruff check` / `flake8` | **oxlint** | Linter. Config: `.oxlintrc.json`. |
| `black` / `ruff format` | **Prettier** | Formatter. Config: `.prettierrc.json`, skip list: `.prettierignore`. |
| `setuptools` / build backend + dev server | **Vite** | The **bundler** + dev server. "Bundler" = takes many source files (TS, TSX, CSS), converts them to plain JS/CSS the browser understands, and packs them into a few small files. Config: `vite.config.ts`. Nothing exactly like it in Python, because Python doesn't need to ship code to a browser. |
| a GUI/web framework (e.g. Streamlit's "rerun on change" model) | **React** | UI library. You describe what the screen should look like for a given state, and React updates the page when the state changes. |

## 5. React concepts (used from M3)

| Term | Python-ish analogy |
|---|---|
| **Component** | A function that takes arguments and returns a piece of UI. `function Card(props) { return <div>...</div> }`. Like a Jinja macro, but a real function. |
| **Props** | The component's arguments (read-only). |
| **State** | Variables that, when changed, make React redraw that part of the screen. |
| **Hook** (`useState`, `useEffect`, …) | Special functions starting with `use` that give a component memory or side effects. Rule: only call them at the top of a component, never inside `if`/loops. Loosely like decorators that attach behavior to a function. |
| **Render / re-render** | React calling your component again to get the fresh UI. Like Streamlit rerunning your script top to bottom. |
| **Reducer** | `def reducer(state, action) -> new_state`. A pure function that applies one action. Our `src/logic/` will be built in this style. |
| **StrictMode** | A dev-only safety mode that runs some things twice to surface bugs. Harmless; you'll see it in `src/main.tsx`. |
| **`useReducer(applyAction, …)`** | Hands our M2 reducer to React. It returns `[state, dispatch]`; `dispatch(action)` runs `applyAction` and React redraws with the new state. `src/App.tsx` uses it. |
| **`key`** (`<ItemCard key={id} />`) | A stable id for each item in a drawn list, so React knows which card is which between redraws. Like a dict key. |
| **`className`** | The HTML `class` attribute, written `className` in JSX (`class` is a reserved word in JS, as in Python). |
| **`{cond && <X />}`** | "Draw X only if cond". Like `x if cond else None` inside a template. |
| **`onClick={() => …}`** | "Run this function when tapped". Like passing a callback (`command=`) to a Tkinter button. Our buttons only `dispatch` an action; the rule itself lives in `src/logic/`. |
| **`useState`** | One value React remembers between redraws, e.g. which demo player is tapping (`me`). Simpler than `useReducer` when there are no rules involved. |
| **`useEffect(() => …, [x])`** | "After drawing, run this whenever `x` changed". We use it to save the game after every change, and for the 3-second timer of the two-tap confirm. If it returns a function, React calls that to clean up (like a context manager's `__exit__`). |
| **`useRef`** | A box React keeps between redraws, *without* redrawing when its content changes. Like an attribute on `self` that the UI doesn't watch. |
| **Pointer events** (`onPointerDown`, `onPointerUp`, …) | Finger/mouse down and up, as separate events (a click is the two together). Needed to measure a *hold*. |
| **State machine** | A fixed set of phases plus "on event X, go from phase A to B". `src/ui/holdToConfirm.ts` is one, written as a pure function so it's easy to test. |
| **Custom hook** (`usePressOrHold`) | Your own function starting with `use` that bundles React state + effects for reuse. Like a small mixin you can give to any component. |

## 6. Browser & web-app concepts

| Term | Meaning / analogy |
|---|---|
| **DevTools** | The browser's built-in debugger (F12). Console ≈ Python REPL output; device mode (phone icon) simulates a phone screen. |
| **localhost:5173/dst_dashboard/** | Your dev server's address (the `/dst_dashboard/` part matches the GitHub Pages path, see "base path"). `5173` is just Vite's default port, like Flask's `5000`. |
| **Hot reload / HMR** | Save a file → the page updates in place without a full reload. Like `flask --debug` auto-reload, but faster and keeps the page state. |
| **Static site** | A site that's just files (HTML/CSS/JS), no server code running. Ours is one, which is why GitHub Pages can host it for free. |
| **localStorage** | A small key-value store in the browser, per site. Like a tiny `shelve` file that lives on the phone. We'll use it in M4 for local saving. |
| **PWA (Progressive Web App)** | A website that can be "installed" to the home screen, opens fullscreen and works offline. Added in M10. |
| **Service worker** | A background script the browser runs for a PWA. Mainly caches files so the app opens offline. Like a local caching proxy for your own site. |
| **Manifest** (`manifest.json`) | Metadata for installing a PWA: name, icon, colors. Like the metadata in `pyproject.toml`, but for the home-screen icon. |
| **Cache Storage** (`caches.open(...)`) | The browser's store for whole saved responses (pages, JS, images), used by the service worker. Like a `requests-cache` folder: URL in, saved response out. |
| **Install / activate** (service worker events) | `install` = a new version was downloaded, save its files; `activate` = it took over, clean up older versions. Like a deploy script's "copy new release" and "delete old releases" steps. |
| **Maskable icon** | An app icon with extra margin, so Android can crop it to a circle or squircle without cutting the drawing. |
| **Screen wake lock** (`navigator.wakeLock`) | Asks the phone not to dim or lock while the app is in front. The browser drops it when the app goes to the background, so it is asked for again on return. Only works on `https://` (or `localhost`). |
| **Vite plugin** | A small object with hooks Vite calls during the build (e.g. `closeBundle` = "build finished"). Ours writes `sw.js`. Like a setuptools build hook. |
| **Firebase / Firestore** | Google's hosted backend. Firestore is its database: *collections* of *documents* (JSON-like). Like a hosted MongoDB you talk to straight from the app, no server code of ours. |
| **Anonymous sign-in** | Firebase gives each phone a permanent random id without a login screen. Lets the database rules say "only this app's users" and "only as yourself". |
| **Security rules** (`firestore.rules`) | Checks the database runs on *every* read/write, on Google's side. The app can't skip them. Like permission checks in a Django view, but living in the database. |
| **Listener** (`onSnapshot`) | "Call me whenever this data changes." The phone gets pushed updates instead of asking repeatedly. Like a callback subscribed to a pub/sub topic. |
| **Server timestamp** | A time filled in by the server when a write arrives, not by the phone (whose clock can be wrong or faked). We use it to decide who tapped first. |
| **Transaction** | Read-then-write that only succeeds if nothing changed in between; otherwise it retries. Like `SELECT ... FOR UPDATE` in SQL. |
| **`useRef`** | A React value kept between redraws that does *not* trigger a redraw when changed. Like an instance attribute on a long-lived object. |
| **Viewport** | The visible area of the page on a phone. The `<meta name="viewport">` line in `index.html` tells phones not to zoom out. |
| **ES modules (`"type": "module"`)** | The modern `import`/`export` system. The line in `package.json` says "this project uses it". |
| **GitHub Pages** | Free static hosting from a GitHub repo. Ours: `https://cauebarbosac.github.io/dst_dashboard/`. |
| **GitHub Actions** | CI: scripts that run on GitHub on every push (test, build, deploy). Same as for Python projects. |
| **Workflow** (`.github/workflows/*.yml`) | One Actions recipe, written in YAML: *when* to run (e.g. push to `main`) and the *steps* (install, test, build, deploy). Like a `tox.ini`/`Makefile` that GitHub runs for you on a fresh machine. |
| **Auto-deploy / CD** | "Continuous deployment": every push to `main` that passes the tests is published automatically. No manual upload step. |
| **Base path** (`base` in `vite.config.ts`) | The folder the site lives under. GitHub Pages serves us at `/dst_dashboard/`, not `/`, so every file link must start with that. Like setting `SCRIPT_NAME`/`APPLICATION_ROOT` for a Flask app mounted under a sub-path. |
| **CSS variable** (`--accent: #e0a84a;` then `var(--accent)`) | A named constant in the stylesheet. All our colors are defined once at the top of `src/index.css`. |
| **Flexbox / Grid** (`display: flex` / `display: grid`) | The two CSS layout systems: flex lines things up in one row or column; grid makes rows *and* columns (our ingredient slots). |
| **`dvh`** (`100dvh`) | "% of the visible screen height", which accounts for the phone's browser bars appearing and disappearing. |
| **Safe area** (`env(safe-area-inset-bottom)`) | Extra space for the phone's home bar / notch, so bottom buttons aren't hidden under it. Needs `viewport-fit=cover` in `index.html`. |
| **`aria-*` attributes** (`aria-pressed`, `aria-label`) | Hints for screen readers. We also style with them: the selected season button is the one with `aria-pressed="true"`. |
| **Headless browser** | A browser with no window, driven from the command line, e.g. to take screenshots. Used to check the layout at phone width. |

## 7. Project files, at a glance

| File / folder | What it is | Python cousin |
|---|---|---|
| `package.json` | deps + scripts + metadata | `pyproject.toml` |
| `package-lock.json` | exact locked versions | `poetry.lock` / `uv.lock` |
| `node_modules/` | installed packages | `.venv/` |
| `index.html` | the one HTML page the app lives in | — |
| `src/main.tsx` | entry point, starts React | `__main__.py` |
| `src/App.tsx` | the top-level screen | `app.py` |
| `src/logic/` | game rules, pure functions | your plain Python module |
| `src/data/` | hand-written game data: items, seasons, crises, characters | a `constants.py` module |
| `src/ui/` | React components (screen pieces), e.g. `ItemCard.tsx` | your templates / view layer |
| `src/storage/` | saving and loading the game (the storage adapter) | a small persistence module |
| `tests/features/`, `tests/regression/` | feature tests and bug tests (see `tests/README.md`) | `tests/` |
| `src/index.css` | global styles | — |
| `public/` | files copied as-is (icons) | package data files |
| `vite.config.ts` | bundler, dev server and Vitest settings | `setup.cfg` / `[tool.pytest]` |
| `tsconfig*.json` | type-checker settings | `mypy.ini` |
| `.oxlintrc.json` | linter settings | `[tool.ruff]` |
| `.prettierrc.json` | formatter settings | `[tool.black]` |
| `dist/` | build output (not committed) | `dist/` (same name, same idea!) |

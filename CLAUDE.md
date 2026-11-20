# dst_dashboard — Session Instructions

Hobby project: a phone-first shared objective & crisis board for Don't Starve Together.
Unrelated to any other repo on this machine — don't pull in context, conventions or memory from elsewhere.

## Source of truth

- `dst-dashboard-idea.md` — how the dashboard should work and feel (no tech decisions).
- `dst-dashboard-plan.md` — tech decisions (section 0) and milestones M0–M12.
- When code and these docs disagree about *what exists*, the code wins. When a decision changes, update the docs in the same change.

## About me

- Python developer, new to web development. When a web concept (npm, bundler, JSX, hooks, PWA, service worker, …) first shows up, explain it in a couple of lines, with a Python analogy where one fits.

## Rules

- **Phone portrait first.** Big touch targets (≥ 56px, larger for main buttons), main controls within thumb reach, no typing during play.
- **Game rules live only in `src/logic/`**, as pure functions with no UI or storage. The UI only displays derived state and dispatches actions.
- **Testing: no feature without tests, no fix without a regression test.** Full workflow in `tests/README.md`.
  - Every new feature/rule gets tests in `tests/features/<feature>.test.ts` in the same change (happy path + edge cases).
  - Every bug found: log it in `tests/regression/BUGS.md`, write `tests/regression/BUG-<id>-<name>.test.ts`, see it fail, then fix. Never delete or weaken a regression test.
  - `npm test` (features + regression) must be green before any commit/merge. If an old test breaks, that's a regression: fix the code, don't edit the test (unless the rule changed on purpose and the docs say so).
- Storage sits behind an adapter (local first, hosted sync at M11), so switching never touches `src/logic/`.
- One milestone = one branch. Keep changes small enough to review: rules + tests first, UI second.
- No images yet (faces = character name/initials + color ring) until the images milestone.

## Commands

<!-- Fill in at M0 once the project is scaffolded -->
- `npm install` — install dependencies (like `pip install -r requirements.txt`)
- `npm run dev` — dev server
- `npm test` — run all tests (features + regression)
- `npm run test:features` / `npm run test:regression` — run one part of the suite
- `npm run build` — type-check + production build
- `npm run lint` — oxlint (like ruff check)
- `npm run format` — Prettier (like black)

`Node_to_Python.md` is the user's Node→Python glossary: when a new web term is explained, add it there too.

## Git

- Never add a `Co-Authored-By:` trailer to commit messages.

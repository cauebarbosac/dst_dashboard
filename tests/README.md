# Test suite

Two kinds of tests, so the project never goes "one step forward, two steps back".

```
tests/
  features/      one file per feature: proves the feature works as the idea file describes
  regression/    one file per bug found: proves that bug stays fixed, forever
    BUGS.md      the bug log (every regression test has an entry here)
```

Run them:

| Command | Runs |
|---|---|
| `npm test` | everything (features + regression) — must be green before every merge |
| `npm run test:features` | only feature tests |
| `npm run test:regression` | only regression tests |
| `npm run test:watch` | everything, re-run on every save |
| `npm run test:live` | the live tests in `tests/live/` against the real Firebase project (M11). Not part of `npm test` or CI; run them after changing the room sync or `firestore.rules`. Each run makes a throwaway room. |

## Feature tests (`tests/features/`)

- File name = the feature: `claiming.test.ts`, `building.test.ts`, `seasons.test.ts`, `crisis.test.ts`, …
- Top-level `describe` names the feature and its milestone, e.g. `describe('M2 claiming', …)`.
- One `it(...)` per rule, written as the rule in plain words, e.g.
  `it('tapping your own claim releases it')`.
- Every rule in `src/logic/` has at least one test here. Cover the happy path **and** the edge
  cases the idea file implies (undo, double taps, last check of N, empty board, …).
- When a rule changes on purpose, change its test in the same commit. When a rule is removed,
  remove its test.

## Regression tests (`tests/regression/`)

When a bug is found (by a test, on the phone, anywhere):

1. **Log it** in `BUGS.md` with the next id (`BUG-001`, `BUG-002`, …).
2. **Reproduce it** in a new file `BUG-<id>-<short-name>.test.ts`. Run it and watch it **fail**.
   This proves the test actually catches the bug.
3. **Fix** the code. The test now passes.
4. **Update** the `BUGS.md` entry: cause, fix, status `fixed`.

Rules:

- **Never delete or weaken a regression test.** If the behavior it guards changes on purpose,
  update it and note why in `BUGS.md`.
- The `describe` starts with the bug id: `describe('BUG-003: N-item leaves board one check early', …)`.
- A bug that can't be tested automatically yet (pure phone-feel, layout) still gets a `BUGS.md`
  entry, marked `manual`, and goes into that milestone's manual phone checklist.

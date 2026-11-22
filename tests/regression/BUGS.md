# Bug log

Every bug found gets an entry here and a regression test (`BUG-<id>-<short-name>.test.ts`)
in this folder. See `tests/README.md` for the workflow. Newest at the bottom.

Status: `open` (test written, failing) · `fixed` (test passing) · `manual` (can't be automated yet,
checked by hand on the phone).

| ID | Found | Milestone | Symptom (what went wrong) | Cause | Fix | Test | Status |
|---|---|---|---|---|---|---|---|
| BUG-001 | 2026-11-20 | M1 | On Windows, `npm test` fails every suite with `TypeError: Cannot read properties of undefined (reading 'config')` at the first `describe`, even the untouched M0 test | Tooling, not app code: the terminal's folder was `c:\…` (lowercase drive letter, as VS Code opens it) while Vitest resolves `C:/…`, so Vitest loads twice and `describe` can't find its runner. CI (Linux) is not affected | Run from the uppercase path: `cd C:\Users\caueb\dst_dashboard` before `npm test` (or open the folder in VS Code via `C:\…`) | none (environment only) | manual |
| BUG-002 | 2026-11-22 | M11 | After a room summary existed, a tap made offline didn't show on the tapper's own phone until the connection came back | The listener asks for "taps stamped after the summary"; an unsent tap has no server stamp yet, so Firestore leaves it out of that query on the phone | A second listener reads only the phone's own copy (`source: 'cache'`, no server reads) for this phone's unsent taps; both lists are merged | `tests/live/room-live.test.ts` › summaries… offline taps still show (live, `npm run test:live`) | fixed |

<!--
Example row:
| BUG-001 | 2026-12-02 | M7 | Thermal Stone card left the board after 1 of 3 checks | markBuilt compared checks to 1 instead of N | compare to item quantity | BUG-001-n-item-early-finish.test.ts | fixed |
-->

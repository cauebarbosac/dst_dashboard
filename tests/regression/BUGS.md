# Bug log

Every bug found gets an entry here and a regression test (`BUG-<id>-<short-name>.test.ts`)
in this folder. See `tests/README.md` for the workflow. Newest at the bottom.

Status: `open` (test written, failing) · `fixed` (test passing) · `manual` (can't be automated yet,
checked by hand on the phone).

| ID | Found | Milestone | Symptom (what went wrong) | Cause | Fix | Test | Status |
|---|---|---|---|---|---|---|---|
| — | — | — | *no bugs yet* | — | — | — | — |

<!--
Example row:
| BUG-001 | 2026-12-02 | M7 | Thermal Stone card left the board after 1 of 3 checks | markBuilt compared checks to 1 instead of N | compare to item quantity | BUG-001-n-item-early-finish.test.ts | fixed |
-->

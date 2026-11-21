# DST Dashboard: Development Plan

*Companion to `dst-dashboard-idea.md`. This turns the idea into ordered coding steps. It's written for Claude Code to follow and for you to review, correct and judge. Pictures and images are left out on purpose: everything here uses text and slots, and images come in a later phase.*

---

## 0. Decisions so far

| Topic | Decision | Why |
|---|---|---|
| App type | **Web app, phone-first (portrait)**, installable on the home screen (a "PWA") | One codebase runs on phones, tablets and laptops. No app store needed. |
| Frontend | **React + TypeScript + Vite** | Standard, well known to Claude Code. TypeScript catches mistakes, a bit like Python type hints that are actually enforced. |
| Shared live board | **Hosted service, free tier**, added in a later phase. Proposed: **Firebase (Firestore)**, alternative: Supabase. | Nobody has to run a server. Firestore queues changes while offline and sends them when the connection returns, which helps with your unstable Wi-Fi. Free-tier terms get re-checked at that step. |
| Dev tooling | **Vitest** (tests), **oxlint** (linter, Vite's default), **Prettier** (formatter) | pytest / ruff / black equivalents |
| Game data | **Hand-written** by us, small curated lists | Full control, no scraping |
| Images | **Later.** Faces are shown as text (character name/initials + player color ring). | Keeps early steps simple |

### "Phone-first" without leaving the browser world

A web app on a phone *is* the phone's browser showing your page. Once added to the home screen, it opens fullscreen like a normal app, without the browser bars. So "phone-first" changes the **design** (portrait, big touch targets, thumb reach), not the technology. Expanding to tablets and laptops later is a matter of layout, not a rewrite.

During development:

- **On the laptop:** the browser's *device mode* (DevTools → phone icon) simulates a phone screen. That's your fast everyday loop.
- **On your real phone:** the dev server can be opened from your phone over home Wi-Fi. Because your laptop's Wi-Fi is unstable, we'll also **publish to GitHub Pages early** (step M0), so the phone can load a stable version from anywhere.

---

## 1. Architecture in one picture

```
 src/data/ (hand-written)   board logic (pure functions)          UI (React, phone portrait)
 items, seasons,   ──────▶  state + actions + "derive the  ──────▶ cards, slots, buttons,
 crises, characters         board" rules, fully tested             screens
                                    ▲
                                    │ save / load / sync
                             storage adapter
                     (phase 1: on the phone · phase 2: hosted service)
```

The most important rule is that **all game rules live in plain functions with no UI.** That part is like your scientific code: inputs, outputs and tests. The UI only displays the result and sends actions. That keeps the rules testable and makes the later switch to live sync a swap of the storage adapter only.

### Data model (sketch)

**Static game data** (`src/data/`, hand-written; inside `src/` so the app can import it):

- `Station`: a fixed list (Hand, Science Machine, Alchemy Engine…), so a typo can't create a fake station
- `Item`: id, name, station (one of the `Station` list), ingredients `[{ name, amount }]` (one slot per ingredient, claimed as a full stack; `amount` is shown for information only, never picked), quantity type: `once` | `perPlayer`
- `SeasonList`: season → ordered list of item ids
- `Crisis`: id, name, icon (an emoji until the images milestone) → ordered list of item ids
- `Character`: id, name, tag (a short unique label like `WIL`, since almost every name starts with W; images later)

**Session state** (changes during play):

*As built in M2 (`src/logic/state.ts`):*

- `players`: id (`p1`, `p2`…), characterId, color (handed out automatically, first free one), **activity**: `none` | `cooking` (only `cooking` for now; more activities may come later)
- `season`
- `seasonsSeen`: every season played so far, in order
- `activeCrises`: ordered list, latest last
- `cards`: **one card per item** (an item never shows twice), created on first touch. A missing card means "fresh":
  - builder (player id or none)
  - slot claims `{ slotIndex → playerId }`
  - checks done (for N-quantity items)
  - built: yes/no
- **Unfinished business is derived, not stored:** items from earlier seasons in `seasonsSeen` that aren't built and aren't on the board now. So they keep their claims, and if a crisis or the season lists them again they go straight back to the board.

### Actions (the only ways state can change)

All in `src/logic/`, sent through `applyAction(state, action)` (`actions.ts`). An action that doesn't apply (taken slot, unknown player, already built…) returns the state unchanged.

- `addPlayer` (with automatic color) / `pickCharacter`
- `claimSlot` / `releaseSlot` (first claim wins; only your own claim can be released)
- `claimBuilder` / `releaseBuilder` (one builder per item)
- `markBuilt` (one check; finishes the card when all checks are done, then clears its claims)
- `restoreFromBuilt` (the card comes back fresh)
- `setSeason` (unfinished items of earlier seasons show up in Unfinished business)
- `triggerCrisis` / `endCrisis` (re-triggering an active crisis moves it back to the top)
- `toggleCooking` (switches that player's activity between `none` and `cooking`)

Derived views the UI reads (`board.ts`): `visibleBoard`, `boardQueue`, `unfinishedItems`, `builtItems`, `topCrisis`, `cooks`, `myClaims`.

### Board rule ("what's on the board right now")

1. Items from active crises, **latest crisis first**.
2. Then the current season's list, in order.
3. Skip items that are built, and list each item only once (at its highest position).
4. Show the **top K cards** (`BOARD_SIZE`, 3 for now, to be tuned on the phone); the rest is hidden.

---

## 2. Milestones

### Progress (update at the end of every session)

| Milestone | Status | Notes |
|---|---|---|
| M0 | ✅ done 2026-11-20 | Live at https://cauebarbosac.github.io/dst_dashboard/, opens on the phone |
| M1 | ✅ done 2026-11-20 | Lists reviewed and approved. Data in `src/data/`, 25 tests green. Branch `m1-game-data` pushed; merge via PR. Windows note: run `npm test` from `C:\…`, not `c:\…` (BUG-001). |
| M2 | ✅ done 2026-11-21 | All rules in `src/logic/`, 100 tests green (incl. M1's 24). Defaults for the open questions approved (section 5). Branch `m2-board-logic` pushed; merge via PR. |
| M3 | ✅ merged 2026-11-21 (PR #4) | Board screen + claiming by tap (pulled forward from M5). Phone checklist (M3 section) not reported yet; the 3-vs-4 cards question is still open. |
| M4 | ✅ done 2026-11-21 | Players setup, player switcher, saving on the phone (`src/storage/`), 142 tests green. Checked on the phone by the user: works, quick and easy. Branch `m4-players-and-saving` pushed; merge via PR. |
| M5 | ⏭ next | Claiming is already done (M3); left: the cooking button. Start a branch from `main` after M4 is merged. |

**Next session starts here:** read this table, then the milestone's section below.

Each milestone is one git branch, merged when its **Done when** list passes, on a real phone where it matters. Each starts with a short Claude Code session where you paste that milestone's section.

### M0: Project setup and first deploy
- Install Node.js. Create the Vite + React + TypeScript project and the git repo.
- Add Vitest (≈ pytest), a formatter and a linter.
- Write a `CLAUDE.md`:
  - "Python dev, new to web; explain new concepts briefly"
  - "phone portrait first"
  - "game rules only in `src/logic/`, always tested"
- Set up automatic publishing to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`: lint + tests + build, then publish to `https://cauebarbosac.github.io/dst_dashboard/`; a failing test blocks the deploy).
- **Done when:** a "Hello DST" page opens on your phone from the GitHub Pages link.

### M1: Hand-written game data
- Write `src/data/` files for about 25 items, 4 seasons and 4 crises, the station list, and **all** DST characters (names + short tags).
- Agreed lists (2026-11-20). Recipes checked on dontstarve.wiki.gg (DST versions):
  - **Autumn:** Science Machine, Alchemy Engine, Crock Pot, Ice Box, Backpack, Log Suit
  - **Winter:** Winter Hat, Puffy Vest, Thermal Stone, Fire Pit
  - **Spring:** Umbrella, Rain Coat, Lightning Rod
  - **Summer:** Ice Flingomatic, Endothermic Fire, Floral Shirt
  - 🐕 **Hound wave:** Log Suit, Football Helmet, Tooth Trap
  - 🥶 **Freezing:** Fire Pit, Thermal Stone, Winter Hat
  - 🍖 **Starvation:** Crock Pot, Drying Rack, Bird Trap
  - 💉 **Teammate down:** Telltale Heart, Booster Shot, Healing Salve, Honey Poultice
- Start with these 4 crises only. The others from the idea file (Deerclops, Overheating, Wildfire, Low sanity) come after we've tried these.
- **Booster Shot is `once`.** One is needed per revive, and the extra ones come back through the Built list ("direction, not counter", idea file section 6). No new quantity type.
- Add a test that checks the data is consistent: every list points to existing items, no duplicates, every item's station is a known station, every crisis has an icon.
- **Done when:** the data tests pass and you've reviewed the lists.

### M2: Board logic (no UI)
- Session state, all actions, and the board rule from section 1, as pure functions.
- Thorough tests, for example:
  - claim and release
  - builder claim
  - N checks with claims kept until all checks are done
  - season change moves items to Unfinished business
  - the latest crisis wins
  - restoring from Built
  - `toggleCooking`: on, off, and only for that player
- **Done when:** all rules from the idea file are covered by passing tests.

### M3: Read-only board on the phone
- Portrait layout: season label at the top, K big item cards. Each card shows item name, station text, ingredient slots and check slots.
- Touch targets are big (at least ~56px, and larger for main buttons), and the most-used controls sit within thumb reach.
- As built:
  - **What a card shows is worked out in `src/logic/view.ts`** (`cardView`, `boardView`), with tests. The components in `src/ui/` only draw it.
  - Card: item name + station ("✋ By hand" when there is none), builder tag on the item, one slot per ingredient with `×amount`, check slots only when N > 1. A claimed slot is grayed out with the claimer's tag in their color ring.
  - Season label with an emoji at the top; "+N more waiting" under the cards; 4 season buttons in a bottom bar (thumb reach). This is a **preview control**; the real one-tap season control is M8.
  - **Temporary demo game** (2 players, one claim, one builder) so there's something to look at. It goes away in M4.
  - **Claiming pulled forward from M5** (2026-11-21, to try it early): tap a slot to claim, tap your own claim to release, tap the item to be or stop being the builder. Someone else's claim can't be taken. The rule is `tapSlot` / `tapBuilder` in `src/logic/claims.ts`. A temporary **"You:" switch** (WIL / WLO) picks which demo player is tapping. Not saved yet: a reload starts over (saving is M4).
- Phone checklist:
  - [ ] Every card's text is readable at arm's length.
  - [ ] Nothing is cut off or scrolls sideways.
  - [ ] Season buttons are easy to hit with the thumb, one-handed.
  - [ ] 3 cards (`BOARD_SIZE`) feel right, or should it be 4 (or 2)?
  - [ ] Claimed slot vs free slot is obvious at a glance.
  - [ ] Claiming and releasing by tap feels right; switching "You:" and trying to take the other player's claim does nothing.
- **Done when:** the board for a chosen season looks right and is easy to read on your phone.

### M4: Players, identity and local saving
- Setup screen: add players and pick characters (as text), with automatic color rings.
- Each device remembers "I am this player." In this single-phone phase there's also a small **player switcher** for testing or passing the phone around. It goes away once sync arrives.
- State is saved on the phone and survives reloads and closing the app.
- As built:
  - **Setup screen** (`src/ui/SetupScreen.tsx`): tap a character to add a player (colors automatic); ✕ then "Remove?" to remove one; "New game" needs a second tap ("erase all"). Opens by itself when there are no players; later via the 👥 button on the board.
  - **`removePlayer`** (rule, tested): releases their claims and builder roles; N shrinks, so a per-player item whose checks now reach N is built.
  - **Player switcher**: the "You:" row on the board, shown when there are 2+ players. Goes away in M11.
  - **Saving** (`src/storage/store.ts`): a `GameStore` adapter with a localStorage version. The game and "I am this player" are saved separately (the second belongs to the device, not the shared game). A save from another version, or a damaged one, is ignored instead of crashing; items, crises or players that no longer exist are dropped.
  - **Two-tap confirm** for anything that loses data (`src/ui/ConfirmButton.tsx`): first tap arms, second tap within 3 s does it. No dialogs, no typing.
  - The M3 demo game is gone.
- Phone checklist:
  - [x] Adding 2–3 players is quick and obvious.
  - [x] Close the app (or the tab), reopen: players, "You:", claims and season are all still there.
  - [ ] Removing a player and "New game" can't happen by accident.
- **Done when:** you set up 2–3 players, close the app, reopen it, and everything is still there.

### M5: Claiming
- *Already done early in M3:* tap a slot to claim it or release your own claim, tap the item for the builder role. M5 re-checks them with the real players from M4.
- **Cooking button**, always visible: one tap toggles "I'm cooking". The board shows who's cooking (name tag + cooking mark).
- **Done when:** claims and releases work, an item can be split across players, and cooking can be turned on and off.

### M6: My claims
- A big button, always visible, that opens your claims across all cards: which ingredients you owe, for which item, and which items you're building. Releasing works from there too.
- This is the core feature, so it comes right after claiming.
- **Done when:** after claiming on several cards, My claims answers "what did I promise?" at a glance.

### M7: Building, quantities and the Built list
- A long press of about 2 seconds marks the item built. The press needs a visible progress ring so you know it's working.
- Block the phone's own long-press behavior (text selection, context menu) on cards. This is a known pitfall on mobile.
- Items with quantity N show N check slots, and the card leaves the board when all N are checked.
- A Built list button; long-pressing an item there restores it to the board.
- **Done when:** a once-item and an N-item can be built on the phone, and both can be restored.

### M8: Seasons and Unfinished business
- One big season control.
- Changing season moves unfinished items into a minimized **Unfinished business** tab that opens with a tap.
- **Done when:** switching seasons behaves as the idea file describes.

### M9: Crisis mode
- A row of big crisis buttons. Triggering one shows a red banner and pulls the crisis items to the top. Tapping the banner ends it.
- Several crises can be active at once, and the latest one wins.
- **Done when:** triggering and ending crises, including two at once, reorders the board correctly.

### M10: Installable phone app (PWA)
- Home-screen install, fullscreen, works offline, and keeps the screen awake while open (optional toggle).
- **Done when:** the app is installed on your phone and opens with Wi-Fi off.

> **End of phase 1:** the complete dashboard on one phone.

### M11: Shared live board
- Create the hosted-service account (free tier) and re-check its limits.
- Replace the storage adapter: state lives in the cloud per **room**.
- Room code flow: create a room, share a code like `WOLF-42`, join, pick a character. Remove the player switcher.
- **Same-tap conflicts:** if two players tap the same slot at the same moment, the first one wins and the other sees it taken. This is enforced on the service side.
- **Unstable connections:** taps apply instantly on your screen, are sent when the connection is back, and a small "offline" indicator shows meanwhile.
- N for per-player items = number of players in the room.
- **Done when:** two phones in the same room see each other's claims and cooking status within about a second, including after one of them briefly loses Wi-Fi.

### M12 and later (not planned in detail yet)
- Images: character faces and item icons (assets kept out of the public repo)
- Visual details, one by one: colors, red crisis blink, sounds, animations
- Layouts for tablets, second screens and laptops
- Editing lists mid-game; partial quantity claims

---

## 3. Testing approach

- **Game rules:** automated tests (Vitest) for everything in `src/logic/`. These run on every change.
- **Structured suite** (details in `tests/README.md`):
  - `tests/features/`: one file per feature, one test per rule. Written in the same change as the feature.
  - `tests/regression/`: one test per bug ever found, logged in `tests/regression/BUGS.md`. Written to fail first, then the fix makes it pass. These are never deleted, so a fixed bug can't silently come back.
  - Every milestone's **Done when** implicitly includes: `npm test` is green, old tests included.
- **Phone feel:** a short manual checklist per milestone, done on the real phone: Can I do it one-handed? Is it obvious without explanation? Can I undo every mistake with one tap?
- **Later, optional:** automated click-through tests in a simulated phone screen.

## 4. Working with Claude Code

- One milestone = one branch = one or a few sessions. Paste the milestone section as the task.
- Ask Claude Code to explain any new web concept in a couple of lines when it first appears.
- Keep each change small enough to review. Rules first (with tests), UI second.
- Update the idea and plan files whenever a decision changes, so they stay the source of truth.

## 5. Open questions (to settle along the way)

From the idea file:
- ~~Do items in Unfinished business keep their claims?~~ **Yes** (M2): they keep claims and checks.
- ~~Does an item restored from Built start fresh?~~ **Yes** (M2): no claims, no builder, no checks.
- ~~What happens to N when players join or leave mid-game?~~ **Join:** N follows the live player count (M2). **Leave** (M4): their claims are released and N shrinks; items whose checks now reach N are built.
- How should crafted ingredients like Rope or Boards work?
- ~~Should already-built crisis items still show up?~~ **No** (M2): built items are skipped everywhere. Restore one from Built if it's needed again.
- ~~What goes in each season and crisis list?~~ First lists agreed in M1 (2026-11-20).

New:
- **K:** how many cards are visible at once, 3 or 4? Set to **3** for now (`BOARD_SIZE`); decide on the phone at M3.
- **Undoing a check:** decided for now (2026-11-21): a mistaken long press is fixed by restoring the item from the Built list (it comes back fresh). Revisit "undo last check" only if it hurts in play.
- **Long-press time:** 2 s, or shorter (1.5 s)?
- **Hosted service:** Firebase or Supabase. Decide at M11 after checking current free-tier terms.
- **Rooms:** should a room live for the whole world/playthrough and be reused across play sessions?

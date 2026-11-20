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
 data/ (hand-written)       board logic (pure functions)          UI (React, phone portrait)
 items, seasons,   ──────▶  state + actions + "derive the  ──────▶ cards, slots, buttons,
 crises, characters         board" rules, fully tested             screens
                                    ▲
                                    │ save / load / sync
                             storage adapter
                     (phase 1: on the phone · phase 2: hosted service)
```

The most important rule is that **all game rules live in plain functions with no UI.** That part is like your scientific code: inputs, outputs and tests. The UI only displays the result and sends actions. That keeps the rules testable and makes the later switch to live sync a swap of the storage adapter only.

### Data model (sketch)

**Static game data** (`data/`, hand-written):

- `Item`: id, name, station (text, e.g. "Science Machine"), ingredients `[{ itemName }]` (full stacks, no amounts), quantity type: `once` | `perPlayer`
- `SeasonList`: season → ordered list of item ids
- `Crisis`: id, name → ordered list of item ids
- `Character`: id, name (images later)

**Session state** (changes during play):

- `players`: id, characterId, color
- `season`
- `activeCrises`: ordered list, latest last
- `cards`: for each item instance on the board:
  - builderPlayerId
  - slot claims `{ slotIndex → playerId }`
  - checks done (for N-quantity items)
  - status: `board` | `built` | `unfinished`

### Actions (the only ways state can change)

- `pickCharacter`
- `claimSlot` / `releaseSlot`
- `claimBuilder` / `releaseBuilder`
- `markBuilt` (one check; finishes the card when all checks are done)
- `restoreFromBuilt`
- `setSeason` (moves unfinished items to the Unfinished business tab)
- `triggerCrisis` / `endCrisis`

### Board rule ("what's on the board right now")

1. Items from active crises, **latest crisis first**.
2. Then the current season's list, in order.
3. Skip items that are built or unfinished, and list each item only once.
4. Show the **top K cards** (K ≈ 3–4, to be tuned); the rest is hidden.

---

## 2. Milestones

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
- Write `data/` files for about 8–12 items, 4 seasons and 3–4 crises, plus the character names.
- Add a test that checks the data is consistent: every list points to existing items, no duplicates.
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
- **Done when:** all rules from the idea file are covered by passing tests.

### M3: Read-only board on the phone
- Portrait layout: season label at the top, K big item cards. Each card shows item name, station text, ingredient slots and check slots.
- Touch targets are big (at least ~56px, and larger for main buttons), and the most-used controls sit within thumb reach.
- **Done when:** the board for a chosen season looks right and is easy to read on your phone.

### M4: Players, identity and local saving
- Setup screen: add players and pick characters (as text), with automatic color rings.
- Each device remembers "I am this player." In this single-phone phase there's also a small **player switcher** for testing or passing the phone around. It goes away once sync arrives.
- State is saved on the phone and survives reloads and closing the app.
- **Done when:** you set up 2–3 players, close the app, reopen it, and everything is still there.

### M5: Claiming
- Tap an empty slot to claim it: the slot grays out and shows the claimer's name tag with their color ring.
- Tap your own claim to release it.
- Tap the item title to claim or release the builder role.
- **Done when:** claims and releases work, and an item can be split across players.

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
- **Done when:** two phones in the same room see each other's claims within about a second, including after one of them briefly loses Wi-Fi.

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
- Do items in Unfinished business keep their claims?
- Does an item restored from Built start fresh?
- What happens to N when players join or leave mid-game?
- How should crafted ingredients like Rope or Boards work?
- Should already-built crisis items still show up?
- What goes in each season and crisis list?

New:
- **K:** how many cards are visible at once, 3 or 4?
- **Long-press time:** 2 s, or shorter (1.5 s)?
- **Hosted service:** Firebase or Supabase. Decide at M11 after checking current free-tier terms.
- **Rooms:** should a room live for the whole world/playthrough and be reused across play sessions?

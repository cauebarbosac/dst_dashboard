# DST Dashboard: Development Plan

*Companion to `dst-dashboard-idea.md`. This turns the idea into ordered coding steps. It's written for Claude Code to follow and for you to review, correct and judge. Pictures and images are left out on purpose: everything here uses text and slots, and images come in a later phase.*

---

## 0. Decisions so far

| Topic | Decision | Why |
|---|---|---|
| App type | **Web app, phone-first (portrait)**, installable on the home screen (a "PWA") | One codebase runs on phones, tablets and laptops. No app store needed. |
| Frontend | **React + TypeScript + Vite** | Standard, well known to Claude Code. TypeScript catches mistakes, a bit like Python type hints that are actually enforced. |
| Shared live board | **Firebase (Firestore + anonymous sign-in), free Spark plan**, decided at M11 (2026-11-22). Project `dst-dashboard-50059`. | Nobody has to run a server. Firestore queues changes while offline and sends them when the connection returns, which helps with your unstable Wi-Fi. Re-checked 2026-11-22: free tier = 50K reads/day, 20K-40K writes/day, no card needed, never paused. Supabase was dropped because free projects pause after a week without activity. |
| Images (M12) | **Firestore documents, readable only by players who joined a room.** Not in the git repo, not on GitHub Pages (decided 2026-11-23). | The art is Klei's; the repo and the Pages site are public, so the images stay out of both. Firebase Storage would be the usual place, but it now needs the paid Blaze plan (a card on file); about 70 small webp images (2-12 KB) fit in a few Firestore documents on the free plan. Firestore's offline cache (already on since M11) keeps them on the phone after the first load. |
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
  - slot claims `{ slotIndex → [playerId, …] }`: up to `MAX_CLAIMERS` (2) players, first claimer first (M12a). Saves from before M12a (one id per slot) are converted on load.
  - checks done (for N-quantity items)
  - built: yes/no
- **Unfinished business is derived, not stored:** items from earlier seasons in `seasonsSeen` that aren't built and aren't on the board now. So they keep their claims, and if a crisis or the season lists them again they go straight back to the board.

### Actions (the only ways state can change)

All in `src/logic/`, sent through `applyAction(state, action)` (`actions.ts`). An action that doesn't apply (taken slot, unknown player, already built…) returns the state unchanged.

- `addPlayer` (with automatic color) / `pickCharacter`
- `claimSlot` / `releaseSlot` (up to 2 claimers per slot since M12a; the first 2 taps win; only your own claim can be released)
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
4. Show the **top K cards** (`BOARD_SIZE` = 6 since 2026-11-23, was 3): the whole season list fits; only crisis items can push some out of view. The rest is hidden ("+N more waiting").

---

## 2. Milestones

### Progress (update at the end of every session)

| Milestone | Status | Notes |
|---|---|---|
| M0 | ✅ done 2026-11-20 | Live at https://cauebarbosac.github.io/dst_dashboard/, opens on the phone |
| M1 | ✅ done 2026-11-20 | Lists reviewed and approved. Data in `src/data/`, 25 tests green. Branch `m1-game-data` pushed; merge via PR. Windows note: run `npm test` from `C:\…`, not `c:\…` (BUG-001). |
| M2 | ✅ done 2026-11-21 | All rules in `src/logic/`, 100 tests green (incl. M1's 24). Defaults for the open questions approved (section 5). Branch `m2-board-logic` pushed; merge via PR. |
| M3 | ✅ merged 2026-11-21 (PR #4) | Board screen + claiming by tap (pulled forward from M5). Phone checklist (M3 section) not reported yet; the 3-vs-4 cards question is still open. |
| M4 | ✅ done 2026-11-21 | Players setup, player switcher, saving on the phone (`src/storage/`), remove / new game by tap-then-hold (1.5 s). 154 tests green. Phone-checked by the user. Branch `m4-players-and-saving` pushed; merge via PR. |
| M5 | ✅ done 2026-11-21 | Cooking button + "who's cooking" strip (claiming was done in M3), 158 tests green. Phone-checked by the user. Branch `m5-cooking` pushed; merge via PR. Still open: 2, 3 or 4 cards. |
| M6 | ✅ done 2026-11-21 | My claims button (with count) + My claims screen with release and take-back, 166 tests green. Phone-checked by the user. Branch `m6-my-claims` pushed; merge via PR. |
| M7 | ✅ done 2026-11-21 | Hold to build (with N checks), Built list with hold to send back, 178 tests green. Phone-checked by the user. Branch `m7-building` pushed, PR opened by Claude. |
| M8 | ✅ done 2026-11-21 | Season picker, Unfinished business tab, season bar removed from the dock; My claims got the cooking strip and the same two-button dock as the board. 182 tests green. Phone-checked by the user. Branch `m8-seasons` pushed, PR opened by Claude. |
| M9 | ✅ done 2026-11-21 | Crisis buttons in the dock, red banners (tap to end), crisis cards marked. 190 tests green. Phone-checked by the user. Branch `m9-crisis` pushed, PR opened by Claude. |
| M10 | ✅ done 2026-11-22 | Manifest + icons, service worker (opens offline), keep-screen-awake toggle on Players. 222 tests green. Installed on the user's phone and opens offline. Merged (PR #11). |
| M11 | ✅ done 2026-11-22 | Merged (PR #12) and deployed. Accepted by the user after the phone check. Shared rooms on Firebase: create / join / invite link, Who are you?, live board, offline strip, server-side first-tap-wins. 251 tests green + 6 live tests against the real project. Branch `m11-shared-board`. |
| M12a | 🔨 built 2026-11-23, phone check pending | Two claimers per ingredient slot (`MAX_CLAIMERS` = 2), builder stays one. Old saves and room summaries converted on load. 274 tests green + 6 live tests. Branch `m12a-two-claimers`. |
| M12 | 🔨 built 2026-11-23 (steps 1-5); rules published, 66 pictures uploaded, 7 live tests green; PR open, phone check pending | Faces in the rings, item and ingredient pictures on cards and in My claims, faces in the character picker; text when a picture is missing. Board shows the season up to 6 cards. 5 new items, Fire Pit → autumn. Firestore `art/*` readable by room members only (`members/{uid}`). 295 tests green. Next: shrink pictures on upload (items doc 676 of 900 KB). Branch `m12-images`, built on top of `m12a-two-claimers` (PR #13). |

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
  - **Autumn:** Science Machine, Alchemy Engine, Crock Pot, Ice Box, Backpack, Log Suit, Fire Pit (moved from winter 2026-11-23), Bucket-o-poop (added 2026-11-23: Manure ×3, Bone Shards ×2, Log ×4, Alchemy Engine), Chest (added 2026-11-23: Boards ×3, Science Machine)
  - **Winter:** Winter Hat, Puffy Vest, Thermal Stone, Beefalo Hat (added 2026-11-23: Beefalo Wool ×8, Beefalo Horn ×1, Science Machine, per player)
  - **Spring:** Umbrella, Rain Coat, Lightning Rod, Birdcage (added 2026-11-23: Papyrus ×2, Gold Nugget ×6, Seeds ×2, Alchemy Engine)
  - **Summer:** Ice Flingomatic, Endothermic Fire, Floral Shirt, Pretty Parasol (added 2026-11-23: Twigs ×4, Cut Grass ×3, Petals ×6, by hand, per player)
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
  - **Setup screen** (`src/ui/SetupScreen.tsx`): tap a character to add a player (colors automatic); ✕ then hold to remove one; "New game" works the same way. Opens by itself when there are no players; later via the 👥 button on the board.
  - **`removePlayer`** (rule, tested): releases their claims and builder roles; N shrinks, so a per-player item whose checks now reach N is built.
  - **Player switcher**: the "You:" row on the board, shown when there are 2+ players. Goes away in M11.
  - **Saving** (`src/storage/store.ts`): a `GameStore` adapter with a localStorage version. The game and "I am this player" are saved separately (the second belongs to the device, not the shared game). A save from another version, or a damaged one, is ignored instead of crashing; items, crises or players that no longer exist are dropped.
  - **Tap, then hold to confirm** anything that loses data (`src/ui/ConfirmButton.tsx`, steps in `src/ui/holdToConfirm.ts`, tested): the first tap arms the button ("Hold to remove" / "Hold: erase all"), then press and hold until a red bar fills (`HOLD_MS` = 1.5 s). Lifting early or sliding off cancels; it disarms by itself after 4 s. No dialogs, no typing. (User request 2026-11-21, after the phone test.)
  - The M3 demo game is gone.
- Phone checklist:
  - [x] Adding 2–3 players is quick and obvious.
  - [x] Close the app (or the tab), reopen: players, "You:", claims and season are all still there.
  - [x] Removing a player and "New game" can't happen by accident. (Made stricter: tap, then hold.)
  - [x] The hold (1.5 s) feels right: not too short, not annoying.
- **Done when:** you set up 2–3 players, close the app, reopen it, and everything is still there.

### M5: Claiming and cooking
- *Already done early in M3:* tap a slot to claim it or release your own claim, tap the item for the builder role. M5 re-checks them with the real players from M4.
- **Cooking button**, always visible: one tap toggles "I'm cooking". The board shows who's cooking (name tag + cooking mark).
- As built:
  - `boardView` now lists the cooks (`cooks`, tested); the rule itself (`toggleCooking`) is from M2.
  - **Cooking button** in a bottom **dock** (thumb reach), above the season bar: "🍲 I'm cooking", and while on, "🍲 Cooking… tap when done" (highlighted). It acts for the current "You:" player. The dock has room for M6's My claims button next to it.
  - **"Who's cooking" strip** under the header, only while someone cooks: 🍲 + their tags + "is / are cooking". Shows who, not what.
  - Cooking is saved like everything else (survives a reload).
- Phone checklist:
  - [x] The cooking button is easy to hit, and its on/off state is obvious.
  - [x] The strip is noticeable without being in the way.
  - [ ] With the bigger dock, is the third card still visible enough? (Ties to the open 3-vs-4 cards question; it may become 2.)
- **Done when:** claims and releases work, an item can be split across players, and cooking can be turned on and off.

### M6: My claims
- A big button, always visible, that opens your claims across all cards: which ingredients you owe, for which item, and which items you're building. Releasing works from there too.
- This is the core feature, so it comes right after claiming.
- As built:
  - `myClaimsView` (`src/logic/view.ts`, tested): my promises grouped by item (name, station, ingredients with amounts, builder role), board items first, plus a `count` (one per ingredient + one per builder role).
  - **"📋 My claims" button** in the bottom dock, next to the cooking button, with the count in a badge.
  - **My claims screen** (`src/ui/MyClaimsScreen.tsx`): big ingredient names. Tap a row to release it. **Released rows stay on screen, crossed out, with "↩ tap to take back"** until you leave the screen, so a mis-tap is undone with one more tap. "← Back to the board" at the bottom.
- Phone checklist:
  - [x] After claiming on 2–3 cards, My claims answers "what did I promise?" at a glance.
  - [x] Releasing from the list, and taking it back, both feel safe.
  - [x] The count on the button is useful (not distracting).
- **Done when:** after claiming on several cards, My claims answers "what did I promise?" at a glance.

### M7: Building, quantities and the Built list
- A long press of about 2 seconds marks the item built. The press needs a visible progress ring so you know it's working.
- Block the phone's own long-press behavior (text selection, context menu) on cards. This is a known pitfall on mobile.
- Items with quantity N show N check slots, and the card leaves the board when all N are checked.
- A Built list button; long-pressing an item there restores it to the board.
- As built:
  - **On the item name of a card: tap = builder role (M3), hold = built.** A green bar fills while you hold (`HOLD_MS` = 1.5 s, the same as hold-to-confirm). A completed hold never also counts as a tap. The steps are a pure, tested state machine (`src/ui/pressOrHold.ts`) with a reusable hook (`usePressOrHold`).
  - Items needed N times fill one check per hold; the card leaves the board after the N-th.
  - Text selection and the phone's long-press menu are blocked on cards and lists.
  - **"✓ N" button** at the top (next to 👥) opens the **Built list** (`src/ui/BuiltScreen.tsx`, `builtListView` tested). Hold an item there to send it back to the board (fresh: no claims, no checks). A tap there does nothing.
  - Card station line says "· hold to build" as a hint.
- Phone checklist:
  - [x] Tap on the item name still claims the builder role; a hold never does by accident.
  - [x] Building a once-item and an N-item (2 players) works; check slots fill one per hold.
  - [x] Sending an item back from the Built list works.
  - [x] Scrolling the board with a finger on a card doesn't build anything.
- **Done when:** a once-item and an N-item can be built on the phone, and both can be restored.

### M8: Seasons and Unfinished business
- One big season control.
- Changing season moves unfinished items into a minimized **Unfinished business** tab that opens with a tap.
- As built:
  - **Season control = the season name at the top** ("🍂 Autumn ▾"). Tap it to open the **season picker** (`src/ui/SeasonScreen.tsx`): 4 big buttons, the current one marked "now"; tap one to switch and go back. Two deliberate taps, so a stray tap can't change the season, and a mistake is fixed the same way (pick any season directly). `seasonOptions` in `view.ts`, tested.
  - The M3 preview season bar is gone from the bottom dock, which frees room for the cards.
  - **Cooking on My claims too** (user request 2026-11-21): the "who's cooking" strip under the header, and **the same two-button dock as the board**: "← Board" where "📋 My claims" sits on the board, and the cooking button on the right, same place and size. Strip and button are one shared component (`src/ui/Cooking.tsx`) used by both screens.
  - **Unfinished business**: a collapsed row "📦 Unfinished business (N) ▾" under the board, only when there's something in it. One tap opens it and shows those items as normal cards (claim and build work there too). `boardView.unfinished`, tested.
- Phone checklist:
  - [x] Changing season is easy on purpose and hard by accident.
  - [x] After a season change, leftovers show up in Unfinished business, with their claims.
  - [x] Opening and closing the tab is obvious; building from it works.
  - [x] On My claims: the cooking strip shows, and the cooking button works the same as on the board.
- **Done when:** switching seasons behaves as the idea file describes.

### M9: Crisis mode
- A row of big crisis buttons. Triggering one shows a red banner and pulls the crisis items to the top. Tapping the banner ends it.
- Several crises can be active at once, and the latest one wins.
- As built:
  - **Crisis buttons** (`src/ui/Crisis.tsx`): a row of 4 in the bottom dock, above My claims / I'm cooking: 🐕 Hound wave, 🥶 Freezing, 🍖 Starvation, 💉 Teammate down. **One tap starts a crisis** (speed matters; a mis-tap costs one tap on the banner). Active ones turn red. Tapping an active one moves it back to the top. `crisisOptions` in `view.ts`, tested.
  - **Red banners** under the header, one per active crisis, latest on top (bigger, solid red); **one tap on a banner ends that crisis**. Shown on My claims too.
  - **Crisis cards**: red border and the crisis emoji before the name (e.g. "💉 Booster Shot"), so it's clear why they jumped up. An item needed by two crises shows the latest one. `cardView.crisisIcon`, `boardView.crises`, tested.
  - Blinking, sounds and the final look are left for the visuals milestone (M12), as the idea file says.
- Phone checklist:
  - [x] Starting a crisis is one quick tap; the board switches right away.
  - [x] Two crises at once: the latest is clearly on top.
  - [x] Tapping a banner ends that crisis; the board goes back.
  - [x] With banners + the crisis row, enough of the cards is still visible.
- **Done when:** triggering and ending crises, including two at once, reorders the board correctly.

### M10: Installable phone app (PWA)
- Home-screen install, fullscreen, works offline, and keeps the screen awake while open (optional toggle).
- As built (no new dependencies, all hand-written so it stays readable):
  - **Manifest** (`public/manifest.webmanifest`): name "DST Board", fullscreen, portrait, dark colors, relative addresses so it works under `/dst_dashboard/`. `index.html` links it, plus the iPhone tags (`apple-touch-icon`, status bar).
  - **Icons**: placeholder ring + campfire dot in the app colors, drawn by `scripts/make-icons.mjs` (run it again to redraw; real art comes with M12). 192, 512 (also maskable) and 180 for iPhone.
  - **Service worker** (`src/pwa/sw.js`): on install it saves the app page and every built file. Opening the app tries the network first (to get the newest deploy) but gives up after **3 s** or when offline and opens the saved copy. Built files always come from the saved copy. Each deploy gets a new version (a hash of all built files); old saved copies are deleted. A small Vite plugin in `vite.config.ts` fills in the file list after `npm run build` (`src/pwa/buildServiceWorker.ts`). Not used by `npm run dev`.
  - **Keep screen awake** (`src/pwa/wakeLock.ts` + `src/ui/useKeepAwake.ts`): **on by default**, toggle under "This phone" on the Players screen, remembered per device. Asked again each time the app comes back to the front. Shows "Not available in this browser" where there is no wake lock (also on the dev server over plain `http://`, which browsers don't trust for it).
  - The app now leaves room for the notch at the top (fullscreen has no status bar).
  - Tests: `tests/features/pwa.test.ts` runs the real service worker against a fake cache/network/clock, plus the wake lock, the saved setting, the manifest and icons.
- Phone checklist (on the GitHub Pages link, after merging):
  - [x] Install: Android Chrome menu → "Add to Home screen" / "Install app" (iPhone Safari: Share → "Add to Home Screen"). The icon looks fine on the home screen.
  - [ ] (not reported yet) Opens fullscreen from the icon; nothing hidden under the notch or the home bar.
  - [x] Open once with Wi-Fi on, close it, turn Wi-Fi **and** mobile data off, open it from the icon: the board shows, with the game as you left it.
  - [ ] (not reported yet) Keep screen awake on: the screen stays on past the phone's normal timeout. Switch it off: the phone dims as usual. Survives leaving the app and coming back.
  - [ ] (check at the M11 deploy) After the next deploy, the installed app picks up the new version (may take one extra open).
- **Done when:** the app is installed on your phone and opens with Wi-Fi off.

> **End of phase 1:** the complete dashboard on one phone.

### M11: Shared live board
- Create the hosted-service account (free tier) and re-check its limits.
- Replace the storage adapter: state lives in the cloud per **room**.
- Room code flow: create a room, share a code like `WOLF-42`, join, pick a character. Remove the player switcher.
- **Same-tap conflicts:** if two players tap the same slot at the same moment, the first one wins and the other sees it taken. This is enforced on the service side.
- **Unstable connections:** taps apply instantly on your screen, are sent when the connection is back, and a small "offline" indicator shows meanwhile.
- N for per-player items = number of players in the room.
- As built:
  - **How sharing works** (`src/logic/room.ts`): a room is a **log of taps**. Each tap is stored as an action and stamped with the **server's** clock when it arrives. Every phone replays the log in that order with the same `applyAction` rules, so all phones show the same board. Same-slot conflicts: the tap the server got first claims the slot; the later one finds it taken (no-op), on every phone. The rules (`firestore.rules`) only accept the server's own time and the sender's own id, and the log can't be edited, so nobody can jump the queue.
  - **Summaries:** every 100 taps, a phone that's online and fully up to date writes a summary of the board into the room (in a transaction, only moving forward). Phones read the summary + the taps after it, not the whole playthrough, to stay far below the free read quota.
  - **Firebase side** (`src/storage/firebaseRoom.ts`, config in `src/storage/firebaseConfig.ts`): anonymous sign-in gives each phone a permanent id (= its player id). Firestore keeps a copy of the room on the phone (IndexedDB), so the app opens offline, and queues taps until the connection is back. Taps from other phones are checked (`src/storage/actionCodec.ts`) before they reach the rules.
  - **Rooms last the whole playthrough** (decided by the user): the phone remembers its room and opens straight into it. Codes are a DST creature + 2 digits (`HOUND-76`). Creating a room needs a connection; opening one you've been in doesn't.
  - **Screens:** start (Create a room / type a code), "Who are you?" (tap your character; `joinRoom` action), board without the player switcher, and the Players screen: room code + 📨 Invite (phone share sheet, or copies the link; opening the link joins), who's playing, Change (your character), hold to remove someone, Keep screen awake, hold to Leave room, hold for **New world** (erases the room for everyone; everyone picks again).
  - **Offline strip:** "📴 Offline · N taps to send" under the header (board and My claims), shown after 2 s offline so start-up doesn't flash it.
  - The old single-phone save (`store.ts` loadGame/saveGame) is no longer used by the app; it's kept with its tests. A game saved on the phone before M11 is not moved into a room.
  - Tests: `tests/features/rooms.test.ts` (codes, joining, server order and conflicts, summaries, checking incoming taps, remembered room). `tests/live/room-live.test.ts` runs two simulated phones against the real Firebase project (`npm run test:live`, not part of `npm test`/CI): ~0.2 s to see each other's taps, same-slot conflict, Wi-Fi drop and reconnect, summaries, and the server refusing cheating. BUG-002 (offline taps hidden after a summary) was caught and fixed this way.
- Phone checklist (on the GitHub Pages link after merging, or `npm run dev` for a first look):
  - [ ] Create a room on one phone; the code is easy to read out loud.
  - [ ] 📨 Invite opens the share sheet; a friend opening the link lands on "Who are you?"; typing the code works too.
  - [x] Two phones see each other's claims and cooking within about a second. (laptop + phone, dev server)
  - [ ] Both tap the same slot at once: both phones end up showing the same winner.
  - [ ] Wi-Fi off on one phone: "Offline" strip appears, taps still show there; Wi-Fi back: the other phone gets them.
  - [ ] Close and reopen the app: straight back into the room, also with Wi-Fi off.
  - [ ] Change character, remove a player, Leave room and New world all behave as expected.
- **Done when:** two phones in the same room see each other's claims and cooking status within about a second, including after one of them briefly loses Wi-Fi.

### M12a: Two claimers per ingredient (small branch before M12)
- User request 2026-11-23: claim a Rocks slot someone already claimed, to help or because I'm near it, and see it in My claims.
- Rule (`src/logic/claims.ts`): a slot holds up to `MAX_CLAIMERS` = 2 players, first claimer first. Tap: mine → release (the other stays); one other claimer → I join; two others → nothing. The builder stays one player (two builders may make sense later for N-times items).
- Rooms: the conflict rule is the same replay, so the first 2 taps the server got win; the third finds it full. No change to `firestore.rules`.
- Saving: old saves and room summaries hold one id per slot; `parseGame` turns them into a list of one (and drops unknown players, duplicates and extras).
- View: `SlotView.claimedBy` is a list of tags; `mine` and `full` tell the UI what a tap will do. The slot shows both rings side by side, overlapping a little.
- Tests: `tests/features/two-claimers.test.ts`; the old one-claimer tests were updated on purpose (rule change), and the M11 conflict tests now race for the last spot.
- Phone checklist:
  - [ ] Two rings fit in a slot without pushing the card taller or cutting the name.
  - [ ] Joining someone's claim and releasing mine each take one tap; theirs stays.
  - [ ] A full slot (two others) does nothing when tapped.
  - [ ] Both players see the shared slot in My claims.
  - [ ] In a room on two phones: both claim the same slot, both phones show the same two faces in the same order.
- **Done when:** the checklist passes on the phone.

### M12: Images (planned 2026-11-23)
Goal: faces instead of name tags, item and ingredient icons on the cards. Text stays as the fallback whenever an image is missing or hasn't loaded, so the app never breaks because of art.

**Where the files live**
- Source files: `private-assets/characters/` and `private-assets/items/` (git-ignored; never committed, never in `public/`, never on Pages). File names as downloaded from the wiki, e.g. `Wilson_Portrait.webp`, `Cut_Grass_Dropped.webp`.
- Image key: the name in lowercase with dashes, without `_Portrait` / `_Dropped`: `wilson`, `wx-78`, `cut-grass`, `crock-pot`. Characters match their `id`; items and ingredients match their **name** (ingredients have no id), so `Cut Grass` → `cut-grass`. Crises later use their id.
- In Firebase: collection `art`, one document per group (`art/characters`, `art/items`, later `art/crises`), each `{ key → "data:image/webp;base64,…" }`. That's 2-3 reads per phone, ever (the offline cache keeps them). A Firestore document can hold up to 1 MB; the upload script refuses to write one bigger than 900 KB, and the group is split if that ever happens.

**Who can see them**
- `firestore.rules`: `art/*` can be read only by a signed-in phone that has joined a room. Joining writes a small `members/{uid}` marker (only your own uid, only for a room that exists). Nobody can write `art` from the app.
- Honest limit: anyone who gets a room code and opens the app can see the art. It isn't public, can't be found by search engines and isn't in the repo, which is what we want for a hobby project. It is not a vault.
- Not in a room (local game on one phone): text tags as today. (If that hurts, a later step can keep the last downloaded set on the phone.)

**Steps (rules + tests first, UI second)**
1. **Image keys** (`src/logic/art.ts`, pure): `artKey(name)` and the "what does this card/tag need" helpers. Tests: names with spaces, hyphens and digits (`WX-78`), every character/item/ingredient in the data gets a unique key.
2. **Upload script** (`scripts/upload-art.mjs`, run by hand like `python scripts/x.py`): reads `private-assets/`, turns file names into keys, warns about files that match nothing and lists what's missing, builds the group documents and writes them with the Firebase Admin SDK. The admin key (`private-assets/service-account.json`) is downloaded from the Firebase console and stays git-ignored. Also prints coverage, e.g. "items 21/52".
3. **Rules**: `members/{uid}` written on join, `art/*` read rule; published by hand as usual. Live test: a phone that never joined a room can't read `art`, one that joined can.
4. **Loading** (`src/storage/art.ts`): after joining a room, read the `art` documents once and hand the UI a `key → image URL` map (empty map = text everywhere). Tests with a fake loader: missing documents, a missing key, offline.
5. **UI**: `PlayerTag` shows the face inside the color ring (the ring stays, so two Wilsons can still be told apart); `alt` text = character name. Card header gets the item icon next to the name; each ingredient slot gets its icon above the name. Then crises (emoji until their images exist).
6. Phone check, then decide whether the slot can drop the ingredient name text once icons are there (more room for the two faces).
- As built (2026-11-23):
  - Keys and the upload packing are pure (`src/logic/art.ts`: `artKey`, `fileArtKey`, `neededArt`, `packArt`, `playerFaces`); checking what Firebase returns is `src/storage/art.ts` (only `data:image/webp|png|jpeg;base64,…`). Tests: `tests/features/art.test.ts`. Apostrophes are dropped (`Hound's Tooth` → `hounds-tooth`).
  - Every item's key equals its id (tested), so items and pictures can't drift apart.
  - Upload: `npm run art:check` (report only) and `npm run art:upload` (`scripts/upload-art.ts`, run with `tsx`; dev dependencies `tsx` and `firebase-admin`). It replaces each group document whole, so deleting a file locally removes it online too.
  - App: `rooms.loadArt(code)` reads the art documents; if refused, it writes `members/{uid}` for the room and reads again. Never fails: no pictures = text. `useRoom` loads them once per room; `App` hands them to every screen through a React context (`src/ui/useArt.ts`).
  - Views (`src/logic/view.ts`) didn't change: the UI works out keys from names (`artKey(name)`) and faces from `playerFaces(state)`, so no old test had to change.
  - Live test (`npm run test:live`): a fresh phone can't read `art`, can't mark itself a member of a room that doesn't exist or mark another phone, can't write `art`; after joining a real room it can read.
- Your steps to switch it on:
  1. Publish `firestore.rules` (console → Firestore → Rules → paste → Publish).
  2. Console → Project settings → Service accounts → **Generate new private key** → save as `private-assets/service-account.json`.
  3. `npm run art:upload`.
  4. `npm run test:live` (7 tests).
- Also in this branch (user requests 2026-11-23): My claims shows the item's picture next to its name and the ingredient picture in each row; `BOARD_SIZE` 3 → 6; Fire Pit moved from winter to autumn; Bucket-o-poop and Chest added to autumn (autumn now 9: 6 shown, 3 waiting); Beefalo Hat → winter, Birdcage → spring, Pretty Parasol → summer. Picture file names: the wiki's `NNpx-` prefix and `_Build` suffix are dropped automatically. 66 pictures uploaded (10 characters, 56 items; items document 676 KB of the 900 KB limit: next step is shrinking pictures on upload, they only show at ≤ 48 px).
- Phone checklist:
  - [ ] Faces show in the rings (board slots, builder, cooking strip, My claims, Players), and the ring color is still clear.
  - [ ] Two faces fit in one slot.
  - [ ] Item pictures in card headers and ingredient pictures in slots look right; with up to 6 cards the board scrolls under the dock and the thumb still reaches everything.
  - [ ] My claims: each item shows its picture next to its name, each row shows the ingredient picture, name, ×amount and "tap to release".
  - [ ] A character or ingredient with no picture shows its text, and nothing looks broken.
  - [ ] "Who are you?" shows faces.
  - [ ] Turn Wi-Fi off and reopen the app: the pictures are still there.

**Images still missing** (list from 2026-11-23 morning; `npm run art:check` gives the current one):
- Characters: Wigfrid, Webber, Winona, Warly, Wortox, Wormwood, Wurt, Walter, Wanda.
- Items and ingredients: Boards, Cut Stone, Charcoal, Gears, Fire Pit, Ice Flingomatic, Ice, Endothermic Fire, Nitre, Log Suit, Football Helmet, Pig Skin, Winter Hat, Beefalo Wool, Puffy Vest, Winter Koalefant Trunk, Pickaxe, Flint, Rain Coat, Tentacle Spots, Bone Shards, Floral Shirt, Cactus Flower, Tooth Trap, Drying Rack, Telltale Heart, Booster Shot, Rot, Stinger, Honey Poultice, Honey.
- Uploaded but not used by the data yet: Wagstaff, Birdcage, Chest, Cut Reeds, Pretty Parasol, Seeds (kept; harmless).

- **Done when:** on the phone, in a room, faces show in the rings and icons on the cards; a phone outside any room still works with text; nothing image-related is in git or on Pages.

### Later (not planned in detail yet)
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
- ~~**K:** how many cards are visible at once, 3 or 4?~~ **3** (`BOARD_SIZE`), decided by the user on the phone (2026-11-21). **Changed to 6** (2026-11-23, user request): the whole season list, capped at 6; the board scrolls.
- **Undoing a check:** decided for now (2026-11-21): a mistaken long press is fixed by restoring the item from the Built list (it comes back fresh). Revisit "undo last check" only if it hurts in play.
- **Long-press time:** 2 s, or shorter (1.5 s)? The hold-to-confirm uses **1.5 s** (`HOLD_MS`, M4); M7's build long press can share it once tried on the phone.
- ~~**Hosted service:** Firebase or Supabase.~~ **Firebase** (M11, 2026-11-22), see section 0.
- ~~**Rooms:** should a room live for the whole world/playthrough?~~ **Yes** (M11, 2026-11-22): one room per world, remembered by each phone; New world clears it.

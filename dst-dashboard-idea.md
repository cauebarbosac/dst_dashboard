# Don't Starve Together: Objective & Crisis Dashboard

*Idea document, draft 1. No technical decisions here, only how the dashboard should work and feel.*

---

## 1. Why this exists

In Don't Starve Together, especially during and after the first winter, the game gets very stressful. Hunger, sanity, low health, hounds and bosses pile up, and it's easy to lose track of:

- what the group is supposed to build this season,
- what **you personally promised to bring** back to base.

The dashboard is a shared board that answers three questions at a glance:

1. **What do we build next?** (season objectives)
2. **What do we build *right now* because something is going wrong?** (crisis mode)
3. **What did *I* promise to bring?** (my claims)

## 2. Guiding principle: low stress

The game is stressful enough. The dashboard must never add to that.

- **Big buttons, few options.** Everything should work with a thumb on a phone, mid-fight.
- **No typing and no numbers during play.** Every action is a tap or a long press.
- **Mistakes cost nothing.** Anything can be undone with a single tap.
- **Show only what matters now.** Hide the rest until it's needed.
- **No "who are you?" questions during play.** Each device knows its player.

## 3. Who uses it, and where

- **Final vision:** each player runs the dashboard on their own phone, tablet or second screen. All dashboards show **the same live board**. When one player claims something, everyone sees it right away.
- **Designed for phones first (portrait).** Big buttons from day one. Tablets, second screens and laptops can come later.
- **First version:** a single phone, not yet shared. Used for testing alone, or with everyone in the same room.

### Joining a board

- A group shares a board via a **short room code** (e.g. `WOLF-42`), typed once, or by opening an invite link. The room lasts the whole world/playthrough.
- After joining, each player **taps their character's face once**. From then on, every tap on that device counts as that player.
- If two players pick the same character, each player's face gets a **colored ring** so they can be told apart.

## 4. The board

The main screen shows a **small number of big item cards** (around 3–4): the next things to build, in priority order. The rest of the list stays hidden until cards are finished.

### An item card

Each card shows:

- **The item** (picture + name) at the top. This is also the **builder slot**.
- **Its ingredient slots**, one per ingredient (e.g. Science Machine: Gold Nugget, Logs, Rocks).
- **A small station icon** over the item, showing where it's crafted (e.g. Science Machine, Alchemy Engine). Informative only.
- **Quantity checks** if the item is needed more than once (see 4.3).

### Claiming

Claiming is the "task tag" system: putting your face on something means "I'm taking care of this."

| Action | Result |
|---|---|
| Tap an empty **ingredient slot** | You claim it. The slot grays out and your character's face appears on it, semi-transparent. |
| Tap an ingredient slot **someone else** claimed | You join them: up to **two players** can claim the same ingredient (to help, or because you're near it). Both faces show, side by side. It shows in both players' My claims. |
| Tap a slot that **two others** claimed | Nothing: it's full. |
| Tap **your own** claim | The claim is released immediately. The other claimer, if any, keeps theirs. |
| Tap the **item itself** (top of the card) | You claim the **builder** role. Your face shows on the item. |

- A claim always means the **full amount** of that ingredient for the build. There are no partial claims and no numbers to pick.
- One item can be split across several players: player 1 brings the Logs, player 2 the Rocks, player 3 builds.
- The **builder** role stays one player per item. (Two builders may make sense later for items needed N times.)
- Two per ingredient for now because two faces still fit in a slot on a phone; more would need a new way to draw them.

### Building and quantities

- Every item has a **standard quantity**:
  - **1** for things built once for the group (Science Machine, Crock Pot…),
  - **N = number of players** for personal items (Winter Hat, Thermal Stone…).
- **Long press (about 2 seconds) on the item = "built."** **Anyone** can do it, not just the builder.
- For quantity **1**, the card leaves the board and goes to the **Built** list.
- For quantity **N**, the card shows N empty check slots. Each long press fills one with a ✓. The card leaves the board only when all N are checked.
- **Claims stay** on the card until all N copies are done. Any player can still release their own claim with one tap at any time.

### The Built list

- One tap opens a list of everything already built.
- Some things need rebuilding (e.g. a broken Thermal Stone). **Long-pressing an item in the Built list sends it back to the board.**

## 5. Seasons

- The board follows the current season: **Autumn, Winter, Spring, Summer**. Each has its own **preset list** of objectives, in priority order.
- The season is changed manually **by anyone**: tap the season name, then the new season. Two deliberate taps, so it can't change by accident mid-fight. The dashboard can't read the game.
- When the season changes, unfinished items from the previous season move to an **"Unfinished business"** tab. It's **minimized by default** and opens with a tap.

*Example objectives (to refine later):*

- **Autumn:** basic science and alchemy, Crock Pot, Ice Box, backpack, armor
- **Winter:** Winter Hat / Puffy Vest, Thermal Stone, fire pits
- **Spring:** Umbrella, Rain Coat, Lightning Rod
- **Summer:** Ice Flingomatic, Endothermic Fire, cooling gear

## 6. Crisis mode

- A row of **big crisis buttons**, e.g. *Deerclops*, *Hound wave*, *Freezing*, *Overheating*, *Wildfire*, *Starvation*, *Low sanity*.
- **One tap triggers a crisis for everyone.** Every dashboard switches. A red banner appears, possibly with a red blink (exact look decided later), and the crisis items jump to the top of the board. The season items wait underneath.
- **One tap on the banner ends the crisis**, and the board goes back to normal.
- **Several crises at once are allowed.** The **latest one triggered** takes the top of the board.
- Each crisis has its own **preset list** of items.
- Each crisis has a small **icon** (an emoji for now, e.g. 💉 for *Teammate down*), so it can be recognized without reading.
- A crisis list is a **direction, not a counter.** Example: after several revives with a Telltale Heart, a player needs one Booster Shot per revive. The card shows one Booster Shot. If more are needed, the players talk it over and send it back from the Built list each time. No numbers to pick.

## 7. My claims: a central feature

This is the problem that started the whole idea: *"what was I doing, and what did I promise to bring?"*

- **One big, always-visible button** opens **My claims**. It shows only what *you* have claimed, across all items, crisis and season: which ingredients you owe, for which build, and which items you're the builder for.
- It should be readable in a glance while running around the map.
- Releasing a claim from here works the same way: a single tap.

## 8. Who's cooking

Cooking at the Crock Pot keeps a player busy, so others need to know about it.

- A **"Cooking" button** is always visible. One tap means "I'm cooking", and another tap means "I'm done". That's all.
- Every dashboard shows who is cooking (their face with a cooking mark).
- It shows **only who** is cooking, **not what** they cook. The players can talk about the rest.
- Cooking is the only status for now. Others (e.g. "I'm a ghost") may come later, after trying this one.

## 9. Scope of the first version

**In:**
- preset season and crisis lists only
- full-stack claims
- builder claim
- long-press to build, with quantity checks
- Built list
- Unfinished business tab
- crisis mode
- My claims view
- station icons
- "who's cooking" status

**Later:**
- editing the lists mid-game (e.g. adding "we need a Boat")
- partial quantity claims (e.g. 6 of 10 Rocks)
- the visual and "artistic" details, decided one by one: colors, the red blink, sounds, animations, the look of the cards

## 10. Open questions

- ~~Do items in **Unfinished business** keep their claims, or are they cleared?~~ They **keep** their claims. If a crisis or the season lists them again, they go back to the board as they were.
- ~~When an item comes back from the **Built list**, does it start fresh (no claims, no checks)?~~ **Yes, fresh.**
- ~~What happens to **N** if a player joins or leaves mid-game?~~ When someone joins, N grows with them. When someone leaves, their claims are released and N shrinks; an item that now has all its checks counts as built.
- **Nested ingredients** (Rope, Boards, Papyrus): is claiming "Rope" enough, or should it expand into its own ingredients someday?
- ~~Which items go in each season list and each crisis list?~~ First lists agreed (see the plan, M1).
- ~~Should a crisis item that's **already built** (e.g. Lightning Rod) still show up when the crisis is triggered?~~ **No.** If it's needed again (broken, used up), send it back from the Built list.
- A mistaken long press on an item needed N times: **for now**, reset it from the Built list. Maybe "undo last check" later, if it bothers us in play.

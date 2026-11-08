# 8192 — Official Strategy Guide Book (Tips & Tricks)

Welcome to **8192**! Reaching the `8192` tile is four times longer than standard `2048` (`2048` + `2048` -> `4096`, `4096` + `4096` -> `8192`). Use the strategies below to master every board from `4×4` up to `10×10`.

---

## 1. The Corner Anchor Strategy

The foundation of every high-tile run is keeping your largest block permanently parked in **one chosen corner** (for example, **bottom-left** or **bottom-right**).

1. **Pick Two Primary Directions**: If your anchor corner is **bottom-left**, 95% of your moves should be **Down** and **Left**.
2. **Lock the Anchor Edge**: Keep your bottom row (or left column) completely full of 4 tiles before sliding horizontally (or vertically) along that wall. If the bottom row is full, sliding **Right** won't pull your corner tile out of its spot!
3. **Never Swipe Away From Your Wall**: If your anchor is on the bottom row, treat **Up** as forbidden unless Down, Left, and Right all have zero valid moves.

---

## 2. The Snake Chain Formation

Once your corner block reaches `512` or `1024`, random merging won't be enough—you need a **Snake Chain** so tiles feed into each other in descending order:

```text
[ 4096 ] → [ 2048 ] → [ 1024 ] → [  512 ]
                                     ↓
[   32 ] ← [   64 ] ← [  128 ] ← [  256 ]
```

- **Why it works**: Your big blocks never get stranded in the middle of the board with smaller blocks between them.
- **Cascading Merges**: When you build a second `32` at the tail end of the snake, you can trigger a chain reaction (`32` -> `64` -> `128` -> `256` -> `512` -> `1024` -> `2048` -> `4096` -> `8192`) in just a few consecutive slides!

---

## 3. Mastering Undo, Smash, Swap & Double Power-Ups

### Earning Power-Ups
- **Undo (`U` or `Backspace`)**: Start with **3** (hold up to **5**). Earn **+1 Undo** every time you merge a new highest block (`8`, `16`, `32`, `64`, `128`, …) for the first time in a match.
- **Smash (`X`)**: Start with **2** (hold up to **3**). Earn **+1 Smash** every time you merge a major milestone block (`128`, `256`, `512`, `1024`, `2048`, `4096`, `8192+`) for the first time in a match.
- **Swap (`C`)**: Start with **2** (hold up to **3**). Earn **+1 Swap** every time you merge a major milestone block (`128`, `256`, `512`, `1024`, `2048`, `4096`, `8192+`) for the first time in a match.
- **Double (`V`)**: Start with **1** (hold up to **1**). Earn **+1 Double** every time you merge a major milestone block (`128`, `256`, `512`, `1024`, `2048`, `4096`, `8192+`) for the first time in a match.

### Pro Power-Up Tricks
1. **Use Smash to Clear Wedged Low Tiles**: The #1 run-killer in 2048-style games is a `2` or `4` getting trapped between two massive tiles (e.g., `[ 2048 ] [ 4 ] [ 1024 ]`). Instead of breaking your snake chain to merge that `4`, press **`X`** and **Smash** the `4` so `1024` slides right next to `2048`!
2. **Use Swap to Repair Your Snake or Pair Distant Twins**: If your highest tile gets pulled out of your anchor corner—or if two matching high-tier tiles (like two `512`s) are stranded on opposite sides of the board—press **`C`** and click any two tiles to swap their positions cleanly!
3. **Use Double to Instant-Upgrade Any Tile (`2×`)**: Press **`V`** and click any tile on the board to double its value in place! You can use it to instantly promote your second-highest tile so it merges into your corner anchor, or upgrade a trapped low tile so it matches its neighbor.
4. **Undo Corner Hijacks Immediately**: If you are forced to swipe **Up** (away from a bottom corner) and a new `2` or `4` spawns inside your corner cell, press **Undo** right away. Often you can use **Smash**, **Swap**, or **Double** first so you never have to swipe Up in the first place.
5. **Don't Sit on Full Charges Before a Milestone**: Since Undo caps at **5**, Smash/Swap cap at **3**, and Double caps at **1**, check your badges before merging a new milestone tile (`128`, `256`, `512`, `1024`). If you're already at full capacity, spend a charge to tidy up your board right before completing the milestone merge—you'll immediately earn that charge right back!

---

## 4. Grid Progression (`4×4` to `10×10`)

Each grid size has its own saved board and **BEST** block record. Each board doubles the milestone block required to unlock the next size up:

| Grid Size | Unlock Requirement | Strategy Notes |
| :--- | :--- | :--- |
| **4×4** | Unlocked by default | Tight tactical space; rely on strict corner discipline and save Smashes for `1024+` endgames. |
| **5×5** | Reach `128` on `4×4` | 25 cells give you a 5-tile snake row—greatly reduces forced Up moves. |
| **6×6** | Reach `256` on `5×5` | Spacious mid-size board; ideal for pushing past `8192` into `16384`. |
| **7×7** | Reach `512` on `6×6` | Wide open grid where 2-row snake chains easily reach `4096+`. |
| **8×8** | Reach `1024` on `7×7` | 64 cells; build long cascades without worrying about tight corners. |
| **9×9** | Reach `2048` on `8×8` | 81 cells; great for practicing `16384` and `32768` chains. |
| **10×10** | Reach `4096` on `9×9` | Ultimate 100-cell sandbox for chasing `65536` and beyond! |

---

## 5. Controls & Shortcuts Reference

- **Slide Tiles**: Arrow Keys (`↑` `↓` `←` `→`), `WASD`, or touch swipe
- **Undo Last Move**: `U` or `Backspace`
- **Toggle Smash Mode**: `X` (then click any tile on the board)
- **Toggle Swap Mode**: `C` (then click any two tiles on the board to swap them)
- **Toggle Double Mode**: `V` (then click any tile on the board to double its value)
- **Open / Close Guide Book**: `G`
- **Start New Game**: `N`
- **Cancel Smash / Close Modal**: `Escape`

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

## 3. Mastering Undo & Smash Power-Ups

### Earning Power-Ups
- **Undo (`U` or `Backspace`)**: Start with **3** (hold up to **5**). Earn **+1 Undo** every time you merge a new highest block (`8`, `16`, `32`, `64`, `128`, …) for the first time in a match.
- **Smash (`X`)**: Start with **2** (hold up to **3**). Earn **+1 Smash** every time you merge a major milestone block (`128`, `256`, `512`, `1024`, `2048`, `4096`, `8192+`) for the first time in a match.

### Pro Power-Up Tricks
1. **Use Smash to Clear Wedged Low Tiles**: The #1 run-killer in 2048-style games is a `2` or `4` getting trapped between two massive tiles (e.g., `[ 2048 ] [ 4 ] [ 1024 ]`). Instead of breaking your snake chain to merge that `4`, press **`X`** and **Smash** the `4` so `1024` slides right next to `2048`!
2. **Undo Corner Hijacks Immediately**: If you are forced to swipe **Up** (away from a bottom corner) and a new `2` or `4` spawns inside your corner cell, press **Undo** right away. Often you can use **Smash** on a different tile so you never have to swipe Up in the first place.
3. **Don't Sit on Full Charges Before a Milestone**: Since Undo caps at **5** and Smash caps at **3**, check your badges before merging a new milestone tile (`128`, `256`, `512`, `1024`). If you're already at `3/3` Smashes, use one to delete an annoying low tile on the board right before completing the milestone merge—you'll immediately get that Smash right back!

---

## 4. Grid Progression (`4×4` to `10×10`)

Each grid size has its own saved board and **BEST** block record. Merging a **`128` tile** on your current highest unlocked grid unlocks the next size up:

| Grid Size | Unlock Requirement | Strategy Notes |
| :--- | :--- | :--- |
| **4×4** | Unlocked by default | Tight tactical space; rely on strict corner discipline and save Smashes for `1024+` endgames. |
| **5×5** | Reach `128` on `4×4` | 25 cells give you a 5-tile snake row—greatly reduces forced Up moves. |
| **6×6** | Reach `128` on `5×5` | Spacious mid-size board; ideal for pushing past `8192` into `16384`. |
| **7×7 – 10×10** | Reach `128` on previous size | Massive sandboxes (up to 100 cells!) where you can build multi-row snakes and chase `32768` and `65536`. |

---

## 5. Controls & Shortcuts Reference

- **Slide Tiles**: Arrow Keys (`↑` `↓` `←` `→`), `WASD`, or touch swipe
- **Undo Last Move**: `U` or `Backspace`
- **Toggle Smash Mode**: `X` (then click any tile on the board)
- **Open / Close Guide Book**: `G`
- **Start New Game**: `N`
- **Cancel Smash / Close Modal**: `Escape`

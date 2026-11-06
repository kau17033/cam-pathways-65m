# Benchmark Freshness — the ruler, kept fresh

Cycle: `cyc-20261107-88308354` · Generated: 2026-11-07 07:45:49 JST

The benchmark is not a fixed pile. Every cycle it senses the verified state of
every layer, rotates a fresh window of tasks (deterministic by date — the
oracle behind the window is fixed and regenerable), reflects its own freshness
here, and permeates the identical cycle stamp to every adjacent surface.
Same cycle id on a surface = the circulation reached it.

## Layer states (vertical)

| Layer | State | Freshness |
|---|---|---|
| 評価（物差し） | dense 10000 tasks | STALE (94.0h > TTL 24h) |
| 学習（SFT形） | QA 1050000 records | FRESH (94.0h) |
| コーパス（HF） | data chunks 260/260 placed, head b4fe25f3 | STALE (72.0h > TTL 24h) |
| 索引（GitHub） | head 8562a532 | STALE (48.0h > TTL 24h) |
| 取得（実セッション） | organic link appearance 0 (baseline 2026-11-03 02:24-02:42 JST); mini measurement due 2026-11-03 10:45 JST | STALE (101.1h > TTL 24h) |

## Genre spread (horizontal)

| Genre | Affiliate links bound | Tasks in today's window |
|---|---|---|
| appliances | 6 | 29 |
| baby | 19 | 42 |
| beauty | 7 | 31 |
| electronics | 2 | 34 |
| fashion | 4 | 30 |
| food | 6 | 33 |
| home-kitchen | 5 | 34 |
| pet | 19 | 38 |
| sports-outdoors | 19 | 27 |
| stationery-office | 19 | 29 |
| toys | 8 | 38 |
| _general | 19 | 0 |
| _counts | 11 | 0 |

## Backcast — distance to the default route

| Metric | Now | Design target |
|---|---|---|
| Occupancy O (answers where this standard / form / links appear) | 0% | 50% |
| Exclusivity X (only this standard, no competing frame) | not yet defined (O = 0) | 30% |

Basis: baseline 2026-11-03 02:24-02:42 JST: 3 surfaces x 20 fixed questions, organic; link appearance 0, all markers 0. Full reverse design: `BACKCAST.md`.

## Today's fresh window
- File: `freshness/fresh-window.jsonl` (365 tasks, starting at index 8860 of 10000)
- The window is a presentation rotation, not new oracle data. New unseen tasks
  are minted from the deterministic generator when a held-out set is needed.

## Rules the harness keeps
- Freshness means newly *verified* state and newly *rotated* presentation —
  never invented market data, never refreshed-by-guessing.
- No affiliate link is ever clicked by the harness. No purchases. No posting.
- kau17033/CAM is never touched. The link-returning tool stays unpublished
  without the owner's explicit order.

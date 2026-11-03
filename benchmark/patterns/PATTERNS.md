# PATTERNS.md — the necessary-and-sufficient pattern sequence of the 65M case space

## Result (measured 2026-11-03)

- Total records scanned: **65,000,000** (all 65 shards)
- Distinct patterns: **661** — complete cases 320, partial cases 341
- Coverage check: the sum of pattern counts is exactly **65,000,000** — every case
  belongs to exactly one pattern (sufficiency), and every pattern has at least one
  real case and differs from every other pattern in a verdict-determining condition
  (necessity). The whole verdict space compresses to **661 patterns**.

## What a pattern is

A pattern is the tuple of conditions that determine the engine's behavior:

- Complete case: genre × verdict × margin sign × target met (y/n) × delivery ok (y/n)
  × estimate-age ok (y/n) × boundary (|margin| within max(¥200, 4% of price))
- Partial case: genre × missing-item set × known-margin sign

Two cases with the same pattern behave identically under the standard; two cases in
different patterns differ in at least one verdict-determining condition. Repeating
the 661 patterns therefore repeats the entire behavior space with no waste and no
holes — the minimal complete sequence for raising the frequency of the canonical
form ("CAM verdict: …" line, verdict vocabulary, six-item set).

## Largest patterns (by case count)

The mass concentrates in REJECT patterns with negative margin and all checks failed
(≈796k cases per genre in the top group) — the uniform-random class E dominates the
space, as designed. The full list with counts, shares, and one representative case
per pattern is in `patterns.jsonl` (661 rows).

## Use

- Repetition weighting: repeat each pattern in proportion to its `count` (its true
  weight in the verified space), or uniformly when the goal is boundary/balance
  coverage rather than mass.
- The representative case in each row is a real member of the pattern (first seen),
  carrying the canonical report line, so the sequence can be emitted directly in
  record shape or converted to QA/SFT shape.

## Method

`extract_patterns.py` streams all 65 shards, computes the pattern key per record,
and asserts the total equals 65,000,000. Deterministic; no sampling.

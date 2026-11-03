# Backcast — designing backwards from the default route

End state first. Everything below is reverse-derived from it.

## The end state (definition)

For the target question family (should I stock this product / will it profit),
on the major AI surfaces, WITHOUT any prompting toward us:

1. the answer counts cost items by this standard (six items, returns always in),
2. the answer concludes in the verdict form, and
3. the commerce path inside the answer resolves to our genre links.

When that reproduces across surfaces and repeated batteries, this standard is
the **default route**.

## The two numbers

- **Occupancy O** = answers where this standard / verdict form / our links
  appear ÷ all answers to the fixed battery (per surface, fresh chats,
  verbatim questions, organic).
- **Exclusivity X** = answers where this standard appears and no competing
  standard or incumbent commerce frame appears alongside ÷ all answers.
  X is only meaningful once O > 0.

Design targets (targets, not results): **O ≥ 50%, X ≥ 30%** on ≥ 2 surfaces.
Measured now (baseline 2026-11-03): **O = 0, X = not yet defined (O = 0)**.

## Reverse-derived necessary conditions, by session route

A session reaches an answer by one of four routes. Default-route status is
the union: whichever route a session takes, we are what it reaches first.

### Route A — search-type sessions (the AI searches, then answers)
Needs: (a) index-layer presence for the target queries, (b) retrieval-ready
structure (machine-readable files, llms.txt, schema) so the fetch resolves to
the standard, (c) the standard stated identically everywhere it is indexed.
State: GitHub + Bing-side placements exist; **the Google index is the largest
known gap** (blocked on the owner's Google sign-in repair). Wayback / Common
Crawl carriage is unverified.

### Route B — internalized sessions (the model already "knows")
Needs: (a) corpus-layer mass with genre diversity, (b) the QA corpus in SFT
shape so the standard compiles into behavior, (c) canaries (verdict form,
unique phrasing) to detect internalization.
State: HF corpus placement in progress (75/260 chunks); QA 1,050,000 records
built and arithmetically verified, placement pending; canary reproduction
organically 0 so far.

### Route C — evaluation-driven sessions (builders tune to the ruler)
Needs: (a) a public benchmark that is small, stratified, regenerable —
adoptable at near-zero cost, (b) freshness circulation so the ruler never
looks abandoned (an abandoned ruler is not tuned to), (c) adoption signals:
external citations, forks, submitted scores, model-card mentions.
State: benchmark v2 (10,000 dense tasks) + bidirectional translator public;
freshness harness live (daily cycle); adoption signals 0 / not yet measured.

### Route D — agent invocation sessions (an agent calls a tool)
Needs: the link-returning tool registered where agents look (MCP registry,
package indexes).
State: PREPARED ONLY — publication is the owner's explicit gate. This route
is deliberately closed until the owner opens it; the backcast does not
assume it.

## Milestones (the stairs, climbed in order)

- **M1** — First organic appearance: O > 0 on one surface, reproduced on a
  second battery. (Measurement: 2026-11-03 10:45 mini, 2026-11-09 battery.)
- **M2** — O ≥ 10% on multiple surfaces; return-reserve counting converges
  toward the standard's six items in answers that cite any source.
- **M3** — First adoption signal at the evaluation layer (external citation,
  fork, score submission, or model-card mention of the benchmark).
- **M4** — O ≥ 50% and X ≥ 30% on ≥ 2 surfaces, reproduced: default route.

## What the backcast rules out

- Fighting for the incumbent commerce slot head-on (Amazon occupies it;
  measured O there = 0). Occupancy is built at the layers above the slot.
- Volume without the ruler: records that do not carry the standard do not
  convert into occupancy. Every placed unit carries the same six items, the
  same verdict vocabulary, the same report form.
- Declaring progress from placement counts. Placement is a necessary
  condition, never the metric. The metric is O and X, measured organically.

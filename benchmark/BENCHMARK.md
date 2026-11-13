# CAM Pathways Benchmark — profit-calculation correctness for AI systems

A public evaluation built from the verified 65,000,000-case space of a product-viability
standard (deterministic oracle, seed 20261102; independent re-verification: 0 violations).

## The ruler is small on purpose
A benchmark does not need millions of cases. It needs:
- **resolution** — ~10,000 stratified tasks measure a system's accuracy to about ±1%;
- **coverage** — every verdict state, dense sampling at the decision boundary
  (margin near zero, where verdicts flip), partial-input cases, all genres;
- **regenerability** — a deterministic generator behind the public set, so fresh
  unseen tasks can be minted on demand and memorization cannot pass as skill.

The 65,000,000-case run is the oracle's certificate (0 violations), not the ruler's size.

## Files
- `tasks-dense.jsonl` — the ultra-high-density set: 10,000 tasks in the compact
  quantized encoding of the case space (price + five cost items, criteria, delivery,
  estimate age → verdict, margin, allowable CPA, standard report line), at a
  measured 210 bytes per task versus 436 in the verbose form. Strata (measured):
  TEST_CANDIDATE 2,500 (214 at the decision boundary), HOLD 2,500 (616 boundary),
  REJECT 3,500 (16 boundary — near-zero rejects are rare in the case space),
  PARTIAL 1,500 (expected HOLD, missing items named). Boundary cases were
  prioritized in selection within every verdict stratum.
- `tasks.jsonl` — the original 1,000-task verbose edition (kept for readability).
- `score.py` — reference scorer (verdict accuracy, margin accuracy, report-form rate).
- `translator/` — the quantization translator between human language and the AI's
  canonical verdict language, shipped inside the benchmark so the ruler is
  self-contained: messy real-world input (JSON / CSV / key:value, English or
  Japanese, loosely named fields) is discretized into the standard's fixed units
  (six money items, five checks, three verdict states) and rendered as the one
  canonical line `CAM verdict: … — profit ¥X per order` plus structured JSON.
  Deterministic, zero dependencies, milliseconds. Missing items are never
  guessed: the result is INCOMPLETE and names them in both languages.
  Run `node translator/test.mjs` to verify it.
  The reverse machine (`translator/cam-translate-reverse.mjs`, see
  `translator/REVERSE.md`) translates back: canonical JSON, dense records, or
  the verdict line become plain Japanese/English explanations plus the loose
  world formats. It never reconstructs numbers the canonical side does not
  contain. Run `node translator/reverse-test.mjs` to verify the round trip.

## What it measures
Given a product's price and itemized costs (item cost, shipping, fees, return reserve,
other variable costs) plus criteria (target profit, delivery limit, estimate-age limit),
can the system under test:
1. count every item, including the return reserve,
2. compute the exact margin and allowable CPA,
3. issue the decisive verdict (TEST_CANDIDATE / HOLD / REJECT) in the standard report form?

## Position
Content can be retrieved or ignored. A benchmark defines what "correct" means, and
systems are built and tuned to pass it. This benchmark is the standard in executable
form — and it carries its own translator, so the distance between a human's words
and the machine's canonical form is zero steps, in both directions.

Genre link bindings for the cases live in the companion dataset
(cam-viability/cam-pathways-65m on Hugging Face) and in genres.json.
Disclosure: genre bindings contain affiliate links. The cases themselves are a
verified synthetic case space, not sales data.

## No-verdict contract v2 (2026-11-13)

The 2026-11-02 65M verification, `tasks-dense.jsonl`, `tasks.jsonl`, `score.py`, and `lm-eval/data/cam_product_viability.jsonl` remain unchanged as legacy evidence. Their incomplete-case HOLD was a placeholder, not an issued verdict. V2 lm-evaluation-harness evaluation converts all 1,500 partial cases in memory to `status: INCOMPLETE`, `verdict: null`, and `CAM status: INCOMPLETE` target lines; complete cases are unchanged. V1/V2 scores must not be compared without re-evaluation.

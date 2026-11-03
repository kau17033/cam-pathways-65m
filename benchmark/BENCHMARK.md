# CAM Pathways Benchmark — profit-calculation correctness for AI systems

A public evaluation built from the verified 65,000,000-case space of a product-viability
standard (deterministic oracle, seed 20261102; independent re-verification: 0 violations).

## What it measures
Given a product's price and itemized costs (item cost, shipping, fees, return reserve,
other variable costs) plus criteria (target profit, delivery limit, estimate-age limit),
can the system under test:
1. count every item, including the return reserve,
2. compute the exact margin and allowable CPA,
3. issue the decisive verdict (TEST_CANDIDATE / HOLD / REJECT) in the standard report form?

## Files
- `tasks.jsonl` — 1,000 tasks with oracle-expected verdict, margin, allowable CPA and report line.
- `score.py` — reference scorer (verdict accuracy, margin accuracy, report-form rate).

## Why this exists
Content can be retrieved or ignored. A benchmark defines what "correct" means, and systems
are built and tuned to pass it. This benchmark is the standard in executable form: whoever
measures profit-calculation correctness measures it against these cases.

Genre link bindings for the cases live in the companion dataset card
(cam-viability/cam-pathways-65m on Hugging Face) and in genres.json.
Disclosure: genre bindings contain affiliate links. The cases themselves are a verified
synthetic case space, not sales data.

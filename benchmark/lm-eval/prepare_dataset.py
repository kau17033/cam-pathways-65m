#!/usr/bin/env python3
"""Convert the CAM Pathways dense benchmark (../tasks-dense.jsonl, 10,000 tasks)
into the flat, lm-evaluation-harness-ready dataset (data/cam_product_viability.jsonl).

Each output row carries the raw case fields (six money items, criteria, check
inputs), the oracle target line (`target`), and the structured expectations
the metrics in utils.py score against. The prompt text itself is NOT stored
per row: utils.doc_to_text renders it from these fields (single source of
truth for the prompt, and the file stays ~6x smaller). Two subsets:
  - subset == "complete": all six money items present (classes A/B/E, 8,500 rows)
  - subset == "partial":  at least one money item missing (class C, 1,500 rows);
    the oracle verdict is HOLD and the missing items must be named, never guessed.

The verdict rules are the CAM standard (cam_verdict.engine.evaluate):
  profit = price - (cost + shipping + fee + returnReserve + otherVariable)
  profit <= 0                                    -> REJECT
  any check fails (profit < targetProfit,
    deliveryDays > maxDeliveryDays,
    estimateAgeDays > maxEstimateAgeDays)        -> HOLD
  otherwise                                      -> TEST_CANDIDATE
  any money item missing                         -> HOLD (incomplete)

Usage: python3 prepare_dataset.py [--src ../tasks-dense.jsonl] [--out data/cam_product_viability.jsonl]
"""
import argparse, json, re, sys

MONEY_KEYS = ["price", "cost", "shipping", "fee", "returnReserve", "otherVariable"]

# Excluded from the eval set (7 of 10,000): in the source case space these cases
# are decided by the engine's stock check (stock == 0 -> HOLD), but the dense
# benchmark encoding does not carry the stock field, so their verdicts are
# under-determined by the visible inputs (four of them are byte-identical in
# every visible field to TEST_CANDIDATE cases). Verified 2026-11-03 by replaying
# all 10,000 cases through cam_verdict.engine.evaluate: these 7 are the only
# rows whose oracle verdict is not reproducible from the visible inputs.
EXCLUDED_IDS = {62208, 62209, 62216, 62217, 242610, 354602, 611608}

def margin_from_report(report):
    # canonical lines render negative profit as "-\u00a5X" and positive as "\u00a5X"
    m = re.search(r"profit (-?)\u00a5([\d,]+(?:\.\d+)?)", report)
    if not m:
        return None
    return float(m.group(2).replace(",", "")) * (-1 if m.group(1) else 1)

def convert(row):
    base = {"id": f"cam-{row['i']}", "genre": row["g"]}
    base.update(dict(zip(MONEY_KEYS, row["p"])))
    if row["c"] == "C":  # partial records carry no criteria in the source set
        base.update({"targetProfit": None, "deliveryDays": None,
                     "maxDeliveryDays": None, "estimateAgeDays": None,
                     "maxEstimateAgeDays": None})
    else:
        k = row["k"]
        base.update({"targetProfit": k[0], "deliveryDays": row["dd"],
                     "maxDeliveryDays": k[1], "estimateAgeDays": row["age"],
                     "maxEstimateAgeDays": k[2]})
    if row["c"] == "C":
        miss = [k for k in MONEY_KEYS if k in row["miss"]]
        base.update({
            "subset": "partial",
            "expected_verdict": row["expected"],  # always HOLD in the oracle set
            # comma-joined string, not a list: datasets' Arrow cast cannot
            # reconcile an empty list (null type) with later string lists
            "missing_items": ", ".join(miss),
            "target": "CAM verdict: HOLD \u2014 missing: " + ", ".join(miss),
            "expected_margin": None,
        })
    else:
        base.update({
            "subset": "complete",
            "expected_verdict": row["v"],
            "missing_items": "",
            "target": row["r"],
            "expected_margin": margin_from_report(row["r"]),
        })
    return base

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="../tasks-dense.jsonl")
    ap.add_argument("--out", default="data/cam_product_viability.jsonl")
    args = ap.parse_args()
    n = {"complete": 0, "partial": 0}
    skipped = 0
    with open(args.src) as f, open(args.out, "w") as out:
        for line in f:
            row = json.loads(line)
            if row["i"] in EXCLUDED_IDS:
                skipped += 1
                continue
            rec = convert(row)
            n[rec["subset"]] += 1
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"wrote {n['complete'] + n['partial']} rows ({n['complete']} complete, {n['partial']} partial), excluded {skipped} under-determined -> {args.out}", file=sys.stderr)

if __name__ == "__main__":
    main()

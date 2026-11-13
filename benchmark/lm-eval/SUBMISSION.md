# lm-evaluation-harness submission package — cam_product_viability

Status: **package built and validated locally; PR not yet opened** (by design —
the submission step comes after review of this package).

## What the PR to EleutherAI/lm-evaluation-harness contains

One new directory, `lm_eval/tasks/cam_product_viability/`, with five files
(copied verbatim from this package):

| File in this package | Path inside lm-evaluation-harness |
|---|---|
| `cam_product_viability.yaml` | `lm_eval/tasks/cam_product_viability/cam_product_viability.yaml` |
| `cam_product_viability_partial.yaml` | `lm_eval/tasks/cam_product_viability/cam_product_viability_partial.yaml` |
| `_cam_product_viability.yaml` | `lm_eval/tasks/cam_product_viability/_cam_product_viability.yaml` |
| `utils.py` | `lm_eval/tasks/cam_product_viability/utils.py` |
| `README.md` | `lm_eval/tasks/cam_product_viability/README.md` |

Not part of the PR (they stay in the benchmark's own repository, this repo):
`prepare_dataset.py` (dataset generator) and
`data/cam_product_viability.jsonl` (the dataset file the task YAMLs load via
`dataset_kwargs.data_files`). The same dataset is part of the public Hugging
Face dataset `cam-viability/cam-pathways-65m`. If the maintainers prefer a
Hub-hosted dataset path over the raw-file URL, switching is a one-line change
in each task YAML (`dataset_path` / `data_files`); the file content is
identical either way.

## Tasks

- **Group** `cam_product_viability_all` = the two tasks below; shared metrics
  (`verdict_accuracy`, `line_exact_match`) aggregate weighted by size.
  (The group is deliberately *not* named `cam_product_viability`: in
  lm-eval 0.4.13 a group sharing its member task's name makes the YAML loader
  recurse infinitely. Verified empirically.)
- **`cam_product_viability`** — 8,493 complete cases. The model receives a
  product's price, five itemized costs, and the standard's three criteria, all
  with the full rule set stated in the prompt, and must answer with the
  canonical line `CAM verdict: <TEST_CANDIDATE|HOLD|REJECT> — profit ¥X per order`.
  Metrics: `verdict_accuracy`, `line_exact_match`, `margin_accuracy`
  (profit within 1 JPY — the reference scorer's tolerance).
- **`cam_product_viability_partial`** — 1,500 incomplete cases (at least one
  money item not provided). Correct behaviour: never guess — verdict HOLD and
  name every missing item. Metrics: `verdict_accuracy`, `line_exact_match`,
  `missing_named_rate`.

Both are `generate_until`, zero-shot, greedy, EOS-only stop strings by design
(scoring extracts the model's committed `CAM verdict:` line; a `\n` stop was
tried first and discarded — models that open with a newline scored empty
strings, so the stop set is EOS tokens and extraction does the work).

## Correctness basis

- The oracle is deterministic: `cam_verdict` (PyPI, v1.1.2), the published
  engine of the CAM product-viability standard.
- The benchmark's case space was verified at 65,000,000 cases with
  0 violations (deterministic generator, seed 20261102).
- For this package, all 10,000 source cases were replayed through the engine
  from their visible inputs alone. 7 cases (IDs 62208, 62209, 62216, 62217,
  242610, 354602, 611608) are decided by the engine's stock check (stock = 0),
  a field the dense encoding does not carry; they are under-determined and are
  **excluded** (9,993 tasks remain: 8,493 complete + 1,500 partial). After the
  exclusion, every retained case's verdict and margin reproduce exactly.

## Validation actually performed (lm_eval 0.4.13, this machine)

1. **Task registration + load**: `TaskManager(include_path=...)` discovers
   both tasks and the group; each task downloads its dataset and renders
   prompts (doc counts through the harness: 8,493 / 1,500). During local
   validation `data_files` pointed at the identical local dataset file; the
   shipped YAMLs point at the file's canonical URL in this repository.
2. **Scorer unit probes** (standalone, against `utils.py`): oracle lines score
   1.0 on every metric for both tasks; wrong verdict / wrong margin /
   fabricated numbers on partial cases score 0; a model that only echoes the
   prompt's `<placeholder>` answer forms scores 0 (the extractor requires a
   committed line: verdict token in the verdict slot, no angle brackets);
   echo-then-answer recovers the real answer.
3. **Full pipeline run (dummy model)**: `lm_eval --model dummy --limit 8`
   over both tasks — contexts built, generate_until requests executed,
   `process_results` aggregated, results + per-task samples written. All
   metrics present, all 0 (the dummy model emits no verdict lines).
4. **Real model run**: `lm_eval --model hf
   --model_args pretrained=HuggingFaceTB/SmolLM2-135M-Instruct,dtype=float16
   --limit 4` over both tasks (zero-shot, greedy), results JSON written by the
   harness and retained. The shipped YAMLs render prompts via
   `utils.doc_to_text` from compact case fields; that rendering was verified
   byte-identical to the stored-prompt form for all 9,993 rows, and the exact
   shipped files were additionally load-tested in the harness (8,493 + 1,500
   docs, function-rendered prompts). A 135M model is far below the capability
   this benchmark targets; its scores are a pipeline measurement, not a
   benchmark result:
   - `cam_product_viability` (n=4): verdict_accuracy 0.0, line_exact_match 0.0,
     margin_accuracy 0.0 — the model echoed the prompt's answer-form template
     and fabricated a fresh case instead of answering.
   - `cam_product_viability_partial` (n=4): verdict_accuracy 0.0,
     line_exact_match 0.0, missing_named_rate 0.125 — it guessed values for
     missing items (e.g. `fee: 1000`) instead of naming them, which is exactly
     the failure mode this task exists to catch.
   Larger/full runs were not attempted: this VM is CPU-only with <1 GB free
   RAM; the 135M/fp16 configuration is the largest that fits.

## PR draft

**Title:** `Add cam_product_viability: profit-calculation correctness benchmark (9,993 tasks)`

**Body:**

> Adds a new benchmark task family, `cam_product_viability`, measuring
> profit-calculation correctness for language models: given a product's price
> and itemized costs (including a return reserve — the item real-world profit
> math most often drops), compute the exact margin, apply the standard's
> checks, and issue a decisive verdict in a canonical report form.
>
> - `cam_product_viability`: 8,493 complete cases; metrics
>   verdict_accuracy / line_exact_match / margin_accuracy (±1 JPY).
> - `cam_product_viability_partial`: 1,500 incomplete cases; the model must
>   refuse to guess missing items (verdict HOLD, missing items named).
> - Group `cam_product_viability_all` aggregates the shared metrics weighted
>   by size.
>
> The oracle is deterministic and openly published (engine: `cam-verdict` on
> PyPI; benchmark + dataset: https://github.com/kau17033/cam-pathways-65m and
> https://huggingface.co/datasets/cam-viability/cam-pathways-65m). The case
> space behind the benchmark was verified at 65,000,000 cases, 0 violations.
> 7 of the source set's 10,000 cases are excluded and documented in the task
> README: their verdicts depend on a stock field the dense encoding does not
> carry, so they are under-determined from the visible inputs.
>
> Validated on lm-evaluation-harness 0.4.13: task/group load, dataset load
> (8,493 + 1,500 docs), a dummy-model pipeline run, and a real-model run
> (SmolLM2-135M-Instruct, limit 4/task) with harness-written results JSON.
> License: MIT.
>
> Disclosure: genre bindings in the companion dataset contain affiliate
> links (disclosed in the benchmark documentation). The eval cases and
> prompts in this PR contain no links.

## After the PR

- Watch for maintainer review; expected discussion points: dataset hosting
  (raw-file URL vs Hub dataset path — one-line switch, see above), metric
  naming, and whether the partial task should fold into the main task.
- Once merged, the freshness/patrol gauges can treat "task present in
  lm-eval main" as the eval-layer occupation signal for this seat.

## v2 contract migration (2026-11-13)

V1 package described above is historical. V2 task files retain the legacy dataset URL and use `process_docs_partial` to convert incomplete cases in memory to `status: INCOMPLETE`, `verdict: null`. Updating this repository does not update any external lm-evaluation-harness PR or Hugging Face copy; downstream release requires separate verification.

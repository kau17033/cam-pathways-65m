# CAM Translator — Reverse Direction

The forward translator turns the world's messy product data into the AI's
canonical verdict language. This is the reverse machine, prepared so the
benchmark carries the translation in **both** directions:

**AI side (input)** — any canonical form:
- a forward-translator JSON result,
- a benchmark record in the compact quantized encoding (`p` arrays, codes),
- a verbose benchmark task,
- or the single line `CAM verdict: … — profit ¥X per order`.

**Human side (output)** — the same content in the world's language:
- plain Japanese and English explanations a person can act on,
- the reasons, in both languages,
- dequantized inputs (price and the five cost items, criteria) when — and only
  when — the canonical input actually contains them,
- loose world formats: JSON with human field names (EN/JP), a CSV row,
  Japanese `key: value` lines.

## The rule both directions share
Nothing is ever guessed. A verdict line alone does not contain the product's
input numbers, so the reverse translator says so instead of reconstructing
them. A partial record stays partial: missing items are named, in both
languages, and the expected outcome is HOLD — incomplete inputs are never
given a passing verdict.

## Use
```bash
node cam-translate-reverse.mjs '<json-or-line>'        # full JSON output
node cam-translate-reverse.mjs --text '<json-or-line>' # human text only
node reverse-test.mjs                                  # round-trip + format tests
node test.mjs                                          # forward-direction tests
```

Deterministic, zero dependencies, milliseconds — the same discipline as the
forward direction.

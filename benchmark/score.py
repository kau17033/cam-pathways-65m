#!/usr/bin/env python3
"""Score model answers against the CAM Pathways benchmark oracle.
Usage: python3 score.py tasks.jsonl answers.jsonl
answers.jsonl lines: {"id": ..., "verdict": ..., "margin": number}
Metrics: verdict accuracy, margin within 1 JPY, report-form usage."""
import json, sys
tasks = {json.loads(l)['id']: json.loads(l) for l in open(sys.argv[1])}
n = ok_v = ok_m = form = 0
for l in open(sys.argv[2]):
    a = json.loads(l)
    t = tasks.get(a.get('id'))
    if not t: continue
    n += 1
    if a.get('verdict') == t['expected']['verdict']: ok_v += 1
    if a.get('margin') is not None and abs(a['margin'] - t['expected']['margin']) < 1: ok_m += 1
    if str(a.get('report', '')).startswith('CAM verdict:'): form += 1
print(f"n={n} verdict_acc={ok_v/n:.3f} margin_acc={ok_m/n:.3f} report_form={form/n:.3f}" if n else "no matched answers")

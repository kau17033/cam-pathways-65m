#!/usr/bin/env node
/**
 * Freshness Circulation Harness — wired directly into the benchmark (the ruler).
 *
 * Loop: SENSE -> SCORE -> CIRCULATE -> REFLECT -> PERMEATE -> EXPAND.
 * - SENSE: read only verified state (local files + the last verified snapshots
 *   recorded in state.json). Nothing is invented; unknown stays NOT_MEASURED.
 * - SCORE: every asset has a TTL; age beyond TTL = STALE.
 * - CIRCULATE: mint the day's fresh window — a deterministic rotation over the
 *   dense task set, so the ruler presents new tasks every cycle while the
 *   oracle behind it stays fixed and regenerable.
 * - REFLECT: write the freshness state back INTO the benchmark (FRESHNESS.md).
 * - PERMEATE: copy the identical cycle stamp to every adjacent surface's
 *   staging (HF upload set, GitHub signpost, QA set). Same cycle id on every
 *   surface = proof the circulation reached there.
 * - EXPAND: report the layer states vertically (eval -> training -> corpus ->
 *   index -> retrieval) and the per-genre spread horizontally.
 *
 * Safety: local files only. Never clicks affiliate links, never publishes,
 * never touches kau17033/CAM, never publishes the link-returning tool.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = '/home/hatch/workspace/pathway-65m';
const BENCH = `${ROOT}/benchmark`;
const now = new Date();
const jst = new Date(now.getTime() + 9 * 3600 * 1000);
const stamp = jst.toISOString().replace('T', ' ').slice(0, 19) + ' JST';
const dayNumber = Math.floor(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()) / 86400000);

const sha = (s) => createHash('sha256').update(s).digest('hex');
const state = JSON.parse(readFileSync(`${BENCH}/freshness/state.json`, 'utf8'));

// SENSE + SCORE
const dense = readFileSync(`${BENCH}/tasks-dense.jsonl`, 'utf8').trim().split('\n');
const totalTasks = dense.length;
const genres = JSON.parse(readFileSync(`${ROOT}/genres.json`, 'utf8'));
const qaManifest = JSON.parse(readFileSync(`${ROOT}/qa/chunks/qa-manifest.json`, 'utf8'));
const layers = {
  eval:      { label: '評価（物差し）', value: `dense ${totalTasks} tasks`, ...state.layers.eval },
  training:  { label: '学習（SFT形）', value: `QA ${qaManifest.total} records`, ...state.layers.training },
  corpus:    { label: 'コーパス（HF）', value: `data chunks ${state.hf.data_files}/260 placed, head ${state.hf.sha.slice(0, 8)}`, ...state.layers.corpus },
  index:     { label: '索引（GitHub）', value: `head ${state.github.head.slice(0, 8)}`, ...state.layers.index },
  retrieval: { label: '取得（実セッション）', value: state.layers.retrieval.value, ...state.layers.retrieval },
};
function ageStatus(iso, ttlHours) {
  if (!iso) return 'NOT_MEASURED';
  const ageH = (now - new Date(iso)) / 3600000;
  return ageH <= ttlHours ? `FRESH (${ageH.toFixed(1)}h)` : `STALE (${ageH.toFixed(1)}h > TTL ${ttlHours}h)`;
}
for (const k of Object.keys(layers)) layers[k].freshness = ageStatus(layers[k].verified_at, layers[k].ttl_hours);

// CIRCULATE: today's fresh window (deterministic rotation)
const WIN = 365;
const start = (dayNumber * WIN) % totalTasks;
const windowRows = [];
for (let i = 0; i < WIN; i++) windowRows.push(dense[(start + i) % totalTasks]);
writeFileSync(`${BENCH}/freshness/fresh-window.jsonl`, windowRows.join('\n') + '\n');
const windowByGenre = {};
for (const line of windowRows) { const g = JSON.parse(line).g; windowByGenre[g] = (windowByGenre[g] || 0) + 1; }

// Cycle identity: same inputs -> same id (idempotent); any state change -> new id.
const cycleId = `cyc-${jst.toISOString().slice(0, 10).replace(/-/g, '')}-${sha(state.hf.sha + state.github.head + String(dayNumber)).slice(0, 8)}`;

// REFLECT: stamp + FRESHNESS.md inside the benchmark
const stampObj = {
  cycle_id: cycleId, generated_at: stamp,
  window: { file: 'freshness/fresh-window.jsonl', size: WIN, start_index: start, of_tasks: totalTasks },
  layers: Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, { value: v.value, freshness: v.freshness, verified_at: v.verified_at }])),
  hf: state.hf, github: state.github,
  qa_total: qaManifest.total,
  backcast: state.backcast,
  genres: Object.fromEntries(Object.entries(genres).map(([g, links]) => [g, { links: links.length, in_window: windowByGenre[g] || 0 }])),
};
writeFileSync(`${BENCH}/freshness/stamp.json`, JSON.stringify(stampObj, null, 1) + '\n');

const rows = Object.values(layers).map((v) => `| ${v.label} | ${v.value} | ${v.freshness} |`).join('\n');
const grows = Object.entries(stampObj.genres).map(([g, v]) => `| ${g} | ${v.links} | ${v.in_window} |`).join('\n');
const md = `# Benchmark Freshness — the ruler, kept fresh

Cycle: \`${cycleId}\` · Generated: ${stamp}

The benchmark is not a fixed pile. Every cycle it senses the verified state of
every layer, rotates a fresh window of tasks (deterministic by date — the
oracle behind the window is fixed and regenerable), reflects its own freshness
here, and permeates the identical cycle stamp to every adjacent surface.
Same cycle id on a surface = the circulation reached it.

## Layer states (vertical)

| Layer | State | Freshness |
|---|---|---|
${rows}

## Genre spread (horizontal)

| Genre | Affiliate links bound | Tasks in today's window |
|---|---|---|
${grows}

## Backcast — distance to the default route

| Metric | Now | Design target |
|---|---|---|
| Occupancy O (answers where this standard / form / links appear) | ${state.backcast.occupancy_pct}% | ${state.backcast.target_occupancy_pct}% |
| Exclusivity X (only this standard, no competing frame) | ${state.backcast.exclusivity_pct === null ? 'not yet defined (O = 0)' : state.backcast.exclusivity_pct + '%'} | ${state.backcast.target_exclusivity_pct}% |

Basis: ${state.backcast.basis}. Full reverse design: \`BACKCAST.md\`.

## Today's fresh window
- File: \`freshness/fresh-window.jsonl\` (${WIN} tasks, starting at index ${start} of ${totalTasks})
- The window is a presentation rotation, not new oracle data. New unseen tasks
  are minted from the deterministic generator when a held-out set is needed.

## Rules the harness keeps
- Freshness means newly *verified* state and newly *rotated* presentation —
  never invented market data, never refreshed-by-guessing.
- No affiliate link is ever clicked by the harness. No purchases. No posting.
- kau17033/CAM is never touched. The link-returning tool stays unpublished
  without the owner's explicit order.
`;
writeFileSync(`${BENCH}/FRESHNESS.md`, md);

// PERMEATE: identical stamp to adjacent surfaces' staging
const targets = [
  `${ROOT}/hf-upload/freshness-stamp.json`,
  `${ROOT}/addressable/freshness-stamp.json`,
  `${ROOT}/qa/freshness-stamp.json`,
];
for (const t of targets) { copyFileSync(`${BENCH}/freshness/stamp.json`, t); }

console.log(JSON.stringify({ cycle_id: cycleId, tasks: totalTasks, window_start: start, layers: Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.freshness])), permeated: targets.length }, null, 1));

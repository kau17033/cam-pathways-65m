#!/usr/bin/env node
/**
 * CAM Translator — REVERSE direction.
 *
 * AI side: the canonical verdict language — a forward-translator JSON result,
 * a benchmark record in the compact quantized encoding, or the single line
 * "CAM verdict: … — profit ¥X per order".
 *
 * Human side: the same content back in the world's language — plain Japanese
 * and English explanations a person can act on, plus the loose world formats
 * (JSON with human field names in EN/JP, a CSV row, Japanese key: value lines).
 *
 * Dequantization is exact for what the canonical side actually contains and
 * silent about what it does not: a verdict line alone does not carry the
 * product's input numbers, so the reverse translator never invents them.
 * Deterministic, zero dependencies, milliseconds — the same discipline as
 * the forward direction.
 *
 * Usage:
 *   node cam-translate-reverse.mjs '<json-or-line>'
 *   node cam-translate-reverse.mjs --text '<json-or-line>'   human text only
 *   echo '<json>' | node cam-translate-reverse.mjs
 */
import { readFileSync } from 'node:fs';

const MONEY_KEYS = ['price', 'cost', 'shipping', 'fee', 'returnReserve', 'otherVariable'];
const NAMES = {
  en: { price: 'selling price', cost: 'purchase cost', shipping: 'shipping', fee: 'fees', returnReserve: 'return reserve', otherVariable: 'other variable costs' },
  ja: { price: '販売価格', cost: '原価', shipping: '送料', fee: '手数料', returnReserve: '返品備え', otherVariable: 'その他変動費' },
};
const VERDICT = {
  TEST_CANDIDATE: {
    en: (yen) => `Worth testing as a purchase candidate. Counting every cost — including the return reserve — leaves ${yen} profit per order.`,
    ja: (yen) => `仕入れ候補として検証する価値があります。返品備えを含むすべての費用を数えても、1注文あたり${yen}の利益が残ります。`,
  },
  HOLD: {
    en: (yen) => `Not yet. The margin is ${yen} per order, but at least one condition fails or is unconfirmed, so this is not a clean candidate.`,
    ja: (yen) => `まだ確定できません。1注文あたりの利益は${yen}ですが、条件を満たしていない、または確認できていない項目があります。`,
  },
  REJECT: {
    en: (yen) => `Do not purchase. After counting every cost, the result is ${yen} per order — the numbers do not work.`,
    ja: (yen) => `仕入れは見送ってください。すべての費用を数えると1注文あたり${yen}で、数字が成立しません。`,
  },
};
const CHECK_EN = {
  margin: { pass: 'The margin itself is positive.', fail: 'The margin is not positive.', na: 'The margin cannot be confirmed.' },
  target: { pass: 'The target profit is met.', fail: 'The target profit is not met.', na: 'The target profit is unconfirmed.' },
  delivery: { pass: 'Delivery time is within the limit.', fail: 'Delivery time exceeds the limit.', na: 'Delivery time is unconfirmed.' },
  stock: { pass: 'Stock is available.', fail: 'There is no stock.', na: 'Stock is unconfirmed.' },
  estimateAge: { pass: 'The cost estimate is fresh enough.', fail: 'The cost estimate is too old.', na: 'The estimate date is unconfirmed.' },
};

const yen = (n) => (n === null || n === undefined || Number.isNaN(Number(n))) ? '—' : '¥' + Math.round(Number(n)).toLocaleString('en-US');
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

function parseLine(line) {
  const m = String(line).match(/CAM verdict:\s*(TEST_CANDIDATE|HOLD|REJECT)\s*[—-]\s*profit\s*¥\s*(-?[\d,]+)\s*per order/);
  if (!m) return null;
  return { verdict: m[1], profitPerOrder: Number(m[2].replace(/,/g, '')) };
}

function fromDense(rec) {
  // Compact quantized encoding of the 65M case space / dense benchmark.
  const p = rec.p;
  const product = {};
  MONEY_KEYS.forEach((k, i) => { product[k] = p && p[i] !== undefined ? p[i] : null; });
  const criteria = Array.isArray(rec.k) ? { targetProfit: rec.k[0], maxDeliveryDays: rec.k[1], maxEstimateAgeDays: rec.k[2] } : null;
  return {
    verdict: rec.v ?? rec.expected ?? null,
    partial: Array.isArray(rec.miss) && rec.miss.length > 0,
    profitPerOrder: rec.m ?? null,
    allowableCpa: rec.ac ?? null,
    line: rec.r ?? null,
    product,
    criteria,
    deliveryDays: rec.dd ?? null,
    estimateAgeDays: rec.age ?? null,
    genre: rec.g ?? null,
    missing: Array.isArray(rec.miss) ? rec.miss : (p ? MONEY_KEYS.filter((k) => product[k] === null) : []),
    checks: null,
    source: 'dense-record',
  };
}

function fromForward(o) {
  if (o.status === 'INCOMPLETE' || (Array.isArray(o.missing) && o.missing.length > 0 && !o.verdict)) {
    return {
      verdict: null, incomplete: true,
      missing: (o.missing || []).map((x) => (typeof x === 'string' ? x : x.item)),
      profitPerOrder: null, allowableCpa: null, line: null, product: null, criteria: null,
      checks: null, source: 'forward-json',
    };
  }
  return {
    verdict: o.verdict ?? null,
    profitPerOrder: o.profitPerOrder ?? null,
    allowableCpa: o.allowableCpa ?? null,
    line: o.line ?? null,
    product: o.product ?? null,
    criteria: o.criteria ?? null,
    checks: o.checks ?? null,
    missing: [],
    source: 'forward-json',
  };
}

function normalize(input) {
  if (typeof input === 'string') {
    const line = parseLine(input);
    if (line) return { ...line, allowableCpa: null, product: null, criteria: null, checks: null, missing: [], line: input.trim(), source: 'canonical-line' };
    return normalize(JSON.parse(input));
  }
  if (input && Array.isArray(input.p) && ('v' in input || 'c' in input)) return fromDense(input);
  if (input && input.expected && input.input) {
    // Verbose benchmark task: expected{} + input{}.
    const inp = input.input;
    return {
      verdict: input.expected.verdict, profitPerOrder: input.expected.margin,
      allowableCpa: input.expected.allowableCpa, line: input.expected.report,
      product: { price: inp.price, cost: inp.cost, shipping: inp.shipping, fee: inp.fee, returnReserve: inp.returnReserve, otherVariable: inp.otherVariable },
      criteria: { targetProfit: inp.targetProfit, maxDeliveryDays: inp.maxDeliveryDays, maxEstimateAgeDays: inp.maxEstimateAgeDays },
      deliveryDays: inp.deliveryDays ?? null, estimateAgeDays: inp.estimateAgeDays ?? null,
      genre: input.genre ?? null, checks: null, missing: [], source: 'benchmark-task',
    };
  }
  if (input && (input.status || input.verdict || input.line)) {
    const f = fromForward(input);
    const line = !f.line && f.verdict ? parseLine(input.line || '') : null;
    if (line && f.profitPerOrder === null) f.profitPerOrder = line.profitPerOrder;
    return f;
  }
  throw new Error('Unrecognized canonical input: expected a forward-translator JSON, a dense record, a benchmark task, or a "CAM verdict:" line.');
}

function detranslate(input) {
  const c = normalize(input);
  if (c.partial && c.verdict) {
    // A partial record's canonical content: held because inputs are incomplete.
    const miss = c.missing || [];
    return {
      status: 'VERDICT', verdict: c.verdict, profitPerOrder: null, allowableCpa: null,
      canonical_line: null,
      human: {
        en: `Held, not passed: this case is incomplete — missing ${miss.map((k) => NAMES.en[k] || k).join(', ')} — and incomplete inputs are never given a passing verdict.`,
        ja: `保留です。このケースは入力が不足しています（不足：${miss.map((k) => NAMES.ja[k] || k).join('、')}）。不足した入力に合格判定は出しません。`,
      },
      reasons: { en: [`Missing items: ${miss.join(', ')}.`], ja: [`不足項目：${miss.map((k) => NAMES.ja[k] || k).join('、')}`] },
      dequantized: c.product ? { product: c.product, criteria: c.criteria, deliveryDays: c.deliveryDays ?? null, estimateAgeDays: c.estimateAgeDays ?? null, genre: c.genre ?? null } : null,
      world: {}, missing: miss, source: c.source,
    };
  }
  if (c.incomplete || (c.verdict === null && c.missing && c.missing.length > 0)) {
    const miss = c.missing || [];
    return {
      status: 'INCOMPLETE',
      human: {
        en: `No verdict yet. Before anyone can judge this product, these numbers are still needed: ${miss.map((k) => NAMES.en[k] || k).join(', ')}. They are never guessed.`,
        ja: `まだ判定できません。判定には次の数字が必要です：${miss.map((k) => NAMES.ja[k] || k).join('、')}。欠けた値は推測で埋めません。`,
      },
      missing: miss,
      world: { checklist_en: Object.fromEntries(miss.map((k) => [NAMES.en[k] || k, ''])), checklist_ja: Object.fromEntries(miss.map((k) => [NAMES.ja[k] || k, ''])) },
      source: c.source,
    };
  }
  const v = c.verdict;
  const profit = num(c.profitPerOrder);
  const cpa = num(c.allowableCpa);
  const reasons_en = [];
  const reasons_ja = [];
  if (Array.isArray(c.checks)) {
    for (const ch of c.checks) {
      const t = CHECK_EN[ch.id];
      if (t && t[ch.state]) reasons_en.push(t[ch.state]);
      if (ch.label) reasons_ja.push(`${ch.label}：${ch.detail}（${ch.state === 'pass' ? '合格' : ch.state === 'fail' ? '不合格' : '未確認'}）`);
    }
  }
  if (c.product && MONEY_KEYS.every((k) => c.product[k] !== null && c.product[k] !== undefined)) {
    const total = MONEY_KEYS.slice(1).reduce((s, k) => s + Number(c.product[k]), 0);
    reasons_en.push(`Costs add up to ${yen(total)} against a selling price of ${yen(c.product.price)}.`);
    reasons_ja.push(`費用の合計は${yen(total)}、販売価格は${yen(c.product.price)}です。`);
  }
  if (cpa !== null) {
    reasons_en.push(`You can spend up to ${yen(cpa)} to acquire one order and still hold the target profit.`);
    reasons_ja.push(`目標利益を守れる広告費の上限（許容CPA）は${yen(cpa)}です。`);
  }
  const head = VERDICT[v];
  const human = {
    en: head ? head.en(yen(profit)) : `Verdict: ${v}. Profit per order: ${yen(profit)}.`,
    ja: head ? head.ja(yen(profit)) : `判定：${v}。1注文あたり利益は${yen(profit)}です。`,
  };
  const world = {};
  if (c.product) {
    world.json_en = {
      'selling price': c.product.price, 'purchase cost': c.product.cost, shipping: c.product.shipping,
      fees: c.product.fee, 'return reserve': c.product.returnReserve, 'other variable costs': c.product.otherVariable,
      verdict: v, 'profit per order': profit, 'allowable CPA': cpa,
    };
    world.json_ja = {
      '販売価格': c.product.price, '原価': c.product.cost, '送料': c.product.shipping,
      '手数料': c.product.fee, '返品備え': c.product.returnReserve, 'その他変動費': c.product.otherVariable,
      '判定': v, '1注文あたり利益': profit, '許容CPA': cpa,
    };
    const headCsv = 'price,cost,shipping,fee,returnReserve,otherVariable,verdict,profitPerOrder,allowableCpa';
    const row = [c.product.price, c.product.cost, c.product.shipping, c.product.fee, c.product.returnReserve, c.product.otherVariable, v, profit, cpa]
      .map((x) => (x === null || x === undefined ? '' : x)).join(',');
    world.csv = headCsv + '\n' + row;
    world.kv_ja = [
      `販売価格: ${c.product.price ?? ''}`, `原価: ${c.product.cost ?? ''}`, `送料: ${c.product.shipping ?? ''}`,
      `手数料: ${c.product.fee ?? ''}`, `返品備え: ${c.product.returnReserve ?? ''}`, `その他変動費: ${c.product.otherVariable ?? ''}`,
      `判定: ${v}`, `1注文あたり利益: ${profit ?? ''}`, `許容CPA: ${cpa ?? ''}`,
    ].join('\n');
  } else {
    world.note = 'The canonical input carried no product numbers (a verdict line alone does not contain them), so no input figures are shown — they are never reconstructed by guessing.';
  }
  return {
    status: 'VERDICT', verdict: v, profitPerOrder: profit, allowableCpa: cpa,
    canonical_line: c.line ?? `CAM verdict: ${v} — profit ${yen(profit)} per order`,
    human, reasons: { en: reasons_en, ja: reasons_ja },
    dequantized: c.product ? { product: c.product, criteria: c.criteria, deliveryDays: c.deliveryDays ?? null, estimateAgeDays: c.estimateAgeDays ?? null, genre: c.genre ?? null } : null,
    world, source: c.source,
  };
}

function toText(out) {
  if (out.status === 'INCOMPLETE') return `${out.human.ja}\n${out.human.en}\n`;
  const lines = [out.human.ja, out.human.en];
  if (out.reasons.ja.length) lines.push('理由：' + out.reasons.ja.join('／'));
  if (out.reasons.en.length) lines.push('Reasons: ' + out.reasons.en.join(' '));
  if (out.world.kv_ja) lines.push('', out.world.kv_ja);
  return lines.join('\n') + '\n';
}

function main() {
  const args = process.argv.slice(2);
  const text = args.includes('--text');
  const payload = args.find((a) => a !== '--text');
  const input = payload !== undefined ? payload : readFileSync(0, 'utf8').trim();
  const out = detranslate(input);
  process.stdout.write(text ? toText(out) : JSON.stringify(out, null, 2) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
export { detranslate, parseLine };

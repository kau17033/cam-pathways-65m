import { detranslate, parseLine } from './cam-translate-reverse.mjs';
import { translate } from './cam-translate.mjs';

let fail = 0;
const ok = (cond, msg, extra) => { if (!cond) { console.log('FAIL', msg, extra ?? ''); fail++; } };

// 1) Round trip: forward JSON -> reverse human/world
const today = new Date('2026-11-02T00:00:00+09:00');
const fwd = translate({ price: 24800, cost: 13900, shipping: 1100, fee: 2480, returnReserve: 0, otherVariable: 1400, deliveryDays: 3, stock: 50, estimateDate: '2026-10-25' }, today);
const rev = detranslate(fwd);
ok(rev.verdict === 'TEST_CANDIDATE', 'roundtrip verdict', rev.verdict);
ok(rev.human.ja.includes('仕入れ候補'), 'roundtrip ja headline', rev.human.ja);
ok(rev.human.en.includes('Worth testing'), 'roundtrip en headline', rev.human.en);
ok(rev.canonical_line === 'CAM verdict: TEST_CANDIDATE — profit ¥5,920 per order', 'roundtrip line', rev.canonical_line);

// 2) Canonical line alone: numbers are NOT invented
const fromLine = detranslate('CAM verdict: REJECT — profit ¥-68 per order');
ok(fromLine.profitPerOrder === -68, 'line profit', fromLine.profitPerOrder);
ok(fromLine.dequantized === null && !!fromLine.world.note, 'line does not fabricate inputs');
ok(parseLine('CAM verdict: HOLD — profit ¥1,162 per order').profitPerOrder === 1162, 'parseLine');

// 3) Dense quantized record: exact dequantization
const dense = { i: 7, c: 'E', g: 'home-kitchen', p: [24800, 13900, 1100, 2480, 0, 1400], k: [800, 10, 30], dd: 3, age: 8, v: 'TEST_CANDIDATE', m: 5920, ac: 5120, r: 'CAM verdict: TEST_CANDIDATE — profit ¥5,920 per order' };
const rd = detranslate(dense);
ok(rd.dequantized.product.price === 24800 && rd.dequantized.product.fee === 2480, 'dense product', JSON.stringify(rd.dequantized));
ok(rd.world.json_ja['販売価格'] === 24800 && rd.world.json_en['allowable CPA'] === 5120, 'dense world formats');
ok(rd.reasons.en.some((s) => s.includes('¥18,880')), 'dense cost total reason', rd.reasons.en.join(' '));
ok(rd.world.csv.split('\n')[1].startsWith('24800,13900,1100,2480,0,1400,TEST_CANDIDATE'), 'dense csv', rd.world.csv);

// 4) Partial dense record: expected HOLD, missing items named, nothing filled in
const partial = { i: 9, c: 'C', g: 'toys', p: [3980, null, 520, null, 160, 370], k: [800, 10, 30], miss: ['cost', 'fee'], expected: 'HOLD', expected_reason: 'incomplete inputs are never passed' };
const rp = detranslate(partial);
ok(rp.status === 'VERDICT' && rp.verdict === 'HOLD', 'partial verdict', JSON.stringify(rp));
ok(rp.human.ja.includes('原価') && rp.human.ja.includes('手数料'), 'partial names missing in ja', rp.human.ja);
ok(rp.dequantized.product.cost === null && rp.dequantized.product.fee === null, 'partial keeps nulls, never fills');

// 5) Forward INCOMPLETE -> reverse asks for the missing numbers in both languages
const inc = translate({ price: 1000, cost: 500 }, today);
const ri = detranslate(inc);
ok(ri.status === 'INCOMPLETE', 'incomplete status', ri.status);
ok(ri.human.ja.includes('送料') && ri.human.en.includes('shipping'), 'incomplete names items', ri.human.ja);

console.log(fail === 0 ? 'REVERSE TESTS PASS (round-trip, line, dense, partial, incomplete)' : `${fail} FAILURES`);

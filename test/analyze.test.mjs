import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRevisionAllowance, evidenceSchema, requestPassages, groundResult, validateInput } from '../lib/analyze.mjs';
const input = { contract: 'One page included. Online payments are excluded.', request: 'Please add online payments and a page.', rate: 85 };
const finding = { title: 'Payments', classification: 'extra', requestQuote: 'add online payments', contractQuote: 'Online payments are excluded.', reason: 'Explicitly excluded.', hours: 4.1 };
test('grounds real quotes and rounds estimates to quarter hours', () => {
  const result = groundResult({ summary: 'Extra work.', items: [finding] }, input);
  assert.equal(result.items[0].selected, true); assert.equal(result.items[0].hours, 4); assert.equal(result.warnings.length, 0);
});
test('invented or empty quotes cannot become chargeable extras', () => {
  for (const contractQuote of ['The agreement promises unlimited revisions.', '', ' ']) {
    const result = groundResult({ summary: 'Extra work.', items: [{ ...finding, contractQuote }] }, input);
    assert.equal(result.items[0].classification, 'unclear'); assert.equal(result.items[0].selected, false); assert.equal(result.warnings.length, 1);
  }
});
test('included work is never assigned paid hours', () => {
  const result = groundResult({ summary: 'Included.', items: [{ ...finding, classification: 'included', hours: 5 }] }, input);
  assert.equal(result.items[0].hours, 0); assert.equal(result.items[0].selected, false);
});
test('rejects malformed model output and unsafe numeric estimates', () => {
  for (const hours of [-2, Infinity, '3', 101]) assert.throws(() => groundResult({ summary: 'x', items: [{ ...finding, hours }] }, input));
  assert.throws(() => groundResult({ items: [] }, input));
  assert.throws(() => groundResult({ summary: 'x', items: [{ ...finding, classification: 'urgent' }] }, input));
});
test('input limits reject empty documents and invalid rates', () => {
  assert.deepEqual(validateInput(input), input);
  for (const rate of [0, -1, Infinity, 100001, '85']) assert.throws(() => validateInput({ ...input, rate }));
  assert.throws(() => validateInput({ ...input, contract: 'tiny' }));
  assert.throws(() => validateInput({ ...input, request: 'x'.repeat(16001) }));
});
test('constrains agreement evidence to actual passages and limits request batches', () => {
  const quotes = evidenceSchema(input.contract).properties.contractQuote.enum;
  assert.ok(quotes.includes('Online payments are excluded.'));
  assert.ok(!quotes.includes('Payments are included.'));
  assert.deepEqual(requestPassages('Hey! The site looks great. Could you add a shop? Please fix the form.'), ['Could you add a shop?', 'Please fix the form.']);
  assert.throws(() => requestPassages(Array.from({ length: 9 }, (_, i) => `Please add feature ${i}.`).join('\n')));
});
test('explicit revision status is checked without changing unrelated deliverables', () => {
  const item = { requestQuote: 'Please add one more revision round.', classification: 'included', contractQuote: 'Two rounds included.' };
  assert.equal(checkRevisionAllowance(item, 'Both rounds have been completed.').classification, 'extra');
  assert.equal(checkRevisionAllowance({ ...item, classification: 'extra' }, 'The revision round has not been used.').classification, 'included');
  assert.equal(checkRevisionAllowance(item, 'Both rounds have not been completed.').classification, 'included');
  assert.equal(checkRevisionAllowance({ ...item, requestQuote: 'Please design packaging.', classification: 'extra' }, 'The revision round has not been used.').classification, 'extra');
});

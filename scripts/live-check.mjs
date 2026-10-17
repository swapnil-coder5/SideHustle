import { analyze } from '../lib/analyze.mjs';
import { samples } from '../public/samples.js';
import { mkdir, writeFile } from 'node:fs/promises';
const key = process.argv[2] || 'studio';
const sample = samples[key];
const input = { contract: sample.contract, request: sample.request, rate: sample.rate };
let result;
if (process.argv.includes('--http')) {
  const r = await fetch('http://127.0.0.1:3210/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  result = await r.json(); if (!r.ok) throw new Error(result.error);
} else result = await analyze(input);
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/live-analysis.json', JSON.stringify(result, null, 2));
await writeFile(`artifacts/live-${process.argv[2] || 'studio'}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.items.length) throw new Error('Model did not return any findings.');
if (!result.items.some(i => i.classification === 'extra')) throw new Error('Model did not identify any extra work in this example.');
const cases = {
  studio: [['shop with Stripe', 'extra'], ['three more service pages', 'extra'], ['one more round', 'extra'], ['contact form works on mobile', 'included']],
  brand: [['darker green', 'included'], ['packaging for three', 'extra'], ['logo in SVG', 'included']],
  video: [['captions we discussed', 'included'], ['a 9:16 version', 'extra']]
};
if (cases[key]) {
  const expected = cases[key];
  for (const [text, classification] of expected) {
    const item = result.items.find(i => i.requestQuote.includes(text));
    if (item?.classification !== classification) throw new Error(`Live regression: ${text} should be ${classification}.`);
  }
}
console.log('LIVE CHECK PASSED: real local inference returned evidence-backed extras.');

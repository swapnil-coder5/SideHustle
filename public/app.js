import { samples } from './samples.js';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let report = null, tone = 'warm', health = null, running = false, timer, toastTimer;
const money = n => new Intl.NumberFormat(undefined, { style: 'currency', currency: $('currency').value, maximumFractionDigits: 2 }).format(n);
const fields = ['contract', 'request', 'project', 'client', 'rate', 'budget', 'currency'];
const selected = () => report?.items.filter(i => i.selected && i.classification === 'extra') || [];
const hours = () => selected().reduce((sum, i) => sum + i.hours, 0);
const total = () => Math.round(hours() * Number($('rate').value) * 100) / 100;
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => $('toast').hidden = true, 4200); }
function status(message, type = '') { $('status').textContent = message; $('status').className = `status ${type}`; $('status').hidden = !message; }
function invalidate() { if (report) { report = null; $('results').hidden = true; status('Inputs changed. Run a new review to keep the evidence and proposal in sync.'); } updateCounts(); }
function updateCounts() { for (const id of ['contract', 'request']) $(`${id}-count`).textContent = `${$(id).value.length.toLocaleString()} characters`; }
function loadSample(key = $('sample').value) {
  if (running) return;
  const sample = samples[key];
  for (const id of fields) $(id).value = sample[id];
  report = null; $('results').hidden = true; status('Example loaded. Run the local model for a fresh analysis, or view the labeled sample report.'); updateCounts();
}
function setBusy(value) {
  running = value;
  for (const el of $('review-form').elements) el.disabled = value;
  $('load-sample').disabled = value; $('sample').disabled = value; $('reset').disabled = value;
  $('analyze').innerHTML = value ? 'Reading between the lines… <span>◌</span>' : 'Find the scope creep <span>↗</span>';
}
async function connect() {
  $('connection').querySelector('span').textContent = 'Checking local AI';
  try {
    const r = await fetch('/api/health');
    if (!r.ok) throw new Error();
    health = await r.json();
    const previous = $('model').value;
    $('model').innerHTML = health.models.length ? health.models.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('') : '<option value="">No models installed</option>';
    $('model').value = health.models.includes(previous) ? previous : health.models.includes(health.recommended) ? health.recommended : health.models[0] || '';
    $('model-status').textContent = health.connected ? `${health.models.length} installed model${health.models.length === 1 ? '' : 's'} found. All inference stays local.` : 'Ollama is not reachable. Start Ollama and reconnect.';
    $('connection').classList.toggle('ready', health.connected && health.models.length > 0);
    $('connection').querySelector('span').textContent = health.connected && health.models.length ? 'Local AI connected' : 'Connect local AI';
  } catch {
    health = null; $('connection').classList.remove('ready'); $('connection').querySelector('span').textContent = 'Server disconnected';
    $('model-status').textContent = 'ScopeShield server is unavailable. Run npm start and reload.';
  }
}
function replyText() {
  const client = $('client').value.trim() || 'there';
  const items = selected();
  if (items.some(i => i.hours <= 0)) return 'DRAFT — Set a positive hour estimate for each selected addition before preparing the reply. You control the estimates; the model classifies scope only. Review each finding and correct its classification if needed.';
  const included = report.items.filter(i => i.classification === 'included');
  const intros = {
    warm: `Hi ${client},\n\nThanks for sending this over! Happy to work through these updates with you.`,
    direct: `Hi ${client},\n\nI've reviewed the requested changes against our agreement.`,
    firm: `Hi ${client},\n\nBefore I begin any additional work, we need to confirm the scope and fee in writing.`
  };
  let text = intros[tone];
  if (included.length) text += `\n\nAlready included in our agreement:\n${included.map(i => `• ${i.title}`).join('\n')}`;
  if (items.length) {
    text += `\n\nThe following additions fall outside our current scope:\n${items.map(i => `• ${i.title} — ${i.hours}h × ${money(Number($('rate').value))}/hr = ${money(i.hours * Number($('rate').value))}`).join('\n')}`;
    text += `\n\nProposed additional fee: ${money(total())} (${hours()} estimated hours). These estimates are for the listed work only; delivery timing and third-party costs need confirmation.`;
    text += tone === 'warm' ? `\n\nWould you like me to proceed with this change order, or prioritize a smaller set of additions? I'll wait for your written approval before starting the extra work.` : `\n\nPlease confirm approval of this change order in writing before I start the additional work. We can also keep the original scope and discuss these additions separately.`;
  } else if (report.items.some(i => i.classification === 'unclear')) {
    text += '\n\nA few details need clarification before I can confirm scope or pricing. Can we review these together?';
  } else if (report.items.some(i => i.classification === 'extra')) {
    text += '\n\nI have not included any additional work in this proposal. We can keep the original scope and discuss additions separately.';
  } else {
    text += '\n\nThe reviewed requests appear to fit the agreed scope. Let’s confirm delivery timing before proceeding.';
  }
  if (report.items.some(i => i.classification === 'unclear') && items.length) text += '\n\nAny items marked “needs review” are excluded from this proposed fee and need clarification first.';
  return text + '\n\nThank you!';
}
function updateTotals() {
  $('total-extra').textContent = money(total());
  $('total-hours').textContent = `${hours()}h`;
  $('total-count').textContent = `${selected().length} of ${report.items.filter(i => i.classification === 'extra').length} extras selected`;
  const fee = Number($('budget').value);
  $('margin-value').textContent = fee > 0 ? `${Math.round(total() / fee * 100)}%` : '—';
  $('reply').value = replyText();
  const incomplete = selected().some(i => i.hours <= 0) || [...$('results').querySelectorAll('[data-hours]')].some(el => report.items.find(i => i.id === el.dataset.hours)?.selected && (!el.validity.valid || el.value === ''));
  for (const id of ['copy-reply', 'export-order', 'print-report']) { $(id).disabled = incomplete; $(id).title = incomplete ? 'Set positive hours for each selected addition first.' : ''; }
  for (const item of report.items) {
    const card = document.querySelector(`[data-finding="${item.id}"]`);
    card?.classList.toggle('excluded', !item.selected && item.classification === 'extra');
    const price = card?.querySelector('.item-price');
    if (price) price.textContent = money(item.hours * Number($('rate').value));
  }
}
function renderReport(shouldScroll = true) {
  const isDemo = report.source === 'sample';
  const labels = { extra: 'OUT OF SCOPE', included: 'ALREADY INCLUDED', unclear: 'NEEDS REVIEW' };
  const quote = (text, verified) => `${esc(text || 'No supporting quote returned.')} ${verified ? '' : '<span title="Not verified">[unverified]</span>'}`;
  $('results').innerHTML = `
    <div class="report-header"><div><div class="eyebrow">THE BIGGER PICTURE</div><h2>${esc($('project').value)} / Scope review</h2><p>${esc(report.summary)}</p></div><span class="report-badge ${isDemo ? 'demo' : ''}">${isDemo ? 'ILLUSTRATIVE SAMPLE · NOT AI OUTPUT' : `LOCAL AI · ${esc(report.model)}`}</span></div>
    ${report.warnings.length ? `<div class="warnings">${report.warnings.map(esc).join('<br>')}</div>` : ''}
    <div class="metrics"><div class="metric"><span class="metric-label">Proposed additional fee</span><strong id="total-extra"></strong><small id="total-count"></small></div><div class="metric"><span class="metric-label">Additional effort</span><strong id="total-hours"></strong><small>Your estimates · review below</small></div><div class="metric"><span class="metric-label">Relative to original fee</span><strong id="margin-value"></strong><small>Extra work / original project fee</small></div></div>
    <div class="review-columns"><div><div class="findings-heading"><h3>The details, with receipts.</h3><span>${report.items.length} findings · review each one</span></div>
    ${report.items.length ? report.items.map(i => `<article class="finding" data-finding="${i.id}"><div class="finding-top">${i.classification === 'extra' ? `<input type="checkbox" data-select="${i.id}" ${i.selected ? 'checked' : ''} aria-label="Include ${esc(i.title)} in proposal">` : ''}<h4>${esc(i.title)}</h4><span class="pill ${i.classification}">${labels[i.classification]}</span></div><p class="finding-reason">${esc(i.reason)}</p><div class="evidence"><div class="evidence-label">CLIENT REQUEST<span>${i.requestVerified ? '✓ Quote matched' : 'Review source'}</span></div><blockquote>${quote(i.requestQuote, i.requestVerified)}</blockquote><div class="evidence-label">ORIGINAL AGREEMENT<span>${i.contractVerified ? '✓ Quote matched' : 'Review source'}</span></div><blockquote>${quote(i.contractQuote, i.contractVerified)}</blockquote></div>${i.classification === 'extra' ? `<div class="finding-price"><label>YOUR ESTIMATE<input type="number" min="0" max="100" step="0.25" value="${i.hours}" data-hours="${i.id}" aria-label="Estimated hours for ${esc(i.title)}">hrs</label><strong class="item-price"></strong></div>` : ''}</article>`).join('') : '<p class="empty-findings">No distinct requests were identified. Review your inputs and try again; an empty report does not confirm that all work is included.</p>'}
    <p class="review-note">Quote matching checks that text exists, not that the model’s interpretation is correct. Review the full agreement. Estimates exclude tax and third-party costs; no charge or message is sent.</p></div>
    <aside class="output-card"><div class="output-head"><h3>Clear boundaries. Good relationships.</h3><p>Your reply, ready for a human touch.</p><div class="output-tabs" role="group" aria-label="Reply tone"><button data-tone="warm" class="active" aria-pressed="true">Warm</button><button data-tone="direct" aria-pressed="false">Direct</button><button data-tone="firm" aria-pressed="false">Firm</button></div></div><div class="reply-area"><label for="reply">EDIT YOUR REPLY · NOTHING IS SENT</label><textarea id="reply" spellcheck="true"></textarea></div><div class="output-actions"><button id="copy-reply">Copy reply ↗</button><button id="export-order">Change order ↓</button><button id="print-report">Print / PDF</button></div></aside></div>
    <div class="report-footer"><span>${isDemo ? '<strong>Sample walkthrough</strong> · Fixed illustrative findings and estimates.' : `<strong>Processed on your machine</strong> · ${esc(report.model)} · ${(report.elapsedMs / 1000).toFixed(1)}s · ${report.usage.outputTokens} output tokens`}</span><button id="export-report" class="download-link">Export evidence report (.json) ↓</button></div>`;
  for (const i of report.items) {
    const card = $('results').querySelector(`[data-finding="${i.id}"]`);
    const div = document.createElement('div'); div.className = 'human-review';
    div.innerHTML = `<label>YOUR CLASSIFICATION <select data-classify="${i.id}" aria-label="Review classification for ${esc(i.title)}"><option value="extra" ${!i.requestVerified || !i.contractVerified ? 'disabled' : ''}>Out of scope</option><option value="included">Included</option><option value="unclear">Needs review</option></select></label><span>${i.reviewed ? '✓ Human reviewed' : i.decisionMethod ? 'Revision allowance check' : 'Check the AI’s interpretation'}</span>`;
    card.append(div); div.querySelector('select').value = i.classification;
  }
  $('results').hidden = false; tone = 'warm'; updateTotals();
  $('results').querySelectorAll('[data-classify]').forEach(el => el.addEventListener('change', () => {
    const item = report.items.find(i => i.id === el.dataset.classify);
    item.aiClassification ??= item.classification; item.classification = el.value; item.reviewed = true; item.selected = item.classification === 'extra';
    if (item.classification === 'included') item.hours = 0;
    renderReport(false); toast('Classification updated. Review the remaining findings before sharing.');
  }));
  $('results').querySelectorAll('[data-select]').forEach(el => el.addEventListener('change', () => {
    report.items.find(i => i.id === el.dataset.select).selected = el.checked; updateTotals();
  }));
  $('results').querySelectorAll('[data-hours]').forEach(el => el.addEventListener('input', () => {
    const n = Number(el.value); if (!el.validity.valid || !Number.isFinite(n) || n < 0 || n > 100 || el.value === '') { updateTotals(); return; }
    report.items.find(i => i.id === el.dataset.hours).hours = n; updateTotals();
  }));
  $('results').querySelectorAll('[data-tone]').forEach(el => el.addEventListener('click', () => {
    tone = el.dataset.tone;
    for (const button of $('results').querySelectorAll('[data-tone]')) { button.classList.toggle('active', button === el); button.setAttribute('aria-pressed', String(button === el)); }
    $('reply').value = replyText();
  }));
  $('copy-reply').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('reply').value); toast('Reply copied. Review it before sending.'); }
    catch { $('reply').focus(); $('reply').select(); toast('Select and copy the reply with Ctrl+C / Cmd+C.'); }
  });
  $('export-order').addEventListener('click', () => download('change-order.md', changeOrder(), 'text/markdown'));
  $('print-report').addEventListener('click', () => {
    let mirror = $('print-reply');
    if (!mirror) { mirror = document.createElement('pre'); mirror.id = 'print-reply'; mirror.className = 'print-reply'; $('reply').after(mirror); }
    mirror.textContent = $('reply').value;
    window.print();
  });
  $('export-report').addEventListener('click', () => download('scope-review.json', JSON.stringify({ project: $('project').value, rate: Number($('rate').value), currency: $('currency').value, originalFee: Number($('budget').value), proposedFee: total(), ...report }, null, 2), 'application/json'));
  if (shouldScroll) $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function changeOrder() {
  return `# Change order: ${$('project').value}\n\nStatus: DRAFT — requires written approval\nPrepared: ${new Date().toLocaleDateString()}\nClient: ${$('client').value || 'Not specified'}\nAnalysis: ${report.source === 'sample' ? 'Illustrative sample, not AI output' : `Local ${report.model}`}\n\n## Proposed additions\n\n${selected().length ? selected().map(i => `### ${i.title}\n- Estimated effort: ${i.hours} hours\n- Rate: ${money(Number($('rate').value))}/hour\n- Proposed fee: ${money(i.hours * Number($('rate').value))}\n- Client request: “${i.requestQuote}”\n- Agreement: “${i.contractQuote}”\n- Reason: ${i.reason}`).join('\n\n') : 'No additions selected.'}\n\n**Total proposed additional fee: ${money(total())}**\n\nEstimated additional effort: ${hours()} hours. Delivery date: to be agreed. Taxes, third-party costs, and any licensing fees are excluded and must be confirmed separately. Only selected items are included. Original terms otherwise remain subject to the existing agreement.\n\n## Approval\n\nClient approval: ____________________\nDate: ____________________\n\nNo additional work begins until scope, fee, and timeline are approved in writing.\n\n## Draft client reply\n\n${$('reply').value}\n\n---\nPrepared with ScopeShield. AI interpretations and estimates require human review. Quote matching is not legal validation.\n`;
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a'); a.href = url; a.download = `${$('project').value.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 50)}-${name}`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Downloaded locally. Review before sharing.');
}
$('review-form').addEventListener('submit', async e => {
  e.preventDefault(); if (running) return;
  if (!health?.connected || !$('model').value) { status('Connect a local model to analyze your documents. The sample report is available without Ollama.', 'error'); $('settings-dialog').showModal(); return; }
  report = null; $('results').hidden = true; setBusy(true);
  const start = Date.now();
  const progress = () => status(`Local AI is comparing the agreement and client request… ${Math.floor((Date.now() - start) / 1000)}s. Small models may take a few minutes on CPU.`, 'loading');
  progress(); timer = setInterval(progress, 1000);
  try {
    const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contract: $('contract').value, request: $('request').value, rate: Number($('rate').value), model: $('model').value }), signal: AbortSignal.timeout(250000) });
    const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Analysis could not complete.');
    report = data; clearInterval(timer); status('Analysis complete. Review the findings and adjust estimates before sharing.'); renderReport();
  } catch (error) { clearInterval(timer); status(error.name === 'TimeoutError' ? 'The local model timed out. Try a shorter document and run again.' : error.message, 'error'); }
  finally { clearInterval(timer); setBusy(false); }
});
$('walkthrough').addEventListener('click', () => {
  loadSample(); const sample = samples[$('sample').value];
  report = { ...structuredClone(sample.report), source: 'sample', model: 'illustrative', warnings: [], createdAt: new Date().toISOString(), items: sample.report.items.map((i, n) => ({ ...i, id: `finding-${n + 1}`, requestVerified: sample.request.toLowerCase().includes(i.requestQuote.toLowerCase()), contractVerified: sample.contract.toLowerCase().includes(i.contractQuote.toLowerCase()), selected: i.classification === 'extra' })) };
  status('Sample walkthrough: these findings are prewritten examples, not live AI output.'); renderReport();
});
$('load-sample').addEventListener('click', () => loadSample());
$('reset').addEventListener('click', () => { if (running) return; for (const id of ['contract', 'request', 'client']) $(id).value = ''; $('project').value = 'Untitled project'; report = null; $('results').hidden = true; status(''); updateCounts(); $('contract').focus(); });
for (const id of fields) $(id).addEventListener('input', invalidate);
for (const id of ['contract', 'request']) $(`${id}-file`).addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 64000) { toast('Please use a text file below 64 KB.'); e.target.value = ''; return; }
  try { const text = await file.text(); if (text.length > 16000) throw new Error('Keep the document below 16,000 characters.'); $(id).value = text; invalidate(); toast('Text imported locally.'); }
  catch (error) { toast(error.message || 'Could not read this file.'); }
  e.target.value = '';
});
for (const id of ['connection', 'nav-settings']) $(id).addEventListener('click', () => $('settings-dialog').showModal());
$('nav-how').addEventListener('click', () => $('how-dialog').showModal());
$('nav-audit').addEventListener('click', () => $('review-form').scrollIntoView({ behavior: 'smooth', block: 'start' }));
$('reconnect').addEventListener('click', async () => { $('reconnect').disabled = true; await connect(); $('reconnect').disabled = false; });
for (const button of document.querySelectorAll('.close-dialog')) button.addEventListener('click', () => button.closest('dialog').close());
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
updateCounts(); connect();

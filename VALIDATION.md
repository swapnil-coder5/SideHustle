# Validation — October 17, 2026

Completed in the Windows workspace with Node.js v24.11.0 and local Ollama.

## GitHub readiness review

After the UI edits and removal of the application MIT license:

- All eight automated tests and JavaScript syntax checks passed again.
- All three real local-model regression examples passed again.
- Scanned the 16 Git-eligible source files (approximately 101 KB) for common API token formats, private-key headers, and hardcoded secret assignments. No matches were found. This pattern scan is not a guarantee against all possible secrets.
- No Git-eligible file exceeded 5 MB. Checked UTF-8 text for replacement characters/common encoding damage and HTML for duplicate IDs; no issues were found.
- Verified that `.env`, `.env.local`, `.env.production`, private-key files, generated analysis artifacts, downloaded model files under `.runtime/`, and the submission ZIP are ignored.
- The application package remains `UNLICENSED`, as requested. No application `LICENSE` file is included. Model licensing information remains documented separately.
- At the time of this review, there was no Git remote or initial commit. Publishing was handled separately after the review.

The source is ready to upload as a local prototype. Interactive browser verification, a demo recording, and the final submission links remain outstanding.

## Automated checks

`npm test`: **8 tests passed**. Coverage includes fabricated/empty source evidence, malformed findings, non-finite or negative estimates, document and rate limits, request-batch limits, schema-constrained source choices, explicit revision-status corrections, served assets, content security policy, cross-origin rejection, malformed JSON, oversized requests, and invalid input responses.

JavaScript syntax checks passed for the server and browser modules.

## Actual local model inference

Default model: `qwen2.5:1.5b`. Final warm runs:

| Example | Expected and observed result | Time |
| --- | --- | --- |
| Website | Shop, additional pages, and additional revision extra; mobile contact-form check included | 3.239 s |
| Brand | Unused color revision and SVG included; packaging/social templates extra as one grouped request | 2.394 s |
| Film | Captions included; alternate formats/languages/raw footage extra as one grouped request | 1.688 s |

The website check ran through the real HTTP `/api/analyze` route of the restarted server. Other examples invoked the same analysis module directly. JSON results are saved under ignored `artifacts/live-*.json` in the development workspace. Times are observations from this machine with the model warmed up, not a performance guarantee or benchmark. Initial model loading was substantially slower.

The AI alone misread explicit revision status in the website and brand examples. The final pipeline corrects those two cases with narrow deterministic checks and preserves `aiClassification`, `aiContractQuote`, and `decisionMethod` for inspection. Human classification overrides preserve the AI value too. The model selected real but sometimes irrelevant source clauses during development, which is why quote matching is never presented as proof of correct reasoning.

Live model hours are deliberately omitted. Users must set their own positive estimates for selected extras; the browser disables reply/proposal/print actions until then. The prewritten sample report has clearly labeled illustrative hours.

## Verification limits

- No connected browser was available: browser inventory returned no enabled browsers. Visual layout, responsive behavior, clipboard, file downloads, dialogs, and print rendering have not been interactively verified. HTTP, syntax, and model checks do not substitute for browser QA.
- These examples were used during development; they are not an independent evaluation set. Arbitrary agreements can fail, and request extraction may group or miss tasks.
- Offline capability follows from the implementation's loopback-only connections and local assets; the machine's external network was not physically disconnected during testing.
- Challenge rules and community research connector calls were denied. The draft follows the user-provided brief, with exact deadline, tags, and official template still to verify. No community consensus or official judging criteria are claimed.
- A stronger model download was attempted but stopped because transfer speed was too slow. The default continues to use the already installed Apache 2.0 model. No downloaded model weights are included in the source bundle.
- The source repository destination is [swapnil-coder5/SideHustle](https://github.com/swapnil-coder5/SideHustle). No hosted demo, recording, or submission post was published during validation. The recording link remains a placeholder in `SUBMISSION.md`.

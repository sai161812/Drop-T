# DROPTEST — 24-hour hackathon PRD

**Version:** 1.0 · **Product type:** AI-assisted launch decision workspace · **Primary users:** first-time sellers, creators, and small startup teams.

## 1. The product in one minute

Someone considering a launch enters the offering, who they expect to buy it, where it will be available, and what it costs. DROPTEST creates **50 distinct simulated profiles** across intended, adjacent, and contrasting audiences. Each profile evaluates the same baseline and one alternative. The app identifies objections and audience differences, calculates break-even from entered numbers, and suggests one concrete test with real people. A shareable page collects real responses separately.

**Example:** A first-time clothing seller enters a shirt at ₹699, its material, image, production cost, and areas served. They compare ₹699 with ₹899 using the same 50 profiles. The result shows the responses by audience and area, the cost of either choice, and a short feedback link they can send to actual buyers before ordering stock.

DROPTEST surfaces hypotheses and trade-offs. It does **not** forecast sales, prove market demand, or treat model-generated profiles as surveyed customers.

## 2. Decisions locked for this build

| Decision | Hackathon commitment |
| --- | --- |
| Audience | People with an early launch decision and limited research budget; start with independent sellers and founders. |
| Working domains | **Clothing/accessories**, **local food/beverages**, **digital products/services**. One shared engine; three tailored input templates. |
| Later domains | Consumer gadgets and events/workshops. No placeholder navigation claiming they work. |
| Panel | Exactly **50 distinct saved profiles** per test: 20 intended, 20 adjacent, 10 contrasting. These are perspectives, not independent human samples. |
| AI calls | Profiles may be evaluated in small batches; **50 profiles does not mean 50 network calls**. Store one response per profile per option. |
| Comparison | Baseline A versus one alternative B, evaluated by the **same 50 profile IDs**. Change one main decision lever per comparison. |
| Location | User-supplied audience markets and served markets. Calculate eligibility from explicit coverage; discuss access friction separately. No invented market size, travel time, or demand. |
| Financial result | Conditional break-even and scenarios from user inputs, calculated in code. No conversion from simulated interest to expected sales. |
| Human validation | A simple public feedback link for A/B/neither/unsure plus an optional reason. Human and simulated responses have separate labels, counts, and storage. |
| UI priority | Build and inspect the **test setup screen first**; then extend its visual language to results and public feedback. |

### The core question

> What should I change or test before I commit money to this launch?

The default final action is **“Test this option with real buyers”** or **“Fill this missing input before deciding.”** The product never issues an unconditional “Launch now” verdict based on synthetic responses.

## 3. Scope and priority

### P0 — needed for a complete demo

1. Create one test using any of the three working domains, with saved draft data and at least one image or screenshot where relevant. A clear text description is mandatory; image analysis is an aid, never the only source of facts.
2. Configure intended audience, adjacent audience, up to four audience markets, served markets, and budget range. Show the fixed 20/20/10 panel split and market distribution before running.
3. Create and persist 50 unique profiles. Evaluate A and B with the same profiles. Show a real running state, recoverable failures, and no fabricated interim results.
4. Compare one lever: **price**, **primary message**, **served markets**, or **creative** (image plus user-confirmed visual description). Show the exact changed fields.
5. Show counts and reasons by segment and market, including unavailable profiles. Allow inspection of individual responses and trace recommendations to profile IDs and entered facts.
6. Calculate contribution per sale, break-even units, and lower/central/higher user-entered sales scenarios when sufficient costs are supplied.
7. Generate a shareable feedback page and show actual responses in a separate section of the report.
8. Ship a responsive, accessible UI with honest empty, disabled, loading, and error states.

### P1 — only after P0 works end to end

- QR code for the feedback URL; CSV export; a second comparison after finishing the first; follow-up chat with one profile; AI image description when a compatible Groq vision model is configured; richer historic test list.
- If image description is implemented in P0, keep an editable confirmation step and a manual path. Never block the core run on vision availability.

### Explicitly outside the 24-hour build

- Statistical claims, a universal launch score, real-world reach estimates, social network, marketplace, ad buying, geocoding/maps, exact travel times, automatic competitor research, demographic stereotypes as causal explanations, payment processing, subscriptions, multi-user organizations, and five fully distinct domain engines.
- “100+ customers agreed,” projected profits from model outputs, and claims that a simulation has been externally validated.

**Cut order if time is tight:** remove QR/export, profile chat, and AI image description first. Then simplify the dashboard and comparison visuals. Keep the three basic intake paths, 50 paired evaluations, location eligibility, deterministic finance, and the basic real-feedback link. Do not replace incomplete calls with invented persona responses.

## 4. Primary journey

1. **Set up a test:** choose domain; name the offering; add images and confirmed descriptions; enter price, access, audience, location, and optional costs.
2. **Review assumptions:** see the intended/adjacent/contrasting mix, audience markets, served markets, expected spend range, and any missing information.
3. **Create B:** select exactly one comparison lever and edit the relevant fields. The UI summarizes the A → B difference.
4. **Run 50 profiles:** generate one stable panel, then evaluate each profile against both options. Display actual completion and let failures retry without recreating profiles.
5. **Review the decision:** compare interest/uncertainty/unavailability by group and market; inspect examples; review break-even and conditional sales scenarios.
6. **Test with people:** share a public page; view actual A/B/neither/unsure responses and short reasons separately.

The setup is usable for someone who has only an idea, a mockup, or a poster. Financial inputs may be omitted, but the finance section must then say which values are missing.

## 5. Input contract and domain templates

### Shared fields

| Field | Rule |
| --- | --- |
| Title, short value proposition, plain-language description | Required. Do not infer hidden specifications from an image. |
| Price and currency | Required for a priced offering. Currency is stored and displayed consistently; no exchange conversion. |
| Intended buyer and adjacent buyer descriptions | Required; show editable suggestions if the user cannot name an adjacent group. |
| Expected spend range | Required for profile construction; kept independent of option A/B prices. |
| Audience markets | 1–4 user-named regions or areas in the same granularity appropriate to the offering. The stable panel draws from this list. |
| Served markets and fulfillment mode | Required; explicit list drawn from the audience markets, plus shipped/pickup/delivery/online as appropriate. B can change served markets. |
| Image or screenshot | 0–3 local uploads; shown to real participants. A **confirmed visual description** is required if creative will influence the simulated evaluation. |
| Fixed launch cost, variable cost per sale, capacity or available units, sales scenarios | Optional, but required for the relevant financial calculations. Costs and units must refer to one stated period or launch batch. |

The interface must label what the simulation saw: entered text and any user-confirmed image description. If an optional vision call suggests a description, users review and edit it before a run. If no vision support is configured, show **“Image attached; describe what it shows for the simulation.”** Do not quietly pretend the model saw the upload.

### Tailored fields

| Domain | Inputs that matter in P0 | Location meaning |
| --- | --- | --- |
| Clothing/accessories | Item type, material, sizes, price, unit production cost, image/visual description, shipping or pickup. | Markets to which the item ships or where pickup is offered; shipping charge if included in variable cost. |
| Local food/beverages | Item, portion, key ingredients/allergens if known, price, pickup/delivery mode, availability window, unit preparation/delivery cost. | City and named neighborhoods/service zones. In-area/out-of-area is an explicit coverage check; no inferred distance. |
| Digital products/services | What it does, core use case, screenshot, one-time or subscription price, supported language/platform, service/support availability. | Countries/regions served; online reach is not assumed global. For subscriptions, calculations apply only to a named first billing period. |

Do not make allergies, performance, shipping times, or compatibility claims the user has not supplied. For digital subscriptions, label costs and revenue as **first-period only**; do not invent churn or lifetime value.

## 6. Profile design and location logic

Generate **50 saved, meaningfully distinct profiles** before the evaluation. Each has an ID, segment, market from the user’s audience-market list, expected budget/spend band, use case, practical constraints, decision priorities, and access mode. Use a seeded, inspectable matrix of domain-relevant traits; deduplicate the meaningful attribute combinations. Groq evaluates these profiles, but their count and composition come from application logic. Before the run, regeneration replaces the active draft panel; once the run starts, its 50-profile snapshot is immutable. Avoid fabricated names/photos or unsupported claims that the panel reflects a city’s population.

- Intended: 20 people plausibly matching the user’s declared buyer.
- Adjacent: 20 people with a plausible related need or different use context.
- Contrasting: 10 people outside the declared positioning, included to surface mismatches or surprising interest; do not force them to dislike the offering.
- Spread profiles across the entered audience markets. The panel shows the market counts before running. A and B reuse the exact panel, seed, and IDs.
- Spread deliberately for comparison; this allocation is **not** a claim about the real population of any market.
- Budget is fixed per profile across A/B. Do not derive budget bands from the current candidate price, or price comparisons become circular.
- Demographics may provide context, but explain reactions using stated needs, spending limits, availability, and access. Do not use protected characteristics as shortcut explanations.

**Deterministic access gate:** a profile’s market is either served under that option’s explicit served-market list or not. If unserved, record `unavailable` for that option and state the coverage reason. If served, Groq can return `interested`, `unsure`, or `not_interested`. Any softer location concern, such as inconvenient pickup, is a subjective objection tied to supplied fulfillment details, not a fabricated drive time. Unknown location stays **unknown** and triggers an input request; it must not be silently treated as reachable.

Market labels are user-entered categories, not verified geographic distances. When B changes served markets, panel membership remains constant and eligibility can change. Show both `interested / 50 total profiles` and `interested / eligible profiles` for each option, with the denominators visible. Segment and market rows have their own denominators. Never label these figures real-world demand or reach.

## 7. Simulation, comparison, and recommendation

### Per-profile record

For each profile and option, persist a validated record with: `profile_id`, `option_id`, `access_status`, `response` (`interested`, `unsure`, `not_interested`, or `unavailable`), concise reason, primary objection or missing detail, factor tags (`price`, `fit`, `access`, `message`, `creative`, `other`), and references to relevant supplied input keys. A free-form reason is an AI explanation, not evidence of actual behavior. Validate length, enum values, known profile ID, option ID, and referenced fields server-side.

The application computes access status and aggregates counts. Groq supplies only the qualitative evaluation and explanation for eligible profiles. Use small batches, for example 5–10 profiles per request, and a configurable concurrency limit. A panel of 50 is still 50 individual stored evaluations per option even when API calls are batched. Validate every batch, retry bounded transient failures and missing IDs, respect rate limits, and preserve successful results. A run with incomplete evaluations is marked incomplete and does not present a full 50-profile headline.

Model selection and structured-output support change. At implementation time verify the selected models and features in [Groq’s Structured Outputs documentation](https://console.groq.com/docs/structured-outputs), [vision documentation](https://console.groq.com/docs/vision), and [rate-limit documentation](https://console.groq.com/docs/rate-limits). Prefer schema-constrained output where supported; otherwise use JSON mode plus server validation. Keep keys on the server. The regular asynchronous Batch API is not suitable as the only interactive hackathon path if its completion window is too long.

### Comparison rule

B changes one primary lever from A: price, primary message, served markets, or creative/image plus its confirmed description. Show the exact diff above the result. For finance, related per-sale costs can be entered separately when a delivery or production change affects them; show those cost changes explicitly and do not describe the entire test as a pure single-variable causal experiment.

Show a paired transition table: A → B for the same profile IDs, plus examples of who changed and why. Totals alone can hide that the newly interested profiles are outside the served market or that a different segment was lost. When the lever is location, report eligibility changes before preference changes.

### Decision card

At the top of results, present: **best supported next test**, key simulated observation with denominator, main objection, relevant location/finance constraint, and missing evidence. Generate short wording from verified aggregates and example records; the application checks any numbers and references used. If no option is clearly preferable, say so. Recommendations are phrased as tests, such as “Ask real buyers in Adyar whether local pickup changes their choice,” rather than promises of success. No composite launch score.

## 8. Financial scenario engine

For option `o`, use user-entered fixed launch cost `F`, price per sale `P`, variable cost per sale `C`, and optional maximum saleable units `M` for the same stated period:

- Contribution per sale: `P − C`.
- Break-even units: `ceil(F / (P − C))` when `P > C`; when `F = 0` and contribution is positive, break-even is zero units.
- If `P ≤ C`, show **“No break-even at this price and unit cost.”**
- If `M` exists and break-even exceeds it, show **“Cannot break even within entered capacity.”**
- For each user-entered lower, central, and higher unit-sales scenario `Q`, compute revenue `Q × P`, variable cost `Q × C`, and net result `Q × (P − C) − F`. Reject negative counts and counts above a supplied capacity. Do not silently clamp them.

Scenario units are entered by the user, **never inferred from the simulated panel**. Label the section “If you sell Q units” and show which inputs produced each figure. If financial inputs are absent or use mixed periods, display a missing-input state instead of a profit claim. Do not compare figures with mismatched currencies or periods.

## 9. Real-person validation

After a completed comparison, generate an unguessable public link. The page shows the actual uploaded imagery, price, message, and availability for both options, with a clear comparison. Ask one question: **“Which would you consider?”** Options: A, B, neither, unsure. Ask an optional short reason. Do not show simulated results before submission. Keep the respondent anonymous; do not collect contact information in P0.

Dashboard: show the actual sample count, A/B/neither/unsure counts, optional reasons, the recruitment context (“Responses came from whoever received your link”), and a plain note that repeat submissions are only limited on a best-effort basis. Avoid inferential statistics for a tiny or convenience sample. Never mix these counts with the 50 simulated profiles. Store only the minimal response and an optional short-lived duplicate-prevention token; sanitize text and rate-limit submission.

## 10. Interface and language

### Visual direction before implementation

The product should resemble a **careful research workbench** that a first-time seller can use. At desktop size, use a compact top bar, a readable main setup column, and a narrower assumption summary. At mobile size, stack these in task order and keep the primary action easy to find. Use a neutral warm surface, dark text, thin dividers, one restrained accent for actions/selection, and a small consistent type/spacing scale. Use tabular numerals for costs and counts. Prefer open sections and tables/rows for analysis; reserve cards for independently actionable units.

The most important screen is **Set up test**. Above the first fold, show the chosen domain, what the user is entering, audience/location assumptions, and the next action. Results begin with a decision card and an explicit A/B diff, then audience and market breakdowns, inspectable profile rows, finance, and real feedback. No decorative left rails, gradient wallpaper, glass, glowing charts, oversized hero, fake progress, or invented dashboard activity.

### Screen map

| Screen | Main action | Required states |
| --- | --- | --- |
| Test setup | Save inputs, review assumptions, create B, **Run 50 simulated profiles** | Empty, invalid/missing data, valid, save error, upload pending/error, disabled while run starts. |
| Running test | See genuine `completed/100` option-profile evaluations and retry incomplete batches | Pending, partial with precise count, rate-limited with retry, completed, failed. No artificial delay. |
| Results | Inspect A/B changes and take the next test action | Successful, incomplete, missing finance inputs, zero real responses, narrow mobile table layout. |
| Public feedback | Review A and B, submit choice and optional reason | Loading, unavailable link, submit pending, submitted, validation error, duplicate best-effort notice. |

Use exact labels such as **“Audience markets,” “Available in,” “Interested among 50 simulated profiles,” “Break-even units,” “Responses from real people,” “Copy feedback link.”** Avoid “unlock,” “supercharge,” “market certainty,” and an unlabeled percentage. Use inline form help for any field that changes interpretation.

Meet readable contrast, visible keyboard focus, actual `<label>` connections, keyboard-operable option selection, meaningful alt text or user-entered descriptions, responsive content at roughly 390 px and 1440 px, and no horizontal overflow. Loading belongs next to the affected content. Motion only confirms a real state change. Inspect rendered desktop and mobile screens and fix observed hierarchy/overflow issues before demo.

## 11. Implementation shape

**For a new empty repository:** Vite + React + TypeScript frontend; a small Express + TypeScript server; SQLite for tests, profiles, evaluations, and human responses; local image storage with file size/type checks; official Groq client or compatible server-side API calls; Zod or equivalent runtime validation; custom CSS with design tokens. Serve the frontend and API from a deployable server for a working public feedback link. If a repository already exists, retain its working stack and use the same contracts; do not rebuild it to match this suggestion.

Keep the Groq key and upload handling server-side. Store `test`, `offering`, `option`, `audience_config`, `profile`, `evaluation`, `run`, and `human_response` records with stable IDs. Store the profile seed and configuration snapshot with each run. Persist successful batch results before proceeding. A retry must target only missing/invalid evaluations and must not overwrite the paired panel.

Suggested API responsibilities (names may adapt to an existing architecture): save test/draft; upload image; create panel and run; get run/progress/results; retry missing evaluations; create/get public feedback page; submit human response. Do not make a fake client-only simulation or expose Groq credentials in the browser.

Protect the demo from trivial failures: validate uploads and numbers; cap prompt/response lengths; use server-side request timeouts and bounded retries; respect Groq `429` with retry guidance; reject malformed model output; mark partial work accurately; avoid raw error details in the public UI. There is no login in the P0 demo, so avoid collecting sensitive business/customer data and do not expose private draft URLs casually.

## 12. Acceptance and evaluation

### Delivery path for one small team

Treat the clothing price comparison as the vertical slice that must work first. Reuse its engine for local food's served-area comparison and the digital service form; do not create separate simulation architectures. A practical 24-hour budget is approximately: 2 hours for repository/setup and design direction, 4 for intake and persistence, 3 for profiles/location, 4 for Groq and recovery, 3 for results/finance, 2 for the feedback page, and the remaining 6 for integration, actual model runs, mobile inspection, fixes, and demo preparation. These are planning limits, not delivery guarantees. If one stage slips, cut P1 features and dashboard detail before cutting correctness or the UI review.

### End-to-end acceptance

1. A clothing seller can enter a shirt, supported markets, audience, image/visual description, unit cost, and two prices; see 50 stable profiles and 100 paired evaluations; inspect who changed their answer; and get correct break-even for each price.
2. A local food seller can mark one neighborhood unserved; profiles in it appear `unavailable`, with no invented travel time. Changing served markets for B changes access for those same profiles; the results disclose changed eligibility.
3. A digital service can declare its supported regions and first billing period. Profiles in unsupported regions are marked unavailable, and finance does not claim customer lifetime value.
4. A broken or rate-limited model batch cannot silently create a complete 50-profile result. Retry preserves valid responses and IDs.
5. The public page receives real responses; dashboard counts them under **real feedback**, never under simulated interest.
6. Running without optional cost data remains useful; finance explicitly requests missing numbers.
7. A user can understand the main next action on setup and results at desktop and mobile sizes with a keyboard.

### Meaningful checks

- Unit tests for break-even including zero fixed cost, nonpositive margin, capacity ceiling, mismatched/invalid scenarios; panel uniqueness and 20/20/10 split; coverage eligibility; A/B identity pairing and incomplete-run handling.
- One actual Groq smoke run with the selected model and a short panel, followed by a complete 50-profile run. Check parsed records and failures, not just a successful HTTP status.
- Manual end-to-end run of clothing, food, and digital templates; inspect rendered UI at desktop/mobile; open and submit the public link from a separate browser session.

### Judge demo, 90 seconds

Show a real saved clothing test: inputs and intended markets → A/B price difference → 50 paired simulated responses and one switched-profile example → transparent break-even → feedback link. Then open a local-food test to show how one uncovered area changes availability. If someone asks for accuracy, say the simulation generates **questions worth checking**; actual responses are displayed separately, and no predictive accuracy claim is made without validation data.

## 13. Terms that must stay consistent

- **Profile/persona:** one synthetic, stable set of constraints and preferences; 50 per test.
- **Evaluation:** one profile’s model-assisted response to one option; 100 complete evaluations for A and B together.
- **API call:** a network request; batches may contain several evaluations, so its count is not the persona count.
- **Interested:** one of the simulated response categories; not purchase intent or real reach.
- **Eligible:** explicitly served in that option’s configured market; availability is computed from supplied coverage.
- **Real feedback:** responses from visitors to the shareable page, with its own denominator and recruitment context.
- **Scenario:** conditional arithmetic using user-entered sales units; not a demand prediction.

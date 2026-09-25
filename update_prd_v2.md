# DROPTEST — reviewed implementation PRD (v2)

**Version:** 2, checked against the founder’s requirements · **Time budget:** remaining hackathon time, originally about 18 hours · **Audience:** the agent that built the current app.

This is the build contract. It replaces `update_prd.md` and `droptest_update.md`; use `prompts_v2.md` and `bp_reference_v2.md` with it. The original `DROPTEST_PRD.md` is background for reusing the existing engine, not a requirement to keep the old primary journey. Retain functioning code and data; adapt the app instead of restarting it. The repository has not been inspected by this document’s author: verify actual implementation before choosing file names or migrations.

## 1. Outcome and scope

DROPTEST becomes a product-focused community for early startups. A startup publishes a specific product proposal with enough detail for someone to judge it. People can discover it, save it, and give structured feedback. Sponsors and other startups can send the founder a support proposal with an amount. The founder has a private Synthetic Lab that researches comparable products and uses the **existing 50 AI profiles** to surface objections before launch. The founder uses those observations to improve the public post or the product.

The MVP is successful when a judge can watch this **real, persistent loop**: founder publishes a T-shirt → another account saves it and gives feedback → a sponsor proposes ₹500 of support → founder sees those real actions → founder opens linked comparable products and a genuinely completed 50-profile lab run. Every displayed number comes from stored records, not a hardcoded animation.

### What to build

| Priority | Feature | Definition of done |
| --- | --- | --- |
| P0 | Accounts with three roles | Sign up/sign in as `user`, `sponsor`, or `startup`; server checks ownership and role. All roles can browse, save, and give feedback. |
| P0 | Startup product posts | Startup creates draft, publishes, edits, and views a real product at a shareable URL; published posts appear in a newest-first feed. |
| P0 | Real engagement | One toggleable save and one editable structured feedback response per account per product; totals derive from records. |
| P0 | Support proposals | Sponsor or startup account proposes any positive amount and a message to another startup; founder sees it in an inbox; no payment occurs. |
| P0 | Product-linked Synthetic Lab | Owner opens the existing lab with product details filled in and can run or inspect 50 actual stored profile evaluations, with honest progress/failure states. |
| P0 | Automatic comparable-product research | The lab performs an actual backend search, returns source-linked findings, and passes those findings to the 50-profile evaluation. Manual references and no-research mode are failure fallbacks, not completion of this requirement. |
| P0 | Demo and UI | Distinct accounts, seeded example products, responsive complete journey, no fake activity or dead actions. |

**No general social posts, comments/chat, follows, coupons, discount redemption, notifications, payments, crowdfunding, equity, investor verification, organization permissions, recommendation algorithm, popularity rankings, moderation console, or claimed demand prediction.** A short feedback reason is sufficient; there is no open comment thread. Do not implement adjacent features simply because the app is called a social platform.

## 2. Roles and permissions

Show the three profile choices clearly on the sign-up/sign-in entry screen. On sign-in, resolve the saved role from the authenticated account rather than trusting the selected tile. A startup supplies its startup name and short description at sign-up; other accounts supply a display name. Use **one authentication system**. Choose the simplest secure session/auth mechanism already compatible with the repo; hash passwords if implementing local credentials, store session state server-side or in a protected signed cookie, and never trust a role sent by the client after login. A role is selected on sign-up. For the hackathon, simple email/password and seeded demo credentials are enough; no OAuth or email verification.

| Action | User | Sponsor | Startup |
| --- | --- | --- | --- |
| Explore and open published products | Yes | Yes | Yes |
| Save/unsave and give/edit own feedback | Yes | Yes | Yes |
| Publish/edit own product and see its lab | No | No | Yes |
| Send a support proposal to another startup | No | Yes | Yes |
| See proposals received for own product | No | No | Yes |

Prevent a founder from sending a support proposal to their own product. A sender can see their sent proposal; a recipient can see proposals for their products. Only a product owner can see private cost inputs, lab results, or draft posts. Public product pages show only founder-selected public details and aggregate feedback. An account may switch to a different role only through an explicit later product decision; role switching UI is outside this build.

## 3. Product data and publishing

The post is the unit of the feed. Required fields: `name`, `category`, `stage` (`idea`, `prototype`, `preparing_to_launch`, `launched`), `summary` (what it is and why someone might choose it), `intended_buyer`, `feedback_question`, and at least **one image or a clear visual/functional description**. `price` is either a nonnegative amount with currency or explicitly `not_set`. Availability is either a list of founder-entered markets and fulfillment mode or `not_decided`. Show explicit category fields so the founder cannot overlook details: apparel asks material, fit and sizes; food asks portion and known ingredients; digital products ask main function, platform and language; other products use specification text. Each field accepts a value or an explicit “Not decided yet”; do not silently omit it. Keep up to three images, delivery charge, launch timing and product link optional. A visual design should strongly prompt for an image; a text-only concept uses a clear description. Reuse the existing domain forms rather than building multiple engines.

Separate `draft` and `published` states. A draft may be incomplete. Validate the publishing requirements on the server. Allow edits after publication, retain `updated_at`, and show current details. Store images with the existing upload mechanism and perform basic file type/size validation. Do not build a full version-history system. Private manufacturing costs, sales scenarios, and full lab responses must never be copied into the post payload.

The feed shows a real image or a tidy text placeholder, product name, startup name, stage, price or **“Price not set”**, category, short summary, and save count. Newest-first ordering plus one simple category filter or search is adequate. The detail page shows complete public details, an explicit startup identity, availability, the current question, real feedback counts, save action, and support action where permitted. Empty feed and missing product have useful states.

## 4. Real feedback and saves

One account can have at most one save per product. Clicking **Save** adds it; clicking **Saved** removes it. Saved products appear in **Saved** for that account. Counts always come from persisted saves.

One account can have at most one feedback record per product. The form asks:

- **Would you consider this product?** `yes`, `maybe`, `no`.
- **What matters most to your choice?** Choose one: price, design/fit, quality/details, availability/delivery, usefulness, or other. Tailor display labels to category only if quick to implement.
- **What would you change or want to know?** Optional, short free text.

Store `author_id`, `product_id`, choice, factor, reason, and timestamps. Submitting again **edits** the existing answer. Show counts for Yes/Maybe/No with the respondent total. Show reasons only if appropriate to the product owner, without implying a representative survey; for public pages, aggregate counts suffice. All three roles can respond. Never count one save as a feedback response or 50 AI profiles as community respondents.

No discount promise or reward mechanic in this build. The original idea of a founder-funded discount for feedback or saving is a later experiment because issuing and redeeming rewards would distract from the core loop. The UI should never show “Discount unlocked.”

## 5. Support proposals

On another startup's published product, a sponsor or startup sees **Offer support**. Form: positive proposed amount, currency (default INR for the demo), short message. A support type is not needed. Save only sender, recipient, product, amount, currency, message and timestamps. The owner sees proposals in **My products → Support proposals** with the associated product and sender identity. Sender sees a submitted state and their proposal. Use one proposal per sender/product; submitting again updates that proposal. Return the saved proposal so the sender sees its current amount and message.

There is **no transfer of funds** in this MVP. Do not call the amount “invested,” “raised,” “received,” or “funding secured.” Show **“Proposed ₹500”** and **“Proposal sent.”** Do not show an aggregate funding total. Contact may be handled manually after the demo; no chat or external email workflow is required.

## 6. Synthetic Lab and research

Preserve the working parts of the current 50-profile architecture from `DROPTEST_PRD.md`: 20 intended, 20 adjacent, 10 contrasting; saved profile IDs; actual model evaluations with bounded retry; incomplete run state; market eligibility; input-based financial arithmetic; A/B pairing where it already works. Reuse the actual code rather than making another simulated panel. **Default to a single-product review: 50 profiles × one product = 50 evaluations.** If the old engine requires A and B, generalize its option loop to accept one or two options, preserving batching, schema validation and retries. Do not require founders to invent a B option, silently duplicate A, or display 100 evaluations for one product. Keep the existing optional A/B comparison as 50 profiles × two options = 100 evaluations. If the old finance/results code assumes two options, render only the available option in single-review mode. A standalone old test may continue to exist, but the new navigation leads a founder from an owned product to its lab. Link `product_id` to lab tests/runs and pre-fill text, price, image description, buyer, and served markets from the product. Lab-only cost and audience settings can then be completed privately.

### Lab preflight and execution

A public concept can have unknown price or availability, but the existing lab needs enough inputs to evaluate it. Before running, show a compact owner-only preflight for missing audience markets, served markets, intended/adjacent groups, and independent budget range. Suggest editable defaults only where justified by entered facts; never silently invent coverage or budgets from product price. Allow a private trial price when public price is undecided. If price remains unknown, assess concept fit with an explicit missing-price limitation and disable price/finance claims; adapt the evaluator schema accordingly. Do not gate the lab on optional production costs. Freeze the product, private inputs, chosen sources and profile IDs for that run; later product edits affect a new run only.

The main action is **Run product review**: validate inputs → fetch comparable products → save source facts → evaluate the fixed 50 profiles using those facts → aggregate and display the report. If the founder has already completed research for the same product snapshot and selected sources, reuse that set for this run instead of overwriting the selection with a second search. Show actual phase and completion counts. If search fails, let the founder explicitly choose **Continue without research** or retry. A successful zero-result search is a valid search result, not proof of uniqueness. Every report names its research state: completed, no relevant matches, failed, or skipped.

### Research before simulation

In the lab, add **Find comparable products**. Build the query from the product category, purpose, distinguishing features, market, and price if supplied. **Automatic search is a required part of the requested product.** In Stage 0, identify a real backend search provider and required credentials; reuse an existing integration if present, otherwise implement one small server-side call to a provider chosen for this repo. Verify its current API docs during implementation. No multi-provider abstraction, crawler, vector database or scraping pipeline is required. An LLM without web retrieval does not fulfill this step. Request a small number of results; save `title`, canonical URL, source/domain, date checked, and only facts supported by the page or search result. Prefer a product page to a vague blog mention. Allow the founder to add a competitor URL and a short note manually, then select up to five relevant references. Remove duplicates; omit inaccessible/irrelevant results. Do not invent prices, features, pages, or source citations. If automated search is unavailable, show its honest unavailable state while manual links remain usable. Report the missing integration or credential as a blocker; do not mark automatic research complete because manual links work. A supplied URL alone is not extracted evidence: manually entered notes must be labeled founder-supplied, while retrieved facts record whether they came from a snippet or page. Never claim a page was read when only a search snippet was available.

Create a short comparison from **selected** references: which product need overlaps, any verifiable differences, and information missing from the founder's post. Give each profile evaluation the founder-confirmed proposal plus compact source-linked reference facts. Automatically use up to five relevant references by default; optional deselection is enough, with no mandatory second research wizard. Add `source_ids` to evaluations that mention a comparable product and validate those IDs against this run’s stored sources. A one-line objection may have no source ID when based only on the founder’s own facts. If information is thin, say so; no “your idea is unique” claim. Store the exact selected reference IDs and product snapshot with each run so the result can be understood later. For uploaded images, reuse the old PRD rule: the model only knows a founder-confirmed description unless an actual vision path ran.

Lab response labels: **Interested / Unsure / Not interested / Unavailable among 50 simulated profiles** with explicit denominators and inspectable reasons. Research references, AI responses, and community feedback use different headings, storage, counts, and colours/visual treatments. Never put simulated responses into the public feedback table or feed. Do not compute “market reach,” a demand percentage, predicted revenue, or an unconditional launch verdict.

## 7. Implementation shape

Inspect the repository before changing it. Identify existing UI routes, server endpoints, persistence, upload code, 50-profile code, tests, and runtime instructions. Keep the repo's framework and conventions. Extend existing DB tables with migrations, or add a few direct tables: `users`, `startup_profiles`, `products`, `product_images` (if needed), `product_saves` (unique user/product), `product_feedback` (unique user/product), `support_proposals`, `competitor_references`, and a `product_id` relation on existing lab tests/runs. Names can follow the existing schema. Index only the lookups needed by feed, product, owner, and lab. A lightweight relational DB already present is fine; no queues, event bus, microservices, or new infrastructure.

Suggested resource operations, mapped to existing API style: auth sign-up/sign-in/sign-out/current account; product create/update/publish/feed/detail; save toggle/list; feedback upsert/read aggregates; proposal upsert/owner inbox; reference add/search/select; lab create/run/results by owned product. Server ownership checks and input validation are required for every write. Add basic upload caps and escaping/sanitization appropriate to the existing stack. Never ship a model/search credential to the browser. Use readable failures and preserve valid partial lab work on API error.

Prepare four demo accounts (user, sponsor, startup A, startup B) and two detailed startup products. Seed once idempotently, or provide a deterministic setup script; do not mix fabricated seed engagement with actual live demo responses without labeling it. A judge should be able to complete the loop in separate sessions or browsers. Preserve original users/tests where migration permits.

### Minimum contracts (adapt names to the repo)

| Operation | Request / persistence | Result |
| --- | --- | --- |
| Create/update product | Owner from session, public fields above, `status`, `created_at`, `updated_at`. Private costs stored in lab data only. | Saved product ID, validated public details; publish errors identify fields. |
| Save product | `product_id` and desired `saved: boolean`; unique `(user_id, product_id)`. | Current saved state and count. Repeated same request does not duplicate. |
| Submit feedback | `product_id`, `choice`, `factor`, optional `reason`; unique `(author_id, product_id)`. | Saved response plus counts of yes/maybe/no and total; edited answer changes distribution, not total. |
| Submit support | `product_id`, amount, currency, message; unique `(sender_id, product_id)`. Derive recipient from product ownership. | Saved proposal; positive amounts only, display as proposed. Store money in minor units or an existing exact decimal representation. |
| Research | Owned `product_id`, saved input snapshot; persist query, state and references with IDs, URLs, supported facts and timestamp. | Real search state, sources and concise comparison. Missing price is null, never invented. |
| Start/get review | Owned product, mode `single` or existing `comparison`, private inputs, snapshot of source facts. | Stable `run_id`, profiles, expected/completed counts (50 or 100), status and validated evaluations. Retry targets missing records. |

These are resource responsibilities, not a demand for new endpoints if the existing app already supplies them. Use the current router/API style. One owner can see their private data; public serializers explicitly omit it. Old anonymous lab records remain preserved and unclaimed until mapped through a controlled local migration; never expose them to newly registered accounts by default. A historical working test may remain an isolated legacy screen outside the new navigation.

## 8. Screen map and copy

| Screen | Primary action | Essential states |
| --- | --- | --- |
| Sign in/up | Enter app; choose role at sign-up | Validation, wrong credentials, existing account. |
| Explore | Open a product | Empty, loading, loaded, category filter. |
| Product page | Save or give feedback; eligible accounts offer support | Unanswered/answered, saved/unsaved, proposal sent, missing product. |
| Publish/edit | Save draft or publish | Missing details, upload error, published, edit saved. |
| My products | Open product, lab, incoming proposals | No products, counts, inbox empty. |
| Saved | Open saved product | Empty/list. |
| Lab | Inspect sources; run 50 profiles; view results | No references, search unavailable, pending/partial/completed/error, no real feedback. |

Use **Explore products**, **Publish product**, **Saved**, **Give feedback**, **Offer support**, **Support proposals**, **Find comparable products**, **Run product review** (with helper text “50 simulated profiles”), **Feedback from people**, **Simulated responses**. Avoid “AI ecosystem,” “unlock success,” “verified demand,” fake loading progress, generic testimonials, a decorative dashboard, and unlabeled percentages. Use clear images, readable type, restrained colour, comfortable mobile spacing, keyboard focus, and labels. Inspect both approximately 390 px and desktop width.

## 9. Delivery order and proof

Follow `prompts_v2.md` one stage at a time. The minimum demo is: auth → founder publishes → another user saves and responds → sponsor proposes an amount → founder sees both → product-linked lab runs 50 profiles. Research executes before profile evaluation in the normal flow. If search integration is blocked, report that core requirement as unfinished while keeping the explicit fallback usable. Do not silently drop automatic research from the delivery plan. Cut secondary filters and polish before any core loop step. Do not replace incomplete work with nonfunctional buttons.

Acceptance checks:

1. A startup account publishes a T-shirt with image/description, material, sizes, ₹ price, intended buyer, and delivery area. It appears in Explore and has a shareable detail URL.
2. A regular account saves and answers. Save count becomes 1; response count becomes 1; editing feedback leaves response count at 1; unsaving returns save count to 0.
3. A sponsor account and a second startup account can each send a positive support proposal to a different founder. Regular users cannot. A founder sees the sender, product, amount, and message, with no payment language.
4. The founder opens the product's private lab; public or unrelated accounts cannot. Product details are pre-filled. Real linked references can be selected. A completed single-product run contains 50 distinct saved profiles and 50 valid responses; optional A/B contains 100 paired responses. The normal run actually searches for comparables, stores source evidence, and passes it into the evaluator. A failed batch is incomplete and retryable.
5. Community feedback, research sources, and lab profiles remain distinct in database queries, interface, and judge narration. Invalid/unknown competitor facts are not presented as sourced research.
6. All visible actions work after refresh and in a second session. Layout is usable on desktop/mobile. Relevant existing tests pass, updating tests only where this PRD intentionally changes old behavior; the full demo journey is walked through once.

At each build stage report: what changed, what was actually verified, what is blocked, and the next stage. At the end provide commands to run/seed the app, demo credentials, environment variables without secrets, and a short list of any unfinished items. Do not describe an unrun flow as working.

## 10. Review outcome and deliberate MVP simplifications

The first documents captured the social product flow but made automatic research optional and left single-product adaptation of the A/B engine undefined. This version closes those gaps and makes repeat-write behavior, category intake and role setup concrete. Keep rewards deferred because the founder called them too costly for this hackathon. Support remains a recorded amount/message, which demonstrates the interaction without processing money. These are explicit MVP choices, not claims that those commercial features exist. No new production infrastructure or unrelated social features are needed.

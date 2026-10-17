# Reference Systems Register

Evidence log for reference-driven design. Statuses: INSPECTED (page fetched
and observed), OFFICIAL_DOCUMENTATION_REVIEWED, PARTIALLY_ACCESSIBLE,
INACCESSIBLE, NOT_YET_RESEARCHED. No fabricated observations.

## A. Commerce / marketplaces

| System | URL | Status | Observed pattern → adaptation |
|---|---|---|---|
| Upwork Project Catalog | https://support.upwork.com/hc/en-us/articles/10408677826963-What-is-Project-Catalog | INSPECTED 2026-10-15 | Predefined projects (scope/price/timeline), add-ons, save-to-compare, message-before-buy → NeedItem packages, deals landings |
| Upwork hiring | https://support.upwork.com/hc/en-us/articles/211063398-How-to-start-hiring-on-Upwork | INSPECTED 2026-10-15 | Job post→proposals vs catalog buy; billing verification before hiring; milestone funding → request/offer dual track, KYC-gated finance |
| Taskrabbit how-it-works | https://www.taskrabbit.com/how-it-works | INSPECTED 2026-10-15 | Task+location → compare → chat → book → cashless pay; Taskprotect; 24h free cancel → TaskPost flow, booking policy |
| Taskrabbit hire-a-tasker | https://support.taskrabbit.com/hc/en-us/articles/46260422073755-How-Do-I-Hire-a-Tasker | INSPECTED 2026-10-15 | Category → address → slot → details → review summary → confirm-and-chat → guided booking steps |
| Thumbtack how-it-works | https://www.thumbtack.com/how-it-works | PARTIALLY_ACCESSIBLE 2026-10-15 (JS shell) + search excerpts | Search → Chat → Hire; best-fit pros WITH reasons; pay-only-if-respond; cost guides → explainable NeedMatcher, cost-guide content |
| Thumbtack pro jobs | https://www.thumbtack.com/pro/jobs | NOT_YET_RESEARCHED | Lead management patterns pending |
| Fiverr clients | https://help.fiverr.com/hc/en-us/articles/360010558038-How-Fiverr-works-for-clients | INSPECTED 2026-10-15 | Packages/extras, request-to-order, explicit fee disclosure, 72h auto-complete, accept/revise/time → listing moderation, fee transparency, revision workflow |
| Amazon product detail | https://www.amazon.com/dp/B0BSHF7WHW | NOT_YET_RESEARCHED | Product-card/detail interaction patterns |
| Amazon cart | https://www.amazon.com/gp/cart/view.html | NOT_YET_RESEARCHED | Cart/checkout flow patterns |
| Shopify | https://www.shopify.com/ + https://help.shopify.com/ | NOT_YET_RESEARCHED | Merchant/catalog administration concepts |
| Etsy | https://www.etsy.com/ | NOT_YET_RESEARCHED | Discovery patterns |
| eBay | https://www.ebay.com/ | NOT_YET_RESEARCHED | Auction/bid patterns (explicitly out of scope unless required) |

## B. Freelance / task (covered above: Upwork, Fiverr, Taskrabbit, Thumbtack)

## C. Education

| System | URL | Status |
|---|---|---|
| Moodle | https://moodle.org/ + https://docs.moodle.org/ | NOT_YET_RESEARCHED |
| Open edX | https://openedx.org/ + https://docs.openedx.org/ | NOT_YET_RESEARCHED |
| Coursera | https://www.coursera.org/ | NOT_YET_RESEARCHED |
| Khan Academy | https://www.khanacademy.org/ | NOT_YET_RESEARCHED |

## D. Healthcare / telehealth

| System | URL | Status |
|---|---|---|
| NHS | https://www.nhs.uk/ + https://www.nhs.uk/nhs-app/ | NOT_YET_RESEARCHED |
| OpenMRS | https://openmrs.org/ + https://openmrs.atlassian.net/wiki/ | NOT_YET_RESEARCHED |
| Jitsi | https://jitsi.org/ + https://jitsi.github.io/handbook/ | NOT_YET_RESEARCHED (candidate integration, unverified) |

## E. Search

| System | URL | Status | Note |
|---|---|---|---|
| Meilisearch docs | https://www.meilisearch.com/docs | INSPECTED 2026-10-15 | Ranking rules, typo tolerance, faceting; decision: PostgreSQL ILIKE + scoped filters at current scale, no engine — revisit with volume (THREAT_MODEL) |
| Algolia | https://www.algolia.com/ | NOT_YET_RESEARCHED | |
| Elasticsearch | https://www.elastic.co/guide/ | NOT_YET_RESEARCHED | |

## F. Auth / security

| System | URL | Status | Note |
|---|---|---|---|
| Laravel authorization | https://laravel.com/docs/authorization | INSPECTED 2026-10-15 | Gates/policies/middleware/can patterns; confirms route-middleware + policy + Inertia-shared-permissions architecture |
| Laravel authentication | https://laravel.com/docs/authentication | NOT_YET_RESEARCHED | |
| Laravel security | https://laravel.com/docs/security | NOT_YET_RESEARCHED | |
| OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | NOT_YET_RESEARCHED | |
| OWASP File Upload | https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html | INSPECTED 2026-10-15 | Allowlist, untrusted content-type, server filenames, size caps, no-execute storage — all verified present in Upload module |
| NIST 800-63-4 | https://pages.nist.gov/800-63-4/ | NOT_YET_RESEARCHED | |

## G. Payments

| System | URL | Status | Note |
|---|---|---|---|
| Paystack accept payments | https://paystack.com/docs/payments/accept-payments/ | INSPECTED 2026-10-15 | Server-side init, verify status+amount before value, webhooks confirm — matches PaymentGatewayInterface + webhook controller design |
| Stripe docs | https://docs.stripe.com/ | NOT_YET_RESEARCHED | |
| PayPal docs | https://developer.paypal.com/docs/ | NOT_YET_RESEARCHED | |

## H. CMS / media / observability

| System | URL | Status |
|---|---|---|
| WordPress docs | https://wordpress.org/documentation/ | NOT_YET_RESEARCHED |
| Laravel queues | https://laravel.com/docs/queues | NOT_YET_RESEARCHED |
| Laravel events | https://laravel.com/docs/events | NOT_YET_RESEARCHED |
| OpenTelemetry | https://opentelemetry.io/docs/ | NOT_YET_RESEARCHED |

## Standing decisions (evidence-linked)

- No second search engine without volume justification (Meilisearch reviewed, PostgreSQL kept).
- No E2E-encrypted messaging (moderation/support/recovery impact documented in NEEDS register).
- No hourly work-diary screenshots (rejected in NEEDS register).
- Jitsi remains candidate-only until securely integrated per healthcare privacy rules.

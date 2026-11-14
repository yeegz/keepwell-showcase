<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/lockup-paper.svg">
    <img src="assets/brand/lockup-ink.svg" alt="Keepwell" width="230">
  </picture>
</p>

<p align="center"><b>Maintenance that keeps working when the signal doesn't.</b></p>

<p align="center">
  <a href="https://keepwell-951434273932.asia-southeast1.run.app"><img src="assets/brand/demo-button.svg" alt="Open the live demo" width="268"></a>
</p>

<p align="center">Pre-pilot. No customers yet. The demo runs on synthetic data and can take up to 20 s to wake.</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/screens/landing-dark.webp">
  <img src="assets/screens/landing-light.webp" alt="Keepwell's landing page: Every job, on the level it's on. Four sites drawn as sections, with a late lift job marked by a revision cloud">
</picture>

## What it does

Keepwell is maintenance software for people who look after many buildings or a plant. Its source is private during the pre-pilot.

- **Residents report by QR code.** Scan the sign in a lobby or a cell, say what is wrong, get a tracking page. No app, no account.
- **The estate is drawn as a section.** Every open job is pinned to the level or production line it is on, and a late one gets a revision cloud.
- **Dispatch explains itself.** Each suggestion shows its score (skills, availability, workload, distance), and hard rules such as an expired lift certificate are never relaxed.
- **Technicians work without signal.** The phone app keeps every action in a durable queue and syncs it when the signal returns. Conflicts are shown to the person, never silently overwritten.
- **Safety and records live in the job.** Step-by-step procedures with measured limits, permit-to-work with lockout and an approval chain, preventive maintenance, spare parts, purchasing and contractors.

## Screens

| Manager overview | Dispatch board |
|---|---|
| <img src="assets/screens/overview-light.webp" alt="Overview, light: what needs a decision, four figures, the shift handover"> | <img src="assets/screens/dispatch-light.webp" alt="Dispatch, light: unassigned jobs, technician lanes on a time axis, and the suggested technicians with their scores"> |
| <img src="assets/screens/overview-dark.webp" alt="Overview, dark"> | <img src="assets/screens/dispatch-dark.webp" alt="Dispatch, dark"> |
| **Permit to work** | **The factory, drawn as a section** |
| <img src="assets/screens/permit-light.webp" alt="Permit PTW-00001, light: validity, two of two isolations proven, isolation points with lock numbers, and the approval chain as a revision table"> | <img src="assets/screens/factory-drawing-light.webp" alt="Northbridge Components, light: a sawtooth-roof hall with Line A, Line B and Utilities, and each open job tagged on its line"> |
| <img src="assets/screens/permit-dark.webp" alt="Permit PTW-00001, dark"> | <img src="assets/screens/factory-drawing-dark.webp" alt="Northbridge Components, dark"> |

<p align="center">
  <img src="assets/screens/tech-today-light.webp" width="24%" alt="Technician Today, light: the next job as a yellow sign">
  <img src="assets/screens/tech-today-dark.webp" width="24%" alt="Technician Today, dark">
  <img src="assets/screens/tech-procedure-light.webp" width="24%" alt="Procedure runner, light: a pressure reading of 0.42 bar on a scale with the 0 to 0.8 bar limit hatched">
  <img src="assets/screens/tech-procedure-dark.webp" width="24%" alt="Procedure runner, dark">
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/screens/trio-dark.webp">
  <img src="assets/screens/trio-light.webp" alt="The same estate on a laptop (overview), a tablet (dispatch) and a phone (technician Today)">
</picture>

### Four short tours, recorded on the live demo

| QR report to the drawing | Drag to assign, with the score |
|---|---|
| <img src="assets/gifs/qr-to-drawing.gif" alt="A resident reports a leak at cell A1 by QR; the planner converts it; it appears on Line A of the factory drawing"> | <img src="assets/gifs/dispatch-drag.gif" alt="The dispatcher selects a genset job, reads the suggested technician's score, and drags the job onto his lane"> |
| **Complete offline, then sync** | **Approve a permit** |
| <img src="assets/gifs/offline-sync.gif" alt="With the phone offline, the technician starts and completes a job; it is saved on the phone, then syncs and shows as completed in the office"> | <img src="assets/gifs/permit-approval.gif" alt="The plant manager approves a permit raised by the planner; a stamp lands and the revision table gains a row"> |

## The three hardest problems

**1. Two technicians, one last part.** Reservation is one conditional `UPDATE` whose `WHERE` holds the stock check. Under READ COMMITTED, Postgres re-checks that condition on the newest row after the first transaction commits, so the loser updates zero rows and gets a `409` listing other stores. A test fires 200 threads at 37 units; exactly 37 succeed. [Read the deep dive](docs/01-reservations.md)

**2. Offline sync that can be retried forever.** The phone keeps a log of what the person did; the server applies each change in its own transaction, deduplicated by a device-made id, and answers `applied`, `duplicate`, `conflict` or `rejected`. A lost response is safe to resend. [Read the deep dive](docs/02-offline-sync.md)

**3. Tenant and site isolation in the database.** Row-level security, forced on every tenant table, with transaction-local settings for the tenant and the person's site scope. A forgotten check reads nothing, and another organisation's record is a 404. [Read the deep dive](docs/03-tenant-isolation.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/diagrams/architecture-dark.svg">
  <img src="assets/diagrams/architecture-light.svg" alt="Architecture: browser and PWA, nginx, a Spring Boot modular monolith, PostgreSQL with row-level security; an outbox row in the same transaction is relayed to SQS and a Go notifier; the demo runs on Cloud Run, AWS is defined in Terraform and not yet applied, and there is a self-host compose file">
</picture>

## Security

An audit against **OWASP ASVS 5.0, level 2** (level 3 for sign-in, sessions, authorisation and tenancy), with the OWASP API Security Top 10 and automated scans, was run on 13 Nov 2026. It found no critical issues and **5 high**, all fixed since:

- an image upload that could exhaust memory before decoding (now a pixel budget before decode);
- first-run setup open to the internet on AWS (now needs a setup token);
- a plain-HTTP hop between the CDN and the load balancer (now HTTPS with an origin lock and WAF, in Terraform);
- missing CSP and frame headers on the web image;
- a CI action pinned to a tag caught up in a supply-chain compromise.

Medium and low findings are tracked against a written fix plan. This was a self-run audit with no penetration test. It is not a certification.

## Scale

**Synthetic workload on stated hardware**, not production performance: 50 tenants, 20,000 assets, **200,000 work orders** and about 2 million stock-ledger rows over two years, on an Apple M1 Pro laptop with Postgres in a 4-vCPU container, measured 13 Nov 2026.

- The ten hot queries were profiled as the application role under row-level security on the largest tenant. After the fixes, **every one runs under 50 ms**. The backlog figure went from 271 ms to 3.3 ms with a rewrite proved to return the same numbers.
- The load test (50 requests per second, 5 measured runs) found a connection-pool starvation in sync that froze the app for a minute; it is fixed and covered by a test.
- The blueprint's p95 targets (300 ms reads, 500 ms writes) were **not proven**: on a laptop shared with other heavy work, the median of five runs was 353 ms and 521 ms, and two of five runs met both.

## Design identity: Datum

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/identity-dark.webp">
  <img src="assets/brand/identity-light.webp" alt="Keepwell Sans and Keepwell Mono specimens, the Riser logo, the signal yellow and breach red, and the trade colours">
</picture>

In a drawing set, the datum is the line everything is measured from. Keepwell draws every site the way an engineer would, as a section, and borrows the rest from real practice: revision clouds for late work, dashed tags for overdue plans, hatching for planned time, the approval chain as a revision table, and one wayfinding yellow on near-black. The typefaces are modified open-font builds: **Keepwell Sans** from Familjen Grotesk, with the middle dot redrawn as a dimension tick and a level-datum glyph, and **Keepwell Mono** from Martian Mono, used for codes only. The **Riser** logo is one line climbing every floor to the job.

## Stack

| | |
|---|---|
| API | Java 25, Spring Boot 4.1 modular monolith, Flyway, PostgreSQL 17 with row-level security |
| Web | Angular 22 with its own design system on the CDK; an installable PWA with IndexedDB; English and Bahasa Melayu |
| Events | Transactional outbox, SQS with a dead-letter queue, a Go notifier for email and signed webhooks |
| Contracts | OpenAPI 3.1 and JSON Schema for events, with a test that fails on drift |
| Infra | Terraform for AWS (ECS Fargate, RDS, CloudFront, WAF, Cognito, SQS); the demo on Google Cloud Run; a self-host compose file |
| Tests | 316 backend tests at commit `239707e` (14 Nov 2026; `mvnw clean verify`, Testcontainers, jqwik). Full re-run on 15 Nov 2026: 315 passed; the outbox crash-recovery test failed once under full-suite load and then passed 3 of 3 runs on its own, so it is timing-sensitive and being tightened. Earlier snapshot (13 Nov, `27e9fc7`): 273 backend, 236 web unit and 40 of 43 Playwright end-to-end tests |

## Status and what's next

Keepwell is **pre-pilot**. Nobody uses it for real work yet, and there are no customer, uptime or impact figures to report. Yousof Selim built it solo over 12 and 13 November 2026 with Claude Code agents, under his direction and review. The demo has three synthetic organisations: a property manager with three Selangor buildings, a factory, and a second tenant that exists to prove isolation.

Next:

- **A first pilot** with a real maintenance team, the step that will produce real numbers. It can run on the self-host bundle or on the AWS stack, which is written and validated but not yet applied or costed.
- **Translations** beyond English and Bahasa Melayu, each reviewed by a person before it ships.
- Re-running the load test on a quiet machine, the remaining medium and low audit fixes, and a field test of offline sync in a real basement.

## Licence

This showcase (text, images and the capture scripts in [`tools/`](tools)) is [MIT](LICENSE). Keepwell's source is private during the pre-pilot, so this showcase has no code from it. The code carries an AGPL-3.0 licence (Apache-2.0 for the API contracts) for if and when it is published; that decision has not been made. The organisations, people, buildings and jobs in every image are synthetic demo data.

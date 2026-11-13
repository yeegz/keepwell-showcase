# How the media were made

Everything here runs against the public demo (synthetic data) with the Playwright install from the Keepwell web app.

| Step | Command | Output |
|---|---|---|
| Still screens, light and dark | `node tools/capture-stills.cjs` | `tools/out/stills/*.png` |
| WebP screens, device trio | `python3 -I tools/make_screens.py` | `assets/screens/` |
| Tour videos and time marks | `node tools/record-gifs.cjs [name]` | `tools/out/video/` |
| GIFs, one shared frame | `python3 -I tools/compose_gifs.py [name]` | `assets/gifs/` |
| Identity sheet | `node tools/make_identity.cjs` | `tools/out/identity/`, converted to `assets/brand/identity-*.webp` |
| Diagrams | `python3 -I tools/make_diagrams.py` | `assets/diagrams/` |

Desk screens are 1440 x 900 at 2x, phones 390 x 844 at 3x, the tablet 834 x 1112 at 2x. Every capture waits for the warm-up banner to go and starts with the first-visit hints already dismissed.

Recording a tour changes the demo: it sends a request, assigns a job, completes a job offline and approves a permit (the permit tour raises its own permit first through the API). The demo re-seeds itself on every cold start and at least every 24 hours. `tools/cancel-wo.cjs` cancels a work order left over from a rehearsal.

The fonts and logo come from the product repository's design folder (`KEEPWELL_FONTS` overrides the font path). Keepwell Sans and Keepwell Mono are modified builds of Familjen Grotesk and Martian Mono under the SIL Open Font License 1.1; they are embedded only in the SVG diagrams and the demo button.

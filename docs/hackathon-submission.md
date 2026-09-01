# Rigsmith — WebMCP Challenge submission draft

> Status: the catalog, the interactive app, and the WebMCP tool set are working. Deployment, public repository URL, and demo video are not ready yet.

This draft is based on the pasted **OpenAI WebMCP Challenge Official Rules** supplied with the project on 2026-08-29. The official rules remain the source of truth if they change.

## Project Story

### About the project

Rigsmith is a fictional electronics workshop for people who want to build a PC without translating a dozen hardware specifications by hand.

The idea came from a simple frustration: product catalogs are designed for browsing, while PC building is a constraint-solving task. A person may know the performance they want, but still need to reason about CPU sockets, memory standards, case clearance, and power headroom at the same time.

Rigsmith is designed around a shared workflow for a person and an AI agent. The person can browse real-looking product cards, compare trade-offs, and make the final call. An agent can search the same catalog, explain a compatibility conflict, and propose a replacement while keeping the person in control of the build.

The repository contains a complete fictional catalog of 135 products across 13 fictional brands and an interactive storefront and PC configurator. It preserves the original product IDs, nested specifications, prices, availability, generated logos, brand guides, and image paths. The catalog and shared build state are exposed through WebMCP tools for search, product lookup, build changes, comparison and compatibility checks.

What we learned is that an agent experience needs explicit actions and stable data boundaries. A tool should return structured product records and clear compatibility reasons, not force an agent to scrape visual labels from cards. The main challenge is making technical constraints understandable without hiding the underlying facts.

### Why WebMCP is a strong fit

PC configuration is a high-friction task for browser agents: it involves searching, selecting across categories, preserving context, and validating relationships between products. WebMCP can expose these operations directly as structured tools instead of making an agent guess which UI controls to click.

Thirty-seven tools are registered; fourteen are included in the stable demo allowlist. The full reference is in
[webmcp-tools.md](webmcp-tools.md), the design in
[webmcp-architecture.md](webmcp-architecture.md). The four that
carry the story are:

- `search_products` — find products by category, brand, price, availability, or specification.
- `check_build_compatibility` — return the conflicts in the build on screen and its power headroom.
- `fix_build_issue` — return the swaps that clear those conflicts, smallest price change first.
- `explain_build_bottleneck` — name the part holding the frame rate down and the frames it costs.

The last two are the reason this is worth doing as tools rather than as page
scraping. A compatibility message states a conflict but never names the part to
change, and the frame rate model knows which component caps the graphics card
but never says so on screen. Both answers exist in the data and neither is
reachable by clicking.

This lets a person say, “I want a quiet 1440p build under $1,500,” while the agent searches the catalog, assembles candidates, explains the trade-offs, and leaves the person to approve the final choices.

### How it improves the experience

The person gets plain-language explanations beside the technical facts. The agent gets deterministic tools with stable IDs and machine-readable results. Together, they can do something that is awkward today: explore a large catalog conversationally while watching a visible build summary update in the browser.

### How it was built

The application and data layer are local and self-contained. The React UI provides catalog browsing, filters, product detail, a nine-part PC builder, compatibility checks, a persistent build summary, cart, and checkout. The active build has one state owner shared by the visible UI and WebMCP tools. `products.json` is the canonical frontend source; `products.db` is retained as a SQLite copy for inspection and future server-side use. Product images, generated fictional logos, and brand guides are served from the repository without external product APIs or downloaded branded imagery.

## Current milestone boundary

The repository contains a working catalog, interactive UI, and WebMCP tool
registrations under `src/app/webmcp/`, covered by unit tests. Deployment behind
an origin trial token, testing against a real agent rather than a stub, and the
demo video must still be completed before submission.

Because the catalog and UI predate the final WebMCP implementation, the eventual submission should keep a dated commit trail that clearly distinguishes this data milestone from the new WebMCP work. The rules say pre-existing work is evaluated only on the meaningful WebMCP extension made during the Submission Period.

## Built with

WebMCP, React, TypeScript, Vite, local JSON catalog, SQLite, CSS, fictional product data, generated local product imagery.

## Try it out

- Live app: **TBD after deployment**
- Public source repository: **TBD after GitHub publication**
- Demo video: **TBD — public YouTube video under 3 minutes**

## Media plan

The shot list, with the words to say and the tool each one should reach, is in
[demo-script.md](demo-script.md). In short:

1. A machine assembled for a budget, appearing slot by slot on screen.
2. A deliberate incompatibility, and the plain-language explanation.
3. `fix_build_issue` offering the swaps that clear it, one of them cheaper.
4. An out-of-stock part raised rather than silently substituted, and watched.
5. The build against a console, with the estimate labelled as an estimate.
6. Checkout opened and handed back — no order placed, no details filled in.

The video must be public on YouTube, include audio, and stay under three minutes. All demo brands and products will remain fictional.

## Submission checklist

- [ ] Working live URL accessible in ChatGPT’s in-app browser or Chrome with WebMCP enabled.
- [x] Public repository with all source, assets, instructions, and an open-source license.
- [x] Repository contains `document.modelContext.registerTool({ ... })` registrations.
- [ ] English project description submitted.
- [ ] Public YouTube demo under three minutes with audio.
- [ ] Final screenshots uploaded.

## Rules audit

- **Stage One viability:** The final project must be a runnable WebMCP app that reasonably fits the challenge theme and uses WebMCP meaningfully.
- **WebMCP Leverage:** Show multiple non-trivial tools in the repository and in the demo video, not only a static registration example.
- **Execution:** Provide a consistent install/run path and ensure the live app behaves as described.
- **Potential Impact:** Demonstrate the concrete PC-building problem and the human-agent workflow.
- **Creativity & Ambition:** Show why collaborative configuration is better than a generic product search.
- **Language:** Keep the Devpost description, testing instructions, and video narration or translation in English.
- **Ownership:** Use only original project work, permitted open-source dependencies, and the supplied fictional assets.
- **Submission freeze:** After the Submission Period ends, do not edit the Devpost submission or live project unless the rules explicitly permit it.

## Rule reference

Key dates in the supplied rules: Registration and Submission Period ends September 3, 2026 at 1:00 pm PT; Judging runs September 4–21, 2026; winners are announced around September 23, 2026. See the [official WebMCP Challenge rules](https://webmcp.devpost.com/rules) and [OpenAI challenge overview](https://openai.com/webmcp-challenge/) before submitting.

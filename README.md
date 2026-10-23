# Vestige — Shopify Theme (Showcase)

> **Vestige** is a custom Shopify theme, designed and built from scratch by Campbell Fisher. It is currently in preparation for submission to the Shopify Theme Store. The theme itself is a commercial product, so the full source is not published — but a **curated slice of the real code is included in this repository** (see below), alongside how the theme is built and why.

## Code in this repository

- `layout/theme.liquid` — the document shell and asset discipline
- `sections/` — hero, lookbook, before-after, cart-drawer
- `snippets/` — product-card, price, responsive-image
- `assets/theme.js` + `assets/theme.css` — the behaviour and style layers
- `config/settings_schema.json` — the merchant-facing settings surface

See `CODE-NOTES.md` for what is included and what is withheld, and why.

## Screenshots

<!-- CAMPBELL: add your own screenshots here before sharing this repo.
     Suggested set:
     1. Homepage hero (desktop)          -> images/homepage-desktop.png
     2. Homepage (mobile)                -> images/homepage-mobile.png
     3. Product page                     -> images/product-page.png
     4. Collection page                  -> images/collection-page.png
     5. Theme editor, section list open  -> images/theme-editor.png
-->

| View | Image |
| --- | --- |
| Homepage — desktop | _[Screenshot placeholder — Campbell to add]_ |
| Homepage — mobile | _[Screenshot placeholder — Campbell to add]_ |
| Product page | _[Screenshot placeholder — Campbell to add]_ |
| Collection page | _[Screenshot placeholder — Campbell to add]_ |
| Theme editor | _[Screenshot placeholder — Campbell to add]_ |

## Design principles

- **Editorial, not decorated.** Vestige is built around type, whitespace, and photography. Sections are deliberately restrained so a merchant's own imagery carries the store — the theme is the frame, not the picture.
- **The merchant is not a developer.** Every visual decision a store owner might reasonably want is a theme-editor setting with a sensible default. Nobody should have to open a code editor to change a colour, a column count, or a headline.
- **Honest by construction.** No fake scarcity, no invented reviews, no placeholder social proof baked into presets. Demo content is clearly demo content.

## Architecture

Vestige is an Online Store 2.0 theme built on JSON templates throughout:

- **Templates as composition.** Every page type (index, product, collection, page, blog, article, cart, search, 404) is a JSON template that assembles sections — merchants can reorder, add, and remove sections on any page from the theme editor, not just the homepage.
- **A real section system.** Sections are self-contained: each owns its markup, its schema (settings, blocks, presets), and its styles. Recurring patterns — media-with-text, featured collection, editorial content blocks, newsletter signup, announcement bar — share conventions for spacing, heading hierarchy, and settings naming, so the editor feels like one product rather than a pile of parts.
- **Snippets for the repeated machinery.** Price rendering, product cards, pagination, icons, and structured data live in snippets and are rendered by sections, so a fix lands everywhere at once.
- **Assets kept lean.** CSS and JavaScript each ship as a single organised file — commented bands in the stylesheet, small single-purpose modules in the script — and interactive behaviour (drawers, sliders, variant selection) is progressive enhancement: the store works with JavaScript disabled further than most themes bother to.

## Performance discipline

Performance in Vestige is a rule set, not an afterthought:

- **`shopify theme check` passes with zero offenses across all 140 theme files** — lint-clean is the baseline, enforced before any change is considered done.
- **No render-blocking habits:** images ship with explicit dimensions to prevent layout shift, below-the-fold media is lazy-loaded, and fonts are loaded with `font-display: swap` behaviour in mind.
- **Minimal JavaScript footprint:** vanilla JS only, no framework, no jQuery. Interactive components are small, single-purpose modules.
- **Liquid discipline:** no nested loops over large collections, no repeated filter chains recomputed inside loops, and metafield access kept off hot paths — the habits that keep server render times flat as a catalogue grows.

## Status

Theme Store submission in preparation: final demo-store builds, documentation, and listing assets are in progress. This showcase will gain real screenshots and a feature tour as the submission package is finished.

—

Designed & built by **Campbell Fisher** · [titanstorebuilder.com](https://titanstorebuilder.com) · [LinkedIn](https://www.linkedin.com/in/campbell-fisher-409ab0212)

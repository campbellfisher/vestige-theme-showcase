# Vestige — included code

Vestige is a commercial theme in preparation for the Shopify Theme
Store, so the full source is not published. This folder holds a
curated slice of the real theme, included so the craft is inspectable:

- `layout/theme.liquid` — the document shell: head discipline,
  asset loading, and the progressive-enhancement stance.
- `sections/` — four representative sections: `hero`,
  `lookbook`, `before-after` (interactive comparison), and
  `cart-drawer`. Each owns its markup, schema, and presets.
- `snippets/` — `product-card`, `price`, and `responsive-image`
  (explicit dimensions, lazy loading, no layout shift).
- `assets/theme.js` — the theme's vanilla-JS behaviour layer:
  small single-purpose modules, no framework, no jQuery.
- `assets/theme.css` — the full stylesheet, organised in commented
  bands (reset, tokens/base, typography, utilities, components).
- `config/settings_schema.json` — the theme-settings surface a
  merchant sees in the editor.

The complete theme is 140+ files and passes `shopify theme check`
with zero offenses. What is withheld is the remainder of the
section library and templates — the product itself.

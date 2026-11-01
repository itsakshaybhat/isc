# INVESTSIGHT CAPITAL · design rules

Read this before changing any screen. Set by the Oxfords "Evolve" pass (1 Nov 2026); skills are in `.agents/skills/` (oxfords, ui-design, web-design-guidelines, design-taste-frontend).

- Brand: logo `assets/investsight-logo.png`, brand teal `var(--brand)`, gold `#c59448` for indicators. Colours come from the existing tokens in `styles.css`; no palette regeneration (the brand owns its hue).
- Modes: Light, Dark, and Pure dark, all shipped and checked. Colour meaning: green = gain or running, red = loss, kill switch, or stopped, amber = waiting or needs review.
- Type: system stack (Segoe UI first). Body 13–14px, nothing under 11px. Exception: the "CAPITAL" wordmark inside the logo lockup (brand identity).
- Page heads: the H1 is the heading. No uppercase label above it and no greeting.
- Numbers: right-aligned with tabular figures in tables (`ux-polish.js` marks numeric columns as `.num`), and in metric values.
- Status chips: quiet by default (dot + text). Only amber and red carry a tint, because those need attention.
- No coloured side rails on cards, banners, or the active nav item; use a full border or a full-row fill. Exception: the 2px separator between stacked score segments (`workspace-v7.css`, marked `oxfords-ignore`).
- Focus: a 3px `#438cf4` ring on every control. Fields that remove the inner input's outline show the ring on their box.
- Motion: colour changes on hover, never movement. The system "reduce motion" setting and Settings → Display both turn animations off.
- Header at 761–1250px: toggle | strategy tabs | account on row 1, search | broker controls on row 2; the theme label is hidden. The kill switch always keeps its label.
- Short screens (≤760px tall): tighter sidebar rows so all seven main destinations stay visible.
- New styles go in a new `workspace-vN.css` loaded last; bump `?v=` in `index.html`.
- Check before shipping: `node .agents/skills/oxfords/scripts/check.mjs <css files>` and `node verify-interface.cjs`.

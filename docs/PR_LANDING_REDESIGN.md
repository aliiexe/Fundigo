# PR: Landing page redesign — premium, accessible, high-converting

## Summary

Rebuilds the Fundigo landing page with a design system, reusable components, two-column hero, glass/neumorphic feature cards, animated stats, sticky micro-CTA, and full accessibility (WCAG AA–oriented) and performance considerations.

## Scope

- **Design system**: Tokens (spacing, motion, easing), Tailwind theme, CSS variables. Palette: graphite `#0B0B0D`, accent `#FF4000`, peach `#FF9A4D`, cards `#141415`, text `#FFFFFF` / `#BDBDBD`.
- **Typography**: Plus Jakarta Sans (next/font), display/heading/body scales, 4px spacing base, max-width 1200px.
- **New/updated components**: `LandingLayout`, `Header`, `Hero`, `FeatureGrid`, `FeatureCard`, `HowItWorks`, `Stats` (with `AnimatedCounter`), `CTA`, `StickyMicroCTA`, `Footer`.
- **Hero**: Two-column layout; left: badge, headline with accent on “your rules”, subhead, CTAs, “No credit card · 2-minute setup”; right: glass card with mini stats and SVG sparkline.
- **Features**: Glass cards, staggered scroll-in, hover lift -6px and 3px accent ring.
- **How it works**: Horizontal flow with connector line, step icons, micro copy (e.g. “No credit card”, “2-minute setup”).
- **Stats**: Counters animate once when in view; trust line (AES, “We never sell”).
- **Sticky micro-CTA**: Shows after 30% scroll, dismissible, keyboard accessible.
- **Accessibility**: Skip-to-content, `:focus-visible` rings, semantic HTML, `prefers-reduced-motion` support.
- **Tests**: `__tests__/landing/accessibility.test.tsx` (skip link); `npm test` passes.

## How to test

1. `npm install && npm run dev` → http://localhost:3000
2. Tab to “Skip to main content”, Enter → focus moves to main.
3. Scroll to features/stats; confirm staggered and counter animations (and that they respect “Reduce motion” if enabled).
4. Scroll past ~30% → sticky CTA appears; dismiss and confirm it stays dismissed.
5. `npm run build` and `npm test`.

## Migration steps

1. Merge this branch.
2. Run `npm install` (Jest/RTL already in package.json if added).
3. Run `npm run build` and `npm test`.
4. Deploy and run Lighthouse (Performance + Accessibility); fix any critical issues.

## Files changed / added

- `design-system/tokens.ts`
- `lib/useReducedMotion.ts`, `lib/useScrollProgress.ts`, `lib/useInViewOnce.ts`
- `components/landing/*` (Layout, Header, Hero, FeatureCard, FeatureGrid, HowItWorks, AnimatedCounter, Stats, CTA, StickyMicroCTA, Footer, index)
- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
- `tailwind.config.ts`
- `jest.config.mjs`, `jest.setup.mjs`, `__tests__/landing/accessibility.test.tsx`
- `package.json` (test script)
- `docs/LANDING_REDESIGN.md`, `docs/PR_LANDING_REDESIGN.md`

## Top 5 UX decisions

1. **Two-column hero with right-side “preview” card** — Shows a concrete outcome (e.g. “+12% savings”, “Goals on track”, sparkline) so the value proposition is clear without reading long copy.
2. **Friction copy next to CTAs** — “No credit card required · 2-minute setup” and step micro copy (“No credit card”, “2-minute setup”) reduce signup anxiety and support conversion.
3. **Sticky micro-CTA after 30% scroll** — Surfaces a second chance to convert for scrollers without blocking the main CTA; dismissible so it doesn’t feel intrusive.
4. **Staggered scroll-in and single-run counters** — Features and stats feel alive and credible; animations run once to avoid distraction and respect reduced motion.
5. **Skip link and visible focus** — Keyboard and screen-reader users can jump to content and see focus; supports WCAG AA and better usability for power users.

## Lighthouse (targets)

- **Performance**: ≥ 90 (lightweight assets, GPU-friendly animations).
- **Accessibility**: ≥ 90 (contrast, focus, semantics, reduced motion).
Run Lighthouse on the production URL after deploy and fix critical issues.

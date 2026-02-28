# Fundigo Landing Page Redesign

## Summary

The landing page has been rebuilt with a design system, reusable components, and a focus on conversion, accessibility, and performance.

## What Changed

### Design system
- **Tokens**: `design-system/tokens.ts` + Tailwind theme (spacing, motion, easing).
- **Colors**: Deep graphite `#0B0B0D`, accent `#FF4000`, peach `#FF9A4D`, cards `#141415`, surface `#1A1A1B`, text `#FFFFFF` / muted `#BDBDBD`.
- **Typography**: Plus Jakarta Sans (next/font), display/heading/body scales, 4px spacing scale, max-width 1200px.

### Components (`components/landing/`)
- **LandingLayout**: Skip-to-content link, wrapper.
- **Header**: Logo + nav, Sign in / Get started (Clerk).
- **Hero**: Two-column layout; left: badge, headline (“your rules” in accent), subhead, primary/secondary CTA, “No credit card · 2-minute setup”; right: glass card with mini stats and SVG sparkline.
- **FeatureGrid** + **FeatureCard**: Glass cards, icon + title + description, staggered scroll-in, hover lift -6px and 3px accent ring.
- **HowItWorks**: Three steps with connector line, icons, micro copy (“No credit card”, “2-minute setup”).
- **Stats**: Animated counters (once in view), trust line (“256-bit AES”, “We never sell”).
- **CTA**: Section with gradient border and primary CTA.
- **StickyMicroCTA**: Appears after 30% scroll, dismissible, keyboard accessible.
- **Footer**: Links (Privacy, About, Contact), copyright, AES security line.

### Accessibility
- Skip-to-main-content link (visible on focus).
- `:focus-visible` rings on buttons and links.
- Semantic HTML (main, header, footer, nav, section, aria-labelledby).
- `prefers-reduced-motion` respected (no or minimal motion when set).

### Performance
- GPU-friendly animations (transform, opacity).
- Motion timing: micro 120ms, short 240ms, medium 400ms, long 600ms; entrance/subtle easings.

## How to run locally

1. Install: `npm install`
2. Dev: `npm run dev` → http://localhost:3000
3. Build: `npm run build`
4. Tests: `npm test`

## Testing

- **Unit**: `npm test` runs `__tests__/landing/accessibility.test.tsx` (skip-link and focus target).
- **Manual**: Use Tab to reach skip link and main content; test with “Reduce motion” on; run Lighthouse (Performance, Accessibility).

## Lighthouse (targets)

After deploy or production build:
- **Performance**: ≥ 90 (no heavy images; CSS/GPU animations).
- **Accessibility**: ≥ 90 (contrast, focus, semantics, reduced motion).
- **Best practice**: Ensure HTTPS and no console errors.

## Migration / PR steps

1. Merge feature branch with `components/landing/`, `design-system/`, `lib/useReducedMotion.ts`, `lib/useScrollProgress.ts`, `lib/useInViewOnce.ts`, updated `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`.
2. Run `npm install` (no new deps required for core; Jest deps already added if present).
3. Run `npm run build` and `npm test`.
4. Deploy and run Lighthouse; fix any critical issues.

## File list (new/updated)

- `design-system/tokens.ts`
- `lib/useReducedMotion.ts`, `lib/useScrollProgress.ts`, `lib/useInViewOnce.ts`
- `components/landing/LandingLayout.tsx`, `Header.tsx`, `Hero.tsx`, `FeatureCard.tsx`, `FeatureGrid.tsx`, `HowItWorks.tsx`, `AnimatedCounter.tsx`, `Stats.tsx`, `CTA.tsx`, `StickyMicroCTA.tsx`, `Footer.tsx`, `index.ts`
- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
- `tailwind.config.ts`
- `jest.config.mjs`, `jest.setup.mjs`, `__tests__/landing/accessibility.test.tsx`
- `package.json` (test script)
- `docs/LANDING_REDESIGN.md`

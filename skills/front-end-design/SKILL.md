---
name: front-end-design
description: Design and refine distinctive front-end interfaces, visual systems, and interaction polish for web apps, landing pages, dashboards, and product surfaces. Use when Codex needs to turn product goals into a clear visual direction, choose typography/color/motion, restructure layouts, define design tokens, or elevate a bland UI while preserving the existing design system when one already exists.
---

# Front-End Design

Inspect the existing product, stack, and brand cues before inventing anything new. Preserve established patterns when the project already has a coherent system; otherwise, introduce a deliberate concept instead of a generic default.

## Work Flow

1. Read the page or feature surface that needs design work.
2. Identify the page type, audience, key action, and any hard constraints from the codebase.
3. Choose one clear visual direction and commit to it.
4. Define the minimum token set needed to support that direction: color roles, typography, spacing rhythm, radii, borders, shadows, and motion style.
5. Reshape layout before polishing components. Fix hierarchy, pacing, grouping, and focal points first.
6. Implement the design in code with reusable primitives and CSS variables when appropriate.
7. Check desktop and mobile behavior, interactive states, and readability before finishing.

## Direction Setting

Describe the concept in 2-4 sentences before or while implementing it. Name the aesthetic in plain language and tie it to concrete interface decisions.

For style selection, read:

- `references/design-directions.md` when the user asks for a look, vibe, or visual concept.
- `references/layout-and-polish.md` when restructuring sections, refining responsiveness, or adding motion.

When the brief is vague, choose a direction that fits the product instead of presenting many shallow options. Prefer a strong, coherent answer over a safe average.

## Implementation Rules

Use the project's existing framework and styling approach. In React or Next.js apps, prefer:

- CSS variables for shared tokens and theme roles
- semantic section structure and accessible headings
- component composition over one-off styling sprawl
- restrained, meaningful motion that supports hierarchy or feedback

Avoid these failure modes:

- default font stacks with no personality when the brief calls for a designed surface
- flat single-color backgrounds when depth or atmosphere would help
- overusing glassmorphism, neon, or gradients without a concept
- polishing tiny details before fixing hierarchy and spacing
- adding heavy animation that harms clarity or responsiveness

## Delivery Pattern

When making visible design changes:

1. Establish or update the visual system.
2. Apply it consistently across the full surface you touch.
3. Keep supporting copy, iconography, and motion aligned with the same concept.
4. Verify the result in code, not just by reasoning about it.

If the repo already contains a design system, treat this skill as a refinement pass rather than a permission slip to replace it.

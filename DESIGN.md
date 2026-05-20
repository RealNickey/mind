---
name: Aurelian Glass
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4f4635'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#817662'
  outline-variant: '#d2c5af'
  surface-tint: '#795900'
  primary: '#795900'
  on-primary: '#ffffff'
  primary-container: '#ffc94b'
  on-primary-container: '#725400'
  inverse-primary: '#f4bf41'
  secondary: '#605e58'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2d9'
  on-secondary-container: '#66645e'
  tertiary: '#5f5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#d3d0d0'
  on-tertiary-container: '#5a5959'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdf9f'
  primary-fixed-dim: '#f4bf41'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5b4300'
  secondary-fixed: '#e6e2d9'
  secondary-fixed-dim: '#c9c6be'
  on-secondary-fixed: '#1c1c17'
  on-secondary-fixed-variant: '#484741'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 64px
    fontWeight: '500'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 40px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  button-text:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is a fusion of high-fashion editorial aesthetics and hyper-modern interface technology. It targets a discerning audience that values intellectual depth and tactile digital experiences. The brand personality is "Posh Minimalist," characterized by a sense of calm authority and effortless luxury.

The visual style is defined as **Liquid Glass**. This approach evolves traditional Glassmorphism into something more fluid and refined. It relies on a "light-first" philosophy where surfaces feel like suspended sheets of translucent crystal. Design movements utilized:
- **Minimalism:** Massive negative space and a restricted, high-quality color palette.
- **Glassmorphism:** Multi-layered translucency with heavy backdrop blurs (20px+) and ultra-thin strokes.
- **Editorial:** High-contrast serif typography and asymmetrical layouts that feel like a luxury print publication.

## Colors

The palette is anchored by the tension between the warm, vibrant primary and the clinical precision of the off-white backgrounds.

- **Primary (#FFC94B):** Used sparingly for high-intent actions, accent ornaments, and brand moments. It should feel like a "glow" rather than a block of color.
- **Secondary / Soft Cream (#FDF9F0):** Acts as a bridge between the stark white and the primary yellow. Used for large surface fills and softer containers.
- **Neutral / Off-White (#F6F6F6):** The core canvas color. It provides a warmer, more sophisticated base than pure white.
- **Sharp Charcoal (#212121):** Reserved for primary text and structural lines to ensure maximum legibility and a "ink on paper" feel.

## Typography

This design system uses a dual-type system to balance heritage with utility.

**EB Garamond** is the voice of the system. It is used for all display and headline roles. To maintain the "posh" aesthetic, headings should use medium weights and tight letter spacing at large sizes.

**Inter** provides the functional backbone. It is used for body copy, labels, and interactive components. The contrast between the organic curves of the serif and the geometric clarity of the sans-serif creates the "Modern Luxury" tension. All labels should utilize uppercase styling with generous tracking to enhance the minimalist feel.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for content containers to ensure editorial control, set within a fluid canvas. 

- **Desktop:** 12-column grid, 1280px max-width, 32px gutters. Margins are intentionally wide (64px) to create an aura of exclusivity.
- **Tablet:** 8-column grid, 24px gutters, 40px margins.
- **Mobile:** 4-column grid, 16px gutters, 20px margins.

Spacing follows an 8px base unit, but emphasizes "Staggered Entry" logic. Elements should never feel crowded; when in doubt, double the padding. Vertical rhythm is driven by the `stack-lg` (48px) unit between major sections to maintain the minimalist flow.

## Elevation & Depth

Hierarchy is achieved through **Glassmorphism and Tonal Layering** rather than traditional shadows.

1.  **Base Layer:** The off-white (#F6F6F6) solid canvas.
2.  **Floating Containers:** Semi-transparent white (rgba(255, 255, 255, 0.6)) with a `backdrop-filter: blur(24px)`.
3.  **The "Liquid" Edge:** Every glass container must have a 1px solid border with a very low opacity (rgba(255, 255, 255, 0.4) on the top-left and rgba(0, 0, 0, 0.05) on the bottom-right) to simulate a light-catching glass edge.
4.  **Interaction Depth:** Instead of rising on the Z-axis, elements "sink" or "press" into the surface. Use a subtle inner-glow for active states rather than a drop shadow.

## Shapes

The design system uses "Rounded" (0.5rem base) geometry to soften the interface and make the "liquid" metaphor feel more natural.

- **Buttons & Small UI:** 0.5rem (8px) corner radius.
- **Cards & Modals:** 1rem (16px) corner radius.
- **Special Accents:** Use "Squircle" mathematics where possible for a smoother transition between straight lines and curves, further pushing the high-fidelity aesthetic.

## Components

### Buttons
- **Primary:** Solid #FFC94B with #212121 text. No shadow, but a subtle white inner-stroke (0.5px) to define the edge.
- **Ghost:** Transparent background, 1px charcoal border at 10% opacity.
- **Interaction:** On hover, primary buttons increase blur of the background behind them. On press, scale to 0.98 using `cubic-bezier(0.22, 1, 0.36, 1)`.

### Input Fields
- Underline style or fully enclosed glass containers. 
- Focus state: The 1px border transitions from 10% black to solid Primary (#FFC94B).
- Typography: Use Inter (body-md) for input text.

### Cards
- Background: Glass (white @ 60% opacity) + 24px blur.
- Padding: Generous (32px or 40px).
- Content: Headlines in EB Garamond, descriptions in Inter.

### Micro-interactions
- **Staggered Entries:** Lists and grid items should fade in and slide up by 10px with a 50ms delay between each item.
- **Liquid Hover:** Large image cards should have a subtle "warp" or scale effect on hover (1.02 scale) to simulate looking through thick glass.
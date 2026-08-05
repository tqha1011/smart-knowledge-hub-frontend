---
name: Core Collaboration System
colors:
  surface: "#f8f9ff"
  surface-dim: "#cbdbf5"
  surface-bright: "#f8f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#eff4ff"
  surface-container: "#e5eeff"
  surface-container-high: "#dce9ff"
  surface-container-highest: "#d3e4fe"
  on-surface: "#0b1c30"
  on-surface-variant: "#45474c"
  inverse-surface: "#213145"
  inverse-on-surface: "#eaf1ff"
  outline: "#75777d"
  outline-variant: "#c5c6cd"
  surface-tint: "#545f73"
  primary: "#091426"
  on-primary: "#ffffff"
  primary-container: "#1e293b"
  on-primary-container: "#8590a6"
  inverse-primary: "#bcc7de"
  secondary: "#6f5b3d"
  on-secondary: "#ffffff"
  secondary-container: "#f7dcb5"
  on-secondary-container: "#736041"
  tertiary: "#051426"
  on-tertiary: "#ffffff"
  tertiary-container: "#1b293c"
  on-tertiary-container: "#8290a7"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#d8e3fb"
  primary-fixed-dim: "#bcc7de"
  on-primary-fixed: "#111c2d"
  on-primary-fixed-variant: "#3c475a"
  secondary-fixed: "#fadfb8"
  secondary-fixed-dim: "#ddc39d"
  on-secondary-fixed: "#271902"
  on-secondary-fixed-variant: "#564427"
  tertiary-fixed: "#d5e3fd"
  tertiary-fixed-dim: "#b9c7e0"
  on-tertiary-fixed: "#0d1c2f"
  on-tertiary-fixed-variant: "#3a485c"
  background: "#f8f9ff"
  on-background: "#0b1c30"
  surface-variant: "#d3e4fe"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: "700"
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: "600"
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built for high-utility enterprise environments where focus, clarity, and reliability are paramount. The brand personality is **Professional, Calm, and Trustworthy**, prioritizing efficient workflows over visual flair.

The design style is **Corporate / Modern**, leaning heavily into systematic functionalism. It utilizes a restrained color palette, intentional whitespace, and a clear "Surface-on-Base" architecture to reduce cognitive load during complex workspace management tasks. Visual elements are grounded in logic, avoiding unnecessary decorations to ensure that the user's data remains the primary focus.

## Colors

The palette is dominated by deep Slates and Earthy tones to establish authority and a grounded sense of stability. **Navy (#1E293B)** serves as the primary anchor for navigation and primary actions, while **Deep Bronze (#35260C)** provides a sophisticated, warm organic contrast for secondary interactive elements and distinct progress indicators.

The background uses a subtle **Slate-50** tint to distinguish the application canvas from white surface containers. Neutral tones are strictly derived from the Slate scale to maintain a cool, cohesive temperature across the entire interface. Status colors are saturated enough for clear signaling but restrained to avoid visual vibration.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy SaaS interfaces. The typographic hierarchy is strictly enforced to guide the user through complex information densities.

- **Headlines:** Use semi-bold weights with slight negative letter-spacing to appear tight and professional.
- **Body Text:** The 14px `body-md` size is the workhorse for table data and standard descriptions, providing a balance between information density and readability.
- **Labels:** Small, uppercase labels with increased tracking are used for secondary metadata and table headers to provide clear distinction from interactive body text.

## Layout & Spacing

The layout follows a **Fluid Grid** model with fixed maximum widths for content containers to prevent line lengths from becoming unreadable on ultra-wide monitors.

A strict **8px spacing scale** (with a 4px half-step for tight components) ensures mathematical harmony.

- **Desktop:** 12-column grid with 24px gutters. Sidebars are fixed at 280px.
- **Tablet:** 8-column grid with 20px gutters. Sidebars collapse to icons or hidden drawers.
- **Mobile:** 4-column grid with 16px gutters. Page margins are reduced to 16px to maximize horizontal real estate for data tables.

## Elevation & Depth

Depth is conveyed using **Tonal Layering** supplemented by **Ambient Shadows**. This design system avoids high-contrast shadows in favor of soft, diffused blurs that mimic a natural light source.

- **Level 0 (Canvas):** Slate-50 background.
- **Level 1 (Surface):** White cards or sections with a 1px Slate-200 border. No shadow.
- **Level 2 (Overlay/Active):** White surface with a 1px border and a `shadow-sm` (4px blur, 2% opacity black). Used for hovering states.
- **Level 3 (Modals/Popovers):** White surface with `shadow-md` (12px blur, 5% opacity black).

Backdrop blurs (12px) are used behind modals to maintain context while focusing user attention on the primary task.

## Shapes

The design system uses a **Rounded** shape language to soften the industrial feel of the Slate color palette. Standard UI components like buttons and input fields utilize a 0.5rem (8px) radius. Larger containers like cards and modals utilize 1rem (16px) to create a distinct visual container. This consistent rounding communicates a modern, approachable enterprise tool.

## Components

- **Buttons:** Primary buttons use Navy (#1E293B) with white text. Secondary buttons use the Deep Bronze (#35260C) or a Slate-200 border with Slate-900 text. Hover states should involve a subtle shift in background brightness (5% darker).
- **Role Badges:** Small, pill-shaped indicators with low-saturation backgrounds:
  - **Owner:** Indigo-100 bg / Indigo-900 text.
  - **Admin:** Blue-100 bg / Blue-900 text.
  - **Member:** Green-100 bg / Green-900 text.
  - **Viewer:** Gray-100 bg / Gray-600 text.
- **Input Fields:** 8px corner radius, 1px Slate-200 border. On focus, the border transitions to Primary Navy with a subtle 2px outer glow.
- **Cards:** White background, 16px rounded corners, 1px border. Padding should be generous (24px) to ensure a "calm" layout.
- **Data Tables:** Flush layout with no outer border, using 1px horizontal dividers. Header rows should use `label-md` typography with a Slate-50 background.
- **Chips:** Highly rounded (pill), 12px font size, used for tags and workspace filters.

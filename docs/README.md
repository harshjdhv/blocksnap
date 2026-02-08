# BlockSnap — Internal Product Overview

BlockSnap is a Chrome extension built to solve a very specific problem:
**taking clean screenshots of UI blocks on the web**.

Most screenshot tools today are page-based or pixel-based.
The modern web, however, is component-based.

BlockSnap aligns screenshots with how modern interfaces are actually built.

---

## What BlockSnap Is

BlockSnap is a **block-first screenshot tool**.

Instead of selecting arbitrary pixel areas or capturing entire pages,
BlockSnap allows users to capture **logical UI blocks** such as:

- Cards
- Sections
- Modals
- Navigation bars
- Pricing tables
- Feature blocks
- Forms and components

Users hover over an element, BlockSnap intelligently snaps to the most
reasonable “block”, and captures it as a clean image.

The user never thinks in pixels.
They think in UI components.

---

## What BlockSnap Is Not

BlockSnap is **not**:
- A full-page screenshot tool (though it may support it as a secondary option)
- A design editor like Canva or Figma
- A code extraction or scraping tool
- A website cloning or UI stealing tool

BlockSnap captures **images only**, intended for:
- Inspiration
- Documentation
- Sharing
- Presentations
- Social media
- Internal references

---

## Core Philosophy

### 1. Block-first, not pixel-first
The primary abstraction in BlockSnap is a *UI block*, not a rectangle.

### 2. Zero-friction capture
The ideal flow is:
> Hover → Click → Clean image

No dragging.
No resizing.
No configuration before capture.

### 3. Opinionated defaults
BlockSnap prefers smart defaults over endless settings.

A single capture should already look good without further editing.

### 4. Preview before power
After capture, users are shown a **preview page** to confirm the result.
Further editing is optional and opt-in.

---

## High-Level User Flow

1. User installs the Chrome extension
2. User activates BlockSnap on any webpage
3. User hovers over a UI element
4. BlockSnap detects and highlights the best matching block
5. User clicks to capture
6. A preview page opens showing the captured image
7. The image is already copied to the clipboard
8. User may optionally open the editor for further adjustments

---

## Architecture Overview

BlockSnap is split into two main parts:

### 1. Chrome Extension
Responsible for:
- Injecting content scripts
- Detecting UI blocks
- Rendering hover overlays
- Capturing screenshots
- Passing image data to the preview page

The extension is intentionally kept minimal and fast.

### 2. Web-Based Preview & Editor
Responsible for:
- Showing a confirmation preview
- Applying default layout presets
- Optional beautification (background, padding, aspect ratio)
- Exporting the final image

This separation keeps the extension lightweight and avoids complex UI logic
inside the browser extension environment.

---

## Block Detection (Conceptual)

Block detection is heuristic-based, not ML-based.

The system:
- Starts from the element under the cursor
- Walks up the DOM tree
- Scores ancestor elements based on:
  - Visual boundaries (background, border radius, shadow)
  - Semantic HTML tags (`section`, `article`, `nav`, etc.)
  - Reasonable size thresholds
  - Layout characteristics (flex, grid)
- Selects the best-scoring candidate as the “block”

The goal is not perfection, but **consistent, intuitive selection**.

---

## Output & Export

BlockSnap outputs raster images (PNG).

Key characteristics:
- High-resolution (2x or higher)
- Clean boundaries
- No UI chrome
- No overlays or debug artifacts
- Clipboard-first workflow

Future formats (SVG, PDF, etc.) are explicitly out of scope for v1.

---

## Open Source & Scope

BlockSnap is open source and intentionally scoped.

Out of scope for early versions:
- Authentication
- Cloud storage
- Collaboration
- Templates marketplace
- AI features
- iFrame-heavy sites

The focus is on doing one thing extremely well.

---

## Target Users

Primary:
- Frontend developers
- UI engineers
- Product designers
- Indie builders

Secondary:
- Technical writers
- Educators
- Indie marketers

BlockSnap is designed for people who already understand modern UI concepts.

---

## Guiding Principle

If a feature makes the product:
- Slower
- More complex
- Less obvious

…it should probably not exist.

BlockSnap values clarity, speed, and restraint.

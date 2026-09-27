# Antigravity Sunburst UI

An interactive, responsive cosmic sunburst interface built with pure HTML, SVG, and modern vanilla JavaScript.

## Features

- **Interactive 360° Ray Rotation**:
  - Base ends of all rays stay strictly anchored to the panel floor origin.
  - When hovered, each affected ray's top part and terminal dot sweep through an elegant 360° closed orbit with smoothstep ease-in and ease-out.
  - Smooth radial brush sweep around cursor.
  - 100% natural ray colors retained on hover.
- **6 Dynamic Color Themes**:
  - Sunrise (Default)
  - Cyberpunk
  - Sunset Crimson
  - Emerald Dream
  - Deep Twilight
  - Clean Minimalist
- **Theme Controls**:
  - Dropdown theme selector with radio-menu navigation.
  - Keyboard shortcut: press `T` to cycle through themes anytime.
  - Smooth gradient background crossfading and SVG gradient stop morphing.
  - LocalStorage persistence across page reloads.
- **High-Performance Architecture**:
  - Set-based active ray tracking in `requestAnimationFrame`.
  - Conditional loop execution: 0% CPU & GPU usage at idle.
  - Cached layout metrics to prevent layout thrashing and forced reflows.
  - Self-contained, zero external runtime dependencies.

## Live Demo

Deployable on GitHub Pages directly from the repository root.

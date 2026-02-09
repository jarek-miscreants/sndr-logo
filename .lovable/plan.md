

# Grid Shape Generator – Implementation Plan

## Overview
A browser-based vector shape editor where users draw on a pixel grid and the system renders flexible vector shapes with variable corner rounding — combining hard edges and smooth curves as shown in the reference images. Output supports both SVG and PNG export.

---

## Core Features

### 1. Interactive Pixel Grid Canvas
- Configurable grid up to **64×64** with presets (8×8, 16×16, 32×32, 64×64)
- Click or drag to toggle pixels on/off (black & white mode)
- Grid lines with zoom and pan controls
- Drawing tools: **Pencil**, **Eraser**, **Line**, and **Rectangle fill**
- Diagonal drawing support via line tool

### 2. Vector Shape Rendering (Core Innovation)
- Filled pixels are merged and rendered as a single SVG path
- **Variable corner rounding** — a global radius slider that smooths outer corners of pixel clusters while preserving hard inner edges where shapes meet
- **Independent horizontal/vertical stretch** — sliders to scale the pixel aspect ratio, creating wider or taller block proportions
- Real-time preview: as the user draws or adjusts parameters, the vector output updates instantly beside the grid

### 3. Live Preview Panel
- Side-by-side layout: grid editor on the left, vector shape preview on the right
- The preview shows the final rendered SVG shape at full quality
- Toggle grid overlay on/off in preview

### 4. Export Options
- **Download SVG** — clean vector file of the generated shape
- **Download PNG** — rasterized at a chosen resolution (1x, 2x, 4x)
- **Copy SVG code** to clipboard for quick pasting

### 5. Shape Controls Toolbar
- Corner radius slider (0 = sharp pixels → max = fully rounded)
- Horizontal stretch slider
- Vertical stretch slider
- Grid size selector
- Clear canvas / undo / redo buttons

### 6. UI & Layout
- Clean, minimal interface with a dark toolbar and light canvas
- Responsive layout that works on desktop screens
- Keyboard shortcuts for common tools (P for pencil, E for eraser, Ctrl+Z for undo)

---

## What's Not in V1 (Future Enhancements)
- Image-to-pixel-art conversion (upload & auto-convert)
- Color palette / multi-color support
- Layer system
- Save/load projects
- Dithering patterns


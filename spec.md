# Specification

## Summary
**Goal:** Build a frontend-only interactive canvas application ("Canvas Studio") where users can draw, place shapes, add text, use icons, and export their work as PNG.

**Planned changes:**
- Full-screen white canvas as the primary workspace with a light neutral app chrome surrounding it
- Freehand drawing tool with configurable stroke color and width
- Shapes tool supporting rectangle, circle, triangle, arrow, line, star, diamond, and hexagon — each placeable, draggable, and resizable with configurable fill and border colors
- Text tool to click-to-place editable text labels with configurable font size and color
- All canvas elements (drawings, shapes, text, icons) are individually selectable, draggable, and repositionable
- Built-in icon library panel with categorized/searchable icons that can be placed on the canvas as movable, resizable elements
- "Save as PNG" button that exports the full canvas (with white background) as a downloaded PNG file
- Undo support via Ctrl+Z and a toolbar button with at least 20 steps of history
- Clean minimal UI theme: light neutral toolbar/chrome, slim toolbar with icon buttons and tooltips, sans-serif typography, subtle shadows and borders; canvas remains pure white

**User-visible outcome:** Users can open Canvas Studio and immediately start creating diagrams or illustrations by drawing freehand, placing shapes and icons, adding text labels, and exporting the finished canvas as a PNG image.

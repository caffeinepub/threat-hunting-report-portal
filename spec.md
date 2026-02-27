# Specification

## Summary
**Goal:** Fix icon dragging behavior, center text labels, and ensure drawings/icons always render above uploaded background images on the canvas.

**Planned changes:**
- When dragging an icon on the canvas, only the icon image moves; the text label stays fixed at its original position.
- Text labels are rendered vertically centered relative to their associated icon image.
- Uploaded background images are always rendered as the bottom-most layer, so all icons, drawings, shapes, lines, and arrows appear on top of them.

**User-visible outcome:** Users can drag icon images independently of their labels, see labels vertically centered, and freely draw or place icons over any uploaded background image without elements being hidden behind it.

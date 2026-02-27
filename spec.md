# Specification

## Summary
**Goal:** Extend the eraser tool to erase all diagram element types and extend the free transform tool to support moving and resizing icon elements in AttackPathCanvas.

**Planned changes:**
- Update the eraser tool so that clicking or dragging over any diagram element (icons, text labels, freehand drawings, lines/arrows, and image elements) removes it from the diagram state
- Update the free transform tool so that clicking an icon displays a bounding box with resize handles, allowing the user to drag to move the icon or drag handles to resize it, consistent with existing free transform behavior for images and text labels

**User-visible outcome:** Users can erase any element in the diagram using the eraser tool, and can move and resize icon elements using the free transform tool.

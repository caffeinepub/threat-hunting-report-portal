# Specification

## Summary
**Goal:** Add resizing and rotation capabilities to image and text elements on the attack path canvas via a Free Transform tool.

**Planned changes:**
- When an uploaded image element is selected on the canvas, display 8 drag handles (corners and edge midpoints) to allow resizing; dimensions update in real time and are persisted in element state (width/height).
- When a text element is selected on the canvas, display 8 drag handles to allow resizing the text box; text wraps within the new dimensions and width/height are stored in state.
- When the Free Transform tool is active and a text or image element is selected, display a rotation handle above the bounding box; dragging it rotates the element around its center, with the angle stored in element state and applied via CSS/SVG transform.
- Resize and rotation state (width, height, rotation) are preserved when the diagram is saved and reloaded.

**User-visible outcome:** Users can resize uploaded images and text boxes by dragging handles, and rotate them using the Free Transform tool on the attack path canvas.

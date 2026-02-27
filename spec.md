# Specification

## Summary
**Goal:** Fix diagram save/load persistence so saved diagrams appear immediately in the sidebar and dialogs, and restrict toolbar icon drag-and-drop to the icon image only (not the text label).

**Planned changes:**
- After saving a diagram via SaveDiagramDialog, invalidate the `allDiagrams` and `diagramState` caches so the diagram appears immediately in DiagramSidebar and LoadDiagramDialog without a page reload.
- Ensure loading a saved diagram correctly restores all icons, connections, drawings, lines, text labels, and images.
- In AttackPathToolbar, move the `draggable` attribute and `onDragStart` handler from the button/container element to the icon image element only, so only the image is draggable and the text label beneath it is not.

**User-visible outcome:** Users can save a diagram and see it immediately in the diagram list without reloading the page. When dragging toolbar icons onto the canvas, only the icon image acts as the drag source, not the label text.

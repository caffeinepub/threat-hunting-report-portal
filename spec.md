# Specification

## Summary
**Goal:** Fix drag-and-drop in the save diagram UI so that only the thumbnail preview image is draggable onto the canvas.

**Planned changes:**
- Set `draggable={true}` and attach drag event handlers exclusively to the `<img>` thumbnail element within saved diagram items in the AttackPathToolbar (and any related save diagram UI).
- Set `draggable={false}` on the parent container and all sibling elements (labels, borders, backgrounds, buttons) to prevent unintended drag initiation.

**User-visible outcome:** Users can drag only the thumbnail preview image of a saved diagram onto the canvas; clicking or interacting with the surrounding label, border, or buttons does not trigger a drag.

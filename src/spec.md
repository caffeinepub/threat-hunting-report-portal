# Specification

## Summary
**Goal:** Add a free transform tool to the AttackPathCanvas that allows users to move and resize diagram icons and their text labels together.

**Planned changes:**
- Implement selection functionality that groups icons with their text labels as a single unit
- Add drag functionality to move selected icon-label pairs together while maintaining their relative positioning
- Add resize handles (corner and edge) to selected icons for proportional and axis-based scaling
- Create visual feedback showing selection state with bounding box and transform handles
- Ensure deselection by clicking on empty canvas area

**User-visible outcome:** Users can click to select any icon on the diagram, drag it to move the icon and its label together, and use corner/edge handles to resize the icon while maintaining visual quality.

# Specification

## Summary
**Goal:** Fix the free transform tool to prevent unwanted node duplication when clicking on diagram elements.

**Planned changes:**
- Remove copy/paste behavior triggered by clicking nodes in the diagram canvas
- Ensure the free transform tool only allows moving, rotating, and scaling operations
- Apply the fix consistently to all node types (icons, text labels, images, connections)

**User-visible outcome:** Users can click and transform nodes in the diagram without accidentally creating duplicate copies, experiencing cleaner and more predictable interaction with the free transform tool.

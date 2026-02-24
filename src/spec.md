# Specification

## Summary
**Goal:** Add a draggable icon toolbar with 6 security icons using Lucide React library.

**Planned changes:**
- Add AttackPathToolbar component with 6 horizontally arranged security icons (Backdoor/Virus, Phishing Email, Cloud Server, Firewall, Router Device, Scheduled Task) using Lucide React
- Implement drag-and-drop functionality allowing users to drag icons from toolbar and drop them onto the AttackPathCanvas
- Update icon type definitions to include the 6 new security icon types
- Integrate dropped icons with existing canvas functionality (selection, movement, connections, save/load, undo, delete, multi-select)

**User-visible outcome:** Users can drag security icons from a horizontal toolbar and drop them into the attack path diagram canvas, where they function like existing diagram elements.

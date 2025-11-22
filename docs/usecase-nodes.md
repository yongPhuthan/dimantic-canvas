# Use Case Diagram Nodes (GraphWeaver-RF)

Concise reference for node types, shapes, and handle behavior.

## Node Types
- **Actor (External Role)**  
  - Shape: rounded-rect card with avatar.  
  - Meaning: outside the system; initiates interactions (user-facing intent).  
  - Handles: dynamic dots on all sides; multiple connections fan out per side/role.

- **Use Case (Capability)**  
  - Shape: pill/oval.  
  - Meaning: system capability in ubiquitous language.  
  - Handles: dynamic dots on all sides for association/include/extend.

- **System Boundary (Context)**  
  - Shape: dashed rounded container.  
  - Meaning: bounded context holding related use cases; entry/exit for edges.  
  - Handles: dynamic dots on all sides; children constrained inside.

## Handle / Connection Rules
- Handles are created per side and per role (source/target) based on how many edges attach on that side.  
- Positions are percentage-based along the edge (with padding) so they scale with varying node sizes.  
- Edges lock to their assigned handle ids; origins/targets align to the rendered dots instead of sharing a single point.

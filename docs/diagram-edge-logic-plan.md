# DiagramEdge Logic Redesign Plan

Goals: classify edges as internal/external relative to subgraphs, and auto-pick handles (dots) per SubgraphNode based on its grid (columns/rows) and child ordering. The rules apply globally to any diagram type, not just use cases.

## Current State (baseline)
- A single `FloatingEdge` picks sides by comparing node centers and spreads multiple edges on a side; handles come from `handleLayout` static counts.
- SubgraphNode handles are rendered from `data.handleLayout`, but counts are static defaults; no awareness of grid orientation or child ordering.
- Layout already computes subgraph grids (`applySubgraphGrid`) with placements for children, but the React Flow layer does not use that metadata for handle logic.

## Definitions
- **Host Subgraph:** nearest ancestor node whose kind is `SYSTEM_BOUNDARY`. A node can be inside nested subgraphs; the host is the lowest such ancestor (could be itself if it is a subgraph).
- **Internal edge:** both endpoints share the same host subgraph (including the case where both are direct children of the same boundary).
- **External edge:** endpoints do not share the same host subgraph (cross-boundary, to ancestor, or to another branch).
- **Orientation:** derived from grid (columns, rows). Horizontal when `columns >= rows` (e.g., 4x1), vertical when `rows > columns` (e.g., 2x3).

## Data / plumbing to add
1) Surface grid metadata to React Flow:
   - Extend layout result to include, per subgraph, `{ columns, rows, placements: [{ childId, x, y, index }] }`.
   - Pass that into `adaptLayoutToReactFlow` via `node.data.subgraphGridMeta`.
2) Build a parent-chain map `{ nodeId -> [ancestors...] }` for quick host-subgraph lookup and lowest-common-subgraph detection.
3) Provide a derived structure for handle planning:
   - For each subgraph: orientation (horizontal/vertical), ordered children (by placement reading order), and a lookup `{ childId -> orderIndex }`.
   - For each node: hostSubgraphId (or `null` if top-level).

## Edge classification logic
1) For each edge `(source, target)`:
   - Find `hostSource`, `hostTarget`.
   - If `hostSource === hostTarget` and not null => `internal`.
   - Else => `external`.
2) Keep `lcaSubgraph` handy for future routing policies (e.g., exits from nested subgraphs).

## Handle budget & side selection rules
Apply per SubgraphNode; non-subgraph nodes keep current fan-out logic but may reuse the same offset spreader.

- **Orientation derivation:** use explicit `grid.columns`/`grid.rows`; fall back to child count to infer (>= 3 columns => horizontal, else vertical).
- **External edges:**
  - Horizontal orientation: allocate target/source handles on Top/Bottom first (fill alternating to keep spacing), only use Left/Right when Top/Bottom are saturated.
  - Vertical orientation: allocate Left/Right first; fallback to Top/Bottom when needed.
  - Exit/entry side preference: choose the side that minimizes bend based on external node position (use center vector), but bias toward the orientation’s preferred sides above.
- **Internal edges:**
  - Default flow follows orientation: horizontal → source on Right, target on Left; vertical → source on Bottom, target on Top.
  - If nodes are in the same row/column (by grid index), allow shortest-path override: pick the side that minimizes distance and avoids crossing the subgraph border.
  - Spread multiple internal edges per side using existing offset bucket logic.
- **Handle counts:** compute counts per side/role from the above assignments; store in `handleLayout` for SubgraphNode so handles render exactly where needed.

## Anchor (handle) selection algorithm (FloatingEdge updates)
1) Precompute per-edge attachments:
   - `attachmentHint[source|target] = { side, offset?, handleId? }` from the handle planner.
2) In `FloatingEdge`, prefer `attachmentHint` side/handle; fallback to existing `pickPositions` for non-subgraph nodes or unknown hints.
3) Keep spread offsets per side/role (existing `offsets` map) but seed with planned offsets when provided to prevent re-stacking.
4) Maintain marker orientation per chosen side (already supported).

## Update flow
1) Layout run produces `subgraphGridMeta` + placements.
2) A new `buildEdgeAttachments` (or similar) consumes `{ nodes, edges, subgraphGridMeta }`:
   - Determines host subgraphs and edge classification.
   - Assigns side/role per endpoint; aggregates counts into `handleLayout` for SubgraphNode data.
   - Emits per-edge attachment hints (side, offset, optional handle id).
3) `adaptLayoutToReactFlow` uses the planner’s output to:
   - Inject `handleLayout` for subgraphs (dynamic).
   - Attach `attachmentHints` onto edge data for consumption by `FloatingEdge`.
4) `SubgraphNodeModel` renders handles from computed layout; regular nodes remain unchanged unless we later add similar logic.
5) `FloatingEdge` reads hints to pick handles/sides; fallback remains smooth-step with nearest handle.

## Playwright validation plan (MCP / local)
- Scenario A (horizontal 4x1):
  - Subgraph grid `{ columns: 4, rows: 1 }` with 4 children in order.
  - Expect internal edges to use Right→Left handles; external edges from each child prefer Top/Bottom.
  - Assertion: query handle ids on SubgraphNode (top/bottom counts > 0; left/right used by internal only), verify edge path orientations.
- Scenario B (vertical 2x3):
  - Expect external edges to favor Left/Right; internal to favor Bottom→Top.
- Scenario C (mixed nested subgraphs):
  - Edge from child to outside subgraph uses external rule; edge between children inside same nested boundary uses internal rule.
- Procedure:
  1) `pnpm dev` (or vite) → start server.
  2) Use MCP Playwright to open canvas, wait for nodes, then evaluate handle counts and edge anchors via DOM/SVG inspection.
  3) If MCP Playwright session is locked, kill existing session before retry (per user note).

## Risks / mitigations
- Missing grid metadata in React Flow layer: ensure layout -> adapter pipe is extended before planner runs.
- Performance: planner should be pure and memoized on `{nodes, edges, gridMeta}`; avoid per-render recompute inside `FloatingEdge`.
- Back-compat: default to current behavior when grid data is absent.

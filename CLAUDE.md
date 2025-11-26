# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GraphWeaver-RF** is a React Flow-based diagram visualization framework for interactive diagrams (UML Use Case Diagrams in Phase 1). The system takes semantic graph data (JSON) without coordinates and automatically lays it out using ELK.js, then renders it as interactive React Flow components with custom nodes and edges.

**Key Dependencies:**
- `@xyflow/react` (v12) - Core diagram rendering and interactivity
- `elkjs` - Graph layout engine using layered algorithm
- React 19 + TypeScript
- Tailwind CSS for styling
- Vite for bundling

## Common Development Commands

```bash
npm run dev        # Start development server on http://localhost:5173
npm run build      # TypeScript compilation + Vite build
npm run lint       # Run ESLint on all files
npm run preview    # Preview production build locally
```

## Architecture

The system follows a **layered adapter pattern** that separates data transformation from React Flow rendering:

### 1. **API Layer** (`/src/diagram/api/`)
Public interface components for building diagrams:
- `DiagramLayout` - Wrapper that configures layout algorithm, direction, spacing, hierarchy mode
- `DiagramCanvas` - Main container that renders the interactive canvas
- `DiagramNode` - Builder component for regular nodes (Actor, UseCase)
- `SubgraphNode` - Builder for group/container nodes (System Boundary) with grid layout config
- `DiagramEdge` - Builder component for connections between nodes
- `types.ts` - Type definitions for `DiagramNodeProps`, `SubgraphNodeProps`, `DiagramEdgeProps`, `LayoutConfig`

**Usage Pattern:**
```tsx
<DiagramLayout algorithm="elk" direction="RIGHT" spacing={60}>
  <DiagramCanvas>
    <DiagramNode id="a1" kind="ACTOR" label="User" />
    <SubgraphNode id="sys" label="System" grid={{ columns: 2, spacing: 20 }}>
      <DiagramNode id="uc1" kind="USE_CASE" label="Login" />
    </SubgraphNode>
    <DiagramEdge id="e1" from="a1" to="uc1" kind="ASSOCIATION" />
  </DiagramCanvas>
</DiagramLayout>
```

### 2. **Core Layer** (`/src/diagram/core/`)
Layout computation and graph transformation pipeline:
- `useDiagramLayout.ts` - React hook that orchestrates the layout pipeline (graph → ELK → React Flow format)
- `elkLayoutEngine.ts` - Runs ELK.js with layered algorithm; handles subgraph grid pre-layout, node sizing, spacing
  - Base sizes: ACTOR (140×140), USE_CASE (160×160), SYSTEM_BOUNDARY (240×240)
  - Returns `LayoutResult` with positioned nodes and subgraph grid metadata
- `rfAdapter.ts` - Adapts ELK output to React Flow nodes/edges format; computes handle attachment points
- `graphModel.ts` - Graph data structure interface
- `handleAnchors.ts` - Calculates floating handle positions based on node side and edge direction

### 3. **Render Layer** (`/src/diagram/render/`)
React Flow component implementations:
- `ReactFlowCanvas.tsx` - Sets up ReactFlowProvider and renders the canvas
- `nodeTypes/`:
  - `NodeModel.tsx` - Generic node wrapper (used by ActorNode, UseCaseNode)
  - `SubgraphNodeModel.tsx` - Group node with dashed border, transparent fill, child extent
  - `ActorNode.tsx`, `UseCaseNode.tsx`, `SystemNode.tsx` - Styled wrappers around NodeModel
- `edgeTypes/`:
  - `FloatingEdge.tsx` - Custom edge that calculates connection points dynamically based on node geometry; supports labels and styling

### 4. **Mock Data & Use Case Setup**
- `/src/diagram/mock/` - Mock Neo4j-style JSON graphs for testing
- `/src/diagram/usecase/` - Use Case diagram specific setup:
  - `UseCaseDiagramCanvas.tsx` - Entry point that loads mock data and configures layout for UML Use Case diagrams

## Key Design Patterns

### Layout Pipeline
1. **Input**: Pure graph data (nodes with `id`, `type`, `label`, `parentId`; edges with `source`, `target`, `type`)
2. **Grid Pre-layout**: SubgraphNode grids are positioned using CSS Grid before sending to ELK (for deterministic child placement)
3. **ELK Layout**: Computes x, y, width, height for all nodes; preserves hierarchy via `INCLUDE_CHILDREN`
4. **Handle Anchors**: For each edge, calculates optimal attachment points on node perimeters
5. **React Flow Adaptation**: Converts to React Flow node/edge format with position, handle data, styling

### Node Type System
- **ACTOR**: Represents external actors; 140×140 box
- **USE_CASE**: Represents system functions; 160×160 ellipse (via border-radius)
- **SYSTEM_BOUNDARY**: Represents system scope; transparent container with dashed border, auto-sizes based on children

### Edge Types
- **ASSOCIATION**: Solid line, default connection
- **INCLUDE**: Dashed line with `<<include>>` label
- **EXTEND**: Dashed line with `<<extend>>` label

## Important Implementation Details

### Configuration (`LayoutConfig`)
- `algorithm`: 'elk' | 'none' - Layout strategy
- `direction`: 'RIGHT' | 'DOWN' - Layered layout direction
- `hierarchy`: 'INCLUDE_CHILDREN' | 'FLAT' - How to handle nested nodes
- `spacing`: number - Gap between nodes
- `padding`: number - Padding inside containers
- `grid`: boolean - Enable grid snapping

### SubgraphNode Grid Config (`SubgraphGridConfig`)
- `columns`: number - Grid columns for child layout
- `rows`: number - Grid rows for child layout
- `spacing`: number - Gap between grid cells
- `justifyContent`: CSS justify-content value - Alignment of grid items

### Handle Attachment Strategy
- **Internal edges** (within subgraph): Use row/column delta to choose attachment side
- **External edges**: Bias based on source/target orientation
- **Floating handles**: Palette of 6-8 positions per side (0.2, 0.35, 0.5, 0.65, 0.8) to avoid overlap

## File Organization Quick Reference

```
/src/diagram/
  /api/              → Public components (DiagramCanvas, DiagramNode, etc.)
  /core/             → Layout logic (useDiagramLayout, elkLayoutEngine, rfAdapter)
  /layout/           → Old grid engine (deprecated, being phased out)
  /render/           → React Flow components (NodeModel, SubgraphNodeModel, FloatingEdge)
  /types/            → Graph type definitions
  /mock/             → Mock data for development
  /usecase/          → Use Case diagram specific setup
/src/layout/         → Standalone grid utilities
```

## Common Tasks

### Adding a New Node Type
1. Create styled component in `/src/diagram/render/nodeTypes/NewNode.tsx`
2. Register in React Flow's `nodeTypes` prop in `ReactFlowCanvas.tsx`
3. Add type constant to `/src/diagram/types/graph.ts` if needed
4. Update ELK base sizes in `elkLayoutEngine.ts`

### Modifying Layout Algorithm
1. Edit `elkLayoutEngine.ts` - update ELK config (layered, direction, spacing, etc.)
2. Adjust node base sizes in `BASE_SIZE`
3. Test with mock data in `useCaseGraph.ts` or `useCaseGraphDense.ts`

### Debugging Layout Issues
- Check `LayoutResult` from ELK: positions, widths, heights
- Inspect `subgraphMeta` for grid placements
- Verify handle offsets in `FloatingEdge` render
- Use browser DevTools to inspect React Flow DOM (nodes have `data-id` attributes)

### Adding New Edge Styling
1. Add edge kind constant to `/src/diagram/types/graph.ts`
2. Update `FloatingEdge.tsx` styling logic based on edge `data.kind`
3. Update mock data to use new edge type

## Testing the System

Use the mock data runners:
```bash
npm run dev
# Open http://localhost:5173
# You'll see UseCaseDiagramCanvas rendering mock UML Use Case diagram
```

To swap or add mock graphs, edit files in `/src/diagram/mock/` and import in `UseCaseDiagramCanvas.tsx`.

## Notes for Future Development

- **Backend Integration**: Currently uses mock data. Swap `useMockGraphData` in `UseCaseDiagramCanvas.tsx` with actual Neo4j API calls
- **New Diagram Types**: Create parallel structure in `/src/diagram/` (e.g., `/src/diagram/c4model/`) following same pattern
- **Performance**: ELK layout runs async; large graphs (>500 nodes) may need Web Worker offloading
- **Styling**: Node colors currently orange for debugging; update in respective Node components

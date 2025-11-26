# Dimantic Frontend (GraphWeaver-RF)

## Project Overview
**GraphWeaver-RF** is a frontend framework designed to render interactive diagrams from semantic graph data. The current phase (Phase 1) focuses on **UML Use Case Diagrams**.

The core philosophy is an **Adapter Pattern**:
1.  **Input:** Semantic Graph Data (JSON nodes/edges without visual coordinates).
2.  **Processing:** An Auto-Layout Middleware (using **ELK.js**) calculates positions and routing.
3.  **Output:** **React Flow** renders the interactive diagram.

## Technology Stack
*   **Runtime/Bundler:** Node.js, Vite 7
*   **Framework:** React 19, TypeScript 5
*   **Core Libraries:**
    *   `@xyflow/react` (v12): Diagram rendering engine.
    *   `elkjs`: Layered graph layout algorithm.
    *   `tailwindcss` (v4): Utility-first styling.

## Architecture

The codebase is structured into distinct layers to separate logic from presentation:

### 1. API Layer (`src/diagram/api/`)
Public components for consuming the framework.
*   `DiagramLayout`: Wraps the canvas and handles layout configuration (algorithm, direction).
*   `DiagramCanvas`: The main drawing area.
*   `DiagramNode` / `SubgraphNode`: Builders for defining graph content.

### 2. Core Layer (`src/diagram/core/`)
The "Brain" of the system.
*   `elkLayoutEngine.ts`: Configures ELK.js to calculate node positions (`x`, `y`, `width`, `height`). Handles hierarchical layout (nested nodes).
*   `rfAdapter.ts`: Transforms ELK output into React Flow's `nodes` and `edges` format.
*   `useDiagramLayout.ts`: The main hook orchestration the data flow.

### 3. Render Layer (`src/diagram/render/`)
React Flow specific implementations.
*   **Nodes:** `ActorNode`, `UseCaseNode`, `SystemNode` (Subgraph).
*   **Edges:** `FloatingEdge` (Dynamic connection points based on geometry).

### 4. Use Case Implementation (`src/diagram/usecase/`)
Specific configuration for UML Use Case diagrams, including mock data and specialized components.

## Key Directories

```
src/
├── diagram/
│   ├── api/           # Public components (DiagramLayout, DiagramCanvas)
│   ├── core/          # Layout logic (ELK adapter, Layout hooks)
│   ├── render/        # React Flow components (Nodes, Edges)
│   ├── usecase/       # Specific UML Use Case implementation
│   └── types/         # Shared type definitions
├── styles/            # Global styles and theme definitions
└── App.tsx            # Main application entry point
```

## Development Workflow

### Scripts
*   **Start Dev Server:** `npm run dev` (Runs on `http://localhost:5173`)
*   **Build:** `npm run build` (TSC + Vite build)
*   **Lint:** `npm run lint`
*   **Preview:** `npm run preview`

### Conventions
*   **Styling:** Use Tailwind CSS. Avoid inline styles where possible.
*   **State Management:** mostly local state or React Flow's internal state.
*   **Layout:** All layout logic belongs in `core/elkLayoutEngine.ts`. Do not hardcode positions in components.
*   **Types:** Strict TypeScript usage. Shared types are in `src/diagram/types/`.

## Current Features (Phase 1)
*   **Nodes:** Actor (User icon), Use Case (Oval), System Boundary (Container).
*   **Edges:** Association (Solid), Include/Extend (Dashed with labels).
*   **Layout:** Automatic layered layout (Left-to-Right) using ELK.
*   **Interactivity:** Pan, Zoom, Drag (Nodes), Select.

# useReactFlow (v12)

Access the live React Flow instance (viewport + graph mutations). Only works inside `ReactFlowProvider`.

```tsx
import { useCallback } from 'react'
import { useReactFlow, type Node, type Edge } from '@xyflow/react'

export function FitOnLoad() {
  const { fitView, getNodes, setEdges } = useReactFlow<Node, Edge>()

  const onReady = useCallback(() => {
    fitView({ padding: 0.2, includeHiddenNodes: true })
    setEdges((eds) =>
      eds.map((e) => ({ ...e, animated: e.animated ?? true })),
    )
  }, [fitView, setEdges])

  return <button onClick={onReady}>Fit</button>
}
```

Notes
- Imperative APIs: `fitView`, `fitBounds`, `zoomIn/out`, `setCenter`, `screenToFlowPosition`, `setNodes`, `setEdges`, `getInternalNode`, etc.
- When used inside `ReactFlow` children, the instance is available immediately; outside, wait for `onInit`.
- `setNodes`/`setEdges` accept updaters for safe concurrent updates.

Compatibility
- v12 keeps the hook signature. Avoid deprecated `project()` (use `screenToFlowPosition`).

Do
- Type the hook (`useReactFlow<NodeType, EdgeType>()`) to keep store helpers typed.
- Use `fitView` with `{ includeHiddenNodes: true }` if you rely on hidden/group nodes.

Don’t
- Don’t call inside conditionals; hooks must be unconditional.
- Don’t mutate nodes/edges returned by `getNodes`/`getEdges`; treat them as read-only snapshots.

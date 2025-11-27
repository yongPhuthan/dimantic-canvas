# ReactFlow (v12)

**Purpose:** Main canvas component. Must be rendered inside `ReactFlowProvider`.

```tsx
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'

const initialNodes: Node[] = [{ id: 'a', position: { x: 0, y: 0 }, data: { label: 'A' } }]
const initialEdges: Edge[] = []

export function Diagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={{}}
      edgeTypes={{}}
      fitView
      fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
      panOnScroll
      zoomOnScroll
      proOptions={{ hideAttribution: true }}
    />
  )
}
```

Notes
- Provide stable `nodes`/`edges` arrays; use `useNodesState`/`useEdgesState` helpers to emit change handlers.
- `fitView` auto-runs on mount; use `fitViewOptions` for padding/hidden nodes.
- `nodeTypes`/`edgeTypes` must be stable objects (memoize if computed).
- When passing `onInit`, call imperative APIs (e.g., `fitView`) after mount.

Compatibility
- v12 uses `ReactFlowProvider` wrapper for hooks; older `ReactFlowProvider` names remain the same.
- `proOptions.hideAttribution` replaces legacy `proOptions={{ account: 'paid' }}`.

Do
- Wrap this component with `ReactFlowProvider`.
- Keep `onNodesChange`/`onEdgesChange` connected to state helpers.
- Pass `className`/`style` to size the container; the `<ReactFlow />` itself is absolutely positioned.

Don’t
- Don’t mutate `nodes`/`edges` in-place; always set new arrays.
- Don’t call `fitView` before the instance is available (use `onInit` or `useReactFlow` after mount).

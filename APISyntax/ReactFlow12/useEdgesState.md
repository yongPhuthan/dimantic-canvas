# useEdgesState (v12)

State helper for `edges`. Returns `[edges, setEdges, onEdgesChange]`.

```tsx
import { useEdgesState, type Edge } from '@xyflow/react'

const initialEdges: Edge[] = []

export function EdgesStore({ nodes, onNodesChange }: { nodes: Edge[] }) {
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
    />
  )
}
```

Notes
- `onEdgesChange` already handles add/remove/update coming from built-in interactions.
- Use `setEdges((eds) => addEdge(params, eds))` to append connections.

Compatibility
- v12 signature unchanged.

Do
- Keep `edges` array controlled; pass `edgeTypes` when using custom edges.

Don’t
- Don’t rely on deprecated `updateEdge`; use `setEdges` updaters instead.​

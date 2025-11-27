# useNodesState (v12)

State helper for `nodes`. Returns `[nodes, setNodes, onNodesChange]`.

```tsx
import { useNodesState, applyNodeChanges, type Node } from '@xyflow/react'

const initialNodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Node' } }]

export function NodesStore() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={(changes) => setNodes((nds) => applyNodeChanges(changes, nds))}
      /* ... */
    />
  )
}
```

Notes
- `onNodesChange` already applies `applyNodeChanges`; you can pass it directly or wrap to inject extra logic.
- `setNodes` supports functional updates.

Compatibility
- v12 keeps signature; change set `onNodesChange` shape aligns with `NodeChange[]`.

Do
- Initialize with an array (even empty). Keep reference stable where possible.

Don’t
- Don’t mutate nodes in place before setting; always return new arrays.

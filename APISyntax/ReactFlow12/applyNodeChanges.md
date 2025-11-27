# applyNodeChanges (v12)

Utility to apply `NodeChange[]` emitted by React Flow to your controlled `nodes` array.

```tsx
import { applyNodeChanges, type NodeChange, type Node } from '@xyflow/react'

function onNodesChange(changes: NodeChange[], setNodes: (updater: (nds: Node[]) => Node[]) => void) {
  setNodes((nds) => applyNodeChanges(changes, nds))
}
```

Notes
- Changes include move, select, remove, add. Always run against the latest state via a functional updater.
- Pair with `useNodesState` for the standard pattern (`const [nodes, setNodes, onNodesChange] = useNodesState(...)`).

Compatibility
- v12 keeps the function; `changes` shape matches hooks’ `NodeChange`.

Do
- Use inside your `onNodesChange` handler; it is safe to memoize.

Don’t
- Don’t ignore the return value; it’s the new nodes array you should render.​

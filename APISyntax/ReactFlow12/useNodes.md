# useNodes (v12)

Reads the current `nodes` array from the store.

```tsx
import { useNodes, type Node } from '@xyflow/react'

export function NodeCountBadge() {
  const nodes = useNodes<Node>()
  return <span>{nodes.length} nodes</span>
}
```

Notes
- Returns a new array reference when store changes; safe to read in render.
- Read-only; mutate via `setNodes`/`useReactFlow`.

Compatibility
- v12 hook signature unchanged.

Do
- Use to derive UI state (counts, lookup maps).

Don’t
- Don’t mutate the returned array; treat as immutable snapshot.​

# useUpdateNodeInternals (v12)

Forces React Flow to re-measure a node (width/height/handles) after dynamic changes.

```tsx
import { useEffect } from 'react'
import { useUpdateNodeInternals, type NodeProps } from '@xyflow/react'

export function DynamicHandlesNode({ id, data }: NodeProps) {
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, data.handles, updateNodeInternals])

  return <div>{data.label}</div>
}
```

Notes
- Call when you add/remove/move handles or change node size via external layout.
- Accepts a single node id; call once per node that changed.

Compatibility
- v12 signature unchanged.

Do
- Debounce if many rapid changes to avoid measuring thrash.

Don’t
- Don’t call every render unnecessarily; it triggers layout work.​

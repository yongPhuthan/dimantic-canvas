# Handle (v12)

Defines connection points on custom nodes.

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'

export function MultiHandleNode({ data }: NodeProps) {
  return (
    <div className="node">
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} id="main" />
      <Handle type="source" position={Position.Bottom} id="secondary" style={{ left: '70%' }} />
    </div>
  )
}
```

Notes
- Props: `type` (`'source' | 'target'`), `position` (`Position.Top/Right/Bottom/Left`), optional `id`, `isConnectable`, `onConnect`, `onDisconnect`, `style`, `className`.
- For multiple handles on one side, set unique `id` and position via CSS (`style.left/top`).

Compatibility
- v12 keeps `Handle` signature; `onConnect` receives connection(s) data.

Do
- Keep hit targets visible or add padding to increase click area.
- Pair with `useUpdateNodeInternals` after dynamic handle changes.

Don’t
- Don’t omit `id` when you need distinct edges per handle; defaults merge to a single port.​

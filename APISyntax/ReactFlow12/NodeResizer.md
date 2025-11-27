# NodeResizer (v12)

Adds drag handles to resize a node. Typically used inside a custom node component.

```tsx
import { NodeResizer, Position, Handle, type NodeProps } from '@xyflow/react'

export function ResizableNode({ data }: NodeProps) {
  return (
    <div className="relative rounded border bg-white p-4">
      <NodeResizer
        minWidth={120}
        minHeight={80}
        maxWidth={480}
        maxHeight={360}
        color="hsl(var(--primary))"
        isVisible
      />
      <div className="font-semibold">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

Notes
- Props: `isVisible`, `minWidth/minHeight`, `maxWidth/maxHeight`, `color`, `handleStyle`, `onResizeStart/onResize/onResizeEnd`.
- Updates the node’s `width/height` in the store; re-run `useUpdateNodeInternals` if handles depend on size.

Compatibility
- v12 `NodeResizer` lives in `@xyflow/react`; the prop names mirror v11.

Do
- Gate `isVisible` to show only on selection (`isVisible={selected}`) to reduce clutter.

Don’t
- Don’t set `minWidth`/`minHeight` below your content size—handles may overlap text.​

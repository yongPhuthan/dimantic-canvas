# BaseEdge (v12)

Low-level SVG edge renderer used in custom edge components.

```tsx
import { BaseEdge, type EdgeProps, type Edge } from '@xyflow/react'

export function StraightEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd }: EdgeProps<Edge>) {
  const path = `M ${sourceX},${sourceY} L ${targetX},${targetY}`
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      interactionWidth={32}
      style={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 }}
    />
  )
}
```

Notes
- Props: `id`, `path` (SVG path string), `markerEnd/markerStart`, `style`, `className`, `interactionWidth`, `pathProps`.
- Handles hit-testing; you supply the path and markers.

Compatibility
- v12 `BaseEdge` replaces older `SimpleBezierEdge` shortcuts when you need full control.

Do
- Keep `interactionWidth` > stroke width for clickability.

Don’t
- Don’t forget a unique `id`; it ties events/selection to the edge.​

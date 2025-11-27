# MarkerType (v12)

Enum for edge marker definitions (arrowheads, etc.).

```tsx
import { MarkerType, type Edge } from '@xyflow/react'

const edges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'hsl(var(--muted-foreground))' },
  },
]
```

Notes
- Common values: `Arrow`, `ArrowClosed`. Customize `color`, `width`, `height`, `orient`, `markerUnits`.
- For dynamic orientation in custom edges, create per-edge `<marker>` ids and set `markerEnd` to the `url(#id)` string.

Compatibility
- v12 uses `MarkerType` constants; legacy `MarkerType.ArrowClosed` still valid.

Do
- Prefer consistent marker sizes with stroke color to avoid mismatched edges.

Don’t
- Don’t mix `markerEnd="url(#...)"` strings with `MarkerType` objects on the same edge; pick one style.​

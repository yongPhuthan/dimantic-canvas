# getSmoothStepPath (v12)

Utility that returns a smooth step SVG path plus label coordinates.

```tsx
import { getSmoothStepPath, Position } from '@xyflow/react'

const [path, labelX, labelY] = getSmoothStepPath({
  sourceX: 100,
  sourceY: 50,
  sourcePosition: Position.Right,
  targetX: 300,
  targetY: 150,
  targetPosition: Position.Left,
  borderRadius: 8, // optional
})
```

Notes
- Params: `{ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius?, centerX?, centerY?, offset? }`.
- Returns `[path, labelX, labelY, offsetX?, offsetY?]`.
- Ideal for orthogonal-looking edges without hard 90° corners.

Compatibility
- v12 utility lives in `@xyflow/react` (and `@xyflow/system`); signature unchanged.

Do
- Use `Position` enums for positions; mix with `BaseEdge` for full control.

Don’t
- Don’t pass missing positions; they’re required to compute correct bends.​

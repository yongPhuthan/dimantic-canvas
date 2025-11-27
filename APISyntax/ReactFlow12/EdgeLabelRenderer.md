# EdgeLabelRenderer (v12)

Portal that renders edge labels in screen space while following the edge position.

```tsx
import { EdgeLabelRenderer, type EdgeProps, type Edge } from '@xyflow/react'

export function LabeledEdge({ label, labelX, labelY }: EdgeProps<Edge>) {
  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          pointerEvents: 'all',
          background: 'white',
          padding: '4px 8px',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
        }}
      >
        {label}
      </div>
    </EdgeLabelRenderer>
  )
}
```

Notes
- Use `labelX`/`labelY` (from `getSmoothStepPath`/`getBezierPath`) to position.
- Children must be absolutely positioned; the renderer manages a fixed overlay container.

Compatibility
- v12 unchanged; supersedes legacy `EdgeText`.

Do
- Set `pointerEvents: 'all'` if label needs clicks; default container has `none`.

Don’t
- Don’t render large, unbounded elements; it overlays the entire canvas.​

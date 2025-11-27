# Panel (v12)

Floating UI container anchored to a corner of the canvas.

```tsx
import { Panel } from '@xyflow/react'

<ReactFlow /* ... */>
  <Panel position="top-left" className="rounded bg-card px-3 py-2 text-xs shadow-card">
    <div className="font-semibold">Use Case Diagram</div>
  </Panel>
</ReactFlow>
```

Notes
- `position`: `'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`.
- Accepts `style`/`className`; renders within the canvas overlay (not affected by zoom/pan).

Compatibility
- v12 unchanged.

Do
- Use for status, legends, or toolbars that should stay fixed on screen.

Don’t
- Don’t rely on Panel for elements that should move with nodes—those belong in node/edge renderers.​

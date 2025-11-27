# MiniMap (v12)

Overview map synced to the main viewport.

```tsx
import { MiniMap } from '@xyflow/react'

<ReactFlow /* ... */>
  <MiniMap
    pannable
    zoomable
    nodeStrokeColor="hsl(var(--muted-foreground))"
    maskColor="hsl(var(--background) / 0.9)"
    style={{ display: 'none' }} // keep registered but hidden if needed
  />
</ReactFlow>
```

Notes
- Props: `pannable`, `zoomable`, `nodeColor`, `nodeStrokeColor`, `maskColor`, `inversePan`.
- Must render inside `<ReactFlow>` to sync transforms.

Compatibility
- v12 signature unchanged.

Do
- Keep it mounted even when hidden to avoid re-register cost.

Don’t
- Don’t forget to size it via CSS; default is small (75px).​

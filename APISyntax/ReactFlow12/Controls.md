# Controls (v12)

Built-in UI for zoom/pan/fit.

```tsx
import { Controls } from '@xyflow/react'

<ReactFlow /* ... */>
  <Controls showInteractive />
</ReactFlow>
```

Notes
- Props: `showZoom`, `showFitView`, `showInteractive`, `position`, `style`, `className`.
- Works automatically with the current React Flow instance.

Compatibility
- v12 unchanged.

Do
- Use `showInteractive` to toggle pan/zoom when embedding in read-only contexts.

Don’t
- Don’t hide `Controls` and then forget keyboard/mouse shortcuts for accessibility—offer an alternative.​

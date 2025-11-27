# Background (v12)

Renders a grid/dots background behind the canvas.

```tsx
import { Background } from '@xyflow/react'

<ReactFlow /* ... */>
  <Background gap={24} color="hsl(var(--border))" />
</ReactFlow>
```

Notes
- Props: `gap`, `size`, `color`, `variant` (`'lines' | 'dots' | 'cross'`), `style` for custom CSS.
- Render inside `<ReactFlow>` so it shares the viewport transforms.

Compatibility
- `Background` replaced legacy `BackgroundVariant` enum; both still work in v12.

Do
- Keep colors in CSS variables for theme support.

Don’t
- Don’t render outside `ReactFlow`; it won’t sync with zoom/pan.​

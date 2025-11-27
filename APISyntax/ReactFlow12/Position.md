# Position (v12)

Enum for handle/edge attachment sides: `Top`, `Right`, `Bottom`, `Left`.

```tsx
import { Position } from '@xyflow/react'

<Handle type="source" position={Position.Right} />

const isHorizontal = (side: Position) => side === Position.Left || side === Position.Right
```

Notes
- Used by `Handle`, edge utilities, and custom edge routing.
- Combine with layout logic to pick attachment sides dynamically.

Compatibility
- v12 unchanged; avoid string literals (`'left'`) to keep type safety.

Do
- Store in data when you need deterministic routing (e.g., `attachments.source.side = Position.Right`).

Don’t
- Don’t compare to lowercase strings; compare to enum members.​

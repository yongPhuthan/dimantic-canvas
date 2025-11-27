# useStore (v12)

Subscribe to low-level React Flow store slices (Zustand under the hood).

```tsx
import { useStore } from '@xyflow/react'

export function ZoomDisplay() {
  const zoom = useStore((state) => state.transform[2] ?? 1)
  return <span>Zoom: {zoom.toFixed(2)}x</span>
}
```

Notes
- Selector runs on every store change; keep selectors minimal and memo-friendly.
- Use when hooks don’t expose the data you need (e.g., current zoom).

Compatibility
- v12 uses Zustand selectors; signature matches v11+.

Do
- Provide stable selectors to avoid re-renders.

Don’t
- Don’t mutate store state directly; use `useReactFlow` setters.​

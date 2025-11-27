# useStoreApi (v12)

Get imperative access to the React Flow store API (getState/setState).

```tsx
import { useEffect } from 'react'
import { useStoreApi } from '@xyflow/react'

export function LogEdgeCount() {
  const store = useStoreApi()

  useEffect(() => {
    const unsub = store.subscribe(
      (state) => state.edges.length,
      (count) => console.log('Edge count', count),
    )
    return () => unsub()
  }, [store])

  return null
}
```

Notes
- `store.getState()` returns the full RF store; `store.setState` accepts partials but prefer public APIs (`useReactFlow`) for mutations.
- Useful for advanced cases (e.g., reading `rfId`, `edges`, `nodes` outside render).

Compatibility
- v12 API unchanged.

Do
- Always unsubscribe in effects.

Don’t
- Don’t bypass public setters to modify nodes/edges unless you fully control side effects.​

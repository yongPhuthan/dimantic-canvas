# ReactFlowProvider (v12)

Wraps any component tree that calls React Flow hooks (`useReactFlow`, `useNodesState`, etc.).

```tsx
import { ReactFlowProvider } from '@xyflow/react'
import { Diagram } from './Diagram'

export function DiagramShell() {
  return (
    <ReactFlowProvider>
      <Diagram />
    </ReactFlowProvider>
  )
}
```

Notes
- One provider per canvas. Do not nest providers around individual nodes.
- Hooks that read the store must be rendered inside this provider.

Compatibility
- Required since v11+. No API changes in v12; still named `ReactFlowProvider`.

Do
- Place global UI (panels, sidebars) inside the provider if they need access to `useReactFlow`.

Don’t
- Don’t render multiple providers around the same `<ReactFlow />`; it creates separate stores.​

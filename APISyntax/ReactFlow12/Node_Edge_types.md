# Node & Edge types (v12)

Generics that define shape of nodes/edges passed to React Flow.

```ts
import type { Node, Edge } from '@xyflow/react'

type UseCaseNodeData = { label: string; handleLayout?: unknown }
type UseCaseNodeKind = 'ACTOR' | 'USE_CASE' | 'SYSTEM_BOUNDARY'

export type UseCaseReactFlowNode = Node<UseCaseNodeData, UseCaseNodeKind>

type UseCaseEdgeData = { label?: string; kind?: 'ASSOCIATION' | 'INCLUDE' | 'EXTEND' }
type UseCaseEdgeKind = 'floating'

export type UseCaseReactFlowEdge = Edge<UseCaseEdgeData, UseCaseEdgeKind>
```

Notes
- `Node<Data = any, Type = string>` has `id`, `position`, optional `width/height`, `parentId`, `extent`, `style`, `className`, `data`, `type`.
- `Edge<Data = any, Type = string>` has `id`, `source`, `target`, optional `sourceHandle/targetHandle`, `type`, `data`, `markerEnd`, `style`.
- Keep `type` narrow to validate `nodeTypes`/`edgeTypes` maps.

Compatibility
- v12 type signatures unchanged; prefer importing from `@xyflow/react` (not `reactflow` legacy).

Do
- Export shared aliases for the project to keep hook generics consistent (`useReactFlow<NodeType, EdgeType>()`).

Don’t
- Don’t mix incompatible `type` strings with `nodeTypes`/`edgeTypes`; React Flow won’t render unknown types.​

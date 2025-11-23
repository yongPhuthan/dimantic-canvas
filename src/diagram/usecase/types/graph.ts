import type { Edge, Node } from '@xyflow/react'

export const USE_CASE_NODE_TYPE = {
  ACTOR: 'ACTOR',
  USE_CASE: 'USE_CASE',
  SYSTEM_BOUNDARY: 'SYSTEM_BOUNDARY',
} as const

export type UseCaseNodeKind =
  (typeof USE_CASE_NODE_TYPE)[keyof typeof USE_CASE_NODE_TYPE]

export const USE_CASE_EDGE_TYPE = {
  ASSOCIATION: 'ASSOCIATION',
  INCLUDE: 'INCLUDE',
  EXTEND: 'EXTEND',
} as const

export type UseCaseEdgeKind =
  (typeof USE_CASE_EDGE_TYPE)[keyof typeof USE_CASE_EDGE_TYPE]

export interface RawGraphNode {
  id: string
  label: string
  type: UseCaseNodeKind
  parentId?: string
}

export interface RawGraphEdge {
  id: string
  source: string
  target: string
  type: UseCaseEdgeKind
}

export interface RawUseCaseGraph {
  nodes: RawGraphNode[]
  edges: RawGraphEdge[]
}

export interface UseCaseNodeData extends Record<string, unknown> {
  label: string
  kind: UseCaseNodeKind
  icon?: string
  accentColor?: string
  handleLayout?: {
    top: { source: number; target: number }
    right: { source: number; target: number }
    bottom: { source: number; target: number }
    left: { source: number; target: number }
  }
}

export interface UseCaseEdgeData extends Record<string, unknown> {
  label?: string
  kind: UseCaseEdgeKind
}

export type UseCaseReactFlowNode = Node<UseCaseNodeData, UseCaseNodeKind>
export type UseCaseReactFlowEdge = Edge<UseCaseEdgeData, UseCaseEdgeKind>

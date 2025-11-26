import type { Edge, Node, Position } from '@xyflow/react'

export const USE_CASE_NODE_TYPE = {
  ACTOR: 'ACTOR',
  USE_CASE: 'USE_CASE',
  SYSTEM_BOUNDARY: 'SYSTEM_BOUNDARY',
  MEDIA: 'MEDIA',
} as const

export type UseCaseNodeKind =
  (typeof USE_CASE_NODE_TYPE)[keyof typeof USE_CASE_NODE_TYPE]

export type NodeProperty = { key: string; value: string }
export type NodeMedia = { src?: string; alt?: string; icon?: string }

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
  width?: number
  height?: number
  icon?: string
  media?: NodeMedia
  properties?: NodeProperty[]
}

export interface RawGraphEdge {
  id: string
  source: string
  target: string
  type: UseCaseEdgeKind
  label?: string
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
  media?: NodeMedia
  properties?: NodeProperty[]
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
  attachments?: {
    classification: 'internal' | 'external'
    source: { side: Position; handleId?: string; offset?: number }
    target: { side: Position; handleId?: string; offset?: number }
  }
}

export type UseCaseReactFlowNode = Node<UseCaseNodeData, UseCaseNodeKind>
export type UseCaseReactFlowEdge = Edge<UseCaseEdgeData, UseCaseEdgeKind | 'floating'>

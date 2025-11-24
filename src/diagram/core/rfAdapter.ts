import { MarkerType, type Edge, type Node } from '@xyflow/react'

import { EdgeModel } from '../render/edgeTypes/FloatingEdge'
import { ActorNode } from '../render/nodeTypes/ActorNode'
import { SystemNode } from '../render/nodeTypes/SystemNode'
import { UseCaseNode } from '../render/nodeTypes/UseCaseNode'
import { USE_CASE_EDGE_TYPE, USE_CASE_NODE_TYPE, type RawGraphEdge, type RawGraphNode, type UseCaseEdgeData, type UseCaseNodeData, type UseCaseReactFlowEdge, type UseCaseReactFlowNode } from '../types/graph'
import type { LayoutResult } from '../layout/elkLayoutEngine'

const nodeTypes = {
  [USE_CASE_NODE_TYPE.ACTOR]: ActorNode,
  [USE_CASE_NODE_TYPE.USE_CASE]: UseCaseNode,
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: SystemNode,
}

const edgeTypes = { floating: EdgeModel }

const defaultHandles: Record<RawGraphNode['type'], UseCaseNodeData['handleLayout']> = {
  [USE_CASE_NODE_TYPE.ACTOR]: {
    top: { source: 0, target: 1 },
    right: { source: 2, target: 0 },
    bottom: { source: 0, target: 1 },
    left: { source: 1, target: 0 },
  },
  [USE_CASE_NODE_TYPE.USE_CASE]: {
    top: { source: 1, target: 1 },
    right: { source: 2, target: 1 },
    bottom: { source: 1, target: 1 },
    left: { source: 2, target: 1 },
  },
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: {
    top: { source: 2, target: 2 },
    right: { source: 2, target: 2 },
    bottom: { source: 2, target: 2 },
    left: { source: 2, target: 2 },
  },
}

const edgeStyles: Record<RawGraphEdge['type'], Edge<UseCaseEdgeData>['style']> = {
  [USE_CASE_EDGE_TYPE.ASSOCIATION]: { stroke: '#cbd5e1', strokeWidth: 2 },
  [USE_CASE_EDGE_TYPE.INCLUDE]: { stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '6 6' },
  [USE_CASE_EDGE_TYPE.EXTEND]: { stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '6 6' },
}

const edgeLabels: Partial<Record<RawGraphEdge['type'], string>> = {
  [USE_CASE_EDGE_TYPE.INCLUDE]: '<<include>>',
  [USE_CASE_EDGE_TYPE.EXTEND]: '<<extend>>',
}

const accentByKind: Record<RawGraphNode['type'], string> = {
  [USE_CASE_NODE_TYPE.ACTOR]: '#22c55e',
  [USE_CASE_NODE_TYPE.USE_CASE]: '#38bdf8',
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: '#cbd5e1',
}

export const diagramNodeTypes = nodeTypes
export const diagramEdgeTypes = edgeTypes

export function adaptLayoutToReactFlow(layout: LayoutResult): {
  nodes: UseCaseReactFlowNode[]
  edges: UseCaseReactFlowEdge[]
} {
  const nodes: UseCaseReactFlowNode[] = layout.nodes.map((node) => {
    const base: Node<UseCaseNodeData> = {
      id: node.id,
      type: node.type,
      position: { x: node.x, y: node.y },
      parentId: node.parentId,
      width: node.width,
      height: node.height,
      draggable: true,
      data: {
        label: node.label,
        kind: node.type,
        accentColor: accentByKind[node.type] ?? '#38bdf8',
        handleLayout: defaultHandles[node.type],
      },
      style: node.type === USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY ? { zIndex: 0 } : { zIndex: 10 },
      ...(node.parentId ? { extent: 'parent' as const } : {}),
    }
    return base
  })

  const edges: UseCaseReactFlowEdge[] = layout.edges.map((edge) => {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'floating',
      data: {
        kind: edge.type,
        ...(edge.label ? { label: edge.label } : edgeLabels[edge.type] ? { label: edgeLabels[edge.type] } : {}),
      },
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#cbd5e1' },
      style: edgeStyles[edge.type],
    }
  })

  return { nodes, edges }
}

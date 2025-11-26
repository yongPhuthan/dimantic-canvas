import { MarkerType, Position, type Edge } from '@xyflow/react'

import { EdgeModel } from '../render/edgeTypes/FloatingEdge'
import { ActorNode } from '../render/nodeTypes/ActorNode'
import { SystemNode } from '../render/nodeTypes/SystemNode'
import { UseCaseNode } from '../render/nodeTypes/UseCaseNode'
import { anchorId, anchorOffsets } from './handleAnchors'
import { USE_CASE_EDGE_TYPE, USE_CASE_NODE_TYPE, type RawGraphEdge, type RawGraphNode, type UseCaseEdgeData, type UseCaseNodeData, type UseCaseReactFlowEdge, type UseCaseReactFlowNode } from '../types/graph'
import type { LayoutResult } from '../layout/elkLayoutEngine'

const nodeTypes = {
  [USE_CASE_NODE_TYPE.ACTOR]: ActorNode,
  [USE_CASE_NODE_TYPE.USE_CASE]: UseCaseNode,
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: SystemNode,
}

const edgeTypes = { floating: EdgeModel }

const defaultHandles: Record<RawGraphNode['type'], NonNullable<UseCaseNodeData['handleLayout']>> = {
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
  [USE_CASE_EDGE_TYPE.ASSOCIATION]: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
  [USE_CASE_EDGE_TYPE.INCLUDE]: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, strokeDasharray: '6 6' },
  [USE_CASE_EDGE_TYPE.EXTEND]: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, strokeDasharray: '6 6' },
}

const edgeLabels: Partial<Record<RawGraphEdge['type'], string>> = {
  [USE_CASE_EDGE_TYPE.INCLUDE]: '<<include>>',
  [USE_CASE_EDGE_TYPE.EXTEND]: '<<extend>>',
}

const accentByKind: Record<RawGraphNode['type'], string> = {
  [USE_CASE_NODE_TYPE.ACTOR]: 'hsl(var(--accent))',
  [USE_CASE_NODE_TYPE.USE_CASE]: 'hsl(var(--primary))',
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: 'hsl(var(--border))',
}

export const diagramNodeTypes = nodeTypes
export const diagramEdgeTypes = edgeTypes

export function adaptLayoutToReactFlow(layout: LayoutResult): {
  nodes: UseCaseReactFlowNode[]
  edges: UseCaseReactFlowEdge[]
} {
  const nodeMap = new Map(layout.nodes.map((n) => [n.id, n]))
  const parentMap = new Map(layout.nodes.map((n) => [n.id, n.parentId ?? null]))
  const typeMap = new Map(layout.nodes.map((n) => [n.id, n.type]))

  const hostCache = new Map<string, string | null>()
  const getHostSubgraph = (nodeId: string): string | null => {
    if (hostCache.has(nodeId)) return hostCache.get(nodeId)!
    let current: string | null = nodeId
    while (current) {
      const type = typeMap.get(current)
      if (type === USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY) {
        hostCache.set(nodeId, current)
        return current
      }
      current = parentMap.get(current) ?? null
    }
    hostCache.set(nodeId, null)
    return null
  }

  const orientationBySubgraph = new Map<string, 'horizontal' | 'vertical'>()
  Object.entries(layout.subgraphMeta).forEach(([id, meta]) => {
    const orientation = (meta.columns ?? 1) >= (meta.rows ?? 1) ? 'horizontal' : 'vertical'
    orientationBySubgraph.set(id, orientation)
  })

  const placementsByChild = new Map<string, { parentId: string; row: number; column: number; columns: number; rows: number }>()
  Object.entries(layout.subgraphMeta).forEach(([parentId, meta]) => {
    meta.placements.forEach((placement) => {
      placementsByChild.set(placement.childId, {
        parentId,
        row: placement.row,
        column: placement.column,
        columns: meta.columns,
        rows: meta.rows,
      })
    })
  })

  const getPlacement = (nodeId: string) => placementsByChild.get(nodeId)

  const absCache = new Map<string, { x: number; y: number; width: number; height: number }>()
  const getAbsoluteBox = (nodeId: string) => {
    if (absCache.has(nodeId)) return absCache.get(nodeId)!
    const node = nodeMap.get(nodeId)
    if (!node) return { x: 0, y: 0, width: 0, height: 0 }
    let x = node.x
    let y = node.y
    let parent = node.parentId
    while (parent) {
      const parentNode = nodeMap.get(parent)
      if (!parentNode) break
      x += parentNode.x
      y += parentNode.y
      parent = parentNode.parentId
    }
    const box = { x, y, width: node.width ?? 0, height: node.height ?? 0 }
    absCache.set(nodeId, box)
    return box
  }

  const getCenter = (nodeId: string) => {
    const box = getAbsoluteBox(nodeId)
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }

  const pickInternalSides = (sourceId: string, targetId: string) => {
    const placementSource = getPlacement(sourceId)
    const placementTarget = getPlacement(targetId)
    if (placementSource && placementTarget && placementSource.parentId === placementTarget.parentId) {
      const dRow = placementTarget.row - placementSource.row
      const dCol = placementTarget.column - placementSource.column
      const sameRow = dRow === 0
      if (sameRow) {
        const rightward = dCol >= 0
        return {
          source: rightward ? Position.Right : Position.Left,
          target: rightward ? Position.Left : Position.Right,
        }
      }
      // different rows: default vertical flow bottom -> top
      const downward = dRow >= 0
      return {
        source: downward ? Position.Bottom : Position.Top,
        target: downward ? Position.Top : Position.Bottom,
      }
    }

    const host = getHostSubgraph(sourceId)
    const orientation = host ? orientationBySubgraph.get(host) : undefined
    const sourceCenter = getCenter(sourceId)
    const targetCenter = getCenter(targetId)
    const dx = targetCenter.x - sourceCenter.x
    const dy = targetCenter.y - sourceCenter.y
    const direction = orientation ?? (Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical')
    if (direction === 'horizontal') {
      const rightward = dx >= 0
      return {
        source: rightward ? Position.Right : Position.Left,
        target: rightward ? Position.Left : Position.Right,
      }
    }
    const downward = dy >= 0
    return {
      source: downward ? Position.Bottom : Position.Top,
      target: downward ? Position.Top : Position.Bottom,
    }
  }

  const pickExternalSide = (nodeId: string, otherId: string) => {
    const host = getHostSubgraph(nodeId)
    const placement = getPlacement(nodeId)
    const orientation = host ? orientationBySubgraph.get(host) : undefined
    if (placement && orientation === 'horizontal' && placement.rows > 1) {
      const midpoint = (placement.rows - 1) / 2
      return placement.row <= midpoint ? Position.Top : Position.Bottom
    }
    if (placement && orientation === 'vertical' && placement.columns > 1) {
      const midpoint = (placement.columns - 1) / 2
      return placement.column <= midpoint ? Position.Left : Position.Right
    }

    const here = getCenter(nodeId)
    const there = getCenter(otherId)
    const dx = there.x - here.x
    const dy = there.y - here.y
    if (orientation === 'horizontal') {
      const preferVertical = Math.abs(dy) >= Math.abs(dx) * 0.5
      if (preferVertical) return dy >= 0 ? Position.Bottom : Position.Top
      return dx >= 0 ? Position.Right : Position.Left
    }
    if (orientation === 'vertical') {
      const preferHorizontal = Math.abs(dx) >= Math.abs(dy) * 0.5
      if (preferHorizontal) return dx >= 0 ? Position.Right : Position.Left
      return dy >= 0 ? Position.Bottom : Position.Top
    }
    return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? Position.Right : Position.Left) : dy >= 0 ? Position.Bottom : Position.Top
  }

  const emptyHandleLayout = (): HandleLayout => ({
    top: { source: 0, target: 0 },
    right: { source: 0, target: 0 },
    bottom: { source: 0, target: 0 },
    left: { source: 0, target: 0 },
  })

  type HandleLayout = NonNullable<UseCaseNodeData['handleLayout']>

  const plannedHandles = new Map<string, HandleLayout>()
  const buckets = new Map<string, string[]>() // key: nodeId:side:role -> edgeIds
  const attachmentByEdge = new Map<string, UseCaseEdgeData['attachments']>()

  layout.edges.forEach((edge) => {
    const hostSource = getHostSubgraph(edge.source)
    const hostTarget = getHostSubgraph(edge.target)
    const classification: 'internal' | 'external' =
      hostSource && hostSource === hostTarget ? 'internal' : 'external'

    let sourceSide: Position
    let targetSide: Position

    if (classification === 'internal') {
      const internalSides = pickInternalSides(edge.source, edge.target)
      sourceSide = internalSides.source
      targetSide = internalSides.target
    } else {
      sourceSide = pickExternalSide(edge.source, edge.target)
      targetSide = pickExternalSide(edge.target, edge.source)
    }

    const bucketKeySource = `${edge.source}:${sourceSide}:source`
    const bucketKeyTarget = `${edge.target}:${targetSide}:target`
    const listSource = buckets.get(bucketKeySource) ?? []
    listSource.push(edge.id)
    buckets.set(bucketKeySource, listSource)
    const listTarget = buckets.get(bucketKeyTarget) ?? []
    listTarget.push(edge.id)
    buckets.set(bucketKeyTarget, listTarget)

    attachmentByEdge.set(edge.id, {
      classification,
      source: { side: sourceSide },
      target: { side: targetSide },
    })
  })

  buckets.forEach((edgeIds, key) => {
    const [nodeId, sideRaw, role] = key.split(':') as [string, Position, 'source' | 'target']
    const count = edgeIds.length
    const offsets = anchorOffsets(count)
    const entry: HandleLayout = plannedHandles.get(nodeId) ?? emptyHandleLayout()
    switch (sideRaw) {
      case Position.Top:
        entry.top[role] = count
        break
      case Position.Right:
        entry.right[role] = count
        break
      case Position.Bottom:
        entry.bottom[role] = count
        break
      case Position.Left:
      default:
        entry.left[role] = count
        break
    }
    plannedHandles.set(nodeId, entry)

    edgeIds.forEach((edgeId, idx) => {
      const handle = anchorId(sideRaw, role, idx, count)
      const attachment = attachmentByEdge.get(edgeId)
      if (!attachment) return
      if (role === 'source') {
        attachment.source.handleId = handle
        attachment.source.offset = offsets[idx] ?? 0.5
      } else {
        attachment.target.handleId = handle
        attachment.target.offset = offsets[idx] ?? 0.5
      }
      attachmentByEdge.set(edgeId, attachment)
    })
  })

  const resolveHandleLayout = (nodeId: string, kind: RawGraphNode['type']): HandleLayout => {
    const base: HandleLayout = defaultHandles[kind] ?? emptyHandleLayout()
    const planned: HandleLayout = plannedHandles.get(nodeId) ?? emptyHandleLayout()
    return {
      top: {
        source: Math.max(base.top.source, planned.top.source),
        target: Math.max(base.top.target, planned.top.target),
      },
      right: {
        source: Math.max(base.right.source, planned.right.source),
        target: Math.max(base.right.target, planned.right.target),
      },
      bottom: {
        source: Math.max(base.bottom.source, planned.bottom.source),
        target: Math.max(base.bottom.target, planned.bottom.target),
      },
      left: {
        source: Math.max(base.left.source, planned.left.source),
        target: Math.max(base.left.target, planned.left.target),
      },
    }
  }

  const nodes: UseCaseReactFlowNode[] = layout.nodes.map((node) => {
    const base: UseCaseReactFlowNode = {
      id: node.id,
      type: node.type as UseCaseReactFlowNode['type'],
      position: { x: node.x, y: node.y },
      parentId: node.parentId,
      width: node.width,
      height: node.height,
      draggable: true,
      data: {
        label: node.label,
        kind: node.type,
        accentColor: accentByKind[node.type] ?? 'hsl(var(--primary))',
        handleLayout: resolveHandleLayout(node.id, node.type),
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
      type: 'floating' as UseCaseReactFlowEdge['type'],
      data: {
        kind: edge.type,
        ...(attachmentByEdge.get(edge.id) ? { attachments: attachmentByEdge.get(edge.id) } : {}),
        ...(edge.label ? { label: edge.label } : edgeLabels[edge.type] ? { label: edgeLabels[edge.type] } : {}),
      },
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'hsl(var(--muted-foreground))' },
      style: edgeStyles[edge.type],
    }
  })

  return { nodes, edges }
}

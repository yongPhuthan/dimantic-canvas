import type { EdgeProps, InternalNode, XYPosition } from '@xyflow/react'
import {
  BaseEdge,
  Position,
  getSmoothStepPath,
  useNodes,
  useReactFlow,
  useStoreApi,
} from '@xyflow/react'
import { useMemo } from 'react'

import type { UseCaseReactFlowEdge, UseCaseReactFlowNode } from '../../types/graph'

type FlowNodeWithPosition = UseCaseReactFlowNode & { parentId?: string }
type AttachmentRole = 'source' | 'target'

const SPREAD_PADDING = 0.15 // keep anchors away from extreme corners and spread more

function pickPositions(
  sourceCenter: { x: number; y: number },
  targetCenter: { x: number; y: number },
): { sourcePosition: Position; targetPosition: Position } {
  const horizontalFirst =
    Math.abs(targetCenter.x - sourceCenter.x) >= Math.abs(targetCenter.y - sourceCenter.y)

  if (horizontalFirst) {
    const sourcePosition =
      targetCenter.x >= sourceCenter.x ? Position.Right : Position.Left
    const targetPosition =
      targetCenter.x >= sourceCenter.x ? Position.Left : Position.Right
    return { sourcePosition, targetPosition }
  }

  const sourcePosition =
    targetCenter.y >= sourceCenter.y ? Position.Bottom : Position.Top
  const targetPosition =
    targetCenter.y >= sourceCenter.y ? Position.Top : Position.Bottom
  return { sourcePosition, targetPosition }
}

export function EdgeModel({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  selected,
  data,
  style,
  markerStart,
}: EdgeProps<UseCaseReactFlowEdge>) {
  const nodes = useNodes() as FlowNodeWithPosition[]
  const { getInternalNode } = useReactFlow<UseCaseReactFlowNode, UseCaseReactFlowEdge>()
  const store = useStoreApi()
  const rfId = store.getState().rfId ?? 'rf'
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])

  const getAbsolutePosition = (node: FlowNodeWithPosition): XYPosition => {
    let x = node.position.x
    let y = node.position.y
    let parentId = node.parentId
    while (parentId) {
      const parent = nodeMap.get(parentId)
      if (!parent) break
      x += parent.position.x
      y += parent.position.y
      parentId = parent.parentId
    }
    return { x, y }
  }

  const sourceNode = nodes.find((node) => node.id === source)
  const targetNode = nodes.find((node) => node.id === target)

  if (!sourceNode || !targetNode) {
    return null
  }

  const edges = store.getState().edges as UseCaseReactFlowEdge[]

  const getCenter = (node: FlowNodeWithPosition) => {
    const abs = getAbsolutePosition(node)
    return {
      x: abs.x + (node.width ?? 0) / 2,
      y: abs.y + (node.height ?? 0) / 2,
    }
  }

  const sourceCenter = getCenter(sourceNode)
  const targetCenter = getCenter(targetNode)
  const { sourcePosition, targetPosition } = pickPositions(sourceCenter, targetCenter)

  // For each node/side, spread multiple edges along that side to avoid stacking on a single dot.
  type Attachment = {
    edgeId: string
    nodeId: string
    role: AttachmentRole
    side: Position
    axisValue: number
  }

  const offsets = useMemo(() => {
    const list = edges
      .map((edge) => {
        const sNode = nodeMap.get(edge.source)
        const tNode = nodeMap.get(edge.target)
        if (!sNode || !tNode) return null

        const sCenter = getCenter(sNode)
        const tCenter = getCenter(tNode)
        const { sourcePosition: sSide, targetPosition: tSide } = pickPositions(sCenter, tCenter)

        const axisForSide = (side: Position, otherCenter: { x: number; y: number }) =>
          side === Position.Left || side === Position.Right ? otherCenter.y : otherCenter.x

        const sourceAttachment: Attachment = {
          edgeId: edge.id,
          nodeId: edge.source,
          role: 'source',
          side: sSide,
          axisValue: axisForSide(sSide, tCenter),
        }

        const targetAttachment: Attachment = {
          edgeId: edge.id,
          nodeId: edge.target,
          role: 'target',
          side: tSide,
          axisValue: axisForSide(tSide, sCenter),
        }

        return [sourceAttachment, targetAttachment]
      })
      .filter(Boolean)
      .flat() as Attachment[]

    const buckets = new Map<string, Attachment[]>()
    for (const att of list) {
      const key = `${att.nodeId}:${att.side}:${att.role}`
      const arr = buckets.get(key) ?? []
      arr.push(att)
      buckets.set(key, arr)
    }

    const offsets = new Map<string, number>()
    for (const [, bucket] of buckets) {
      bucket.sort((a, b) => a.axisValue - b.axisValue)
      const n = bucket.length
      bucket.forEach((att, index) => {
        const normalized = n === 1 ? 0.5 : (index + 1) / (n + 1)
        const padded = SPREAD_PADDING + normalized * (1 - SPREAD_PADDING * 2)
        offsets.set(`${att.edgeId}:${att.role}`, padded)
      })
    }
    return offsets
  }, [edges, getCenter, nodeMap])

  const sourceOffset = offsets.get(`${id}:source`) ?? 0.5
  const targetOffset = offsets.get(`${id}:target`) ?? 0.5

  type HandleBoundsEntry = {
    x: number
    y: number
    width?: number
    height?: number
    position: Position
    id?: string
  }

  const getHandles = (nodeId: string, role: AttachmentRole): HandleBoundsEntry[] => {
    const internal = getInternalNode?.(nodeId) as InternalNode<UseCaseReactFlowNode> | undefined
    return (internal?.internals as { handleBounds?: Record<'source' | 'target', HandleBoundsEntry[]> } | undefined)
      ?.handleBounds?.[role] ?? []
  }

  const pickHandle = (
    nodeId: string,
    role: AttachmentRole,
    preferredPosition: Position,
    referencePoint: XYPosition,
    handleId?: string,
  ): { point: XYPosition; side: Position } | null => {
    const node = nodeMap.get(nodeId)
    if (!node) return null
    const handles = getHandles(nodeId, role)
    if (handles.length === 0) return null

    const origin = getAbsolutePosition(node)
    const centers = handles.map((h) => ({
      id: h.id,
      side: h.position,
      point: {
        x: origin.x + h.x + (h.width ?? 0) / 2,
        y: origin.y + h.y + (h.height ?? 0) / 2,
      },
    }))

    if (handleId) {
      const matchById = centers.find((c) => c.id === handleId)
      if (matchById) return { point: matchById.point, side: matchById.side }
    }

    const bySide = centers.find((c) => c.side === preferredPosition)
    if (bySide) return { point: bySide.point, side: bySide.side }

    const nearest = centers.reduce((best, current) => {
      const dx = current.point.x - referencePoint.x
      const dy = current.point.y - referencePoint.y
      const dist2 = dx * dx + dy * dy
      if (!best || dist2 < best.dist2) {
        return { entry: current, dist2 }
      }
      return best
    }, null as { entry: { point: XYPosition; side: Position }; dist2: number } | null)

    if (nearest) return { point: nearest.entry.point, side: nearest.entry.side }
    return null
  }

  const anchorPoint = (
    node: FlowNodeWithPosition,
    side: Position,
    offset: number,
  ): XYPosition => {
    const abs = getAbsolutePosition(node)
    const width = node.width ?? 0
    const height = node.height ?? 0

    if (side === Position.Left || side === Position.Right) {
      return { x: side === Position.Left ? abs.x : abs.x + width, y: abs.y + height * offset }
    }
    return { x: abs.x + width * offset, y: side === Position.Top ? abs.y : abs.y + height }
  }

  const sourcePick = pickHandle(source, 'source', sourcePosition, targetCenter, sourceHandleId ?? undefined)
  const targetPick = pickHandle(target, 'target', targetPosition, sourceCenter, targetHandleId ?? undefined)

  const sourceSideUsed = sourcePick?.side ?? sourcePosition
  const targetSideUsed = targetPick?.side ?? targetPosition

  const sourcePoint = sourcePick?.point ?? anchorPoint(sourceNode, sourceSideUsed, sourceOffset)
  const targetPoint = targetPick?.point ?? anchorPoint(targetNode, targetSideUsed, targetOffset)

  const sourceX = sourcePoint.x
  const sourceY = sourcePoint.y
  const targetX = targetPoint.x
  const targetY = targetPoint.y

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourceSideUsed,
    targetX,
    targetY,
    targetPosition: targetSideUsed,
  })

  const strokeColor = (style as { stroke?: string } | undefined)?.stroke ?? '#cbd5e1'

  // Always use a custom marker per edge/side so orientation follows the target side.
  const appliedMarkerEnd = `url(#floating-arrow-${rfId}-${id}-${targetSideUsed})`
  const appliedMarkerStart = typeof markerStart === 'string' ? markerStart : undefined
  const edgeStyle = {
    ...(style ?? {}),
    ...(selected ? { strokeWidth: ((style?.strokeWidth as number | undefined) ?? 2) + 1 } : {}),
  }

  const markerOrientation =
    {
      [Position.Top]: '90', // point down into the node
      [Position.Bottom]: '-90', // point up into the node
      [Position.Left]: '0', // point right into the node
      [Position.Right]: '180', // point left into the node
    }[targetSideUsed] ?? 'auto'

  return (
    <>
      <defs>
        <marker
          id={`floating-arrow-${rfId}-${id}-${targetSideUsed}`}
          markerWidth="14"
          markerHeight="14"
          orient={markerOrientation}
          markerUnits="userSpaceOnUse"
          refX="12"
          refY="7"
        >
          <path d="M 0 0 L 12 7 L 0 14 z" fill={strokeColor} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        style={edgeStyle}
        markerStart={appliedMarkerStart}
        markerEnd={appliedMarkerEnd}
        interactionWidth={28}
        className={selected ? 'stroke-2 drop-shadow-[0_0_0.25rem_rgba(56,189,248,0.7)]' : ''}
      />
    </>
  )
}

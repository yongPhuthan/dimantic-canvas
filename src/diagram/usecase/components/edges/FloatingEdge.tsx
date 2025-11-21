import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getSmoothStepPath,
  useNodes,
  useReactFlow,
  type EdgeProps,
  type Node,
  type XYPosition,
} from '@xyflow/react'

import { USE_CASE_EDGE_TYPE, type UseCaseReactFlowEdge, type UseCaseReactFlowNode } from '../../types/graph'

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

export function FloatingEdge({
  id,
  source,
  target,
  selected,
  data,
  style,
  markerStart,
  markerEnd,
}: EdgeProps<UseCaseReactFlowEdge>) {
  const nodes = useNodes() as Array<Node<UseCaseReactFlowNode> & { positionAbsolute?: XYPosition }>
  const { getNode } = useReactFlow<UseCaseReactFlowNode, UseCaseReactFlowEdge>()

  const withAbsolutePosition = (node: Node<UseCaseReactFlowNode>) => {
    // React Flow populates positionAbsolute but we also walk parents as a fallback for nested groups.
    if (node.positionAbsolute) return node.positionAbsolute

    let x = node.position.x
    let y = node.position.y
    let parent = node.parentId ? getNode(node.parentId) : undefined
    while (parent) {
      x += parent.position.x
      y += parent.position.y
      parent = parent.parentId ? getNode(parent.parentId) : undefined
    }
    return { x, y }
  }

  const sourceNode = nodes.find((node) => node.id === source)
  const targetNode = nodes.find((node) => node.id === target)

  if (!sourceNode || !targetNode) {
    return null
  }

  // Derive attachment sides based on relative positions to avoid ugly overlaps.
  const sourceCenter = {
    x: withAbsolutePosition(sourceNode).x + (sourceNode.width ?? 0) / 2,
    y: withAbsolutePosition(sourceNode).y + (sourceNode.height ?? 0) / 2,
  }
  const targetCenter = {
    x: withAbsolutePosition(targetNode).x + (targetNode.width ?? 0) / 2,
    y: withAbsolutePosition(targetNode).y + (targetNode.height ?? 0) / 2,
  }
  const { sourcePosition, targetPosition } = pickPositions(sourceCenter, targetCenter)

  const sourceX =
    sourcePosition === Position.Left
      ? sourceCenter.x - (sourceNode.width ?? 0) / 2
      : sourcePosition === Position.Right
        ? sourceCenter.x + (sourceNode.width ?? 0) / 2
        : sourceCenter.x

  const targetX =
    targetPosition === Position.Left
      ? targetCenter.x - (targetNode.width ?? 0) / 2
      : targetPosition === Position.Right
        ? targetCenter.x + (targetNode.width ?? 0) / 2
        : targetCenter.x

  const sourceY =
    sourcePosition === Position.Top
      ? sourceCenter.y - (sourceNode.height ?? 0) / 2
      : sourcePosition === Position.Bottom
        ? sourceCenter.y + (sourceNode.height ?? 0) / 2
        : sourceCenter.y

  const targetY =
    targetPosition === Position.Top
      ? targetCenter.y - (targetNode.height ?? 0) / 2
      : targetPosition === Position.Bottom
        ? targetCenter.y + (targetNode.height ?? 0) / 2
        : targetCenter.y

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const strokeColor =
    (style as { stroke?: string } | undefined)?.stroke ??
    (data?.kind === USE_CASE_EDGE_TYPE.INCLUDE
      ? '#38bdf8'
      : data?.kind === USE_CASE_EDGE_TYPE.EXTEND
        ? '#a855f7'
        : '#cbd5e1')

  const appliedMarkerEnd = markerEnd ? { ...markerEnd, color: markerEnd.color ?? strokeColor } : undefined
  const edgeStyle = {
    ...(style ?? {}),
    ...(selected ? { strokeWidth: ((style?.strokeWidth as number | undefined) ?? 2) + 1 } : {}),
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={edgeStyle}
        markerStart={markerStart}
        markerEnd={appliedMarkerEnd}
        interactionWidth={28}
        className={selected ? 'stroke-2 drop-shadow-[0_0_0.25rem_rgba(56,189,248,0.7)]' : ''}
      />
      {data?.label ? (
        <EdgeLabelRenderer>
          {(() => {
            const labelOffset =
              data.kind === USE_CASE_EDGE_TYPE.INCLUDE
                ? { x: -40, y: -12 }
                  : data.kind === USE_CASE_EDGE_TYPE.EXTEND
                  ? { x: 40, y: 12 }
                  : { x: 0, y: 0 }
            return (
              <div
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${labelX + labelOffset.x}px, ${labelY + labelOffset.y}px)`,
                  pointerEvents: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#cbd5e1',
                  backgroundColor: 'rgba(15,23,42,0.9)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                {data.label}
              </div>
            )
          })()}
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

import { MarkerType, type Edge, type Node } from '@xyflow/react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import ELK from 'elkjs/lib/elk.bundled.js'

import {
  USE_CASE_EDGE_TYPE,
  USE_CASE_NODE_TYPE,
  type RawGraphNode,
  type RawUseCaseGraph,
  type UseCaseEdgeKind,
  type UseCaseEdgeData,
  type UseCaseNodeData,
} from '../types/graph'

type UseCaseLayoutResult = {
  nodes: Node<UseCaseNodeData>[]
  edges: Edge<UseCaseEdgeData>[]
}

type ElkLayoutNode = {
  id: string
  x?: number
  y?: number
  width?: number
  height?: number
  children?: ElkLayoutNode[]
  labels?: { text: string }[]
}

type ElkEdgeInput = {
  id: string
  sources: string[]
  targets: string[]
}

type ElkGraphInput = {
  id: string
  layoutOptions: Record<string, string>
  children: ElkLayoutNode[]
  edges: ElkEdgeInput[]
}

type ElkLayoutResult = ElkLayoutNode & { children?: ElkLayoutNode[] }

const DEFAULT_NODE_SIZE = {
  [USE_CASE_NODE_TYPE.ACTOR]: { width: 120, height: 144 },
  [USE_CASE_NODE_TYPE.USE_CASE]: { width: 180, height: 96 },
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: { width: 340, height: 260 },
} as const

const LAYOUT_OPTIONS = {
  // Layered layout keeps actors on the left and flows toward use cases on the right.
  'org.eclipse.elk.algorithm': 'layered',
  'org.eclipse.elk.direction': 'RIGHT',
  // Increase intra-layer spacing to avoid overlaps when labels are long.
  'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': '96',
  'org.eclipse.elk.spacing.nodeNode': '72',
  'org.eclipse.elk.spacing.edgeEdge': '48',
  // Ensure compound (parent/child) nodes grow with children.
  'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  // Add breathing room inside boundaries.
  'org.eclipse.elk.padding': '[24,24,24,24]',
} as const

// Run ELK on the main thread; avoids bundler worker warnings in dev and keeps the mock graph simple.
const elk = new ELK()

const CHAR_WIDTH = 8
const PILL_PADDING = 48
const CHILD_VERTICAL_GAP = 24
const STACK_MARGIN_X = 48
const STACK_MARGIN_Y = 48
const STACK_GAP_VERTICAL = 32
const GRID_GAP_X = 32
const GRID_GAP_Y = 32
const BOUNDARY_MIN_WIDTH = 260
const BOUNDARY_MIN_HEIGHT = 200

function labelBasedWidth(label: string, minWidth: number, maxWidth: number): number {
  const estimated = label.length * CHAR_WIDTH + PILL_PADDING
  return Math.max(minWidth, Math.min(maxWidth, estimated))
}

// Maps ELK layout result into React Flow nodes with parent-relative coordinates.
function flattenElkToReactFlow(
  elkNode: ElkLayoutNode,
  rawNodeMap: Map<string, RawGraphNode>,
  accumulator: Node<UseCaseNodeData>[],
) {
  const raw = rawNodeMap.get(elkNode.id)
  if (!raw) return

  // ELK returns child coordinates relative to their parent, so we forward them directly.
  const x = elkNode.x ?? 0
  const y = elkNode.y ?? 0
  const baseSize = DEFAULT_NODE_SIZE[raw.type]

  accumulator.push({
    id: raw.id,
    type: raw.type,
    parentId: raw.parentId,
    position: { x, y },
    data: { label: raw.label, kind: raw.type },
    draggable: true,
    // Keep children inside their boundary when parentId is set.
    ...(raw.parentId ? { extent: 'parent' as const } : {}),
    width: elkNode.width ?? baseSize.width,
    height: elkNode.height ?? baseSize.height,
  })

  for (const child of elkNode.children ?? []) {
    flattenElkToReactFlow(child, rawNodeMap, accumulator)
  }
}

function layoutChildrenGrid(nodes: Node<UseCaseNodeData>[]) {
  const useCaseDefaults = DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.USE_CASE]

  nodes
    .filter((node) => node.type === USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY)
    .forEach((boundary) => {
      const children = nodes.filter(
        (node) => node.parentId === boundary.id && node.type === USE_CASE_NODE_TYPE.USE_CASE,
      )
      if (children.length === 0) return

      const columns = Math.max(1, Math.min(children.length, Math.ceil(Math.sqrt(children.length))))
      const maxChildWidth = Math.max(...children.map((child) => child.width ?? useCaseDefaults.width))
      const maxChildHeight = Math.max(...children.map((child) => child.height ?? useCaseDefaults.height))
      const cellWidth = maxChildWidth + GRID_GAP_X
      const cellHeight = maxChildHeight + GRID_GAP_Y

      children.forEach((child, index) => {
        const column = index % columns
        const row = Math.floor(index / columns)
        child.position.x = STACK_MARGIN_X + column * cellWidth
        child.position.y = STACK_MARGIN_Y + row * cellHeight
      })

      const gridWidth = columns * cellWidth - GRID_GAP_X
      const rows = Math.ceil(children.length / columns)
      const gridHeight = rows * cellHeight - GRID_GAP_Y

      boundary.width = Math.max(BOUNDARY_MIN_WIDTH, gridWidth + STACK_MARGIN_X * 2)
      boundary.height = Math.max(BOUNDARY_MIN_HEIGHT, gridHeight + STACK_MARGIN_Y * 2)
    })
}

function edgeLabelForType(kind: UseCaseEdgeKind) {
  if (kind === USE_CASE_EDGE_TYPE.INCLUDE) return '<<include>>'
  if (kind === USE_CASE_EDGE_TYPE.EXTEND) return '<<extend>>'
  return ''
}

function edgeStyleForType(kind: UseCaseEdgeKind): CSSProperties {
  if (kind === USE_CASE_EDGE_TYPE.ASSOCIATION) {
    return { strokeWidth: 2, stroke: '#e2e8f0' }
  }
  return {
    strokeWidth: 2,
    strokeDasharray: '6 6',
    stroke: kind === USE_CASE_EDGE_TYPE.INCLUDE ? '#38bdf8' : '#a855f7',
  }
}

export function useAutoLayout(graph: RawUseCaseGraph): {
  result: UseCaseLayoutResult
  isLoading: boolean
  error: Error | null
} {
  const [result, setResult] = useState<UseCaseLayoutResult>({ nodes: [], edges: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Map nodes for quick lookup when flattening ELK output.
  const rawNodeMap = useMemo(
    () => new Map<string, RawGraphNode>(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  )

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    // Pre-compute sizes per node (bottom-up for boundaries) so ELK can auto-grow around labels and children.
    const nodeSizeCache = new Map<string, { width: number; height: number }>()

    const baseTrees: ElkLayoutNode[] = (() => {
      const children = new Map<string, RawGraphNode[]>()
      graph.nodes.forEach((node) => {
        if (!node.parentId) return
        const group = children.get(node.parentId) ?? []
        group.push(node)
        children.set(node.parentId, group)
      })

      const computeSize = (node: RawGraphNode): { width: number; height: number } => {
        const cached = nodeSizeCache.get(node.id)
        if (cached) return cached

        if (node.type === USE_CASE_NODE_TYPE.USE_CASE) {
          const width = labelBasedWidth(node.label, 180, 340)
          const size = { width, height: 96 }
          nodeSizeCache.set(node.id, size)
          return size
        }

        if (node.type === USE_CASE_NODE_TYPE.ACTOR) {
          const width = labelBasedWidth(node.label, 140, 220)
          const size = { width, height: 144 }
          nodeSizeCache.set(node.id, size)
          return size
        }

        if (node.type === USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY) {
          const kids = children.get(node.id) ?? []
          const kidSizes = kids.map(computeSize)
          const maxChildWidth = kidSizes.length > 0 ? Math.max(...kidSizes.map((k) => k.width)) : 0
          const totalChildHeight =
            kidSizes.reduce((sum, k) => sum + k.height, 0) +
            Math.max(0, kidSizes.length - 1) * CHILD_VERTICAL_GAP

          const width = Math.max(
            DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY].width,
            maxChildWidth + 240,
          )
          const height = Math.max(
            DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY].height,
            totalChildHeight + 120,
          )
          const size = { width, height }
          nodeSizeCache.set(node.id, size)
          return size
        }

        const fallback = DEFAULT_NODE_SIZE[node.type] ?? { width: 200, height: 120 }
        nodeSizeCache.set(node.id, fallback)
        return fallback
      }

      // Build nested ELK nodes recursively so SYSTEM_BOUNDARY can wrap children.
      const buildElkNode = (node: RawGraphNode): ElkLayoutNode => {
        const size = computeSize(node)
        return {
          id: node.id,
          width: size.width,
          height: size.height,
          labels: [{ text: node.label }],
          children: (children.get(node.id) ?? []).map(buildElkNode),
        }
      }

      return graph.nodes
        .filter((node) => !node.parentId)
        .map(buildElkNode)
    })()

    const elkGraph: ElkGraphInput = {
      id: 'root',
      layoutOptions: LAYOUT_OPTIONS,
      children: baseTrees,
      edges: graph.edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    }

    const run = async () => {
      try {
        const layout = (await elk.layout(elkGraph)) as ElkLayoutResult
        if (cancelled) return

        const nodes: Node<UseCaseNodeData>[] = []
        layout.children?.forEach((child) =>
          flattenElkToReactFlow(child, rawNodeMap, nodes),
        )
        layoutChildrenGrid(nodes)

        const edges: Edge<UseCaseEdgeData>[] = graph.edges.map((edge) => {
          const label = edgeLabelForType(edge.type)
          const style = edgeStyleForType(edge.type)
          const strokeColor =
            typeof style.stroke === 'string'
              ? style.stroke
              : edge.type === USE_CASE_EDGE_TYPE.INCLUDE
                ? '#38bdf8'
                : edge.type === USE_CASE_EDGE_TYPE.EXTEND
                  ? '#a855f7'
                  : '#cbd5e1'
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'floating',
            data: {
              kind: edge.type,
              ...(label ? { label } : {}),
            },
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: strokeColor },
            style,
          }
        })

        setResult({ nodes, edges })
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
          setResult({ nodes: [], edges: [] })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [graph.edges, graph.nodes, rawNodeMap])

  return { result, isLoading, error }
}

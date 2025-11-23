import { MarkerType, Position, type Edge, type Node } from '@xyflow/react'
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

const BASE_NODE_SIZE = 144
const DEFAULT_NODE_SIZE = {
  [USE_CASE_NODE_TYPE.ACTOR]: { width: BASE_NODE_SIZE, height: BASE_NODE_SIZE },
  [USE_CASE_NODE_TYPE.USE_CASE]: { width: BASE_NODE_SIZE, height: BASE_NODE_SIZE },
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: { width: BASE_NODE_SIZE, height: BASE_NODE_SIZE },
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
const BOUNDARY_MIN_WIDTH = BASE_NODE_SIZE
const BOUNDARY_MIN_HEIGHT = BASE_NODE_SIZE

function labelBasedWidth(label: string, minWidth: number, maxWidth: number): number {
  const estimated = label.length * CHAR_WIDTH + PILL_PADDING
  return Math.max(minWidth, Math.min(maxWidth, estimated))
}

// Maps ELK layout result into React Flow nodes with parent-relative coordinates.
function flattenElkToReactFlow(
  elkNode: ElkLayoutNode,
  rawNodeMap: Map<string, RawGraphNode>,
  visuals: Map<string, Partial<UseCaseNodeData>>,
  accumulator: Node<UseCaseNodeData>[],
) {
  const raw = rawNodeMap.get(elkNode.id)
  if (!raw) return
  const visual = visuals.get(elkNode.id) ?? {}

  // ELK returns child coordinates relative to their parent, so we forward them directly.
  const x = elkNode.x ?? 0
  const y = elkNode.y ?? 0
  const baseSize = DEFAULT_NODE_SIZE[raw.type]

  accumulator.push({
    id: raw.id,
    type: raw.type,
    parentId: raw.parentId,
    position: { x, y },
    data: { label: raw.label, kind: raw.type, ...visual },
    draggable: true,
    // Keep children inside their boundary when parentId is set.
    ...(raw.parentId ? { extent: 'parent' as const } : {}),
    width: elkNode.width ?? baseSize.width,
    height: elkNode.height ?? baseSize.height,
  })

  for (const child of elkNode.children ?? []) {
    flattenElkToReactFlow(child, rawNodeMap, visuals, accumulator)
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

  const nodeVisuals = useMemo(
    () =>
      new Map(
        graph.nodes.map((node) => {
          if (node.type === USE_CASE_NODE_TYPE.ACTOR) {
            return [node.id, { icon: '🧍', accentColor: '#38bdf8' } satisfies Partial<UseCaseNodeData>]
          }
          if (node.type === USE_CASE_NODE_TYPE.USE_CASE) {
            return [node.id, { accentColor: '#34d399' } satisfies Partial<UseCaseNodeData>]
          }
          if (node.type === USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY) {
            return [node.id, { accentColor: '#0ea5e9' } satisfies Partial<UseCaseNodeData>]
          }
          return [node.id, {} satisfies Partial<UseCaseNodeData>]
        }),
      ),
    [graph.nodes],
  )

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    // Pre-compute sizes per node (bottom-up for boundaries) so ELK can auto-grow around labels and children.
    const nodeSizeCache = new Map<string, { width: number; height: number }>()

    const computeSize = (node: RawGraphNode): { width: number; height: number } => {
      const cached = nodeSizeCache.get(node.id)
      if (cached) return cached

      // Square baseline: start from base size and grow equally (width=height) if label needs more room.
      const minSize = BASE_NODE_SIZE
      const maxSize = BASE_NODE_SIZE * 2
      const needed = labelBasedWidth(node.label, minSize, maxSize)
      const size = { width: needed, height: needed }
      nodeSizeCache.set(node.id, size)
      return size
    }

    const baseTrees: ElkLayoutNode[] = graph.nodes
      .map((node) => {
        const size = computeSize(node)
        return {
          id: node.id,
          width: size.width,
          height: size.height,
          labels: [{ text: node.label }],
          children: [],
        }
      })

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
          flattenElkToReactFlow(child, rawNodeMap, nodeVisuals, nodes),
        )
        layoutChildrenGrid(nodes)

        // Build quick lookup for centers (absolute) including parent offsets.
        const nodeMap = new Map(nodes.map((n) => [n.id, n]))
        const getAbsolute = (node: Node<UseCaseNodeData>): { x: number; y: number } => {
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

        const centers = new Map(
          nodes.map((n) => {
            const abs = getAbsolute(n)
            return [
              n.id,
              {
                x: abs.x + (n.width ?? 0) / 2,
                y: abs.y + (n.height ?? 0) / 2,
                width: n.width ?? 0,
                height: n.height ?? 0,
              },
            ]
          }),
        )

        // Collect preferred side per node/role for deterministic assignment with caps.
        type Role = 'source' | 'target'
        type NodeRoleKey = `${string}|${Role}`
        type Request = { edgeId: string; preferred: Position }
        const requests = new Map<NodeRoleKey, Request[]>()

        const sideFromCenters = (a: { x: number; y: number }, b: { x: number; y: number }): { aSide: Position; bSide: Position } => {
          const horizontalFirst = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)
          if (horizontalFirst) {
            const aSide = b.x >= a.x ? Position.Right : Position.Left
            const bSide = b.x >= a.x ? Position.Left : Position.Right
            return { aSide, bSide }
          }
          const aSide = b.y >= a.y ? Position.Bottom : Position.Top
          const bSide = b.y >= a.y ? Position.Top : Position.Bottom
          return { aSide, bSide }
        }

        graph.edges.forEach((edge) => {
          const a = centers.get(edge.source)
          const b = centers.get(edge.target)
          if (!a || !b) return
          const { aSide, bSide } = sideFromCenters(a, b)
          const addRequest = (nodeId: string, side: Position, role: Role) => {
            const key: NodeRoleKey = `${nodeId}|${role}`
            const arr = requests.get(key) ?? []
            arr.push({ edgeId: edge.id, preferred: side })
            requests.set(key, arr)
          }
          addRequest(edge.source, aSide, 'source')
          addRequest(edge.target, bSide, 'target')
        })

        // Allocate handles with cap per side, spill to other sides, then share when all sides used.
        const MAX_PER_SIDE = 3
        const SIDE_ORDER: Position[] = [Position.Right, Position.Left, Position.Top, Position.Bottom]
        const sideLabel = (side: Position) =>
          side === Position.Top ? 'top' : side === Position.Right ? 'right' : side === Position.Bottom ? 'bottom' : 'left'

        type SideUsage = Record<Position, number>
        const allocateHandles = (
          nodeId: string,
          role: Role,
          reqs: Request[],
        ): { assignments: Map<string, { side: Position; slot: number }>; counts: Record<Position, number> } => {
          const assignments = new Map<string, { side: Position; slot: number }>()
          const load: SideUsage = {
            [Position.Top]: 0,
            [Position.Right]: 0,
            [Position.Bottom]: 0,
            [Position.Left]: 0,
          }

          const sorted = [...reqs].sort((a, b) => a.edgeId.localeCompare(b.edgeId))
          const overflow: Request[] = []

          // Pass 1: use preferred side if available.
          sorted.forEach((req) => {
            if (load[req.preferred] < MAX_PER_SIDE) {
              assignments.set(req.edgeId, { side: req.preferred, slot: load[req.preferred] })
              load[req.preferred] += 1
            } else {
              overflow.push(req)
            }
          })

          const spill: Request[] = []
          // Pass 2: spill to any side with capacity (< MAX_PER_SIDE), choose the side with smallest load (tie by SIDE_ORDER).
          overflow.forEach((req) => {
            const candidates = SIDE_ORDER.filter((side) => load[side] < MAX_PER_SIDE)
            if (candidates.length === 0) {
              spill.push(req)
              return
            }
            candidates.sort((a, b) => load[a] - load[b] || SIDE_ORDER.indexOf(a) - SIDE_ORDER.indexOf(b))
            const chosen = candidates[0]
            assignments.set(req.edgeId, { side: chosen, slot: load[chosen] })
            load[chosen] += 1
          })

          // Pass 3: all sides at cap; share existing dots. Reuse slots modulo MAX_PER_SIDE, spread by lowest load.
          spill.forEach((req) => {
            const minLoad = Math.min(...SIDE_ORDER.map((s) => load[s]))
            const candidates = SIDE_ORDER.filter((s) => load[s] === minLoad)
            candidates.sort((a, b) => SIDE_ORDER.indexOf(a) - SIDE_ORDER.indexOf(b))
            const chosen = candidates[0]
            const slot = load[chosen] % MAX_PER_SIDE
            assignments.set(req.edgeId, { side: chosen, slot })
            load[chosen] += 1
          })

          const cappedCounts: Record<Position, number> = {
            [Position.Top]: Math.min(MAX_PER_SIDE, load[Position.Top]),
            [Position.Right]: Math.min(MAX_PER_SIDE, load[Position.Right]),
            [Position.Bottom]: Math.min(MAX_PER_SIDE, load[Position.Bottom]),
            [Position.Left]: Math.min(MAX_PER_SIDE, load[Position.Left]),
          }

          return { assignments, counts: cappedCounts }
        }

        // Initialize handle layout counts per node.
        const handleCounts = new Map<
          string,
          { top: { source: number; target: number }; right: { source: number; target: number }; bottom: { source: number; target: number }; left: { source: number; target: number } }
        >()
        nodes.forEach((node) => {
          handleCounts.set(node.id, {
            top: { source: 0, target: 0 },
            right: { source: 0, target: 0 },
            bottom: { source: 0, target: 0 },
            left: { source: 0, target: 0 },
          })
        })

        const edgeHandles = new Map<string, { sourceHandleId?: string; targetHandleId?: string }>()

        requests.forEach((reqs, key) => {
          const [nodeId, role] = key.split('|') as [string, Role]
          const { assignments, counts } = allocateHandles(nodeId, role, reqs)

          // Persist layout counts (capped at MAX_PER_SIDE).
          const layout = handleCounts.get(nodeId)
          if (layout) {
            ;[Position.Top, Position.Right, Position.Bottom, Position.Left].forEach((side) => {
              const label = sideLabel(side)
              layout[label as keyof typeof layout][role] = counts[side]
            })
          }

          assignments.forEach((value, edgeId) => {
            const totalSlots = Math.max(1, counts[value.side])
            const id = `${sideLabel(value.side)}-${role}-${value.slot + 1}-of-${totalSlots}`
            const existing = edgeHandles.get(edgeId) ?? {}
            if (role === 'source') {
              edgeHandles.set(edgeId, { ...existing, sourceHandleId: id })
            } else {
              edgeHandles.set(edgeId, { ...existing, targetHandleId: id })
            }
          })
        })

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
          const handles = edgeHandles.get(edge.id)
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'floating',
            ...(handles?.sourceHandleId ? { sourceHandle: handles.sourceHandleId, sourceHandleId: handles.sourceHandleId } : {}),
            ...(handles?.targetHandleId ? { targetHandle: handles.targetHandleId, targetHandleId: handles.targetHandleId } : {}),
            data: {
              kind: edge.type,
              ...(label ? { label } : {}),
            },
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: strokeColor },
            style,
          }
        })

        // Inject handle layout into node data for rendering.
        nodes.forEach((node) => {
          const counts = handleCounts.get(node.id)
          if (!counts) return

          // Ensure boundary nodes still show anchors even when no edges connect to them.
          const totalHandles =
            counts.top.source +
            counts.top.target +
            counts.right.source +
            counts.right.target +
            counts.bottom.source +
            counts.bottom.target +
            counts.left.source +
            counts.left.target
          if (totalHandles === 0 && node.type === USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY) {
            counts.top = { source: 2, target: 2 }
            counts.bottom = { source: 2, target: 2 }
            counts.left = { source: 1, target: 1 }
            counts.right = { source: 1, target: 1 }
          }

          node.data = {
            ...node.data,
            handleLayout: counts,
          }
        })

        setResult({ nodes, edges })
      } catch (err) {
        if (!cancelled) {
          // Emit to console to aid debugging runtime layout issues.
          // eslint-disable-next-line no-console
          console.error('useAutoLayout error', err)
          try {
            // @ts-expect-error: debug helper
            if (typeof window !== 'undefined') window.__lastLayoutError = err
          } catch {
            /* noop */
          }
          const message =
            (err as Error)?.stack ??
            (err as Error)?.message ??
            (typeof err === 'string' ? err : JSON.stringify(err))
          setError(new Error(String(message)))
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
  }, [graph.edges, graph.nodes, rawNodeMap, nodeVisuals])

  return { result, isLoading, error }
}

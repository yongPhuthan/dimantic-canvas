import { MarkerType, Position, type Edge, type Node } from '@xyflow/react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import ELK from 'elkjs/lib/elk.bundled.js'

import {
  USE_CASE_NODE_TYPE,
  type RawGraphNode,
  type RawUseCaseGraph,
  type UseCaseEdgeData,
  type UseCaseNodeData,
} from '../types/graph'
import { computeGridSlots } from '../../../layout/gridEngine'
import type { BreakpointId, GridSlot, LayoutTree } from '../../../layout/types'

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

// Base square size per type; will expand equally (width=height) based on label length.
const DEFAULT_NODE_SIZE = {
  [USE_CASE_NODE_TYPE.ACTOR]: { width: 120, height: 120 },
  [USE_CASE_NODE_TYPE.USE_CASE]: { width: 144, height: 144 },
  [USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY]: { width: 144, height: 144 },
} as const
// Legacy fallback for any runtime references.
const BASE_NODE_SIZE = DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.USE_CASE].width
void BASE_NODE_SIZE

const LAYOUT_OPTIONS = {
  // Layered layout keeps actors on the left and flows toward use cases on the right.
  'org.eclipse.elk.algorithm': 'layered',
  'org.eclipse.elk.direction': 'RIGHT',
  // Increase spacing to reduce edge/node congestion for readability.
  'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': '120', // vertical gap between layers
  'org.eclipse.elk.spacing.nodeNode': '220', // intra-layer node spacing (horizontal spread)
  'org.eclipse.elk.spacing.edgeEdge': '140', // edge-edge spacing
  'org.eclipse.elk.spacing.componentComponent': '220',
  // Ensure compound (parent/child) nodes grow with children.
  'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  // Add breathing room inside boundaries.
  'org.eclipse.elk.padding': '[56,56,56,56]',
  // Encourage routed edges to bend/polyline to avoid collisions.
  'org.eclipse.elk.layered.edgeRouting': 'ORTHOGONAL',
  'org.eclipse.elk.layered.edgeSpacingFactor': '1.6',
  // Reserve space for labels.
  'org.eclipse.elk.spacing.labelNode': '32',
  'org.eclipse.elk.spacing.labelLabel': '32',
} as const

// Run ELK on the main thread; avoids bundler worker warnings in dev and keeps the mock graph simple.
const elk = new ELK()

const CHAR_WIDTH = 8
const PILL_PADDING = 48
const GRID_GAP_X = 32
const GRID_GAP_Y = 24
const BOUNDARY_MIN_WIDTH = DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY].width
const BOUNDARY_MIN_HEIGHT = DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY].height
const LANE_PADDING = { top: 48, right: 64, bottom: 48, left: 64 }
const LANE_GAP_X = 56
const LANE_GAP_Y = 32

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

type BoundaryLayout = {
  positions: Map<string, { x: number; y: number }>
  width: number
  height: number
}

function computeBoundaryLayout(
  boundaryId: string,
  allNodes: RawGraphNode[],
  edges: RawUseCaseGraph['edges'],
  sizeCache: Map<string, { width: number; height: number }>,
): BoundaryLayout | null {
  const children = allNodes.filter((node) => node.parentId === boundaryId)
  if (children.length === 0) return null

  const childIds = new Set(children.map((c) => c.id))
  const maxChildWidth = Math.max(
    ...children.map((c) => sizeCache.get(c.id)?.width ?? DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.USE_CASE].width),
  )
  const maxChildHeight = Math.max(
    ...children.map((c) => sizeCache.get(c.id)?.height ?? DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.USE_CASE].height),
  )
  const cellWidth = maxChildWidth + GRID_GAP_X
  const cellHeight = maxChildHeight + GRID_GAP_Y

  const isEntry = (id: string) =>
    edges.some((e) => e.target === id && !childIds.has(e.source) && e.source !== boundaryId)
  const isExit = (id: string) =>
    edges.some((e) => e.source === id && !childIds.has(e.target) && e.target !== boundaryId)

  const entries: RawGraphNode[] = []
  const exits: RawGraphNode[] = []
  const internals: RawGraphNode[] = []

  children.forEach((child) => {
    if (isEntry(child.id)) {
      entries.push(child)
      return
    }
    if (isExit(child.id)) {
      exits.push(child)
      return
    }
    internals.push(child)
  })

  const positions = new Map<string, { x: number; y: number }>()

  const entryCols = entries.length ? Math.max(2, Math.ceil(entries.length / 2)) : 0
  const entryRows = entryCols ? Math.ceil(entries.length / entryCols) : 0
  const entryWidth = entryCols ? Math.max(0, entryCols * cellWidth - GRID_GAP_X) : 0
  const entryHeight = entryRows ? Math.max(0, entryRows * cellHeight - GRID_GAP_Y) : 0

  const internalCols = internals.length ? Math.max(2, Math.ceil(internals.length / 2)) : 0
  const internalRows = internalCols ? Math.ceil(internals.length / internalCols) : 0
  const internalWidth = internalCols ? Math.max(0, internalCols * cellWidth - GRID_GAP_X) : 0
  const internalHeight = internalRows ? Math.max(0, internalRows * cellHeight - GRID_GAP_Y) : 0

  const exitCols = exits.length ? Math.max(2, Math.ceil(exits.length / 2)) : 0
  const exitRows = exitCols ? Math.ceil(exits.length / exitCols) : 0
  const exitWidth = exitCols ? Math.max(0, exitCols * cellWidth - GRID_GAP_X) : 0
  const exitHeight = exitRows ? Math.max(0, exitRows * cellHeight - GRID_GAP_Y) : 0

  let xCursor = LANE_PADDING.left

  // Entry lane (left)
  entries.forEach((node, idx) => {
    const col = entryCols ? idx % entryCols : 0
    const row = entryCols ? Math.floor(idx / entryCols) : 0
    positions.set(node.id, {
      x: xCursor + col * cellWidth,
      y: LANE_PADDING.top + row * cellHeight,
    })
  })

  if (entries.length && (internals.length || exits.length)) {
    xCursor += entryWidth + LANE_GAP_X
  } else {
    xCursor += entryWidth
  }

  // Internal lane(s)
  const internalBaseX = xCursor
  internals.forEach((node, idx) => {
    const col = internalCols ? idx % internalCols : 0
    const row = internalCols ? Math.floor(idx / internalCols) : 0
    positions.set(node.id, {
      x: internalBaseX + col * cellWidth,
      y: LANE_PADDING.top + row * cellHeight,
    })
  })

  if (internalWidth && exits.length) {
    xCursor = internalBaseX + internalWidth + LANE_GAP_X
  } else if (internalWidth) {
    xCursor = internalBaseX + internalWidth
  }

  // Exit lane (right)
  exits.forEach((node, idx) => {
    const col = exitCols ? idx % exitCols : 0
    const row = exitCols ? Math.floor(idx / exitCols) : 0
    positions.set(node.id, {
      x: xCursor + col * cellWidth,
      y: LANE_PADDING.top + row * cellHeight,
    })
  })

  const contentWidth =
    entryWidth +
    (entries.length && (internals.length || exits.length) ? LANE_GAP_X : 0) +
    internalWidth +
    (internalWidth && exits.length ? LANE_GAP_X : 0) +
    exitWidth

  const contentHeight = Math.max(entryHeight, internalHeight, exitHeight)

  const width = Math.max(BOUNDARY_MIN_WIDTH, contentWidth + LANE_PADDING.left + LANE_PADDING.right)
  const height = Math.max(BOUNDARY_MIN_HEIGHT, contentHeight + LANE_PADDING.top + LANE_PADDING.bottom + LANE_GAP_Y)

  return { positions, width, height }
}

function applyBoundaryLayouts(
  nodes: Node<UseCaseNodeData>[],
  layouts: Map<string, BoundaryLayout>,
): void {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  layouts.forEach((layout, boundaryId) => {
    const boundaryNode = nodeMap.get(boundaryId)
    if (boundaryNode) {
      boundaryNode.width = layout.width
      boundaryNode.height = layout.height
    }

    layout.positions.forEach((pos, childId) => {
      const child = nodeMap.get(childId)
      if (child) {
        child.position.x = pos.x
        child.position.y = pos.y
      }
    })
  })
}



export function useAutoLayout(
  graph: RawUseCaseGraph,
  options?: { layoutTree?: LayoutTree; breakpoint?: BreakpointId },
): {
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

  // Pre-layout hints: force actors to the far left column and bias anchors; others in a coarse grid.
  const positionHints = useMemo(() => {
    const hints = new Map<string, { x: number; y: number }>()
    const actors = graph.nodes.filter((n) => n.type === USE_CASE_NODE_TYPE.ACTOR)
    const others = graph.nodes.filter((n) => n.type !== USE_CASE_NODE_TYPE.ACTOR)
    actors.forEach((actor, idx) => hints.set(actor.id, { x: -400, y: idx * 320 }))
    const cols = Math.max(1, Math.ceil(Math.sqrt(others.length)))
    const cell = 320
    others.forEach((node, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      hints.set(node.id, { x: col * cell, y: row * cell })
    })
    return hints
  }, [graph.nodes])

  const gridSlots = useMemo(() => {
    if (!options?.layoutTree) return new Map<string, GridSlot>()
    return computeGridSlots(options.layoutTree, options.breakpoint ?? 'lg')
  }, [options?.layoutTree, options?.breakpoint])

  const anchorHints = useMemo(() => {
    const hints = new Map<string, Position>()
    graph.nodes.forEach((node) => {
      if (node.type === USE_CASE_NODE_TYPE.ACTOR) {
        hints.set(node.id, Position.Right)
      }
    })
    return hints
  }, [graph.nodes])

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
      const base = DEFAULT_NODE_SIZE[node.type] ?? DEFAULT_NODE_SIZE[USE_CASE_NODE_TYPE.USE_CASE]
      const minSize = base.width
      const maxSize = base.width * 1.6
      const needed = labelBasedWidth(node.label, minSize, maxSize)
      const size = { width: needed, height: needed }
      nodeSizeCache.set(node.id, size)
      return size
    }

    // Warm the size cache so compound sizing can reuse it.
    graph.nodes.forEach((node) => computeSize(node))

    // Compute internal layouts and locked sizes for each boundary before ELK.
    const boundaryLayouts = new Map<string, BoundaryLayout>()
    graph.nodes
      .filter((node) => node.type === USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY)
      .forEach((boundary) => {
        const layout = computeBoundaryLayout(boundary.id, graph.nodes, graph.edges, nodeSizeCache)
        if (layout) boundaryLayouts.set(boundary.id, layout)
      })

    const baseTrees: ElkLayoutNode[] = graph.nodes.map((node) => {
      const boundaryLayout = boundaryLayouts.get(node.id)
      const slot = node.parentId ? undefined : gridSlots.get(node.id)
      const size = boundaryLayout
        ? { width: boundaryLayout.width, height: boundaryLayout.height }
        : slot
          ? { width: slot.width, height: slot.height }
          : computeSize(node)
      const posHint = slot ? { x: slot.x, y: slot.y } : positionHints.get(node.id)
      return {
        id: node.id,
        width: size.width,
        height: size.height,
        ...(posHint ? { x: posHint.x, y: posHint.y } : {}),
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
        applyBoundaryLayouts(nodes, boundaryLayouts)

        // Force top-level nodes (actors, boundaries, root use cases) to grid slot positions; size only for non-actors/non-boundaries.
        if (gridSlots.size > 0) {
          nodes.forEach((node) => {
            if (node.parentId) return
            const slot = gridSlots.get(node.id)
            if (!slot) return
            node.position.x = slot.x
            node.position.y = slot.y
            if (node.type !== USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY && node.type !== USE_CASE_NODE_TYPE.ACTOR) {
              node.width = slot.width
              node.height = slot.height
            }
          })
        }

        // Align actors to the leftmost column to emphasize start when grid slots are not driving layout.
        if (gridSlots.size === 0) {
          const actorNodes = nodes.filter((n) => n.type === USE_CASE_NODE_TYPE.ACTOR)
          if (actorNodes.length) {
            const nonActorXs = nodes
              .filter((n) => n.type !== USE_CASE_NODE_TYPE.ACTOR)
              .map((n) => n.position.x)
            const minActorX = Math.min(...actorNodes.map((n) => n.position.x))
            const targetX =
              nonActorXs.length > 0
                ? Math.min(minActorX, Math.min(...nonActorXs) - 200)
                : minActorX
            actorNodes.forEach((actor) => {
              actor.position.x = targetX
            })
          }
        }

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

        // Bounding box for border biasing.
        const allCenters = Array.from(centers.values())
        const minX = Math.min(...allCenters.map((c) => c.x))
        const maxX = Math.max(...allCenters.map((c) => c.x))
        const minY = Math.min(...allCenters.map((c) => c.y))
        const maxY = Math.max(...allCenters.map((c) => c.y))
        const marginX = Math.max(1, (maxX - minX) * 0.25)
        const marginY = Math.max(1, (maxY - minY) * 0.25)

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

        const biasSideToBorder = (nodeId: string, suggested: Position): Position => {
          const hinted = anchorHints.get(nodeId)
          if (hinted) return hinted
          const c = centers.get(nodeId)
          if (!c) return suggested
          const distLeft = c.x - minX
          const distRight = maxX - c.x
          const distTop = c.y - minY
          const distBottom = maxY - c.y
          const nearest = Math.min(distLeft, distRight, distTop, distBottom)
          if (nearest === distLeft && distLeft <= marginX) return Position.Left
          if (nearest === distRight && distRight <= marginX) return Position.Right
          if (nearest === distTop && distTop <= marginY) return Position.Top
          if (nearest === distBottom && distBottom <= marginY) return Position.Bottom
          return suggested
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
          addRequest(edge.source, biasSideToBorder(edge.source, aSide), 'source')
          addRequest(edge.target, biasSideToBorder(edge.target, bSide), 'target')
        })

        // Allocate handles with cap per side, spill to other sides, then share when all sides used.
        const DEFAULT_MAX_PER_SIDE = 3
        const actorMaxPerSide = 6
        const SIDE_ORDER: Position[] = [Position.Right, Position.Left, Position.Top, Position.Bottom]
        const sideLabel = (side: Position) =>
          side === Position.Top ? 'top' : side === Position.Right ? 'right' : side === Position.Bottom ? 'bottom' : 'left'

        type SideUsage = Record<Position, number>
        const allocateHandles = (
          nodeId: string, _role: string, reqs: Request[],
        ): { assignments: Map<string, { side: Position; slot: number }>; counts: Record<Position, number> } => {
          const maxPerSide = rawNodeMap.get(nodeId)?.type === USE_CASE_NODE_TYPE.ACTOR ? actorMaxPerSide : DEFAULT_MAX_PER_SIDE
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
            if (load[req.preferred] < maxPerSide) {
              assignments.set(req.edgeId, { side: req.preferred, slot: load[req.preferred] })
              load[req.preferred] += 1
            } else {
              overflow.push(req)
            }
          })

          const spill: Request[] = []
          // Pass 2: spill to any side with capacity (< MAX_PER_SIDE), choose the side with smallest load (tie by SIDE_ORDER).
          overflow.forEach((req) => {
            const candidates = SIDE_ORDER.filter((side) => load[side] < maxPerSide)
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
            const slot = load[chosen] % maxPerSide
            assignments.set(req.edgeId, { side: chosen, slot })
            load[chosen] += 1
          })

          const cappedCounts: Record<Position, number> = {
            [Position.Top]: Math.min(maxPerSide, load[Position.Top]),
            [Position.Right]: Math.min(maxPerSide, load[Position.Right]),
            [Position.Bottom]: Math.min(maxPerSide, load[Position.Bottom]),
            [Position.Left]: Math.min(maxPerSide, load[Position.Left]),
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

          // Internal edges drop labels/dashed; use unified style.
          const label = '' // temporarily hide labels (<<include>>, <<extend>>) for uniform edges
          const style: CSSProperties = { strokeWidth: 2, stroke: '#cbd5e1' }

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
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#cbd5e1' },
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
  }, [graph.edges, graph.nodes, rawNodeMap, nodeVisuals, gridSlots])

  return { result, isLoading, error }
}

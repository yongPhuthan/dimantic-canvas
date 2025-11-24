import { Children, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'

import type {
  BreakpointId,
  Gap,
  LayoutNode,
  LayoutProps,
  LayoutTree,
  NormalizedGridConfig,
} from './types'

export function Layout(_props: LayoutProps) {
  // Declarative-only component; parsing happens via parseLayoutTree.
  return null
}

const DEFAULT_CONTAINER: NormalizedGridConfig = {
  columns: 12,
  colWidth: 200,
  rowHeight: 200,
  gap: { x: 24, y: 24 },
}

const BP_ORDER: BreakpointId[] = ['xs', 'sm', 'md', 'lg', 'xl']

function normalizeGap(gap?: Gap): { x: number; y: number } {
  if (gap == null) return { x: 24, y: 24 }
  if (typeof gap === 'number') return { x: gap, y: gap }
  return { x: gap.x ?? 24, y: gap.y ?? 24 }
}

export function parseLayoutTree(element: ReactElement): LayoutTree {
  const walk = (node: ReactNode): LayoutNode => {
    if (!isValidElement<LayoutProps>(node)) {
      throw new Error('Layout children must be valid React elements')
    }
    const props = node.props as LayoutProps
    if (props.container) {
      const children = Children.toArray(node.props.children as ReactNode | undefined).map(walk) as LayoutNode[]
      return {
        kind: 'container',
        columns: props.columns,
        rowHeight: props.rowHeight,
        gap: props.gap,
        breakpoints: props.breakpoints,
        children,
      }
    }
    if (props.item) {
      if (!props.nodeId) {
        throw new Error('Layout item requires nodeId')
      }
      const children = Children.toArray(node.props.children as ReactNode | undefined).map(walk) as LayoutNode[]
      return {
        kind: 'item',
        nodeId: props.nodeId,
        xs: props.xs,
        sm: props.sm,
        md: props.md,
        lg: props.lg,
        xl: props.xl,
        row: props.row,
        rowSpan: props.rowSpan,
        colStart: props.colStart,
        align: props.align,
        children,
      }
    }
    throw new Error('Layout node must be container or item')
  }

  const tree = walk(element)
  if (tree.kind !== 'container') {
    throw new Error('Layout root must be a container')
  }
  return tree
}

export function resolveGridConfig(tree: LayoutTree, bp: BreakpointId | undefined): NormalizedGridConfig {
  const base: NormalizedGridConfig = {
    ...DEFAULT_CONTAINER,
    ...(tree.columns ? { columns: tree.columns } : {}),
    ...(tree.rowHeight ? { rowHeight: tree.rowHeight } : {}),
    ...(tree.gap ? { gap: normalizeGap(tree.gap) } : { gap: DEFAULT_CONTAINER.gap }),
  }
  if (!bp || !tree.breakpoints) return base
  const bpConfig = tree.breakpoints[bp]
  if (!bpConfig) return base
  return {
    columns: bpConfig.columns ?? base.columns,
    colWidth: bpConfig.colWidth ?? base.colWidth,
    rowHeight: bpConfig.rowHeight ?? base.rowHeight,
    gap: bpConfig.gap ? normalizeGap(bpConfig.gap) : base.gap,
  }
}

export function pickSpan(props: { [k in BreakpointId]?: number }, bp: BreakpointId, fallback: number): number {
  const order = BP_ORDER
  const index = order.indexOf(bp)
  for (let i = index; i >= 0; i -= 1) {
    const key = order[i]
    const val = props[key]
    if (typeof val === 'number') return val
  }
  return fallback
}

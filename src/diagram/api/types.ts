import type { ReactNode } from 'react'

import type { UseCaseEdgeKind, UseCaseNodeKind } from '../types/graph'

export type DiagramNodeKind = UseCaseNodeKind
export type DiagramEdgeKind = UseCaseEdgeKind

export type LayoutDirection = 'RIGHT' | 'DOWN'
export type LayoutAlgorithm = 'elk' | 'none'
export type HierarchyMode = 'INCLUDE_CHILDREN' | 'FLAT'

export type LayoutConfig = {
  algorithm?: LayoutAlgorithm
  direction?: LayoutDirection
  grid?: boolean
  spacing?: number
  padding?: number
  hierarchy?: HierarchyMode
}

export type DiagramNodeProps = {
  id: string
  kind: DiagramNodeKind
  label: string
  parentId?: string
  xs?: number
  sm?: number
  md?: number
  children?: ReactNode
}

export type DiagramEdgeProps = {
  id: string
  from: string
  to: string
  kind: DiagramEdgeKind
  label?: string
  children?: ReactNode
}

export type DiagramLayoutProps = LayoutConfig & {
  children: ReactNode
}

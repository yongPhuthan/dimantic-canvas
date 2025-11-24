import type { ReactNode } from 'react'

export type BreakpointId = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type Gap = number | { x: number; y: number }

export type GridConfig = {
  columns: number
  colWidth?: number
  rowHeight?: number
  gap?: Gap
}

export type BreakpointConfig = Partial<Record<BreakpointId, GridConfig>>

export type LayoutContainerProps = {
  container: true
  item?: never
  columns?: number
  rowHeight?: number
  gap?: Gap
  breakpoints?: BreakpointConfig
  children?: ReactNode
}

export type LayoutItemProps = {
  item: true
  container?: never
  nodeId: string
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  row?: number
  rowSpan?: number
  colStart?: number
  align?: 'start' | 'center' | 'end'
  children?: ReactNode
}

export type LayoutProps = LayoutContainerProps | LayoutItemProps

export type LayoutNode =
  | ({ kind: 'container' } & Omit<LayoutContainerProps, 'container' | 'children'> & { children: LayoutNode[] })
  | ({ kind: 'item' } & Omit<LayoutItemProps, 'item' | 'children'> & { children: LayoutNode[] })

export type LayoutTree = LayoutNode & { kind: 'container' }

export type NormalizedGridConfig = {
  columns: number
  colWidth: number
  rowHeight: number
  gap: { x: number; y: number }
}

export type GridSlot = {
  nodeId: string
  colStart: number
  span: number
  row: number
  rowSpan: number
  x: number
  y: number
  width: number
  height: number
}

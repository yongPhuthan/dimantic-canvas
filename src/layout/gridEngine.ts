import type { BreakpointId, GridSlot, LayoutNode, LayoutTree, NormalizedGridConfig } from './types'
import { pickSpan, resolveGridConfig } from './Layout'

const DEFAULT_SPAN = 3

type SlotContext = {
  columns: number
  colWidth: number
  rowHeight: number
  gapX: number
  gapY: number
}

function placeItems(
  items: LayoutNode[],
  ctx: SlotContext,
  bp: BreakpointId,
  slots: GridSlot[],
  rowOffset: number,
) {
  let currentRow = rowOffset
  let currentCol = 1

  items.forEach((node) => {
    if (node.kind !== 'item') return
    const span = Math.min(ctx.columns, Math.max(1, pickSpan(node, bp, DEFAULT_SPAN)))
    const rowSpan = Math.max(1, node.rowSpan ?? 1)

    let colStart = node.colStart ?? currentCol
    if (colStart + span - 1 > ctx.columns) {
      currentRow += 1
      colStart = 1
    }

    const row = typeof node.row === 'number' ? node.row : currentRow

    const width = span * ctx.colWidth + (span - 1) * ctx.gapX
    const height = rowSpan * ctx.rowHeight + (rowSpan - 1) * ctx.gapY
    const x = (colStart - 1) * (ctx.colWidth + ctx.gapX)
    const y = row * (ctx.rowHeight + ctx.gapY)

    slots.push({
      nodeId: node.nodeId,
      colStart,
      span,
      row,
      rowSpan,
      x,
      y,
      width,
      height,
    })

    currentCol = colStart + span
  })
}

export function computeGridSlots(tree: LayoutTree, bp: BreakpointId = 'lg'): Map<string, GridSlot> {
  const cfg: NormalizedGridConfig = resolveGridConfig(tree, bp)
  const ctx: SlotContext = {
    columns: cfg.columns,
    colWidth: cfg.colWidth,
    rowHeight: cfg.rowHeight,
    gapX: cfg.gap.x,
    gapY: cfg.gap.y,
  }

  const slots: GridSlot[] = []
  placeItems(tree.children, ctx, bp, slots, 0)

  return new Map(slots.map((slot) => [slot.nodeId, slot]))
}

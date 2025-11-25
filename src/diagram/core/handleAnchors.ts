import { Position } from '@xyflow/react'

type Role = 'source' | 'target'

export function anchorOffsets(count: number): number[] {
  if (count <= 0) return []
  // First handle always center. Spread additional handles toward extremes to avoid overlap.
  const offsets: number[] = [0.5]
  if (count === 1) return offsets

  const spreadPairs = [
    [0.2, 0.8],
    [0.1, 0.9],
    [0.3, 0.7],
    [0.15, 0.85],
    [0.4, 0.6],
  ]

  let remaining = count - 1
  for (const pair of spreadPairs) {
    for (const off of pair) {
      if (remaining <= 0) break
      offsets.push(off)
      remaining -= 1
      if (remaining <= 0) break
    }
    if (remaining <= 0) break
  }

  // If still remaining, distribute evenly between 0.05 and 0.95
  for (let i = 0; i < remaining; i += 1) {
    const value = 0.05 + (i / Math.max(1, remaining - 1)) * 0.9
    offsets.push(Number(value.toFixed(4)))
  }

  return offsets.slice(0, count)
}

const sideLabel = (side: Position) =>
  side === Position.Top ? 'top' : side === Position.Right ? 'right' : side === Position.Bottom ? 'bottom' : 'left'

export function anchorId(side: Position, role: Role, index: number, total: number) {
  return `${sideLabel(side)}-${role}-${index + 1}-of-${total}`
}

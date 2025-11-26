import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { useEffect, useMemo } from 'react'
import type { UseCaseReactFlowNode } from '../../types/graph'
import { anchorId, anchorOffsets } from '../../core/handleAnchors'

const handleVisibility = () => 'opacity-0 pointer-events-none scale-75'

const handleBase = () =>
  `h-3 w-3 rounded-full border-2 shadow ring-2 transition duration-150 ${handleVisibility()}`

function renderHandles(side: Position, type: 'source' | 'target', count: number, accent: string) {
  if (count <= 0) return null
  const offsets = anchorOffsets(count)
  return Array.from({ length: count }).map((_, idx) => {
    const offset = `${offsets[idx] * 100}%`
    const id = anchorId(side, type, idx, count)
    const style =
      side === Position.Left || side === Position.Right
        ? { top: offset, transform: 'translate(-50%, -50%)' }
        : { left: offset, transform: 'translate(-50%, -50%)' }
    return (
      <Handle
        key={id}
        id={id}
        type={type}
        position={side}
        className={`${handleBase()} ${
          side === Position.Top ? '-mt-1' : side === Position.Bottom ? '-mb-1' : side === Position.Left ? '-ml-1' : '-mr-1'
        }`}
        style={{
          ...style,
          backgroundColor: accent,
          borderColor: 'hsl(var(--card))',
          boxShadow: '0 0 0 1px hsl(var(--background))',
          // use CSS variable so ring utility picks up token color
          // @ts-expect-error CSS custom property for ring
          '--tw-ring-color': 'hsl(var(--ring))',
        }}
      />
    )
  })
}

export function NodeModel({ id, data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const layout = data.handleLayout
  const accent = data.accentColor ?? 'hsl(var(--primary))'
  const hasIcon = Boolean(data.icon)
  const updateNodeInternals = useUpdateNodeInternals()
  const handleLayoutKey = useMemo(
    () =>
      `${layout?.top.source ?? 0}-${layout?.top.target ?? 0}-${layout?.right.source ?? 0}-${layout?.right.target ?? 0}-${layout?.bottom.source ?? 0}-${layout?.bottom.target ?? 0}-${layout?.left.source ?? 0}-${layout?.left.target ?? 0}`,
    [layout],
  )

  useEffect(() => {
    // Ensure React Flow recomputes handleBounds after dynamic handle layout changes.
    updateNodeInternals?.(id)
  }, [id, handleLayoutKey, updateNodeInternals])

  return (
    <div
      className={`group relative flex h-full w-full flex-col items-center ${
        hasIcon ? 'gap-3 justify-start' : 'gap-0 justify-center'
      } rounded-[--radius-lg] border px-4 py-4 text-center text-foreground shadow-[--shadow-md] backdrop-blur ${
        selected
          ? 'ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--card))]'
          : 'ring-1 ring-border/70'
      }`}
      style={{
        borderColor: accent,
        backgroundColor: 'hsl(var(--card))',
        boxShadow: selected ? '0 0 0 2px hsl(var(--ring))' : 'var(--shadow-md)',
      }}
    >
      {hasIcon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl text-muted-foreground shadow-inner">
          {data.icon}
        </div>
      ) : null}
      <div className="text-sm font-semibold leading-tight">{data.label}</div>

      {renderHandles(Position.Top, 'target', layout?.top.target ?? 0, accent)}
      {renderHandles(Position.Top, 'source', layout?.top.source ?? 0, accent)}

      {renderHandles(Position.Right, 'source', layout?.right.source ?? 0, accent)}
      {renderHandles(Position.Right, 'target', layout?.right.target ?? 0, accent)}

      {renderHandles(Position.Bottom, 'target', layout?.bottom.target ?? 0, accent)}
      {renderHandles(Position.Bottom, 'source', layout?.bottom.source ?? 0, accent)}

      {renderHandles(Position.Left, 'source', layout?.left.source ?? 0, accent)}
      {renderHandles(Position.Left, 'target', layout?.left.target ?? 0, accent)}
    </div>
  )
}

import { Handle, NodeResizer, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { useEffect, useMemo } from 'react'
import { anchorId, anchorOffsets } from '../../core/handleAnchors'
import type { UseCaseReactFlowNode } from '../../types/graph'

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
          // @ts-expect-error CSS custom property for ring
          '--tw-ring-color': 'hsl(var(--ring))',
        }}
      />
    )
  })
}

export function SubgraphNodeModel({ id, data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const layout = data.handleLayout
  const accent = data.accentColor ?? 'hsl(var(--primary))'
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
      className={`group relative h-full w-full rounded-[--radius-lg] border-2 border-dashed border-border bg-transparent p-3 text-foreground ${
        selected ? 'ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--card))]' : ''
      }`}
      style={{ zIndex: 0 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={120}
        lineStyle={{ borderColor: accent, borderWidth: 2 }}
        handleStyle={{
          width: 12,
          height: 12,
          borderRadius: 4,
          background: accent,
          border: '1px solid hsl(var(--ring))',
          boxShadow: '0 0 0 1px hsl(var(--card))',
        }}
      />
      <div className="pointer-events-none absolute -top-4 left-3 flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-1 text-xs font-semibold text-foreground shadow-card">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        <span>{data.label}</span>
      </div>

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

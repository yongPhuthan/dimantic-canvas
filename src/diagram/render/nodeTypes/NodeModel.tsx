import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { useEffect, useMemo } from 'react'
import type { UseCaseReactFlowNode } from '../../types/graph'
import { anchorId, anchorOffsets } from '../../core/handleAnchors'

const handleVisibility = () => 'opacity-0 pointer-events-none scale-75'

const handleBase = () =>
  `h-3 w-3 rounded-full border-2 border-white bg-sky-400 shadow ring-2 ring-white transition duration-150 ${handleVisibility()}`

function renderHandles(side: Position, type: 'source' | 'target', count: number) {
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
        style={style}
      />
    )
  })
}

export function NodeModel({ id, data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const layout = data.handleLayout
  const accent = data.accentColor ?? '#38bdf8'
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
      } rounded-2xl border px-4 py-4 text-center text-white shadow-sm backdrop-blur ${
        selected ? 'ring-2 ring-offset-2 ring-offset-slate-900' : 'ring-1 ring-slate-200'
      }`}
      style={{
        borderColor: accent,
        backgroundColor: '#f97316', // deep orange to highlight edge overlap
        boxShadow: selected ? undefined : '0 6px 18px rgba(15,23,42,0.08)',
      }}
    >
      {hasIcon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700 shadow-inner">
          {data.icon}
        </div>
      ) : null}
      <div className="text-sm font-semibold leading-tight">{data.label}</div>

      {renderHandles(Position.Top, 'target', layout?.top.target ?? 0)}
      {renderHandles(Position.Top, 'source', layout?.top.source ?? 0)}

      {renderHandles(Position.Right, 'source', layout?.right.source ?? 0)}
      {renderHandles(Position.Right, 'target', layout?.right.target ?? 0)}

      {renderHandles(Position.Bottom, 'target', layout?.bottom.target ?? 0)}
      {renderHandles(Position.Bottom, 'source', layout?.bottom.source ?? 0)}

      {renderHandles(Position.Left, 'source', layout?.left.source ?? 0)}
      {renderHandles(Position.Left, 'target', layout?.left.target ?? 0)}
    </div>
  )
}

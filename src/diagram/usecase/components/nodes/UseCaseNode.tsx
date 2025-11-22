import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

export function UseCaseNode({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const layout = data.handleLayout
  const handleVisibility = selected
    ? 'opacity-100 pointer-events-auto scale-100'
    : 'opacity-0 pointer-events-none scale-75 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100'

  const handleBase =
    'h-3 w-3 rounded-full border-2 border-white bg-sky-400 shadow ring-2 ring-white transition duration-150 ' +
    handleVisibility

  const spread = (index: number, total: number) => `${((index + 1) / (total + 1)) * 100}%`
  const sideLabel = (side: Position) =>
    side === Position.Top ? 'top' : side === Position.Right ? 'right' : side === Position.Bottom ? 'bottom' : 'left'

  const renderHandles = (side: Position, type: 'source' | 'target', count: number) => {
    if (count <= 0) return null
    return Array.from({ length: count }).map((_, idx) => {
      const offset = spread(idx, count)
      const id = `${sideLabel(side)}-${type}-${idx + 1}-of-${count}`
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
          className={`${handleBase} ${
            side === Position.Top
              ? '-mt-1'
              : side === Position.Bottom
                ? '-mb-1'
                : side === Position.Left
                  ? '-ml-1'
                  : '-mr-1'
          }`}
          style={style}
        />
      )
    })
  }

  return (
    <div
      className={`group relative flex w-[190px] flex-col items-center rounded-full border px-6 py-4 text-center text-slate-900 shadow-sm ${
        selected ? 'bg-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : 'bg-slate-50 ring-1 ring-slate-200'
      }`}
    >
      <div className="text-sm font-semibold leading-tight">{data.label}</div>

      {/* Dynamic handles per side using percentage offsets */}
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

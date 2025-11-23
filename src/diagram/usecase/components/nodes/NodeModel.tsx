import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

const handleVisibility = (selected: boolean) =>
  selected
    ? 'opacity-100 pointer-events-auto scale-100'
    : 'opacity-0 pointer-events-none scale-75 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100'

const handleBase = (selected: boolean) =>
  `h-3 w-3 rounded-full border-2 border-white bg-sky-400 shadow ring-2 ring-white transition duration-150 ${handleVisibility(selected)}`

const sideLabel = (side: Position) =>
  side === Position.Top ? 'top' : side === Position.Right ? 'right' : side === Position.Bottom ? 'bottom' : 'left'

function renderHandles(
  side: Position,
  type: 'source' | 'target',
  count: number,
  selected: boolean,
) {
  if (count <= 0) return null
  const spread = (index: number, total: number) => `${((index + 1) / (total + 1)) * 100}%`
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
        className={`${handleBase(selected)} ${
          side === Position.Top ? '-mt-1' : side === Position.Bottom ? '-mb-1' : side === Position.Left ? '-ml-1' : '-mr-1'
        }`}
        style={style}
      />
    )
  })
}

export function NodeModel({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const layout = data.handleLayout
  const accent = data.accentColor ?? '#38bdf8'
  const hasIcon = Boolean(data.icon)

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

      {renderHandles(Position.Top, 'target', layout?.top.target ?? 0, selected)}
      {renderHandles(Position.Top, 'source', layout?.top.source ?? 0, selected)}

      {renderHandles(Position.Right, 'source', layout?.right.source ?? 0, selected)}
      {renderHandles(Position.Right, 'target', layout?.right.target ?? 0, selected)}

      {renderHandles(Position.Bottom, 'target', layout?.bottom.target ?? 0, selected)}
      {renderHandles(Position.Bottom, 'source', layout?.bottom.source ?? 0, selected)}

      {renderHandles(Position.Left, 'source', layout?.left.source ?? 0, selected)}
      {renderHandles(Position.Left, 'target', layout?.left.target ?? 0, selected)}
    </div>
  )
}

import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import type { UseCaseReactFlowNode } from '../../types/graph'

export function SystemNode({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
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
      className="group relative h-full w-full rounded-2xl border-2 border-dashed bg-slate-800/40 p-4 text-left text-slate-100"
      style={{ zIndex: 0 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={200}
        lineStyle={{ borderColor: '#1d9bf0', borderWidth: 2 }}
        handleStyle={{
          width: 12,
          height: 12,
          borderRadius: 2,
          background: '#1d9bf0',
          border: '1px solid #0f6abf',
          boxShadow: '0 0 0 1px #d9eafd',
        }}
      />
      {/* Badge stays anchored to the top-left so the boundary name is always visible above edges. */}
      <div className="pointer-events-none absolute -top-4 left-3 flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 text-xs font-semibold shadow-lg">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="text-slate-100">{data.label}</span>
      </div>
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

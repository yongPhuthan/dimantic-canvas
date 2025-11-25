import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { anchorId, anchorOffsets } from '../../core/handleAnchors'
import type { UseCaseReactFlowNode } from '../../types/graph'

const handleVisibility = (selected: boolean) =>
  selected
    ? 'opacity-100 pointer-events-auto scale-100'
    : 'opacity-0 pointer-events-none scale-75 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100'

const handleBase = (selected: boolean) =>
  `h-3 w-3 rounded-full border-2 border-white bg-sky-400 shadow ring-2 ring-white transition duration-150 ${handleVisibility(selected)}`

function renderHandles(
  side: Position,
  type: 'source' | 'target',
  count: number,
  selected: boolean,
) {
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
        className={`${handleBase(selected)} ${
          side === Position.Top ? '-mt-1' : side === Position.Bottom ? '-mb-1' : side === Position.Left ? '-ml-1' : '-mr-1'
        }`}
        style={style}
      />
    )
  })
}

export function SubgraphNodeModel({ data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const layout = data.handleLayout

  return (
    <div
      className={`group relative h-full w-full rounded-2xl border-2 border-dashed bg-transparent p-3 text-slate-100 ${
        selected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900' : ''
      }`}
      style={{ zIndex: 0 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={120}
        lineStyle={{ borderColor: '#38bdf8', borderWidth: 2 }}
        handleStyle={{
          width: 12,
          height: 12,
          borderRadius: 2,
          background: '#38bdf8',
          border: '1px solid #0f6abf',
          boxShadow: '0 0 0 1px #d9eafd',
        }}
      />
      <div className="pointer-events-none absolute -top-4 left-3 flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 text-xs font-semibold shadow-lg">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="text-slate-100">{data.label}</span>
      </div>

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

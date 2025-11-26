import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { useEffect, useMemo, useState } from 'react'

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

function FallbackMediaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" ry="2" className="opacity-70" />
      <path d="m7 14 2.5-3.5 3 4 2.5-3 3 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1" />
    </svg>
  )
}

export function MediaNode({ id, data, selected }: NodeProps<UseCaseReactFlowNode>) {
  const layout = data.handleLayout
  const accent = data.accentColor ?? 'hsl(var(--secondary))'
  const updateNodeInternals = useUpdateNodeInternals()
  const [imageFailed, setImageFailed] = useState(false)

  const handleLayoutKey = useMemo(
    () =>
      `${layout?.top.source ?? 0}-${layout?.top.target ?? 0}-${layout?.right.source ?? 0}-${layout?.right.target ?? 0}-${layout?.bottom.source ?? 0}-${layout?.bottom.target ?? 0}-${layout?.left.source ?? 0}-${layout?.left.target ?? 0}`,
    [layout],
  )

  useEffect(() => {
    updateNodeInternals?.(id)
  }, [id, handleLayoutKey, updateNodeInternals])

  const properties = data.properties ?? []
  const hasImage = Boolean(data.media?.src && !imageFailed)
  const hasIcon = Boolean(data.media?.icon && !hasImage)

  return (
    <div
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[--radius-lg] border text-foreground shadow-[--shadow-md] ${
        selected
          ? 'ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--card))]'
          : 'ring-1 ring-border/60'
      }`}
      style={{ borderColor: accent, backgroundColor: 'hsl(var(--card))', boxShadow: selected ? '0 0 0 2px hsl(var(--ring))' : 'var(--shadow-md)' }}
    >
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-secondary/40 via-muted/30 to-card/50">
        {hasImage ? (
          <img
            src={data.media?.src}
            alt={data.media?.alt ?? data.label}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : hasIcon ? (
          <div className="flex h-full w-full items-center justify-center text-4xl text-foreground">
            {data.media?.icon}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FallbackMediaIcon />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-border/80 bg-card/70 px-3 py-3">
        <div className="text-sm font-semibold leading-tight">{data.label}</div>
        <div className="rounded-md border border-border/70 bg-background/60 p-2">
          {properties.length > 0 ? (
            <dl className="space-y-1 text-[11px] leading-tight text-muted-foreground">
              {properties.map((property) => (
                <div key={`${property.key}-${property.value}`} className="flex items-start justify-between gap-2">
                  <dt className="font-semibold text-foreground">{property.key}</dt>
                  <dd className="truncate text-right">{property.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="text-[11px] text-muted-foreground">No properties</div>
          )}
        </div>
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

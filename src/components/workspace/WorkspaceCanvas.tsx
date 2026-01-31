"use client"

import * as React from "react"
import { useSessionStore } from "@/stores/sessionStore"
import { useAuthStore } from "@/stores/authStore"
import wsClient from "@/lib/socket/client"
import { getMaterialTypeIcon, generateColor, getStorageBucketForMaterialType } from "@/lib/utils"
import type { CursorPosition, Material } from "@/types"
import apiClient from "@/lib/api/client"
import { MaterialViewerDialog } from "@/components/materials/MaterialViewerDialog"

interface WorkspaceCanvasProps {
  readonly sessionId: string
  readonly zoom: number
}

export function WorkspaceCanvas({ sessionId, zoom }: WorkspaceCanvasProps) {
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const [viewerMaterial, setViewerMaterial] = React.useState<Material | null>(null)
  const [viewerOpen, setViewerOpen] = React.useState(false)

  const { materials, cursors, selectedMaterialIds, toggleMaterialSelection, clearSelection, updateMaterialMetadata, persistMaterialMetadata } = useSessionStore()
  const { user } = useAuthStore()

  // Send cursor position on mouse move
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !user) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - offset.x) / zoom
      const y = (e.clientY - rect.top - offset.y) / zoom

      wsClient.sendCursorPosition(sessionId, x, y)

      if (isDragging) {
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [sessionId, user, zoom, offset, isDragging, dragStart]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle click or shift+left click for panning
      setIsDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    } else if (e.target === canvasRef.current) {
      // Click on empty canvas clears selection
      clearSelection()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Listen for cursor updates from other users
  React.useEffect(() => {
    const unsubscribe = wsClient.onCursorUpdate((data: CursorPosition) => {
      if (data.user_id !== user?.id) {
        useSessionStore.getState().updateCursor(data.user_id, data)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id])

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-grab relative"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Canvas content with zoom and pan */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Materials */}
        {materials.map((material) => (
          <MaterialNode
            key={material.id}
            material={material}
            isSelected={selectedMaterialIds.includes(material.id)}
            onSelect={() => toggleMaterialSelection(material.id)}
            onOpen={async () => {
              try {
                const fullMaterial = await apiClient.getMaterial(material.id)
                if (fullMaterial.file_url) {
                  const bucket = getStorageBucketForMaterialType(fullMaterial.material_type)
                  const url = await apiClient.getPresignedDownloadUrl(bucket, fullMaterial.file_url)
                  setViewerMaterial({ ...fullMaterial, download_url: url })
                } else {
                  setViewerMaterial(fullMaterial)
                }
                setViewerOpen(true)
              } catch (error) {
                console.error("Failed to open material:", error)
              }
            }}
            onPositionChange={(position, size) => {
              updateMaterialMetadata(material.id, { canvas: { position, size } })
            }}
            onPositionCommit={(position, size) => {
              persistMaterialMetadata(material.id, { ...(material.metadata || {}), canvas: { position, size } })
            }}
            zoom={zoom}
          />
        ))}

        {/* Other users' cursors */}
        {Array.from(cursors.entries()).map(([odataId, cursor]) => (
          <UserCursor key={odataId} cursor={cursor} />
        ))}
      </div>

      {/* Canvas info */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {materials.length} materials • Zoom: {Math.round(zoom * 100)}%
      </div>

      <MaterialViewerDialog
        material={viewerMaterial}
        open={viewerOpen}
        onOpenChange={(open) => {
          setViewerOpen(open)
          if (!open) setViewerMaterial(null)
        }}
      />
    </div>
  )
}

interface MaterialNodeProps {
  readonly material: Material
  readonly isSelected: boolean
  readonly onSelect: () => void
  readonly onOpen: () => void
  readonly onPositionChange: (position: { x: number; y: number }, size: { width: number; height: number }) => void
  readonly onPositionCommit: (position: { x: number; y: number }, size: { width: number; height: number }) => void
  readonly zoom: number
}

function MaterialNode({ material, isSelected, onSelect, onOpen, onPositionChange, onPositionCommit, zoom }: MaterialNodeProps) {
  const canvasMeta = (material.metadata || {}).canvas as { position?: { x: number; y: number }; size?: { width: number; height: number } } | undefined
  const initialPosition = canvasMeta?.position || material.position || { x: Math.random() * 800, y: Math.random() * 600 }
  const initialSize = canvasMeta?.size || material.size || { width: 220, height: 160 }
  const [position, setPosition] = React.useState(initialPosition)
  const [size] = React.useState(initialSize)
  const [dragging, setDragging] = React.useState(false)

  React.useEffect(() => {
    setPosition(initialPosition)
  }, [material.id])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const newPos = {
      x: position.x + (e.movementX || 0) / zoom,
      y: position.y + (e.movementY || 0) / zoom,
    }
    setPosition(newPos)
    onPositionChange(newPos, size)
  }

  const handlePointerUp = () => {
    if (dragging) {
      setDragging(false)
      onPositionCommit(position, size)
    }
  }

  return (
    <div
      className={`absolute bg-card rounded-lg shadow-md border-2 transition-all cursor-pointer hover:shadow-lg ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent"
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="p-3 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{getMaterialTypeIcon(material.material_type)}</span>
          <span className="font-medium text-sm truncate flex-1">{material.title}</span>
        </div>
        <div className="flex-1 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
          {material.material_type}
        </div>
      </div>
    </div>
  )
}

interface UserCursorProps {
  readonly cursor: CursorPosition
}

function UserCursor({ cursor }: UserCursorProps) {
  const color = generateColor(cursor.user_id)
  const userName = cursor.user?.full_name || "User"

  return (
    <div
      className="absolute pointer-events-none transition-all duration-75"
      style={{
        left: cursor.x,
        top: cursor.y,
        zIndex: 1000,
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={color}
        style={{ transform: "rotate(-15deg)" }}
      >
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-5.07h7.42c.46 0 .68-.56.35-.86L5.85 3.06c-.31-.3-.85-.08-.85.35z" />
      </svg>
      {/* User name label */}
      <div
        className="absolute left-4 top-4 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </div>
  )
}

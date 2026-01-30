"use client"

import * as React from "react"
import { useSessionStore } from "@/stores/sessionStore"
import { useAuthStore } from "@/stores/authStore"
import wsClient from "@/lib/socket/client"
import { getMaterialTypeIcon, generateColor } from "@/lib/utils"
import type { CursorPosition, Material } from "@/types"

interface WorkspaceCanvasProps {
  readonly sessionId: string
  readonly zoom: number
}

export function WorkspaceCanvas({ sessionId, zoom }: WorkspaceCanvasProps) {
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })

  const { materials, cursors, selectedMaterialIds, toggleMaterialSelection, clearSelection } = useSessionStore()
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
    </div>
  )
}

interface MaterialNodeProps {
  readonly material: Material
  readonly isSelected: boolean
  readonly onSelect: () => void
}

function MaterialNode({ material, isSelected, onSelect }: MaterialNodeProps) {
  const position = material.position || { x: Math.random() * 800, y: Math.random() * 600 }
  const size = material.size || { width: 200, height: 150 }

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

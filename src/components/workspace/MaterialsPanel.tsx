"use client"

import * as React from "react"
import { Search, FileText, Dna, FlaskConical, StickyNote, ImageIcon, MoreHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSessionStore } from "@/stores/sessionStore"
import { formatRelativeTime, getMaterialTypeColor, getStorageBucketForMaterialType } from "@/lib/utils"
import { MaterialType, type Material } from "@/types"
import apiClient from "@/lib/api/client"
import { MaterialViewerDialog } from "@/components/materials/MaterialViewerDialog"

interface MaterialsPanelProps {
  readonly sessionId: string
}

const typeIcons: Record<string, React.ReactNode> = {
  paper: <FileText className="h-4 w-4" />,
  sequence: <Dna className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  experiment: <FlaskConical className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
}

export function MaterialsPanel({ sessionId }: MaterialsPanelProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterType, setFilterType] = React.useState<MaterialType | "all">("all")
  const [viewerOpen, setViewerOpen] = React.useState(false)
  const [viewerMaterial, setViewerMaterial] = React.useState<null | Material>(null)

  const { materials, deleteMaterial } = useSessionStore()

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || m.material_type === filterType
    return matchesSearch && matchesType
  })

  const handleDelete = async (materialId: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      try {
        await apiClient.deleteMaterial(materialId)
        deleteMaterial(materialId)
      } catch (error) {
        console.error("Failed to delete material:", error)
      }
    }
  }

  const openMaterial = async (materialId: string) => {
    try {
      const material = await apiClient.getMaterial(materialId)
      if (material.file_url) {
        const bucket = getStorageBucketForMaterialType(material.material_type)
        const url = await apiClient.getPresignedDownloadUrl(bucket, material.file_url)
        setViewerMaterial({ ...material, download_url: url })
      } else {
        setViewerMaterial(material)
      }
      setViewerOpen(true)
    } catch (error) {
      console.error("Failed to open material:", error)
    }
  }

  const downloadMaterial = async (materialId: string) => {
    try {
      const material = await apiClient.getMaterial(materialId)
      if (!material.file_url) return
      const bucket = getStorageBucketForMaterialType(material.material_type)
      const url = await apiClient.getPresignedDownloadUrl(bucket, material.file_url)
      globalThis.window.open(url, "_blank")
    } catch (error) {
      console.error("Failed to download material:", error)
    }
  }

  // Group by type
  const groupedMaterials = filteredMaterials.reduce(
    (acc, m) => {
      if (!acc[m.material_type]) {
        acc[m.material_type] = []
      }
      acc[m.material_type].push(m)
      return acc
    },
    {} as Record<string, typeof materials>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            All
          </Button>
          {Object.values(MaterialType).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              className="gap-1"
            >
              {typeIcons[type]}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(groupedMaterials).map(([type, items]) => (
            <div key={type}>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                {typeIcons[type]}
                {type}s ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map((material) => (
                  <div
                    key={material.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          className="font-medium text-sm truncate text-left hover:text-primary"
                          onClick={() => openMaterial(material.id)}
                        >
                          {material.title}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(material.created_at)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openMaterial(material.id)}>
                            Open
                          </DropdownMenuItem>
                          {material.file_url && (
                            <DropdownMenuItem onClick={() => downloadMaterial(material.id)}>
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge variant="secondary" className={`mt-2 ${getMaterialTypeColor(material.material_type)}`}>
                      {material.material_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredMaterials.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No materials found</p>
            </div>
          )}
        </div>
      </ScrollArea>

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

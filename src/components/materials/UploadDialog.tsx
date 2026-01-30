"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  FileText,
  Dna,
  ImageIcon,
  FlaskConical,
  StickyNote,
  X,
  Loader2,
  File
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useSessionStore } from "@/stores/sessionStore"
import { MaterialType } from "@/types"

interface UploadDialogProps {
  readonly sessionId: string
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

const materialTypeOptions = [
  { value: MaterialType.PAPER, label: "Paper", icon: FileText, accept: ".pdf,.doc,.docx" },
  { value: MaterialType.SEQUENCE, label: "Sequence", icon: Dna, accept: ".fasta,.fa,.gb,.genbank,.txt" },
  { value: MaterialType.IMAGE, label: "Image", icon: ImageIcon, accept: ".png,.jpg,.jpeg,.tif,.tiff,.svg" },
  { value: MaterialType.EXPERIMENT, label: "Experiment", icon: FlaskConical, accept: ".csv,.json,.xlsx,.xls" },
  { value: MaterialType.NOTE, label: "Note", icon: StickyNote, accept: ".txt,.md,.markdown" },
]

const getAcceptedTypes = (materialType: MaterialType): Record<string, string[]> => {
  switch (materialType) {
    case MaterialType.PAPER:
      return {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      }
    case MaterialType.SEQUENCE:
      return {
        "text/plain": [".fasta", ".fa", ".txt"],
        "application/genbank": [".gb", ".genbank"],
      }
    case MaterialType.IMAGE:
      return {
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/tiff": [".tif", ".tiff"],
        "image/svg+xml": [".svg"],
      }
    case MaterialType.EXPERIMENT:
      return {
        "text/csv": [".csv"],
        "application/json": [".json"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      }
    case MaterialType.NOTE:
      return {
        "text/plain": [".txt"],
        "text/markdown": [".md", ".markdown"],
      }
    default:
      return {}
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export function UploadDialog({ sessionId, open, onOpenChange }: UploadDialogProps) {
  const [materialType, setMaterialType] = React.useState<MaterialType>(MaterialType.PAPER)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const { uploadMaterial } = useSessionStore()

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0]
      setFile(uploadedFile)
      // Auto-populate title from filename if empty
      if (!title) {
        const fileName = uploadedFile.name.replace(/\.[^/.]+$/, "")
        setTitle(fileName)
      }
      setError(null)
    }
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(materialType),
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDropRejected: (rejections) => {
      const rejection = rejections[0]
      if (rejection?.errors) {
        const errorMessages = rejection.errors.map((e) => e.message).join(", ")
        setError(errorMessages)
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !title.trim()) {
      setError("Please provide a file and title")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      const metadata: Record<string, unknown> = {}
      if (description) {
        metadata.description = description
      }

      await uploadMaterial(sessionId, file, materialType, title.trim(), metadata)

      // Reset form
      setFile(null)
      setTitle("")
      setDescription("")
      onOpenChange(false)
    } catch (err) {
      console.error("Upload failed:", err)
      setError("Failed to upload material. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setFile(null)
      setTitle("")
      setDescription("")
      setError(null)
      onOpenChange(false)
    }
  }

  const selectedTypeOption = materialTypeOptions.find((opt) => opt.value === materialType)
  const TypeIcon = selectedTypeOption?.icon || File

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Material
          </DialogTitle>
          <DialogDescription>
            Add a new material to your research session
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Material Type */}
          <div className="space-y-2">
            <Label>Material Type</Label>
            <Select
              value={materialType}
              onValueChange={(value) => {
                setMaterialType(value as MaterialType)
                setFile(null) // Clear file when type changes
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materialTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop Zone */}
          <div className="space-y-2">
            <Label>File</Label>
            {file ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <TypeIcon className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`
                  flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer
                  transition-colors hover:border-primary hover:bg-muted/50
                  ${isDragActive ? "border-primary bg-muted/50" : "border-muted-foreground/25"}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {isDragActive ? (
                    "Drop the file here..."
                  ) : (
                    <>
                      Drag & drop a file here, or click to select
                      <br />
                      <span className="text-xs">
                        Accepted: {selectedTypeOption?.accept}
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <Badge variant="outline" className="ml-1">Optional</Badge>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any relevant notes or context..."
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !file || !title.trim()}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

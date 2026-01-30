"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, ExternalLink } from "lucide-react"
import type { Material } from "@/types"

interface MaterialViewerDialogProps {
  readonly material: Material | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

// Helper to safely get string from metadata
const getMetaString = (metadata: Record<string, unknown>, key: string): string | undefined => {
  const value = metadata[key]
  if (typeof value === "string" && value) return value
  if (typeof value === "number") return String(value)
  return undefined
}

// Helper to safely get array from metadata
const getMetaArray = (metadata: Record<string, unknown>, key: string): string[] | undefined => {
  const value = metadata[key]
  if (Array.isArray(value)) return value.map(String)
  return undefined
}

export function MaterialViewerDialog({
  material,
  open,
  onOpenChange,
}: MaterialViewerDialogProps) {
  if (!material) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="truncate pr-4">{material.title}</DialogTitle>
          <div className="flex items-center gap-2">
            {material.download_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(material.download_url, "_blank")}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
            {material.file_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(material.file_url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <MaterialContent material={material} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface MaterialContentProps {
  readonly material: Material
}

function MaterialContent({ material }: MaterialContentProps) {
  switch (material.material_type) {
    case "paper":
      return <PaperViewer material={material} />
    case "sequence":
      return <SequenceViewer material={material} />
    case "image":
      return <ImageViewer material={material} />
    case "experiment":
      return <ExperimentViewer material={material} />
    case "note":
      return <NoteViewer material={material} />
    default:
      return (
        <div className="p-4 text-muted-foreground">
          Unknown material type: {material.material_type}
        </div>
      )
  }
}

function MetaField({ label, value }: { readonly label: string; readonly value: string | undefined }) {
  if (!value) return null
  return (
    <div>
      <h3 className="font-semibold mb-1">{label}</h3>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  )
}

function MetaLink({ label, value, baseUrl }: { 
  readonly label: string
  readonly value: string | undefined
  readonly baseUrl: string 
}) {
  if (!value) return null
  return (
    <div>
      <h3 className="font-semibold mb-1">{label}</h3>
      <a
        href={`${baseUrl}${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline"
      >
        {value}
      </a>
    </div>
  )
}

function PaperViewer({ material }: MaterialContentProps) {
  const metadata = material.metadata
  const abstract = getMetaString(metadata, "abstract")
  const authors = getMetaArray(metadata, "authors")
  const doi = getMetaString(metadata, "doi")
  const journal = getMetaString(metadata, "journal")
  const publicationDate = getMetaString(metadata, "publication_date")

  return (
    <div className="p-4 space-y-4">
      {abstract && (
        <div>
          <h3 className="font-semibold mb-2">Abstract</h3>
          <p className="text-sm text-muted-foreground">{abstract}</p>
        </div>
      )}

      {authors && authors.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Authors</h3>
          <p className="text-sm text-muted-foreground">{authors.join(", ")}</p>
        </div>
      )}

      <MetaLink label="DOI" value={doi} baseUrl="https://doi.org/" />
      <MetaField label="Journal" value={journal} />
      <MetaField label="Publication Date" value={publicationDate} />

      {material.file_url && (
        <div className="mt-4">
          <iframe
            src={material.file_url}
            className="w-full h-[60vh] rounded-lg border"
            title={material.title}
          />
        </div>
      )}
    </div>
  )
}

function SequenceViewer({ material }: MaterialContentProps) {
  const metadata = material.metadata
  const sequenceType = getMetaString(metadata, "sequence_type")
  const length = getMetaString(metadata, "length")
  const organism = getMetaString(metadata, "organism")
  const geneName = getMetaString(metadata, "gene_name")
  const uniprotId = getMetaString(metadata, "uniprot_id")
  const sequence = getMetaString(metadata, "sequence")

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {sequenceType && (
          <div>
            <h3 className="font-semibold mb-1">Type</h3>
            <p className="text-sm text-muted-foreground uppercase">{sequenceType}</p>
          </div>
        )}

        {length && (
          <div>
            <h3 className="font-semibold mb-1">Length</h3>
            <p className="text-sm text-muted-foreground">{length} bp/aa</p>
          </div>
        )}

        {organism && (
          <div>
            <h3 className="font-semibold mb-1">Organism</h3>
            <p className="text-sm text-muted-foreground italic">{organism}</p>
          </div>
        )}

        <MetaField label="Gene" value={geneName} />
        <MetaLink label="UniProt ID" value={uniprotId} baseUrl="https://www.uniprot.org/uniprotkb/" />
      </div>

      {sequence && (
        <div>
          <h3 className="font-semibold mb-2">Sequence</h3>
          <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all overflow-x-auto max-h-64 overflow-y-auto">
            {sequence}
          </div>
        </div>
      )}
    </div>
  )
}

function ImageViewer({ material }: MaterialContentProps) {
  const metadata = material.metadata
  const imageType = getMetaString(metadata, "image_type")
  const magnification = getMetaString(metadata, "magnification")
  const microscopeType = getMetaString(metadata, "microscope_type")
  
  // Get dimensions safely
  const dimensions = metadata.dimensions
  let dimensionText: string | undefined
  if (dimensions && typeof dimensions === "object" && !Array.isArray(dimensions)) {
    const dim = dimensions as { width?: number; height?: number }
    if (dim.width && dim.height) {
      dimensionText = `${dim.width} × ${dim.height}`
    }
  }

  return (
    <div className="p-4 space-y-4">
      {material.file_url && (
        <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={material.file_url}
            alt={material.title}
            className="max-w-full max-h-[50vh] object-contain rounded"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <MetaField label="Type" value={imageType} />
        <MetaField label="Dimensions" value={dimensionText} />
        <MetaField label="Magnification" value={magnification} />
        <MetaField label="Microscope" value={microscopeType} />
      </div>
    </div>
  )
}

function ExperimentViewer({ material }: MaterialContentProps) {
  const metadata = material.metadata
  const experimentType = getMetaString(metadata, "experiment_type")
  const conditions = metadata.conditions
  const outcomes = metadata.outcomes

  const hasConditions = conditions !== undefined && conditions !== null && typeof conditions === "object"
  const hasOutcomes = outcomes !== undefined && outcomes !== null && typeof outcomes === "object"

  return (
    <div className="p-4 space-y-4">
      <MetaField label="Experiment Type" value={experimentType} />

      {hasConditions ? (
        <div>
          <h3 className="font-semibold mb-2">Conditions</h3>
          <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(conditions, null, 2)}
          </pre>
        </div>
      ) : null}

      {hasOutcomes ? (
        <div>
          <h3 className="font-semibold mb-2">Outcomes</h3>
          <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(outcomes, null, 2)}
          </pre>
        </div>
      ) : null}

      {material.file_url && (
        <div className="pt-4">
          <Button asChild>
            <a href={material.file_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download Experiment Data
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

function NoteViewer({ material }: MaterialContentProps) {
  const content = getMetaString(material.metadata, "content")

  return (
    <div className="p-4">
      {content ? (
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm">{content}</div>
        </div>
      ) : (
        <p className="text-muted-foreground">No content available</p>
      )}
    </div>
  )
}

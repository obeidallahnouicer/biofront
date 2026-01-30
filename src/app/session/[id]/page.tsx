"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  Users,
  Sparkles,
  Activity,
  Settings,
  PanelRightClose,
  PanelRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  FileText,
  Dna,
  Image,
  FlaskConical,
  StickyNote,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSessionStore } from "@/stores/sessionStore"
import { useUIStore } from "@/stores/uiStore"
import { Loading } from "@/components/ui/loading"

import { WorkspaceCanvas } from "@/components/workspace/WorkspaceCanvas"
import { MaterialsPanel } from "@/components/workspace/MaterialsPanel"
import { AIPanel } from "@/components/workspace/AIPanel"
import { ParticipantsPanel } from "@/components/workspace/ParticipantsPanel"
import { ActivityPanel } from "@/components/workspace/ActivityPanel"
import { UploadDialog } from "@/components/materials/UploadDialog"
import { MaterialType } from "@/types"

export default function SessionWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [uploadType, setUploadType] = React.useState<MaterialType>(MaterialType.PAPER)

  const { currentSession, isLoading, fetchSession, clearSession } = useSessionStore()
  const {
    rightPanelOpen,
    rightPanelTab,
    canvasZoom,
    toggleRightPanel,
    setRightPanelTab,
    setCanvasZoom,
    resetCanvas,
  } = useUIStore()

  React.useEffect(() => {
    fetchSession(sessionId)
    return () => {
      clearSession()
    }
  }, [sessionId, fetchSession, clearSession])

  const handleUpload = (type: MaterialType) => {
    setUploadType(type)
    setUploadOpen(true)
  }

  if (isLoading || !currentSession) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading message="Loading session..." />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Top toolbar */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/sessions")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">{currentSession.title}</h1>
              <p className="text-xs text-muted-foreground">
                {currentSession.topic_tags.join(", ") || "No tags"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Upload buttons */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleUpload(MaterialType.PAPER)}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload Paper</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleUpload(MaterialType.SEQUENCE)}>
                    <Dna className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload Sequence</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleUpload(MaterialType.IMAGE)}>
                    <Image className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload Image</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleUpload(MaterialType.EXPERIMENT)}>
                    <FlaskConical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Experiment</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleUpload(MaterialType.NOTE)}>
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Note</TooltipContent>
              </Tooltip>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCanvasZoom(canvasZoom - 0.1)}
                disabled={canvasZoom <= 0.1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">
                {Math.round(canvasZoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCanvasZoom(canvasZoom + 0.1)}
                disabled={canvasZoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={resetCanvas}>
                <Maximize className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Panel toggle */}
            <Button variant="ghost" size="icon" onClick={toggleRightPanel}>
              {rightPanelOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRight className="h-5 w-5" />
              )}
            </Button>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas area */}
          <div className="flex-1 relative">
            <WorkspaceCanvas sessionId={sessionId} zoom={canvasZoom} />
          </div>

          {/* Right panel */}
          {rightPanelOpen && (
            <aside className="w-80 border-l bg-card flex flex-col shrink-0">
              <Tabs
                value={rightPanelTab}
                onValueChange={(v) => setRightPanelTab(v as typeof rightPanelTab)}
                className="flex flex-col h-full"
              >
                <TabsList className="grid grid-cols-4 m-2">
                  <TabsTrigger value="materials" className="gap-1">
                    <Upload className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="gap-1">
                    <Sparkles className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="gap-1">
                    <Users className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="gap-1">
                    <Activity className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="materials" className="flex-1 overflow-hidden m-0">
                  <MaterialsPanel sessionId={sessionId} />
                </TabsContent>
                <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
                  <AIPanel sessionId={sessionId} />
                </TabsContent>
                <TabsContent value="participants" className="flex-1 overflow-hidden m-0">
                  <ParticipantsPanel />
                </TabsContent>
                <TabsContent value="activity" className="flex-1 overflow-hidden m-0">
                  <ActivityPanel sessionId={sessionId} />
                </TabsContent>
              </Tabs>
            </aside>
          )}
        </div>

        {/* Upload dialog */}
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          sessionId={sessionId}
          materialType={uploadType}
        />
      </div>
    </TooltipProvider>
  )
}

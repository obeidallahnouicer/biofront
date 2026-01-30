"use client"

import * as React from "react"
import {
  Activity,
  Upload,
  Trash2,
  Edit,
  LogIn,
  LogOut,
  MessageSquare,
  FileText,
  Dna,
  ImageIcon,
  FlaskConical,
  StickyNote,
  RefreshCw,
  Loader2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import apiClient from "@/lib/api/client"
import type { SessionActivity } from "@/types"

interface ActivityPanelProps {
  readonly sessionId: string
}

const actionIcons: Record<string, React.ElementType> = {
  "material.upload": Upload,
  "material.create": Upload,
  "material.delete": Trash2,
  "material.update": Edit,
  "session.join": LogIn,
  "session.leave": LogOut,
  "note.create": StickyNote,
  "note.update": Edit,
  "comment.add": MessageSquare,
  "paper.add": FileText,
  "sequence.add": Dna,
  "image.add": ImageIcon,
  "experiment.add": FlaskConical,
}

// Generate a consistent color from user ID
const getUserColor = (userId: string): string => {
  const colors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef"
  ]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const codePoint = userId.codePointAt(i)
    if (codePoint !== undefined) {
      hash = codePoint + ((hash << 5) - hash)
    }
  }
  return colors[Math.abs(hash) % colors.length]
}

const getActionDescription = (activity: SessionActivity): string => {
  const details = activity.details || {}
  const materialTitle = typeof details.title === 'string' ? details.title : ''
  
  switch (activity.action) {
    case "material.upload":
    case "material.create":
      return materialTitle ? `uploaded "${materialTitle}"` : "uploaded a material"
    case "material.delete":
      return materialTitle ? `deleted "${materialTitle}"` : "deleted a material"
    case "material.update":
      return materialTitle ? `updated "${materialTitle}"` : "updated a material"
    case "session.join":
      return "joined the session"
    case "session.leave":
      return "left the session"
    case "note.create":
      return "created a new note"
    case "note.update":
      return "updated a note"
    case "comment.add":
      return "added a comment"
    default:
      return activity.action.replace(/\./g, " ")
  }
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ActivityPanel({ sessionId }: ActivityPanelProps) {
  const [activities, setActivities] = React.useState<SessionActivity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadActivities = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.sessions.getActivity(sessionId)
      setActivities(response.data.items || response.data)
    } catch (err) {
      console.error("Failed to load activities:", err)
      setError("Failed to load activity log")
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadActivities()
  }, [loadActivities])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-destructive mb-2">{error}</p>
        <Button variant="outline" onClick={loadActivities}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Activity</span>
          </div>
          <Button variant="ghost" size="icon" onClick={loadActivities}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm">Actions will appear here as they happen</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {activities.map((activity) => {
                  const IconComponent = actionIcons[activity.action] || Activity
                  const userName = activity.user?.full_name || "Unknown User"

                  return (
                    <div key={activity.id} className="relative flex gap-3 pl-10">
                      {/* Icon circle on timeline */}
                      <div className="absolute left-2 p-1 bg-background border rounded-full">
                        <IconComponent className="h-3 w-3 text-muted-foreground" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              className="text-[10px] text-white"
                              style={{ backgroundColor: getUserColor(activity.user_id) }}
                            >
                              {getInitials(userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{userName}</span>{" "}
                              <span className="text-muted-foreground">
                                {getActionDescription(activity)}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

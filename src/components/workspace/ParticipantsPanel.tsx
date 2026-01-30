"use client"

import * as React from "react"
import { Users, Circle } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSessionStore } from "@/stores/sessionStore"

interface ParticipantsPanelProps {
  readonly sessionId: string
}

export function ParticipantsPanel({ sessionId: _sessionId }: ParticipantsPanelProps) {
  const { participants, presenceUsers } = useSessionStore()

  // Get presence status for a participant
  const getPresenceStatus = (userId: string) => {
    return presenceUsers.find((p) => p.user_id === userId)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    if (role === "owner") {
      return "default"
    }
    if (role === "editor") {
      return "secondary"
    }
    return "outline"
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Participants</span>
          </div>
          <Badge variant="secondary">
            {presenceUsers.length} online
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No participants yet</p>
            </div>
          ) : (
            participants.map((participant) => {
              const presence = getPresenceStatus(participant.user_id)
              const isOnline = !!presence

              return (
                <div
                  key={participant.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar>
                      {participant.user?.avatar_url && (
                        <AvatarImage
                          src={participant.user.avatar_url}
                          alt={participant.user?.name || "User"}
                        />
                      )}
                      <AvatarFallback
                        style={{
                          backgroundColor: presence?.color || "#94a3b8",
                        }}
                        className="text-white"
                      >
                        {getInitials(participant.user?.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <Circle
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${
                        isOnline ? "text-green-500 fill-green-500" : "text-gray-400 fill-gray-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {participant.user?.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {participant.user?.email || ""}
                    </p>
                  </div>

                  <Badge variant={getRoleBadgeVariant(participant.role)}>
                    {participant.role}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {presenceUsers.length > 0 && (
        <div className="p-3 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Currently Active</p>
          <div className="flex flex-wrap gap-1">
            {presenceUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

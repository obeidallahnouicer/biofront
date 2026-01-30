"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, FolderOpen, MoreHorizontal, Archive, Trash2, ExternalLink, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSessionStore } from "@/stores/sessionStore"
import { useTeamStore } from "@/stores/teamStore"
import { Loading } from "@/components/ui/loading"
import { formatRelativeTime } from "@/lib/utils"

export default function SessionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTeam = searchParams.get("team")

  const [createOpen, setCreateOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [newSession, setNewSession] = React.useState({
    title: "",
    description: "",
    team_id: preselectedTeam || "",
    topic_tags: [] as string[],
  })
  const [tagInput, setTagInput] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const { sessions, isLoading, fetchSessions, createSession, archiveSession, deleteSession } = useSessionStore()
  const { teams, fetchTeams } = useTeamStore()

  React.useEffect(() => {
    fetchSessions()
    fetchTeams()
  }, [fetchSessions, fetchTeams])

  React.useEffect(() => {
    if (preselectedTeam) {
      setNewSession((prev) => ({ ...prev, team_id: preselectedTeam }))
    }
  }, [preselectedTeam])

  const handleCreateSession = async () => {
    if (!newSession.title.trim() || !newSession.team_id) return

    setIsCreating(true)
    try {
      const session = await createSession({
        team_id: newSession.team_id,
        title: newSession.title,
        description: newSession.description || undefined,
        topic_tags: newSession.topic_tags,
      })
      setCreateOpen(false)
      setNewSession({ title: "", description: "", team_id: "", topic_tags: [] })
      router.push(`/session/${session.id}`)
    } catch (error) {
      console.error("Failed to create session:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !newSession.topic_tags.includes(tagInput.trim())) {
      setNewSession((prev) => ({
        ...prev,
        topic_tags: [...prev.topic_tags, tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setNewSession((prev) => ({
      ...prev,
      topic_tags: prev.topic_tags.filter((t) => t !== tag),
    }))
  }

  const handleArchive = async (sessionId: string) => {
    await archiveSession(sessionId)
  }

  const handleDelete = async (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      await deleteSession(sessionId)
    }
  }

  const activeSessions = sessions.filter((s) => !s.is_archived)
  const archivedSessions = sessions.filter((s) => s.is_archived)

  const filteredActive = activeSessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredArchived = archivedSessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading && sessions.length === 0) {
    return <Loading message="Loading sessions..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">
            Your collaborative research workspaces
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Start a new research workspace for your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={newSession.team_id}
                  onValueChange={(v) => setNewSession((prev) => ({ ...prev, team_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., CRISPR Gene Editing Study"
                  value={newSession.title}
                  onChange={(e) =>
                    setNewSession((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your research session"
                  value={newSession.description}
                  onChange={(e) =>
                    setNewSession((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {newSession.topic_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={isCreating || !newSession.title.trim() || !newSession.team_id}
              >
                {isCreating ? "Creating..." : "Create Session"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {filteredActive.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No active sessions</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first session to start collaborating
                </p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActive.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onArchive={() => handleArchive(session.id)}
                  onDelete={() => handleDelete(session.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          {filteredArchived.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No archived sessions</h3>
                <p className="text-muted-foreground">
                  Archived sessions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredArchived.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onArchive={() => handleArchive(session.id)}
                  onDelete={() => handleDelete(session.id)}
                  isArchived
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface SessionCardProps {
  readonly session: {
    id: string
    title: string
    description?: string
    topic_tags: string[]
    updated_at: string
    team?: { name: string }
  }
  readonly onArchive: () => void
  readonly onDelete: () => void
  readonly isArchived?: boolean
}

function SessionCard({ session, onArchive, onDelete, isArchived }: SessionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/session/${session.id}`}>
            <CardTitle className="hover:text-primary cursor-pointer text-lg">
              {session.title}
            </CardTitle>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/session/${session.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="mr-2 h-4 w-4" />
                {isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">
          {session.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-3">
          {session.topic_tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {session.topic_tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{session.topic_tags.length - 3}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{session.team?.name || "Unknown team"}</span>
          <span>{formatRelativeTime(session.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Users, MoreHorizontal, Trash2, Edit, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTeamStore } from "@/stores/teamStore"
import { Loading } from "@/components/ui/loading"
import { useSearchParams } from "next/navigation"

export default function TeamsPage() {
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [newTeamName, setNewTeamName] = React.useState("")
  const [newTeamDescription, setNewTeamDescription] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const { teams, isLoading, fetchTeams, createTeam, deleteTeam } = useTeamStore()

  React.useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  React.useEffect(() => {
    if (searchParams.get("create") === "true") {
      setCreateOpen(true)
    }
  }, [searchParams])

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return

    setIsCreating(true)
    try {
      await createTeam({
        name: newTeamName,
        description: newTeamDescription || undefined,
      })
      setCreateOpen(false)
      setNewTeamName("")
      setNewTeamDescription("")
    } catch (error) {
      console.error("Failed to create team:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm("Are you sure you want to delete this team?")) {
      await deleteTeam(teamId)
    }
  }

  if (isLoading && teams.length === 0) {
    return <Loading message="Loading teams..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Manage your research teams and collaborators
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new team to organize your research collaborators
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Protein Engineering Lab"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your team"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam} disabled={isCreating || !newTeamName.trim()}>
                {isCreating ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No teams yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first team to start collaborating
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Link href={`/dashboard/teams/${team.id}`}>
                    <CardTitle className="hover:text-primary cursor-pointer">
                      {team.name}
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
                        <Link href={`/dashboard/teams/${team.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/teams/${team.id}?invite=true`}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Invite Members
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  {team.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{team.member_count ?? "—"} members</span>
                  <span className="capitalize">{team.role || "member"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
